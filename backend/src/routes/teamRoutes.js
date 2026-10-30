/**
 * Team Routes
 * Multi-user roles (Week: Team Management)
 */

const express = require('express');
const router = express.Router();
const teamController = require('../controllers/teamController');
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');

// All team routes require authentication
router.use(authenticateToken);

// GET /api/team - list team members (any authenticated role)
router.get('/', teamController.getTeam);

// POST /api/team/invite - invite a new member (OWNER only)
router.post('/invite', requireRole('OWNER'), teamController.inviteMember);

// PUT /api/team/:id/role - change a member's role (OWNER only)
router.put('/:id/role', requireRole('OWNER'), teamController.updateRole);

// DELETE /api/team/:id - soft-remove a member (OWNER only)
router.delete('/:id', requireRole('OWNER'), teamController.removeMember);

module.exports = router;
