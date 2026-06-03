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
import LocationAutocomplete from '../components/LocationAutocomplete';
import { api, ApiException } from '../services/api';
import { PHONE_COUNTRY_CODES, toE164WithCountryCode } from '../utils/phone';

/* ── constants ─────────────────────────────────────────────────────────────── */

const BENEFITS = [
  { icon: FaCertificate, title: 'Showcase your spaces', body: 'List bungalows, studios and set-ups with photos & PDFs.' },
  { icon: FaShieldHalved, title: 'Get discovered', body: 'Production houses find your properties by city and dates.' },
  { icon: FaHandshake, title: 'Get booked & paid', body: 'Manage availability, lock dates, and invoice with GST.' },
];

// Mirrors the backend LOCATION_TYPES (location-type.constants.ts).
const LOCATION_TYPES = [
  { value: 'bungalow_villa_apartment', label: 'Bungalow / Villa / Apartments' },
  { value: 'studio_setup', label: 'Studio Set-Ups' },
  { value: 'location_manager', label: 'Location Manager' },
];

/* ── validation helpers ────────────────────────────────────────────────────── */

type FieldErrors = Record<string, string | undefined>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validatePropertyName(v: string): string | undefined {
  if (!v.trim()) return 'Property name is required.';
  if (v.trim().length < 2) return 'Minimum 2 characters.';
  return undefined;
}
function validatePhone(v: string): string | undefined {
  const digits = v.replace(/\D/g, '');
  if (!digits) return 'Phone number is required.';
  if (digits.length < 6 || digits.length > 14) return 'Enter a valid phone number.';
  return undefined;
}
function validateEmail(v: string): string | undefined {
  if (!v.trim()) return 'Email is required.';
  if (!EMAIL_RE.test(v.trim())) return 'Enter a valid email address.';
  return undefined;
}
function validateRequired(label: string, v: string): string | undefined {
  return v.trim() ? undefined : `${label} is required.`;
}
function validatePassword(v: string): string | undefined {
  if (!v) return 'Password is required.';
  if (v.length < 8) return 'Minimum 8 characters.';
  if (!/[A-Z]/.test(v)) return 'Must contain at least 1 uppercase letter.';
  if (!/[a-z]/.test(v)) return 'Must contain at least 1 lowercase letter.';
  if (!/[0-9]/.test(v)) return 'Must contain at least 1 number.';
  return undefined;
}
function validateConfirmPassword(password: string, confirmPassword: string): string | undefined {
  if (!confirmPassword) return 'Please confirm your password.';
  if (password !== confirmPassword) return 'Passwords do not match.';
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
  if (score <= 2) return { label: 'Weak', color: '#ef4444', width: '33%' };
  if (score <= 3) return { label: 'Medium', color: '#f59e0b', width: '66%' };
  return { label: 'Strong', color: '#22c55e', width: '100%' };
}

/* ── component ─────────────────────────────────────────────────────────────── */

export default function LocationRegistration() {
  const navigate = useNavigate();

  const [propertyName, setPropertyName] = useState('');
  const [countryCode, setCountryCode] = useState('+91');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [locationType, setLocationType] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [location, setLocation] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  useEffect(() => {
    document.title = 'Location Registration – Claapo';
  }, []);

  const pwStrength = useMemo(() => getPasswordStrength(password), [password]);

  const handleBlur = useCallback(
    (field: string) => {
      setTouched((prev) => ({ ...prev, [field]: true }));
      let err: string | undefined;
      switch (field) {
        case 'propertyName': err = validatePropertyName(propertyName); break;
        case 'phone': err = validatePhone(phone); break;
        case 'email': err = validateEmail(email); break;
        case 'locationType': err = validateRequired('Location type', locationType); break;
        case 'location': err = validateRequired('City', location); break;
        case 'password': err = validatePassword(password); break;
        case 'confirmPassword': err = validateConfirmPassword(password, confirmPassword); break;
      }
      setFieldErrors((prev) => ({ ...prev, [field]: err }));
    },
    [propertyName, phone, email, locationType, location, password, confirmPassword],
  );

  const validateAll = (): boolean => {
    const errs: FieldErrors = {
      propertyName: validatePropertyName(propertyName),
      phone: validatePhone(phone),
      email: validateEmail(email),
      locationType: validateRequired('Location type', locationType),
      location: validateRequired('City', location),
      password: validatePassword(password),
      confirmPassword: validateConfirmPassword(password, confirmPassword),
    };
    if (!termsAccepted) errs.terms = 'You must accept the terms.';
    setFieldErrors(errs);
    setTouched({
      propertyName: true, phone: true, email: true, locationType: true,
      location: true, password: true, confirmPassword: true, terms: true,
    });
    return !Object.values(errs).some(Boolean);
  };

  const borderClass = (field: string) => {
    if (fieldErrors[field]) return 'border-[#F40F02]/40 focus:border-[#F40F02] focus:ring-[#F40F02]/15';
    if (touched[field] && !fieldErrors[field]) return 'border-emerald-400 focus:border-emerald-500 focus:ring-emerald-500/20';
    return 'border-neutral-300 focus:border-[#3678F1] focus:ring-[#3678F1]/20';
  };

  const phoneWrapperClass = (field: string) => {
    if (fieldErrors[field]) return 'border-[#F40F02]/40 focus-within:border-[#F40F02] focus-within:ring-[#F40F02]/15';
    if (touched[field] && !fieldErrors[field]) return 'border-emerald-400 focus-within:border-emerald-500 focus-within:ring-emerald-500/20';
    return 'border-neutral-300 dark:border-[#354763] focus-within:border-[#3678F1] focus-within:ring-[#3678F1]/20';
  };

  const handleSubmit = async (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    if (!validateAll()) return;
    const e164Phone = toE164WithCountryCode(phone.trim(), countryCode);
    setLoading(true);
    try {
      const [locationCity = '', locationState = ''] = location.trim().split(',').map((s) => s.trim());
      await api.post('/auth/register/location', {
        email: email.trim(),
        phone: e164Phone,
        password,
        propertyName: propertyName.trim(),
        locationType,
        gstNumber: gstNumber.trim() || undefined,
        locationCity: locationCity || undefined,
      });
      await api.post<unknown>('/auth/otp/email/send', { email: email.trim() });
      navigate('/otp-verify', {
        state: {
          email: email.trim(),
          userType: 'location',
          pendingProfile: {
            propertyName: propertyName.trim() || undefined,
            locationType,
            gstNumber: gstNumber.trim() || undefined,
            locationCity: locationCity || undefined,
            locationState: locationState || undefined,
          },
        },
        replace: false,
      });
    } catch (err) {
      const msg = err instanceof ApiException ? err.payload.message : 'Registration failed. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const inputBase =
    'w-full rounded-xl px-4 py-3 border bg-white dark:bg-[#141A28] text-[15px] text-neutral-900 dark:text-[#F1F5F9] placeholder-neutral-400 focus:outline-none focus:ring-2 transition-all disabled:opacity-50';

  return (
    <AuthLayout
      title="Join as a Location"
      subtitle="List your properties and set-ups to start receiving booking requests."
      backTo="/register"
      backLabel="Back to account types"
      wide
      brand={{
        eyebrow: 'For locations & studios',
        headline: 'List your space. Get booked. Get paid.',
        description:
          'Showcase bungalows, villas, studio set-ups and managed locations. Receive booking requests from verified production houses.',
        highlights: BENEFITS,
        bottomText: 'Trusted by production houses across India',
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
        {/* Property Name */}
        <div>
          <label className="block text-[13px] text-neutral-700 dark:text-[#A1ADC4] mb-1.5 font-semibold">
            Property name <span className="text-[#F40F02]">*</span>
          </label>
          <input
            type="text"
            value={propertyName}
            onChange={(e) => setPropertyName(e.target.value)}
            onBlur={() => handleBlur('propertyName')}
            placeholder="e.g., Sunrise Studios"
            disabled={loading}
            className={`${inputBase} ${borderClass('propertyName')}`}
          />
          {fieldErrors.propertyName && <p className="text-xs text-[#F40F02] mt-1.5">{fieldErrors.propertyName}</p>}
        </div>

        {/* Phone + Email */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[13px] text-neutral-700 dark:text-[#A1ADC4] mb-1.5 font-semibold">
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
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 14))}
                onBlur={() => handleBlur('phone')}
                placeholder="Enter phone number"
                disabled={loading}
                maxLength={14}
                className="flex-1 min-w-0 h-full px-4 bg-transparent text-[15px] text-neutral-900 dark:text-[#F1F5F9] placeholder-neutral-400 focus:outline-none disabled:opacity-50"
              />
            </div>
            {fieldErrors.phone && <p className="text-xs text-[#F40F02] mt-1.5">{fieldErrors.phone}</p>}
          </div>
          <div>
            <label className="block text-[13px] text-neutral-700 dark:text-[#A1ADC4] mb-1.5 font-semibold">
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

        {/* Location Type + GST */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[13px] text-neutral-700 dark:text-[#A1ADC4] mb-1.5 font-semibold">
              Location type <span className="text-[#F40F02]">*</span>
            </label>
            <select
              value={locationType}
              onChange={(e) => setLocationType(e.target.value)}
              onBlur={() => handleBlur('locationType')}
              disabled={loading}
              className={`${inputBase} ${borderClass('locationType')}`}
            >
              <option value="">Select…</option>
              {LOCATION_TYPES.map((lt) => (
                <option key={lt.value} value={lt.value}>{lt.label}</option>
              ))}
            </select>
            {fieldErrors.locationType && <p className="text-xs text-[#F40F02] mt-1.5">{fieldErrors.locationType}</p>}
          </div>
          <div>
            <label className="block text-[13px] text-neutral-700 dark:text-[#A1ADC4] mb-1.5 font-semibold">
              GST number <span className="text-neutral-400 font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={gstNumber}
              onChange={(e) => setGstNumber(e.target.value.toUpperCase())}
              placeholder="e.g., 27AAEXXXXXXXZ5"
              disabled={loading}
              className={`${inputBase} ${borderClass('gstNumber')}`}
            />
          </div>
        </div>

        {/* City */}
        <div>
          <label className="block text-[13px] text-neutral-700 dark:text-[#A1ADC4] mb-1.5 font-semibold">
            City <span className="text-[#F40F02]">*</span>
          </label>
          <LocationAutocomplete
            compact
            city={location.split(',')[0]?.trim() ?? ''}
            state={location.split(',')[1]?.trim() ?? ''}
            onSelect={(loc) => {
              const joined = [loc.city, loc.state].filter(Boolean).join(', ');
              setLocation(joined);
              handleBlur('location');
            }}
            disabled={loading}
            placeholder="Search city or pin code…"
          />
          {fieldErrors.location && <p className="text-xs text-[#F40F02] mt-1.5">{fieldErrors.location}</p>}
        </div>

        {/* Password */}
        <div>
          <label className="block text-[13px] text-neutral-700 dark:text-[#A1ADC4] mb-1.5 font-semibold">
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
              className={`${inputBase} ${borderClass('password')} pr-12`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((p) => !p)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
              tabIndex={-1}
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
          {password && (
            <div className="mt-2 flex items-center gap-2">
              <div className="h-1 flex-1 bg-neutral-200 rounded-full overflow-hidden">
                <div className="h-full transition-all" style={{ background: pwStrength.color, width: pwStrength.width }} />
              </div>
              <span className="text-[11px] font-semibold" style={{ color: pwStrength.color }}>{pwStrength.label}</span>
            </div>
          )}
          {fieldErrors.password && <p className="text-xs text-[#F40F02] mt-1.5">{fieldErrors.password}</p>}
        </div>

        {/* Confirm password */}
        <div>
          <label className="block text-[13px] text-neutral-700 dark:text-[#A1ADC4] mb-1.5 font-semibold">
            Confirm password <span className="text-[#F40F02]">*</span>
          </label>
          <div className="relative">
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              onBlur={() => handleBlur('confirmPassword')}
              placeholder="Repeat password"
              disabled={loading}
              className={`${inputBase} ${borderClass('confirmPassword')} pr-12`}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword((p) => !p)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
              tabIndex={-1}
            >
              {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
          {fieldErrors.confirmPassword && <p className="text-xs text-[#F40F02] mt-1.5">{fieldErrors.confirmPassword}</p>}
        </div>

        {/* Terms */}
        <label className="flex items-start gap-3 text-[13px] text-neutral-700 dark:text-[#A1ADC4]">
          <input
            type="checkbox"
            checked={termsAccepted}
            onChange={(e) => setTermsAccepted(e.target.checked)}
            className="mt-0.5 w-4 h-4 rounded border-neutral-300 text-[#3678F1] focus:ring-[#3678F1]"
          />
          <span>
            I agree to Claapo's{' '}
            <Link to="/terms" className="font-semibold underline hover:text-[#3678F1]">Terms</Link>
            {' '}and{' '}
            <Link to="/privacy" className="font-semibold underline hover:text-[#3678F1]">Privacy Policy</Link>.
          </span>
        </label>
        {fieldErrors.terms && <p className="text-xs text-[#F40F02] -mt-3">{fieldErrors.terms}</p>}

        {error && (
          <div className="flex items-start gap-2 rounded-xl bg-[#F40F02]/5 border border-[#F40F02]/30 px-4 py-3">
            <FaTriangleExclamation className="text-[#F40F02] mt-0.5 shrink-0" />
            <p className="text-[13px] text-[#F40F02]">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#3678F1] text-white font-semibold rounded-xl py-3.5 hover:bg-[#2563EB] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Creating account…
            </>
          ) : (
            <>
              <FaCircleCheck />
              Create location account
            </>
          )}
        </button>

        <p className="text-center text-[13px] text-neutral-500 dark:text-[#A1ADC4]">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-[#3678F1] hover:underline">Sign in</Link>
        </p>
      </form>
    </AuthLayout>
  );
}
