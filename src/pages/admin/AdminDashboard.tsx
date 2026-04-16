import { useEffect } from 'react';
import { FaUsers, FaFolder, FaFileInvoice, FaCalendarCheck, FaIndianRupeeSign, FaArrowTrendUp } from 'react-icons/fa6';
import DashboardHeader from '../../components/DashboardHeader';
import DashboardSidebar from '../../components/DashboardSidebar';
import { useApiQuery } from '../../hooks/useApiQuery';
import { adminNavLinks } from './adminNavLinks';

interface DashboardStats {
  usersTotal: number;
  projectsTotal: number;
  bookingsTotal: number;
  invoicesTotal: number;
  revenuePaise: number;
}

const formatCurrency = (paise: number) =>
  (paise / 100).toLocaleString('en-IN', { style: 'currency', currency: 'INR' });

export default function AdminDashboard() {
  useEffect(() => { document.title = 'Admin Dashboard – Claapo'; }, []);

  const { data, loading, error } = useApiQuery<DashboardStats>('/admin/analytics/dashboard');

  const cards = [
    {
      label: 'Total Users',
      value: data?.usersTotal ?? 0,
      icon: FaUsers,
    },
    {
      label: 'Active Projects',
      value: data?.projectsTotal ?? 0,
      icon: FaFolder,
    },
    {
      label: 'Total Bookings',
      value: data?.bookingsTotal ?? 0,
      icon: FaCalendarCheck,
    },
    {
      label: 'Revenue',
      value: data ? formatCurrency(data.revenuePaise) : '₹0',
      icon: FaIndianRupeeSign,
      isCurrency: true,
    },
  ];

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-[#F3F4F6] w-full">
      <DashboardHeader />
      <div className="flex-1 flex min-h-0 overflow-hidden">
        <DashboardSidebar links={adminNavLinks} />
        <main className="flex-1 overflow-auto p-6">
          <div className="max-w-[1200px] mx-auto">
            {/* Page heading */}
            <div className="mb-6">
              <h1 className="text-xl font-bold text-neutral-900 tracking-tight">Admin Dashboard</h1>
              <p className="text-sm text-neutral-500 mt-0.5">Platform overview and key metrics</p>
            </div>

            {error && (
              <div className="mb-4 rounded-xl bg-[#FEEBEA] border border-[#F40F02]/30 px-4 py-3 text-sm text-[#991B1B]">
                {error}
              </div>
            )}

            {/* Stat cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {cards.map((card) => (
                <div
                  key={card.label}
                  className="rounded-2xl bg-white border border-neutral-200/60 shadow-sm p-5 flex flex-col gap-4 hover:border-[#3678F1] transition-colors duration-200"
                >
                  <div className="flex items-center justify-between">
                    <div className="w-11 h-11 rounded-xl bg-[#E8F0FE] ring-1 ring-[#3678F1]/15 flex items-center justify-center shrink-0">
                      <card.icon className="text-[#3678F1] text-sm" />
                    </div>
                    <div className="w-8 h-8 rounded-lg bg-[#DCFCE7] flex items-center justify-center">
                      <FaArrowTrendUp className="text-[#22C55E] text-xs" />
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-neutral-500 font-medium">{card.label}</p>
                    {loading ? (
                      <div className="skeleton h-8 w-20 rounded-lg mt-1" />
                    ) : (
                      <p className="text-2xl font-bold mt-0.5 text-neutral-900 tabular-nums">
                        {card.isCurrency ? card.value : Number(card.value).toLocaleString('en-IN')}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Quick links */}
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { label: 'Manage Users', desc: 'View and moderate user accounts', icon: FaUsers, to: '/admin/users' },
                { label: 'View Projects', desc: 'Browse all platform projects', icon: FaFolder, to: '/admin/projects' },
                { label: 'Invoices', desc: 'Financial overview and tracking', icon: FaFileInvoice, to: '/admin/invoices' },
              ].map((item) => (
                <a
                  key={item.label}
                  href={item.to}
                  className="rounded-2xl bg-white border border-neutral-200/60 shadow-sm p-5 hover:border-[#3678F1] transition-colors duration-200"
                >
                  <div className="w-10 h-10 rounded-xl bg-[#E8F0FE] ring-1 ring-[#3678F1]/15 flex items-center justify-center mb-3">
                    <item.icon className="text-[#3678F1] text-sm" />
                  </div>
                  <p className="text-sm font-bold text-neutral-900">{item.label}</p>
                  <p className="text-xs text-neutral-500 mt-0.5">{item.desc}</p>
                </a>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
