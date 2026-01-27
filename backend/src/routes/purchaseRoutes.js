/**
 * Purchase Routes
 * API endpoints for purchase invoice management
 */

const express = require('express');
const router = express.Router();
const purchaseController = require('../controllers/purchaseController');
const { authenticate } = require('../middleware/authMiddleware');

// All purchase routes require authentication
router.use(authenticate);

// Purchase CRUD operations
router.post('/', purchaseController.createPurchase);
router.get('/', purchaseController.getPurchases);
router.get('/stats', purchaseController.getPurchaseStats);
router.get('/itc/:year/:month', purchaseController.calculateItcForPeriod);
router.get('/:id', purchaseController.getPurchaseById);
router.put('/:id', purchaseController.updatePurchase);
router.delete('/:id', purchaseController.deletePurchase);

module.exports = router;
