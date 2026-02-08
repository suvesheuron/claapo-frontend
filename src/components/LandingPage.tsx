import { useState } from 'react';

const CameraIcon = () => (
  <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M4 4h4l2-3h4l2 3h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zm0 2v12h16V6h-3.5l-1.5-2h-5l-1.5 2H4zm8 3a4 4 0 1 1 0 8 4 4 0 0 1 0-8zm0 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4z" />
  </svg>
);

const BuildingIcon = () => (
  <svg className="w-10 h-10" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M4 3h16a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zm1 2v14h14V5H5zm2 2h2v2H7V7zm4 0h2v2h-2V7zm4 0h2v2h-2V7zm-8 4h2v2H7v-2zm4 0h2v2h-2v-2zm4 0h2v2h-2v-2zm-8 4h2v2H7v-2zm4 0h2v2h-2v-2zm4 0h2v2h-2v-2z" />
  </svg>
);

const PersonIcon = () => (
  <svg className="w-10 h-10" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
  </svg>
);

const TruckIcon = () => (
  <svg className="w-10 h-10" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm13.5-9l1.96 2.5H17V9.5h2.5zm-1.5 9c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" />
  </svg>
);

const CheckIcon = () => (
  <svg className="w-5 h-5 shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
  </svg>
);

const featureCards = [
  {
    icon: BuildingIcon,
    title: 'For Companies',
    description: 'Ad agencies and line producers can search verified crew, check real-time availability, manage projects on a calendar, and lock bookings instantly.',
    features: ['Calendar-based project management', 'Verified GST and contact details', 'Real-time availability tracking'],
  },
  {
    icon: PersonIcon,
    title: 'For Freelancers',
    description: 'Crew members can showcase their skills, manage availability, receive booking requests, and get hired by top production companies.',
    features: ['Control your availability calendar', 'Get discovered by verified companies', 'Track past projects and invoices'],
  },
  {
    icon: TruckIcon,
    title: 'For Vendors',
    description: 'Equipment and service vendors can list inventory, manage rental availability, accept booking requests, and grow their business.',
    features: ['Manage equipment availability', 'Accept or decline rental requests', 'Track rental history and payments'],
  },
];

const steps = [
  { num: 1, title: 'Register', desc: 'Sign up as a Company, Freelancer, or Vendor with verified details' },
  { num: 2, title: 'Search & Filter', desc: 'Find crew or vendors by skill, location, availability, and budget' },
  { num: 3, title: 'Chat & Book', desc: 'Communicate directly and send booking requests in real-time' },
  { num: 4, title: 'Lock & Invoice', desc: 'Confirm bookings, manage projects, and generate invoices' },
];

const footerLinks = {
  companies: ['Hire Crew', 'Find Vendors', 'Pricing'],
  professionals: ['Join as Crew', 'Become a Vendor', 'Resources'],
  support: ['Help Center', 'Contact Us', 'Privacy Policy'],
};

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 md:h-20">
            <a href="/" className="flex items-center gap-2 text-black">
              <CameraIcon />
              <span className="font-bold text-xl">CrewCall</span>
            </a>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-6">
              <a href="#login" className="text-black hover:opacity-80 transition">Login</a>
              <a href="#register" className="bg-black text-white px-5 py-2.5 font-medium hover:bg-gray-800 transition">
                Register
              </a>
            </nav>

            {/* Mobile menu button */}
            <button
              type="button"
              className="md:hidden p-2 text-black"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>

          {/* Mobile menu */}
          {mobileMenuOpen && (
            <div className="md:hidden py-4 border-t border-gray-200">
              <nav className="flex flex-col gap-4">
                <a href="#login" className="text-black hover:opacity-80">Login</a>
                <a href="#register" className="bg-black text-white px-5 py-2.5 font-medium w-fit">Register</a>
              </nav>
            </div>
          )}
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 lg:py-32">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-black max-w-3xl leading-tight">
            Hire Film Crews & Vendors with Confidence
          </h1>
          <p className="mt-6 text-base sm:text-lg text-gray-600 max-w-2xl leading-relaxed">
            CrewCall connects production companies with verified freelance crew members and equipment vendors.
            Streamline your hiring, manage availability, and lock your team in one platform.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-4">
            <a href="#hire" className="inline-flex justify-center bg-black text-white px-8 py-3.5 font-medium hover:bg-gray-800 transition">
              Hire Crew
            </a>
            <a href="#join" className="inline-flex justify-center bg-white text-black border-2 border-black px-8 py-3.5 font-medium hover:bg-gray-50 transition">
              Join as Crew or Vendor
            </a>
          </div>
        </section>

        {/* Built for Every Role */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-black text-center mb-12 md:mb-16">
            Built for Every Role in Production
          </h2>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {featureCards.map((card) => (
              <div
                key={card.title}
                className="border border-gray-200 rounded-lg p-6 md:p-8 bg-white hover:border-gray-300 transition"
              >
                <div className="text-black mb-4">
                  <card.icon />
                </div>
                <h3 className="text-xl font-bold text-black mb-2">{card.title}</h3>
                <p className="text-gray-600 text-sm md:text-base mb-4">{card.description}</p>
                <ul className="space-y-2">
                  {card.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-gray-600 text-sm md:text-base">
                      <CheckIcon />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* How CrewCall Works */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-black text-center mb-12 md:mb-16">
            How CrewCall Works
          </h2>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step) => (
              <div key={step.num} className="flex flex-col items-start">
                <div className="w-12 h-12 bg-black text-white flex items-center justify-center font-bold text-lg mb-4">
                  {step.num}
                </div>
                <h3 className="text-lg font-bold text-black mb-2">{step.title}</h3>
                <p className="text-gray-600 text-sm md:text-base">{step.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-black text-white py-16 md:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8">
              <div>
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold">
                  Ready to Streamline Your Production?
                </h2>
                <p className="mt-3 text-gray-300 text-base md:text-lg">
                  Join thousands of production professionals using CrewCall
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 shrink-0">
                <a href="#get-started" className="inline-flex justify-center bg-white text-black px-8 py-3.5 font-medium hover:bg-gray-100 transition">
                  Get Started Now
                </a>
                <a href="#learn-more" className="inline-flex justify-center bg-transparent text-white border-2 border-white px-8 py-3.5 font-medium hover:bg-white hover:text-black transition">
                  Learn More
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-gray-200 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4">
              <div className="lg:col-span-1">
                <a href="/" className="flex items-center gap-2 text-black mb-4">
                  <CameraIcon />
                  <span className="font-bold text-xl">CrewCall</span>
                </a>
                <p className="text-gray-600 text-sm md:text-base">
                  The professional platform for film production hiring and crew management.
                </p>
              </div>
              <div>
                <h4 className="font-bold text-black mb-4">For Companies</h4>
                <ul className="space-y-2">
                  {footerLinks.companies.map((link) => (
                    <li key={link}>
                      <a href="#" className="text-gray-600 hover:text-black transition text-sm md:text-base">{link}</a>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="font-bold text-black mb-4">For Professionals</h4>
                <ul className="space-y-2">
                  {footerLinks.professionals.map((link) => (
                    <li key={link}>
                      <a href="#" className="text-gray-600 hover:text-black transition text-sm md:text-base">{link}</a>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="font-bold text-black mb-4">Support</h4>
                <ul className="space-y-2">
                  {footerLinks.support.map((link) => (
                    <li key={link}>
                      <a href="#" className="text-gray-600 hover:text-black transition text-sm md:text-base">{link}</a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <p className="mt-12 pt-8 border-t border-gray-200 text-center text-gray-500 text-sm">
              © 2025 CrewCall. All rights reserved.
            </p>
          </div>
        </footer>
      </main>
    </div>
  );
}
