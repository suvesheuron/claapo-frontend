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
import { REGISTRATION_VENDOR_CATEGORIES, vendorCategoryToVendorType } from '../constants/registrationCategories';

/* ── Validation helpers ── */

const GST_REGEX   = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[A-Z0-9]{1}Z[A-Z0-9]{1}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type FieldErrors = {
  businessName?:    string;
  phone?:           string;
  gst?:             string;
  email?:           string;
  vendorCategory?:  string;
  password?:        string;
  confirmPassword?: string;
};

function validateField(name: keyof FieldErrors, value: string): string | undefined {
  switch (name) {
    case 'businessName':
      if (!value.trim()) return 'Business name is required';
      if (value.trim().length < 2) return 'Must be at least 2 characters';
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
    case 'vendorCategory':
      if (!value) return 'Please select your vendor category';
      return undefined;
    case 'password':
      if (!value) return 'Password is required';
      if (value.length < 8) return 'Must be at least 8 characters';
      if (!/[A-Z]/.test(value)) return 'Must contain at least 1 uppercase letter';
      if (!/[a-z]/.test(value)) return 'Must contain at least 1 lowercase letter';
      if (!/[0-9]/.test(value)) return 'Must contain at least 1 number';
      return undefined;
    default:
      return undefined;
  }
}

function getPasswordStrength(pw: string): { label: string; color: string; width: string } {
  if (!pw) return { label: '', color: '', width: '0%' };
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[a-z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;

  if (score <= 2) return { label: 'Weak',   color: '#EF4444', width: '33%'  };
  if (score <= 3) return { label: 'Fair',   color: '#F59E0B', width: '55%'  };
  if (score === 4) return { label: 'Good',  color: '#3B82F6', width: '75%'  };
  return                     { label: 'Strong', color: '#22C55E', width: '100%' };
}

function validateConfirmPassword(password: string, confirmPassword: string): string | undefined {
  if (!confirmPassword) return 'Please confirm your password';
  if (password !== confirmPassword) return 'Passwords do not match';
  return undefined;
}

const BENEFITS = [
  { icon: FaCertificate,  title: 'Verified business',     body: 'Optional GST adds a verified badge to your vendor profile.' },
  { icon: FaShieldHalved, title: 'Secure bookings',       body: 'Protected transactions, contracts and clear payment terms.' },
  { icon: FaHandshake,    title: 'Pan-India reach',       body: 'Get discovered by production teams across the country.' },
];

/* ── Component ── */

export default function VendorRegistration() {
  const navigate = useNavigate();

  const [businessName,   setBusinessName]   = useState('');
  const [countryCode,    setCountryCode]    = useState('+91');
  const [phone,          setPhone]          = useState('');
  const [gst,            setGst]            = useState('');
  const [email,          setEmail]          = useState('');
  const [vendorCategory, setVendorCategory] = useState('');
  const [password,       setPassword]       = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword,   setShowPassword]   = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreedTerms,    setAgreedTerms]    = useState(false);
  const [loading,        setLoading]        = useState(false);
  const [error,          setError]          = useState<string | null>(null);

  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  useEffect(() => {
    document.title = 'Vendor Registration – Claapo';
  }, []);

  const handleBlur = useCallback((name: keyof FieldErrors, value: string) => {
    setTouched((t) => ({ ...t, [name]: true }));
    const err = validateField(name, value);
    setFieldErrors((prev) => ({ ...prev, [name]: err }));
  }, []);

  const validateAll = (): boolean => {
    const fields: [keyof FieldErrors, string][] = [
      ['businessName',   businessName],
      ['phone',          phone],
      ['gst',            gst],
      ['email',          email],
      ['vendorCategory', vendorCategory],
      ['password',       password],
    ];
    const newErrors: FieldErrors = {};
    const newTouched: Record<string, boolean> = {};
    let valid = true;
    for (const [name, value] of fields) {
      newTouched[name] = true;
      const err = validateField(name, value);
      if (err) {
        newErrors[name] = err;
        valid = false;
      }
    }
    const confirmErr = validateConfirmPassword(password, confirmPassword);
    if (confirmErr) {
      newErrors.confirmPassword = confirmErr;
      valid = false;
    }
    newTouched.confirmPassword = true;
    setFieldErrors(newErrors);
    setTouched((t) => ({ ...t, ...newTouched }));
    return valid;
  };

  const borderClass = (name: keyof FieldErrors) => {
    if (fieldErrors[name]) return 'border-[#F40F02]/40 focus:border-[#F40F02] focus:ring-[#F40F02]/15';
    if (touched[name] && !fieldErrors[name]) return 'border-emerald-400 focus:border-emerald-500 focus:ring-emerald-500/20';
    return 'border-neutral-300 focus:border-[#3678F1] focus:ring-[#3678F1]/20';
  };

  const passwordStrength = getPasswordStrength(password);

  const handleSubmit = async (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!validateAll()) return;

    const e164Phone = toE164WithCountryCode(phone.trim(), countryCode);
    if (phone.replace(/\D/g, '').length < 6) {
      setError('Please enter a valid phone number.');
      return;
    }

    setLoading(true);
    try {
      // Step 1: register account
      await api.post('/auth/register/vendor', {
        email: email.trim(),
        phone: e164Phone,
        password,
      });

      // Step 2: send OTP
      const otpRes = await api.post<unknown>('/auth/otp/send', { phone: e164Phone });
      console.log('[DEV] OTP send response:', otpRes);

      // Step 3: go to OTP verification with pending profile data
      navigate('/otp-verify', {
        state: {
          phone: e164Phone,
          userType: 'vendor',
          pendingProfile: {
            companyName: businessName.trim() || undefined,
            ...(vendorCategory
              ? {
                  vendorType: vendorCategoryToVendorType(vendorCategory),
                  vendorServiceCategory: vendorCategory,
                }
              : {}),
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

  const inputBase =
    'w-full rounded-xl px-4 py-3 border bg-white text-[15px] text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 transition-all disabled:opacity-50';

  return (
    <AuthLayout
      title="Register as a vendor"
      subtitle="List your equipment and services to get discovered by production houses."
      backTo="/register"
      backLabel="Back to account types"
      wide
      brand={{
        eyebrow: 'For equipment & service vendors',
        headline: 'List once. Get booked everywhere.',
        description:
          'Add your inventory, manage rental calendars and receive direct booking requests from verified production teams.',
        highlights: BENEFITS,
        bottomText: 'Free to list — only pay when you get booked',
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

        {/* Business Name */}
        <div>
          <label className="block text-[13px] text-neutral-700 mb-1.5 font-semibold">
            Business name <span className="text-[#F40F02]">*</span>
          </label>
          <input
            type="text"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            onBlur={() => handleBlur('businessName', businessName)}
            placeholder="e.g., Pro Gear Rentals"
            disabled={loading}
            className={`${inputBase} ${borderClass('businessName')}`}
          />
          {fieldErrors.businessName && <p className="text-xs text-[#F40F02] mt-1.5">{fieldErrors.businessName}</p>}
        </div>

        {/* Vendor Category */}
        <div>
          <label className="block text-[13px] text-neutral-700 mb-1.5 font-semibold">
            Business type <span className="text-[#F40F02]">*</span>
          </label>
          <select
            value={vendorCategory}
            onChange={(e) => setVendorCategory(e.target.value)}
            onBlur={() => handleBlur('vendorCategory', vendorCategory)}
            disabled={loading}
            className={`${inputBase} ${borderClass('vendorCategory')}`}
          >
            <option value="">Select category…</option>
            {REGISTRATION_VENDOR_CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          {fieldErrors.vendorCategory && <p className="text-xs text-[#F40F02] mt-1.5">{fieldErrors.vendorCategory}</p>}
        </div>

        {/* Phone + GST */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[13px] text-neutral-700 mb-1.5 font-semibold">
              Phone <span className="text-[#F40F02]">*</span>
            </label>
            <div className="flex items-center gap-0">
              <select
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
                disabled={loading}
                className="rounded-l-xl border border-r-0 border-neutral-300 bg-neutral-50 text-neutral-700 text-[15px] font-medium h-[46px] px-2 focus:outline-none focus:ring-2 focus:ring-[#3678F1]/20"
                aria-label="Country code"
              >
                {PHONE_COUNTRY_CODES.map((country) => (
                  <option key={`${country.iso2}-${country.label}`} value={country.dialCode}>
                    {country.label}
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
                className={`${inputBase} rounded-l-none border-l-0 ${borderClass('phone')}`}
              />
            </div>
            {fieldErrors.phone && <p className="text-xs text-[#F40F02] mt-1.5">{fieldErrors.phone}</p>}
          </div>
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
              onChange={(e) => setGst(e.target.value.toUpperCase())}
              onBlur={() => handleBlur('gst', gst)}
              placeholder="27AABCU9603R1ZM"
              disabled={loading}
              className={`${inputBase} ${borderClass('gst')}`}
            />
            {fieldErrors.gst && <p className="text-xs text-[#F40F02] mt-1.5">{fieldErrors.gst}</p>}
          </div>
        </div>

        {/* Email */}
        <div>
          <label className="block text-[13px] text-neutral-700 mb-1.5 font-semibold">
            Email address <span className="text-[#F40F02]">*</span>
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={() => handleBlur('email', email)}
            placeholder="vendor@example.com"
            disabled={loading}
            className={`${inputBase} ${borderClass('email')}`}
          />
          {fieldErrors.email && <p className="text-xs text-[#F40F02] mt-1.5">{fieldErrors.email}</p>}
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
                  style={{ width: passwordStrength.width, backgroundColor: passwordStrength.color }}
                />
              </div>
              <p className="text-xs mt-1 font-medium" style={{ color: passwordStrength.color }}>
                {passwordStrength.label}
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
                if (touched.confirmPassword) {
                  setFieldErrors((prev) => ({
                    ...prev,
                    confirmPassword: validateConfirmPassword(password, e.target.value),
                  }));
                }
              }}
              onBlur={() => {
                setTouched((t) => ({ ...t, confirmPassword: true }));
                setFieldErrors((prev) => ({
                  ...prev,
                  confirmPassword: validateConfirmPassword(password, confirmPassword),
                }));
              }}
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
            checked={agreedTerms}
            onChange={(e) => setAgreedTerms(e.target.checked)}
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

        {/* Global error */}
        {error && (
          <div className="flex items-start gap-2.5 rounded-xl bg-[#FEEBEA] border border-[#F40F02]/30 px-3.5 py-3">
            <FaTriangleExclamation className="text-[#991B1B] text-sm shrink-0 mt-0.5" aria-hidden />
            <p className="text-[13px] text-[#991B1B] leading-snug">{error}</p>
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={loading || !agreedTerms}
          className="w-full inline-flex items-center justify-center gap-2 rounded-xl py-3.5 bg-gradient-to-br from-[#3678F1] to-[#2563EB] text-white text-[15px] font-semibold hover:from-[#2563EB] hover:to-[#1D4ED8] transition-colors shadow-brand disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <span className="w-6 h-6 border-[2.5px] border-white/30 border-t-white border-r-white rounded-full animate-spin" />
              Creating account…
            </>
          ) : (
            <>
              Create vendor account
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
