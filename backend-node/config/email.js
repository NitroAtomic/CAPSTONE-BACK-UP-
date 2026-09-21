// config/email.js
// IamAtomic — Group 4 Capstone 2, SE-AWARE backend
//
// Nagpapadala ng totoong email kung naka-set up na yung SMTP sa .env. Kung
// wala pa (bagong clone lang, walang mail account), console na lang lalabas
// yung code — para testable pa rin agad kahit walang setup, parang yung
// backend-config.js sa frontend na fallback din pag walang API URL na naka-set.

const nodemailer = require('nodemailer');
const config = require('./env');

function smtpConfigured() {
  return !!(config.smtp.host && config.smtp.user && config.smtp.pass);
}

let transporter = null;
if (smtpConfigured()) {
  transporter = nodemailer.createTransport({
    host: config.smtp.host,
    port: config.smtp.port,
    secure: false,
    auth: { user: config.smtp.user, pass: config.smtp.pass },
  });
}

async function sendOtpEmail(toEmail, code, purpose) {
  purpose = purpose || 'login';
  const isReset = purpose === 'password_reset';

  const subject = isReset
    ? 'Your SE-AWARE password reset code'
    : 'Your SE-AWARE verification code';
  const intro = isReset
    ? 'Use this code to reset your password'
    : 'Your verification code is';

  if (!transporter) {
    // Walang SMTP pa, kaya console na lang muna.
    console.log(`\n[email] SMTP not configured. ${isReset ? 'PASSWORD RESET' : 'OTP'} for ${toEmail}: ${code}\n`);
    return { delivered: false, mode: 'console' };
  }

  await transporter.sendMail({
    from: config.smtp.from || config.smtp.user,
    to: toEmail,
    subject: subject,
    text: `${intro} ${code}. It expires in 5 minutes. If you didn't request this, you can ignore this email.`,
    html: `<p>${intro} <strong style="font-size:1.2em;letter-spacing:2px;">${code}</strong>.</p>
           <p>It expires in 5 minutes. If you didn't request this, you can ignore this email.</p>`,
  });
  return { delivered: true, mode: 'smtp' };
}

module.exports = { sendOtpEmail, smtpConfigured };
