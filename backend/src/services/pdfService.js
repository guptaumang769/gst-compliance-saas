/**
 * PDF Generation Service
 * Generates GST-compliant invoice PDFs
 * 
 * Uses PDFKit to create professional invoices with:
 * - Company logo and details
 * - Customer information
 * - Line items with HSN/SAC codes
 * - GST breakdown (CGST/SGST/IGST)
 * - Terms and conditions
 * - Digital signature placeholder
 */

const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// PDF storage directory
const PDF_DIR = process.env.PDF_STORAGE_PATH || path.join(__dirname, '../../storage/invoices');

// Ensure storage directory exists
if (!fs.existsSync(PDF_DIR)) {
  fs.mkdirSync(PDF_DIR, { recursive: true });
}

/**
 * Generate PDF for an invoice
 * @param {string} invoiceId - Invoice ID
 * @param {string} businessId - Business ID
 * @returns {Promise<string>} - PDF file path
 */
async function generateInvoicePDF(invoiceId, businessId) {
  // Fetch invoice with all details
  const invoice = await prisma.invoice.findFirst({
    where: {
      id: invoiceId,
      businessId,
      isActive: true
    },
    include: {
      business: true,
      customer: true,
      items: true
    }
  });

  if (!invoice) {
    throw new Error('Invoice not found');
  }

  // Generate PDF file name
  const fileName = `${invoice.invoiceNumber.replace(/\//g, '-')}_${Date.now()}.pdf`;
  const filePath = path.join(PDF_DIR, fileName);

  // Create PDF document
  const doc = new PDFDocument({ size: 'A4', margin: 50 });

  // Pipe to file
  const stream = fs.createWriteStream(filePath);
  doc.pipe(stream);

  // Generate PDF content
  await generatePDFContent(doc, invoice);

  // Finalize PDF
  doc.end();

  // Wait for file to be written
  await new Promise((resolve, reject) => {
    stream.on('finish', resolve);
    stream.on('error', reject);
  });

  // Update invoice with PDF info
  await prisma.invoice.update({
    where: { id: invoiceId },
    data: {
      pdfGenerated: true,
      pdfFilePath: filePath,
      pdfGeneratedAt: new Date()
    }
  });

  return filePath;
}

/**
 * Generate PDF content
 */
async function generatePDFContent(doc, invoice) {
  const { business, customer, items } = invoice;

  // Colors
  const primaryColor = '#2563eb'; // Blue
  const secondaryColor = '#64748b'; // Gray
  const successColor = '#16a34a'; // Green

  let yPosition = 50;

  // ==========================================
  // HEADER: Company Details
  // ==========================================
  doc.fontSize(24)
     .fillColor(primaryColor)
     .text('TAX INVOICE', 50, yPosition, { align: 'center' });

  yPosition += 40;

  // Company details (left side)
  doc.fontSize(14)
     .fillColor('#000')
     .text(business.businessName, 50, yPosition);
  
  yPosition += 20;
  
  doc.fontSize(9)
     .fillColor(secondaryColor)
     .text(business.addressLine1, 50, yPosition);
  
  if (business.addressLine2) {
    yPosition += 12;
    doc.text(business.addressLine2, 50, yPosition);
  }
  
  yPosition += 12;
  doc.text(`${business.city}, ${business.state} - ${business.pincode}`, 50, yPosition);
  
  yPosition += 12;
  doc.text(`GSTIN: ${business.gstin}`, 50, yPosition);
  
  yPosition += 12;
  doc.text(`PAN: ${business.pan}`, 50, yPosition);
  
  if (business.phone) {
    yPosition += 12;
    doc.text(`Phone: ${business.phone}`, 50, yPosition);
  }
  
  if (business.email) {
    yPosition += 12;
    doc.text(`Email: ${business.email}`, 50, yPosition);
  }

  // Invoice details (right side)
  const rightX = 350;
  let rightY = 90;

  doc.fontSize(10)
     .fillColor('#000')
     .text('Invoice No:', rightX, rightY, { continued: true })
     .fillColor(primaryColor)
     .text(` ${invoice.invoiceNumber}`, { align: 'right' });

  rightY += 15;
  doc.fillColor('#000')
     .text('Invoice Date:', rightX, rightY, { continued: true })
     .fillColor(secondaryColor)
     .text(` ${formatDate(invoice.invoiceDate)}`, { align: 'right' });

  rightY += 15;
  doc.fillColor('#000')
     .text('Place of Supply:', rightX, rightY, { continued: true })
     .fillColor(secondaryColor)
     .text(` ${invoice.placeOfSupply}`, { align: 'right' });

  // Horizontal line
  yPosition = Math.max(yPosition, rightY) + 30;
  doc.moveTo(50, yPosition)
     .lineTo(545, yPosition)
     .strokeColor(primaryColor)
     .lineWidth(2)
     .stroke();

  yPosition += 20;

  // ==========================================
  // BILL TO: Customer Details
  // ==========================================
  doc.fontSize(12)
     .fillColor(primaryColor)
     .text('BILL TO:', 50, yPosition);

  yPosition += 20;

  doc.fontSize(11)
     .fillColor('#000')
     .text(customer.customerName, 50, yPosition);

  yPosition += 15;

  doc.fontSize(9)
     .fillColor(secondaryColor)
     .text(customer.billingAddress, 50, yPosition, { width: 250 });

  yPosition += 12;
  doc.text(`${customer.city}, ${customer.state} - ${customer.pincode}`, 50, yPosition);

  if (customer.gstin) {
    yPosition += 12;
    doc.text(`GSTIN: ${customer.gstin}`, 50, yPosition);
  }

  if (customer.phone) {
    yPosition += 12;
    doc.text(`Phone: ${customer.phone}`, 50, yPosition);
  }

  if (customer.email) {
    yPosition += 12;
    doc.text(`Email: ${customer.email}`, 50, yPosition);
  }

  yPosition += 30;

  // ==========================================
  // TABLE: Line Items
  // ==========================================
  const tableTop = yPosition;
  const tableHeaders = [
    { text: '#', x: 50, width: 30 },
    { text: 'Description', x: 80, width: 160 },
    { text: 'HSN/SAC', x: 240, width: 60 },
    { text: 'Qty', x: 300, width: 40 },
    { text: 'Rate', x: 340, width: 50 },
    { text: 'Taxable', x: 390, width: 50 },
    { text: 'GST', x: 440, width: 35 },
    { text: 'Amount', x: 475, width: 70, align: 'right' }
  ];

  // Table header background
  doc.rect(50, tableTop, 495, 25)
     .fillColor(primaryColor)
     .fill();

  // Table headers
  doc.fillColor('#fff')
     .fontSize(9);

  tableHeaders.forEach(header => {
    doc.text(header.text, header.x, tableTop + 8, {
      width: header.width,
      align: header.align || 'left'
    });
  });

  yPosition = tableTop + 30;

  // Table rows
  doc.fillColor('#000');
  
  items.forEach((item, index) => {
    const hsnSac = item.hsnCode || item.sacCode || 'N/A';
    const gstRate = parseFloat(item.gstRate);
    const taxableAmount = parseFloat(item.taxableAmount);
    const totalAmount = parseFloat(item.totalAmount);

    // Check if we need a new page
    if (yPosition > 700) {
      doc.addPage();
      yPosition = 50;
    }

    // Row background (alternate colors)
    if (index % 2 === 0) {
      doc.rect(50, yPosition - 5, 495, 20)
         .fillColor('#f8f9fa')
         .fill();
    }

    doc.fillColor('#000')
       .fontSize(9);

    // Serial number
    doc.text(index + 1, 50, yPosition, { width: 30 });

    // Description
    doc.text(item.itemName, 80, yPosition, { width: 160 });

    // HSN/SAC
    doc.text(hsnSac, 240, yPosition, { width: 60 });

    // Quantity
    doc.text(parseFloat(item.quantity).toFixed(2), 300, yPosition, { width: 40 });

    // Unit Price
    doc.text(parseFloat(item.unitPrice).toFixed(2), 340, yPosition, { width: 50 });

    // Taxable Amount
    doc.text(taxableAmount.toFixed(2), 390, yPosition, { width: 50 });

    // GST Rate
    doc.text(`${gstRate}%`, 440, yPosition, { width: 35 });

    // Total Amount
    doc.text(totalAmount.toFixed(2), 475, yPosition, { width: 70, align: 'right' });

    yPosition += 20;
  });

  // Table bottom border
  doc.moveTo(50, yPosition)
     .lineTo(545, yPosition)
     .strokeColor('#dee2e6')
     .lineWidth(1)
     .stroke();

  yPosition += 20;

  // ==========================================
  // TOTALS SECTION
  // ==========================================
  const totalsX = 380;
  
  // Subtotal
  doc.fontSize(10)
     .fillColor('#000')
     .text('Subtotal:', totalsX, yPosition)
     .text(`₹${parseFloat(invoice.subtotal).toFixed(2)}`, 475, yPosition, { width: 70, align: 'right' });

  yPosition += 18;

  // GST Breakdown
  const supplyType = invoice.sellerStateCode === invoice.buyerStateCode ? 'Intra-State' : 'Inter-State';
  
  if (supplyType === 'Intra-State') {
    // CGST
    doc.text(`CGST:`, totalsX, yPosition)
       .text(`₹${parseFloat(invoice.cgstAmount).toFixed(2)}`, 475, yPosition, { width: 70, align: 'right' });
    yPosition += 18;

    // SGST
    doc.text(`SGST:`, totalsX, yPosition)
       .text(`₹${parseFloat(invoice.sgstAmount).toFixed(2)}`, 475, yPosition, { width: 70, align: 'right' });
    yPosition += 18;
  } else {
    // IGST
    doc.text(`IGST:`, totalsX, yPosition)
       .text(`₹${parseFloat(invoice.igstAmount).toFixed(2)}`, 475, yPosition, { width: 70, align: 'right' });
    yPosition += 18;
  }

  // Cess (if applicable)
  if (parseFloat(invoice.cessAmount) > 0) {
    doc.text(`Cess:`, totalsX, yPosition)
       .text(`₹${parseFloat(invoice.cessAmount).toFixed(2)}`, 475, yPosition, { width: 70, align: 'right' });
    yPosition += 18;
  }

  // Round off (if applicable)
  if (parseFloat(invoice.roundOffAmount) !== 0) {
    doc.text(`Round Off:`, totalsX, yPosition)
       .text(`₹${parseFloat(invoice.roundOffAmount).toFixed(2)}`, 475, yPosition, { width: 70, align: 'right' });
    yPosition += 18;
  }

  // Total line
  doc.moveTo(totalsX, yPosition)
     .lineTo(545, yPosition)
     .strokeColor(primaryColor)
     .lineWidth(1)
     .stroke();

  yPosition += 10;

  // Grand Total
  doc.fontSize(12)
     .fillColor(successColor)
     .text('Total:', totalsX, yPosition)
     .text(`₹${parseFloat(invoice.totalAmount).toFixed(2)}`, 475, yPosition, { width: 70, align: 'right' });

  yPosition += 30;

  // Amount in words
  const amountInWords = numberToWords(parseFloat(invoice.totalAmount));
  doc.fontSize(10)
     .fillColor('#000')
     .text(`Amount in Words: `, 50, yPosition, { continued: true })
     .fillColor(secondaryColor)
     .text(`${amountInWords} Only`, { width: 495 });

  yPosition += 30;

  // ==========================================
  // TERMS & CONDITIONS
  // ==========================================
  if (invoice.termsAndConditions) {
    doc.fontSize(10)
       .fillColor(primaryColor)
       .text('Terms & Conditions:', 50, yPosition);

    yPosition += 15;

    doc.fontSize(8)
       .fillColor(secondaryColor)
       .text(invoice.termsAndConditions, 50, yPosition, { width: 495 });

    yPosition += 40;
  }

  // ==========================================
  // FOOTER: Signature & Notes
  // ==========================================
  if (yPosition > 650) {
    doc.addPage();
    yPosition = 50;
  }

  // Notes
  if (invoice.notes) {
    doc.fontSize(9)
       .fillColor(secondaryColor)
       .text(`Notes: ${invoice.notes}`, 50, yPosition, { width: 300 });
  }

  // Signature section (right side)
  const signY = Math.max(yPosition, 700);
  
  doc.fontSize(10)
     .fillColor('#000')
     .text('For ' + business.businessName, 380, signY);

  doc.moveTo(380, signY + 50)
     .lineTo(530, signY + 50)
     .strokeColor('#000')
     .lineWidth(0.5)
     .stroke();

  doc.fontSize(9)
     .fillColor(secondaryColor)
     .text('Authorized Signatory', 380, signY + 55);

  // Footer text
  doc.fontSize(8)
     .fillColor(secondaryColor)
     .text('This is a computer-generated invoice and does not require a signature.', 
           50, 770, { align: 'center', width: 495 });
}

/**
 * Format date for display
 */
function formatDate(date) {
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
}

/**
 * Convert number to words (Indian format)
 */
function numberToWords(num) {
  if (num === 0) return 'Zero';

  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];

  function convertLessThanThousand(n) {
    if (n === 0) return '';
    if (n < 10) return ones[n];
    if (n < 20) return teens[n - 10];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 > 0 ? ' ' + ones[n % 10] : '');
    return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 > 0 ? ' ' + convertLessThanThousand(n % 100) : '');
  }

  // Separate rupees and paise
  const rupees = Math.floor(num);
  const paise = Math.round((num - rupees) * 100);

  let result = '';

  if (rupees >= 10000000) {
    result += convertLessThanThousand(Math.floor(rupees / 10000000)) + ' Crore ';
    rupees %= 10000000;
  }
  if (rupees >= 100000) {
    result += convertLessThanThousand(Math.floor(rupees / 100000)) + ' Lakh ';
    rupees %= 100000;
  }
  if (rupees >= 1000) {
    result += convertLessThanThousand(Math.floor(rupees / 1000)) + ' Thousand ';
    rupees %= 1000;
  }
  if (rupees > 0) {
    result += convertLessThanThousand(rupees);
  }

  result += ' Rupees';

  if (paise > 0) {
    result += ' and ' + convertLessThanThousand(paise) + ' Paise';
  }

  return result.trim();
}

/**
 * Get PDF file path for an invoice
 */
async function getInvoicePDFPath(invoiceId, businessId) {
  const invoice = await prisma.invoice.findFirst({
    where: {
      id: invoiceId,
      businessId,
      isActive: true
    },
    select: {
      pdfGenerated: true,
      pdfFilePath: true
    }
  });

  if (!invoice) {
    throw new Error('Invoice not found');
  }

  if (!invoice.pdfGenerated || !invoice.pdfFilePath) {
    throw new Error('PDF not generated for this invoice');
  }

  // Check if file exists
  if (!fs.existsSync(invoice.pdfFilePath)) {
    throw new Error('PDF file not found on disk');
  }

  return invoice.pdfFilePath;
}

/**
 * Delete PDF file
 */
async function deleteInvoicePDF(invoiceId, businessId) {
  const invoice = await prisma.invoice.findFirst({
    where: {
      id: invoiceId,
      businessId,
      isActive: true
    }
  });

  if (!invoice) {
    throw new Error('Invoice not found');
  }

  if (invoice.pdfGenerated && invoice.pdfFilePath) {
    // Delete file if exists
    if (fs.existsSync(invoice.pdfFilePath)) {
      fs.unlinkSync(invoice.pdfFilePath);
    }

    // Update database
    await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        pdfGenerated: false,
        pdfFilePath: null,
        pdfGeneratedAt: null
      }
    });
  }
}

module.exports = {
  generateInvoicePDF,
  getInvoicePDFPath,
  deleteInvoicePDF
};
