// middleware/rateLimit.js
// IamAtomic — Group 4 Capstone 2, SE-AWARE backend
//
// Kung wala to, pwedeng subukan-subukan ng iba yung password sa login kasing
// bilis ng network. Bagal ng bcrypt sa pag-verify kada guess, pero hindi
// niya pinipigilan yung paulit-ulit na pagsubok.
//
// Per IP address yung limit, at sadyang mataas para hindi maapektuhan yung
// taong nagkamali lang ng ilang beses sa sariling password.

const rateLimit = require('express-rate-limit');

// Login, register, reset password — sila yung sulit i-guess kaya mas mahigpit.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many attempts from this address. Please wait a few minutes and try again.' },
});

// Mas mahigpit pa ito sa OTP verify, kasi 6-digit lang naman yung code at
// meron nang sariling attempt counter sa row.
const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many verification attempts. Please request a new code.' },
});

// Chat. Bukas sya sa lahat kahit walang account, at bawat tanong ay tawag sa
// AI na may sariling limit, kaya kailangan may sariling hadlang. Hindi
// masyadong mahigpit kasi iisa lang yung IP address ng buong school wifi:
// apat na tester na magkasabay, iisa lang sila sa paningin nito.
const chatLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'You have sent a lot of messages in a short time. Please wait a few minutes before asking CyberWise again.' },
});

// Yung iba pang endpoints, para walang isang client na mag-flood sa API.
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please slow down.' },
});

module.exports = { authLimiter, otpLimiter, chatLimiter, generalLimiter };
