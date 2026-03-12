import { useRole } from '../contexts/RoleContext';
import CompanyDashboard from './CompanyDashboard';
import IndividualDashboard from './IndividualDashboard';
import VendorDashboard from './VendorDashboard';
import OnboardingChecklist from '../components/OnboardingChecklist';

export default function Dashboard() {
  const { currentRole } = useRole();

  let content;
  switch (currentRole) {
    case 'Individual': content = <IndividualDashboard />; break;
    case 'Vendor':     content = <VendorDashboard />;    break;
    case 'Company':
    default:           content = <CompanyDashboard />;   break;
  }

  return (
    <>
      {content}
      <OnboardingChecklist />
    </>
  );
}

