import { Link } from 'react-router-dom';
import { useEffect } from 'react';
import { FaVideo, FaBuilding, FaUser, FaTruck, FaCheck } from 'react-icons/fa6';
import AppHeader from '../components/AppHeader';

const featureCards = [
  {
    icon: FaBuilding,
    title: 'For Companies',
    description: 'Ad agencies and line producers can search verified crew, check real-time availability, manage projects on a calendar, and lock bookings instantly.',
    features: ['Calendar-based project management', 'Verified GST and contact details', 'Real-time availability tracking'],
  },
  {
    icon: FaUser,
    title: 'For Freelancers',
    description: 'Crew members can showcase their skills, manage availability, receive booking requests, and get hired by top production companies.',
    features: ['Control your availability calendar', 'Get discovered by verified companies', 'Track past projects and invoices'],
  },
  {
    icon: FaTruck,
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
  companies: [{ label: 'Hire Crew', href: '#' }, { label: 'Find Vendors', href: '#' }, { label: 'Pricing', href: '#' }],
  professionals: [{ label: 'Join as Crew', href: '#' }, { label: 'Become a Vendor', href: '#' }, { label: 'Resources', href: '#' }],
  support: [{ label: 'Help Center', href: '#' }, { label: 'Contact Us', href: '#' }, { label: 'Privacy Policy', href: '#' }],
};

export default function LandingPage() {
  useEffect(() => {
    document.title = 'CrewCall – Hire Film Crews & Vendors with Confidence';
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <AppHeader variant="landing" />

      <section className="h-[600px] max-h-[80vh] bg-neutral-50 flex items-center">
        <div className="max-w-[1920px] mx-auto px-4 sm:px-8 lg:px-16 w-full">
          <div className="max-w-4xl">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl text-neutral-900 mb-6 font-bold">
              Hire Film Crews & Vendors with Confidence
            </h1>
            <p className="text-lg sm:text-xl text-neutral-600 mb-8 leading-relaxed">
              CrewCall connects production companies with verified freelance crew members and equipment vendors. Streamline your hiring, manage availability, and lock your team in one platform.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/dashboard" className="px-8 py-4 bg-neutral-900 text-white text-lg hover:bg-neutral-800 inline-block text-center">
                Hire Crew
              </Link>
              <Link to="/register" className="px-8 py-4 border-2 border-neutral-900 text-neutral-900 text-lg hover:bg-neutral-50 inline-block text-center">
                Join as Crew or Vendor
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-24 bg-white">
        <div className="max-w-[1920px] mx-auto px-4 sm:px-8 lg:px-16">
          <h2 className="text-3xl sm:text-4xl text-neutral-900 text-center mb-12 sm:mb-16 font-bold">
            Built for Every Role in Production
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-12">
            {featureCards.map((card) => (
              <div key={card.title} className="border border-neutral-200 p-8 sm:p-10">
                <div className="w-16 h-16 bg-neutral-800 flex items-center justify-center mb-6">
                  <card.icon className="text-white text-2xl" />
                </div>
                <h3 className="text-2xl text-neutral-900 mb-4 font-bold">{card.title}</h3>
                <p className="text-neutral-600 leading-relaxed mb-6">{card.description}</p>
                <ul className="space-y-3 text-neutral-700">
                  {card.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <FaCheck className="text-neutral-900 mt-1 shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-24 bg-neutral-50">
        <div className="max-w-[1920px] mx-auto px-4 sm:px-8 lg:px-16">
          <h2 className="text-3xl sm:text-4xl text-neutral-900 text-center mb-12 sm:mb-16 font-bold">
            How CrewCall Works
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step) => (
              <div key={step.num} className="text-center">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-neutral-900 text-white flex items-center justify-center mx-auto mb-6 text-2xl sm:text-3xl font-bold">
                  {step.num}
                </div>
                <h4 className="text-xl text-neutral-900 mb-3 font-bold">{step.title}</h4>
                <p className="text-neutral-600">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-24 bg-neutral-900">
        <div className="max-w-[1920px] mx-auto px-4 sm:px-8 lg:px-16 text-center">
          <h2 className="text-3xl sm:text-4xl text-white mb-6 font-bold">Ready to Streamline Your Production?</h2>
          <p className="text-xl text-neutral-300 mb-8">Join thousands of production professionals using CrewCall</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register" className="px-8 py-4 bg-white text-neutral-900 text-lg hover:bg-neutral-100 inline-block">
              Get Started Now
            </Link>
            <Link to="/register" className="px-8 py-4 border-2 border-white text-white text-lg hover:bg-neutral-800 inline-block">
              Learn More
            </Link>
          </div>
        </div>
      </section>

      <footer className="bg-white border-t border-neutral-200 py-12">
        <div className="max-w-[1920px] mx-auto px-4 sm:px-8 lg:px-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-12 mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-neutral-800 flex items-center justify-center">
                <FaVideo className="text-white text-xl" />
              </div>
              <span className="text-2xl text-neutral-900 font-semibold">CrewCall</span>
            </div>
            <div>
              <h5 className="text-neutral-900 mb-4 font-bold">For Companies</h5>
              <ul className="space-y-2 text-neutral-600">
                {footerLinks.companies.map((l) => (
                  <li key={l.label}><Link to={l.href} className="hover:text-neutral-900">{l.label}</Link></li>
                ))}
              </ul>
            </div>
            <div>
              <h5 className="text-neutral-900 mb-4 font-bold">For Professionals</h5>
              <ul className="space-y-2 text-neutral-600">
                {footerLinks.professionals.map((l) => (
                  <li key={l.label}><Link to={l.href} className="hover:text-neutral-900">{l.label}</Link></li>
                ))}
              </ul>
            </div>
            <div>
              <h5 className="text-neutral-900 mb-4 font-bold">Support</h5>
              <ul className="space-y-2 text-neutral-600">
                {footerLinks.support.map((l) => (
                  <li key={l.label}><Link to={l.href} className="hover:text-neutral-900">{l.label}</Link></li>
                ))}
              </ul>
            </div>
          </div>
          <div className="border-t border-neutral-200 pt-8 text-center text-neutral-600 text-sm">
            <p>© 2025 CrewCall. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
