/**
 * GST Validation Utilities
 * This file contains functions to validate GSTIN, PAN, and other GST-related fields
 * ✅ CRITICAL GST INTEGRATION POINT
 */

/**
 * Validate GSTIN format and checksum
 * GSTIN Format: 22AAAAA0000A1Z5
 * - 2 digits: State code (01-37)
 * - 10 characters: PAN number
 * - 1 character: Entity number (1-9, A-Z)
 * - 1 character: 'Z' (default)
 * - 1 character: Checksum digit
 * 
 * @param {string} gstin - The GSTIN to validate
 * @returns {object} - { valid: boolean, message: string, details: object }
 */
function validateGSTIN(gstin) {
  // Remove spaces and convert to uppercase
  gstin = gstin?.trim().toUpperCase() || '';
  
  // Check length
  if (gstin.length !== 15) {
    return {
      valid: false,
      message: 'GSTIN must be exactly 15 characters',
      details: { length: gstin.length }
    };
  }
  
  // Check format: 2 digits + 10 alphanumeric + 1 alphanumeric + 1 letter 'Z' + 1 alphanumeric
  const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  
  if (!gstinRegex.test(gstin)) {
    return {
      valid: false,
      message: 'Invalid GSTIN format',
      details: { 
        expected: '22AAAAA0000A1Z5',
        received: gstin 
      }
    };
  }
  
  // Extract state code
  const stateCode = gstin.substring(0, 2);
  const stateCodeNum = parseInt(stateCode, 10);
  
  // Validate state code (01-37, 97, 99)
  const validStateCodes = [
    ...Array.from({ length: 37 }, (_, i) => i + 1), // 01-37
    97, // Center Jurisdiction (Other Territory)
    99  // Center Jurisdiction
  ];
  
  if (!validStateCodes.includes(stateCodeNum)) {
    return {
      valid: false,
      message: 'Invalid state code in GSTIN',
      details: { stateCode: stateCode }
    };
  }
  
  // Extract PAN
  const pan = gstin.substring(2, 12);
  
  // Validate checksum (simplified - full implementation would use actual checksum algorithm)
  // For now, we'll do basic validation
  // TODO: Implement full checksum validation (Week 2)
  const checksumChar = gstin.charAt(14);
  
  return {
    valid: true,
    message: 'Valid GSTIN',
    details: {
      stateCode: stateCode,
      pan: pan,
      entityNumber: gstin.charAt(12),
      checksumDigit: checksumChar,
      stateName: getStateName(stateCode)
    }
  };
}

/**
 * Validate PAN format
 * PAN Format: AAAAA9999A
 * - 5 letters (uppercase)
 * - 4 digits
 * - 1 letter (uppercase)
 * 
 * @param {string} pan - The PAN to validate
 * @returns {object} - { valid: boolean, message: string }
 */
function validatePAN(pan) {
  pan = pan?.trim().toUpperCase() || '';
  
  if (pan.length !== 10) {
    return {
      valid: false,
      message: 'PAN must be exactly 10 characters'
    };
  }
  
  const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
  
  if (!panRegex.test(pan)) {
    return {
      valid: false,
      message: 'Invalid PAN format'
    };
  }
  
  return {
    valid: true,
    message: 'Valid PAN'
  };
}

/**
 * Extract state code from GSTIN
 * @param {string} gstin - The GSTIN
 * @returns {string|null} - State code (2 digits) or null if invalid
 */
function extractStateCode(gstin) {
  if (!gstin || gstin.length < 2) {
    return null;
  }
  return gstin.substring(0, 2);
}

/**
 * Extract PAN from GSTIN
 * @param {string} gstin - The GSTIN
 * @returns {string|null} - PAN (10 characters) or null if invalid
 */
function extractPAN(gstin) {
  if (!gstin || gstin.length < 12) {
    return null;
  }
  return gstin.substring(2, 12);
}

/**
 * Get state name from state code
 * @param {string} stateCode - 2-digit state code
 * @returns {string} - State name or 'Unknown'
 */
function getStateName(stateCode) {
  const stateMap = {
    '01': 'Jammu and Kashmir',
    '02': 'Himachal Pradesh',
    '03': 'Punjab',
    '04': 'Chandigarh',
    '05': 'Uttarakhand',
    '06': 'Haryana',
    '07': 'Delhi',
    '08': 'Rajasthan',
    '09': 'Uttar Pradesh',
    '10': 'Bihar',
    '11': 'Sikkim',
    '12': 'Arunachal Pradesh',
    '13': 'Nagaland',
    '14': 'Manipur',
    '15': 'Mizoram',
    '16': 'Tripura',
    '17': 'Meghalaya',
    '18': 'Assam',
    '19': 'West Bengal',
    '20': 'Jharkhand',
    '21': 'Odisha',
    '22': 'Chhattisgarh',
    '23': 'Madhya Pradesh',
    '24': 'Gujarat',
    '25': 'Daman and Diu',
    '26': 'Dadra and Nagar Haveli',
    '27': 'Maharashtra',
    '28': 'Andhra Pradesh (Old)',
    '29': 'Karnataka',
    '30': 'Goa',
    '31': 'Lakshadweep',
    '32': 'Kerala',
    '33': 'Tamil Nadu',
    '34': 'Puducherry',
    '35': 'Andaman and Nicobar Islands',
    '36': 'Telangana',
    '37': 'Andhra Pradesh (New)',
    '97': 'Other Territory',
    '99': 'Centre Jurisdiction'
  };
  
  return stateMap[stateCode] || 'Unknown';
}

/**
 * Validate HSN/SAC code
 * HSN: 4-8 digits (for goods)
 * SAC: 6 digits (for services)
 * 
 * @param {string} code - HSN or SAC code
 * @param {string} type - 'goods' or 'services'
 * @returns {object} - { valid: boolean, message: string }
 */
function validateHSNSAC(code, type = 'goods') {
  code = code?.trim() || '';
  
  if (type === 'services') {
    // SAC: exactly 6 digits
    if (!/^[0-9]{6}$/.test(code)) {
      return {
        valid: false,
        message: 'SAC code must be exactly 6 digits'
      };
    }
  } else {
    // HSN: 4-8 digits
    if (!/^[0-9]{4,8}$/.test(code)) {
      return {
        valid: false,
        message: 'HSN code must be 4-8 digits'
      };
    }
  }
  
  return {
    valid: true,
    message: type === 'services' ? 'Valid SAC code' : 'Valid HSN code'
  };
}

/**
 * Validate GST rate
 * Valid rates: 0, 0.1, 0.25, 3, 5, 12, 18, 28
 * 
 * @param {number} rate - GST rate percentage
 * @returns {object} - { valid: boolean, message: string }
 */
function validateGSTRate(rate) {
  const validRates = [0, 0.1, 0.25, 3, 5, 12, 18, 28];
  
  if (!validRates.includes(Number(rate))) {
    return {
      valid: false,
      message: `Invalid GST rate. Valid rates are: ${validRates.join(', ')}%`
    };
  }
  
  return {
    valid: true,
    message: 'Valid GST rate'
  };
}

module.exports = {
  validateGSTIN,
  validatePAN,
  extractStateCode,
  extractPAN,
  getStateName,
  validateHSNSAC,
  validateGSTRate
};
