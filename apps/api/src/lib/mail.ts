/**
 * Transactional email via Resend.
 * - Production: set RESEND_API_KEY (+ optional MAIL_FROM)
 * - Development: logs links to the API console when Resend is not configured
 */

type SendVerifyEmailOptions = {
  to: string;
  verifyUrl: string;
};

export async function sendEmailVerificationEmail(
  options: SendVerifyEmailOptions,
): Promise<void> {
  const { to, verifyUrl } = options;
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from =
    process.env.MAIL_FROM?.trim() ?? "PanChat <onboarding@resend.dev>";

  if (!apiKey) {
    console.info(
      "[PanChat] Verify email (no RESEND_API_KEY — dev mode)\n" +
        `  To: ${to}\n` +
        `  Link: ${verifyUrl}\n` +
        "  Expires in 24 hours.",
    );
    return;
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject: "Verify your PanChat email",
      html: `
        <p>Thanks for signing up for PanChat.</p>
        <p><a href="${verifyUrl}">Verify your email</a></p>
        <p>This link expires in 24 hours.</p>
      `,
      text: `Verify your PanChat email: ${verifyUrl}\n\nExpires in 24 hours.`,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Failed to send email (${res.status}): ${body}`);
  }
}

type SendResetEmailOptions = {
  to: string;
  resetUrl: string;
};

export async function sendPasswordResetEmail(
  options: SendResetEmailOptions,
): Promise<void> {
  const { to, resetUrl } = options;
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from =
    process.env.MAIL_FROM?.trim() ?? "PanChat <onboarding@resend.dev>";

  if (!apiKey) {
    console.info(
      "[PanChat] Password reset (no RESEND_API_KEY — dev mode)\n" +
        `  To: ${to}\n` +
        `  Link: ${resetUrl}\n` +
        "  Expires in 1 hour. Set RESEND_API_KEY in .env to send real email.",
    );
    return;
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject: "Reset your PanChat password",
      html: `
        <p>You requested a password reset for PanChat.</p>
        <p><a href="${resetUrl}">Reset your password</a></p>
        <p>This link expires in 1 hour. If you did not request this, ignore this email.</p>
      `,
      text: `Reset your PanChat password: ${resetUrl}\n\nExpires in 1 hour.`,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Failed to send email (${res.status}): ${body}`);
  }
}

/** Alert the account owner after a password change (reset or settings). */
export async function sendPasswordChangedEmail(to: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from =
    process.env.MAIL_FROM?.trim() ?? "PanChat <onboarding@resend.dev>";

  if (!apiKey) {
    console.info(
      `[PanChat] Password changed for ${to} — no RESEND_API_KEY; skipped alert email.`,
    );
    return;
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject: "Your PanChat password was changed",
      html: `
        <p>Your PanChat password was just changed.</p>
        <p>If this was not you, contact support immediately and try signing in to secure your account.</p>
      `,
      text: "Your PanChat password was just changed. If this was not you, secure your account immediately.",
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Failed to send alert email (${res.status}): ${body}`);
  }
}
