import { Link, useNavigate } from 'react-router-dom';
import { useCallback, useEffect, useMemo, useState, type SyntheticEvent } from 'react';
import {
  FaCircleCheck,
  FaCertificate,
  FaShieldHalved,
  FaHandshake,
  FaTriangleExclamation,
  FaEye,
  FaEyeSlash,
} from 'react-icons/fa6';
import AuthLayout from '../components/AuthLayout';
import { api, ApiException } from '../services/api';
import { toE164India } from '../utils/phone';
import { REGISTRATION_INDIVIDUAL_DEPARTMENTS, REGISTRATION_GENRES } from '../constants/registrationCategories';

/* ── constants ─────────────────────────────────────────────────────────────── */

const BENEFITS = [
  { icon: FaCertificate,  title: 'Verified profiles',   body: 'Build trust with verified skills and a polished portfolio.' },
  { icon: FaShieldHalved, title: 'Secure payments',     body: 'Get paid on time with protected transactions and invoices.' },
  { icon: FaHandshake,    title: 'Direct bookings',     body: 'Receive requests, lock dates and confirm availability easily.' },
];

/* ── validation helpers ────────────────────────────────────────────────────── */

type FieldErrors = Record<string, string | undefined>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NAME_RE  = /^[A-Za-z\s]+$/;
const PHONE_RE = /^[6-9]\d{9}$/;

function validateFullName(v: string): string | undefined {
  if (!v.trim()) return 'Full name is required.';
  if (v.trim().length < 2) return 'Minimum 2 characters.';
  if (!NAME_RE.test(v.trim())) return 'Only letters and spaces allowed.';
  return undefined;
}

function validatePhone(v: string): string | undefined {
  const digits = v.replace(/\D/g, '');
  if (!digits) return 'Phone number is required.';
  if (!PHONE_RE.test(digits)) return 'Enter a valid 10-digit Indian mobile number.';
  return undefined;
}

function validatePrimaryRole(v: string): string | undefined {
  if (!v) return 'Please select a role.';
  return undefined;
}

function validateEmail(v: string): string | undefined {
  if (!v.trim()) return 'Email is required.';
  if (!EMAIL_RE.test(v.trim())) return 'Enter a valid email address.';
  return undefined;
}

function validateDailyBudget(v: string): string | undefined {
  if (!v.trim()) return 'Budget is required.';
  const n = Number(v.replace(/[^0-9.]/g, ''));
  if (isNaN(n) || n <= 0) return 'Must be a positive number.';
  return undefined;
}

function validateLocation(v: string): string | undefined {
  if (!v.trim()) return 'Location is required.';
  if (v.trim().length < 3) return 'Enter a valid city and state.';
  return undefined;
}

function validatePassword(v: string): string | undefined {
  if (!v) return 'Password is required.';
  if (v.length < 8) return 'Minimum 8 characters.';
  if (!/[A-Z]/.test(v)) return 'Must contain at least 1 uppercase letter.';
  if (!/[a-z]/.test(v)) return 'Must contain at least 1 lowercase letter.';
  if (!/[0-9]/.test(v)) return 'Must contain at least 1 number.';
  return undefined;
}

function getPasswordStrength(v: string): { label: string; color: string; width: string } {
  if (!v) return { label: '', color: '', width: '0%' };
  let score = 0;
  if (v.length >= 8) score++;
  if (/[A-Z]/.test(v)) score++;
  if (/[a-z]/.test(v)) score++;
  if (/[0-9]/.test(v)) score++;
  if (/[^A-Za-z0-9]/.test(v)) score++;
  if (score <= 2) return { label: 'Weak',   color: '#ef4444', width: '33%'  };
  if (score <= 3) return { label: 'Medium', color: '#f59e0b', width: '66%'  };
  return                     { label: 'Strong', color: '#22c55e', width: '100%' };
}

/* ── component ─────────────────────────────────────────────────────────────── */

export default function IndividualRegistration() {
  const navigate = useNavigate();

  /* form state */
  const [fullName,        setFullName]        = useState('');
  const [phone,           setPhone]           = useState('');
  const [primaryRole,     setPrimaryRole]     = useState('');
  const [email,           setEmail]           = useState('');
  const [selectedGenres,  setSelectedGenres]  = useState<string[]>([]);
  const [dailyBudget,     setDailyBudget]     = useState('');
  const [location,        setLocation]        = useState('');
  const [password,        setPassword]        = useState('');
  const [showPassword,    setShowPassword]    = useState(false);
  const [termsAccepted,   setTermsAccepted]   = useState(false);

  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState<string | null>(null);
  const [fieldErrors,  setFieldErrors]  = useState<FieldErrors>({});
  const [touched,      setTouched]      = useState<Record<string, boolean>>({});

  useEffect(() => {
    document.title = 'Freelancer Registration – Claapo';
  }, []);

  const pwStrength = useMemo(() => getPasswordStrength(password), [password]);

  /* field-level blur handler */
  const handleBlur = useCallback(
    (field: string) => {
      setTouched((prev) => ({ ...prev, [field]: true }));
      let err: string | undefined;
      switch (field) {
        case 'fullName':    err = validateFullName(fullName);  break;
        case 'phone':       err = validatePhone(phone);        break;
        case 'primaryRole': err = validatePrimaryRole(primaryRole); break;
        case 'email':       err = validateEmail(email);        break;
        case 'dailyBudget': err = validateDailyBudget(dailyBudget); break;
        case 'location':    err = validateLocation(location);  break;
        case 'password':    err = validatePassword(password);  break;
      }
      setFieldErrors((prev) => ({ ...prev, [field]: err }));
    },
    [fullName, phone, primaryRole, email, dailyBudget, location, password],
  );

  /* validate all on submit */
  const validateAll = (): boolean => {
    const errs: FieldErrors = {
      fullName:    validateFullName(fullName),
      phone:       validatePhone(phone),
      primaryRole: validatePrimaryRole(primaryRole),
      email:       validateEmail(email),
      dailyBudget: validateDailyBudget(dailyBudget),
      location:    validateLocation(location),
      password:    validatePassword(password),
    };
    if (!termsAccepted) errs.terms = 'You must accept the terms.';
    setFieldErrors(errs);
    setTouched({
      fullName: true, phone: true, primaryRole: true,
      email: true, dailyBudget: true, location: true, password: true, terms: true,
    });
    return !Object.values(errs).some(Boolean);
  };

  /* border helper */
  const borderClass = (field: string) => {
    if (fieldErrors[field]) return 'border-[#F40F02]/40 focus:border-[#F40F02] focus:ring-[#F40F02]/15';
    if (touched[field] && !fieldErrors[field]) return 'border-emerald-400 focus:border-emerald-500 focus:ring-emerald-500/20';
    return 'border-neutral-300 focus:border-[#3678F1] focus:ring-[#3678F1]/20';
  };

  /* submit */
  const handleSubmit = async (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!validateAll()) return;

    const e164Phone = toE164India(phone.trim());
    setLoading(true);
    try {
      await api.post('/auth/register/individual', {
        email: email.trim(),
        phone: e164Phone,
        password,
      });

      const otpRes = await api.post<unknown>('/auth/otp/send', { phone: e164Phone });
      console.log('[DEV] OTP send response:', otpRes);

      const [locationCity = '', locationState = ''] = location.trim().split(',').map((s) => s.trim());
      const rateRupees = parseInt(dailyBudget.replace(/[^0-9]/g, ''), 10) || undefined;
      const dailyBudgetPaise = rateRupees != null ? rateRupees * 100 : undefined;

      navigate('/otp-verify', {
        state: {
          phone: e164Phone,
          userType: 'individual',
          pendingProfile: {
            displayName: fullName.trim() || undefined,
            skills: primaryRole ? [primaryRole] : undefined,
            genres: selectedGenres.length ? selectedGenres : undefined,
            locationCity: locationCity || undefined,
            locationState: locationState || undefined,
            dailyBudget: dailyBudgetPaise,
          },
        },
        replace: false,
      });
    } catch (err) {
      const msg =
        err instanceof ApiException
          ? err.payload.message
          : 'Registration failed. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  /* shared input class */
  const inputBase =
    'w-full rounded-xl px-4 py-3 border bg-white text-[15px] text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 transition-all disabled:opacity-50';

  return (
    <AuthLayout
      title="Join as a freelancer"
      subtitle="Create your profile and start receiving booking requests."
      backTo="/register"
      backLabel="Back to account types"
      wide
      brand={{
        eyebrow: 'For freelance professionals',
        headline: 'Get discovered. Get booked. Get paid.',
        description:
          'List your skills, manage your availability, and connect directly with verified production companies — no agency, no middlemen.',
        highlights: BENEFITS,
        bottomText: 'Join 2,000+ freelancers already on Claapo',
      }}
      footer={
        <>
          By creating an account, you agree to our{' '}
          <Link to="/terms" className="hover:text-neutral-600 underline-offset-2 hover:underline">Terms</Link>
          {' '}and{' '}
          <Link to="/privacy" className="hover:text-neutral-600 underline-offset-2 hover:underline">Privacy Policy</Link>.
        </>
      }
    >
      <form className="space-y-5" onSubmit={handleSubmit} noValidate>

        {/* Full Name */}
        <div>
          <label className="block text-[13px] text-neutral-700 mb-1.5 font-semibold">
            Full name <span className="text-[#F40F02]">*</span>
          </label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            onBlur={() => handleBlur('fullName')}
            placeholder="e.g., John Director"
            disabled={loading}
            className={`${inputBase} ${borderClass('fullName')}`}
          />
          {fieldErrors.fullName && <p className="text-xs text-[#F40F02] mt-1.5">{fieldErrors.fullName}</p>}
        </div>

        {/* Phone + Email */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[13px] text-neutral-700 mb-1.5 font-semibold">
              Phone <span className="text-[#F40F02]">*</span>
            </label>
            <div className="flex items-center gap-0">
              <span className="inline-flex items-center px-3 py-3 rounded-l-xl border border-r-0 border-neutral-300 bg-neutral-50 text-neutral-700 text-[15px] font-medium select-none h-[46px]">
                +91
              </span>
              <input
                type="tel"
                value={phone}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                  setPhone(val);
                }}
                onBlur={() => handleBlur('phone')}
                placeholder="98765 43210"
                disabled={loading}
                maxLength={10}
                className={`${inputBase} rounded-l-none border-l-0 ${borderClass('phone')}`}
              />
            </div>
            {fieldErrors.phone && <p className="text-xs text-[#F40F02] mt-1.5">{fieldErrors.phone}</p>}
          </div>
          <div>
            <label className="block text-[13px] text-neutral-700 mb-1.5 font-semibold">
              Email address <span className="text-[#F40F02]">*</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => handleBlur('email')}
              placeholder="you@example.com"
              disabled={loading}
              className={`${inputBase} ${borderClass('email')}`}
            />
            {fieldErrors.email && <p className="text-xs text-[#F40F02] mt-1.5">{fieldErrors.email}</p>}
          </div>
        </div>

        {/* Primary Role */}
        <div>
          <label className="block text-[13px] text-neutral-700 mb-1.5 font-semibold">
            Primary role <span className="text-[#F40F02]">*</span>
          </label>
          <select
            value={primaryRole}
            onChange={(e) => setPrimaryRole(e.target.value)}
            onBlur={() => handleBlur('primaryRole')}
            disabled={loading}
            className={`${inputBase} ${borderClass('primaryRole')}`}
          >
            <option value="">Select role</option>
            {REGISTRATION_INDIVIDUAL_DEPARTMENTS.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
          {fieldErrors.primaryRole && <p className="text-xs text-[#F40F02] mt-1.5">{fieldErrors.primaryRole}</p>}
        </div>

        {/* Genre (multi) */}
        <div>
          <label className="block text-[13px] text-neutral-700 mb-1.5 font-semibold">
            Genres <span className="text-neutral-400 font-normal">(optional, select any)</span>
          </label>
          <div className="flex flex-wrap gap-2 p-3 rounded-xl border border-neutral-300 bg-[#F8FAFC] max-h-40 overflow-y-auto">
            {REGISTRATION_GENRES.map((g) => {
              const on = selectedGenres.includes(g);
              return (
                <button
                  key={g}
                  type="button"
                  disabled={loading}
                  onClick={() =>
                    setSelectedGenres((prev) =>
                      on ? prev.filter((x) => x !== g) : [...prev, g],
                    )
                  }
                  className={`text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors ${
                    on
                      ? 'bg-[#3678F1] text-white border-[#3678F1]'
                      : 'bg-white text-neutral-600 border-neutral-200 hover:border-[#3678F1]/40 hover:text-neutral-900'
                  }`}
                >
                  {g}
                </button>
              );
            })}
          </div>
        </div>

        {/* Daily budget + Location */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[13px] text-neutral-700 mb-1.5 font-semibold">
              Budget <span className="text-[#F40F02]">*</span>
            </label>
            <input
              type="text"
              value={dailyBudget}
              onChange={(e) => setDailyBudget(e.target.value)}
              onBlur={() => handleBlur('dailyBudget')}
              placeholder="e.g., 45000"
              disabled={loading}
              className={`${inputBase} ${borderClass('dailyBudget')}`}
            />
            {fieldErrors.dailyBudget && <p className="text-xs text-[#F40F02] mt-1.5">{fieldErrors.dailyBudget}</p>}
          </div>
          <div>
            <label className="block text-[13px] text-neutral-700 mb-1.5 font-semibold">
              Location <span className="text-[#F40F02]">*</span>
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              onBlur={() => handleBlur('location')}
              placeholder="Mumbai, Maharashtra"
              disabled={loading}
              className={`${inputBase} ${borderClass('location')}`}
            />
            {fieldErrors.location && <p className="text-xs text-[#F40F02] mt-1.5">{fieldErrors.location}</p>}
          </div>
        </div>

        {/* Password */}
        <div>
          <label className="block text-[13px] text-neutral-700 mb-1.5 font-semibold">
            Password <span className="text-[#F40F02]">*</span>
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onBlur={() => handleBlur('password')}
              placeholder="At least 8 characters"
              disabled={loading}
              className={`${inputBase} pr-12 ${borderClass('password')}`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <FaEyeSlash className="w-4 h-4" /> : <FaEye className="w-4 h-4" />}
            </button>
          </div>
          {fieldErrors.password && <p className="text-xs text-[#F40F02] mt-1.5">{fieldErrors.password}</p>}

          {/* strength indicator */}
          {password && (
            <div className="mt-2.5">
              <div className="h-1.5 w-full bg-neutral-200 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{ width: pwStrength.width, backgroundColor: pwStrength.color }}
                />
              </div>
              <p className="text-xs mt-1 font-medium" style={{ color: pwStrength.color }}>
                {pwStrength.label}
              </p>
            </div>
          )}
        </div>

        {/* Terms */}
        <div>
          <label className="flex items-start gap-2.5 text-[13px] text-neutral-600 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={termsAccepted}
              onChange={(e) => setTermsAccepted(e.target.checked)}
              disabled={loading}
              className="w-4 h-4 mt-0.5 rounded border-neutral-300 text-[#3678F1] focus:ring-[#3678F1]/30 shrink-0"
            />
            <span className="leading-snug">
              I agree to the{' '}
              <Link to="/terms"   className="text-[#3678F1] font-semibold hover:underline">Terms</Link>
              {' '}and{' '}
              <Link to="/privacy" className="text-[#3678F1] font-semibold hover:underline">Privacy Policy</Link>.
            </span>
          </label>
          {fieldErrors.terms && <p className="text-xs text-[#F40F02] mt-1.5">{fieldErrors.terms}</p>}
        </div>

        {/* global error */}
        {error && (
          <div className="flex items-start gap-2.5 rounded-xl bg-[#FEEBEA] border border-[#F40F02]/30 px-3.5 py-3">
            <FaTriangleExclamation className="text-[#991B1B] text-sm shrink-0 mt-0.5" aria-hidden />
            <p className="text-[13px] text-[#991B1B] leading-snug">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full inline-flex items-center justify-center gap-2 rounded-xl py-3.5 bg-gradient-to-br from-[#3678F1] to-[#2563EB] text-white text-[15px] font-semibold hover:from-[#2563EB] hover:to-[#1D4ED8] transition-colors shadow-brand disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <span className="w-6 h-6 border-[2.5px] border-white/30 border-t-white border-r-white rounded-full animate-spin" />
              Creating account…
            </>
          ) : (
            <>
              Create freelancer account
              <FaCircleCheck className="w-4 h-4" aria-hidden />
            </>
          )}
        </button>
      </form>

      {/* Divider */}
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-neutral-200" />
        </div>
        <div className="relative flex justify-center">
          <span className="px-3 bg-white text-[11px] uppercase tracking-[0.14em] text-neutral-400 font-semibold">or</span>
        </div>
      </div>

      <p className="text-center text-[14px] text-neutral-600">
        Already have an account?{' '}
        <Link to="/login" className="text-[#3678F1] font-semibold hover:underline">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
}
