/**
 * Email Service
 * Sends emails using Nodemailer
 * 
 * In development (no SMTP configured): Uses Ethereal fake SMTP.
 * Emails are captured and viewable at https://ethereal.email
 * 
 * In production: Uses configured SMTP (Gmail, SendGrid, etc.)
 */

const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
const prisma = require('../config/database');

const EMAIL_FROM_NAME = process.env.EMAIL_FROM_NAME || 'GST Compliance SaaS';

let cachedTransporter = null;
let transporterMode = null; // 'production' or 'ethereal'

function isSmtpConfigured() {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASSWORD;
  return user && pass
    && !user.includes('your-email')
    && !pass.includes('your-app-password')
    && user !== ''
    && pass !== '';
}

/**
 * Get or create email transporter.
 * Falls back to Ethereal test account if SMTP not configured.
 */
async function getTransporter() {
  if (cachedTransporter) return cachedTransporter;

  if (isSmtpConfigured()) {
    transporterMode = 'production';
    cachedTransporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT) || 587,
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });
    console.log('[Email Service] Using configured SMTP:', process.env.EMAIL_HOST || 'smtp.gmail.com');
    return cachedTransporter;
  }

  // Fallback: Create Ethereal test account (free, no signup needed)
  transporterMode = 'ethereal';
  try {
    const testAccount = await nodemailer.createTestAccount();
    cachedTransporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass
      }
    });
    console.log('\n╔══════════════════════════════════════════════════════════════╗');
    console.log('║  EMAIL SERVICE: Using Ethereal test account (dev mode)     ║');
    console.log('║  Emails won\'t be delivered but can be viewed in browser.   ║');
    console.log('║  Configure EMAIL_USER & EMAIL_PASSWORD in .env for real.   ║');
    console.log('╚══════════════════════════════════════════════════════════════╝');
    console.log(`  Ethereal user: ${testAccount.user}`);
    console.log(`  Ethereal pass: ${testAccount.pass}\n`);
    return cachedTransporter;
  } catch (etherealError) {
    console.error('[Email Service] Failed to create Ethereal account:', etherealError.message);
    console.log('[Email Service] Falling back to console-only mode.');
    transporterMode = 'console';
    return null;
  }
}

function getEmailFrom() {
  if (transporterMode === 'production') {
    return `"${EMAIL_FROM_NAME}" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`;
  }
  return `"${EMAIL_FROM_NAME}" <noreply@gst-compliance.test>`;
}

/**
 * Send email with auto-fallback.
 * Returns { success, messageId, previewUrl? }
 */
async function sendMail(mailOptions) {
  const transporter = await getTransporter();

  if (!transporter) {
    // Console-only fallback (when even Ethereal fails)
    console.log('\n[Email Service] EMAIL (console-only mode):');
    console.log(`  To:      ${mailOptions.to}`);
    console.log(`  Subject: ${mailOptions.subject}`);
    if (mailOptions._devUrl) {
      console.log(`  Action URL: ${mailOptions._devUrl}`);
    }
    console.log('');
    return { success: true, messageId: 'console-mode', to: mailOptions.to };
  }

  const info = await transporter.sendMail({
    from: mailOptions.from || getEmailFrom(),
    to: mailOptions.to,
    subject: mailOptions.subject,
    html: mailOptions.html,
    attachments: mailOptions.attachments
  });

  const result = { success: true, messageId: info.messageId, to: mailOptions.to };

  if (transporterMode === 'ethereal') {
    const previewUrl = nodemailer.getTestMessageUrl(info);
    result.previewUrl = previewUrl;
    console.log('\n╔══════════════════════════════════════════════════════════════╗');
    console.log(`║  EMAIL SENT (Ethereal preview — open in browser):          ║`);
    console.log('╚══════════════════════════════════════════════════════════════╝');
    console.log(`  To:      ${mailOptions.to}`);
    console.log(`  Subject: ${mailOptions.subject}`);
    console.log(`  Preview: ${previewUrl}`);
    if (mailOptions._devUrl) {
      console.log(`  Action:  ${mailOptions._devUrl}`);
    }
    console.log('');
  }

  return result;
}


// ─── Email Functions ────────────────────────────────────────────────────────────

async function sendInvoiceEmail(invoiceId, businessId, options = {}) {
  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, businessId, isActive: true },
    include: { business: true, customer: true }
  });

  if (!invoice) throw new Error('Invoice not found');
  if (!invoice.pdfGenerated || !invoice.pdfFilePath) {
    throw new Error('Invoice PDF not generated. Please generate PDF first.');
  }
  if (!fs.existsSync(invoice.pdfFilePath)) {
    throw new Error('Invoice PDF file not found on disk');
  }

  const toEmail = options.to || invoice.customer.email;
  if (!toEmail) throw new Error('No recipient email address provided');

  const subject = options.subject || `Invoice ${invoice.invoiceNumber} from ${invoice.business.businessName}`;
  const htmlBody = generateInvoiceEmailHTML(invoice, options.message);
  const pdfFileName = `Invoice_${invoice.invoiceNumber.replace(/\//g, '-')}.pdf`;

  const info = await sendMail({
    to: toEmail,
    subject,
    html: htmlBody,
    attachments: [{ filename: pdfFileName, path: invoice.pdfFilePath }]
  });

  await prisma.invoice.update({
    where: { id: invoiceId },
    data: {
      emailSent: true,
      emailSentTo: toEmail,
      emailSentAt: new Date(),
      emailSubject: subject
    }
  });

  return { ...info, subject, invoiceNumber: invoice.invoiceNumber };
}


function generateInvoiceEmailHTML(invoice, customMessage = null) {
  const { business, customer } = invoice;
  const invoiceAmount = parseFloat(invoice.totalAmount).toLocaleString('en-IN', {
    style: 'currency',
    currency: 'INR'
  });

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice from ${business.businessName}</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background-color: #f8f9fa; padding: 30px; border: 1px solid #dee2e6; border-top: none; border-radius: 0 0 8px 8px; }
    .invoice-details { background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2563eb; }
    .invoice-details table { width: 100%; border-collapse: collapse; }
    .invoice-details td { padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
    .invoice-details td:first-child { font-weight: bold; width: 40%; }
    .total-amount { font-size: 24px; color: #16a34a; font-weight: bold; text-align: center; margin: 20px 0; padding: 15px; background-color: #dcfce7; border-radius: 8px; }
    .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6; font-size: 12px; color: #6c757d; }
    .custom-message { background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px; }
  </style>
</head>
<body>
  <div class="header">
    <h1 style="margin: 0;">Invoice from ${business.businessName}</h1>
  </div>
  <div class="content">
    <p>Dear ${customer.customerName},</p>
    ${customMessage ? `<div class="custom-message"><strong>Message:</strong><br>${customMessage}</div>` : ''}
    <p>Thank you for your business! Please find your invoice attached to this email.</p>
    <div class="invoice-details">
      <table>
        <tr><td>Invoice Number:</td><td><strong>${invoice.invoiceNumber}</strong></td></tr>
        <tr><td>Invoice Date:</td><td>${new Date(invoice.invoiceDate).toLocaleDateString('en-IN')}</td></tr>
        <tr><td>Customer:</td><td>${customer.customerName}</td></tr>
        ${customer.gstin ? `<tr><td>Customer GSTIN:</td><td>${customer.gstin}</td></tr>` : ''}
        <tr><td>Invoice Amount:</td><td><strong>${invoiceAmount}</strong></td></tr>
      </table>
    </div>
    <div class="total-amount">Total: ${invoiceAmount}</div>
    <p style="text-align: center;"><strong>The invoice PDF is attached to this email.</strong></p>
    ${invoice.notes ? `<p style="background-color: #e7f3ff; padding: 15px; border-radius: 6px;"><strong>Notes:</strong><br>${invoice.notes}</p>` : ''}
    <hr style="margin: 30px 0; border: none; border-top: 1px solid #dee2e6;">
    <p><strong>From:</strong></p>
    <p>
      ${business.businessName}<br>
      ${business.addressLine1}<br>
      ${business.addressLine2 ? business.addressLine2 + '<br>' : ''}
      ${business.city}, ${business.state} - ${business.pincode}<br>
      GSTIN: ${business.gstin}<br>
      ${business.phone ? `Phone: ${business.phone}<br>` : ''}
      ${business.email ? `Email: ${business.email}` : ''}
    </p>
    ${invoice.termsAndConditions ? `<p style="font-size: 12px; color: #6c757d; margin-top: 20px;"><strong>Terms & Conditions:</strong><br>${invoice.termsAndConditions}</p>` : ''}
  </div>
  <div class="footer">
    <p>This is an automated email. Please do not reply to this message.</p>
    <p>If you have any questions, please contact us at ${business.email || business.phone}</p>
    <p style="margin-top: 15px;">Powered by <strong>GST Compliance SaaS</strong></p>
  </div>
</body>
</html>`.trim();
}


async function sendVerificationEmail(toEmail, verificationToken, businessName) {
  const verifyUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-email?token=${verificationToken}`;

  return sendMail({
    to: toEmail,
    subject: 'Verify your email - GST Compliance SaaS',
    _devUrl: verifyUrl,
    html: `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
    <h1 style="margin: 0;">Welcome to GST Compliance SaaS</h1>
  </div>
  <div style="background-color: #f8f9fa; padding: 30px; border: 1px solid #dee2e6; border-top: none; border-radius: 0 0 8px 8px;">
    <p>Hello,</p>
    <p>Thank you for registering <strong>${businessName || 'your business'}</strong>. Please verify your email address to activate your account.</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${verifyUrl}" style="display: inline-block; background-color: #6366F1; color: white; padding: 14px 40px; text-decoration: none; border-radius: 6px; font-weight: bold;">Verify Email Address</a>
    </div>
    <p style="font-size: 13px; color: #6c757d;">If the button doesn't work, copy and paste this link:<br><a href="${verifyUrl}">${verifyUrl}</a></p>
    <p style="font-size: 13px; color: #6c757d;">This link expires in 24 hours.</p>
  </div>
  <div style="text-align: center; margin-top: 20px; font-size: 12px; color: #6c757d;">
    <p>Powered by GST Compliance SaaS</p>
  </div>
</body>
</html>`.trim()
  });
}


async function sendPasswordResetEmail(toEmail, resetToken) {
  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;

  return sendMail({
    to: toEmail,
    subject: 'Reset your password - GST Compliance SaaS',
    _devUrl: resetUrl,
    html: `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
    <h1 style="margin: 0;">Password Reset</h1>
  </div>
  <div style="background-color: #f8f9fa; padding: 30px; border: 1px solid #dee2e6; border-top: none; border-radius: 0 0 8px 8px;">
    <p>Hello,</p>
    <p>We received a request to reset your password. Click the button below to set a new password.</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${resetUrl}" style="display: inline-block; background-color: #6366F1; color: white; padding: 14px 40px; text-decoration: none; border-radius: 6px; font-weight: bold;">Reset Password</a>
    </div>
    <p style="font-size: 13px; color: #6c757d;">If the button doesn't work, copy and paste this link:<br><a href="${resetUrl}">${resetUrl}</a></p>
    <p style="font-size: 13px; color: #6c757d;">This link expires in 1 hour. If you didn't request this, please ignore this email.</p>
  </div>
  <div style="text-align: center; margin-top: 20px; font-size: 12px; color: #6c757d;">
    <p>Powered by GST Compliance SaaS</p>
  </div>
</body>
</html>`.trim()
  });
}


async function sendTestEmail(toEmail) {
  return sendMail({
    to: toEmail,
    subject: 'Test Email from GST Compliance SaaS',
    html: `
      <h2>Email Configuration Test</h2>
      <p>If you're seeing this, your email configuration is working correctly!</p>
      <p><strong>Mode:</strong> ${transporterMode}</p>
      <p>You can now send invoice emails.</p>
    `
  });
}


async function verifyEmailConfig() {
  try {
    const transporter = await getTransporter();
    if (!transporter) {
      return { success: false, message: 'No email transporter available' };
    }
    await transporter.verify();
    return {
      success: true,
      mode: transporterMode,
      message: transporterMode === 'ethereal'
        ? 'Using Ethereal test account. Emails will be captured (not delivered). View at https://ethereal.email'
        : 'Email configuration is valid and ready to send emails'
    };
  } catch (error) {
    return {
      success: false,
      message: `Email configuration error: ${error.message}`,
      error: error.message
    };
  }
}

module.exports = {
  sendInvoiceEmail,
  sendTestEmail,
  verifyEmailConfig,
  sendVerificationEmail,
  sendPasswordResetEmail
};
