import { useState, useRef, useCallback, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaVideo, FaTriangleExclamation, FaCircleCheck, FaChevronLeft, FaEye, FaEyeSlash } from 'react-icons/fa6';
import AppLayout from '../components/AppLayout';
import { api, ApiException } from '../services/api';
import { toE164India, maskPhone } from '../utils/phone';

type Step = 'phone' | 'otp';

const OTP_LENGTH = 6;
const RESEND_SECONDS = 60;

export default function ForgotPassword() {
  const navigate = useNavigate();

  const [step, setStep]           = useState<Step>('phone');
  const [phone, setPhone]         = useState('');
  const [e164Phone, setE164Phone] = useState('');
  const [digits, setDigits]       = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfPass, setShowConfPass] = useState(false);

  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const [success, setSuccess]     = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);
  const [resending, setResending] = useState(false);

  const inputRefs = useRef<Array<HTMLInputElement | null>>(Array(OTP_LENGTH).fill(null));
  const timerRef  = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    document.title = 'Reset Password – Claapo';
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const startCountdown = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setResendCountdown(RESEND_SECONDS);
    timerRef.current = setInterval(() => {
      setResendCountdown((prev) => {
        if (prev <= 1) { clearInterval(timerRef.current!); return 0; }
        return prev - 1;
      });
    }, 1000);
  }, []);

  // ── Step 1: request OTP ──────────────────────────────────────────────────

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const formatted = toE164India(phone.trim());
    if (formatted.replace(/\D/g, '').length < 10) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post<unknown>('/auth/password/reset/request', { phone: formatted });
      console.log('[DEV] Password reset OTP send response (check backend terminal for OTP):', res);
      setE164Phone(formatted);
      startCountdown();
      setStep('otp');
    } catch (err) {
      const msg =
        err instanceof ApiException ? err.payload.message : 'Failed to send OTP. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2: OTP input helpers ────────────────────────────────────────────

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
    inputRefs.current[Math.min(pasted.length, OTP_LENGTH - 1)]?.focus();
  };

  const handleResend = async () => {
    setResending(true);
    setError(null);
    try {
      const res = await api.post<unknown>('/auth/password/reset/request', { phone: e164Phone });
      console.log('[DEV] Password reset OTP resend response:', res);
      setDigits(Array(OTP_LENGTH).fill(''));
      inputRefs.current[0]?.focus();
      startCountdown();
    } catch (err) {
      const msg =
        err instanceof ApiException ? err.payload.message : 'Resend failed. Try again.';
      setError(msg);
    } finally {
      setResending(false);
    }
  };

  // ── Step 2: confirm reset ────────────────────────────────────────────────

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const otp = digits.join('');
    if (otp.length < OTP_LENGTH) {
      setError('Please enter the complete 6-digit OTP.');
      return;
    }
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/password/reset/confirm', {
        phone: e164Phone,
        otp,
        newPassword,
      });
      setSuccess(true);
    } catch (err) {
      const msg =
        err instanceof ApiException ? err.payload.message : 'Reset failed. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // ── Success screen ───────────────────────────────────────────────────────

  if (success) {
    return (
      <AppLayout headerVariant="back" backTo="/login" backLabel="Back to Login" showFooter={false}>
        <div className="flex-1 flex items-center justify-center px-4 py-10">
          <div className="w-full max-w-[420px] text-center">
            <div className="w-16 h-16 rounded-2xl bg-green-50 border-2 border-green-200 flex items-center justify-center mx-auto mb-5">
              <FaCircleCheck className="text-green-500 text-2xl" />
            </div>
            <h1 className="text-2xl font-bold text-neutral-900 mb-2">Password reset!</h1>
            <p className="text-sm text-neutral-500 mb-6">
              Your password has been updated. You can now sign in with your new password.
            </p>
            <button
              onClick={() => navigate('/login')}
              className="rounded-xl w-full py-3 bg-[#3B5BDB] text-white text-sm font-semibold hover:bg-[#2f4ac2] transition-colors shadow-sm"
            >
              Sign In
            </button>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout headerVariant="back" backTo="/login" backLabel="Back to Login" showFooter={false}>
      <div className="flex-1 flex items-center justify-center px-4 py-10 min-h-[calc(100vh-80px)]">
        <div className="w-full max-w-[420px]">

          {/* Header */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-12 h-12 rounded-xl bg-[#3B5BDB] flex items-center justify-center mb-4 shadow-lg shadow-[#3B5BDB]/25">
              <FaVideo className="text-white text-lg" />
            </div>
            <h1 className="text-2xl font-bold text-neutral-900">
              {step === 'phone' ? 'Reset your password' : 'Enter verification code'}
            </h1>
            <p className="text-sm text-neutral-500 mt-1 text-center">
              {step === 'phone'
                ? 'Enter your registered phone number to receive a reset code.'
                : <>Code sent to <span className="font-semibold text-neutral-700">{maskPhone(e164Phone)}</span></>
              }
            </p>
          </div>

          {/* Step indicator */}
          <div className="flex items-center justify-center gap-2 mb-6">
            {(['phone', 'otp'] as Step[]).map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                  step === s ? 'bg-[#3B5BDB] text-white' :
                  (i === 0 && step === 'otp') ? 'bg-green-500 text-white' :
                  'bg-neutral-200 text-neutral-500'
                }`}>
                  {i === 0 && step === 'otp' ? <FaCircleCheck className="text-[10px]" /> : i + 1}
                </div>
                {i < 1 && <div className="w-8 h-px bg-neutral-200" />}
              </div>
            ))}
          </div>

          <div className="rounded-2xl bg-white border border-neutral-200 p-6 shadow-sm">

            {/* ── Step 1: phone ── */}
            {step === 'phone' && (
              <form className="space-y-4" onSubmit={handlePhoneSubmit}>
                <div>
                  <label className="block text-neutral-700 text-sm mb-1.5 font-medium">
                    Mobile Number
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    required
                    disabled={loading}
                    autoFocus
                    className="rounded-xl w-full px-4 py-3 border border-neutral-300 bg-white text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-[#3B5BDB] focus:ring-3 focus:ring-[#3B5BDB]/10 text-sm transition-all disabled:opacity-50"
                  />
                </div>

                {error && (
                  <div className="flex items-start gap-2.5 rounded-xl bg-red-50 border border-red-200 px-3.5 py-3">
                    <FaTriangleExclamation className="text-red-500 text-sm shrink-0 mt-0.5" />
                    <p className="text-xs text-red-700 leading-snug">{error}</p>
                  </div>
                )}

                {import.meta.env.DEV && (
                  <p className="text-[11px] text-amber-600 bg-amber-50 rounded-lg px-3 py-2 border border-amber-200">
                    Dev: OTP will appear in the backend terminal console.
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-xl w-full py-3 bg-[#3B5BDB] text-white text-sm font-semibold hover:bg-[#2f4ac2] transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Sending code…</>
                  ) : 'Send Reset Code'}
                </button>
              </form>
            )}

            {/* ── Step 2: OTP + new password ── */}
            {step === 'otp' && (
              <form className="space-y-4" onSubmit={handleResetSubmit}>
                {/* Back to step 1 */}
                <button
                  type="button"
                  onClick={() => { setStep('phone'); setError(null); setDigits(Array(OTP_LENGTH).fill('')); }}
                  className="flex items-center gap-1.5 text-xs text-neutral-500 hover:text-neutral-700 mb-1 -mt-1"
                >
                  <FaChevronLeft className="text-[10px]" /> Change number
                </button>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-3 text-center">
                    Verification Code
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
                        disabled={loading}
                        className={`w-11 h-13 text-center text-xl font-bold rounded-xl border-2 bg-[#F3F4F6] focus:outline-none focus:bg-white transition-all disabled:opacity-50
                          ${d ? 'border-[#3B5BDB] bg-[#EFF4FF]' : 'border-neutral-300'}
                          ${error ? 'border-red-300' : ''}`}
                      />
                    ))}
                  </div>
                  <p className="text-center mt-2 text-xs text-neutral-500">
                    Didn't get it?{' '}
                    {resendCountdown > 0 ? (
                      <span className="text-neutral-400">Resend in {resendCountdown}s</span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleResend}
                        disabled={resending}
                        className="text-[#3B5BDB] font-semibold hover:underline disabled:opacity-50"
                      >
                        {resending ? 'Sending…' : 'Resend'}
                      </button>
                    )}
                  </p>
                </div>

                <div>
                  <label className="block text-neutral-700 text-sm mb-1.5 font-medium">New Password</label>
                  <div className="relative">
                    <input
                      type={showNewPass ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="At least 8 characters"
                      required
                      minLength={8}
                      disabled={loading}
                      className="rounded-xl w-full px-4 py-3 pr-11 border border-neutral-300 bg-white text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-[#3B5BDB] focus:ring-3 focus:ring-[#3B5BDB]/10 text-sm transition-all disabled:opacity-50"
                    />
                    <button type="button" onClick={() => setShowNewPass((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 p-1" aria-label={showNewPass ? 'Hide password' : 'Show password'}>
                      {showNewPass ? <FaEyeSlash className="w-4 h-4" /> : <FaEye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-neutral-700 text-sm mb-1.5 font-medium">Confirm Password</label>
                  <div className="relative">
                    <input
                      type={showConfPass ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat your new password"
                      required
                      disabled={loading}
                      className="rounded-xl w-full px-4 py-3 pr-11 border border-neutral-300 bg-white text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-[#3B5BDB] focus:ring-3 focus:ring-[#3B5BDB]/10 text-sm transition-all disabled:opacity-50"
                    />
                    <button type="button" onClick={() => setShowConfPass((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 p-1" aria-label={showConfPass ? 'Hide password' : 'Show password'}>
                      {showConfPass ? <FaEyeSlash className="w-4 h-4" /> : <FaEye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="flex items-start gap-2.5 rounded-xl bg-red-50 border border-red-200 px-3.5 py-3">
                    <FaTriangleExclamation className="text-red-500 text-sm shrink-0 mt-0.5" />
                    <p className="text-xs text-red-700 leading-snug">{error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-xl w-full py-3 bg-[#3B5BDB] text-white text-sm font-semibold hover:bg-[#2f4ac2] transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Resetting…</>
                  ) : 'Reset Password'}
                </button>
              </form>
            )}

          </div>

          <p className="mt-5 text-center text-sm text-neutral-500">
            Remember your password?{' '}
            <Link to="/login" className="text-[#3B5BDB] font-semibold hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </AppLayout>
  );
}
