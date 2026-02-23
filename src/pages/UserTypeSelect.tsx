import { Link } from 'react-router-dom';
import { useEffect } from 'react';
import { FaBuilding, FaUser, FaTruck, FaCheck } from 'react-icons/fa6';
import AppLayout from '../components/AppLayout';

const accountTypes = [
  {
    icon: FaBuilding,
    title: 'Company',
    subtitle: 'Production houses & agencies',
    description: 'Hire verified crew members and rent equipment for your projects.',
    features: ['Search and hire verified crew', 'Find equipment vendors', 'Manage project calendars', 'Track bookings & invoices'],
    cta: 'Continue as Company',
    to: '/register/company',
    accent: '#3678F1',
  },
  {
    icon: FaUser,
    title: 'Individual',
    subtitle: 'Freelance professionals',
    description: 'Showcase your skills, manage availability, and get booked for productions.',
    features: ['Showcase your skills & experience', 'Manage availability calendar', 'Receive booking requests', 'Track project history'],
    cta: 'Continue as Individual',
    to: '/register/individual',
    accent: '#3678F1',
  },
  {
    icon: FaTruck,
    title: 'Vendor',
    subtitle: 'Equipment rental providers',
    description: 'List your equipment, manage rental availability, and accept bookings.',
    features: ['List equipment inventory', 'Manage rental availability', 'Accept booking requests', 'Track rental history'],
    cta: 'Continue as Vendor',
    to: '/register/vendor',
    accent: '#3678F1',
  },
];

export default function UserTypeSelect() {
  useEffect(() => {
    document.title = 'Choose Your Account Type – CrewCall';
  }, []);

  return (
    <AppLayout headerVariant="back" backTo="/" backLabel="Back">
      <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-8 sm:py-12 min-h-[calc(100vh-128px)]">
        <div className="w-full max-w-[1100px]">
          <div className="text-center mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 mb-2">
              Choose your account type
            </h1>
            <p className="text-sm text-neutral-500">
              Select the option that best describes you
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5 mb-6">
            {accountTypes.map((type) => (
              <div
                key={type.title}
                className="rounded-2xl bg-white border border-neutral-200 p-5 sm:p-6 hover:border-[#3678F1] hover:shadow-md hover:shadow-[#3678F1]/8 transition-all group flex flex-col"
              >
                <div className="w-11 h-11 rounded-xl bg-[#EEF4FF] flex items-center justify-center mb-4 shrink-0 group-hover:bg-[#3678F1] transition-colors">
                  <type.icon className="text-[#3678F1] group-hover:text-white text-lg transition-colors" />
                </div>

                <div className="mb-1">
                  <h3 className="text-base font-bold text-neutral-900">{type.title}</h3>
                  <p className="text-xs text-neutral-500 mt-0.5">{type.subtitle}</p>
                </div>

                <p className="text-sm text-neutral-600 mt-2 mb-4 leading-relaxed flex-1">
                  {type.description}
                </p>

                <ul className="space-y-2 mb-5">
                  {type.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <FaCheck className="text-[#22C55E] mt-0.5 shrink-0 text-xs" />
                      <span className="text-xs text-neutral-600">{f}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  to={type.to}
                  className="rounded-xl block w-full py-2.5 bg-[#3678F1] text-white text-sm font-semibold hover:bg-[#2563d4] text-center transition-colors"
                >
                  {type.cta}
                </Link>
              </div>
            ))}
          </div>

          <p className="text-center text-sm text-neutral-500">
            Already have an account?{' '}
            <Link to="/login" className="text-[#3678F1] font-semibold hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </AppLayout>
  );
}
