import IndividualAvailability from '../individual/Availability';
import { locationNavLinks } from '../../navigation/dashboardNav';

/**
 * Location provider "Manage Schedule" page. The availability calendar is
 * identical to the Crew/Cast one (set available/blocked days; booked/past_work
 * are system-managed), so we reuse that component and only swap the sidebar nav.
 */
export default function LocationAvailability() {
  return <IndividualAvailability navLinks={locationNavLinks} />;
}
