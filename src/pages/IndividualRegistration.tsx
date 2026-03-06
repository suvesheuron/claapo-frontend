import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { FaVideo, FaCircleCheck, FaCertificate, FaShieldHalved, FaHandshake, FaLock, FaTriangleExclamation } from 'react-icons/fa6';
import AppLayout from '../components/AppLayout';
import { api, ApiException } from '../services/api';
import { toE164India } from '../utils/phone';

export default function IndividualRegistration() {
  const navigate = useNavigate();

  const [fullName, setFullName]     = useState('');
  const [phone, setPhone]           = useState('');
  const [primaryRole, setPrimaryRole] = useState('');
  const [email, setEmail]           = useState('');
  const [experience, setExperience] = useState('');
  const [dailyRate, setDailyRate]   = useState('');
  const [location, setLocation]     = useState('');
  const [password, setPassword]     = useState('');
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState<string | null>(null);

  useEffect(() => {
    document.title = 'Freelancer Registration – Claapo';
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const e164Phone = toE164India(phone.trim());
    if (e164Phone.replace(/\D/g, '').length < 10) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }

    setLoading(true);
    try {
      // Step 1: create account — only the 3 fields the backend needs
      await api.post('/auth/register/individual', {
        email: email.trim(),
        phone: e164Phone,
        password,
      });

      // Step 2: send OTP to the registered phone
      const otpRes = await api.post<unknown>('/auth/otp/send', { phone: e164Phone });
      // DEV: log response so OTP can be read from backend terminal
      console.log('[DEV] OTP send response:', otpRes);

      // Parse location into city / state
      const [locationCity = '', locationState = ''] = location.trim().split(',').map((s) => s.trim());

      // Parse daily rate (rupees → paise for backend, or just rupees for profile min)
      const rateNum = parseInt(dailyRate.replace(/[^0-9]/g, ''), 10) || undefined;

      // Step 3: navigate to OTP verification, passing extra profile fields
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

  return (
    <AppLayout headerVariant="back" backTo="/register" backLabel="Back" showFooter={false}>
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Left: brand panel */}
        <section className="hidden lg:flex flex-col w-[380px] xl:w-[420px] shrink-0 bg-[#3678F1] px-8 xl:px-10 py-10 text-white relative overflow-hidden">
          <div className="absolute -top-16 -right-16 w-56 h-56 bg-white/10 rounded-full" />
          <div className="absolute -bottom-20 -left-12 w-72 h-72 bg-white/8 rounded-full" />

          <div className="relative z-10 flex flex-col h-full">
            <div className="w-12 h-12 rounded-xl bg-white/15 flex items-center justify-center mb-5 border border-white/20">
              <FaVideo className="text-white text-xl" />
            </div>

            <h2 className="text-2xl font-bold mb-2 leading-tight">Join as a freelancer</h2>
            <p className="text-sm text-blue-100 mb-8 leading-relaxed">
              Get discovered by production companies. Manage your availability, bookings, and invoices in one place.
            </p>

            <div className="space-y-4 flex-1">
              {[
                { icon: FaCertificate, title: 'Verified Profiles', desc: 'Build trust with verified skills and portfolio' },
                { icon: FaShieldHalved, title: 'Secure Payments', desc: 'Get paid on time with protected transactions' },
                { icon: FaHandshake, title: 'Direct Bookings', desc: 'Receive requests and confirm availability easily' },
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

        {/* Right: form */}
        <div className="flex-1 flex items-center justify-center bg-[#F3F4F6] p-4 sm:p-6 overflow-auto">
          <div className="w-full max-w-[440px] py-4">
            <div className="lg:hidden text-center mb-4">
              <div className="w-10 h-10 rounded-xl bg-[#3678F1] mx-auto mb-2 flex items-center justify-center">
                <FaVideo className="text-white" />
              </div>
              <h1 className="text-lg font-bold text-neutral-900">Freelancer Registration</h1>
            </div>

            <div className="rounded-2xl bg-white p-5 border border-neutral-200 shadow-sm">
              <div className="mb-4">
                <h2 className="text-lg font-bold text-neutral-900">Create your profile</h2>
                <p className="text-xs text-neutral-500 mt-0.5">Tell production companies about your skills and rates</p>
              </div>

              <form className="space-y-3" onSubmit={handleSubmit}>
                <div>
                  <label className="block text-neutral-700 text-xs mb-1 font-semibold">
                    Full Name <span className="text-[#F40F02]">*</span>
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g., John Director"
                    required
                    disabled={loading}
                    className="rounded-xl w-full px-3 py-2.5 border border-neutral-300 bg-[#F3F4F6] text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-[#3678F1] focus:bg-white text-sm transition-all disabled:opacity-50"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-neutral-700 text-xs mb-1 font-semibold">
                      Phone <span className="text-[#F40F02]">*</span>
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      required
                      disabled={loading}
                      className="rounded-xl w-full px-3 py-2.5 border border-neutral-300 bg-[#F3F4F6] text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-[#3678F1] focus:bg-white text-sm transition-all disabled:opacity-50"
                    />
                  </div>
                  <div>
                    <label className="block text-neutral-700 text-xs mb-1 font-semibold">
                      Primary Role <span className="text-[#F40F02]">*</span>
                    </label>
                    <select
                      value={primaryRole}
                      onChange={(e) => setPrimaryRole(e.target.value)}
                      required
                      disabled={loading}
                      className="rounded-xl w-full px-3 py-2.5 border border-neutral-300 bg-[#F3F4F6] text-neutral-900 focus:outline-none focus:border-[#3678F1] focus:bg-white text-sm transition-all disabled:opacity-50"
                    >
                      <option value="">Select role</option>
                      <option>Director</option>
                      <option>DOP / Cinematographer</option>
                      <option>Camera Operator</option>
                      <option>Sound Engineer</option>
                      <option>Gaffer</option>
                      <option>Editor</option>
                      <option>Makeup Artist</option>
                      <option>Other</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-neutral-700 text-xs mb-1 font-semibold">
                    Email Address <span className="text-[#F40F02]">*</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="john@example.com"
                    required
                    disabled={loading}
                    className="rounded-xl w-full px-3 py-2.5 border border-neutral-300 bg-[#F3F4F6] text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-[#3678F1] focus:bg-white text-sm transition-all disabled:opacity-50"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-neutral-700 text-xs mb-1 font-semibold">Experience</label>
                    <input
                      type="text"
                      value={experience}
                      onChange={(e) => setExperience(e.target.value)}
                      placeholder="e.g., 8 years"
                      disabled={loading}
                      className="rounded-xl w-full px-3 py-2.5 border border-neutral-300 bg-[#F3F4F6] text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-[#3678F1] focus:bg-white text-sm transition-all disabled:opacity-50"
                    />
                  </div>
                  <div>
                    <label className="block text-neutral-700 text-xs mb-1 font-semibold">Daily Rate (₹)</label>
                    <input
                      type="text"
                      value={dailyRate}
                      onChange={(e) => setDailyRate(e.target.value)}
                      placeholder="e.g., 45,000"
                      disabled={loading}
                      className="rounded-xl w-full px-3 py-2.5 border border-neutral-300 bg-[#F3F4F6] text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-[#3678F1] focus:bg-white text-sm transition-all disabled:opacity-50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-neutral-700 text-xs mb-1 font-semibold">Location</label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g., Mumbai, Maharashtra"
                    disabled={loading}
                    className="rounded-xl w-full px-3 py-2.5 border border-neutral-300 bg-[#F3F4F6] text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-[#3678F1] focus:bg-white text-sm transition-all disabled:opacity-50"
                  />
                </div>

                <div>
                  <label className="block text-neutral-700 text-xs mb-1 font-semibold">
                    Password <span className="text-[#F40F02]">*</span>
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    required
                    minLength={8}
                    disabled={loading}
                    className="rounded-xl w-full px-3 py-2.5 border border-neutral-300 bg-[#F3F4F6] text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-[#3678F1] focus:bg-white text-sm transition-all disabled:opacity-50"
                  />
                </div>

                <div className="flex items-start gap-2 pt-0.5">
                  <input
                    type="checkbox"
                    id="terms-ind"
                    required
                    disabled={loading}
                    className="w-3.5 h-3.5 mt-0.5 rounded border-neutral-300 accent-[#3678F1] cursor-pointer shrink-0"
                  />
                  <label htmlFor="terms-ind" className="text-xs text-neutral-500 leading-relaxed cursor-pointer">
                    I agree to the{' '}
                    <Link to="#" className="text-[#3678F1] font-semibold hover:underline">Terms</Link>
                    {' '}and{' '}
                    <Link to="#" className="text-[#3678F1] font-semibold hover:underline">Privacy Policy</Link>
                  </label>
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
                  className="rounded-xl w-full py-3 bg-[#3678F1] text-white text-sm font-semibold hover:bg-[#2563d4] transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      Creating account…
                    </>
                  ) : (
                    'Create Freelancer Account'
                  )}
                </button>

                <p className="text-center text-xs text-neutral-500">
                  Already have an account?{' '}
                  <Link to="/login" className="text-[#3678F1] font-semibold hover:underline">Sign in</Link>
                </p>
              </form>
            </div>

            <div className="mt-4 flex items-center justify-center gap-5">
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
      </div>
    </AppLayout>
  );
}
