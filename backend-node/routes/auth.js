// routes/auth.js
// Backend and integration: IamAtomic
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const { requireAuth, JWT_SECRET } = require('../middleware/auth');
const { sendOtpEmail } = require('../config/email');

const router = express.Router();
const SALT_ROUNDS = 10;
const OTP_TTL_MINUTES = 5;
const OTP_MAX_ATTEMPTS = 5;

function generateOtpCode() {
  return String(Math.floor(100000 + Math.random() * 900000)); // 6 digits
}

async function issueOtp(user, purpose) {
  purpose = purpose || 'login';
  const code = generateOtpCode();
  const codeHash = await bcrypt.hash(code, SALT_ROUNDS);
  const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);

  await pool.query(
    'INSERT INTO otpcode (user_id, code_hash, purpose, expires_at) VALUES (?, ?, ?, ?)',
    [user.user_id, codeHash, purpose, expiresAt]
  );
  await sendOtpEmail(user.email, code, purpose);
}

// FR-09: Registration
router.post('/register', async (req, res) => {
  const { first_name, last_name, email, password, subscription_type } = req.body;

  if (!first_name || !email || !password) {
    return res.status(400).json({ error: 'first_name, email, and password are required.' });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters.' });
  }
  const plan = subscription_type === 'Premium' ? 'Premium' : 'Free';

  try {
    const [existing] = await pool.query('SELECT user_id FROM user WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(409).json({ error: 'An account with that email already exists.' });
    }

    const password_hash = await bcrypt.hash(password, SALT_ROUNDS);
    const [result] = await pool.query(
      'INSERT INTO user (first_name, last_name, email, password_hash, subscription_type, subscription_status) VALUES (?, ?, ?, ?, ?, ?)',
      [first_name, last_name || null, email, password_hash, plan, 'active']
    );

    const token = jwt.sign({ user_id: result.insertId, role: 'user' }, JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({
      token,
      user: { user_id: result.insertId, first_name, email, subscription_type: plan, role: 'user' },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Registration failed.' });
  }
});

// FR-09: Login
// FR-20: Premium accounts require a second factor (emailed OTP) before a
// real session is issued. Free accounts log in the same single step as
// before -- this asymmetry is intentional, part of what differentiates
// the Premium tier's account security, not an oversight.
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  try {
    const [rows] = await pool.query('SELECT * FROM user WHERE email = ?', [email]);
    if (rows.length === 0) {
      return res.status(401).json({ error: 'Incorrect email or password.' });
    }
    const user = rows[0];
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ error: 'Incorrect email or password.' });
    }

    if (user.subscription_type === 'Premium') {
      await issueOtp(user);
      const pendingToken = jwt.sign(
        { user_id: user.user_id, otp_pending: true },
        JWT_SECRET,
        { expiresIn: `${OTP_TTL_MINUTES}m` }
      );
      return res.json({
        requiresOtp: true,
        pendingToken,
        email: user.email,
        expiresInMinutes: OTP_TTL_MINUTES,
      });
    }

    const token = jwt.sign({ user_id: user.user_id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.json({
      token,
      user: {
        user_id: user.user_id,
        first_name: user.first_name,
        email: user.email,
        subscription_type: user.subscription_type,
        subscription_status: user.subscription_status,
        role: user.role,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Login failed.' });
  }
});

// FR-20: Step 2 of Premium login -- verify the emailed code and, only
// then, issue the real session token.
router.post('/verify-otp', async (req, res) => {
  const { pendingToken, code } = req.body;
  if (!pendingToken || !code) {
    return res.status(400).json({ error: 'pendingToken and code are required.' });
  }

  let payload;
  try {
    payload = jwt.verify(pendingToken, JWT_SECRET);
  } catch (err) {
    return res.status(401).json({ error: 'This verification session expired. Please log in again.' });
  }
  if (!payload.otp_pending) {
    return res.status(400).json({ error: 'Invalid verification session.' });
  }

  try {
    const [otpRows] = await pool.query(
      'SELECT * FROM otpcode WHERE user_id = ? AND purpose = "login" AND used = 0 ORDER BY otp_id DESC LIMIT 1',
      [payload.user_id]
    );
    if (otpRows.length === 0) {
      return res.status(400).json({ error: 'No pending code found. Please log in again.' });
    }
    const otp = otpRows[0];

    if (new Date(otp.expires_at) < new Date()) {
      return res.status(400).json({ error: 'This code has expired. Please log in again to get a new one.' });
    }
    if (otp.attempts >= OTP_MAX_ATTEMPTS) {
      return res.status(429).json({ error: 'Too many incorrect attempts. Please log in again to get a new code.' });
    }

    const match = await bcrypt.compare(code, otp.code_hash);
    if (!match) {
      await pool.query('UPDATE otpcode SET attempts = attempts + 1 WHERE otp_id = ?', [otp.otp_id]);
      return res.status(401).json({ error: 'Incorrect code. Please try again.' });
    }

    await pool.query('UPDATE otpcode SET used = 1 WHERE otp_id = ?', [otp.otp_id]);

    const [userRows] = await pool.query('SELECT * FROM user WHERE user_id = ?', [payload.user_id]);
    const user = userRows[0];
    const token = jwt.sign({ user_id: user.user_id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      token,
      user: {
        user_id: user.user_id,
        first_name: user.first_name,
        email: user.email,
        subscription_type: user.subscription_type,
        subscription_status: user.subscription_status,
        role: user.role,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Verification failed.' });
  }
});

// FR-20: Resend the OTP if the first email didn't arrive.
router.post('/resend-otp', async (req, res) => {
  const { pendingToken } = req.body;
  if (!pendingToken) return res.status(400).json({ error: 'pendingToken is required.' });

  let payload;
  try {
    payload = jwt.verify(pendingToken, JWT_SECRET);
  } catch (err) {
    return res.status(401).json({ error: 'This verification session expired. Please log in again.' });
  }
  if (!payload.otp_pending) return res.status(400).json({ error: 'Invalid verification session.' });

  try {
    const [userRows] = await pool.query('SELECT * FROM user WHERE user_id = ?', [payload.user_id]);
    if (userRows.length === 0) return res.status(404).json({ error: 'Account not found.' });
    await issueOtp(userRows[0]);
    res.json({ message: 'A new code has been sent.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to resend code.' });
  }
});

// FR-09: Logout. Stateless JWT, so "logout" is just the client discarding
// the token. This endpoint exists for a consistent API shape and so the
// frontend has a single place to call regardless of backend implementation.
router.post('/logout', requireAuth, (req, res) => {
  res.json({ message: 'Logged out.' });
});

// FR-10: Subscription/account management (high-level plan state only -
// no pricing or payment processing, as specified in the requirement).
router.get('/me', requireAuth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT user_id, first_name, last_name, email, subscription_type, subscription_status, role, created_at FROM user WHERE user_id = ?',
      [req.user.user_id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'User not found.' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load account.' });
  }
});

router.patch('/me/subscription', requireAuth, async (req, res) => {
  const { subscription_type } = req.body;
  if (!['Free', 'Premium'].includes(subscription_type)) {
    return res.status(400).json({ error: 'subscription_type must be Free or Premium.' });
  }
  try {
    await pool.query('UPDATE user SET subscription_type = ? WHERE user_id = ?', [subscription_type, req.user.user_id]);
    res.json({ message: 'Plan updated.', subscription_type });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update plan.' });
  }
});

// ============================================================
// PASSWORD RESET
// Two steps: request a code by email, then submit code + new password.
// ============================================================

// Step 1: request a reset code.
// Always returns the same success response whether or not the email exists.
// This is deliberate -- responding differently would let an attacker probe
// which email addresses have accounts on the platform.
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required.' });

  try {
    const [rows] = await pool.query('SELECT * FROM user WHERE email = ?', [email]);
    if (rows.length > 0) {
      await issueOtp(rows[0], 'password_reset');
    }
    res.json({
      message: 'If an account exists for that email, a reset code has been sent.',
      expiresInMinutes: OTP_TTL_MINUTES,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not process that request.' });
  }
});

// Step 2: submit the code plus the new password.
router.post('/reset-password', async (req, res) => {
  const { email, code, newPassword } = req.body;
  if (!email || !code || !newPassword) {
    return res.status(400).json({ error: 'Email, code, and new password are required.' });
  }
  if (newPassword.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters.' });
  }

  try {
    const [userRows] = await pool.query('SELECT * FROM user WHERE email = ?', [email]);
    if (userRows.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired reset code.' });
    }
    const user = userRows[0];

    const [otpRows] = await pool.query(
      'SELECT * FROM otpcode WHERE user_id = ? AND purpose = "password_reset" AND used = 0 ORDER BY otp_id DESC LIMIT 1',
      [user.user_id]
    );
    if (otpRows.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired reset code.' });
    }
    const otp = otpRows[0];

    if (new Date(otp.expires_at) < new Date()) {
      return res.status(400).json({ error: 'This reset code has expired. Please request a new one.' });
    }
    if (otp.attempts >= OTP_MAX_ATTEMPTS) {
      return res.status(429).json({ error: 'Too many incorrect attempts. Please request a new code.' });
    }

    const match = await bcrypt.compare(code, otp.code_hash);
    if (!match) {
      await pool.query('UPDATE otpcode SET attempts = attempts + 1 WHERE otp_id = ?', [otp.otp_id]);
      return res.status(401).json({ error: 'Incorrect code. Please try again.' });
    }

    const newHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await pool.query('UPDATE user SET password_hash = ? WHERE user_id = ?', [newHash, user.user_id]);
    await pool.query('UPDATE otpcode SET used = 1 WHERE otp_id = ?', [otp.otp_id]);

    // Invalidate any other outstanding codes for this account, so an old
    // unused code can't be replayed after the password already changed.
    await pool.query(
      'UPDATE otpcode SET used = 1 WHERE user_id = ? AND used = 0',
      [user.user_id]
    );

    res.json({ message: 'Password updated. You can now log in with your new password.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not reset the password.' });
  }
});

module.exports = router;
