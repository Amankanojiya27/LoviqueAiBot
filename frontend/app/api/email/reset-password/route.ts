import nodemailer from 'nodemailer';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

interface ResetEmailPayload {
  secret?: unknown;
  to?: unknown;
  name?: unknown;
  resetUrl?: unknown;
}

const getEnvValue = (value: string | undefined): string => value?.trim() ?? '';
const getPortValue = (value: string | undefined, fallback: number): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const escapeHtml = (value: string): string => {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};

const buildTextEmail = (name: string, resetUrl: string): string => {
  return [
    `Hi ${name},`,
    '',
    'We received a request to reset your Lovique password.',
    'Use the link below to choose a new password:',
    resetUrl,
    '',
    'If you did not request this, you can ignore this email.',
    '',
    'Lovique',
  ].join('\n');
};

const buildHtmlEmail = (name: string, resetUrl: string): string => {
  const safeName = escapeHtml(name);
  const safeResetUrl = escapeHtml(resetUrl);

  return `
    <div style="background:#110f18;padding:32px 16px;font-family:Arial,sans-serif;color:#f7f3ee;">
      <div style="max-width:560px;margin:0 auto;background:#181420;border:1px solid rgba(255,255,255,0.08);border-radius:24px;padding:32px;">
        <p style="margin:0 0 12px;font-size:12px;letter-spacing:0.28em;text-transform:uppercase;color:#82cadc;">
          Lovique
        </p>
        <h1 style="margin:0 0 16px;font-size:28px;line-height:1.15;color:#ffffff;">
          Reset your password
        </h1>
        <p style="margin:0 0 16px;font-size:16px;line-height:1.7;color:#d7d1cd;">
          Hi ${safeName}, we received a request to reset your Lovique password.
        </p>
        <p style="margin:0 0 24px;font-size:16px;line-height:1.7;color:#d7d1cd;">
          Use the button below to choose a new password and get back into your account.
        </p>
        <a
          href="${safeResetUrl}"
          style="display:inline-block;border-radius:999px;padding:14px 22px;background:linear-gradient(135deg,#ff8e72,#ffbe7a);color:#24171a;font-weight:700;text-decoration:none;"
        >
          Reset password
        </a>
        <p style="margin:24px 0 0;font-size:14px;line-height:1.7;color:#b8b0ab;">
          If the button does not work, copy and paste this link into your browser:
        </p>
        <p style="margin:8px 0 0;font-size:14px;line-height:1.7;word-break:break-word;color:#82cadc;">
          ${safeResetUrl}
        </p>
        <p style="margin:24px 0 0;font-size:14px;line-height:1.7;color:#b8b0ab;">
          If you did not request this, you can safely ignore this email.
        </p>
      </div>
    </div>
  `;
};

export async function POST(request: NextRequest) {
  const secret = getEnvValue(process.env.PASSWORD_RESET_EMAIL_SECRET);
  const smtpHost = getEnvValue(process.env.SMTP_HOST);
  const smtpPort = getPortValue(process.env.SMTP_PORT, 465);
  const smtpUser = getEnvValue(process.env.SMTP_USER) || getEnvValue(process.env.MAILER_GMAIL_USER);
  const smtpPass =
    getEnvValue(process.env.SMTP_PASS) || getEnvValue(process.env.MAILER_GMAIL_APP_PASSWORD);
  const fromEmail = getEnvValue(process.env.MAILER_FROM_EMAIL) || smtpUser;
  const fromName = getEnvValue(process.env.MAILER_FROM_NAME) || 'Lovique';
  const secure =
    getEnvValue(process.env.SMTP_SECURE) === 'false' ? false : smtpPort === 465;

  if (!secret || !smtpHost || !smtpUser || !smtpPass || !fromEmail) {
    return NextResponse.json(
      {
        success: false,
        message: 'Password reset email service is not configured.',
      },
      { status: 503 },
    );
  }

  let payload: ResetEmailPayload;

  try {
    payload = (await request.json()) as ResetEmailPayload;
  } catch {
    return NextResponse.json(
      {
        success: false,
        message: 'Invalid email request payload.',
      },
      { status: 400 },
    );
  }

  if (payload.secret !== secret) {
    return NextResponse.json(
      {
        success: false,
        message: 'Unauthorized email request.',
      },
      { status: 401 },
    );
  }

  const to = typeof payload.to === 'string' ? payload.to.trim() : '';
  const name = typeof payload.name === 'string' ? payload.name.trim() : 'there';
  const resetUrl = typeof payload.resetUrl === 'string' ? payload.resetUrl.trim() : '';

  if (!to || !resetUrl) {
    return NextResponse.json(
      {
        success: false,
        message: 'Missing password reset email details.',
      },
      { status: 400 },
    );
  }

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  });

  await transporter.sendMail({
    from: `"${fromName}" <${fromEmail}>`,
    to,
    subject: 'Reset your Lovique password',
    text: buildTextEmail(name || 'there', resetUrl),
    html: buildHtmlEmail(name || 'there', resetUrl),
  });

  return NextResponse.json({
    success: true,
    message: 'Password reset email sent.',
  });
}
