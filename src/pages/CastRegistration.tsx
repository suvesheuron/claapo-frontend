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
  { icon: FaCertificate, title: 'Verified profiles', body: 'Build trust with verified cast cards.' },
  { icon: FaShieldHalved, title: 'Direct casting calls', body: 'Get found by production houses and casting directors.' },
  { icon: FaHandshake, title: 'Get booked & paid', body: 'Manage your availability, lock dates, and invoice with GST.' },
];

const ROLE_TYPES = [
  { value: 'actor', label: 'Actor' },
  { value: 'model', label: 'Model' },
];

const GENDERS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
];

/* ── validation helpers ────────────────────────────────────────────────────── */

type FieldErrors = Record<string, string | undefined>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NAME_RE = /^[A-Za-z\s]+$/;

function validateFullName(v: string): string | undefined {
  if (!v.trim()) return 'Full name is required.';
  if (v.trim().length < 2) return 'Minimum 2 characters.';
  if (!NAME_RE.test(v.trim())) return 'Only letters and spaces allowed.';
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
function validateAge(v: string): string | undefined {
  if (!v.trim()) return 'Age is required.';
  const n = parseInt(v, 10);
  if (isNaN(n) || n < 1 || n > 120) return 'Enter a valid age.';
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

export default function CastRegistration() {
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [countryCode, setCountryCode] = useState('+91');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [location, setLocation] = useState('');
  const [roleType, setRoleType] = useState('');
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
    document.title = 'Cast Registration – Claapo';
  }, []);

  const pwStrength = useMemo(() => getPasswordStrength(password), [password]);

  const handleBlur = useCallback(
    (field: string) => {
      setTouched((prev) => ({ ...prev, [field]: true }));
      let err: string | undefined;
      switch (field) {
        case 'fullName': err = validateFullName(fullName); break;
        case 'phone': err = validatePhone(phone); break;
        case 'email': err = validateEmail(email); break;
        case 'age': err = validateAge(age); break;
        case 'gender': err = validateRequired('Gender', gender); break;
        case 'location': err = validateRequired('Location', location); break;
        case 'roleType': err = validateRequired('Role type', roleType); break;
        case 'password': err = validatePassword(password); break;
        case 'confirmPassword': err = validateConfirmPassword(password, confirmPassword); break;
      }
      setFieldErrors((prev) => ({ ...prev, [field]: err }));
    },
    [fullName, phone, email, age, gender, location, roleType, password, confirmPassword],
  );

  const validateAll = (): boolean => {
    const errs: FieldErrors = {
      fullName: validateFullName(fullName),
      phone: validatePhone(phone),
      email: validateEmail(email),
      age: validateAge(age),
      gender: validateRequired('Gender', gender),
      location: validateRequired('Location', location),
      roleType: validateRequired('Role type', roleType),
      password: validatePassword(password),
      confirmPassword: validateConfirmPassword(password, confirmPassword),
    };
    if (!termsAccepted) errs.terms = 'You must accept the terms.';
    setFieldErrors(errs);
    setTouched({
      fullName: true, phone: true, email: true, age: true, gender: true,
      location: true, roleType: true, password: true, confirmPassword: true, terms: true,
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
      const [locationCity = ''] = location.trim().split(',').map((s) => s.trim());
      await api.post('/auth/register/cast', {
        email: email.trim(),
        phone: e164Phone,
        password,
        displayName: fullName.trim(),
        roleType,
        age: parseInt(age, 10) || undefined,
        gender: gender || undefined,
        locationCity: locationCity || undefined,
      });
      await api.post<unknown>('/auth/otp/send', { phone: e164Phone });
      const [, locationState = ''] = location.trim().split(',').map((s) => s.trim());
      navigate('/otp-verify', {
        state: {
          phone: e164Phone,
          userType: 'cast',
          pendingProfile: {
            displayName: fullName.trim() || undefined,
            roleType,
            age: parseInt(age, 10) || undefined,
            gender: gender || undefined,
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
      title="Join as Cast"
      subtitle="Create your cast profile to start receiving casting calls."
      backTo="/register"
      backLabel="Back to account types"
      wide
      brand={{
        eyebrow: 'For actors & models',
        headline: 'Get discovered. Get cast. Get paid.',
        description:
          'List your look, languages and reels. Receive booking requests from verified production houses and casting directors.',
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
        {/* Full Name */}
        <div>
          <label className="block text-[13px] text-neutral-700 dark:text-[#A1ADC4] mb-1.5 font-semibold">
            Full name <span className="text-[#F40F02]">*</span>
          </label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            onBlur={() => handleBlur('fullName')}
            placeholder="e.g., Aanya Kapoor"
            disabled={loading}
            className={`${inputBase} ${borderClass('fullName')}`}
          />
          {fieldErrors.fullName && <p className="text-xs text-[#F40F02] mt-1.5">{fieldErrors.fullName}</p>}
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

        {/* Role Type + Age + Gender */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-[13px] text-neutral-700 dark:text-[#A1ADC4] mb-1.5 font-semibold">
              Role type <span className="text-[#F40F02]">*</span>
            </label>
            <select
              value={roleType}
              onChange={(e) => setRoleType(e.target.value)}
              onBlur={() => handleBlur('roleType')}
              disabled={loading}
              className={`${inputBase} ${borderClass('roleType')}`}
            >
              <option value="">Select…</option>
              {ROLE_TYPES.map((rt) => (
                <option key={rt.value} value={rt.value}>{rt.label}</option>
              ))}
            </select>
            {fieldErrors.roleType && <p className="text-xs text-[#F40F02] mt-1.5">{fieldErrors.roleType}</p>}
          </div>
          <div>
            <label className="block text-[13px] text-neutral-700 dark:text-[#A1ADC4] mb-1.5 font-semibold">
              Age <span className="text-[#F40F02]">*</span>
            </label>
            <input
              type="number"
              min={1}
              max={120}
              value={age}
              onChange={(e) => setAge(e.target.value.replace(/\D/g, '').slice(0, 3))}
              onBlur={() => handleBlur('age')}
              placeholder="26"
              disabled={loading}
              className={`${inputBase} ${borderClass('age')}`}
            />
            {fieldErrors.age && <p className="text-xs text-[#F40F02] mt-1.5">{fieldErrors.age}</p>}
          </div>
          <div>
            <label className="block text-[13px] text-neutral-700 dark:text-[#A1ADC4] mb-1.5 font-semibold">
              Gender <span className="text-[#F40F02]">*</span>
            </label>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              onBlur={() => handleBlur('gender')}
              disabled={loading}
              className={`${inputBase} ${borderClass('gender')}`}
            >
              <option value="">Select…</option>
              {GENDERS.map((g) => (
                <option key={g.value} value={g.value}>{g.label}</option>
              ))}
            </select>
            {fieldErrors.gender && <p className="text-xs text-[#F40F02] mt-1.5">{fieldErrors.gender}</p>}
          </div>
        </div>

        {/* City — suggestion-based picker (Nominatim) so users don't have to
            remember exact spelling. Same component used in profile edit. */}
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
              Create cast account
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
