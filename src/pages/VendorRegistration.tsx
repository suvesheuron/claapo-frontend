import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useState, useCallback } from 'react';
import {
  FaTruck,
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
import { REGISTRATION_VENDOR_CATEGORIES, vendorCategoryToVendorType } from '../constants/registrationCategories';

/* ── Validation helpers ── */

const GST_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[A-Z0-9]{1}Z[A-Z0-9]{1}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[6-9]\d{9}$/;

type FieldErrors = {
  businessName?: string;
  phone?: string;
  gst?: string;
  email?: string;
  vendorCategory?: string;
  password?: string;
};

function validateField(name: keyof FieldErrors, value: string): string | undefined {
  switch (name) {
    case 'businessName':
      if (!value.trim()) return 'Business name is required';
      if (value.trim().length < 2) return 'Must be at least 2 characters';
      return undefined;
    case 'phone': {
      const digits = value.replace(/\D/g, '').replace(/^91/, '');
      if (!digits) return 'Phone number is required';
      if (!PHONE_REGEX.test(digits)) return 'Enter a valid 10-digit Indian mobile number';
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

  if (score <= 2) return { label: 'Weak', color: '#EF4444', width: '33%' };
  if (score <= 3) return { label: 'Fair', color: '#F59E0B', width: '55%' };
  if (score === 4) return { label: 'Good', color: '#3B82F6', width: '75%' };
  return { label: 'Strong', color: '#22C55E', width: '100%' };
}

/* ── Component ── */

export default function VendorRegistration() {
  const navigate = useNavigate();

  const [businessName, setBusinessName] = useState('');
  const [phone, setPhone] = useState('');
  const [gst, setGst] = useState('');
  const [email, setEmail] = useState('');
  const [vendorCategory, setVendorCategory] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  useEffect(() => {
    document.title = 'Vendor Registration \u2013 Claapo';
  }, []);

  const handleBlur = useCallback((name: keyof FieldErrors, value: string) => {
    setTouched((t) => ({ ...t, [name]: true }));
    const err = validateField(name, value);
    setFieldErrors((prev) => ({ ...prev, [name]: err }));
  }, []);

  const validateAll = (): boolean => {
    const fields: [keyof FieldErrors, string][] = [
      ['businessName', businessName],
      ['phone', phone],
      ['gst', gst],
      ['email', email],
      ['vendorCategory', vendorCategory],
      ['password', password],
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
    setFieldErrors(newErrors);
    setTouched((t) => ({ ...t, ...newTouched }));
    return valid;
  };

  const borderClass = (name: keyof FieldErrors) => {
    if (fieldErrors[name]) return 'border-red-400 focus:border-red-500';
    if (touched[name] && !fieldErrors[name]) return 'border-green-400 focus:border-green-500';
    return 'border-neutral-300 focus:border-[#3B5BDB]';
  };

  const passwordStrength = getPasswordStrength(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateAll()) return;

    const e164Phone = toE164India(phone.trim());
    if (e164Phone.replace(/\D/g, '').length < 10) {
      setError('Please enter a valid 10-digit mobile number.');
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
    'rounded-xl w-full px-3.5 py-2.5 bg-[#F8FAFC] text-neutral-900 placeholder-neutral-400 focus:outline-none focus:bg-white text-sm transition-all disabled:opacity-50 border';

  return (
    <div className="min-h-screen flex flex-col bg-[#eef5fd]">
      <AppHeader variant="landing" />

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center px-4 py-10 sm:py-16">
        <div className="w-full max-w-[960px] flex flex-col lg:flex-row rounded-2xl overflow-hidden shadow-xl">
          {/* ── Left info panel ── */}
          <section
            className="hidden lg:flex flex-col w-[400px] xl:w-[420px] shrink-0 px-9 py-10 text-white relative overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #3B5BDB 0%, #4B6CF7 100%)' }}
          >
            {/* Decorative blobs */}
            <div className="absolute -top-16 -right-16 w-56 h-56 bg-white/10 rounded-full" />
            <div className="absolute -bottom-20 -left-12 w-72 h-72 bg-white/[0.07] rounded-full" />
            <div className="absolute top-1/2 right-0 w-32 h-32 bg-white/[0.05] rounded-full translate-x-10" />

            <div className="relative z-10 flex flex-col h-full">
              <div className="w-12 h-12 rounded-xl bg-white/15 flex items-center justify-center mb-5 border border-white/20">
                <FaTruck className="text-white text-xl" />
              </div>

              <h2 className="text-2xl font-bold mb-2 leading-tight">Register as a Vendor</h2>
              <p className="text-sm text-blue-100 mb-8 leading-relaxed">
                List your equipment and services. Get discovered by production companies and manage
                rentals in one place.
              </p>

              <div className="space-y-5 flex-1">
                {[
                  {
                    icon: FaCertificate,
                    title: 'GST Verification',
                    desc: 'Optional GST for verified business profiles',
                  },
                  {
                    icon: FaShieldHalved,
                    title: 'Secure Bookings',
                    desc: 'Protected transactions and clear contracts',
                  },
                  {
                    icon: FaHandshake,
                    title: 'Wide Reach',
                    desc: 'Connect with production companies across India',
                  },
                ].map(({ icon: Icon, title, desc }) => (
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

              <div className="mt-auto pt-6 flex items-center gap-5 text-xs text-blue-100 border-t border-white/15">
                <span className="flex items-center gap-1.5">
                  <FaCircleCheck className="text-[#22C55E]" /> Free to list
                </span>
                <span className="flex items-center gap-1.5">
                  <FaCircleCheck className="text-[#22C55E]" /> Flexible pricing
                </span>
              </div>
            </div>
          </section>

          {/* ── Right form panel ── */}
          <div className="flex-1 bg-white p-6 sm:p-8 lg:p-10 flex flex-col justify-center">
            {/* Mobile-only header */}
            <div className="lg:hidden text-center mb-5">
              <div
                className="w-11 h-11 rounded-xl mx-auto mb-2.5 flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #3B5BDB 0%, #4B6CF7 100%)' }}
              >
                <FaTruck className="text-white text-lg" />
              </div>
              <h1 className="text-xl font-bold text-neutral-900">Register as a Vendor</h1>
              <p className="text-sm text-neutral-500 mt-1">
                Create your vendor account to get started
              </p>
            </div>

            <div className="hidden lg:block mb-5">
              <h2 className="text-xl font-bold text-neutral-900">Create your vendor account</h2>
              <p className="text-sm text-neutral-500 mt-1">
                Add your business and equipment details
              </p>
            </div>

            <form className="space-y-4" onSubmit={handleSubmit} noValidate>
              {/* Business Name */}
              <div>
                <label className="block text-neutral-700 text-xs mb-1.5 font-semibold">
                  Business Name <span className="text-red-500">*</span>
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
                {fieldErrors.businessName && (
                  <p className="text-xs text-red-500 mt-1">{fieldErrors.businessName}</p>
                )}
              </div>

              {/* Phone + GST side by side */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-neutral-700 text-xs mb-1.5 font-semibold">
                    Phone <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    onBlur={() => handleBlur('phone', phone)}
                    placeholder="+91 98765 43210"
                    disabled={loading}
                    className={`${inputBase} ${borderClass('phone')}`}
                  />
                  {fieldErrors.phone && (
                    <p className="text-xs text-red-500 mt-1">{fieldErrors.phone}</p>
                  )}
                </div>
                <div>
                  <label className="block text-neutral-700 text-xs mb-1.5 font-semibold">
                    GST
                    <span className="ml-1.5 text-[9px] font-normal text-neutral-400 bg-neutral-100 px-1.5 py-0.5 rounded-full">
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
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={() => handleBlur('email', email)}
                  placeholder="vendor@example.com"
                  disabled={loading}
                  className={`${inputBase} ${borderClass('email')}`}
                />
                {fieldErrors.email && (
                  <p className="text-xs text-red-500 mt-1">{fieldErrors.email}</p>
                )}
              </div>

              {/* Business Type */}
              <div>
                <label className="block text-neutral-700 text-xs mb-1.5 font-semibold">
                  Business Type <span className="text-red-500">*</span>
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
                {fieldErrors.vendorCategory && (
                  <p className="text-xs text-red-500 mt-1">{fieldErrors.vendorCategory}</p>
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
                    onChange={(e) => setPassword(e.target.value)}
                    onBlur={() => handleBlur('password', password)}
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
                          width: passwordStrength.width,
                          backgroundColor: passwordStrength.color,
                        }}
                      />
                    </div>
                    <p className="text-xs mt-1 font-medium" style={{ color: passwordStrength.color }}>
                      {passwordStrength.label}
                    </p>
                  </div>
                )}
              </div>

              {/* Terms */}
              <div className="flex items-start gap-2.5 pt-1">
                <input
                  type="checkbox"
                  id="terms-vendor"
                  checked={agreedTerms}
                  onChange={(e) => setAgreedTerms(e.target.checked)}
                  disabled={loading}
                  className="w-4 h-4 mt-0.5 rounded border-neutral-300 accent-[#3B5BDB] cursor-pointer shrink-0"
                />
                <label
                  htmlFor="terms-vendor"
                  className="text-xs text-neutral-500 leading-relaxed cursor-pointer"
                >
                  I agree to the{' '}
                  <Link to="/terms" className="text-[#3B5BDB] font-semibold hover:underline">
                    Terms
                  </Link>{' '}
                  and{' '}
                  <Link to="/privacy" className="text-[#3B5BDB] font-semibold hover:underline">
                    Privacy Policy
                  </Link>
                </label>
              </div>

              {/* Global error */}
              {error && (
                <div className="flex items-start gap-2.5 rounded-xl bg-red-50 border border-red-200 px-3.5 py-3">
                  <FaTriangleExclamation className="text-red-500 text-sm shrink-0 mt-0.5" />
                  <p className="text-xs text-red-700 leading-snug">{error}</p>
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading || !agreedTerms}
                className="rounded-xl w-full py-3 bg-[#3B5BDB] text-white text-sm font-semibold hover:bg-[#3451c7] transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Creating account...
                  </>
                ) : (
                  'Create Vendor Account'
                )}
              </button>

              <p className="text-center text-xs text-neutral-500 pt-1">
                Already have an account?{' '}
                <Link to="/login" className="text-[#3B5BDB] font-semibold hover:underline">
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
