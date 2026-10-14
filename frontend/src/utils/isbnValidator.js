/**
 * LIBRIX — ISBN Validator Utility
 * Consistent validation mirroring backend Python rules:
 * - ISBN-13: Exactly 13 digits, must begin with 978 or 979, valid mod 10 checksum.
 * - ISBN-10: Exactly 10 characters, first 9 are digits, 10th is a digit or 'X' (10), valid mod 11 checksum.
 */

export const validateIsbn = (isbn) => {
  if (!isbn) {
    return { valid: false, cleaned: '', message: 'ISBN cannot be empty.' };
  }

  const cleaned = String(isbn).replace(/[-\s]/g, '').toUpperCase();

  if (cleaned.length === 10) {
    // First 9 characters must be digits
    if (!/^\d{9}[\dX]$/.test(cleaned)) {
      return {
        valid: false,
        cleaned,
        message: 'ISBN-10 must contain 9 digits followed by a digit or "X".',
      };
    }

    const lastChar = cleaned[9];
    let total = 0;
    for (let i = 0; i < 9; i++) {
      total += parseInt(cleaned[i], 10) * (10 - i);
    }
    total += lastChar === 'X' ? 10 : parseInt(lastChar, 10);

    if (total % 11 === 0) {
      return {
        valid: true,
        cleaned,
        message: 'Valid ISBN-10 format & checksum ✓',
      };
    }

    let sumFirst9 = 0;
    for (let i = 0; i < 9; i++) {
      sumFirst9 += parseInt(cleaned[i], 10) * (10 - i);
    }
    const checkRemainder = (11 - (sumFirst9 % 11)) % 11;
    const expectedCheck = checkRemainder === 10 ? 'X' : String(checkRemainder);

    return {
      valid: false,
      cleaned,
      message: `Invalid ISBN-10 checksum (expected check digit '${expectedCheck}', got '${lastChar}').`,
    };
  } else if (cleaned.length === 13) {
    if (!/^\d{13}$/.test(cleaned)) {
      return {
        valid: false,
        cleaned,
        message: 'ISBN-13 must contain exactly 13 numeric digits.',
      };
    }

    // Must begin with 978 or 979
    if (!cleaned.startsWith('978') && !cleaned.startsWith('979')) {
      return {
        valid: false,
        cleaned,
        message: `ISBN-13 must begin with '978' or '979' prefix (got '${cleaned.slice(0, 3)}').`,
      };
    }

    let total = 0;
    for (let i = 0; i < 12; i++) {
      const weight = i % 2 === 0 ? 1 : 3;
      total += parseInt(cleaned[i], 10) * weight;
    }

    const checkDigit = (10 - (total % 10)) % 10;

    if (parseInt(cleaned[12], 10) === checkDigit) {
      return {
        valid: true,
        cleaned,
        message: 'Valid ISBN-13 format & checksum ✓',
      };
    }

    return {
      valid: false,
      cleaned,
      message: `Invalid ISBN-13 checksum (expected check digit ${checkDigit}, got ${cleaned[12]}).`,
    };
  } else {
    return {
      valid: false,
      cleaned,
      message: `ISBN must be exactly 10 or 13 digits (excluding hyphens/spaces). Current length: ${cleaned.length}.`,
    };
  }
};

export default validateIsbn;
