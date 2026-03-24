import { useEffect } from 'react';
import {
  FaIndianRupeeSign,
  FaFileInvoice,
  FaClock,
  FaFolderOpen,
  FaPeopleGroup,
  FaDownload,
  FaTriangleExclamation,
} from 'react-icons/fa6';
import DashboardHeader from '../../components/DashboardHeader';
import DashboardSidebar from '../../components/DashboardSidebar';
import AppFooter from '../../components/AppFooter';
import { useApiQuery } from '../../hooks/useApiQuery';
import { useRole } from '../../contexts/RoleContext';
import { formatPaise } from '../../utils/currency';
import { companyNavLinks } from '../../navigation/dashboardNav';

interface Invoice {
  id: string;
  invoiceNumber: string;
  amount: number;
  totalAmount: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  createdAt: string;
  project: { title: string } | null;
}

interface InvoicesResponse {
  items: Invoice[];
}

const STATUS_DOT: Record<string, string> = {
  draft: 'bg-neutral-400',
  sent: 'bg-blue-500',
  paid: 'bg-emerald-500',
  overdue: 'bg-red-500',
  cancelled: 'bg-neutral-300',
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function downloadCSV(invoices: Invoice[]) {
  const header = 'Invoice Number,Project,Amount,Status,Date';
  const rows = invoices.map((inv) =>
    [
      inv.invoiceNumber,
      `"${(inv.project?.title ?? '').replace(/"/g, '""')}"`,
      (inv.totalAmount / 100).toLocaleString('en-IN', { style: 'currency', currency: 'INR' }),
      inv.status,
      formatDate(inv.createdAt),
    ].join(','),
  );
  const csv = [header, ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `spending_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function SpendingDashboard() {
  const { currentRole: _currentRole } = useRole();
  const navLinks = companyNavLinks;

  useEffect(() => { document.title = 'Spending – Claapo'; }, []);

  const { data, loading, error } = useApiQuery<InvoicesResponse>('/invoices?limit=100');
  const invoices = data?.items ?? [];

  const totalSpent = invoices
    .filter((i) => i.status === 'paid')
    .reduce((sum, i) => sum + i.totalAmount, 0);

  const pendingPayments = invoices.filter((i) => i.status === 'sent' || i.status === 'overdue');
  const pendingTotal = pendingPayments.reduce((sum, i) => sum + i.totalAmount, 0);

  const activeProjectTitles = new Set(
    invoices
      .filter((i) => i.status !== 'cancelled' && i.project?.title)
      .map((i) => i.project!.title),
  );

  // Estimate team size from unique invoice issuers (unique invoiceNumbers prefix as proxy)
  const uniqueInvoiceNumbers = new Set(invoices.map((i) => i.invoiceNumber));
  const teamSize = uniqueInvoiceNumbers.size;

  const stats = [
    { label: 'Total Spent', value: formatPaise(totalSpent), icon: FaIndianRupeeSign, accent: 'bg-emerald-50 text-emerald-600' },
    { label: 'Pending Payments', value: formatPaise(pendingTotal), icon: FaClock, accent: 'bg-amber-50 text-amber-600', sub: `${pendingPayments.length} invoices` },
    { label: 'Active Projects', value: String(activeProjectTitles.size), icon: FaFolderOpen, accent: 'bg-blue-50 text-blue-600' },
    { label: 'Team Size', value: String(teamSize), icon: FaPeopleGroup, accent: 'bg-[#EEF2FF] text-[#3B5BDB]' },
  ];

  const recentPayments = [...invoices]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 10);

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-[#F8F9FB] w-full">
      <DashboardHeader />
      <div className="flex-1 flex min-h-0 overflow-hidden">
        <DashboardSidebar links={navLinks} />

        <main className="flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden">
          <div className="flex-1 min-h-0 overflow-auto">
            <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-6">

              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-neutral-900 flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-[#EEF2FF] flex items-center justify-center">
                      <FaIndianRupeeSign className="text-[#3B5BDB] text-sm" />
                    </div>
                    Spending
                  </h1>
                  <p className="text-sm text-neutral-500 mt-1.5 ml-[46px]">Track company expenses and payments</p>
                </div>
                {invoices.length > 0 && (
                  <button
                    type="button"
                    onClick={() => downloadCSV(invoices)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-[#3B5BDB] text-white rounded-xl text-sm font-semibold hover:bg-[#2f4ac2] shadow-sm transition-all"
                  >
                    <FaDownload className="w-3.5 h-3.5" /> Export CSV
                  </button>
                )}
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-center gap-3 rounded-2xl bg-red-50 border border-red-100 p-4 mb-5 shadow-sm">
                  <div className="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
                    <FaTriangleExclamation className="text-red-500" />
                  </div>
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              {/* Loading */}
              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="rounded-2xl bg-white border border-neutral-200 p-5 animate-pulse">
                      <div className="h-4 bg-neutral-100 rounded w-1/2 mb-3" />
                      <div className="h-6 bg-neutral-200 rounded w-2/3" />
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  {/* Stats Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    {stats.map((stat) => (
                      <div key={stat.label} className="rounded-2xl bg-white border border-neutral-200 p-5 hover:shadow-sm transition-shadow">
                        <div className="flex items-center gap-3 mb-3">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${stat.accent}`}>
                            <stat.icon className="w-4 h-4" />
                          </div>
                          <span className="text-xs font-medium text-neutral-500">{stat.label}</span>
                        </div>
                        <p className="text-xl font-bold text-neutral-900">{stat.value}</p>
                        {stat.sub && <p className="text-[11px] text-neutral-400 mt-1">{stat.sub}</p>}
                      </div>
                    ))}
                  </div>

                  {/* Recent Payments */}
                  <div className="rounded-2xl bg-white border border-neutral-200 overflow-hidden">
                    <div className="px-5 py-4 border-b border-neutral-100">
                      <h2 className="text-sm font-bold text-neutral-900">Recent Payments</h2>
                    </div>

                    {recentPayments.length === 0 ? (
                      <div className="p-12 text-center">
                        <div className="w-14 h-14 rounded-2xl bg-[#EEF2FF] flex items-center justify-center mx-auto mb-4">
                          <FaFileInvoice className="text-[#3B5BDB] text-2xl" />
                        </div>
                        <p className="text-sm font-semibold text-neutral-700 mb-1">No payments yet</p>
                        <p className="text-xs text-neutral-400">Payments will appear here once invoices are received.</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-neutral-100">
                        {recentPayments.map((inv) => (
                          <div key={inv.id} className="flex items-center gap-4 px-5 py-4 hover:bg-neutral-50 transition-colors">
                            <div className="w-9 h-9 rounded-xl bg-[#EEF2FF] flex items-center justify-center shrink-0">
                              <FaFileInvoice className="text-[#3B5BDB] text-xs" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-neutral-900 truncate">{inv.invoiceNumber}</p>
                              <p className="text-xs text-neutral-500 truncate">{inv.project?.title ?? 'No project'}</p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className={`w-2 h-2 rounded-full ${STATUS_DOT[inv.status] ?? 'bg-neutral-300'}`} />
                              <span className="text-[11px] text-neutral-500 capitalize">{inv.status}</span>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="text-sm font-bold text-neutral-900 tabular-nums">{formatPaise(inv.totalAmount)}</p>
                              <p className="text-[10px] text-neutral-400 tabular-nums">{formatDate(inv.createdAt)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
          <AppFooter />
        </main>
      </div>
    </div>
  );
}
