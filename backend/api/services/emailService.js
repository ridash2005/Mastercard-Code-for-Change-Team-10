// Real email delivery via Resend's REST API (https://resend.com/docs/api-reference/emails/send-email).
// No SDK dependency - a single fetch call, matching this backend's plain
// style. Used today only by authService.js's forgotPassword flow.

const config = require('../config');

class EmailError extends Error {
  constructor(message, cause) {
    super(message);
    this.name = 'EmailError';
    this.cause = cause;
  }
}

/** @returns {boolean} whether real sending is configured. When false,
 * callers should surface the content directly instead (dev-mode fallback -
 * see authService.js's forgotPassword). */
function isEmailConfigured() {
  return Boolean(config.resendApiKey);
}

/**
 * @param {{ to: string, subject: string, html: string, text?: string }} message
 */
async function sendEmail({ to, subject, html, text }) {
  if (!config.resendApiKey) {
    throw new EmailError('RESEND_API_KEY is not configured');
  }

  let res;
  try {
    res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.resendApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: config.resendFromEmail,
        to: [to],
        subject,
        html,
        text: text || undefined
      })
    });
  } catch (err) {
    throw new EmailError('Resend API is unreachable', err);
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new EmailError(`Resend rejected the email: ${body.message || res.statusText}`, body);
  }

  return res.json();
}

async function sendPasswordResetEmail(to, name, resetUrl) {
  return sendEmail({
    to,
    subject: 'Reset your Katalyst password',
    html: `
      <p>Hi ${name || 'there'},</p>
      <p>Someone requested a password reset for your Katalyst account. If this was you, click below to
      choose a new password. This link expires in 1 hour.</p>
      <p><a href="${resetUrl}">Reset your password</a></p>
      <p>If you didn't request this, you can safely ignore this email - your password won't change.</p>
    `,
    text: `Reset your Katalyst password: ${resetUrl} (expires in 1 hour). If you didn't request this, ignore this email.`
  });
}

module.exports = { sendEmail, sendPasswordResetEmail, isEmailConfigured, EmailError };
