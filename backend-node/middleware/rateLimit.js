// middleware/rateLimit.js
// Backend and integration: IamAtomic
//
// Without this, someone could try passwords against the login endpoint as
// fast as the network allows. bcrypt makes each guess slow to verify, but it
// does nothing to stop the attempt being made thousands of times.
//
// The limits are per IP address and deliberately generous enough that a real
// person mistyping their password a few times is never affected.

const rateLimit = require('express-rate-limit');

// Sign in, register, and password reset: the endpoints worth guessing at.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many attempts from this address. Please wait a few minutes and try again.' },
});

// Verifying a one time code is stricter, since the code is only six digits
// and the account row already tracks its own attempt count.
const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many verification attempts. Please request a new code.' },
});

// Everything else, to keep one client from flooding the API.
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please slow down.' },
});

module.exports = { authLimiter, otpLimiter, generalLimiter };
