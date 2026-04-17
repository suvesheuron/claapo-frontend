import { useEffect } from 'react';
import AppHeader from '../components/AppHeader';
import AppFooter from '../components/AppFooter';
import { useTheme } from '../contexts/ThemeContext';

const currentYear = new Date().getFullYear();

export default function Privacy() {
  useEffect(() => { document.title = 'Privacy Policy \u2013 Claapo'; }, []);
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
          <h1 className="text-4xl sm:text-5xl font-extrabold text-[#0f172a] dark:text-neutral-100 mb-4">Privacy Policy</h1>
          <p className="text-sm text-slate-500 dark:text-neutral-400">Last updated: January 1, {currentYear}</p>
        </div>
      </section>

      <section className="py-16 flex-1" style={{ background: bg.body }}>
        <div className="max-w-3xl mx-auto px-6">
          <div className="bg-white dark:bg-[#141A28] rounded-2xl shadow-sm dark:shadow-black/30 border border-slate-100 dark:border-[#1F2940] p-8 sm:p-12 space-y-8">

            <div>
              <h2 className="text-xl font-bold text-neutral-900 mb-3">1. Information We Collect</h2>
              <p className="text-sm text-neutral-600 leading-relaxed mb-3">We collect information you provide directly to us, including:</p>
              <ul className="list-disc list-inside text-sm text-neutral-600 space-y-1.5 ml-2">
                <li><strong>Account Information:</strong> Name, email address, phone number, and role (freelancer, company, or vendor) when you create an account.</li>
                <li><strong>Profile Information:</strong> Professional details such as skills, daily rates, location, bio, IMDB/Instagram links, and portfolio information.</li>
                <li><strong>Financial Information:</strong> PAN number, GST number, and bank account details for invoicing and payment processing.</li>
                <li><strong>Usage Data:</strong> Information about how you interact with our platform, including bookings, project management activities, and search queries.</li>
                <li><strong>Communications:</strong> Messages sent through our chat feature and any correspondence with our support team.</li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-bold text-neutral-900 mb-3">2. How We Use Your Information</h2>
              <p className="text-sm text-neutral-600 leading-relaxed mb-3">We use the information we collect to:</p>
              <ul className="list-disc list-inside text-sm text-neutral-600 space-y-1.5 ml-2">
                <li>Provide, maintain, and improve our platform services.</li>
                <li>Process booking requests and facilitate connections between production companies, freelancers, and vendors.</li>
                <li>Generate and process invoices and payment transactions.</li>
                <li>Send you notifications about booking requests, project updates, and platform activity.</li>
                <li>Verify GST numbers and professional credentials for trust and safety purposes.</li>
                <li>Respond to your inquiries and provide customer support.</li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-bold text-neutral-900 mb-3">3. Information Sharing</h2>
              <p className="text-sm text-neutral-600 leading-relaxed mb-3">We do not sell your personal information. We share your information only in the following circumstances:</p>
              <ul className="list-disc list-inside text-sm text-neutral-600 space-y-1.5 ml-2">
                <li><strong>With Other Users:</strong> Your professional profile information (name, skills, rates, availability) is visible to other platform users to facilitate hiring and bookings.</li>
                <li><strong>Payment Processors:</strong> We share necessary financial information with Razorpay to process payments securely.</li>
                <li><strong>Cloud Services:</strong> We use AWS services for file storage (S3) and email delivery (SES).</li>
                <li><strong>Legal Requirements:</strong> When required by law or to protect the rights and safety of our users and platform.</li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-bold text-neutral-900 mb-3">4. Data Security</h2>
              <p className="text-sm text-neutral-600 leading-relaxed">
                We implement industry-standard security measures to protect your data. This includes encryption of data in transit (TLS/SSL), secure authentication using JWT tokens, password hashing with bcrypt, and role-based access controls. Sensitive financial information is handled with the highest level of care and is never stored in plain text.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-neutral-900 mb-3">5. Data Retention</h2>
              <p className="text-sm text-neutral-600 leading-relaxed">
                We retain your account information for as long as your account is active or as needed to provide services. If you request account deletion, we will remove your personal data within 30 days, except where retention is required by law or for legitimate business purposes such as dispute resolution.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-neutral-900 mb-3">6. Your Rights</h2>
              <p className="text-sm text-neutral-600 leading-relaxed mb-3">You have the right to:</p>
              <ul className="list-disc list-inside text-sm text-neutral-600 space-y-1.5 ml-2">
                <li>Access and download your personal data.</li>
                <li>Update or correct your profile information at any time.</li>
                <li>Request deletion of your account and associated data.</li>
                <li>Opt out of non-essential communications and marketing emails.</li>
                <li>Withdraw consent for data processing where applicable.</li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-bold text-neutral-900 mb-3">7. Cookies &amp; Tracking</h2>
              <p className="text-sm text-neutral-600 leading-relaxed">
                We use essential cookies to maintain your session and authentication state. We may use analytics tools to understand platform usage patterns and improve the user experience. You can control cookie preferences through your browser settings.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-neutral-900 mb-3">8. Contact Us</h2>
              <p className="text-sm text-neutral-600 leading-relaxed">
                If you have any questions about this Privacy Policy or our data practices, please contact us at{' '}
                <a href="mailto:hello@crewcall.in" className="text-[#3678F1] dark:text-[#60A5FA] hover:text-[#2563EB] dark:hover:text-[#93C5FD] transition-colors">hello@crewcall.in</a> or visit our{' '}
                <a href="/contact" className="text-[#3678F1] dark:text-[#60A5FA] hover:text-[#2563EB] dark:hover:text-[#93C5FD] transition-colors">Contact page</a>.
              </p>
            </div>

          </div>
        </div>
      </section>

      <AppFooter variant="dark" />
    </div>
  );
}
