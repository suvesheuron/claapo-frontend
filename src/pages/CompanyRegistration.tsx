import { Link } from 'react-router-dom';
import { useEffect } from 'react';
import { FaBuilding, FaShieldHalved, FaCircleInfo, FaEnvelope, FaLock, FaCertificate, FaHandshake } from 'react-icons/fa6';
import AppLayout from '../components/AppLayout';

export default function CompanyRegistration() {
  useEffect(() => {
    document.title = 'Company Registration – CrewCall';
  }, []);

  return (
    <AppLayout headerVariant="back" backTo="/register" backLabel="Back to User Type" showFooter={false}>
      <div className="h-full min-h-0 overflow-hidden flex flex-col lg:grid lg:grid-cols-[1fr,1fr] w-full max-w-full">
        {/* Left: intro (desktop only) */}
        <section className="hidden lg:flex flex-col justify-center px-8 xl:px-12 py-6 bg-neutral-100 border-r border-neutral-200 min-h-0">
          <div className="w-14 h-14 rounded-xl bg-neutral-800 flex items-center justify-center shrink-0 mb-6">
            <FaBuilding className="text-white text-2xl" />
          </div>
          <h2 className="text-xl xl:text-2xl text-neutral-900 font-bold mb-3">Register your company</h2>
          <p className="text-sm text-neutral-600 mb-4 max-w-sm">
            Join CrewCall to hire crew and vendors with verified business profiles.
          </p>
          <ul className="text-sm text-neutral-600 space-y-2">
            <li className="flex items-center gap-2">
              <FaCertificate className="text-neutral-500 shrink-0" /> GST verification
            </li>
            <li className="flex items-center gap-2">
              <FaShieldHalved className="text-neutral-500 shrink-0" /> Secure onboarding
            </li>
            <li className="flex items-center gap-2">
              <FaHandshake className="text-neutral-500 shrink-0" /> Trusted platform
            </li>
          </ul>
        </section>

        {/* Right: form */}
        <div className="flex-1 min-h-0 flex items-center justify-center overflow-auto p-4 sm:p-6 lg:p-8">
          <div className="w-full max-w-[480px] min-w-0 py-2">
            {/* Mobile-only title */}
            <div className="lg:hidden text-center mb-4">
              <div className="w-11 h-11 rounded-lg bg-neutral-800 mx-auto mb-2 flex items-center justify-center shrink-0">
                <FaBuilding className="text-white text-lg" />
              </div>
              <h1 className="text-xl sm:text-2xl text-neutral-900 font-bold">Company Registration</h1>
              <p className="text-xs sm:text-sm text-neutral-600 mt-1">Register your company to start hiring</p>
            </div>

            <div className="rounded-lg bg-white border border-neutral-200 p-4 sm:p-5 md:p-6">
              <form className="space-y-2.5 sm:space-y-3">
                <div className="min-w-0">
                  <label className="block text-neutral-900 text-xs sm:text-sm mb-1 font-medium">Company Name *</label>
                  <input
                    type="text"
                    placeholder="Enter your company name"
                    className="rounded-lg w-full min-w-0 px-3 py-2.5 sm:py-3 border border-neutral-300 bg-white text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-neutral-900 text-sm sm:text-base"
                  />
                </div>
                <div className="min-w-0">
                  <label className="block text-neutral-900 text-xs sm:text-sm mb-1 font-medium">GST Number *</label>
                  <input
                    type="text"
                    placeholder="Enter GST registration number"
                    className="rounded-lg w-full min-w-0 px-3 py-2.5 sm:py-3 border border-neutral-300 bg-white text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-neutral-900 text-sm sm:text-base"
                  />
                  <p className="text-xs text-neutral-500 mt-1 flex items-center gap-1">
                    <FaCircleInfo className="shrink-0" /> We&apos;ll verify your GST for business authenticity
                  </p>
                </div>
                <div className="min-w-0">
                  <label className="block text-neutral-900 text-xs sm:text-sm mb-1 font-medium">Phone Number *</label>
                  <input
                    type="tel"
                    placeholder="+91 XXXXX XXXXX"
                    className="rounded-lg w-full min-w-0 px-3 py-2.5 sm:py-3 border border-neutral-300 bg-white text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-neutral-900 text-sm sm:text-base"
                  />
                  <p className="text-xs text-neutral-500 mt-1 flex items-center gap-1">
                    <FaShieldHalved className="shrink-0" /> Phone verification required
                  </p>
                </div>
                <div className="min-w-0">
                  <label className="block text-neutral-900 text-xs sm:text-sm mb-1 font-medium">Email Address *</label>
                  <input
                    type="email"
                    placeholder="company@example.com"
                    className="rounded-lg w-full min-w-0 px-3 py-2.5 sm:py-3 border border-neutral-300 bg-white text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-neutral-900 text-sm sm:text-base"
                  />
                  <p className="text-xs text-neutral-500 mt-1 flex items-center gap-1">
                    <FaEnvelope className="shrink-0" /> Verification link will be sent here
                  </p>
                </div>

                <div className="rounded-lg bg-neutral-50 border border-neutral-200 p-3 sm:p-4 min-w-0">
                  <div className="flex items-start gap-2 min-w-0">
                    <FaShieldHalved className="text-neutral-600 text-base mt-0.5 shrink-0" />
                    <div>
                      <h3 className="text-neutral-900 text-xs font-bold mb-1">Verification Process</h3>
                      <ul className="text-xs text-neutral-600 space-y-0.5">
                        <li>• GST, phone &amp; email verification</li>
                        <li>• Typically complete within 24 hours</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <input type="checkbox" className="w-4 h-4 border border-neutral-300 mt-0.5 rounded shrink-0" id="terms" />
                  <label htmlFor="terms" className="text-xs sm:text-sm text-neutral-700">
                    I agree to the <Link to="#" className="text-neutral-900 hover:underline">Terms of Service</Link> and{' '}
                    <Link to="#" className="text-neutral-900 hover:underline">Privacy Policy</Link>
                  </label>
                </div>

                <button type="submit" className="rounded-lg w-full py-2.5 sm:py-3 bg-neutral-900 text-white text-sm sm:text-base hover:bg-neutral-700 font-medium min-h-[40px] sm:min-h-[44px]">
                  Register Company
                </button>

                <div className="text-center pt-0.5">
                  <p className="text-neutral-600 text-xs sm:text-sm">
                    Already have an account? <Link to="/login" className="text-neutral-900 hover:underline font-medium">Login here</Link>
                  </p>
                </div>
              </form>
            </div>

            <div className="mt-3 sm:mt-4 flex flex-wrap items-center justify-center gap-3 sm:gap-4 text-xs text-neutral-500">
              <span className="flex items-center gap-1.5"><FaLock /> Secure</span>
              <span className="flex items-center gap-1.5"><FaCertificate /> Verified</span>
              <span className="flex items-center gap-1.5"><FaHandshake /> Trusted</span>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
