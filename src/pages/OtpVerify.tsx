/**
 * OTP Verification page — reached after registration.
 *
 * Location state expected (passed from registration pages):
 *   phone        — E.164 phone number that OTP was sent to
 *   userType     — 'individual' | 'company' | 'vendor'
 *   pendingProfile — extra profile fields collected during registration to PATCH
 *                    after OTP verify succeeds and tokens are available
 *
 * When SMS is not configured, the API may return `devOtp` and we show it on
 * this page for demos and client review.
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { FaVideo, FaTriangleExclamation, FaMobileScreenButton } from 'react-icons/fa6';
import AppLayout from '../components/AppLayout';
import { api, ApiException } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { maskPhone } from '../utils/phone';
import { devOtpFromResponse } from '../utils/devOtp';

interface PendingProfile {
  displayName?: string;
  skills?: string[];
  genres?: string[];
  locationCity?: string;
  locationState?: string;
  dailyBudget?: number;
  companyName?: string;
  companyType?: string;
  vendorType?: string;
  vendorServiceCategory?: string;
}

interface OtpLocationState {
  phone: string;
  userType: 'individual' | 'company' | 'vendor';
  pendingProfile?: PendingProfile;
}

interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

const OTP_LENGTH = 6;
const RESEND_SECONDS = 60;

export default function OtpVerify() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setSession } = useAuth();

  const state = location.state as OtpLocationState | null;
  const phone      = state?.phone      ?? '';
  const userType   = state?.userType   ?? 'individual';
  const pending    = state?.pendingProfile ?? {};

  const [digits, setDigits]             = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [verifying, setVerifying]       = useState(false);
  const [error, setError]               = useState<string | null>(null);
  const [resendCountdown, setResendCountdown] = useState(RESEND_SECONDS);
  const [resending, setResending]       = useState(false);
  const [sendError, setSendError]       = useState<string | null>(null);
  const [devOtpDisplay, setDevOtpDisplay] = useState<string | null>(null);

  const inputRefs = useRef<Array<HTMLInputElement | null>>(Array(OTP_LENGTH).fill(null));
  const timerRef  = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── countdown timer ──────────────────────────────────────────────────────

  const startCountdown = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setResendCountdown(RESEND_SECONDS);
    timerRef.current = setInterval(() => {
      setResendCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  // ── send OTP on mount ─────────────────────────────────────────────────────

  useEffect(() => {
    if (!phone) return;

    async function sendOtp() {
      try {
        const res = await api.post<unknown>('/auth/otp/send', { phone });
        setDevOtpDisplay(devOtpFromResponse(res));
        startCountdown();
      } catch (err) {
        const msg =
          err instanceof ApiException ? err.payload.message : 'Could not send OTP. Try resending.';
        setSendError(msg);
      }
    }

    sendOtp();
    // Run once on mount only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── OTP input handling ────────────────────────────────────────────────────

  const handleDigitChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[index] = digit;
    setDigits(next);
    if (digit && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    const next = Array(OTP_LENGTH).fill('');
    pasted.split('').forEach((ch, i) => { next[i] = ch; });
    setDigits(next);
    const lastFilled = Math.min(pasted.length, OTP_LENGTH - 1);
    inputRefs.current[lastFilled]?.focus();
  };

  // ── resend ────────────────────────────────────────────────────────────────

  const handleResend = async () => {
    setSendError(null);
    setError(null);
    setResending(true);
    try {
      const res = await api.post<unknown>('/auth/otp/send', { phone });
      setDevOtpDisplay(devOtpFromResponse(res));
      setDigits(Array(OTP_LENGTH).fill(''));
      inputRefs.current[0]?.focus();
      startCountdown();
    } catch (err) {
      const msg =
        err instanceof ApiException ? err.payload.message : 'Could not resend OTP. Please try again.';
      setSendError(msg);
    } finally {
      setResending(false);
    }
  };

  // ── verify + profile patch ────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const otp = digits.join('');
    if (otp.length < OTP_LENGTH) {
      setError('Please enter the complete 6-digit OTP.');
      return;
    }

    setVerifying(true);
    try {
      const tokenRes = await api.post<TokenResponse>('/auth/otp/verify', { phone, otp });

      // Hydrate auth context immediately (also updates module-level token)
      setSession(tokenRes.accessToken, tokenRes.refreshToken);

      // Apply pending profile fields now that we have auth tokens
      try {
        if (userType === 'individual' && Object.keys(pending).length > 0) {
          await api.patch('/profile/individual', {
            ...(pending.displayName  && { displayName:  pending.displayName }),
            ...(pending.skills?.length && { skills: pending.skills }),
            ...(pending.genres?.length && { genres: pending.genres }),
            ...(pending.locationCity  && { locationCity:  pending.locationCity }),
            ...(pending.locationState && { locationState: pending.locationState }),
            ...(pending.dailyBudget != null && pending.dailyBudget > 0 && { dailyBudget: pending.dailyBudget }),
          });
        } else if (userType === 'company' && (pending.companyName || pending.companyType)) {
          await api.patch('/profile/company', {
            ...(pending.companyName && { companyName: pending.companyName }),
            ...(pending.companyType && { companyType: pending.companyType }),
          });
        } else if (userType === 'vendor' && Object.keys(pending).length > 0) {
          await api.patch('/profile/vendor', {
            ...(pending.companyName && { companyName: pending.companyName }),
            ...(pending.vendorType && { vendorType: pending.vendorType }),
            ...(pending.vendorServiceCategory && { vendorServiceCategory: pending.vendorServiceCategory }),
          });
        }
      } catch (profileErr) {
        // Profile patch failure is non-fatal — user can update profile later
        console.warn('[DEV] Profile patch after OTP verify failed:', profileErr);
      }

      navigate('/dashboard', { replace: true });
    } catch (err) {
      const msg =
        err instanceof ApiException ? err.payload.message : 'Invalid OTP. Please try again.';
      setError(msg);
    } finally {
      setVerifying(false);
    }
  };

  // ── guard: if landed here without state, send back ────────────────────────

  if (!phone) {
    return (
      <AppLayout headerVariant="back" backTo="/register" backLabel="Back">
        <div className="flex-1 flex items-center justify-center px-4 py-10">
          <div className="text-center">
            <p className="text-neutral-600 mb-4">No phone number found. Please register again.</p>
            <Link to="/register" className="text-[#3B5BDB] font-semibold hover:underline text-sm">
              Go to Registration
            </Link>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout headerVariant="back" backTo="/register" backLabel="Back" showFooter={false}>
      <div className="flex-1 flex items-center justify-center px-4 py-10 min-h-[calc(100vh-80px)]">
        <div className="w-full max-w-[420px]">
          {/* Icon + heading */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-[#3B5BDB]/10 border-2 border-[#3B5BDB]/20 flex items-center justify-center mb-4">
              <FaMobileScreenButton className="text-[#3B5BDB] text-2xl" />
            </div>
            <h1 className="text-2xl font-bold text-neutral-900">Verify your phone</h1>
            <p className="text-sm text-neutral-500 mt-2 text-center leading-relaxed">
              We sent a 6-digit code to{' '}
              <span className="font-semibold text-neutral-700">{maskPhone(phone)}</span>
            </p>
          </div>

          {devOtpDisplay && (
            <div className="mb-5 rounded-2xl border-2 border-dashed border-amber-300 bg-gradient-to-b from-amber-50 to-amber-50/80 px-4 py-5 text-center shadow-sm">
              <p className="text-[10px] font-bold uppercase tracking-widest text-amber-800/90 mb-1">
                Demo — SMS not active
              </p>
              <p className="text-xs text-amber-900/75 mb-4 max-w-[280px] mx-auto leading-relaxed">
                Your one-time code appears below so you can complete signup without a text message.
              </p>
              <p
                className="text-3xl sm:text-4xl font-extrabold tracking-[0.2em] font-mono text-neutral-900 tabular-nums select-all"
                title="Click and copy for screenshots"
              >
                {devOtpDisplay}
              </p>
            </div>
          )}

          <div className="rounded-2xl bg-white border border-neutral-200 p-6 shadow-sm">
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* 6-digit OTP boxes */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-3 text-center">
                  Enter OTP
                </label>
                <div className="flex gap-2.5 justify-center" onPaste={handlePaste}>
                  {digits.map((d, i) => (
                    <input
                      key={i}
                      ref={(el) => { inputRefs.current[i] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={d}
                      onChange={(e) => handleDigitChange(i, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(i, e)}
                      disabled={verifying}
                      className={`w-11 h-13 text-center text-xl font-bold rounded-xl border-2 bg-[#F3F4F6] focus:outline-none focus:bg-white transition-all disabled:opacity-50
                        ${d ? 'border-[#3B5BDB] bg-[#EFF4FF]' : 'border-neutral-300'}
                        ${error ? 'border-red-300' : ''}`}
                    />
                  ))}
                </div>
              </div>

              {/* Errors */}
              {(error || sendError) && (
                <div className="flex items-start gap-2.5 rounded-xl bg-red-50 border border-red-200 px-3.5 py-3">
                  <FaTriangleExclamation className="text-red-500 text-sm shrink-0 mt-0.5" />
                  <p className="text-xs text-red-700 leading-snug">{error ?? sendError}</p>
                </div>
              )}

              {/* Verify button */}
              <button
                type="submit"
                disabled={verifying || digits.join('').length < OTP_LENGTH}
                className="rounded-xl w-full py-3 bg-[#3B5BDB] text-white text-sm font-semibold hover:bg-[#2f4ac2] transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {verifying ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Verifying…
                  </>
                ) : (
                  'Verify & Continue'
                )}
              </button>

              {/* Resend */}
              <p className="text-center text-sm text-neutral-500">
                Didn't receive the code?{' '}
                {resendCountdown > 0 ? (
                  <span className="text-neutral-400">Resend in {resendCountdown}s</span>
                ) : (
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={resending}
                    className="text-[#3B5BDB] font-semibold hover:underline disabled:opacity-50"
                  >
                    {resending ? 'Sending…' : 'Resend OTP'}
                  </button>
                )}
              </p>
            </form>
          </div>

          <div className="mt-5 flex items-center gap-2 justify-center">
            <FaVideo className="text-[#3B5BDB] text-xs" />
            <span className="text-xs text-neutral-400">
              Need help?{' '}
              <Link to="/contact" className="text-[#3B5BDB] hover:underline">Contact support</Link>
            </span>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
