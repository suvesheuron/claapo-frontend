import { Link } from 'react-router-dom';
import { useEffect } from 'react';
import { FaBuilding, FaShieldHalved, FaCertificate, FaHandshake, FaCircleCheck, FaLock } from 'react-icons/fa6';
import AppLayout from '../components/AppLayout';

export default function CompanyRegistration() {
  useEffect(() => {
    document.title = 'Company Registration – Claapo';
  }, []);

  return (
    <AppLayout headerVariant="back" backTo="/register" backLabel="Back" showFooter={false}>
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Left: brand panel */}
        <section className="hidden lg:flex flex-col w-[380px] xl:w-[420px] shrink-0 bg-[#3678F1] px-8 xl:px-10 py-10 text-white relative overflow-hidden">
          <div className="absolute -top-16 -right-16 w-56 h-56 bg-white/10 rounded-full" />
          <div className="absolute -bottom-20 -left-12 w-72 h-72 bg-white/8 rounded-full" />

          <div className="relative z-10 flex flex-col h-full">
            <div className="w-12 h-12 rounded-xl bg-white/15 flex items-center justify-center mb-5 border border-white/20">
              <FaBuilding className="text-white text-xl" />
            </div>

            <h2 className="text-2xl font-bold mb-2 leading-tight">Register your company</h2>
            <p className="text-sm text-blue-100 mb-8 leading-relaxed">
              Join Claapo to hire verified crew and vendors. Access a trusted network of production professionals.
            </p>

            <div className="space-y-4 flex-1">
              {[
                { icon: FaCertificate, title: 'GST Verification', desc: 'Verified business profiles for trust and authenticity' },
                { icon: FaShieldHalved, title: 'Secure Onboarding', desc: 'Enterprise-grade security for your business data' },
                { icon: FaHandshake, title: 'Trusted Platform', desc: 'Thousands of production companies already on Claapo' },
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
                <FaCircleCheck className="text-[#22C55E]" /> 24/7 Support
              </span>
              <span className="flex items-center gap-1.5">
                <FaCircleCheck className="text-[#22C55E]" /> Free Setup
              </span>
            </div>
          </div>
        </section>

        {/* Right: form — compact to fit viewport without scrolling */}
        <div className="flex-1 flex items-center justify-center bg-[#F3F4F6] p-4 sm:p-6">
          <div className="w-full max-w-[440px]">
            {/* Mobile header */}
            <div className="lg:hidden text-center mb-4">
              <div className="w-10 h-10 rounded-xl bg-[#3678F1] mx-auto mb-2 flex items-center justify-center">
                <FaBuilding className="text-white" />
              </div>
              <h1 className="text-lg font-bold text-neutral-900">Company Registration</h1>
            </div>

            <div className="rounded-2xl bg-white p-5 border border-neutral-200 shadow-sm">
              <div className="mb-4">
                <h2 className="text-lg font-bold text-neutral-900">Create your account</h2>
                <p className="text-xs text-neutral-500 mt-0.5">Fill in your company details to get started</p>
              </div>

              <form
                className="space-y-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  alert('Company registration submitted!');
                }}
              >
                <div>
                  <label className="block text-neutral-700 text-xs mb-1 font-semibold">
                    Company Name <span className="text-[#F40F02]">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Production Studios Inc."
                    required
                    className="rounded-xl w-full px-3 py-2.5 border border-neutral-300 bg-[#F3F4F6] text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-[#3678F1] focus:bg-white text-sm transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-neutral-700 text-xs mb-1 font-semibold">
                      Phone <span className="text-[#F40F02]">*</span>
                    </label>
                    <input
                      type="tel"
                      placeholder="+91 98xxx xxxxx"
                      required
                      className="rounded-xl w-full px-3 py-2.5 border border-neutral-300 bg-[#F3F4F6] text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-[#3678F1] focus:bg-white text-sm transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-neutral-700 text-xs mb-1 font-semibold">
                      GST
                      <span className="ml-1 text-[9px] font-normal text-neutral-400 bg-neutral-100 px-1.5 py-0.5 rounded-full">Optional</span>
                    </label>
                    <input
                      type="text"
                      placeholder="27AABCU9603R1ZM"
                      className="rounded-xl w-full px-3 py-2.5 border border-neutral-300 bg-[#F3F4F6] text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-[#3678F1] focus:bg-white text-sm transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-neutral-700 text-xs mb-1 font-semibold">
                    Email Address <span className="text-[#F40F02]">*</span>
                  </label>
                  <input
                    type="email"
                    placeholder="yourcompany@gmail.com"
                    required
                    className="rounded-xl w-full px-3 py-2.5 border border-neutral-300 bg-[#F3F4F6] text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-[#3678F1] focus:bg-white text-sm transition-all"
                  />
                </div>

                <div>
                  <label className="block text-neutral-700 text-xs mb-1 font-semibold">Password <span className="text-[#F40F02]">*</span></label>
                  <input
                    type="password"
                    placeholder="Create a strong password"
                    required
                    className="rounded-xl w-full px-3 py-2.5 border border-neutral-300 bg-[#F3F4F6] text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-[#3678F1] focus:bg-white text-sm transition-all"
                  />
                </div>

                <div className="flex items-start gap-2 pt-0.5">
                  <input
                    type="checkbox"
                    id="terms"
                    required
                    className="w-3.5 h-3.5 mt-0.5 rounded border-neutral-300 accent-[#3678F1] cursor-pointer shrink-0"
                  />
                  <label htmlFor="terms" className="text-xs text-neutral-500 leading-relaxed cursor-pointer">
                    I agree to the{' '}
                    <Link to="#" className="text-[#3678F1] font-semibold hover:underline">Terms</Link>
                    {' '}and{' '}
                    <Link to="#" className="text-[#3678F1] font-semibold hover:underline">Privacy Policy</Link>
                  </label>
                </div>

                <button
                  type="submit"
                  className="rounded-xl w-full py-3 bg-[#3678F1] text-white text-sm font-semibold hover:bg-[#2563d4] transition-colors shadow-sm"
                >
                  Register Company
                </button>

                <p className="text-center text-xs text-neutral-500">
                  Already have an account?{' '}
                  <Link to="/login" className="text-[#3678F1] font-semibold hover:underline">Sign in</Link>
                </p>
              </form>
            </div>

            {/* Trust badges */}
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
