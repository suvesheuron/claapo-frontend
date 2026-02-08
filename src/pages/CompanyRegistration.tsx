import { Link } from 'react-router-dom';
import { useEffect } from 'react';
import { FaBuilding, FaShieldHalved, FaCircleInfo, FaEnvelope, FaLock, FaCertificate, FaHandshake } from 'react-icons/fa6';
import AppLayout from '../components/AppLayout';

export default function CompanyRegistration() {
  useEffect(() => {
    document.title = 'Company Registration – CrewCall';
  }, []);

  return (
    <AppLayout headerVariant="back" backTo="/register" backLabel="Back to User Type">
      <div className="flex items-center justify-center px-4 sm:px-8 py-12 sm:py-20">
        <div className="w-full max-w-[640px]">
          <div className="text-center mb-8 sm:mb-12">
            <div className="w-16 h-16 bg-neutral-800 mx-auto mb-6 flex items-center justify-center">
              <FaBuilding className="text-white text-2xl" />
            </div>
            <h1 className="text-4xl sm:text-5xl text-neutral-900 mb-4 font-bold">Company Registration</h1>
            <p className="text-lg text-neutral-600">Register your company to start hiring crew and vendors</p>
          </div>

          <div className="bg-white border border-neutral-200 p-8 sm:p-12">
            <form className="space-y-6">
              <div>
                <label className="block text-neutral-900 text-sm mb-3 font-medium">Company Name *</label>
                <input
                  type="text"
                  placeholder="Enter your company name"
                  className="w-full px-4 py-4 border border-neutral-300 bg-white text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-neutral-900"
                />
              </div>
              <div>
                <label className="block text-neutral-900 text-sm mb-3 font-medium">GST Number *</label>
                <input
                  type="text"
                  placeholder="Enter GST registration number"
                  className="w-full px-4 py-4 border border-neutral-300 bg-white text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-neutral-900"
                />
                <p className="text-xs text-neutral-500 mt-2 flex items-center gap-1">
                  <FaCircleInfo className="shrink-0" /> We&apos;ll verify your GST registration for business authenticity
                </p>
              </div>
              <div>
                <label className="block text-neutral-900 text-sm mb-3 font-medium">Phone Number *</label>
                <input
                  type="tel"
                  placeholder="+91 XXXXX XXXXX"
                  className="w-full px-4 py-4 border border-neutral-300 bg-white text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-neutral-900"
                />
                <p className="text-xs text-neutral-500 mt-2 flex items-center gap-1">
                  <FaShieldHalved className="shrink-0" /> Phone verification required for account security
                </p>
              </div>
              <div>
                <label className="block text-neutral-900 text-sm mb-3 font-medium">Email Address *</label>
                <input
                  type="email"
                  placeholder="company@example.com"
                  className="w-full px-4 py-4 border border-neutral-300 bg-white text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-neutral-900"
                />
                <p className="text-xs text-neutral-500 mt-2 flex items-center gap-1">
                  <FaEnvelope className="shrink-0" /> Email verification link will be sent to this address
                </p>
              </div>

              <div className="bg-neutral-50 border border-neutral-200 p-6">
                <div className="flex items-start gap-3">
                  <FaShieldHalved className="text-neutral-600 text-lg mt-1 shrink-0" />
                  <div>
                    <h3 className="text-neutral-900 text-sm font-bold mb-2">Verification Process</h3>
                    <ul className="text-xs text-neutral-600 space-y-1">
                      <li>• GST verification ensures business legitimacy</li>
                      <li>• Phone verification for secure communication</li>
                      <li>• Email verification for account access</li>
                      <li>• All verifications typically complete within 24 hours</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <input type="checkbox" className="w-4 h-4 border border-neutral-300 mt-1 rounded" id="terms" />
                <label htmlFor="terms" className="text-sm text-neutral-700">
                  I agree to the <Link to="#" className="text-neutral-900 hover:underline">Terms of Service</Link> and{' '}
                  <Link to="#" className="text-neutral-900 hover:underline">Privacy Policy</Link>
                </label>
              </div>

              <button type="submit" className="w-full py-4 bg-neutral-900 text-white text-lg hover:bg-neutral-800 font-medium">
                Register Company
              </button>

              <div className="text-center">
                <p className="text-neutral-600 text-sm">
                  Already have an account? <Link to="/login" className="text-neutral-900 hover:underline font-medium">Login here</Link>
                </p>
              </div>
            </form>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs text-neutral-500">
            <span className="flex items-center gap-2">
              <FaLock /> Secure Registration
            </span>
            <span className="flex items-center gap-2">
              <FaCertificate /> Verified Business
            </span>
            <span className="flex items-center gap-2">
              <FaHandshake /> Trusted Platform
            </span>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
