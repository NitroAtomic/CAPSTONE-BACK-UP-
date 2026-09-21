// middleware/auth.js
// IamAtomic — Group 4 Capstone 2, SE-AWARE backend
const jwt = require('jsonwebtoken');

// Galing sa config/env.js, na ayaw mag-start sa production kung wala o
// mahina yung JWT_SECRET. Kung nakuha to ng iba, pwede na sila mag-forge ng
// token kahit anong account, pati admin.
const JWT_SECRET = require('../config/env').jwtSecret;

// Tinitignan kung valid yung token, ilalagay sa req.user = { user_id, role }
function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Not logged in.' });
  }
  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload; // { user_id, role }
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired session. Please log in again.' });
  }
}

// Pareho ng requireAuth, pero kailangan din role === 'admin' (FR-17/18/19)
function requireAdmin(req, res, next) {
  requireAuth(req, res, () => {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required.' });
    }
    next();
  });
}

// Ilalagay yung req.user kung may valid token, pero hindi hinaharang yung
// request kung wala. Gamit sa mga endpoint na iba behavior depende kung
// naka-login o hindi (hal. Free vs Premium module content).
function optionalAuth(req, res, next) {
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) {
    try {
      req.user = jwt.verify(header.slice(7), JWT_SECRET);
    } catch (err) {
      // invalid token pero optional lang naman, treat as guest na lang
    }
  }
  next();
}

module.exports = { requireAuth, requireAdmin, optionalAuth, JWT_SECRET };
