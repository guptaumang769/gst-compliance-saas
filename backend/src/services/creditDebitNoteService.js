const prisma = require('../config/database');
const gstCalculator = require('./gstCalculator');

const VALID_NOTE_TYPES = ['credit', 'debit'];
const VALID_REASONS = [
  'goods_return',
  'price_reduction',
  'deficiency_in_service',
  'change_in_value',
  'post_sale_discount',
  'correction',
  'other'
];

async function generateNoteNumber(businessId, noteType, referenceDate = new Date()) {
  if (!VALID_NOTE_TYPES.includes(noteType)) {
    throw new Error('noteType must be "credit" or "debit"');
  }
  const d = referenceDate instanceof Date ? referenceDate : new Date(referenceDate);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const yearMonth = `${year}${month}`;
  const prefix = noteType === 'debit' ? 'DN' : 'CN';

  const lastNote = await prisma.creditDebitNote.findFirst({
    where: {
      businessId,
      noteNumber: {
        startsWith: `${prefix}-${yearMonth}-`
      }
    },
    orderBy: {
      noteNumber: 'desc'
    }
  });

  let sequenceNumber = 1;
  if (lastNote) {
    const parts = lastNote.noteNumber.split('-');
    const lastSequence = parseInt(parts[2], 10);
    if (!isNaN(lastSequence)) {
      sequenceNumber = lastSequence + 1;
    }
  }

  const formattedSequence = String(sequenceNumber).padStart(4, '0');
  return `${prefix}-${yearMonth}-${formattedSequence}`;
}

function validateItems(items) {
  if (!items || items.length === 0) {
    throw new Error('Missing required fields: items');
  }
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const itemNum = i + 1;
    if (!item.description && !item.itemName) {
      throw new Error(`Item ${itemNum}: Description or item name is required`);
    }
    if (!item.hsnCode && !item.sacCode) {
      throw new Error(`Item ${itemNum}: HSN or SAC code is required`);
    }
    if (!item.quantity || parseFloat(item.quantity) < 1) {
      throw new Error(`Item ${itemNum}: Quantity must be at least 1`);
    }
    if (item.unitPrice === undefined || item.unitPrice === null || parseFloat(item.unitPrice) < 0) {
      throw new Error(`Item ${itemNum}: Unit price is required and must be non-negative`);
    }
    if (item.gstRate === undefined || item.gstRate === null) {
      throw new Error(`Item ${itemNum}: GST rate is required`);
    }
  }
}

async function createNote(businessId, noteData) {
  const {
    customerId,
    noteType,
    noteDate,
    originalInvoiceId,
    reason,
    reasonDescription,
    items,
    notes,
    discountAmount = 0
  } = noteData;

  if (!customerId || !noteType || !noteDate || !reason) {
    throw new Error('Missing required fields: customerId, noteType, noteDate, reason');
  }
  if (!VALID_NOTE_TYPES.includes(noteType)) {
    throw new Error('noteType must be "credit" or "debit"');
  }
  if (!VALID_REASONS.includes(reason)) {
    throw new Error(`Invalid reason. Allowed: ${VALID_REASONS.join(', ')}`);
  }
  validateItems(items);

  const noteDateObj = new Date(noteDate);
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  if (noteDateObj > today) {
    throw new Error('Note date cannot be in the future');
  }

  const business = await prisma.business.findUnique({
    where: { id: businessId }
  });
  if (!business) {
    throw new Error('Business not found');
  }

  const customer = await prisma.customer.findFirst({
    where: { id: customerId, businessId, isActive: true }
  });
  if (!customer) {
    throw new Error('Customer not found');
  }

  let originalInvoiceNumber = null;
  let originalInvoiceDate = null;
  let resolvedOriginalInvoiceId = null;

  if (originalInvoiceId) {
    const inv = await prisma.invoice.findFirst({
      where: {
        id: originalInvoiceId,
        businessId,
        customerId,
        isActive: true
      }
    });
    if (!inv) {
      throw new Error('Original invoice not found for this customer');
    }
    resolvedOriginalInvoiceId = inv.id;
    originalInvoiceNumber = inv.invoiceNumber;
    originalInvoiceDate = inv.invoiceDate;
  }

  const invoiceType =
    customer.customerType === 'b2c'
      ? parseFloat(noteData.totalAmount || 0) >= 250000
        ? 'b2c_large'
        : 'b2c_small'
      : customer.customerType;

  const gstCalculation = gstCalculator.calculateInvoiceGST({
    items,
    sellerStateCode: business.stateCode,
    buyerStateCode: customer.stateCode || business.stateCode,
    invoiceType,
    discountAmount
  });

  const noteNumber = await generateNoteNumber(businessId, noteType, noteDateObj);

  const created = await prisma.$transaction(async (tx) => {
    const newNote = await tx.creditDebitNote.create({
      data: {
        businessId,
        customerId,
        noteNumber,
        noteType,
        noteDate: noteDateObj,
        originalInvoiceId: resolvedOriginalInvoiceId,
        originalInvoiceNumber,
        originalInvoiceDate,
        reason,
        reasonDescription: reasonDescription || null,
        subtotal: gstCalculation.subtotal,
        discountAmount: gstCalculation.discountAmount,
        taxableAmount: gstCalculation.taxableAmount,
        cgstAmount: gstCalculation.cgstAmount,
        sgstAmount: gstCalculation.sgstAmount,
        igstAmount: gstCalculation.igstAmount,
        cessAmount: gstCalculation.cessAmount,
        totalTaxAmount: gstCalculation.totalTaxAmount,
        totalAmount: gstCalculation.totalAmount,
        roundOffAmount: gstCalculation.roundOffAmount,
        sellerStateCode: business.stateCode,
        buyerStateCode: customer.stateCode,
        placeOfSupply: customer.state,
        filedInGstr1: false,
        gstr1FilingMonth: null,
        notes: notes || null,
        isActive: true
      }
    });

    for (const calcItem of gstCalculation.items) {
      await tx.creditDebitNoteItem.create({
        data: {
          creditDebitNoteId: newNote.id,
          itemName: calcItem.itemName || calcItem.description || 'Item',
          description: calcItem.description || null,
          hsnCode: calcItem.hsnCode || null,
          sacCode: calcItem.sacCode || null,
          quantity: calcItem.quantity,
          unit: calcItem.unit || 'NOS',
          unitPrice: calcItem.unitPrice,
          discountPercent: calcItem.discountPercent || 0,
          discountAmount: calcItem.discountAmount || 0,
          taxableAmount: calcItem.taxableAmount,
          gstRate: calcItem.gstRate,
          cgstRate: calcItem.cgstRate,
          cgstAmount: calcItem.cgstAmount,
          sgstRate: calcItem.sgstRate,
          sgstAmount: calcItem.sgstAmount,
          igstRate: calcItem.igstRate,
          igstAmount: calcItem.igstAmount,
          cessRate: calcItem.cessRate || 0,
          cessAmount: calcItem.cessAmount || 0,
          totalAmount: calcItem.totalAmount
        }
      });
    }

    return newNote;
  });

  return getNoteById(created.id, businessId);
}

async function getNotes(businessId, params = {}) {
  const {
    page = 1,
    limit = 50,
    search,
    noteType,
    startDate,
    endDate
  } = params;

  const skip = (page - 1) * limit;
  const where = {
    businessId,
    isActive: true
  };

  if (search) {
    where.OR = [
      { noteNumber: { contains: search, mode: 'insensitive' } },
      { customer: { customerName: { contains: search, mode: 'insensitive' } } }
    ];
  }

  if (noteType && VALID_NOTE_TYPES.includes(noteType)) {
    where.noteType = noteType;
  }

  if (startDate || endDate) {
    where.noteDate = {};
    if (startDate) {
      where.noteDate.gte = new Date(startDate);
    }
    if (endDate) {
      where.noteDate.lte = new Date(endDate);
    }
  }

  const [notes, total] = await Promise.all([
    prisma.creditDebitNote.findMany({
      where,
      skip,
      take: limit,
      include: {
        customer: {
          select: {
            id: true,
            customerName: true,
            gstin: true,
            state: true,
            stateCode: true
          }
        },
        items: true
      },
      orderBy: { noteDate: 'desc' }
    }),
    prisma.creditDebitNote.count({ where })
  ]);

  return {
    notes,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 0
    }
  };
}

async function getNoteById(noteId, businessId) {
  const note = await prisma.creditDebitNote.findFirst({
    where: {
      id: noteId,
      businessId,
      isActive: true
    },
    include: {
      items: true,
      customer: true,
      originalInvoice: {
        select: {
          id: true,
          invoiceNumber: true,
          invoiceDate: true,
          totalAmount: true
        }
      }
    }
  });

  if (!note) {
    throw new Error('Credit/debit note not found');
  }

  return note;
}

async function updateNote(noteId, businessId, updateData) {
  const existing = await prisma.creditDebitNote.findFirst({
    where: {
      id: noteId,
      businessId,
      isActive: true
    }
  });

  if (!existing) {
    throw new Error('Credit/debit note not found');
  }

  if (existing.filedInGstr1) {
    throw new Error('Cannot update note that has been filed in GSTR-1');
  }

  if (updateData.reason !== undefined && !VALID_REASONS.includes(updateData.reason)) {
    throw new Error(`Invalid reason. Allowed: ${VALID_REASONS.join(', ')}`);
  }

  if (updateData.noteType !== undefined && !VALID_NOTE_TYPES.includes(updateData.noteType)) {
    throw new Error('noteType must be "credit" or "debit"');
  }

  const targetCustomerId = updateData.customerId || existing.customerId;
  const customer = await prisma.customer.findFirst({
    where: { id: targetCustomerId, businessId, isActive: true }
  });
  if (!customer) {
    throw new Error('Customer not found');
  }

  let originalInvoiceNumber = existing.originalInvoiceNumber;
  let originalInvoiceDate = existing.originalInvoiceDate;
  let resolvedOriginalInvoiceId =
    updateData.originalInvoiceId !== undefined
      ? updateData.originalInvoiceId
      : existing.originalInvoiceId;

  if (updateData.originalInvoiceId !== undefined) {
    if (!updateData.originalInvoiceId) {
      resolvedOriginalInvoiceId = null;
      originalInvoiceNumber = null;
      originalInvoiceDate = null;
    } else {
      const inv = await prisma.invoice.findFirst({
        where: {
          id: updateData.originalInvoiceId,
          businessId,
          customerId: targetCustomerId,
          isActive: true
        }
      });
      if (!inv) {
        throw new Error('Original invoice not found for this customer');
      }
      resolvedOriginalInvoiceId = inv.id;
      originalInvoiceNumber = inv.invoiceNumber;
      originalInvoiceDate = inv.invoiceDate;
    }
  }

  const business = await prisma.business.findUnique({
    where: { id: businessId }
  });
  if (!business) {
    throw new Error('Business not found');
  }

  if (updateData.items && updateData.items.length > 0) {
    validateItems(updateData.items);

    const invoiceType =
      customer.customerType === 'b2c'
        ? parseFloat(updateData.totalAmount || 0) >= 250000
          ? 'b2c_large'
          : 'b2c_small'
        : customer.customerType;

    const gstCalculation = gstCalculator.calculateInvoiceGST({
      items: updateData.items,
      sellerStateCode: business.stateCode,
      buyerStateCode: customer.stateCode || business.stateCode,
      invoiceType,
      discountAmount:
        updateData.discountAmount !== undefined
          ? updateData.discountAmount
          : existing.discountAmount
    });

    const noteDate =
      updateData.noteDate !== undefined ? new Date(updateData.noteDate) : existing.noteDate;
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    if (noteDate > today) {
      throw new Error('Note date cannot be in the future');
    }

    await prisma.$transaction(async (tx) => {
      await tx.creditDebitNoteItem.deleteMany({
        where: { creditDebitNoteId: noteId }
      });

      for (const calcItem of gstCalculation.items) {
        await tx.creditDebitNoteItem.create({
          data: {
            creditDebitNoteId: noteId,
            itemName: calcItem.itemName || calcItem.description || 'Item',
            description: calcItem.description || null,
            hsnCode: calcItem.hsnCode || null,
            sacCode: calcItem.sacCode || null,
            quantity: calcItem.quantity,
            unit: calcItem.unit || 'NOS',
            unitPrice: calcItem.unitPrice,
            discountPercent: calcItem.discountPercent || 0,
            discountAmount: calcItem.discountAmount || 0,
            taxableAmount: calcItem.taxableAmount,
            gstRate: calcItem.gstRate,
            cgstRate: calcItem.cgstRate,
            cgstAmount: calcItem.cgstAmount,
            sgstRate: calcItem.sgstRate,
            sgstAmount: calcItem.sgstAmount,
            igstRate: calcItem.igstRate,
            igstAmount: calcItem.igstAmount,
            cessRate: calcItem.cessRate || 0,
            cessAmount: calcItem.cessAmount || 0,
            totalAmount: calcItem.totalAmount
          }
        });
      }

      await tx.creditDebitNote.update({
        where: { id: noteId },
        data: {
          customerId: targetCustomerId,
          noteType: updateData.noteType !== undefined ? updateData.noteType : undefined,
          noteDate,
          originalInvoiceId: resolvedOriginalInvoiceId,
          originalInvoiceNumber,
          originalInvoiceDate,
          reason: updateData.reason !== undefined ? updateData.reason : undefined,
          reasonDescription:
            updateData.reasonDescription !== undefined
              ? updateData.reasonDescription
              : undefined,
          subtotal: gstCalculation.subtotal,
          discountAmount: gstCalculation.discountAmount,
          taxableAmount: gstCalculation.taxableAmount,
          cgstAmount: gstCalculation.cgstAmount,
          sgstAmount: gstCalculation.sgstAmount,
          igstAmount: gstCalculation.igstAmount,
          cessAmount: gstCalculation.cessAmount,
          totalTaxAmount: gstCalculation.totalTaxAmount,
          totalAmount: gstCalculation.totalAmount,
          roundOffAmount: gstCalculation.roundOffAmount,
          sellerStateCode: business.stateCode,
          buyerStateCode: customer.stateCode,
          placeOfSupply: customer.state,
          notes: updateData.notes !== undefined ? updateData.notes : undefined
        }
      });
    });
  } else {
    const data = {};
    if (updateData.noteDate !== undefined) {
      const nd = new Date(updateData.noteDate);
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      if (nd > today) {
        throw new Error('Note date cannot be in the future');
      }
      data.noteDate = nd;
    }
    if (updateData.noteType !== undefined) {
      data.noteType = updateData.noteType;
    }
    if (updateData.reason !== undefined) {
      data.reason = updateData.reason;
    }
    if (updateData.reasonDescription !== undefined) {
      data.reasonDescription = updateData.reasonDescription;
    }
    if (updateData.notes !== undefined) {
      data.notes = updateData.notes;
    }
    if (updateData.customerId !== undefined) {
      data.customerId = targetCustomerId;
      data.buyerStateCode = customer.stateCode;
      data.placeOfSupply = customer.state;
      if (
        existing.originalInvoiceId &&
        updateData.originalInvoiceId === undefined
      ) {
        const inv = await prisma.invoice.findFirst({
          where: {
            id: existing.originalInvoiceId,
            businessId,
            customerId: targetCustomerId,
            isActive: true
          }
        });
        if (!inv) {
          data.originalInvoiceId = null;
          data.originalInvoiceNumber = null;
          data.originalInvoiceDate = null;
        }
      }
    }
    if (updateData.originalInvoiceId !== undefined) {
      data.originalInvoiceId = resolvedOriginalInvoiceId;
      data.originalInvoiceNumber = originalInvoiceNumber;
      data.originalInvoiceDate = originalInvoiceDate;
    }

    if (Object.keys(data).length > 0) {
      await prisma.creditDebitNote.update({
        where: { id: noteId },
        data
      });
    }
  }

  return getNoteById(noteId, businessId);
}

async function deleteNote(noteId, businessId) {
  const note = await prisma.creditDebitNote.findFirst({
    where: {
      id: noteId,
      businessId,
      isActive: true
    }
  });

  if (!note) {
    throw new Error('Credit/debit note not found');
  }

  if (note.filedInGstr1) {
    throw new Error('Cannot delete note that has been filed in GSTR-1');
  }

  await prisma.creditDebitNote.update({
    where: { id: noteId },
    data: { isActive: false }
  });

  return { success: true, message: 'Credit/debit note deleted successfully' };
}

module.exports = {
  generateNoteNumber,
  createNote,
  getNotes,
  getNoteById,
  updateNote,
  deleteNote
};
