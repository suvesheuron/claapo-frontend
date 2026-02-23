import { useRole } from '../contexts/RoleContext';
import CompanyDashboard from './CompanyDashboard';
import IndividualDashboard from './IndividualDashboard';
import VendorDashboard from './VendorDashboard';

export default function Dashboard() {
  const { currentRole } = useRole();

  switch (currentRole) {
    case 'Individual':
      return <IndividualDashboard />;
    case 'Vendor':
      return <VendorDashboard />;
    case 'Company':
    default:
      return <CompanyDashboard />;
  }
}

