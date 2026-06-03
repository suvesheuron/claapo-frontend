import { useRole } from '../contexts/RoleContext';
import CompanyDashboard from './CompanyDashboard';
import IndividualDashboard from './IndividualDashboard';
import VendorDashboard from './VendorDashboard';
import CastDashboard from './CastDashboard';
import LocationDashboard from './LocationDashboard';
import OnboardingChecklist from '../components/OnboardingChecklist';

export default function Dashboard() {
  const { currentRole } = useRole();

  let content;
  switch (currentRole) {
    case 'Individual': content = <IndividualDashboard />; break;
    case 'Vendor':     content = <VendorDashboard />;    break;
    case 'Cast':       content = <CastDashboard />;       break;
    case 'Location':   content = <LocationDashboard />;   break;
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

