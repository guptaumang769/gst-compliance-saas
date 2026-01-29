/**
 * Authentication Service
 * Handles business logic for user authentication
 * Week 2: Authentication Module
 */

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const prisma = require('../config/database');
const { validateGSTIN, validatePAN, extractStateCode } = require('../utils/gstValidation');

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
    
    // 10. Generate JWT token
    const token = generateToken(result.user);
    
    // 11. Return user data (without password)
    return {
      success: true,
      message: 'Registration successful',
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
      throw new Error('Invalid email or password');
    }
    
    // 2. Check if user is active
    if (!user.isActive) {
      throw new Error('Account is deactivated. Please contact support.');
    }
    
    // 3. Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    
    if (!isPasswordValid) {
      throw new Error('Invalid email or password');
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
            invoiceCountCurrentMonth: true
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

module.exports = {
  register,
  login,
  getUserProfile,
  generateToken,
  verifyToken,
  changePassword
};
