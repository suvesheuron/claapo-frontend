import { Link, useNavigate } from 'react-router-dom';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FaUsers,
  FaCircleCheck,
  FaCertificate,
  FaShieldHalved,
  FaHandshake,
  FaLock,
  FaTriangleExclamation,
  FaEye,
  FaEyeSlash,
} from 'react-icons/fa6';
import AppHeader from '../components/AppHeader';
import AppFooter from '../components/AppFooter';
import { api, ApiException } from '../services/api';
import { toE164India } from '../utils/phone';

/* ── constants ─────────────────────────────────────────────────────────────── */

const ROLES = [
  'Director',
  'DOP/Cinematographer',
  'Camera Operator',
  'Sound Engineer',
  'Gaffer',
  'Editor',
  'Makeup Artist',
  'Production Designer',
  'VFX Artist',
  'Line Producer',
  'Other',
] as const;

const BENEFITS = [
  { icon: FaCertificate, title: 'Verified Profiles', desc: 'Build trust with verified skills and portfolio' },
  { icon: FaShieldHalved, title: 'Secure Payments', desc: 'Get paid on time with protected transactions' },
  { icon: FaHandshake, title: 'Direct Bookings', desc: 'Receive requests and confirm availability easily' },
] as const;

/* ── validation helpers ────────────────────────────────────────────────────── */

type FieldErrors = Record<string, string | undefined>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NAME_RE = /^[A-Za-z\s]+$/;
const PHONE_RE = /^[6-9]\d{9}$/;

function validateFullName(v: string): string | undefined {
  if (!v.trim()) return 'Full name is required.';
  if (v.trim().length < 2) return 'Minimum 2 characters.';
  if (!NAME_RE.test(v.trim())) return 'Only letters and spaces allowed.';
  return undefined;
}

function validatePhone(v: string): string | undefined {
  const digits = v.replace(/\D/g, '');
  // strip leading 91 / +91 / 0
  const core =
    digits.length === 12 && digits.startsWith('91')
      ? digits.slice(2)
      : digits.length === 11 && digits.startsWith('0')
        ? digits.slice(1)
        : digits;
  if (!core) return 'Phone number is required.';
  if (!PHONE_RE.test(core)) return 'Enter a valid 10-digit Indian mobile number.';
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

function validateDailyRate(v: string): string | undefined {
  if (!v.trim()) return undefined; // optional
  const n = Number(v.replace(/[^0-9.]/g, ''));
  if (isNaN(n) || n <= 0) return 'Must be a positive number.';
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
  if (score <= 2) return { label: 'Weak', color: '#ef4444', width: '33%' };
  if (score <= 3) return { label: 'Medium', color: '#f59e0b', width: '66%' };
  return { label: 'Strong', color: '#22c55e', width: '100%' };
}

/* ── component ─────────────────────────────────────────────────────────────── */

export default function IndividualRegistration() {
  const navigate = useNavigate();

  /* form state */
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [primaryRole, setPrimaryRole] = useState('');
  const [email, setEmail] = useState('');
  const [experience, setExperience] = useState('');
  const [dailyRate, setDailyRate] = useState('');
  const [location, setLocation] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

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
        case 'fullName':
          err = validateFullName(fullName);
          break;
        case 'phone':
          err = validatePhone(phone);
          break;
        case 'primaryRole':
          err = validatePrimaryRole(primaryRole);
          break;
        case 'email':
          err = validateEmail(email);
          break;
        case 'dailyRate':
          err = validateDailyRate(dailyRate);
          break;
        case 'password':
          err = validatePassword(password);
          break;
      }
      setFieldErrors((prev) => ({ ...prev, [field]: err }));
    },
    [fullName, phone, primaryRole, email, dailyRate, password],
  );

  /* validate all on submit */
  const validateAll = (): boolean => {
    const errs: FieldErrors = {
      fullName: validateFullName(fullName),
      phone: validatePhone(phone),
      primaryRole: validatePrimaryRole(primaryRole),
      email: validateEmail(email),
      dailyRate: validateDailyRate(dailyRate),
      password: validatePassword(password),
    };
    if (!termsAccepted) errs.terms = 'You must accept the terms.';
    setFieldErrors(errs);
    setTouched({ fullName: true, phone: true, primaryRole: true, email: true, dailyRate: true, password: true, terms: true });
    return !Object.values(errs).some(Boolean);
  };

  /* border helper */
  const borderClass = (field: string) => {
    if (fieldErrors[field]) return 'border-red-500 focus:border-red-500';
    if (touched[field] && !fieldErrors[field]) return 'border-green-500 focus:border-green-500';
    return 'border-neutral-300 focus:border-[#3B5BDB]';
  };

  /* submit */
  const handleSubmit = async (e: React.FormEvent) => {
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
      const rateNum = parseInt(dailyRate.replace(/[^0-9]/g, ''), 10) || undefined;

      navigate('/otp-verify', {
        state: {
          phone: e164Phone,
          userType: 'individual',
          pendingProfile: {
            displayName: fullName.trim() || undefined,
            skills: primaryRole ? [primaryRole] : undefined,
            locationCity: locationCity || undefined,
            locationState: locationState || undefined,
            dailyRateMin: rateNum,
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
    'rounded-xl w-full px-3.5 py-2.5 bg-[#f8fafc] text-neutral-900 placeholder-neutral-400 focus:outline-none focus:bg-white text-sm transition-all disabled:opacity-50 border';

  return (
    <div className="min-h-screen flex flex-col bg-[#eef5fd]">
      <AppHeader variant="landing" />

      <main className="flex-1 flex items-center justify-center px-4 py-10 sm:py-14">
        <div className="w-full max-w-[960px] flex flex-col lg:flex-row rounded-2xl overflow-hidden shadow-xl">
          {/* ── Left info panel ────────────────────────────────────────── */}
          <section className="relative lg:w-[400px] shrink-0 px-8 py-10 text-white overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #3B5BDB 0%, #4B6CF7 100%)' }}>
            {/* decorative blobs */}
            <div className="absolute -top-16 -right-16 w-56 h-56 bg-white/10 rounded-full pointer-events-none" />
            <div className="absolute -bottom-20 -left-14 w-72 h-72 bg-white/[0.07] rounded-full pointer-events-none" />
            <div className="absolute top-1/2 right-0 w-40 h-40 bg-white/[0.05] rounded-full pointer-events-none translate-x-1/2 -translate-y-1/2" />

            <div className="relative z-10 flex flex-col h-full">
              <div className="w-12 h-12 rounded-xl bg-white/15 flex items-center justify-center mb-5 border border-white/20">
                <FaUsers className="text-white text-xl" />
              </div>

              <h2 className="text-2xl font-bold mb-2 leading-tight">Join as a Freelancer</h2>
              <p className="text-sm text-blue-100 mb-8 leading-relaxed">
                Get discovered by production companies. Manage your availability, bookings, and invoices in one place.
              </p>

              <div className="space-y-4 flex-1">
                {BENEFITS.map(({ icon: Icon, title, desc }) => (
                  <div key={title} className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-white/15 flex items-center justify-center shrink-0 border border-white/20">
                      <Icon className="text-white text-sm" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-white">{title}</h3>
                      <p className="text-xs text-blue-100 mt-0.5 leading-relaxed">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-auto pt-6 flex items-center gap-4 text-xs text-blue-100 border-t border-white/15">
                <span className="flex items-center gap-1.5">
                  <FaCircleCheck className="text-[#22C55E]" /> Free to join
                </span>
                <span className="flex items-center gap-1.5">
                  <FaCircleCheck className="text-[#22C55E]" /> No commission on first booking
                </span>
              </div>
            </div>
          </section>

          {/* ── Right form card ────────────────────────────────────────── */}
          <div className="flex-1 bg-white p-6 sm:p-8 lg:p-10 overflow-auto">
            {/* mobile header */}
            <div className="lg:hidden text-center mb-6">
              <div className="w-11 h-11 rounded-xl mx-auto mb-2 flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #3B5BDB, #4B6CF7)' }}>
                <FaUsers className="text-white text-lg" />
              </div>
              <h1 className="text-lg font-bold text-neutral-900">Join as a Freelancer</h1>
            </div>

            <div className="hidden lg:block mb-5">
              <h2 className="text-xl font-bold text-neutral-900">Create your profile</h2>
              <p className="text-sm text-neutral-500 mt-1">Tell production companies about your skills and rates</p>
            </div>

            <form className="space-y-4" onSubmit={handleSubmit} noValidate>
              {/* Full Name */}
              <div>
                <label className="block text-neutral-700 text-xs mb-1 font-semibold">
                  Full Name <span className="text-red-500">*</span>
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
                {fieldErrors.fullName && <p className="text-xs text-red-500 mt-1">{fieldErrors.fullName}</p>}
              </div>

              {/* Phone + Primary Role */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-neutral-700 text-xs mb-1 font-semibold">
                    Phone <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    onBlur={() => handleBlur('phone')}
                    placeholder="+91 98765 43210"
                    disabled={loading}
                    className={`${inputBase} ${borderClass('phone')}`}
                  />
                  {fieldErrors.phone && <p className="text-xs text-red-500 mt-1">{fieldErrors.phone}</p>}
                </div>
                <div>
                  <label className="block text-neutral-700 text-xs mb-1 font-semibold">
                    Primary Role <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={primaryRole}
                    onChange={(e) => setPrimaryRole(e.target.value)}
                    onBlur={() => handleBlur('primaryRole')}
                    disabled={loading}
                    className={`${inputBase} ${borderClass('primaryRole')}`}
                  >
                    <option value="">Select role</option>
                    {ROLES.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                  {fieldErrors.primaryRole && <p className="text-xs text-red-500 mt-1">{fieldErrors.primaryRole}</p>}
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-neutral-700 text-xs mb-1 font-semibold">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={() => handleBlur('email')}
                  placeholder="john@example.com"
                  disabled={loading}
                  className={`${inputBase} ${borderClass('email')}`}
                />
                {fieldErrors.email && <p className="text-xs text-red-500 mt-1">{fieldErrors.email}</p>}
              </div>

              {/* Experience + Daily Rate */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-neutral-700 text-xs mb-1 font-semibold">Experience</label>
                  <input
                    type="text"
                    value={experience}
                    onChange={(e) => setExperience(e.target.value)}
                    placeholder="e.g., 8 years"
                    disabled={loading}
                    className={`${inputBase} border-neutral-300 focus:border-[#3B5BDB]`}
                  />
                </div>
                <div>
                  <label className="block text-neutral-700 text-xs mb-1 font-semibold">Daily Rate (INR)</label>
                  <input
                    type="text"
                    value={dailyRate}
                    onChange={(e) => setDailyRate(e.target.value)}
                    onBlur={() => handleBlur('dailyRate')}
                    placeholder="e.g., 45000"
                    disabled={loading}
                    className={`${inputBase} ${borderClass('dailyRate')}`}
                  />
                  {fieldErrors.dailyRate && <p className="text-xs text-red-500 mt-1">{fieldErrors.dailyRate}</p>}
                </div>
              </div>

              {/* Location */}
              <div>
                <label className="block text-neutral-700 text-xs mb-1 font-semibold">Location</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g., Mumbai, Maharashtra"
                  disabled={loading}
                  className={`${inputBase} border-neutral-300 focus:border-[#3B5BDB]`}
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-neutral-700 text-xs mb-1 font-semibold">
                  Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onBlur={() => handleBlur('password')}
                    placeholder="At least 8 characters"
                    disabled={loading}
                    className={`${inputBase} pr-11 ${borderClass('password')}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 p-1"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <FaEyeSlash className="w-4 h-4" /> : <FaEye className="w-4 h-4" />}
                  </button>
                </div>
                {fieldErrors.password && <p className="text-xs text-red-500 mt-1">{fieldErrors.password}</p>}

                {/* strength indicator */}
                {password && (
                  <div className="mt-2">
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
              <div className="flex items-start gap-2 pt-0.5">
                <input
                  type="checkbox"
                  id="terms-ind"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  disabled={loading}
                  className="w-3.5 h-3.5 mt-0.5 rounded border-neutral-300 accent-[#3B5BDB] cursor-pointer shrink-0"
                />
                <label htmlFor="terms-ind" className="text-xs text-neutral-500 leading-relaxed cursor-pointer">
                  I agree to the{' '}
                  <Link to="/terms" className="text-[#3B5BDB] font-semibold hover:underline">Terms</Link>
                  {' '}and{' '}
                  <Link to="/privacy" className="text-[#3B5BDB] font-semibold hover:underline">Privacy Policy</Link>
                </label>
              </div>
              {fieldErrors.terms && <p className="text-xs text-red-500 -mt-2">{fieldErrors.terms}</p>}

              {/* global error */}
              {error && (
                <div className="flex items-start gap-2.5 rounded-xl bg-red-50 border border-red-200 px-3.5 py-3">
                  <FaTriangleExclamation className="text-red-500 text-sm shrink-0 mt-0.5" />
                  <p className="text-xs text-red-700 leading-snug">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="rounded-xl w-full py-3 bg-[#3B5BDB] text-white text-sm font-semibold hover:bg-[#3451c7] transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Creating account...
                  </>
                ) : (
                  'Create Freelancer Account'
                )}
              </button>

              <p className="text-center text-xs text-neutral-500">
                Already have an account?{' '}
                <Link to="/login" className="text-[#3B5BDB] font-semibold hover:underline">Sign in</Link>
              </p>
            </form>

            {/* trust badges */}
            <div className="mt-6 flex items-center justify-center gap-5">
              {[
                { icon: FaLock, label: 'Secure' },
                { icon: FaCertificate, label: 'Verified' },
                { icon: FaHandshake, label: 'Trusted' },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-1.5 text-xs text-neutral-400">
                  <Icon className="text-xs" />
                  {label}
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      <AppFooter variant="dark" />
    </div>
  );
}
