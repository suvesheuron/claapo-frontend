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
  { icon: FaCalendar,      label: 'Manage Schedule',    to: '/dashboard/availability',     section: 'Overview' },
  { icon: FaFolder,        label: 'Project Requests',   to: '/dashboard/bookings',         section: 'Projects',       badgeKey: 'projectRequests' },
  { icon: FaClipboardList, label: 'Project Details',    to: '/dashboard/project-details',  section: 'Projects' },
  { icon: FaMessage,       label: 'Chat',               to: '/dashboard/conversations',    section: 'Communication', badgeKey: 'chat' },
  { icon: FaFileInvoice,   label: 'Invoices',           to: '/dashboard/invoices',         section: 'Communication' },
  { icon: FaChartLine,     label: 'Earnings',           to: '/dashboard/earnings',         section: 'Communication' },
  { icon: FaUser,          label: 'Profile',            to: '/dashboard/profile',          section: 'Account' },
];

export const vendorNavLinks: NavItem[] = [
  { icon: FaHouse,         label: 'Dashboard',          to: '/dashboard',                     section: 'Overview' },
  { icon: FaCalendar,      label: 'Manage Schedule',    to: '/dashboard/vendor-availability', section: 'Overview' },
  { icon: FaTruck,         label: 'Equipment',          to: '/dashboard/equipment',           section: 'Overview' },
  { icon: FaFolder,        label: 'Project Requests',   to: '/dashboard/bookings',            section: 'Projects',       badgeKey: 'projectRequests' },
  { icon: FaClipboardList, label: 'Project Details',    to: '/dashboard/project-details',     section: 'Projects' },
  { icon: FaMessage,       label: 'Chat',               to: '/dashboard/conversations',       section: 'Communication', badgeKey: 'chat' },
  { icon: FaFileInvoice,   label: 'Invoices',           to: '/dashboard/invoices',            section: 'Communication' },
  { icon: FaChartLine,     label: 'Earnings',           to: '/dashboard/earnings',            section: 'Communication' },
  { icon: FaUser,          label: 'Profile',            to: '/dashboard/vendor-profile',      section: 'Account' },
];

export const companyNavLinks: NavItem[] = [
  { icon: FaHouse,           label: 'Dashboard',        to: '/dashboard',                       section: 'Overview' },
  { icon: FaCalendar,        label: 'Manage Schedule',  to: '/dashboard/company-availability',  section: 'Overview' },
  { icon: FaMagnifyingGlass, label: 'Search',           to: '/dashboard/search',                section: 'Overview' },
  { icon: FaFolder,          label: 'Ongoing Projects', to: '/dashboard/projects',              section: 'Projects' },
  { icon: FaFolder,          label: 'Past Projects',    to: '/dashboard/company-past-projects', section: 'Projects' },
  { icon: FaBan,             label: 'Cancel Requests',  to: '/dashboard/cancel-requests',       section: 'Projects',       badgeKey: 'cancelRequests' },
  { icon: FaMessage,         label: 'Chat',             to: '/dashboard/conversations',         section: 'Communication', badgeKey: 'chat' },
  { icon: FaFileInvoice,     label: 'Invoices',         to: '/dashboard/invoices',              section: 'Communication' },
  { icon: FaChartLine,       label: 'Spending',         to: '/dashboard/spending',              section: 'Communication' },
  { icon: FaPeopleGroup,     label: 'Team',             to: '/dashboard/team',                  section: 'Account' },
  { icon: FaUser,            label: 'Profile',          to: '/dashboard/company-profile',       section: 'Account' },
];
