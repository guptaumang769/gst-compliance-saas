/**
 * Team Service
 * Multi-user roles (Week: Team Management)
 *
 * Handles listing team members, inviting users to a business, changing roles
 * and (soft) removing members. Roles are stored as uppercase strings:
 *   OWNER | ACCOUNTANT | VIEWER
 * (legacy lowercase "owner" is treated case-insensitively elsewhere).
 */

const bcrypt = require('bcrypt');
const crypto = require('crypto');
const prisma = require('../config/database');
const emailService = require('./emailService');

const VALID_ROLES = ['OWNER', 'ACCOUNTANT', 'VIEWER'];

function normalizeRole(role) {
  return String(role || '').toUpperCase();
}

/**
 * Resolve the business owned by the given user (the tenant scope for the team).
 */
async function getOwnerBusiness(userId) {
  const business = await prisma.business.findFirst({
    where: { userId, isActive: true }
  });
  if (!business) {
    throw new Error('No active business found');
  }
  return business;
}

function toTeamMember(user) {
  return {
    id: user.id,
    name: user.name || null,
    email: user.email,
    role: normalizeRole(user.role) || 'OWNER',
    createdAt: user.createdAt
  };
}

/**
 * List users belonging to a business (owner + invited members).
 */
async function listTeam(businessId) {
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    include: {
      user: true,
      members: {
        where: { isActive: true }
      }
    }
  });

  if (!business) {
    throw new Error('Business not found');
  }

  const seen = new Set();
  const team = [];

  // Owner first
  if (business.user && business.user.isActive) {
    team.push(toTeamMember(business.user));
    seen.add(business.user.id);
  }

  for (const member of business.members) {
    if (!seen.has(member.id)) {
      team.push(toTeamMember(member));
      seen.add(member.id);
    }
  }

  return { success: true, team };
}

/**
 * Generate a reasonably strong temporary password (satisfies 8+ char minimum).
 */
function generateTempPassword() {
  return `Gst@${crypto.randomBytes(4).toString('hex')}`;
}

/**
 * Invite a new user into a business with a generated temporary password.
 */
async function inviteUser(businessId, { email, name, role }) {
  if (!email) {
    throw new Error('Email is required');
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new Error('Invalid email format');
  }

  const normalizedRole = normalizeRole(role) || 'VIEWER';
  if (!VALID_ROLES.includes(normalizedRole)) {
    throw new Error(`Invalid role. Must be one of: ${VALID_ROLES.join(', ')}`);
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new Error('A user with this email already exists');
  }

  const business = await prisma.business.findUnique({ where: { id: businessId } });
  if (!business) {
    throw new Error('Business not found');
  }

  const tempPassword = generateTempPassword();
  const passwordHash = await bcrypt.hash(tempPassword, 10);

  const user = await prisma.user.create({
    data: {
      email,
      name: name || null,
      passwordHash,
      emailVerified: true, // invited users are pre-verified
      role: normalizedRole,
      isActive: true,
      memberBusinessId: businessId
    }
  });

  // Best-effort invite email (falls back to Ethereal/console when SMTP absent)
  try {
    await emailService.sendTeamInviteEmail(email, {
      name,
      tempPassword,
      businessName: business.businessName,
      role: normalizedRole
    });
  } catch (emailErr) {
    console.error('[Team] Failed to send invite email:', emailErr.message);
  }

  return {
    success: true,
    message: 'Team member invited successfully',
    user: toTeamMember(user),
    tempPassword
  };
}

/**
 * Get the set of user ids belonging to a business (owner + members).
 */
async function getBusinessUser(businessId, targetUserId) {
  const business = await prisma.business.findUnique({ where: { id: businessId } });
  if (!business) {
    throw new Error('Business not found');
  }

  const user = await prisma.user.findUnique({ where: { id: targetUserId } });
  if (!user) {
    throw new Error('User not found');
  }

  const belongs = business.userId === targetUserId || user.memberBusinessId === businessId;
  if (!belongs) {
    throw new Error('User is not part of this business');
  }

  return { business, user };
}

/**
 * Change a user's role.
 */
async function updateUserRole(businessId, targetUserId, role) {
  const normalizedRole = normalizeRole(role);
  if (!VALID_ROLES.includes(normalizedRole)) {
    throw new Error(`Invalid role. Must be one of: ${VALID_ROLES.join(', ')}`);
  }

  const { business } = await getBusinessUser(businessId, targetUserId);

  // Do not allow demoting the sole owner of the business
  if (business.userId === targetUserId && normalizedRole !== 'OWNER') {
    throw new Error('Cannot change the role of the business owner');
  }

  const updated = await prisma.user.update({
    where: { id: targetUserId },
    data: { role: normalizedRole }
  });

  return {
    success: true,
    message: 'Role updated successfully',
    user: toTeamMember(updated)
  };
}

/**
 * Soft-remove a team member (cannot remove self or the business owner).
 */
async function removeUser(businessId, targetUserId, actingUserId) {
  const { business } = await getBusinessUser(businessId, targetUserId);

  if (targetUserId === actingUserId) {
    throw new Error('You cannot remove yourself');
  }

  if (business.userId === targetUserId) {
    throw new Error('Cannot remove the business owner');
  }

  await prisma.user.update({
    where: { id: targetUserId },
    data: {
      isActive: false,
      deletedAt: new Date()
    }
  });

  return {
    success: true,
    message: 'Team member removed successfully'
  };
}

module.exports = {
  VALID_ROLES,
  getOwnerBusiness,
  listTeam,
  inviteUser,
  updateUserRole,
  removeUser
};
