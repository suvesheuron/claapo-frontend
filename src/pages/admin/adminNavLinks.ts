import { FaChartBar, FaUsers, FaFolder, FaFileInvoice } from 'react-icons/fa6';
import type { NavItem } from '../../components/DashboardSidebar';

export const adminNavLinks: NavItem[] = [
  { icon: FaChartBar, label: 'Dashboard', to: '/admin', section: 'Admin' },
  { icon: FaUsers, label: 'Users', to: '/admin/users', section: 'Admin' },
  { icon: FaFolder, label: 'Projects', to: '/admin/projects', section: 'Admin' },
  { icon: FaFileInvoice, label: 'Invoices', to: '/admin/invoices', section: 'Admin' },
];
