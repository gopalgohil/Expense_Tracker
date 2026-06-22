import nodemailer from 'nodemailer';

export const sendEmail = async ({ to, subject, html }) => {
  // Option 1: Resend HTTP API (Port 443 - works on Render Free Tier)
  if (process.env.RESEND_API_KEY) {
    const fromAddr = process.env.SMTP_FROM || 'Spendwise Support <onboarding@resend.dev>';
    console.log(`[sendEmail] Using Resend HTTP API... from="${fromAddr}" to="${to}"`);
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

  // Option 2: Brevo HTTP API (Port 443 - works on Render Free Tier)
  if (process.env.BREVO_API_KEY) {
    console.log('[sendEmail] Using Brevo HTTP API...');
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': process.env.BREVO_API_KEY,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        sender: { email: process.env.SMTP_FROM || 'no-reply@spendwise.com', name: 'Spendwise Support' },
        to: [{ email: to }],
        subject,
        htmlContent: html,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || `Brevo API Error: ${response.statusCode || response.statusText}`);
    }
    return data;
  }

  // Option 3: Standard SMTP (Nodemailer)
  let transporter;
  const hasSMTP = process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS;

  if (hasSMTP) {
    console.log('[sendEmail] Using Standard SMTP Transporter...');
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      tls: {
        rejectUnauthorized: false,
      },
      family: 4, // Force IPv4
    });
  } else {
    // Generate a temporary Ethereal SMTP account for local testing
    console.log('[sendEmail] SMTP not configured. Attempting Ethereal/localhost fallback...');
    try {
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
    } catch (err) {
      console.error('Failed to create Ethereal test account, trying default local SMTP setup:', err);
      transporter = nodemailer.createTransport({
        host: 'localhost',
        port: 1025,
        ignoreTLS: true,
      });
    }
  }

  const mailOptions = {
    from: `"Spendwise Support" <${process.env.SMTP_FROM || 'no-reply@spendwise.com'}>`,
    to,
    subject,
    html,
  };

  const info = await transporter.sendMail(mailOptions);

  if (!hasSMTP) {
    console.log('\n==================================================');
    console.log('📬 FORGOT PASSWORD EMAIL SENT (LOCAL TEST MODE)');
    console.log(`To:      ${to}`);
    console.log(`Subject: ${subject}`);
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log(`🔗 Preview URL: ${previewUrl}`);
    } else {
      console.log('No preview URL available (using local fallback SMTP)');
    }
    console.log('==================================================\n');
  }

  return info;
};
