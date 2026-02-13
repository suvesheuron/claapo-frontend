import { Link } from 'react-router-dom';
import { useEffect } from 'react';
import { FaVideo, FaCalendar, FaUsers, FaTruck, FaCircleCheck, FaLock } from 'react-icons/fa6';
import { FaSearch } from 'react-icons/fa';
import AppHeader from '../components/AppHeader';

export default function LandingPage() {
  useEffect(() => {
    document.title = 'CrewCall – Hire Film Crews & Vendors with Confidence';
  }, []);

  const features = [
    {
      icon: FaCalendar,
      title: 'Centralized Calendar',
      description: 'Real-time visibility into crew and vendor availability',
    },
    {
      icon: FaUsers,
      title: 'Structured Hiring',
      description: 'Systematic workflow for searching, filtering, and hiring',
    },
    {
      icon: FaLock,
      title: 'Lock & Manage',
      description: 'Secure bookings and track your production team',
    },
    {
      icon: FaSearch,
      title: 'Past Work Tracking',
      description: 'Complete project history with chats and invoices',
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-white min-w-0 w-full">
      {/* Fixed-height header */}
      <div className="shrink-0">
        <AppHeader variant="landing" />
      </div>

      {/* Main: Hero Section */}
      <main className="flex-1 flex flex-col min-h-0">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-neutral-50 via-white to-neutral-50 py-16 sm:py-20 md:py-24 lg:py-32">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-12">
            <div className="text-center max-w-5xl mx-auto space-y-6 sm:space-y-8">
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-tight text-balance bg-gradient-to-r from-neutral-900 via-neutral-700 to-neutral-500 bg-clip-text text-transparent">
                Reimagining How Advertising Productions Hire & Manage Crews
              </h1>
              <p className="text-lg sm:text-xl md:text-2xl text-neutral-600 leading-relaxed text-balance max-w-3xl mx-auto">
                CrewCall connects production companies with verified freelance crew members and equipment vendors. 
                Streamline your hiring, manage availability, and lock your team in one centralized platform.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
                <Link
                  to="/dashboard"
                  className="inline-flex justify-center items-center rounded-lg bg-neutral-900 text-white px-8 py-4 font-semibold hover:bg-neutral-800 transition-all text-base sm:text-lg w-full sm:w-auto min-h-[52px] shadow-lg hover:shadow-xl hover:scale-105"
                >
                  Get Started
                </Link>
                <Link
                  to="/register"
                  className="inline-flex justify-center items-center rounded-lg border-2 border-neutral-900 text-neutral-900 px-8 py-4 font-semibold hover:bg-neutral-50 transition-all text-base sm:text-lg w-full sm:w-auto min-h-[52px] hover:scale-105"
                >
                  Join as Crew or Vendor
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 sm:py-20 md:py-24 lg:py-28 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-12">
            <div className="text-center mb-12 sm:mb-16 md:mb-20 space-y-4">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight text-balance bg-gradient-to-r from-neutral-900 to-neutral-600 bg-clip-text text-transparent">
                Everything You Need to Manage Productions
              </h2>
              <p className="text-lg sm:text-xl text-neutral-600 text-balance max-w-2xl mx-auto">
                Three core pillars that revolutionize crew hiring and management
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="bg-gradient-to-br from-neutral-50 to-white rounded-xl p-8 sm:p-10 hover:shadow-xl transition-all border border-neutral-200 hover:border-neutral-300 hover:-translate-y-1"
                >
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-gradient-to-br from-neutral-900 to-neutral-700 flex items-center justify-center mb-6 shadow-lg">
                    <feature.icon className="text-white text-2xl sm:text-3xl" />
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold leading-tight text-neutral-900 mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-base sm:text-lg text-neutral-600 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* User Types Section */}
        <section className="py-16 sm:py-20 md:py-24 lg:py-28 bg-gradient-to-b from-neutral-50 to-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-12">
            <div className="text-center mb-12 sm:mb-16 md:mb-20 space-y-4">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight text-balance bg-gradient-to-r from-neutral-900 to-neutral-600 bg-clip-text text-transparent">
                Built for Everyone in Production
              </h2>
              <p className="text-lg sm:text-xl text-neutral-600 text-balance max-w-2xl mx-auto">
                Whether you're hiring, getting hired, or providing equipment
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-10">
              <div className="bg-white rounded-xl p-8 sm:p-10 border border-neutral-200 hover:shadow-xl transition-all hover:-translate-y-1">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center mb-6 shadow-md">
                  <FaUsers className="text-blue-600 text-2xl sm:text-3xl" />
                </div>
                <h3 className="text-2xl sm:text-3xl font-bold leading-tight text-neutral-900 mb-4">
                  Production Companies
                </h3>
                <p className="text-base sm:text-lg text-neutral-600 mb-6 leading-relaxed">
                  Search, filter, chat, and hire verified crew members and vendors. Manage projects with centralized calendars and track all bookings.
                </p>
                <ul className="space-y-3 text-base sm:text-lg text-neutral-600">
                  <li className="flex items-start gap-2">
                    <FaCircleCheck className="text-green-600 mt-1 shrink-0" />
                    <span>Search & filter by location, skill, availability</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <FaCircleCheck className="text-green-600 mt-1 shrink-0" />
                    <span>View budgets and rates</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <FaCircleCheck className="text-green-600 mt-1 shrink-0" />
                    <span>Lock and manage crew bookings</span>
                  </li>
                </ul>
              </div>

              <div className="bg-white rounded-xl p-8 sm:p-10 border border-neutral-200 hover:shadow-xl transition-all hover:-translate-y-1">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-gradient-to-br from-purple-100 to-purple-50 flex items-center justify-center mb-6 shadow-md">
                  <FaVideo className="text-purple-600 text-2xl sm:text-3xl" />
                </div>
                <h3 className="text-2xl sm:text-3xl font-bold leading-tight text-neutral-900 mb-4">
                  Individual Freelancers
                </h3>
                <p className="text-base sm:text-lg text-neutral-600 mb-6 leading-relaxed">
                  Directors, DOPs, ADs, Costume designers, and more. Showcase your work, manage availability, and get hired.
                </p>
                <ul className="space-y-3 text-base sm:text-lg text-neutral-600">
                  <li className="flex items-start gap-2">
                    <FaCircleCheck className="text-green-600 mt-1 shrink-0" />
                    <span>Upload showreels and past work</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <FaCircleCheck className="text-green-600 mt-1 shrink-0" />
                    <span>Manage availability calendar</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <FaCircleCheck className="text-green-600 mt-1 shrink-0" />
                    <span>Receive booking requests</span>
                  </li>
                </ul>
              </div>

              <div className="bg-white rounded-xl p-8 sm:p-10 border border-neutral-200 hover:shadow-xl transition-all hover:-translate-y-1">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-gradient-to-br from-orange-100 to-orange-50 flex items-center justify-center mb-6 shadow-md">
                  <FaTruck className="text-orange-600 text-2xl sm:text-3xl" />
                </div>
                <h3 className="text-2xl sm:text-3xl font-bold leading-tight text-neutral-900 mb-4">
                  Vendors
                </h3>
                <p className="text-base sm:text-lg text-neutral-600 mb-6 leading-relaxed">
                  Equipment, Lighting, Transport, and Catering providers. List your services and manage bookings.
                </p>
                <ul className="space-y-3 text-base sm:text-lg text-neutral-600">
                  <li className="flex items-start gap-2">
                    <FaCircleCheck className="text-green-600 mt-1 shrink-0" />
                    <span>List equipment and services</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <FaCircleCheck className="text-green-600 mt-1 shrink-0" />
                    <span>Set availability and rates</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <FaCircleCheck className="text-green-600 mt-1 shrink-0" />
                    <span>Manage booking requests</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 sm:py-20 md:py-24 lg:py-28 bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 text-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-8 text-center space-y-8">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight text-balance">
              Ready to Transform Your Production Hiring?
            </h2>
            <p className="text-lg sm:text-xl text-neutral-300 text-balance max-w-2xl mx-auto leading-relaxed">
              Join CrewCall today and experience the future of crew management
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Link
                to="/register"
                className="inline-flex justify-center items-center rounded-lg bg-white text-neutral-900 px-8 py-4 font-semibold hover:bg-neutral-100 transition-all text-base sm:text-lg w-full sm:w-auto min-h-[52px] shadow-lg hover:shadow-xl hover:scale-105"
              >
                Create Account
              </Link>
              <Link
                to="/dashboard"
                className="inline-flex justify-center items-center rounded-lg border-2 border-white text-white px-8 py-4 font-semibold hover:bg-white/10 transition-all text-base sm:text-lg w-full sm:w-auto min-h-[52px] hover:scale-105"
              >
                View Dashboard
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Minimal footer strip - NO LOGIN/REGISTER BUTTONS */}
      <footer className="shrink-0 border-t border-neutral-200 py-4 sm:py-6 px-4 bg-white">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-2 text-center min-w-0">
          <div className="flex items-center justify-center gap-2">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-neutral-800 flex items-center justify-center shrink-0">
              <FaVideo className="text-white text-sm" />
            </div>
            <span className="text-neutral-500 text-xs sm:text-sm">© 2025 CrewCall. All rights reserved.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
