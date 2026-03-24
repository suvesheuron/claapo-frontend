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
      gradient: 'from-[#3B5BDB] to-[#5B9DF9]',
      shadow: 'shadow-[#3B5BDB]/20',
      bg: 'from-white to-[#EEF2FF]/50',
    },
    {
      label: 'Active Projects',
      value: data?.projectsTotal ?? 0,
      icon: FaFolder,
      gradient: 'from-[#7C3AED] to-[#A78BFA]',
      shadow: 'shadow-purple-500/20',
      bg: 'from-white to-[#F5F3FF]/50',
    },
    {
      label: 'Total Bookings',
      value: data?.bookingsTotal ?? 0,
      icon: FaCalendarCheck,
      gradient: 'from-[#059669] to-[#34D399]',
      shadow: 'shadow-emerald-500/20',
      bg: 'from-white to-[#F0FDF4]/50',
    },
    {
      label: 'Revenue',
      value: data ? formatCurrency(data.revenuePaise) : '₹0',
      icon: FaIndianRupeeSign,
      gradient: 'from-[#EA580C] to-[#FB923C]',
      shadow: 'shadow-orange-500/20',
      bg: 'from-white to-[#FFF7ED]/50',
      isCurrency: true,
    },
  ];

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-[#F8F9FB] w-full">
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
              <div className="mb-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {/* Stat cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {cards.map((card) => (
                <div
                  key={card.label}
                  className={`rounded-2xl bg-gradient-to-br ${card.bg} border border-neutral-200/60 shadow-sm p-5 flex flex-col gap-4 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5`}
                >
                  <div className="flex items-center justify-between">
                    <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${card.gradient} flex items-center justify-center shrink-0 shadow-sm ${card.shadow}`}>
                      <card.icon className="text-white text-sm" />
                    </div>
                    <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center">
                      <FaArrowTrendUp className="text-green-500 text-xs" />
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-neutral-500 font-medium">{card.label}</p>
                    {loading ? (
                      <div className="h-8 w-20 rounded-lg bg-neutral-100 animate-pulse mt-1" />
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
                { label: 'Manage Users', desc: 'View and moderate user accounts', icon: FaUsers, to: '/admin/users', gradient: 'from-[#3B5BDB] to-[#5B9DF9]' },
                { label: 'View Projects', desc: 'Browse all platform projects', icon: FaFolder, to: '/admin/projects', gradient: 'from-[#7C3AED] to-[#A78BFA]' },
                { label: 'Invoices', desc: 'Financial overview and tracking', icon: FaFileInvoice, to: '/admin/invoices', gradient: 'from-[#EA580C] to-[#FB923C]' },
              ].map((item) => (
                <a
                  key={item.label}
                  href={item.to}
                  className="rounded-2xl bg-white border border-neutral-200/60 shadow-sm p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group"
                >
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${item.gradient} flex items-center justify-center mb-3 shadow-sm`}>
                    <item.icon className="text-white text-sm" />
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
