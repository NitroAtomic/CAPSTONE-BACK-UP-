// config/email.js
// Backend and integration: IamAtomic
//
// Sends the OTP by real email when SMTP credentials are set in .env.
// Without them (e.g. right after cloning this repo, before anyone has set
// up a mail account), it falls back to logging the code to the server
// console instead -- so the OTP flow is fully testable with zero setup,
// the same graceful-fallback pattern used elsewhere in this project
// (js/backend-config.js on the frontend does the same thing for the API URL).

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
    // Dev/demo fallback -- no real SMTP set up yet.
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
