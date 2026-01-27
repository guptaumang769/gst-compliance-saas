/**
 * Email Service
 * Sends emails using Nodemailer
 * 
 * Features:
 * - Send invoice emails with PDF attachments
 * - HTML email templates
 * - SMTP configuration
 * - Email tracking
 */

const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Email configuration from environment variables
const EMAIL_CONFIG = {
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT) || 587,
  secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
};

const EMAIL_FROM = process.env.EMAIL_FROM || process.env.EMAIL_USER;
const EMAIL_FROM_NAME = process.env.EMAIL_FROM_NAME || 'GST Compliance SaaS';

/**
 * Create email transporter
 */
function createTransporter() {
  if (!EMAIL_CONFIG.auth.user || !EMAIL_CONFIG.auth.password) {
    throw new Error('Email configuration not set. Please configure EMAIL_USER and EMAIL_PASSWORD in .env file.');
  }

  return nodemailer.createTransporter(EMAIL_CONFIG);
}

/**
 * Send invoice email with PDF attachment
 * @param {string} invoiceId - Invoice ID
 * @param {string} businessId - Business ID
 * @param {Object} options - Email options (to, subject, message)
 * @returns {Promise<Object>} - Email send result
 */
async function sendInvoiceEmail(invoiceId, businessId, options = {}) {
  // Fetch invoice with details
  const invoice = await prisma.invoice.findFirst({
    where: {
      id: invoiceId,
      businessId,
      isActive: true
    },
    include: {
      business: true,
      customer: true
    }
  });

  if (!invoice) {
    throw new Error('Invoice not found');
  }

  // Check if PDF exists
  if (!invoice.pdfGenerated || !invoice.pdfFilePath) {
    throw new Error('Invoice PDF not generated. Please generate PDF first.');
  }

  if (!fs.existsSync(invoice.pdfFilePath)) {
    throw new Error('Invoice PDF file not found on disk');
  }

  // Determine recipient
  const toEmail = options.to || invoice.customer.email;
  if (!toEmail) {
    throw new Error('No recipient email address provided');
  }

  // Email subject
  const subject = options.subject || `Invoice ${invoice.invoiceNumber} from ${invoice.business.businessName}`;

  // Email body (HTML)
  const htmlBody = generateInvoiceEmailHTML(invoice, options.message);

  // PDF filename for attachment
  const pdfFileName = `Invoice_${invoice.invoiceNumber.replace(/\//g, '-')}.pdf`;

  // Create transporter
  const transporter = createTransporter();

  // Email options
  const mailOptions = {
    from: `"${EMAIL_FROM_NAME}" <${EMAIL_FROM}>`,
    to: toEmail,
    subject,
    html: htmlBody,
    attachments: [
      {
        filename: pdfFileName,
        path: invoice.pdfFilePath
      }
    ]
  };

  // Send email
  const info = await transporter.sendMail(mailOptions);

  // Update invoice with email sent info
  await prisma.invoice.update({
    where: { id: invoiceId },
    data: {
      emailSent: true,
      emailSentTo: toEmail,
      emailSentAt: new Date(),
      emailSubject: subject
    }
  });

  return {
    success: true,
    messageId: info.messageId,
    to: toEmail,
    subject,
    invoiceNumber: invoice.invoiceNumber
  };
}

/**
 * Generate HTML email template for invoice
 */
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
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background-color: #2563eb;
      color: white;
      padding: 20px;
      text-align: center;
      border-radius: 8px 8px 0 0;
    }
    .content {
      background-color: #f8f9fa;
      padding: 30px;
      border: 1px solid #dee2e6;
      border-top: none;
      border-radius: 0 0 8px 8px;
    }
    .invoice-details {
      background-color: white;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
      border-left: 4px solid #2563eb;
    }
    .invoice-details table {
      width: 100%;
      border-collapse: collapse;
    }
    .invoice-details td {
      padding: 8px 0;
      border-bottom: 1px solid #e5e7eb;
    }
    .invoice-details td:first-child {
      font-weight: bold;
      width: 40%;
    }
    .total-amount {
      font-size: 24px;
      color: #16a34a;
      font-weight: bold;
      text-align: center;
      margin: 20px 0;
      padding: 15px;
      background-color: #dcfce7;
      border-radius: 8px;
    }
    .button {
      display: inline-block;
      background-color: #2563eb;
      color: white !important;
      padding: 12px 30px;
      text-decoration: none;
      border-radius: 6px;
      margin: 10px 0;
      text-align: center;
    }
    .footer {
      text-align: center;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #dee2e6;
      font-size: 12px;
      color: #6c757d;
    }
    .custom-message {
      background-color: #fff3cd;
      border-left: 4px solid #ffc107;
      padding: 15px;
      margin: 20px 0;
      border-radius: 4px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1 style="margin: 0;">Invoice from ${business.businessName}</h1>
  </div>
  
  <div class="content">
    <p>Dear ${customer.customerName},</p>
    
    ${customMessage ? `
    <div class="custom-message">
      <strong>Message:</strong><br>
      ${customMessage}
    </div>
    ` : ''}
    
    <p>Thank you for your business! Please find your invoice attached to this email.</p>
    
    <div class="invoice-details">
      <table>
        <tr>
          <td>Invoice Number:</td>
          <td><strong>${invoice.invoiceNumber}</strong></td>
        </tr>
        <tr>
          <td>Invoice Date:</td>
          <td>${new Date(invoice.invoiceDate).toLocaleDateString('en-IN')}</td>
        </tr>
        <tr>
          <td>Customer:</td>
          <td>${customer.customerName}</td>
        </tr>
        ${customer.gstin ? `
        <tr>
          <td>Customer GSTIN:</td>
          <td>${customer.gstin}</td>
        </tr>
        ` : ''}
        <tr>
          <td>Invoice Amount:</td>
          <td><strong>${invoiceAmount}</strong></td>
        </tr>
      </table>
    </div>
    
    <div class="total-amount">
      Total: ${invoiceAmount}
    </div>
    
    <p style="text-align: center;">
      <strong>The invoice PDF is attached to this email.</strong>
    </p>
    
    ${invoice.notes ? `
    <p style="background-color: #e7f3ff; padding: 15px; border-radius: 6px;">
      <strong>Notes:</strong><br>
      ${invoice.notes}
    </p>
    ` : ''}
    
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
    
    ${invoice.termsAndConditions ? `
    <p style="font-size: 12px; color: #6c757d; margin-top: 20px;">
      <strong>Terms & Conditions:</strong><br>
      ${invoice.termsAndConditions}
    </p>
    ` : ''}
  </div>
  
  <div class="footer">
    <p>This is an automated email. Please do not reply to this message.</p>
    <p>If you have any questions, please contact us at ${business.email || business.phone}</p>
    <p style="margin-top: 15px;">
      Powered by <strong>GST Compliance SaaS</strong>
    </p>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Send test email (for configuration testing)
 */
async function sendTestEmail(toEmail) {
  const transporter = createTransporter();

  const mailOptions = {
    from: `"${EMAIL_FROM_NAME}" <${EMAIL_FROM}>`,
    to: toEmail,
    subject: 'Test Email from GST Compliance SaaS',
    html: `
      <h2>Email Configuration Test</h2>
      <p>If you're seeing this, your email configuration is working correctly!</p>
      <p><strong>Configuration Details:</strong></p>
      <ul>
        <li>Host: ${EMAIL_CONFIG.host}</li>
        <li>Port: ${EMAIL_CONFIG.port}</li>
        <li>From: ${EMAIL_FROM}</li>
      </ul>
      <p>You can now send invoice emails.</p>
    `
  };

  const info = await transporter.sendMail(mailOptions);

  return {
    success: true,
    messageId: info.messageId,
    to: toEmail
  };
}

/**
 * Verify email configuration
 */
async function verifyEmailConfig() {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    return {
      success: true,
      message: 'Email configuration is valid and ready to send emails'
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
  verifyEmailConfig
};
