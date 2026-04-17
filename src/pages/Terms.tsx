import { useEffect } from 'react';
import AppHeader from '../components/AppHeader';
import AppFooter from '../components/AppFooter';
import { useTheme } from '../contexts/ThemeContext';

const currentYear = new Date().getFullYear();

export default function Terms() {
  useEffect(() => { document.title = 'Terms of Service \u2013 Claapo'; }, []);
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const bg = {
    page: isDark ? '#0A0E17' : '#eef5fd',
    hero: isDark ? 'linear-gradient(145deg, #0F1A2E 0%, #0A0E17 70%, #0A0E17 100%)'
                 : 'linear-gradient(145deg, #a8c8f0 0%, #d8eaf9 60%, #eaf3fd 100%)',
    body: isDark ? 'linear-gradient(180deg, #0A0E17 0%, #0D1326 100%)'
                 : 'linear-gradient(180deg, #e5f0fc 0%, #eef5fd 100%)',
  };

  return (
    <div className="flex flex-col min-h-screen" style={{ background: bg.page }}>
      <AppHeader variant="landing" />

      <section className="py-16" style={{ background: bg.hero }}>
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-[#0f172a] dark:text-neutral-100 mb-4">Terms of Service</h1>
          <p className="text-sm text-slate-500 dark:text-neutral-400">Last updated: January 1, {currentYear}</p>
        </div>
      </section>

      <section className="py-16 flex-1" style={{ background: bg.body }}>
        <div className="max-w-3xl mx-auto px-6">
          <div className="bg-white dark:bg-[#141A28] rounded-2xl shadow-sm dark:shadow-black/30 border border-slate-100 dark:border-[#1F2940] p-8 sm:p-12 space-y-8">

            <div>
              <h2 className="text-xl font-bold text-neutral-900 mb-3">1. Acceptance of Terms</h2>
              <p className="text-sm text-neutral-600 leading-relaxed">
                By accessing or using Claapo ("the Platform"), you agree to be bound by these Terms of Service. If you do not agree to these terms, you may not use the Platform. Claapo is operated by Claapo Technologies Private Limited, a company incorporated under the laws of India.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-neutral-900 mb-3">2. User Accounts</h2>
              <p className="text-sm text-neutral-600 leading-relaxed mb-3">When creating an account, you agree to:</p>
              <ul className="list-disc list-inside text-sm text-neutral-600 space-y-1.5 ml-2">
                <li>Provide accurate, current, and complete information during registration.</li>
                <li>Maintain the security of your account credentials and not share your password.</li>
                <li>Accept responsibility for all activities that occur under your account.</li>
                <li>Promptly notify us of any unauthorized access to your account.</li>
                <li>Register for only one account type (Individual, Company, or Vendor) per email address.</li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-bold text-neutral-900 mb-3">3. Platform Services</h2>
              <p className="text-sm text-neutral-600 leading-relaxed mb-3">Claapo provides the following services:</p>
              <ul className="list-disc list-inside text-sm text-neutral-600 space-y-1.5 ml-2">
                <li><strong>For Production Companies:</strong> Search and discover verified crew and vendors, send booking requests, manage projects, create invoices, and collaborate with teams.</li>
                <li><strong>For Freelancers:</strong> Create professional profiles, manage availability calendars, respond to booking requests, and generate invoices.</li>
                <li><strong>For Vendors:</strong> List equipment inventory, manage rental calendars, respond to rental requests, and track bookings.</li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-bold text-neutral-900 mb-3">4. Booking &amp; Payments</h2>
              <p className="text-sm text-neutral-600 leading-relaxed mb-3">Regarding bookings and financial transactions:</p>
              <ul className="list-disc list-inside text-sm text-neutral-600 space-y-1.5 ml-2">
                <li>Claapo facilitates connections between parties but is not a party to any booking agreement between users.</li>
                <li>Rates, terms, and conditions of bookings are negotiated directly between the parties involved.</li>
                <li>Payment processing is handled through third-party payment gateways (e.g., Razorpay). Claapo is not responsible for payment failures or disputes.</li>
                <li>All amounts displayed on the platform are in Indian Rupees (INR) unless otherwise specified.</li>
                <li>Cancellation policies and refunds are subject to mutual agreement between the booking parties.</li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-bold text-neutral-900 mb-3">5. User Conduct</h2>
              <p className="text-sm text-neutral-600 leading-relaxed mb-3">You agree not to:</p>
              <ul className="list-disc list-inside text-sm text-neutral-600 space-y-1.5 ml-2">
                <li>Use the Platform for any unlawful purpose or in violation of any applicable laws.</li>
                <li>Provide false or misleading information in your profile or booking requests.</li>
                <li>Harass, abuse, or harm other users through the Platform's messaging features.</li>
                <li>Attempt to bypass, disable, or circumvent any security features of the Platform.</li>
                <li>Scrape, crawl, or use automated means to access the Platform without permission.</li>
                <li>Impersonate another person or entity on the Platform.</li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-bold text-neutral-900 mb-3">6. Intellectual Property</h2>
              <p className="text-sm text-neutral-600 leading-relaxed">
                The Claapo platform, including its design, features, logos, and content, is owned by Claapo Technologies Private Limited. You retain ownership of content you upload to your profile. By uploading content, you grant Claapo a non-exclusive, worldwide license to display that content within the platform for the purpose of providing our services.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-neutral-900 mb-3">7. Limitation of Liability</h2>
              <p className="text-sm text-neutral-600 leading-relaxed">
                Claapo provides the platform "as is" and "as available." We do not guarantee uninterrupted or error-free service. To the maximum extent permitted by law, Claapo shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the Platform, including but not limited to loss of revenue, data, or business opportunities.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-neutral-900 mb-3">8. Termination</h2>
              <p className="text-sm text-neutral-600 leading-relaxed">
                We reserve the right to suspend or terminate your account if you violate these Terms of Service. You may delete your account at any time by contacting our support team. Upon termination, your right to use the Platform will cease immediately, but provisions that by their nature should survive will remain in effect.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-neutral-900 mb-3">9. Governing Law</h2>
              <p className="text-sm text-neutral-600 leading-relaxed">
                These Terms are governed by and construed in accordance with the laws of India. Any disputes arising from these Terms shall be subject to the exclusive jurisdiction of the courts in Mumbai, Maharashtra.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-neutral-900 mb-3">10. Contact</h2>
              <p className="text-sm text-neutral-600 leading-relaxed">
                For questions about these Terms, contact us at{' '}
                <a href="mailto:hello@crewcall.in" className="text-[#3678F1] dark:text-[#60A5FA] hover:text-[#2563EB] dark:hover:text-[#93C5FD] transition-colors">hello@crewcall.in</a>.
              </p>
            </div>

          </div>
        </div>
      </section>

      <AppFooter variant="dark" />
    </div>
  );
}
