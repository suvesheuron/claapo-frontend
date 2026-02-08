import { Link, useLocation } from 'react-router-dom';
import AppLayout from '../components/AppLayout';

export default function RegisterPlaceholder() {
  const path = useLocation().pathname;
  const label = path.includes('vendor') ? 'Vendor' : path.includes('individual') ? 'Individual' : 'Account';

  return (
    <AppLayout headerVariant="back" backTo="/register" backLabel="Back to User Type">
      <div className="flex items-center justify-center px-4 py-20">
        <div className="text-center max-w-md">
          <h1 className="text-2xl sm:text-3xl text-neutral-900 mb-4 font-bold">{label} Registration</h1>
          <p className="text-neutral-600 mb-8">This registration flow is coming soon. Please check back later.</p>
          <Link to="/register" className="inline-block px-6 py-3 bg-neutral-900 text-white hover:bg-neutral-800">
            Back to Account Type
          </Link>
        </div>
      </div>
    </AppLayout>
  );
}
