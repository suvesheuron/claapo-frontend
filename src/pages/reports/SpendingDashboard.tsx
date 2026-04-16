import { useEffect, useMemo, useState } from 'react';
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
  sent: 'bg-[#3678F1]',
  paid: 'bg-[#22C55E]',
  overdue: 'bg-[#F40F02]',
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
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const filteredInvoices = useMemo(() => {
    if (!dateFrom && !dateTo) return invoices;
    return invoices.filter((inv) => {
      const ts = new Date(inv.createdAt).setHours(0, 0, 0, 0);
      const from = dateFrom ? new Date(dateFrom + 'T00:00:00').getTime() : 0;
      const to = dateTo ? new Date(dateTo + 'T23:59:59').getTime() : Infinity;
      return ts >= from && ts <= to;
    });
  }, [invoices, dateFrom, dateTo]);

  const totalSpent = filteredInvoices
    .filter((i) => i.status === 'paid')
    .reduce((sum, i) => sum + i.totalAmount, 0);

  const pendingPayments = filteredInvoices.filter((i) => i.status === 'sent' || i.status === 'overdue');
  const pendingTotal = pendingPayments.reduce((sum, i) => sum + i.totalAmount, 0);

  const activeProjectTitles = new Set(
    filteredInvoices
      .filter((i) => i.status !== 'cancelled' && i.project?.title)
      .map((i) => i.project!.title),
  );

  // Estimate team size from unique invoice issuers (unique invoiceNumbers prefix as proxy)
  const uniqueInvoiceNumbers = new Set(filteredInvoices.map((i) => i.invoiceNumber));
  const teamSize = uniqueInvoiceNumbers.size;

  const stats: Array<{ label: string; value: string; icon: typeof FaIndianRupeeSign; accent: string; sub?: string }> = [
    { label: 'Total Spent',      value: formatPaise(totalSpent),                icon: FaIndianRupeeSign, accent: 'bg-[#E8F0FE] text-[#3678F1] ring-1 ring-[#3678F1]/15' },
    { label: 'Pending Payments', value: formatPaise(pendingTotal),              icon: FaClock,           accent: 'bg-[#E8F0FE] text-[#3678F1] ring-1 ring-[#3678F1]/15', sub: `${pendingPayments.length} invoices` },
    { label: 'Active Projects',  value: String(activeProjectTitles.size),       icon: FaFolderOpen,      accent: 'bg-[#E8F0FE] text-[#3678F1] ring-1 ring-[#3678F1]/15' },
    { label: 'Team Size',        value: String(teamSize),                       icon: FaPeopleGroup,     accent: 'bg-[#E8F0FE] text-[#3678F1] ring-1 ring-[#3678F1]/15' },
  ];

  const recentPayments = [...filteredInvoices]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 10);

  const projectWise = useMemo(() => {
    const map = new Map<string, { projectTitle: string; invoiceCount: number; paidTotal: number; pendingTotal: number; total: number }>();
    for (const inv of filteredInvoices) {
      const key = inv.project?.title?.trim() || 'No project';
      const cur = map.get(key) ?? { projectTitle: key, invoiceCount: 0, paidTotal: 0, pendingTotal: 0, total: 0 };
      cur.invoiceCount += 1;
      cur.total += inv.totalAmount;
      if (inv.status === 'paid') cur.paidTotal += inv.totalAmount;
      if (inv.status === 'sent' || inv.status === 'overdue') cur.pendingTotal += inv.totalAmount;
      map.set(key, cur);
    }
    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [filteredInvoices]);

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-[#F3F4F6] w-full">
      <DashboardHeader />
      <div className="flex-1 flex min-h-0 overflow-hidden">
        <DashboardSidebar links={navLinks} />

        <main className="flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden">
          <div className="flex-1 min-h-0 overflow-auto">
            <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-6">

              {/* Header */}
              <div className="relative rounded-2xl bg-white border border-neutral-200/70 px-6 sm:px-8 py-6 mb-6 overflow-hidden shadow-soft">
                <div className="absolute inset-y-0 right-0 w-1/2 bg-gradient-to-l from-[#E8F0FE]/60 to-transparent pointer-events-none" />
                <span aria-hidden className="absolute left-0 top-6 bottom-6 w-1 rounded-r-full bg-gradient-to-b from-[#3678F1] to-[#5B9DF9]" />
                <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pl-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#3678F1]">Reports</p>
                    <h1 className="text-[26px] sm:text-[28px] font-extrabold text-neutral-900 tracking-tight leading-tight mt-1 flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-[#E8F0FE] ring-1 ring-[#3678F1]/15 flex items-center justify-center">
                        <FaIndianRupeeSign className="text-[#3678F1] text-sm" />
                      </div>
                      Spending
                    </h1>
                    <p className="text-sm text-neutral-500 mt-1.5 ml-[46px]">Track company expenses and payments</p>
                  </div>
                  {filteredInvoices.length > 0 && (
                    <button
                      type="button"
                      onClick={() => downloadCSV(filteredInvoices)}
                      className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-br from-[#3678F1] to-[#2563EB] text-white rounded-xl text-sm font-bold hover:from-[#2563EB] hover:to-[#1D4ED8] shadow-brand transition-colors duration-200 shrink-0"
                    >
                      <FaDownload className="w-3.5 h-3.5" /> Export CSV
                    </button>
                  )}
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-center gap-3 rounded-2xl bg-[#FEEBEA] border border-[#F40F02]/30 p-4 mb-5">
                  <div className="w-9 h-9 rounded-xl bg-white/60 flex items-center justify-center shrink-0">
                    <FaTriangleExclamation className="text-[#F40F02]" />
                  </div>
                  <p className="text-sm text-[#991B1B]">{error}</p>
                </div>
              )}

              {/* Date filters */}
              {!loading && (
                <div className="mb-5 flex flex-wrap items-center gap-3 p-3.5 bg-white rounded-2xl border border-neutral-200/70 shadow-sm">
                  <FaClock className="text-[#3678F1] w-4 h-4" />
                  <label className="text-xs text-neutral-500 font-medium">From</label>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="rounded-xl border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:border-[#3678F1] focus:ring-2 focus:ring-[#3678F1]/20 transition-colors"
                  />
                  <label className="text-xs text-neutral-500 font-medium">To</label>
                  <input
                    type="date"
                    value={dateTo}
                    min={dateFrom || undefined}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="rounded-xl border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:border-[#3678F1] focus:ring-2 focus:ring-[#3678F1]/20 transition-colors"
                  />
                  {(dateFrom || dateTo) && (
                    <button
                      type="button"
                      onClick={() => {
                        setDateFrom('');
                        setDateTo('');
                      }}
                      className="text-xs text-[#3678F1] font-bold hover:text-[#2563EB] transition-colors ml-auto"
                    >
                      Clear dates
                    </button>
                  )}
                </div>
              )}

              {/* Loading */}
              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="rounded-2xl bg-white border border-neutral-200/70 p-5 h-[104px] overflow-hidden">
                      <div className="flex items-center gap-4 h-full">
                        <div className="skeleton w-12 h-12 rounded-xl shrink-0" />
                        <div className="flex-1 space-y-2.5">
                          <div className="skeleton h-2.5 w-24 rounded-full" />
                          <div className="skeleton h-7 w-20 rounded-md" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  {/* Stats Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    {stats.map((stat) => (
                      <div
                        key={stat.label}
                        className="rounded-2xl bg-white border border-neutral-200/70 shadow-sm p-5 flex items-center gap-4 hover:border-[#3678F1] transition-colors duration-200"
                      >
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${stat.accent}`}>
                          <stat.icon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10.5px] uppercase tracking-[0.15em] text-neutral-500 font-bold">{stat.label}</p>
                          <p className="text-[20px] font-extrabold text-neutral-900 tabular-nums leading-none mt-1.5 truncate">{stat.value}</p>
                          {stat.sub && <p className="text-[11px] text-neutral-400 mt-1">{stat.sub}</p>}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Project-wise Spending */}
                  <div className="rounded-2xl bg-white border border-neutral-200/70 shadow-sm overflow-hidden mb-5">
                    <div className="px-5 py-4 border-b border-neutral-100">
                      <h2 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
                        <span className="w-1 h-4 rounded-full bg-[#3678F1]" />
                        Project-wise Spending
                      </h2>
                    </div>
                    {projectWise.length === 0 ? (
                      <div className="p-8 text-sm text-neutral-500 text-center">No project data in selected range.</div>
                    ) : (
                      <div className="divide-y divide-neutral-100">
                        {projectWise.map((row) => (
                          <div key={row.projectTitle} className="px-5 py-3.5 flex items-center justify-between gap-4 hover:bg-[#F4F8FE] transition-colors">
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-neutral-900 truncate">{row.projectTitle}</p>
                              <p className="text-xs text-neutral-500 mt-0.5">{row.invoiceCount} invoice{row.invoiceCount !== 1 ? 's' : ''}</p>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="text-sm font-bold text-neutral-900 tabular-nums">{formatPaise(row.total)}</p>
                              <p className="text-[11px] text-neutral-500 mt-0.5">
                                Paid {formatPaise(row.paidTotal)} · Pending {formatPaise(row.pendingTotal)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Recent Payments */}
                  <div className="rounded-2xl bg-white border border-neutral-200/70 shadow-sm overflow-hidden">
                    <div className="px-5 py-4 border-b border-neutral-100">
                      <h2 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
                        <span className="w-1 h-4 rounded-full bg-[#3678F1]" />
                        Recent Payments
                      </h2>
                    </div>

                    {recentPayments.length === 0 ? (
                      <div className="p-12 text-center">
                        <div className="w-14 h-14 rounded-2xl bg-[#E8F0FE] ring-1 ring-[#3678F1]/15 flex items-center justify-center mx-auto mb-4">
                          <FaFileInvoice className="text-[#3678F1] text-xl" />
                        </div>
                        <p className="text-sm font-bold text-neutral-900 mb-1">No payments yet</p>
                        <p className="text-xs text-neutral-500">Payments will appear here once invoices are received.</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-neutral-100">
                        {recentPayments.map((inv) => (
                          <div key={inv.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-[#F4F8FE] transition-colors">
                            <div className="w-9 h-9 rounded-xl bg-[#E8F0FE] ring-1 ring-[#3678F1]/15 flex items-center justify-center shrink-0">
                              <FaFileInvoice className="text-[#3678F1] text-xs" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-neutral-900 truncate">{inv.invoiceNumber}</p>
                              <p className="text-xs text-neutral-500 truncate mt-0.5">{inv.project?.title ?? 'No project'}</p>
                            </div>
                            <div className="hidden sm:flex items-center gap-1.5 shrink-0">
                              <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[inv.status] ?? 'bg-neutral-300'}`} />
                              <span className="text-[11px] text-neutral-600 capitalize font-semibold">{inv.status}</span>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="text-sm font-bold text-neutral-900 tabular-nums">{formatPaise(inv.totalAmount)}</p>
                              <p className="text-[10px] text-neutral-400 tabular-nums mt-0.5">{formatDate(inv.createdAt)}</p>
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
