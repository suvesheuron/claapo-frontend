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
} from 'react-icons/fa6';
import type { NavItem } from '../components/DashboardSidebar';

export const individualNavLinks: NavItem[] = [
  { icon: FaHouse,         label: 'Dashboard',        to: '/dashboard' },
  { icon: FaCalendar,      label: 'Manage Schedule',  to: '/dashboard/availability' },
  { icon: FaFolder,        label: 'Bookings',         to: '/dashboard/bookings' },
  { icon: FaClipboardList, label: 'Ongoing Projects', to: '/dashboard/ongoing-projects' },
  { icon: FaMessage,       label: 'Chat',             to: '/dashboard/conversations' },
  { icon: FaFileInvoice,   label: 'Invoices',         to: '/dashboard/invoices' },
  { icon: FaFolder,        label: 'Past Projects',    to: '/dashboard/past-projects' },
  { icon: FaUser,          label: 'Profile',          to: '/dashboard/profile' },
];

export const vendorNavLinks: NavItem[] = [
  { icon: FaHouse,         label: 'Dashboard',        to: '/dashboard' },
  { icon: FaCalendar,      label: 'Manage Schedule',  to: '/dashboard/vendor-availability' },
  { icon: FaTruck,         label: 'Equipment',        to: '/dashboard/equipment' },
  { icon: FaFolder,        label: 'Bookings',         to: '/dashboard/bookings' },
  { icon: FaClipboardList, label: 'Ongoing Projects', to: '/dashboard/ongoing-projects' },
  { icon: FaMessage,       label: 'Chat',             to: '/dashboard/conversations' },
  { icon: FaFileInvoice,   label: 'Invoices',         to: '/dashboard/invoices' },
  { icon: FaUser,          label: 'Profile',          to: '/dashboard/vendor-profile' },
];

export const companyNavLinks: NavItem[] = [
  { icon: FaHouse,           label: 'Dashboard',           to: '/dashboard' },
  { icon: FaCalendar,        label: 'Manage Schedule',     to: '/dashboard/company-availability' },
  { icon: FaFolder,          label: 'Ongoing Projects',    to: '/dashboard/projects' },
  { icon: FaFolder,          label: 'Past Projects',       to: '/dashboard/company-past-projects' },
  { icon: FaBan,             label: 'Cancel Requests',     to: '/dashboard/cancel-requests' },
  { icon: FaMagnifyingGlass, label: 'Search',              to: '/dashboard/search' },
  { icon: FaFileInvoice,     label: 'Invoices',            to: '/dashboard/invoices' },
  { icon: FaMessage,         label: 'Chat',                to: '/dashboard/conversations' },
  { icon: FaPeopleGroup,     label: 'Team',                to: '/dashboard/team' },
  { icon: FaUser,            label: 'Profile',             to: '/dashboard/company-profile' },
];
