/**
 * Email delivery for auth emails (password reset).
 *
 * If SMTP_EMAIL/SMTP_PASSWORD env vars are set, sends via Gmail SMTP using
 * nodemailer. Otherwise returns false and the route falls back to logging
 * the link (dev mode) so the flow is fully testable without SMTP.
 */
let nodemailer = null;
try { nodemailer = require('nodemailer'); } catch { /* optional dep */ }

const smtpConfigured = Boolean(process.env.SMTP_EMAIL && process.env.SMTP_PASSWORD);

const sendMail = async ({ to, subject, text, html }) => {
  if (!smtpConfigured || !nodemailer) return false;

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.SMTP_EMAIL, pass: process.env.SMTP_PASSWORD },
  });

  try {
    await transporter.sendMail({ from: `FoodBridge <${process.env.SMTP_EMAIL}>`, to, subject, text, html });
    return true;
  } catch (err) {
    console.error('[mailer] send failed:', err.message);
    return false;
  }
};

module.exports = { sendMail, smtpConfigured };
