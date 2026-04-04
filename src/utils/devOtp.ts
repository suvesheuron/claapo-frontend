/** Parsed from `/auth/otp/send` or password reset request when backend exposes it (no SMS). */
export function devOtpFromResponse(res: unknown): string | null {
  if (!res || typeof res !== 'object') return null;
  const v = (res as Record<string, unknown>).devOtp;
  if (typeof v === 'string' && /^\d{6}$/.test(v)) return v;
  return null;
}
