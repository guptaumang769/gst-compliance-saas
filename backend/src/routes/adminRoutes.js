/**
 * Admin Routes (Phase 3: Admin) — OWNER only.
 *
 * This is a per-business account admin panel. A cross-tenant platform
 * super-admin would be a separate, independently authorised service.
 */

const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');

router.use(authenticateToken);
router.use(requireRole('OWNER'));

router.get('/overview', adminController.getOverview);
router.get('/activity', adminController.getActivity);
router.get('/health', adminController.getHealth);

module.exports = router;
