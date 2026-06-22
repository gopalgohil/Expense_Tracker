import nodemailer from 'nodemailer';

/**
 * Parses "Display Name <email@domain.com>" into { name, email }
 * Also handles plain "email@domain.com" format.
 */
const parseFrom = (from) => {
  if (!from) return { name: 'Spendwise Support', email: 'onboarding@resend.dev' };
  const match = from.match(/^(.*?)\s*<(.+?)>$/);
  if (match) return { name: match[1].trim() || 'Spendwise Support', email: match[2].trim() };
  return { name: 'Spendwise Support', email: from.trim() };
};

export const sendEmail = async ({ to, subject, html }) => {
  const smtpFrom = process.env.SMTP_FROM || 'Spendwise Support <onboarding@resend.dev>';
  const { name: senderName, email: senderEmail } = parseFrom(smtpFrom);

  // ─── Option 1: Brevo HTTP API (Recommended — 300 emails/day free, any recipient) ───
  if (process.env.BREVO_API_KEY) {
    console.log(`[sendEmail] Using Brevo... from="${senderEmail}" to="${to}"`);
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': process.env.BREVO_API_KEY,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        sender: { name: senderName, email: senderEmail },
        to: [{ email: to }],
        subject,
        htmlContent: html,
      }),
    });

    const data = await response.json();
    console.log(`[sendEmail] Brevo response status=${response.status}`, JSON.stringify(data));
    if (!response.ok) {
      throw new Error(data.message || `Brevo API Error: ${response.status} ${response.statusText}`);
    }
    console.log('[sendEmail] Brevo email sent successfully, messageId=', data.messageId);
    return data;
  }

  // ─── Option 2: Resend HTTP API (Free tier: only sends to your own registered email unless domain is verified) ───
  if (process.env.RESEND_API_KEY) {
    const fromAddr = smtpFrom;
    console.log(`[sendEmail] Using Resend... from="${fromAddr}" to="${to}"`);
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: fromAddr,
        to: [to],
        subject,
        html,
      }),
    });

    const data = await response.json();
    console.log(`[sendEmail] Resend response status=${response.status}`, JSON.stringify(data));
    if (!response.ok) {
      throw new Error(data.message || `Resend API Error: ${response.status} ${response.statusText}`);
    }
    console.log('[sendEmail] Resend email sent successfully, id=', data.id);
    return data;
  }

  // ─── Option 3: Standard SMTP via Nodemailer (blocked on Render free tier) ───
  const hasSMTP = process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS;

  if (hasSMTP) {
    console.log('[sendEmail] Using SMTP Transporter...');
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      tls: { rejectUnauthorized: false },
      family: 4,
    });

    const info = await transporter.sendMail({
      from: `"${senderName}" <${senderEmail}>`,
      to,
      subject,
      html,
    });
    return info;
  }

  // ─── Fallback: Ethereal (local dev preview only) ───
  console.warn('[sendEmail] No email provider configured. Using Ethereal preview (dev only)...');
  try {
    const testAccount = await nodemailer.createTestAccount();
    const transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: { user: testAccount.user, pass: testAccount.pass },
    });
    const info = await transporter.sendMail({ from: `"${senderName}" <${senderEmail}>`, to, subject, html });
    const previewUrl = nodemailer.getTestMessageUrl(info);
    console.log('\n==================================================');
    console.log('📬 EMAIL PREVIEW (Dev/Ethereal Mode)');
    console.log(`To:      ${to}`);
    console.log(`Subject: ${subject}`);
    if (previewUrl) console.log(`🔗 Preview URL: ${previewUrl}`);
    console.log('==================================================\n');
    return info;
  } catch (err) {
    throw new Error('No email provider configured and Ethereal fallback failed: ' + err.message);
  }
};
