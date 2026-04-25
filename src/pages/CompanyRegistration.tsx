import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useState, useCallback, type SyntheticEvent } from 'react';
import {
  FaShieldHalved,
  FaCertificate,
  FaHandshake,
  FaCircleCheck,
  FaTriangleExclamation,
  FaEye,
  FaEyeSlash,
} from 'react-icons/fa6';
import AuthLayout from '../components/AuthLayout';
import { api, ApiException } from '../services/api';
import { PHONE_COUNTRY_CODES, toE164WithCountryCode } from '../utils/phone';
import { REGISTRATION_COMPANY_TYPES } from '../constants/registrationCategories';

/* ── Validation helpers ── */

const GST_REGEX   = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[A-Z0-9]{1}Z[A-Z0-9]{1}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type FieldErrors = {
  companyName?: string;
  companyType?: string;
  phone?:       string;
  gst?:         string;
  email?:       string;
  password?:    string;
  confirmPassword?: string;
};

function validateField(field: keyof FieldErrors, value: string): string | undefined {
  switch (field) {
    case 'companyName':
      if (!value.trim()) return 'Company name is required';
      if (value.trim().length < 2) return 'Must be at least 2 characters';
      return undefined;
    case 'companyType':
      if (!value.trim()) return 'Select your company category';
      return undefined;
    case 'phone': {
      const digits = value.replace(/\D/g, '');
      if (!digits) return 'Phone number is required';
      if (digits.length < 6 || digits.length > 14) return 'Enter a valid phone number';
      return undefined;
    }
    case 'gst':
      if (!value.trim()) return undefined; // optional
      if (!GST_REGEX.test(value.trim().toUpperCase())) return 'Invalid GST format';
      return undefined;
    case 'email':
      if (!value.trim()) return 'Email is required';
      if (!EMAIL_REGEX.test(value.trim())) return 'Enter a valid email address';
      return undefined;
    case 'password':
      if (!value) return 'Password is required';
      if (value.length < 8) return 'Must be at least 8 characters';
      if (!/[A-Z]/.test(value)) return 'Must contain an uppercase letter';
      if (!/[a-z]/.test(value)) return 'Must contain a lowercase letter';
      if (!/[0-9]/.test(value)) return 'Must contain a number';
      return undefined;
    default:
      return undefined;
  }
}

function getPasswordStrength(pw: string): { label: string; color: string; width: string } {
  if (!pw) return { label: '', color: '', width: '0%' };
  let score = 0;
  if (pw.length >= 8)  score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw))      score++;
  if (/[a-z]/.test(pw))      score++;
  if (/[0-9]/.test(pw))      score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;

  if (score <= 2) return { label: 'Weak',   color: '#ef4444', width: '33%'  };
  if (score <= 4) return { label: 'Medium', color: '#f59e0b', width: '66%'  };
  return                     { label: 'Strong', color: '#22c55e', width: '100%' };
}

function validateConfirmPassword(password: string, confirmPassword: string): string | undefined {
  if (!confirmPassword) return 'Please confirm your password';
  if (password !== confirmPassword) return 'Passwords do not match';
  return undefined;
}

const BENEFITS = [
  { icon: FaCertificate,  title: 'GST verification',     body: 'Verified business profiles your crew and vendors can trust.' },
  { icon: FaShieldHalved, title: 'Secure onboarding',    body: 'Enterprise-grade security for your company and project data.' },
  { icon: FaHandshake,    title: 'Trusted by teams',     body: 'Hundreds of production houses already manage their crews here.' },
];

/* ── Component ── */

export default function CompanyRegistration() {
  const navigate = useNavigate();

  const [companyName,  setCompanyName]  = useState('');
  const [companyType,  setCompanyType]  = useState('');
  const [countryCode,  setCountryCode]  = useState('+91');
  const [phone,        setPhone]        = useState('');
  const [gst,          setGst]          = useState('');
  const [email,        setEmail]        = useState('');
  const [password,     setPassword]     = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [terms,        setTerms]        = useState(false);
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState<string | null>(null);

  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<Record<keyof FieldErrors, boolean>>({
    companyName: false,
    companyType: false,
    phone: false,
    gst: false,
    email: false,
    password: false,
    confirmPassword: false,
  });

  useEffect(() => {
    document.title = 'Company Registration – Claapo';
  }, []);

  const handleBlur = useCallback(
    (field: keyof FieldErrors, value: string) => {
      setTouched((t) => ({ ...t, [field]: true }));
      const err =
        field === 'confirmPassword'
          ? validateConfirmPassword(password, value)
          : validateField(field, value);
      setFieldErrors((prev) => ({ ...prev, [field]: err }));
    },
    [password],
  );

  const borderClass = (field: keyof FieldErrors) => {
    if (fieldErrors[field]) return 'border-[#F40F02]/40 focus:border-[#F40F02] focus:ring-[#F40F02]/15';
    if (touched[field] && !fieldErrors[field]) return 'border-emerald-400 focus:border-emerald-500 focus:ring-emerald-500/20';
    return 'border-neutral-300 focus:border-[#3678F1] focus:ring-[#3678F1]/20';
  };

  const phoneWrapperClass = (field: keyof FieldErrors) => {
    if (fieldErrors[field]) return 'border-[#F40F02]/40 focus-within:border-[#F40F02] focus-within:ring-[#F40F02]/15';
    if (touched[field] && !fieldErrors[field]) return 'border-emerald-400 focus-within:border-emerald-500 focus-within:ring-emerald-500/20';
    return 'border-neutral-300 dark:border-[#354763] focus-within:border-[#3678F1] focus-within:ring-[#3678F1]/20';
  };

  const strength = getPasswordStrength(password);

  /* ── Submit ── */

  const handleSubmit = async (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const fields: { key: keyof FieldErrors; value: string }[] = [
      { key: 'companyName', value: companyName },
      { key: 'companyType', value: companyType },
      { key: 'phone',       value: phone       },
      { key: 'gst',         value: gst         },
      { key: 'email',       value: email       },
      { key: 'password',    value: password    },
    ];

    const newErrors: FieldErrors = {};
    const newTouched: Record<keyof FieldErrors, boolean> = {
      companyName: true,
      companyType: true,
      phone: true,
      gst: true,
      email: true,
      password: true,
      confirmPassword: true,
    };

    for (const { key, value } of fields) {
      const err = validateField(key, value);
      if (err) newErrors[key] = err;
    }
    const confirmErr = validateConfirmPassword(password, confirmPassword);
    if (confirmErr) newErrors.confirmPassword = confirmErr;

    setFieldErrors(newErrors);
    setTouched(newTouched);

    if (Object.keys(newErrors).length > 0) return;

    const e164Phone = toE164WithCountryCode(phone.trim(), countryCode);

    setLoading(true);
    try {
      await api.post('/auth/register/company', {
        email: email.trim(),
        phone: e164Phone,
        password,
        ...(gst.trim() ? { gstNumber: gst.trim().toUpperCase() } : {}),
      });

      const otpRes = await api.post<unknown>('/auth/otp/send', { phone: e164Phone });
      console.log('[DEV] OTP send response:', otpRes);

      navigate('/otp-verify', {
        state: {
          phone: e164Phone,
          userType: 'company',
          pendingProfile: {
            companyName: companyName.trim() || undefined,
            companyType: companyType.trim() || undefined,
          },
        },
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

  /* ── Input base classes ── */
  const inputBase =
    'w-full rounded-xl px-4 py-3 border bg-white text-[15px] text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 transition-all disabled:opacity-50';

  return (
    <AuthLayout
      title="Register your company"
      subtitle="Hire verified crew and vendors from one centralized dashboard."
      backTo="/register"
      backLabel="Back to account types"
      wide
      brand={{
        eyebrow: 'For production companies & agencies',
        headline: 'Centralize hiring. Move faster.',
        description:
          'Find verified crew, lock vendors, manage projects end-to-end and collaborate with your team — all in one place.',
        highlights: BENEFITS,
        bottomText: 'Join hundreds of studios using Claapo every day',
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

        {/* Company Name */}
        <div>
          <label className="block text-[13px] text-neutral-700 mb-1.5 font-semibold">
            Company name <span className="text-[#F40F02]">*</span>
          </label>
          <input
            type="text"
            value={companyName}
            onChange={(e) => {
              setCompanyName(e.target.value);
              if (touched.companyName)
                setFieldErrors((p) => ({ ...p, companyName: validateField('companyName', e.target.value) }));
            }}
            onBlur={() => handleBlur('companyName', companyName)}
            placeholder="e.g., Production Studios Inc."
            disabled={loading}
            className={`${inputBase} ${borderClass('companyName')}`}
          />
          {fieldErrors.companyName && <p className="text-xs text-[#F40F02] mt-1.5">{fieldErrors.companyName}</p>}
        </div>

        {/* Company Type */}
        <div>
          <label className="block text-[13px] text-neutral-700 mb-1.5 font-semibold">
            Company category <span className="text-[#F40F02]">*</span>
          </label>
          <select
            value={companyType}
            onChange={(e) => {
              setCompanyType(e.target.value);
              if (touched.companyType)
                setFieldErrors((p) => ({ ...p, companyType: validateField('companyType', e.target.value) }));
            }}
            onBlur={() => handleBlur('companyType', companyType)}
            disabled={loading}
            className={`${inputBase} ${borderClass('companyType')}`}
          >
            <option value="">Select category…</option>
            {REGISTRATION_COMPANY_TYPES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          {fieldErrors.companyType && <p className="text-xs text-[#F40F02] mt-1.5">{fieldErrors.companyType}</p>}
        </div>

        {/* Email */}
        <div>
          <label className="block text-[13px] text-neutral-700 mb-1.5 font-semibold">
            Work email <span className="text-[#F40F02]">*</span>
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (touched.email)
                setFieldErrors((p) => ({ ...p, email: validateField('email', e.target.value) }));
            }}
            onBlur={() => handleBlur('email', email)}
            placeholder="you@company.com"
            disabled={loading}
            className={`${inputBase} ${borderClass('email')}`}
          />
          {fieldErrors.email && <p className="text-xs text-[#F40F02] mt-1.5">{fieldErrors.email}</p>}
        </div>

        {/* Phone */}
        <div>
          <label className="block text-[13px] text-neutral-700 mb-1.5 font-semibold">
            Phone <span className="text-[#F40F02]">*</span>
          </label>
          <div className={`flex items-stretch h-[46px] rounded-xl border bg-white dark:bg-[#141A28] overflow-hidden transition-all focus-within:ring-2 ${phoneWrapperClass('phone')}`}>
            <select
              value={countryCode}
              onChange={(e) => setCountryCode(e.target.value)}
              disabled={loading}
              className="shrink-0 w-[88px] h-full bg-neutral-50 dark:bg-[#1E2640] border-r border-neutral-300 dark:border-[#354763] text-neutral-800 dark:text-[#F1F5F9] text-[15px] font-medium px-2.5 focus:outline-none cursor-pointer disabled:opacity-50"
              aria-label="Country code"
            >
              {PHONE_COUNTRY_CODES.map((country) => (
                <option key={`${country.iso2}-${country.label}`} value={country.dialCode} title={country.label}>
                  {country.dialCode}
                </option>
              ))}
            </select>
            <input
              type="tel"
              value={phone}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '').slice(0, 14);
                setPhone(val);
              }}
              onBlur={() => handleBlur('phone', phone)}
              placeholder="Enter phone number"
              disabled={loading}
              maxLength={14}
              className="flex-1 min-w-0 h-full px-4 bg-transparent text-[15px] text-neutral-900 dark:text-[#F1F5F9] placeholder-neutral-400 focus:outline-none disabled:opacity-50"
            />
          </div>
          {fieldErrors.phone && <p className="text-xs text-[#F40F02] mt-1.5">{fieldErrors.phone}</p>}
        </div>

        {/* GST */}
        <div>
          <label className="block text-[13px] text-neutral-700 mb-1.5 font-semibold">
            GST{' '}
            <span className="text-[10px] font-normal text-neutral-400 bg-neutral-100 px-2 py-0.5 rounded-full ml-1">
              Optional
            </span>
          </label>
          <input
            type="text"
            value={gst}
            onChange={(e) => {
              setGst(e.target.value);
              if (touched.gst)
                setFieldErrors((p) => ({ ...p, gst: validateField('gst', e.target.value) }));
            }}
            onBlur={() => handleBlur('gst', gst)}
            placeholder="27AABCU9603R1ZM"
            disabled={loading}
            className={`${inputBase} ${borderClass('gst')}`}
          />
          {fieldErrors.gst && <p className="text-xs text-[#F40F02] mt-1.5">{fieldErrors.gst}</p>}
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
              onChange={(e) => {
                setPassword(e.target.value);
                if (touched.password)
                  setFieldErrors((p) => ({ ...p, password: validateField('password', e.target.value) }));
              }}
              onBlur={() => handleBlur('password', password)}
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
          {password && (
            <div className="mt-2.5">
              <div className="h-1.5 w-full bg-neutral-200 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{ width: strength.width, backgroundColor: strength.color }}
                />
              </div>
              <p className="text-xs font-medium mt-1" style={{ color: strength.color }}>
                {strength.label}
              </p>
            </div>
          )}
        </div>

        {/* Confirm Password */}
        <div>
          <label className="block text-[13px] text-neutral-700 mb-1.5 font-semibold">
            Confirm password <span className="text-[#F40F02]">*</span>
          </label>
          <div className="relative">
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (touched.confirmPassword)
                  setFieldErrors((p) => ({
                    ...p,
                    confirmPassword: validateConfirmPassword(password, e.target.value),
                  }));
              }}
              onBlur={() => handleBlur('confirmPassword', confirmPassword)}
              placeholder="Re-enter your password"
              disabled={loading}
              className={`${inputBase} pr-12 ${borderClass('confirmPassword')}`}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword((v) => !v)}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
              aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
            >
              {showConfirmPassword ? <FaEyeSlash className="w-4 h-4" /> : <FaEye className="w-4 h-4" />}
            </button>
          </div>
          {fieldErrors.confirmPassword && <p className="text-xs text-[#F40F02] mt-1.5">{fieldErrors.confirmPassword}</p>}
        </div>

        {/* Terms */}
        <label className="flex items-start gap-2.5 text-[13px] text-neutral-600 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={terms}
            onChange={(e) => setTerms(e.target.checked)}
            disabled={loading}
            className="w-4 h-4 mt-0.5 rounded border-neutral-300 text-[#3678F1] focus:ring-[#3678F1]/30 shrink-0"
          />
          <span className="leading-snug">
            I agree to the{' '}
            <Link to="/terms"   className="text-[#3678F1] font-semibold hover:underline">Terms of Service</Link>
            {' '}and{' '}
            <Link to="/privacy" className="text-[#3678F1] font-semibold hover:underline">Privacy Policy</Link>.
          </span>
        </label>

        {/* API error */}
        {error && (
          <div className="flex items-start gap-2.5 rounded-xl bg-[#FEEBEA] border border-[#F40F02]/30 px-3.5 py-3">
            <FaTriangleExclamation className="text-[#991B1B] text-sm shrink-0 mt-0.5" aria-hidden />
            <p className="text-[13px] text-[#991B1B] leading-snug">{error}</p>
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={loading || !terms}
          className="w-full inline-flex items-center justify-center gap-2 rounded-xl py-3.5 bg-gradient-to-br from-[#3678F1] to-[#2563EB] text-white text-[15px] font-semibold hover:from-[#2563EB] hover:to-[#1D4ED8] transition-colors shadow-brand disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <span className="w-6 h-6 border-[2.5px] border-white/30 border-t-white border-r-white rounded-full animate-spin" />
              Registering…
            </>
          ) : (
            <>
              Register company
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
