/**
 * Team Controller
 * Multi-user roles (Week: Team Management)
 * Handles HTTP requests for team management operations.
 */

const teamService = require('../services/teamService');
const auditService = require('../services/auditService');

/**
 * GET /api/team
 * List all users in the caller's business.
 */
async function getTeam(req, res) {
  try {
    const business = await teamService.getOwnerBusiness(req.user.userId);
    const result = await teamService.listTeam(business.id);
    return res.status(200).json(result);
  } catch (error) {
    console.error('Get team error:', error);
    return res.status(400).json({ success: false, error: error.message || 'Failed to fetch team' });
  }
}

/**
 * POST /api/team/invite
 * Invite a new user (OWNER only).
 */
async function inviteMember(req, res) {
  try {
    const business = await teamService.getOwnerBusiness(req.user.userId);
    const { email, name, role } = req.body;

    const result = await teamService.inviteUser(business.id, { email, name, role });

    await auditService.logAudit({
      businessId: business.id,
      userId: req.user.userId,
      action: 'invite',
      entityType: 'user',
      entityId: result.user.id,
      details: { email, role: result.user.role }
    });

    return res.status(201).json(result);
  } catch (error) {
    console.error('Invite member error:', error);
    return res.status(400).json({ success: false, error: error.message || 'Failed to invite team member' });
  }
}

/**
 * PUT /api/team/:id/role
 * Change a user's role (OWNER only).
 */
async function updateRole(req, res) {
  try {
    const business = await teamService.getOwnerBusiness(req.user.userId);
    const { role } = req.body;

    const result = await teamService.updateUserRole(business.id, req.params.id, role);

    await auditService.logAudit({
      businessId: business.id,
      userId: req.user.userId,
      action: 'role_change',
      entityType: 'user',
      entityId: req.params.id,
      details: { role: result.user.role }
    });

    return res.status(200).json(result);
  } catch (error) {
    console.error('Update role error:', error);
    return res.status(400).json({ success: false, error: error.message || 'Failed to update role' });
  }
}

/**
 * DELETE /api/team/:id
 * Soft-remove a team member (OWNER only).
 */
async function removeMember(req, res) {
  try {
    const business = await teamService.getOwnerBusiness(req.user.userId);

    const result = await teamService.removeUser(business.id, req.params.id, req.user.userId);

    await auditService.logAudit({
      businessId: business.id,
      userId: req.user.userId,
      action: 'delete',
      entityType: 'user',
      entityId: req.params.id
    });

    return res.status(200).json(result);
  } catch (error) {
    console.error('Remove member error:', error);
    return res.status(400).json({ success: false, error: error.message || 'Failed to remove team member' });
  }
}

module.exports = {
  getTeam,
  inviteMember,
  updateRole,
  removeMember
};
