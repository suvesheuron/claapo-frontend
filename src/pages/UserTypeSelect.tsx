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
      <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 md:px-8 lg:px-16 py-8 sm:py-12 md:py-20 min-w-0 max-w-full overflow-x-hidden">
        <div className="text-center mb-8 sm:mb-12 md:mb-16">
          <h1 className="text-xl sm:text-3xl md:text-4xl lg:text-5xl text-neutral-900 mb-2 sm:mb-3 md:mb-4 font-bold break-words px-2">Choose Your Account Type</h1>
          <p className="text-sm sm:text-base md:text-lg lg:text-xl text-neutral-600 break-words px-2">Select the option that best describes you to get started</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8 lg:gap-12 mb-8 sm:mb-10 md:mb-12 min-w-0">
          {accountTypes.map((type) => (
            <div
              key={type.title}
              className="rounded-lg bg-white border-2 border-neutral-200 p-4 sm:p-6 md:p-8 lg:p-12 hover:border-neutral-900 transition-all group flex flex-col min-w-0"
            >
              <div className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-lg bg-neutral-100 flex items-center justify-center mx-auto mb-4 sm:mb-6 md:mb-8 shrink-0">
                <type.icon className="text-neutral-900 text-2xl sm:text-3xl" />
              </div>
              <h3 className="text-lg sm:text-xl md:text-2xl text-neutral-900 text-center mb-2 sm:mb-3 md:mb-4 font-bold break-words">{type.title}</h3>
              <p className="text-xs sm:text-sm md:text-base text-neutral-600 text-center mb-3 sm:mb-4 md:mb-6 lg:mb-8 leading-relaxed flex-1 break-words">{type.description}</p>
              <ul className="space-y-2 sm:space-y-3 text-neutral-700 mb-6 sm:mb-8 md:mb-10 text-sm sm:text-base">
                {type.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 sm:gap-3 min-w-0">
                    <FaCheck className="text-neutral-900 mt-1 shrink-0" />
                    <span className="break-words">{f}</span>
                  </li>
                ))}
              </ul>
              <Link
                to={type.to}
                className="rounded-lg block w-full py-3 sm:py-3.5 md:py-4 bg-neutral-900 text-white text-sm sm:text-base md:text-lg hover:bg-neutral-700 text-center min-h-[44px] flex items-center justify-center"
              >
                {type.cta}
              </Link>
            </div>
          ))}
        </div>

        <div className="text-center px-2">
          <p className="text-sm sm:text-base text-neutral-600">
            Already have an account? <Link to="/login" className="text-neutral-900 hover:underline font-medium">Login here</Link>
          </p>
        </div>
      </div>
    </AppLayout>
  );
}
