/**
 * HSN/SAC Code Validator
 * Week 3-4: Invoice Management
 * 
 * HSN (Harmonized System of Nomenclature): For goods (4-8 digits)
 * SAC (Service Accounting Code): For services (6 digits)
 */

/**
 * Validate HSN code format
 * HSN can be 4, 6, or 8 digits
 * 
 * @param {string} hsnCode - HSN code to validate
 * @returns {Object} Validation result
 */
function validateHSN(hsnCode) {
  if (!hsnCode) {
    return {
      valid: false,
      message: 'HSN code is required'
    };
  }
  
  // Remove spaces and convert to string
  const hsn = String(hsnCode).replace(/\s/g, '');
  
  // HSN should be 4, 6, or 8 digits
  const regex = /^\d{4}$|^\d{6}$|^\d{8}$/;
  
  if (!regex.test(hsn)) {
    return {
      valid: false,
      message: 'HSN code must be 4, 6, or 8 digits'
    };
  }
  
  return {
    valid: true,
    message: 'Valid HSN code',
    hsn,
    length: hsn.length
  };
}

/**
 * Validate SAC code format
 * SAC must be 6 digits
 * 
 * @param {string} sacCode - SAC code to validate
 * @returns {Object} Validation result
 */
function validateSAC(sacCode) {
  if (!sacCode) {
    return {
      valid: false,
      message: 'SAC code is required'
    };
  }
  
  // Remove spaces and convert to string
  const sac = String(sacCode).replace(/\s/g, '');
  
  // SAC should be 6 digits
  const regex = /^\d{6}$/;
  
  if (!regex.test(sac)) {
    return {
      valid: false,
      message: 'SAC code must be 6 digits'
    };
  }
  
  return {
    valid: true,
    message: 'Valid SAC code',
    sac,
    length: sac.length
  };
}

/**
 * Determine if code is HSN or SAC
 * 
 * @param {string} code - Code to check
 * @returns {string} 'HSN', 'SAC', or 'UNKNOWN'
 */
function getCodeType(code) {
  if (!code) return 'UNKNOWN';
  
  const cleanCode = String(code).replace(/\s/g, '');
  
  // Check if it's a valid HSN
  if (/^\d{4}$|^\d{6}$|^\d{8}$/.test(cleanCode)) {
    // Could be HSN or SAC (if 6 digits)
    if (cleanCode.length === 6) {
      // Check if it starts with common SAC prefixes
      const sacPrefixes = ['99', '98', '97', '96', '95'];
      if (sacPrefixes.some(prefix => cleanCode.startsWith(prefix))) {
        return 'SAC';
      }
    }
    return 'HSN';
  }
  
  return 'UNKNOWN';
}

/**
 * Format HSN/SAC code with spaces for readability
 * HSN: XXXX or XXXX XX or XXXX XX XX
 * SAC: XXX XXX
 * 
 * @param {string} code - Code to format
 * @param {string} type - 'HSN' or 'SAC'
 * @returns {string} Formatted code
 */
function formatCode(code, type) {
  if (!code) return '';
  
  const cleanCode = String(code).replace(/\s/g, '');
  
  if (type === 'HSN') {
    if (cleanCode.length === 4) {
      return cleanCode; // XXXX
    } else if (cleanCode.length === 6) {
      return `${cleanCode.substring(0, 4)} ${cleanCode.substring(4)}`; // XXXX XX
    } else if (cleanCode.length === 8) {
      return `${cleanCode.substring(0, 4)} ${cleanCode.substring(4, 6)} ${cleanCode.substring(6)}`; // XXXX XX XX
    }
  } else if (type === 'SAC') {
    if (cleanCode.length === 6) {
      return `${cleanCode.substring(0, 3)} ${cleanCode.substring(3)}`; // XXX XXX
    }
  }
  
  return cleanCode;
}

/**
 * Get HSN/SAC description
 * This is a simplified version - in production, this would query a database
 * 
 * @param {string} code - HSN/SAC code
 * @param {string} type - 'HSN' or 'SAC'
 * @returns {string} Description
 */
function getCodeDescription(code, type) {
  // TODO: Implement database lookup for HSN/SAC descriptions
  // For now, return basic descriptions for common codes
  
  if (type === 'HSN') {
    const hsnDescriptions = {
      '1001': 'Wheat and meslin',
      '1006': 'Rice',
      '0401': 'Milk and cream',
      '6204': 'Women\'s or girls\' suits, ensembles, jackets',
      '8517': 'Telephone sets, mobile phones',
      '8703': 'Motor cars and vehicles',
      '8471': 'Computers and computer systems',
      '6403': 'Footwear with outer soles of rubber'
    };
    
    const prefix = code.substring(0, 4);
    return hsnDescriptions[prefix] || 'Description not available';
  }
  
  if (type === 'SAC') {
    const sacDescriptions = {
      '996311': 'Restaurant and food serving services',
      '996312': 'Outdoor catering services',
      '997331': 'Legal consultancy and representation services',
      '998212': 'Freight transport by road',
      '998213': 'Freight transport by rail',
      '997321': 'Accounting and auditing services'
    };
    
    return sacDescriptions[code] || 'Description not available';
  }
  
  return 'Description not available';
}

/**
 * Validate HSN/SAC code and return comprehensive info
 * 
 * @param {string} code - Code to validate
 * @param {string} expectedType - 'HSN' or 'SAC' (optional)
 * @returns {Object} Validation result with info
 */
function validateCode(code, expectedType = null) {
  if (!code) {
    return {
      valid: false,
      message: 'Code is required'
    };
  }
  
  const detectedType = getCodeType(code);
  
  if (detectedType === 'UNKNOWN') {
    return {
      valid: false,
      message: 'Invalid HSN/SAC code format'
    };
  }
  
  // If expected type specified, verify it matches
  if (expectedType && detectedType !== expectedType) {
    return {
      valid: false,
      message: `Expected ${expectedType} code but got ${detectedType} code`
    };
  }
  
  // Validate based on type
  const validation = detectedType === 'HSN' 
    ? validateHSN(code)
    : validateSAC(code);
  
  if (!validation.valid) {
    return validation;
  }
  
  return {
    valid: true,
    type: detectedType,
    code: validation[detectedType.toLowerCase()],
    formatted: formatCode(code, detectedType),
    description: getCodeDescription(code, detectedType),
    message: `Valid ${detectedType} code`
  };
}

module.exports = {
  validateHSN,
  validateSAC,
  getCodeType,
  formatCode,
  getCodeDescription,
  validateCode
};
