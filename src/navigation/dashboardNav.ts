import {
  FaHouse,
  FaCalendar,
  FaMessage,
  FaFileInvoice,
  FaFolder,
  FaUser,
  FaTruck,
  FaMagnifyingGlass,
  FaPeopleGroup,
  FaClipboardList,
  FaBan,
  FaChartLine,
} from 'react-icons/fa6';
import type { NavItem } from '../components/DashboardSidebar';

export const individualNavLinks: NavItem[] = [
  { icon: FaHouse,         label: 'Dashboard',          to: '/dashboard',                  section: 'Overview' },
  { icon: FaCalendar,      label: 'Manage Schedule',    to: '/availability',     section: 'Overview' },
  { icon: FaFolder,        label: 'Project Requests',   to: '/bookings',         section: 'Projects',       badgeKey: 'projectRequests' },
  { icon: FaClipboardList, label: 'Project Details',    to: '/project-details',  section: 'Projects' },
  { icon: FaMessage,       label: 'Chat',               to: '/conversations',    section: 'Communication', badgeKey: 'chat' },
  { icon: FaFileInvoice,   label: 'Invoices',           to: '/invoices',         section: 'Communication' },
  { icon: FaChartLine,     label: 'Earnings',           to: '/earnings',         section: 'Communication' },
  { icon: FaUser,          label: 'Profile',            to: '/profile',          section: 'Account' },
];

export const vendorNavLinks: NavItem[] = [
  { icon: FaHouse,         label: 'Dashboard',          to: '/dashboard',                     section: 'Overview' },
  { icon: FaCalendar,      label: 'Manage Schedule',    to: '/vendor-availability', section: 'Overview' },
  { icon: FaTruck,         label: 'Equipment',          to: '/equipment',           section: 'Overview' },
  { icon: FaFolder,        label: 'Project Requests',   to: '/bookings',            section: 'Projects',       badgeKey: 'projectRequests' },
  { icon: FaClipboardList, label: 'Project Details',    to: '/project-details',     section: 'Projects' },
  { icon: FaMessage,       label: 'Chat',               to: '/conversations',       section: 'Communication', badgeKey: 'chat' },
  { icon: FaFileInvoice,   label: 'Invoices',           to: '/invoices',            section: 'Communication' },
  { icon: FaChartLine,     label: 'Earnings',           to: '/earnings',            section: 'Communication' },
  { icon: FaPeopleGroup,   label: 'Team',               to: '/team',                section: 'Account' },
  { icon: FaUser,          label: 'Profile',            to: '/vendor-profile',      section: 'Account' },
];

export const companyNavLinks: NavItem[] = [
  { icon: FaHouse,           label: 'Dashboard',        to: '/dashboard',                       section: 'Overview' },
  { icon: FaCalendar,        label: 'Manage Schedule',  to: '/company-availability',  section: 'Overview' },
  { icon: FaMagnifyingGlass, label: 'Search',           to: '/search',                section: 'Overview' },
  { icon: FaFolder,          label: 'Ongoing Projects', to: '/projects',              section: 'Projects' },
  { icon: FaFolder,          label: 'Past Projects',    to: '/company-past-projects', section: 'Projects' },
  { icon: FaBan,             label: 'Cancel Requests',  to: '/cancel-requests',       section: 'Projects',       badgeKey: 'cancelRequests' },
  { icon: FaMessage,         label: 'Chat',             to: '/conversations',         section: 'Communication', badgeKey: 'chat' },
  { icon: FaFileInvoice,     label: 'Invoices',         to: '/invoices',              section: 'Communication' },
  { icon: FaChartLine,       label: 'Spending',         to: '/spending',              section: 'Communication' },
  { icon: FaPeopleGroup,     label: 'Team',             to: '/team',                  section: 'Account' },
  { icon: FaUser,            label: 'Profile',          to: '/company-profile',       section: 'Account' },
];
