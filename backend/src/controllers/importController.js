/**
 * Bulk CSV Import Controller (Phase 3: Bulk CSV import)
 *
 * Wired into the existing customer/supplier/product routers. Import handlers
 * accept a multipart CSV (field 'file'); template handlers return a CSV file.
 */

const importService = require('../services/importService');
const auditService = require('../services/auditService');

async function resolveBusiness(req, res) {
  const prisma = require('../config/database');
  const business = await prisma.business.findFirst({
    where: { userId: req.user.userId, isActive: true }
  });
  if (!business) {
    res.status(404).json({ success: false, error: 'No active business found' });
    return null;
  }
  return business;
}

function getCsvText(req, res) {
  if (!req.file || !req.file.buffer) {
    res.status(400).json({
      success: false,
      error: 'No CSV file provided. Use multipart/form-data with field name "file".'
    });
    return null;
  }
  return req.file.buffer.toString('utf-8');
}

function sendTemplate(res, kind) {
  const csv = importService.getTemplate(kind);
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${kind}-import-template.csv"`);
  return res.status(200).send(csv);
}

async function importEntity(req, res, entity, importFn) {
  try {
    const business = await resolveBusiness(req, res);
    if (!business) return;
    const csvText = getCsvText(req, res);
    if (csvText === null) return;

    const result = await importFn(business.id, csvText);
    auditService.logAudit({
      businessId: business.id, userId: req.user.userId,
      action: 'import', entityType: entity,
      details: { created: result.created, skipped: result.skipped }
    }).catch(() => {});
    return res.status(200).json(result);
  } catch (error) {
    console.error(`Import ${entity} error:`, error);
    return res.status(500).json({ success: false, error: `Failed to import ${entity}` });
  }
}

const importCustomers = (req, res) =>
  importEntity(req, res, 'customer', importService.importCustomers);
const importSuppliers = (req, res) =>
  importEntity(req, res, 'supplier', importService.importSuppliers);
const importProducts = (req, res) =>
  importEntity(req, res, 'product', importService.importProducts);

const customerTemplate = (req, res) => sendTemplate(res, 'customers');
const supplierTemplate = (req, res) => sendTemplate(res, 'suppliers');
const productTemplate = (req, res) => sendTemplate(res, 'products');

module.exports = {
  importCustomers,
  importSuppliers,
  importProducts,
  customerTemplate,
  supplierTemplate,
  productTemplate
};
