import { Link, useLocation } from 'react-router-dom';
import AppLayout from '../components/AppLayout';

export default function RegisterPlaceholder() {
  const path = useLocation().pathname;
  const label = path.includes('vendor') ? 'Vendor' : path.includes('individual') ? 'Individual' : 'Account';

  return (
    <AppLayout headerVariant="back" backTo="/register" backLabel="Back to User Type">
      <div className="flex items-center justify-center px-4 sm:px-6 md:px-8 py-10 sm:py-14 lg:py-20 min-h-[50vh] min-w-0 w-full max-w-full overflow-x-hidden">
        <div className="text-center max-w-md w-full min-w-0 max-w-[calc(100vw-2rem)]">
          <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl text-neutral-900 mb-2 sm:mb-3 md:mb-4 font-bold break-words">{label} Registration</h1>
          <p className="text-xs sm:text-sm md:text-base text-neutral-600 mb-5 sm:mb-6 md:mb-8 break-words">This registration flow is coming soon. Please check back later.</p>
          <Link to="/register" className="rounded-lg inline-flex items-center justify-center px-4 sm:px-5 md:px-6 py-2.5 sm:py-3 min-h-[44px] bg-neutral-900 text-white hover:bg-neutral-700 text-sm sm:text-base w-full sm:w-auto">
            Back to Account Type
          </Link>
        </div>
      </div>
    </AppLayout>
  );

  
}
