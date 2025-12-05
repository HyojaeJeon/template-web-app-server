/**
 * Phone number validation and formatting utility
 * International phone number support for 8 countries
 *
 * @description  International phone number validation and formatting
 * @countries    VN, KR, US, CN, JP, TH, SG, MY
 * @includes     Validation, normalization, formatting, country detection
 */

// ================================
// Supported countries and formats
// ================================

/**
 * Supported phone number formats by country
 */
export const SUPPORTED_COUNTRIES = {
  VN: {
    regex: /^(\+84|84|0)?[3-9][0-9]{8}$/,
    prefix: '+84',
    name: 'Vietnam',
    exampleFormat: '90 123 4567'
  },
  KR: {
    regex: /^(\+82|82|0)?1[0-9]{9,10}$/,
    prefix: '+82',
    name: 'South Korea',
    exampleFormat: '10-1234-5678'
  },
  US: {
    regex: /^(\+1|1)?[2-9][0-9]{2}[2-9][0-9]{6}$/,
    prefix: '+1',
    name: 'United States',
    exampleFormat: '(555) 123-4567'
  },
  CN: {
    regex: /^(\+86|86)?1[3-9][0-9]{9}$/,
    prefix: '+86',
    name: 'China',
    exampleFormat: '138 0000 0000'
  },
  JP: {
    regex: /^(\+81|81|0)?[7-9]0[0-9]{8}$/,
    prefix: '+81',
    name: 'Japan',
    exampleFormat: '90-1234-5678'
  },
  TH: {
    regex: /^(\+66|66|0)?[6-9][0-9]{8}$/,
    prefix: '+66',
    name: 'Thailand',
    exampleFormat: '81 234 5678'
  },
  SG: {
    regex: /^(\+65|65)?[689][0-9]{7}$/,
    prefix: '+65',
    name: 'Singapore',
    exampleFormat: '9123 4567'
  },
  MY: {
    regex: /^(\+60|60|0)?1[0-9]{8,9}$/,
    prefix: '+60',
    name: 'Malaysia',
    exampleFormat: '12-345 6789'
  }
};

// ================================
// Basic utility functions
// ================================

/**
 * Extract digits only from phone number
 * @param {string} phone - Phone number
 * @returns {string} String with digits only
 */
export const extractDigits = (phone) => {
  if (!phone) return '';
  return phone.replace(/\D/g, '');
};

/**
 * Auto-detect country code from phone number
 * @param {string} phone - Phone number
 * @returns {string|null} Country code or null
 */
export const detectCountryCode = (phone) => {
  if (!phone) return null;

  const cleanPhone = extractDigits(phone);

  // Check if starts with country code
  for (const [code, country] of Object.entries(SUPPORTED_COUNTRIES)) {
    const prefix = country.prefix.replace('+', '');
    if (cleanPhone.startsWith(prefix)) {
      return code;
    }
  }

  // Default to VN
  return 'VN';
};

// ================================
// Validation functions
// ================================

/**
 * Validate international phone number
 * @param {string} phone - Phone number
 * @param {string} countryCode - Country code (e.g., 'VN', 'KR')
 * @returns {boolean} Whether phone number is valid
 */
export const validateInternationalPhone = (phone, countryCode = 'VN') => {
  if (!phone || !countryCode) return false;
  
  const country = SUPPORTED_COUNTRIES[countryCode];
  if (!country) {
    console.warn(`Unsupported country code: ${countryCode}`);
    return false;
  }

  // Extract digits and validate
  const cleanPhone = extractDigits(phone);

  // Validate with regex
  return country.regex.test(phone) || country.regex.test(cleanPhone);
};

/**
 * Validate VN phone number with detailed checks
 * @param {string} phone - Phone number
 * @returns {Object} Validation result object
 */
export const validateVietnamesePhone = (phone) => {
  if (!phone) {
    return { isValid: false, error: 'PHONE_REQUIRED' };
  }

  const cleanPhone = extractDigits(phone);

  // Check length (9 digits or 11 with country code)
  if (cleanPhone.length < 9 || cleanPhone.length > 11) {
    return { isValid: false, error: 'INVALID_LENGTH' };
  }

  // Validate format
  const isValid = validateInternationalPhone(phone, 'VN');

  if (!isValid) {
    return { isValid: false, error: 'INVALID_FORMAT' };
  }

  // Check first digit (3-9 only)
  const firstDigit = cleanPhone.startsWith('84')
    ? cleanPhone.charAt(2)
    : cleanPhone.startsWith('0')
      ? cleanPhone.charAt(1)
      : cleanPhone.charAt(0);

  if (!/[3-9]/.test(firstDigit)) {
    return { isValid: false, error: 'INVALID_FIRST_DIGIT' };
  }

  return {
    isValid: true,
    normalized: normalizePhoneNumber(phone, 'VN'),
    formatted: formatPhoneNumber(normalizePhoneNumber(phone, 'VN'), 'VN')
  };
};

// ================================
// Normalization functions
// ================================

/**
 * Normalize phone number to E.164 format
 * E.164: +[country code][subscriber number]
 * Example: +84901234567
 *
 * @param {string} phone - Phone number
 * @param {string} countryCode - Country code
 * @returns {string} Normalized phone number
 */
export const normalizePhoneNumber = (phone, countryCode = 'VN') => {
  if (!phone) return '';
  
  const country = SUPPORTED_COUNTRIES[countryCode];
  if (!country) return phone;

  // Extract digits only
  let cleanNumber = extractDigits(phone);

  // Process by country
  switch (countryCode) {
    case 'VN':
      if (cleanNumber.startsWith('0')) {
        cleanNumber = cleanNumber.substring(1);
      } else if (cleanNumber.startsWith('84')) {
        cleanNumber = cleanNumber.substring(2);
      }
      break;

    case 'KR':
      if (cleanNumber.startsWith('0')) {
        cleanNumber = cleanNumber.substring(1);
      } else if (cleanNumber.startsWith('82')) {
        cleanNumber = cleanNumber.substring(2);
      }
      break;

    case 'US':
      if (cleanNumber.startsWith('1') && cleanNumber.length === 11) {
        cleanNumber = cleanNumber.substring(1);
      }
      break;

    case 'CN':
      if (cleanNumber.startsWith('86')) {
        cleanNumber = cleanNumber.substring(2);
      }
      break;

    case 'JP':
      if (cleanNumber.startsWith('0')) {
        cleanNumber = cleanNumber.substring(1);
      } else if (cleanNumber.startsWith('81')) {
        cleanNumber = cleanNumber.substring(2);
      }
      break;

    case 'TH':
      if (cleanNumber.startsWith('0')) {
        cleanNumber = cleanNumber.substring(1);
      } else if (cleanNumber.startsWith('66')) {
        cleanNumber = cleanNumber.substring(2);
      }
      break;

    case 'SG':
      if (cleanNumber.startsWith('65')) {
        cleanNumber = cleanNumber.substring(2);
      }
      break;

    case 'MY':
      if (cleanNumber.startsWith('0')) {
        cleanNumber = cleanNumber.substring(1);
      } else if (cleanNumber.startsWith('60')) {
        cleanNumber = cleanNumber.substring(2);
      }
      break;
  }

  // Return in E.164 format
  return `${country.prefix}${cleanNumber}`;
};

// ================================
// Formatting functions
// ================================

/**
 * Format phone number for display
 * @param {string} phone - E.164 format phone number
 * @param {string} countryCode - Country code
 * @returns {string} Formatted phone number
 */
export const formatPhoneNumber = (phone, countryCode = 'VN') => {
  if (!phone) return '';

  // Remove country code from E.164 format
  const country = SUPPORTED_COUNTRIES[countryCode];
  if (!country) return phone;

  let cleanNumber = phone.replace(country.prefix, '');
  cleanNumber = extractDigits(cleanNumber);

  // Format by country
  switch (countryCode) {
    case 'VN':
      if (cleanNumber.length >= 8) {
        return `${cleanNumber.slice(0, 2)} ${cleanNumber.slice(2, 5)} ${cleanNumber.slice(5)}`;
      }
      break;
      
    case 'KR':
      if (cleanNumber.length === 10) {
        return `0${cleanNumber.slice(0, 2)}-${cleanNumber.slice(2, 6)}-${cleanNumber.slice(6)}`;
      } else if (cleanNumber.length === 11) {
        return `0${cleanNumber.slice(0, 2)}-${cleanNumber.slice(2, 6)}-${cleanNumber.slice(6)}`;
      }
      break;
      
    case 'US':
      if (cleanNumber.length === 10) {
        return `(${cleanNumber.slice(0, 3)}) ${cleanNumber.slice(3, 6)}-${cleanNumber.slice(6)}`;
      }
      break;
      
    case 'CN':
      if (cleanNumber.length === 11) {
        return `${cleanNumber.slice(0, 3)} ${cleanNumber.slice(3, 7)} ${cleanNumber.slice(7)}`;
      }
      break;
      
    case 'JP':
      if (cleanNumber.length === 10) {
        return `0${cleanNumber.slice(0, 2)}-${cleanNumber.slice(2, 6)}-${cleanNumber.slice(6)}`;
      }
      break;
      
    case 'TH':
      if (cleanNumber.length === 9) {
        return `0${cleanNumber.slice(0, 2)} ${cleanNumber.slice(2, 5)} ${cleanNumber.slice(5)}`;
      }
      break;
      
    case 'SG':
      if (cleanNumber.length === 8) {
        return `${cleanNumber.slice(0, 4)} ${cleanNumber.slice(4)}`;
      }
      break;
      
    case 'MY':
      if (cleanNumber.length === 9 || cleanNumber.length === 10) {
        return `0${cleanNumber.slice(0, 2)}-${cleanNumber.slice(2, 5)} ${cleanNumber.slice(5)}`;
      }
      break;
  }
  
  return phone;
};

/**
 * Mask phone number for privacy
 * @param {string} phone - Phone number
 * @param {Object} options - Masking options
 * @returns {string} Masked phone number
 */
export const maskVietnamesePhone = (phone, options = {}) => {
  const {
    maskChar = '*',
    showFirst = 2,
    showLast = 2,
  } = options;

  if (!phone) return '';

  const formatted = formatPhoneNumber(phone, 'VN');
  const cleanNumber = extractDigits(formatted);

  if (cleanNumber.length < showFirst + showLast) {
    return maskChar.repeat(cleanNumber.length);
  }

  const firstPart = cleanNumber.slice(0, showFirst);
  const lastPart = cleanNumber.slice(-showLast);
  const middleLength = cleanNumber.length - showFirst - showLast;
  const middlePart = maskChar.repeat(middleLength);

  // Reformat
  const maskedNumber = firstPart + middlePart + lastPart;
  if (maskedNumber.length >= 8) {
    return `${maskedNumber.slice(0, 2)} ${maskedNumber.slice(2, 5)} ${maskedNumber.slice(5)}`;
  }

  return maskedNumber;
};

// ================================
// Advanced validation functions
// ================================

/**
 * Validate phone number from multiple countries
 * @param {string} phone - Phone number
 * @param {Array} allowedCountries - Allowed country codes array
 * @returns {Object} Validation result
 */
export const validateMultiCountryPhone = (phone, allowedCountries = ['VN']) => {
  if (!phone) {
    return { isValid: false, error: 'PHONE_REQUIRED' };
  }

  // Auto-detect country code
  const detectedCountry = detectCountryCode(phone);

  // Check if country is allowed
  if (!allowedCountries.includes(detectedCountry)) {
    return {
      isValid: false,
      error: 'COUNTRY_NOT_ALLOWED',
      detectedCountry,
      allowedCountries
    };
  }

  // Validate with detected country format
  const isValid = validateInternationalPhone(phone, detectedCountry);

  if (!isValid) {
    return {
      isValid: false,
      error: 'INVALID_FORMAT',
      detectedCountry
    };
  }

  return {
    isValid: true,
    detectedCountry,
    normalized: normalizePhoneNumber(phone, detectedCountry),
    formatted: formatPhoneNumber(normalizePhoneNumber(phone, detectedCountry), detectedCountry)
  };
};

// ================================
// Default export
// ================================
export default {
  // Constants
  SUPPORTED_COUNTRIES,

  // Basic functions
  extractDigits,
  detectCountryCode,

  // Validation
  validateInternationalPhone,
  validateVietnamesePhone,
  validateMultiCountryPhone,

  // Normalization and formatting
  normalizePhoneNumber,
  formatPhoneNumber,
  maskVietnamesePhone,
};