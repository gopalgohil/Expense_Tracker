import nodemailer from 'nodemailer';

export const sendEmail = async ({ to, subject, html }) => {
  let transporter;

  const hasSMTP = process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS;

  if (hasSMTP) {
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
      // Force IPv4 — Render free tier does not support IPv6
      family: 4,
    });
  } else {
    // Generate a temporary Ethereal SMTP account for local testing
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
      // fallback to localhost SMTP
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
