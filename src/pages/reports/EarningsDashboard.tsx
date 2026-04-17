import { useEffect, useState, useMemo } from 'react';
import {
  FaIndianRupeeSign,
  FaFileInvoice,
  FaCircleCheck,
  FaClock,
  FaDownload,
  FaTriangleExclamation,
  FaChevronLeft,
  FaChevronRight,
  FaCalendar,
} from 'react-icons/fa6';
import DashboardHeader from '../../components/DashboardHeader';
import DashboardSidebar from '../../components/DashboardSidebar';
import AppFooter from '../../components/AppFooter';
import { useApiQuery } from '../../hooks/useApiQuery';
import { useRole } from '../../contexts/RoleContext';
import { formatPaise } from '../../utils/currency';
import { individualNavLinks, vendorNavLinks } from '../../navigation/dashboardNav';

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

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

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
  a.download = `earnings_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function EarningsDashboard() {
  const { currentRole } = useRole();
  const navLinks = currentRole === 'Vendor' ? vendorNavLinks : individualNavLinks;

  useEffect(() => { document.title = 'Earnings – Claapo'; }, []);

  const [filterMonth, setFilterMonth] = useState(new Date().getMonth());
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const { data, loading, error } = useApiQuery<InvoicesResponse>('/invoices?limit=100');
  const invoices = data?.items ?? [];

  const isCustomRange = !!(dateFrom || dateTo);

  // Filter invoices: custom date range overrides month/year picker when active
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      const invDate = new Date(inv.createdAt);
      if (isCustomRange) {
        const ts = invDate.setHours(0, 0, 0, 0);
        const from = dateFrom ? new Date(dateFrom + 'T00:00:00').getTime() : -Infinity;
        const to = dateTo ? new Date(dateTo + 'T23:59:59').getTime() : Infinity;
        return ts >= from && ts <= to;
      }
      return invDate.getMonth() === filterMonth && invDate.getFullYear() === filterYear;
    });
  }, [invoices, filterMonth, filterYear, dateFrom, dateTo, isCustomRange]);

  const totalEarnings = filteredInvoices
    .filter((i) => i.status === 'paid')
    .reduce((sum, i) => sum + i.totalAmount, 0);

  const pendingInvoices = filteredInvoices.filter((i) => i.status === 'sent' || i.status === 'overdue');
  const pendingTotal = pendingInvoices.reduce((sum, i) => sum + i.totalAmount, 0);

  const paidInvoices = filteredInvoices.filter((i) => i.status === 'paid');
  const paidCount = paidInvoices.length;

  const stats = [
    { label: 'Total Earnings', value: formatPaise(totalEarnings), icon: FaIndianRupeeSign, accent: 'bg-[#DCFCE7] text-[#15803D] ring-1 ring-[#22C55E]/20' },
    { label: 'Pending Invoices', value: formatPaise(pendingTotal), icon: FaClock, accent: 'bg-[#FEF3C7] text-[#946A00] ring-1 ring-[#F4C430]/30', sub: `${pendingInvoices.length} invoices` },
    { label: 'Paid Invoices', value: String(paidCount), icon: FaCircleCheck, accent: 'bg-[#E8F0FE] text-[#3678F1] ring-1 ring-[#3678F1]/15' },
  ];

  const goPrevMonth = () => {
    if (filterMonth === 0) {
      setFilterMonth(11);
      setFilterYear((y) => y - 1);
    } else {
      setFilterMonth((m) => m - 1);
    }
  };

  const goNextMonth = () => {
    if (filterMonth === 11) {
      setFilterMonth(0);
      setFilterYear((y) => y + 1);
    } else {
      setFilterMonth((m) => m + 1);
    }
  };

  const goToday = () => {
    const now = new Date();
    setFilterMonth(now.getMonth());
    setFilterYear(now.getFullYear());
  };

  const isCurrentMonth = (() => {
    const now = new Date();
    return now.getMonth() === filterMonth && now.getFullYear() === filterYear;
  })();

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-[#F3F4F6] w-full">
      <DashboardHeader />
      <div className="flex-1 flex min-h-0 overflow-hidden">
        <DashboardSidebar links={navLinks} />

        <main className="flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden">
          <div className="flex-1 min-h-0 overflow-auto">
            <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-6">

              {/* Header */}
              <div className="relative rounded-2xl bg-white border border-neutral-200/70 px-6 sm:px-8 py-6 overflow-hidden shadow-soft mb-6">
                <div className="absolute inset-y-0 right-0 w-1/2 bg-gradient-to-l from-[#E8F0FE]/60 to-transparent pointer-events-none" />
                <span aria-hidden className="absolute left-0 top-6 bottom-6 w-1 rounded-r-full bg-gradient-to-b from-[#3678F1] to-[#5B9DF9]" />
                <div className="relative flex items-center justify-between gap-4 flex-wrap z-10 pl-3">
                  <div className="min-w-0">
                    <h1 className="text-[22px] sm:text-[24px] font-extrabold tracking-tight text-neutral-900 flex items-center gap-2.5 leading-tight">
                      <div className="w-10 h-10 rounded-xl bg-[#E8F0FE] ring-1 ring-[#3678F1]/15 flex items-center justify-center">
                        <FaIndianRupeeSign className="text-[#3678F1] text-base" />
                      </div>
                      Earnings
                    </h1>
                    <p className="text-sm text-neutral-500 mt-1.5 ml-[52px]">Track your income and invoice history</p>
                  </div>
                  {invoices.length > 0 && (
                    <button
                      type="button"
                      onClick={() => downloadCSV(invoices)}
                      className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-br from-[#3678F1] to-[#2563EB] text-white rounded-xl text-sm font-semibold hover:from-[#2563EB] hover:to-[#1D4ED8] shadow-brand transition-colors"
                    >
                      <FaDownload className="w-3.5 h-3.5" /> Export CSV
                    </button>
                  )}
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-center gap-3 rounded-2xl bg-[#FEEBEA] border border-[#F40F02]/20 p-4 mb-5 shadow-sm">
                  <div className="w-9 h-9 rounded-xl bg-[#F40F02]/15 flex items-center justify-center shrink-0">
                    <FaTriangleExclamation className="text-[#F40F02]" />
                  </div>
                  <p className="text-sm text-[#991B1B]">{error}</p>
                </div>
              )}

              {/* Loading */}
              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="rounded-2xl bg-white border border-neutral-200/70 p-5 overflow-hidden">
                      <div className="skeleton h-4 rounded w-1/2 mb-3" />
                      <div className="skeleton h-6 rounded w-2/3" />
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  {/* Filters: month picker + custom from/to date range */}
                  <div className="flex items-center gap-3 mb-6 flex-wrap">
                    <div className={`flex items-center gap-1 bg-white rounded-xl border border-neutral-200 p-1 shadow-sm transition-opacity ${isCustomRange ? 'opacity-50' : ''}`}>
                      <button
                        type="button"
                        onClick={goPrevMonth}
                        disabled={isCustomRange}
                        aria-label="Previous month"
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-600 hover:bg-[#E8F0FE] hover:text-[#3678F1] disabled:hover:bg-transparent disabled:hover:text-neutral-600 disabled:cursor-not-allowed transition-colors"
                      >
                        <FaChevronLeft className="text-xs" />
                      </button>
                      <div className="min-w-[160px] text-center px-2">
                        <p className="text-sm font-bold text-neutral-900">
                          {MONTHS[filterMonth]} {filterYear}
                        </p>
                        {!isCurrentMonth && !isCustomRange && (
                          <button
                            type="button"
                            onClick={goToday}
                            className="text-[10px] text-[#3678F1] font-bold hover:underline"
                          >
                            Jump to today
                          </button>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={goNextMonth}
                        disabled={isCustomRange}
                        aria-label="Next month"
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-600 hover:bg-[#E8F0FE] hover:text-[#3678F1] disabled:hover:bg-transparent disabled:hover:text-neutral-600 disabled:cursor-not-allowed transition-colors"
                      >
                        <FaChevronRight className="text-xs" />
                      </button>
                    </div>

                    {/* Custom from-to date filter */}
                    <div className="flex flex-wrap items-center gap-2 p-1.5 bg-white rounded-xl border border-neutral-200 shadow-sm">
                      <FaCalendar className="text-[#3678F1] w-3.5 h-3.5 ml-1.5" />
                      <label htmlFor="earnings-date-from" className="text-xs font-medium text-neutral-600">From</label>
                      <input
                        id="earnings-date-from"
                        type="date"
                        value={dateFrom}
                        onChange={(e) => setDateFrom(e.target.value)}
                        className="rounded-lg border border-neutral-200 bg-white px-2.5 py-1.5 text-sm text-neutral-900 focus:outline-none focus:border-[#3678F1] focus:ring-2 focus:ring-[#3678F1]/20 transition-colors"
                      />
                      <label htmlFor="earnings-date-to" className="text-xs font-medium text-neutral-600">To</label>
                      <input
                        id="earnings-date-to"
                        type="date"
                        value={dateTo}
                        min={dateFrom || undefined}
                        onChange={(e) => setDateTo(e.target.value)}
                        className="rounded-lg border border-neutral-200 bg-white px-2.5 py-1.5 text-sm text-neutral-900 focus:outline-none focus:border-[#3678F1] focus:ring-2 focus:ring-[#3678F1]/20 transition-colors"
                      />
                      {isCustomRange && (
                        <button
                          type="button"
                          onClick={() => { setDateFrom(''); setDateTo(''); }}
                          className="text-xs text-[#3678F1] font-bold hover:text-[#2563EB] hover:underline px-1.5"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Stats Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                    {stats.map((stat) => (
                      <div key={stat.label} className="rounded-2xl bg-white shadow-soft border border-neutral-200/70 p-5 hover:border-[#3678F1] transition-colors duration-200">
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

                  {/* All Invoices for Selected Range */}
                  <div className="rounded-2xl bg-white shadow-soft border border-neutral-200/70 overflow-hidden">
                    <div className="px-5 py-4 border-b border-neutral-100">
                      <h2 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
                        <span className="w-1 h-4 rounded-full bg-[#3678F1]" />
                        Invoices — {isCustomRange
                          ? `${dateFrom ? formatDate(dateFrom + 'T12:00:00') : '—'} to ${dateTo ? formatDate(dateTo + 'T12:00:00') : '—'}`
                          : `${MONTHS[filterMonth]} ${filterYear}`}
                      </h2>
                    </div>

                    {filteredInvoices.length === 0 ? (
                      <div className="p-12 text-center">
                        <div className="w-14 h-14 rounded-2xl bg-[#E8F0FE] ring-1 ring-[#3678F1]/15 flex items-center justify-center mx-auto mb-4">
                          <FaFileInvoice className="text-[#3678F1] text-2xl" />
                        </div>
                        <p className="text-sm font-semibold text-neutral-700 mb-1">No invoices this month</p>
                        <p className="text-xs text-neutral-400">Your invoices will appear here.</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-neutral-100">
                        {filteredInvoices
                          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                          .map((inv) => (
                            <div key={inv.id} className="flex items-center gap-4 px-5 py-4 hover:bg-[#F4F8FE] transition-colors">
                              <div className="w-9 h-9 rounded-xl bg-[#E8F0FE] ring-1 ring-[#3678F1]/15 flex items-center justify-center shrink-0">
                                <FaFileInvoice className="text-[#3678F1] text-xs" />
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
