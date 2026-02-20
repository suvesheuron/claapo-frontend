import { Link } from 'react-router-dom';
import { useEffect } from 'react';
import { FaBuilding, FaShieldHalved, FaCircleInfo, FaEnvelope, FaLock, FaCertificate, FaHandshake, FaCircleCheck } from 'react-icons/fa6';
import AppLayout from '../components/AppLayout';

export default function CompanyRegistration() {
  useEffect(() => {
    document.title = 'Company Registration – CrewCall';
  }, []);

  return (
    <AppLayout headerVariant="back" backTo="/register" backLabel="Back to User Type" showFooter={false}>
      <div className="h-full min-h-0 overflow-hidden grid grid-cols-1 lg:grid-cols-2 w-full max-w-full gap-0 bg-neutral-900">
        {/* Left: intro */}
        <section className="hidden lg:flex flex-col px-8 xl:px-16 py-12 pt-20 xl:pt-24 bg-neutral-900 text-white relative overflow-auto">
          {/* Decorative background elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
          
          <div className="relative z-10 max-w-xl mx-auto w-full">
            <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center shrink-0 mb-6 border border-white/20">
              <FaBuilding className="text-white text-3xl" />
            </div>
            <h2 className="text-3xl xl:text-4xl text-white font-bold mb-4 leading-tight">Register your company</h2>
            <p className="text-base text-neutral-200 mb-8 max-w-md leading-relaxed">
              Join CrewCall to hire verified crew and vendors. Get access to a trusted network of production professionals.
            </p>
            <div className="space-y-4 mb-8">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-white/10 backdrop-blur-sm flex items-center justify-center shrink-0 border border-white/20">
                  <FaCertificate className="text-white text-lg" />
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-1">GST Verification</h3>
                  <p className="text-sm text-neutral-300">Verified business profiles for trust and authenticity</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-white/10 backdrop-blur-sm flex items-center justify-center shrink-0 border border-white/20">
                  <FaShieldHalved className="text-white text-lg" />
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-1">Secure Onboarding</h3>
                  <p className="text-sm text-neutral-300">Enterprise-grade security for your business data</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-white/10 backdrop-blur-sm flex items-center justify-center shrink-0 border border-white/20">
                  <FaHandshake className="text-white text-lg" />
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-1">Trusted Platform</h3>
                  <p className="text-sm text-neutral-300">Join thousands of production companies already on CrewCall</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm text-neutral-300">
              <span className="flex items-center gap-2">
                <FaCircleCheck className="text-green-400" />
                <span>24/7 Support</span>
              </span>
              <span className="flex items-center gap-2">
                <FaCircleCheck className="text-green-400" />
                <span>Free Setup</span>
              </span>
            </div>
          </div>
        </section>

        {/* Right: form */}
        <div className="flex items-center justify-center overflow-auto p-4 sm:p-6 lg:p-8 xl:p-12 bg-neutral-900">
          <div className="w-full max-w-[540px] py-4 sm:py-6">
            {/* Mobile-only title */}
            <div className="lg:hidden text-center mb-6">
              <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-sm mx-auto mb-4 flex items-center justify-center shrink-0 shadow-lg border border-white/20">
                <FaBuilding className="text-white text-2xl" />
              </div>
              <h1 className="text-2xl sm:text-3xl text-white font-bold mb-2">Company Registration</h1>
              <p className="text-sm sm:text-base text-neutral-200">Join CrewCall and start hiring verified professionals</p>
            </div>

            <div className="rounded-l-none rounded-r-2xl lg:rounded-2xl bg-white shadow-xl p-6 sm:p-8 md:p-10 border-0">
              <div className="mb-6">
                <h2 className="text-2xl sm:text-3xl text-neutral-900 font-bold mb-2">Create your account</h2>
                <p className="text-sm text-neutral-600">Fill in your company details to get started</p>
              </div>

              <form className="space-y-5 sm:space-y-6" onSubmit={(e) => {
                e.preventDefault();
                alert('Company registration submitted! (Backend integration needed)');
              }}>
                <div className="min-w-0">
                  <label className="block text-neutral-900 text-sm sm:text-base mb-2 font-semibold">
                    Company Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Production Studios Inc."
                    required
                    className="rounded-xl w-full min-w-0 px-4 py-3.5 sm:py-4 border-2 border-neutral-300 bg-white text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/10 transition-all text-base shadow-sm hover:border-neutral-400"
                  />
                </div>

                <div className="min-w-0">
                  <label className="block text-neutral-900 text-sm sm:text-base mb-2 font-semibold">
                    GST Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., 27AABCU9603R1ZM"
                    required
                    className="rounded-xl w-full min-w-0 px-4 py-3.5 sm:py-4 border-2 border-neutral-300 bg-white text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/10 transition-all text-base shadow-sm hover:border-neutral-400"
                  />
                  <p className="text-xs sm:text-sm text-neutral-500 mt-2 flex items-center gap-2 bg-neutral-50 rounded-lg px-3 py-2">
                    <FaCircleInfo className="text-neutral-400 shrink-0" />
                    <span>We&apos;ll verify your GST for business authenticity</span>
                  </p>
                </div>

                <div className="min-w-0">
                  <label className="block text-neutral-900 text-sm sm:text-base mb-2 font-semibold">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    placeholder="+91 98765 43210"
                    required
                    className="rounded-xl w-full min-w-0 px-4 py-3.5 sm:py-4 border-2 border-neutral-300 bg-white text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/10 transition-all text-base shadow-sm hover:border-neutral-400"
                  />
                  <p className="text-xs sm:text-sm text-neutral-500 mt-2 flex items-center gap-2 bg-neutral-50 rounded-lg px-3 py-2">
                    <FaShieldHalved className="text-neutral-400 shrink-0" />
                    <span>Phone verification required for account security</span>
                  </p>
                </div>

                <div className="min-w-0">
                  <label className="block text-neutral-900 text-sm sm:text-base mb-2 font-semibold">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    placeholder="company@example.com"
                    required
                    className="rounded-xl w-full min-w-0 px-4 py-3.5 sm:py-4 border-2 border-neutral-300 bg-white text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/10 transition-all text-base shadow-sm hover:border-neutral-400"
                  />
                  <p className="text-xs sm:text-sm text-neutral-500 mt-2 flex items-center gap-2 bg-neutral-50 rounded-lg px-3 py-2">
                    <FaEnvelope className="text-neutral-400 shrink-0" />
                    <span>Verification link will be sent to this email</span>
                  </p>
                </div>

                <div className="rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-100 p-4 sm:p-5 min-w-0">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                      <FaShieldHalved className="text-blue-600 text-lg" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-neutral-900 text-sm sm:text-base font-bold mb-2">Verification Process</h3>
                      <ul className="text-xs sm:text-sm text-neutral-700 space-y-1.5">
                        <li className="flex items-center gap-2">
                          <FaCircleCheck className="text-blue-600 shrink-0" />
                          <span>GST, phone &amp; email verification</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <FaCircleCheck className="text-blue-600 shrink-0" />
                          <span>Typically complete within 24 hours</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <FaCircleCheck className="text-blue-600 shrink-0" />
                          <span>Secure and confidential</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 bg-neutral-50 rounded-xl border border-neutral-200">
                  <input 
                    type="checkbox" 
                    required
                    className="w-5 h-5 border-2 border-neutral-300 mt-0.5 rounded shrink-0 focus:ring-2 focus:ring-neutral-900/20 focus:border-neutral-900 cursor-pointer" 
                    id="terms" 
                  />
                  <label htmlFor="terms" className="text-xs sm:text-sm text-neutral-700 leading-relaxed">
                    I agree to the <Link to="#" className="text-neutral-900 hover:underline font-semibold">Terms of Service</Link> and{' '}
                    <Link to="#" className="text-neutral-900 hover:underline font-semibold">Privacy Policy</Link>
                  </label>
                </div>

                <button 
                  type="submit" 
                  className="rounded-xl w-full py-4 bg-gradient-to-r from-neutral-900 to-neutral-800 text-white text-base sm:text-lg hover:from-neutral-800 hover:to-neutral-700 font-semibold min-h-[52px] shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5"
                >
                  Register Company
                </button>

                <div className="text-center pt-2">
                  <p className="text-neutral-600 text-sm sm:text-base">
                    Already have an account?{' '}
                    <Link to="/login" className="text-neutral-900 hover:underline font-semibold">
                      Login here
                    </Link>
                  </p>
                </div>
              </form>
            </div>

            <div className="mt-6 sm:mt-8 flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs sm:text-sm text-neutral-500">
              <span className="flex items-center gap-2 px-3 py-1.5 bg-neutral-50 rounded-lg">
                <FaLock className="text-neutral-400" /> Secure
              </span>
              <span className="flex items-center gap-2 px-3 py-1.5 bg-neutral-50 rounded-lg">
                <FaCertificate className="text-neutral-400" /> Verified
              </span>
              <span className="flex items-center gap-2 px-3 py-1.5 bg-neutral-50 rounded-lg">
                <FaHandshake className="text-neutral-400" /> Trusted
              </span>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
