import { useRole } from '../contexts/RoleContext';
import CompanyDashboard from './CompanyDashboard';
import IndividualDashboard from './IndividualDashboard';
import VendorDashboard from './VendorDashboard';

export default function Dashboard() {
  const { currentRole } = useRole();

  switch (currentRole) {
    case 'individual':
      return <IndividualDashboard />;
    case 'vendor':
      return <VendorDashboard />;
    case 'company':
    default:
      return <CompanyDashboard />;
  }
}

