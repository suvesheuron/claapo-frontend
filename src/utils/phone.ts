/**
 * Phone number utilities for the Indian market.
 * The backend requires E.164 format: +919876543210
 */

/**
 * Converts a raw phone input (with or without country code / spaces / dashes)
 * into E.164 format, defaulting to India (+91) for 10-digit numbers.
 */
export function toE164India(input: string): string {
  // Strip everything except digits
  const digits = input.replace(/\D/g, '');

  if (digits.length === 10) {
    return `+91${digits}`;
  }

  // 0-prefixed (Indian trunk prefix): 09876543210
  if (digits.length === 11 && digits.startsWith('0')) {
    return `+91${digits.slice(1)}`;
  }

  // Country code already included: 919876543210
  if (digits.length === 12 && digits.startsWith('91')) {
    return `+${digits}`;
  }

  // Country code + trunk prefix: 0919876543210
  if (digits.length === 13 && digits.startsWith('091')) {
    return `+91${digits.slice(3)}`;
  }

  // Input already starts with + — trust it, just clean whitespace
  if (input.trimStart().startsWith('+')) {
    return `+${digits}`;
  }

  // Fallback: prepend +
  return `+${digits}`;
}

/** Returns a human-readable masked phone, e.g. "+91 98765 XXXXX" */
export function maskPhone(e164: string): string {
  if (e164.startsWith('+91') && e164.length === 13) {
    return `+91 ${e164.slice(3, 8)} XXXXX`;
  }
  return `${e164.slice(0, 6)}XXXXX`;
}
