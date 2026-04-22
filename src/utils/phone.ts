/**
 * Phone number utilities for the Indian market.
 * The backend requires E.164 format: +919876543210
 */

export const PHONE_COUNTRY_CODES = [
  { iso2: 'IN', dialCode: '+91', label: 'IN (+91)' },
  { iso2: 'US', dialCode: '+1', label: 'US (+1)' },
  { iso2: 'GB', dialCode: '+44', label: 'UK (+44)' },
  { iso2: 'AE', dialCode: '+971', label: 'UAE (+971)' },
  { iso2: 'CA', dialCode: '+1', label: 'CA (+1)' },
  { iso2: 'AU', dialCode: '+61', label: 'AU (+61)' },
  { iso2: 'SG', dialCode: '+65', label: 'SG (+65)' },
] as const;

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

/**
 * Converts local phone digits and a selected dial code into E.164.
 */
export function toE164WithCountryCode(localInput: string, dialCode: string): string {
  const localDigits = localInput.replace(/\D/g, '');
  const countryDigits = dialCode.replace(/\D/g, '');
  return `+${countryDigits}${localDigits}`;
}

/** Returns a human-readable masked phone, e.g. "+91 98765 XXXXX" */
export function maskPhone(e164: string): string {
  if (e164.startsWith('+91') && e164.length === 13) {
    return `+91 ${e164.slice(3, 8)} XXXXX`;
  }
  return `${e164.slice(0, 6)}XXXXX`;
}
