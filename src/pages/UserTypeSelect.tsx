import { Link } from 'react-router-dom';
import { useEffect } from 'react';
import { FaBuilding, FaUser, FaTruck, FaCheck } from 'react-icons/fa6';
import AppLayout from '../components/AppLayout';

const accountTypes = [
  {
    icon: FaBuilding,
    title: 'Company',
    description: 'For production companies, ad agencies, and line producers who need to hire crew members and rent equipment for their projects.',
    features: ['Search and hire verified crew', 'Find equipment vendors', 'Manage project calendars', 'Track bookings and invoices'],
    cta: 'Continue as Company',
    to: '/register/company',
  },
  {
    icon: FaUser,
    title: 'Individual',
    description: 'For freelance crew members including directors, cinematographers, editors, sound engineers, and other production professionals.',
    features: ['Showcase your skills and experience', 'Manage availability calendar', 'Receive booking requests', 'Track project history'],
    cta: 'Continue as Individual',
    to: '/register/individual',
  },
  {
    icon: FaTruck,
    title: 'Vendor',
    description: 'For equipment rental companies and service providers offering cameras, lighting, sound gear, vehicles, and other production services.',
    features: ['List equipment inventory', 'Manage rental availability', 'Accept booking requests', 'Track rental history'],
    cta: 'Continue as Vendor',
    to: '/register/vendor',
  },
];

export default function UserTypeSelect() {
  useEffect(() => {
    document.title = 'Choose Your Account Type – CrewCall';
  }, []);

  return (
    <AppLayout headerVariant="back" backTo="/" backLabel="Back">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-8 lg:px-16 py-12 sm:py-20">
        <div className="text-center mb-12 sm:mb-16">
          <h1 className="text-4xl sm:text-5xl text-neutral-900 mb-4 font-bold">Choose Your Account Type</h1>
          <p className="text-lg sm:text-xl text-neutral-600">Select the option that best describes you to get started</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 sm:gap-12 mb-12">
          {accountTypes.map((type) => (
            <div
              key={type.title}
              className="rounded-lg bg-white border-2 border-neutral-200 p-8 sm:p-12 hover:border-neutral-900 transition-all group"
            >
              <div className="w-20 h-20 rounded-lg bg-neutral-100 flex items-center justify-center mx-auto mb-6 sm:mb-8">
                <type.icon className="text-neutral-900 text-3xl" />
              </div>
              <h3 className="text-2xl text-neutral-900 text-center mb-4 font-bold">{type.title}</h3>
              <p className="text-neutral-600 text-center mb-6 sm:mb-8 leading-relaxed">{type.description}</p>
              <ul className="space-y-3 text-neutral-700 mb-8 sm:mb-10">
                {type.features.map((f) => (
                  <li key={f} className="flex items-start gap-3">
                    <FaCheck className="text-neutral-900 mt-1 shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Link
                to={type.to}
                className="rounded-lg block w-full py-4 bg-neutral-900 text-white text-lg hover:bg-neutral-700 text-center"
              >
                {type.cta}
              </Link>
            </div>
          ))}
        </div>

        <div className="text-center">
          <p className="text-neutral-600">
            Already have an account? <Link to="/login" className="text-neutral-900 hover:underline font-medium">Login here</Link>
          </p>
        </div>
      </div>
    </AppLayout>
  );
}
