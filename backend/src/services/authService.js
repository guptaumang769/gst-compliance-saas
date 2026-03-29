/**
 * Authentication Service
 * Handles business logic for user authentication
 * Week 2: Authentication Module
 */

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const prisma = require('../config/database');
const { validateGSTIN, validatePAN, extractStateCode } = require('../utils/gstValidation');
const { sendVerificationEmail, sendPasswordResetEmail } = require('./emailService');

/**
 * Register a new user with business details
 * ✅ GST Integration: Validates GSTIN during registration
 */
async function register(userData) {
  const { 
    email, 
    password, 
    businessName, 
    gstin, 
    pan, 
    state, 
    addressLine1,
    addressLine2,
    city,
    pincode,
    phone,
    businessEmail,
    businessType
  } = userData;
  
  try {
    // 1. Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('Invalid email format');
    }
    
    // 2. Validate password strength
    if (password.length < 8) {
      throw new Error('Password must be at least 8 characters long');
    }
    
    // 3. ✅ Validate GSTIN format (CRITICAL GST VALIDATION)
    const gstinValidation = validateGSTIN(gstin);
    if (!gstinValidation.valid) {
      throw new Error(`Invalid GSTIN: ${gstinValidation.message}`);
    }
    
    // 4. ✅ Validate PAN format
    const panValidation = validatePAN(pan);
    if (!panValidation.valid) {
      throw new Error(`Invalid PAN: ${panValidation.message}`);
    }
    
    // 5. ✅ Extract and verify state code from GSTIN
    const stateCodeFromGSTIN = extractStateCode(gstin);
    
    // 6. Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });
    
    if (existingUser) {
      throw new Error('User with this email already exists');
    }
    
    // 7. Check if GSTIN already registered
    const existingBusiness = await prisma.business.findUnique({
      where: { gstin }
    });
    
    if (existingBusiness) {
      throw new Error('This GSTIN is already registered');
    }
    
    // 8. Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    
    // 9. Create user and business in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create user
      const user = await tx.user.create({
        data: {
          email,
          passwordHash,
          emailVerified: false,
          role: 'owner',
          isActive: true
        }
      });
      
      // Create business
      const business = await tx.business.create({
        data: {
          userId: user.id,
          businessName,
          gstin,
          pan,
          stateCode: stateCodeFromGSTIN,
          state,
          registrationDate: new Date(),
          addressLine1,
          addressLine2: addressLine2 || null,
          city,
          pincode,
          businessType: businessType || 'Proprietorship',
          filingFrequency: 'monthly',
          phone: phone || null,
          email: businessEmail || email
        }
      });
      
      return { user, business };
    });
    
    // 10. Generate email verification token and send email
    const verificationToken = crypto.randomBytes(32).toString('hex');
    await prisma.user.update({
      where: { id: result.user.id },
      data: { emailVerificationToken: verificationToken }
    });

    try {
      const emailResult = await sendVerificationEmail(email, verificationToken, businessName);
      console.log('[Auth] Verification email sent successfully:', emailResult.messageId);
    } catch (emailError) {
      console.error('[Auth] ❌ FAILED to send verification email:');
      console.error('[Auth]   Error:', emailError.message);
      if (emailError.code) console.error('[Auth]   Code:', emailError.code);
      if (emailError.command) console.error('[Auth]   Command:', emailError.command);
    }

    // 11. Start trial subscription for the business
    const trialEndDate = new Date();
    trialEndDate.setDate(trialEndDate.getDate() + 14);
    await prisma.business.update({
      where: { id: result.business.id },
      data: {
        subscriptionPlan: 'trial',
        subscriptionStatus: 'trial',
        subscriptionValidUntil: trialEndDate,
        invoiceLimit: 10,
        invoiceCountCurrentMonth: 0
      }
    });

    // 12. Generate JWT token
    const token = generateToken(result.user);
    
    // 13. Return user data (without password)
    return {
      success: true,
      message: 'Registration successful. Please check your email to verify your account.',
      token,
      user: {
        id: result.user.id,
        email: result.user.email,
        role: result.user.role,
        emailVerified: result.user.emailVerified
      },
      business: {
        id: result.business.id,
        businessName: result.business.businessName,
        gstin: result.business.gstin,
        state: result.business.state,
        stateCode: result.business.stateCode
      }
    };
    
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
}

/**
 * Login user with email and password
 */
async function login(email, password) {
  try {
    // 1. Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        businesses: {
          select: {
            id: true,
            businessName: true,
            gstin: true,
            state: true,
            stateCode: true
          }
        }
      }
    });
    
    if (!user) {
      throw new Error('Email not registered. Please sign up first.');
    }
    
    // 2. Check if user is active
    if (!user.isActive) {
      throw new Error('Account is deactivated. Please contact support.');
    }
    
    // 3. Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    
    if (!isPasswordValid) {
      throw new Error('Invalid password. Please try again.');
    }
    
    // 4. Update last login timestamp
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() }
    });
    
    // 5. Generate JWT token
    const token = generateToken(user);
    
    // 6. Return user data (without password)
    return {
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        emailVerified: user.emailVerified,
        lastLogin: new Date()
      },
      businesses: user.businesses
    };
    
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
}

/**
 * Get user profile by ID
 */
async function getUserProfile(userId) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        emailVerified: true,
        isActive: true,
        lastLogin: true,
        createdAt: true,
        businesses: {
          select: {
            id: true,
            businessName: true,
            gstin: true,
            pan: true,
            state: true,
            stateCode: true,
            phone: true,
            email: true,
            businessType: true,
            filingFrequency: true,
            subscriptionPlan: true,
            subscriptionStatus: true,
            invoiceLimit: true,
            invoiceCountCurrentMonth: true,
            addressLine1: true,
            addressLine2: true,
            city: true,
            pincode: true,
            tradeName: true,
            registrationDate: true,
            bankName: true,
            bankAccountNumber: true,
            bankIfsc: true,
            bankBranch: true,
          }
        }
      }
    });
    
    if (!user) {
      throw new Error('User not found');
    }
    
    return {
      success: true,
      user
    };
    
  } catch (error) {
    console.error('Get profile error:', error);
    throw error;
  }
}

/**
 * Generate JWT token
 */
function generateToken(user) {
  const payload = {
    userId: user.id,
    email: user.email,
    role: user.role
  };
  
  const secret = process.env.JWT_SECRET;
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
  
  if (!secret) {
    throw new Error('JWT_SECRET is not defined in environment variables');
  }
  
  const token = jwt.sign(payload, secret, { expiresIn });
  
  return token;
}

/**
 * Verify JWT token
 */
function verifyToken(token) {
  try {
    const secret = process.env.JWT_SECRET;
    
    if (!secret) {
      throw new Error('JWT_SECRET is not defined');
    }
    
    const decoded = jwt.verify(token, secret);
    return decoded;
    
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Token has expired');
    }
    if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid token');
    }
    throw error;
  }
}

/**
 * Change password
 */
async function changePassword(userId, oldPassword, newPassword) {
  try {
    // 1. Find user
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });
    
    if (!user) {
      throw new Error('User not found');
    }
    
    // 2. Verify old password
    const isOldPasswordValid = await bcrypt.compare(oldPassword, user.passwordHash);
    
    if (!isOldPasswordValid) {
      throw new Error('Current password is incorrect');
    }
    
    // 3. Validate new password
    if (newPassword.length < 8) {
      throw new Error('New password must be at least 8 characters long');
    }
    
    // 4. Hash new password
    const saltRounds = 10;
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);
    
    // 5. Update password
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newPasswordHash }
    });
    
    return {
      success: true,
      message: 'Password changed successfully'
    };
    
  } catch (error) {
    console.error('Change password error:', error);
    throw error;
  }
}

/**
 * Update user and business profile
 */
async function updateProfile(userId, profileData) {
  try {
    const { phone, businessName, addressLine1, addressLine2, city, state, pincode, businessType, businessEmail, userEmail } = profileData;

    // If updating the user's login email
    if (userEmail) {
      // Check if the new email is already taken by another user
      const existingUser = await prisma.user.findFirst({
        where: { email: userEmail, id: { not: userId } }
      });
      if (existingUser) {
        throw new Error('This email is already used by another account');
      }
      await prisma.user.update({
        where: { id: userId },
        data: { email: userEmail }
      });
      return {
        success: true,
        message: 'User email updated successfully',
      };
    }

    // Find the user's active business
    const business = await prisma.business.findFirst({
      where: { userId, isActive: true }
    });

    if (!business) {
      throw new Error('No active business found');
    }

    // Update business data
    const businessUpdateData = {};
    if (businessName) businessUpdateData.businessName = businessName;
    if (addressLine1) businessUpdateData.addressLine1 = addressLine1;
    if (addressLine2 !== undefined) businessUpdateData.addressLine2 = addressLine2;
    if (city) businessUpdateData.city = city;
    if (state) businessUpdateData.state = state;
    if (pincode) businessUpdateData.pincode = pincode;
    if (businessType) businessUpdateData.businessType = businessType;
    if (phone !== undefined) {
      if (phone && !/^\+?[0-9]{10,15}$/.test(phone)) {
        throw new Error('Invalid phone number. Must be 10-15 digits.');
      }
      businessUpdateData.phone = phone;
    }
    if (businessEmail !== undefined) businessUpdateData.email = businessEmail;

    const updatedBusiness = await prisma.business.update({
      where: { id: business.id },
      data: businessUpdateData
    });

    return {
      success: true,
      message: 'Profile updated successfully',
      business: updatedBusiness
    };
  } catch (error) {
    console.error('Update profile error:', error);
    throw error;
  }
}

/**
 * Verify email with token
 */
async function verifyEmail(token) {
  if (!token) {
    throw new Error('Verification token is required');
  }

  const user = await prisma.user.findFirst({
    where: { emailVerificationToken: token }
  });

  if (!user) {
    throw new Error('Invalid or expired verification token');
  }

  if (user.emailVerified) {
    return { success: true, message: 'Email already verified' };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerified: true,
      emailVerificationToken: null
    }
  });

  return { success: true, message: 'Email verified successfully' };
}

/**
 * Resend verification email
 */
async function resendVerificationEmail(email) {
  const user = await prisma.user.findUnique({
    where: { email },
    include: { businesses: { select: { businessName: true }, take: 1 } }
  });

  if (!user) {
    console.log('[Auth] Resend verification: user not found for email:', email);
    throw new Error('User not found');
  }

  if (user.emailVerified) {
    console.log('[Auth] Resend verification: email already verified for:', email);
    return { success: true, alreadyVerified: true, message: 'Your email is already verified. You can log in directly.' };
  }

  console.log('[Auth] Resend verification: generating new token for:', email);
  const verificationToken = crypto.randomBytes(32).toString('hex');
  await prisma.user.update({
    where: { id: user.id },
    data: { emailVerificationToken: verificationToken }
  });

  const businessName = user.businesses?.[0]?.businessName || '';
  try {
    const emailResult = await sendVerificationEmail(email, verificationToken, businessName);
    console.log('[Auth] Resend verification email sent successfully:', emailResult.messageId);
  } catch (emailError) {
    console.error('[Auth] ❌ FAILED to resend verification email:');
    console.error('[Auth]   Error:', emailError.message);
    if (emailError.code) console.error('[Auth]   Code:', emailError.code);
    throw new Error('Failed to send verification email. Please try again.');
  }

  return { success: true, alreadyVerified: false, message: 'Verification email sent. Please check your inbox and spam folder.' };
}

/**
 * Request password reset
 */
async function forgotPassword(email) {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    return { success: false, notRegistered: true, message: 'No account found with this email address. Please register first.' };
  }

  const resetToken = crypto.randomBytes(32).toString('hex');
  const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordResetToken: resetToken,
      passwordResetExpires: resetExpires
    }
  });

  try {
    const emailResult = await sendPasswordResetEmail(email, resetToken);
    console.log('[Auth] Password reset email sent successfully:', emailResult.messageId);
  } catch (emailError) {
    console.error('[Auth] ❌ FAILED to send password reset email:');
    console.error('[Auth]   Error:', emailError.message);
    if (emailError.code) console.error('[Auth]   Code:', emailError.code);
    if (emailError.command) console.error('[Auth]   Command:', emailError.command);
  }

  return { success: true, message: 'If this email exists, a reset link has been sent.' };
}

/**
 * Reset password with token
 */
async function resetPassword(token, newPassword) {
  if (!token) {
    throw new Error('Reset token is required');
  }

  if (!newPassword || newPassword.length < 8) {
    throw new Error('Password must be at least 8 characters long');
  }

  const user = await prisma.user.findFirst({
    where: {
      passwordResetToken: token,
      passwordResetExpires: { gt: new Date() }
    }
  });

  if (!user) {
    throw new Error('Invalid or expired reset token');
  }

  const saltRounds = 10;
  const passwordHash = await bcrypt.hash(newPassword, saltRounds);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      passwordResetToken: null,
      passwordResetExpires: null
    }
  });

  return { success: true, message: 'Password reset successfully. You can now login with your new password.' };
}

/**
 * Update business settings (bank details, filing frequency, notification preferences)
 */
async function updateBusinessSettings(userId, settingsData) {
  const business = await prisma.business.findFirst({
    where: { userId, isActive: true }
  });

  if (!business) {
    throw new Error('No active business found');
  }

  const updateData = {};

  if (settingsData.bankName !== undefined) updateData.bankName = settingsData.bankName;
  if (settingsData.bankAccountNumber !== undefined) updateData.bankAccountNumber = settingsData.bankAccountNumber;
  if (settingsData.bankIfsc !== undefined) updateData.bankIfsc = settingsData.bankIfsc;
  if (settingsData.bankBranch !== undefined) updateData.bankBranch = settingsData.bankBranch;
  if (settingsData.filingFrequency !== undefined) updateData.filingFrequency = settingsData.filingFrequency;

  const updated = await prisma.business.update({
    where: { id: business.id },
    data: updateData
  });

  return {
    success: true,
    message: 'Settings updated successfully',
    business: updated
  };
}

module.exports = {
  register,
  login,
  getUserProfile,
  generateToken,
  verifyToken,
  changePassword,
  updateProfile,
  verifyEmail,
  resendVerificationEmail,
  forgotPassword,
  resetPassword,
  updateBusinessSettings
};
