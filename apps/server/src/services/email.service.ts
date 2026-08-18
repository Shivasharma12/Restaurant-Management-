import nodemailer from 'nodemailer';
import { logger } from '../utils/logger';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST ?? 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT ?? '587', 10),
  secure: parseInt(process.env.SMTP_PORT ?? '587', 10) === 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

const FROM = `"${process.env.SMTP_FROM_NAME ?? 'EZ- Restaurant'}" <${
  process.env.SMTP_USER || process.env.SMTP_FROM_EMAIL || 'shivabhardwaj4545@gmail.com'
}>`;

async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  try {
    const info = await transporter.sendMail({ from: FROM, to, subject, html });
    logger.info(`✅ Email sent to ${to}: ${subject} (Message ID: ${info.messageId})`);
  } catch (error: any) {
    logger.error(`❌ Failed to send email to ${to}:`, error.message || error);
    throw new Error(`Email delivery failed: ${error.message || 'SMTP error'}`);
  }
}

export async function sendVerificationEmail(
  to: string,
  name: string,
  token: string
): Promise<void> {
  const verifyUrl = `${process.env.CLIENT_URL}/verify-email?token=${token}`;
  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="UTF-8"><style>
      body { font-family: 'Segoe UI', Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 20px; }
      .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 20px rgba(0,0,0,0.1); }
      .header { background: linear-gradient(135deg, #E85D04, #F48C06); padding: 40px 30px; text-align: center; }
      .header h1 { color: white; margin: 0; font-size: 28px; }
      .body { padding: 40px 30px; }
      .btn { display: inline-block; background: #E85D04; color: white !important; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px; }
      .footer { background: #f9f9f9; padding: 20px 30px; text-align: center; color: #888; font-size: 12px; }
    </style></head>
    <body>
      <div class="container">
        <div class="header"><h1>🍽️ EZ- Restaurant</h1></div>
        <div class="body">
          <h2>Verify your email, ${name}!</h2>
          <p>Thanks for signing up. Click the button below to verify your email address and get started.</p>
          <p style="text-align: center; margin: 30px 0;">
            <a href="${verifyUrl}" class="btn">Verify Email Address</a>
          </p>
          <p style="color: #888; font-size: 14px;">This link expires in 24 hours. If you didn't sign up, you can safely ignore this email.</p>
        </div>
        <div class="footer"><p>© 2024 EZ- Restaurant SaaS. All rights reserved.</p></div>
      </div>
    </body>
    </html>
  `;
  await sendEmail(to, 'Verify your EZ- Restaurant account', html);
}

export async function sendPasswordResetEmail(
  to: string,
  name: string,
  token: string
): Promise<void> {
  const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${token}`;
  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="UTF-8"><style>
      body { font-family: 'Segoe UI', Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 20px; }
      .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; }
      .header { background: linear-gradient(135deg, #E85D04, #F48C06); padding: 40px 30px; text-align: center; }
      .header h1 { color: white; margin: 0; font-size: 28px; }
      .body { padding: 40px 30px; }
      .btn { display: inline-block; background: #E85D04; color: white !important; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px; }
    </style></head>
    <body>
      <div class="container">
        <div class="header"><h1>🔐 Password Reset</h1></div>
        <div class="body">
          <h2>Reset your password, ${name}</h2>
          <p>We received a request to reset your password. Click the button below to choose a new password.</p>
          <p style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" class="btn">Reset Password</a>
          </p>
          <p style="color: #888; font-size: 14px;">This link expires in 1 hour. If you didn't request this, please ignore this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;
  await sendEmail(to, 'Reset your EZ- Restaurant password', html);
}

export async function sendOrderConfirmationEmail(
  to: string,
  name: string,
  orderId: string,
  restaurantName: string,
  total: number
): Promise<void> {
  const trackUrl = `${process.env.CLIENT_URL}/orders/${orderId}`;
  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="UTF-8"><style>
      body { font-family: 'Segoe UI', Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 20px; }
      .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; }
      .header { background: linear-gradient(135deg, #16a34a, #22c55e); padding: 40px 30px; text-align: center; }
      .header h1 { color: white; margin: 0; font-size: 28px; }
      .body { padding: 40px 30px; }
      .order-info { background: #f9f9f9; border-radius: 8px; padding: 20px; margin: 20px 0; }
      .btn { display: inline-block; background: #16a34a; color: white !important; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; }
    </style></head>
    <body>
      <div class="container">
        <div class="header"><h1>✅ Order Confirmed!</h1></div>
        <div class="body">
          <h2>Hi ${name},</h2>
          <p>Your order has been confirmed! Here's a summary:</p>
          <div class="order-info">
            <p><strong>Order ID:</strong> #${orderId.slice(-8).toUpperCase()}</p>
            <p><strong>Restaurant:</strong> ${restaurantName}</p>
            <p><strong>Total:</strong> ₹${total.toFixed(2)}</p>
          </div>
          <p style="text-align: center; margin: 30px 0;">
            <a href="${trackUrl}" class="btn">Track Your Order</a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
  await sendEmail(to, `Order confirmed - ${restaurantName}`, html);
}

export async function sendBroadcastEmail(
  recipients: string[],
  subject: string,
  messageHtml: string,
  senderTitle: string = 'Super Admin Broadcast'
): Promise<{ success: number; failed: number }> {
  // 1. Clean, normalize, and extract real email addresses (remove prefixes like "upstates:")
  const cleanedRecipients = Array.from(
    new Set(
      recipients
        .map((r) => {
          if (!r) return '';
          const cleaned = r.includes(':') ? r.split(':')[1] : r;
          return cleaned.toLowerCase().trim();
        })
        .filter((r) => r && r.includes('@') && r.includes('.'))
    )
  );

  // 2. Ensure SMTP admin email (shivabhardwaj4545@gmail.com) is included so admin gets a copy
  const adminSmtpEmail = (process.env.SMTP_USER || process.env.SMTP_FROM_EMAIL || '').toLowerCase().trim();
  if (adminSmtpEmail && !cleanedRecipients.includes(adminSmtpEmail)) {
    cleanedRecipients.push(adminSmtpEmail);
  }

  logger.info(`📧 Starting parallel broadcast email dispatch for ${cleanedRecipients.length} recipients: ${cleanedRecipients.join(', ')}`);

  // 3. Dispatch emails in parallel using Promise.allSettled
  const results = await Promise.allSettled(
    cleanedRecipients.map(async (recipient) => {
      const html = `
        <!DOCTYPE html>
        <html>
        <head><meta charset="UTF-8"><style>
          body { font-family: 'Segoe UI', Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 20px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #E85D04, #F48C06); padding: 30px; text-align: center; }
          .header h1 { color: white; margin: 0; font-size: 24px; }
          .body { padding: 30px; font-size: 15px; color: #333; line-height: 1.6; }
          .footer { background: #f9f9f9; padding: 20px; text-align: center; color: #888; font-size: 12px; }
        </style></head>
        <body>
          <div class="container">
            <div class="header"><h1>📢 ${senderTitle}</h1></div>
            <div class="body">
              ${messageHtml.replace(/\n/g, '<br />')}
            </div>
            <div class="footer"><p>© EZ- Restaurant Platform. Official Announcement.</p></div>
          </div>
        </body>
        </html>
      `;
      await sendEmail(recipient, subject, html);
    })
  );

  let successCount = 0;
  let failedCount = 0;

  results.forEach((res, idx) => {
    if (res.status === 'fulfilled') {
      successCount++;
    } else {
      failedCount++;
      logger.error(`Broadcast email delivery failed for ${cleanedRecipients[idx]}:`, res.reason);
    }
  });

  logger.info(`🎉 Broadcast email summary: ${successCount} delivered successfully, ${failedCount} failed.`);
  return { success: successCount, failed: failedCount };
}

export async function sendRestaurantWelcomeEmail(
  to: string,
  ownerName: string,
  restaurantName: string,
  slug: string,
  tempPassword?: string
): Promise<void> {
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  const loginUrl = `${clientUrl}/login`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="UTF-8"><style>
      body { font-family: 'Segoe UI', Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 20px; }
      .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 20px rgba(0,0,0,0.1); }
      .header { background: linear-gradient(135deg, #E85D04, #F48C06); padding: 35px 30px; text-align: center; }
      .header h1 { color: white; margin: 0; font-size: 26px; font-weight: 700; }
      .body { padding: 35px 30px; font-size: 15px; color: #333; line-height: 1.6; }
      .info-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 20px; margin: 25px 0; }
      .info-item { display: flex; justify-content: space-between; margin-bottom: 10px; border-bottom: 1px dashed #e2e8f0; padding-bottom: 8px; }
      .info-item:last-child { border-bottom: none; margin-bottom: 0; padding-bottom: 0; }
      .info-label { font-weight: 600; color: #475569; }
      .info-value { font-weight: 700; color: #0f172a; word-break: break-all; }
      .btn { display: inline-block; background: #E85D04; color: white !important; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px; margin-top: 15px; }
      .footer { background: #f9f9f9; padding: 20px 30px; text-align: center; color: #888; font-size: 12px; }
      .pass-badge { background: #fef3c7; color: #92400e; padding: 4px 8px; border-radius: 4px; font-family: monospace; font-size: 15px; }
    </style></head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🏪 Restaurant Created & Verified</h1>
        </div>
        <div class="body">
          <h2 style="margin-top:0; color: #1e293b;">Welcome to EZ- Restaurant, ${ownerName}!</h2>
          <p>Your restaurant <strong>${restaurantName}</strong> has been successfully registered and verified on the EZ- Restaurant platform.</p>
          
          <div class="info-box">
            <div class="info-item">
              <span class="info-label">Restaurant Name:</span>
              <span class="info-value">${restaurantName}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Storefront Slug:</span>
              <span class="info-value">${slug}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Owner Email:</span>
              <span class="info-value">${to}</span>
            </div>
            ${
              tempPassword
                ? `
            <div class="info-item">
              <span class="info-label">Temporary Password:</span>
              <span class="info-value pass-badge">${tempPassword}</span>
            </div>
            `
                : `
            <div class="info-item">
              <span class="info-label">Password:</span>
              <span class="info-value">Use your registered account password</span>
            </div>
            `
            }
          </div>

          <p style="color: #64748b; font-size: 14px;">
            ${
              tempPassword
                ? '⚠️ Please log in using your temporary password above and change your password immediately after logging in for security.'
                : 'You can access your restaurant management dashboard directly using your account credentials.'
            }
          </p>

          <p style="text-align: center; margin: 30px 0;">
            <a href="${loginUrl}" class="btn">Login to Owner Dashboard</a>
          </p>
        </div>
        <div class="footer">
          <p>© EZ- Restaurant Platform. Official Notification.</p>
        </div>
      </div>
    </body>
    </html>
  `;
  await sendEmail(to, `Welcome to EZ- Restaurant! (${restaurantName})`, html);
}

export async function sendRestaurantApprovalEmail(
  to: string,
  ownerName: string,
  restaurantName: string,
  isApproved: boolean,
  slug?: string
): Promise<void> {
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  const loginUrl = `${clientUrl}/login`;

  const headerGradient = isApproved
    ? 'linear-gradient(135deg, #16a34a, #22c55e)'
    : 'linear-gradient(135deg, #dc2626, #ef4444)';
  const statusEmoji = isApproved ? '🎉' : '⚠️';
  const statusTitle = isApproved ? 'Restaurant Approved!' : 'Restaurant Status Update';

  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="UTF-8"><style>
      body { font-family: 'Segoe UI', Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 20px; }
      .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 20px rgba(0,0,0,0.1); }
      .header { background: ${headerGradient}; padding: 35px 30px; text-align: center; }
      .header h1 { color: white; margin: 0; font-size: 26px; font-weight: 700; }
      .body { padding: 35px 30px; font-size: 15px; color: #333; line-height: 1.6; }
      .btn { display: inline-block; background: ${isApproved ? '#16a34a' : '#dc2626'}; color: white !important; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px; margin-top: 15px; }
      .footer { background: #f9f9f9; padding: 20px 30px; text-align: center; color: #888; font-size: 12px; }
    </style></head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${statusEmoji} ${statusTitle}</h1>
        </div>
        <div class="body">
          <h2 style="margin-top:0; color: #1e293b;">Hello ${ownerName},</h2>
          <p>This is an official update regarding your restaurant <strong>${restaurantName}</strong> on EZ- Restaurant.</p>
          
          <div style="background: #f8fafc; border-left: 4px solid ${isApproved ? '#16a34a' : '#dc2626'}; padding: 15px 20px; border-radius: 4px; margin: 20px 0;">
            <p style="margin: 0; font-weight: 600; color: #1e293b;">
              ${
                isApproved
                  ? 'Congratulations! Your restaurant has been officially approved by the Super Admin. You can now start managing your menu and accepting customer orders live!'
                  : 'Your restaurant approval status has been updated to pending/revoked by the Super Admin. Please contact support if you have any questions.'
              }
            </p>
          </div>

          <p style="text-align: center; margin: 30px 0;">
            <a href="${loginUrl}" class="btn">${isApproved ? 'Go to Owner Dashboard' : 'Contact Support / Login'}</a>
          </p>
        </div>
        <div class="footer">
          <p>© EZ- Restaurant Platform. Official Notification.</p>
        </div>
      </div>
    </body>
    </html>
  `;
  await sendEmail(to, `Restaurant Approval Update - ${restaurantName}`, html);
}
