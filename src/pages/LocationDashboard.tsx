import IndividualDashboard from './IndividualDashboard';
import { locationNavLinks } from '../navigation/dashboardNav';

/**
 * Location provider dashboard. A location provider's journey (own availability
 * calendar, incoming project requests, invoicing, chat) is structurally the
 * same as the Crew/Individual and Vendor dashboards, so we reuse the
 * Individual dashboard component and swap the sidebar nav — exactly how the
 * Cast dashboard is built. Property listings live on their own /properties page.
 */
export default function LocationDashboard() {
  return <IndividualDashboard navLinks={locationNavLinks} pageTitle="Location Dashboard – Claapo" />;
}
