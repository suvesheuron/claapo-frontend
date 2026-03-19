import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useState, useCallback } from 'react';
import {
  FaBuilding,
  FaShieldHalved,
  FaCertificate,
  FaHandshake,
  FaCircleCheck,
  FaTriangleExclamation,
  FaEye,
  FaEyeSlash,
} from 'react-icons/fa6';
import AppHeader from '../components/AppHeader';
import AppFooter from '../components/AppFooter';
import { api, ApiException } from '../services/api';
import { toE164India } from '../utils/phone';

/* ── Validation helpers ── */

const GST_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[A-Z0-9]{1}Z[A-Z0-9]{1}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[6-9]\d{9}$/;

type FieldErrors = {
  companyName?: string;
  phone?: string;
  gst?: string;
  email?: string;
  password?: string;
};

function validateField(
  field: keyof FieldErrors,
  value: string,
): string | undefined {
  switch (field) {
    case 'companyName':
      if (!value.trim()) return 'Company name is required';
      if (value.trim().length < 2) return 'Must be at least 2 characters';
      return undefined;
    case 'phone': {
      const digits = value.replace(/\D/g, '').replace(/^91/, '');
      if (!digits) return 'Phone number is required';
      if (!PHONE_REGEX.test(digits))
        return 'Enter a valid 10-digit Indian mobile number';
      return undefined;
    }
    case 'gst':
      if (!value.trim()) return undefined; // optional
      if (!GST_REGEX.test(value.trim().toUpperCase()))
        return 'Invalid GST format';
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

function getPasswordStrength(pw: string): {
  label: string;
  color: string;
  width: string;
} {
  if (!pw) return { label: '', color: '', width: '0%' };
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[a-z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;

  if (score <= 2) return { label: 'Weak', color: '#ef4444', width: '33%' };
  if (score <= 4) return { label: 'Medium', color: '#f59e0b', width: '66%' };
  return { label: 'Strong', color: '#22c55e', width: '100%' };
}

/* ── Component ── */

export default function CompanyRegistration() {
  const navigate = useNavigate();

  const [companyName, setCompanyName] = useState('');
  const [phone, setPhone] = useState('');
  const [gst, setGst] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<Record<keyof FieldErrors, boolean>>({
    companyName: false,
    phone: false,
    gst: false,
    email: false,
    password: false,
  });

  useEffect(() => {
    document.title = 'Company Registration \u2013 Claapo';
  }, []);

  const handleBlur = useCallback(
    (field: keyof FieldErrors, value: string) => {
      setTouched((t) => ({ ...t, [field]: true }));
      const err = validateField(field, value);
      setFieldErrors((prev) => ({ ...prev, [field]: err }));
    },
    [],
  );

  const borderClass = (field: keyof FieldErrors) => {
    if (fieldErrors[field]) return 'border-red-400 focus:border-red-500';
    if (touched[field] && !fieldErrors[field])
      return 'border-green-400 focus:border-green-500';
    return 'border-neutral-300 focus:border-[#3B5BDB]';
  };

  const strength = getPasswordStrength(password);

  /* ── Submit ── */

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate all fields
    const fields: { key: keyof FieldErrors; value: string }[] = [
      { key: 'companyName', value: companyName },
      { key: 'phone', value: phone },
      { key: 'gst', value: gst },
      { key: 'email', value: email },
      { key: 'password', value: password },
    ];

    const newErrors: FieldErrors = {};
    const newTouched: Record<keyof FieldErrors, boolean> = {
      companyName: true,
      phone: true,
      gst: true,
      email: true,
      password: true,
    };

    for (const { key, value } of fields) {
      const err = validateField(key, value);
      if (err) newErrors[key] = err;
    }

    setFieldErrors(newErrors);
    setTouched(newTouched);

    if (Object.keys(newErrors).length > 0) return;

    const e164Phone = toE164India(phone.trim());

    setLoading(true);
    try {
      await api.post('/auth/register/company', {
        email: email.trim(),
        phone: e164Phone,
        password,
        ...(gst.trim() ? { gstNumber: gst.trim().toUpperCase() } : {}),
      });

      const otpRes = await api.post<unknown>('/auth/otp/send', {
        phone: e164Phone,
      });
      console.log('[DEV] OTP send response:', otpRes);

      navigate('/otp-verify', {
        state: {
          phone: e164Phone,
          userType: 'company',
          pendingProfile: {
            companyName: companyName.trim() || undefined,
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
    'rounded-xl w-full px-3.5 py-3 bg-[#f8fafc] text-neutral-900 placeholder-neutral-400 focus:outline-none focus:bg-white text-sm transition-all disabled:opacity-50';

  return (
    <div className="min-h-screen flex flex-col bg-[#eef5fd]">
      <AppHeader variant="landing" />

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center px-4 py-12 sm:py-16">
        <div className="w-full max-w-[960px] grid grid-cols-1 lg:grid-cols-[400px_1fr] rounded-3xl overflow-hidden shadow-xl shadow-[#3B5BDB]/8 bg-white">
          {/* ── Left info panel ── */}
          <section className="hidden lg:flex flex-col relative overflow-hidden px-10 py-12 text-white"
            style={{ background: 'linear-gradient(160deg, #3B5BDB 0%, #4B6CF7 100%)' }}
          >
            {/* Decorative blobs */}
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/10 rounded-full blur-xl" />
            <div className="absolute -bottom-24 -left-16 w-80 h-80 bg-white/[0.07] rounded-full blur-2xl" />
            <div className="absolute top-1/2 right-0 w-40 h-40 bg-white/5 rounded-full blur-lg" />

            <div className="relative z-10 flex flex-col h-full">
              {/* Icon */}
              <div className="w-14 h-14 rounded-2xl bg-white/15 flex items-center justify-center mb-6 border border-white/20 backdrop-blur-sm">
                <FaBuilding className="text-white text-2xl" />
              </div>

              <h2 className="text-[26px] font-extrabold leading-tight mb-3 tracking-tight">
                Register your<br />company
              </h2>
              <p className="text-sm text-blue-100/90 mb-10 leading-relaxed max-w-[280px]">
                Join Claapo to hire verified crew and vendors. Access a trusted network of production professionals.
              </p>

              {/* Benefit items */}
              <div className="space-y-5 flex-1">
                {[
                  {
                    icon: FaCertificate,
                    title: 'GST Verification',
                    desc: 'Verified business profiles for trust and authenticity',
                  },
                  {
                    icon: FaShieldHalved,
                    title: 'Secure Onboarding',
                    desc: 'Enterprise-grade security for your business data',
                  },
                  {
                    icon: FaHandshake,
                    title: 'Trusted Platform',
                    desc: 'Thousands of production companies already on Claapo',
                  },
                ].map(({ icon: Icon, title, desc }) => (
                  <div key={title} className="flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center shrink-0 border border-white/20 backdrop-blur-sm">
                      <Icon className="text-white text-sm" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">{title}</h3>
                      <p className="text-xs text-blue-100/80 mt-1 leading-relaxed">
                        {desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Bottom trust badges */}
              <div className="mt-auto pt-8 flex items-center gap-5 text-xs text-blue-100/80 border-t border-white/15">
                <span className="flex items-center gap-1.5">
                  <FaCircleCheck className="text-emerald-300" /> 24/7 Support
                </span>
                <span className="flex items-center gap-1.5">
                  <FaCircleCheck className="text-emerald-300" /> Free Setup
                </span>
              </div>
            </div>
          </section>

          {/* ── Right form panel ── */}
          <div className="flex flex-col justify-center px-6 py-10 sm:px-10 lg:px-12 lg:py-12">
            {/* Mobile header */}
            <div className="lg:hidden text-center mb-6">
              <div className="w-12 h-12 rounded-2xl mx-auto mb-3 flex items-center justify-center"
                style={{ background: 'linear-gradient(160deg, #3B5BDB 0%, #4B6CF7 100%)' }}
              >
                <FaBuilding className="text-white text-lg" />
              </div>
              <h1 className="text-xl font-extrabold text-neutral-900">
                Company Registration
              </h1>
              <p className="text-sm text-neutral-500 mt-1">
                Create your account to get started
              </p>
            </div>

            {/* Desktop heading */}
            <div className="hidden lg:block mb-6">
              <h2 className="text-xl font-extrabold text-neutral-900">
                Create your account
              </h2>
              <p className="text-sm text-neutral-500 mt-1">
                Fill in your company details to get started
              </p>
            </div>

            <form className="space-y-4" onSubmit={handleSubmit} noValidate>
              {/* Company Name */}
              <div>
                <label className="block text-neutral-700 text-xs mb-1.5 font-semibold">
                  Company Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => {
                    setCompanyName(e.target.value);
                    if (touched.companyName)
                      setFieldErrors((p) => ({
                        ...p,
                        companyName: validateField('companyName', e.target.value),
                      }));
                  }}
                  onBlur={() => handleBlur('companyName', companyName)}
                  placeholder="e.g., Production Studios Inc."
                  disabled={loading}
                  className={`${inputBase} border ${borderClass('companyName')}`}
                />
                {fieldErrors.companyName && (
                  <p className="text-xs text-red-500 mt-1">{fieldErrors.companyName}</p>
                )}
              </div>

              {/* Phone + GST */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-neutral-700 text-xs mb-1.5 font-semibold">
                    Phone <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      if (touched.phone)
                        setFieldErrors((p) => ({
                          ...p,
                          phone: validateField('phone', e.target.value),
                        }));
                    }}
                    onBlur={() => handleBlur('phone', phone)}
                    placeholder="+91 98765 43210"
                    disabled={loading}
                    className={`${inputBase} border ${borderClass('phone')}`}
                  />
                  {fieldErrors.phone && (
                    <p className="text-xs text-red-500 mt-1">{fieldErrors.phone}</p>
                  )}
                </div>
                <div>
                  <label className="block text-neutral-700 text-xs mb-1.5 font-semibold">
                    GST
                    <span className="ml-1.5 text-[10px] font-normal text-neutral-400 bg-neutral-100 px-2 py-0.5 rounded-full">
                      Optional
                    </span>
                  </label>
                  <input
                    type="text"
                    value={gst}
                    onChange={(e) => {
                      setGst(e.target.value);
                      if (touched.gst)
                        setFieldErrors((p) => ({
                          ...p,
                          gst: validateField('gst', e.target.value),
                        }));
                    }}
                    onBlur={() => handleBlur('gst', gst)}
                    placeholder="27AABCU9603R1ZM"
                    disabled={loading}
                    className={`${inputBase} border ${borderClass('gst')}`}
                  />
                  {fieldErrors.gst && (
                    <p className="text-xs text-red-500 mt-1">{fieldErrors.gst}</p>
                  )}
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-neutral-700 text-xs mb-1.5 font-semibold">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (touched.email)
                      setFieldErrors((p) => ({
                        ...p,
                        email: validateField('email', e.target.value),
                      }));
                  }}
                  onBlur={() => handleBlur('email', email)}
                  placeholder="yourcompany@gmail.com"
                  disabled={loading}
                  className={`${inputBase} border ${borderClass('email')}`}
                />
                {fieldErrors.email && (
                  <p className="text-xs text-red-500 mt-1">{fieldErrors.email}</p>
                )}
              </div>

              {/* Password */}
              <div>
                <label className="block text-neutral-700 text-xs mb-1.5 font-semibold">
                  Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (touched.password)
                        setFieldErrors((p) => ({
                          ...p,
                          password: validateField('password', e.target.value),
                        }));
                    }}
                    onBlur={() => handleBlur('password', password)}
                    placeholder="At least 8 characters"
                    disabled={loading}
                    className={`${inputBase} pr-11 border ${borderClass('password')}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 p-1 transition-colors"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <FaEyeSlash className="w-4 h-4" />
                    ) : (
                      <FaEye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {fieldErrors.password && (
                  <p className="text-xs text-red-500 mt-1">{fieldErrors.password}</p>
                )}
                {/* Password strength indicator */}
                {password && (
                  <div className="mt-2">
                    <div className="h-1.5 w-full bg-neutral-200 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: strength.width,
                          backgroundColor: strength.color,
                        }}
                      />
                    </div>
                    <p
                      className="text-xs font-medium mt-1"
                      style={{ color: strength.color }}
                    >
                      {strength.label}
                    </p>
                  </div>
                )}
              </div>

              {/* Terms */}
              <div className="flex items-start gap-2.5 pt-1">
                <input
                  type="checkbox"
                  id="terms"
                  required
                  disabled={loading}
                  className="w-4 h-4 mt-0.5 rounded border-neutral-300 accent-[#3B5BDB] cursor-pointer shrink-0"
                />
                <label
                  htmlFor="terms"
                  className="text-xs text-neutral-500 leading-relaxed cursor-pointer"
                >
                  I agree to the{' '}
                  <Link
                    to="/terms"
                    className="text-[#3B5BDB] font-semibold hover:underline"
                  >
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link
                    to="/privacy"
                    className="text-[#3B5BDB] font-semibold hover:underline"
                  >
                    Privacy Policy
                  </Link>
                </label>
              </div>

              {/* API error */}
              {error && (
                <div className="flex items-start gap-2.5 rounded-xl bg-red-50 border border-red-200 px-4 py-3">
                  <FaTriangleExclamation className="text-red-500 text-sm shrink-0 mt-0.5" />
                  <p className="text-xs text-red-700 leading-snug">{error}</p>
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="rounded-xl w-full py-3.5 text-white text-sm font-bold hover:opacity-90 transition-all shadow-lg shadow-[#3B5BDB]/25 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                style={{
                  background:
                    'linear-gradient(135deg, #3B5BDB 0%, #4B6CF7 100%)',
                }}
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Registering...
                  </>
                ) : (
                  'Register Company'
                )}
              </button>

              <p className="text-center text-sm text-neutral-500 pt-1">
                Already have an account?{' '}
                <Link
                  to="/login"
                  className="text-[#3B5BDB] font-semibold hover:underline"
                >
                  Sign in
                </Link>
              </p>
            </form>
          </div>
        </div>
      </main>

      <AppFooter variant="dark" />
    </div>
  );
}
