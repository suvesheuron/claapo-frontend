import IndividualDashboard from './IndividualDashboard';
import { castNavLinks } from '../navigation/dashboardNav';

/**
 * Cast dashboard. The cast user journey (own availability calendar, incoming
 * project requests, past projects, invoicing, chat) is structurally identical
 * to the Crew/Individual dashboard, so we reuse that component and only swap
 * the sidebar nav. The calendar UI is shared between both roles.
 */
export default function CastDashboard() {
  return <IndividualDashboard navLinks={castNavLinks} pageTitle="Cast Dashboard – Claapo" />;
}
