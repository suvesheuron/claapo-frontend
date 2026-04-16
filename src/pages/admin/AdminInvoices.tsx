import { useEffect, useState } from 'react';
import DashboardHeader from '../../components/DashboardHeader';
import DashboardSidebar from '../../components/DashboardSidebar';
import { useApiQuery } from '../../hooks/useApiQuery';
import { adminNavLinks } from './adminNavLinks';

interface InvoiceItem {
  id: string;
  invoiceNumber: string;
  issuerName: string | null;
  recipientName: string | null;
  totalAmount: number;
  status: string;
  dueDate: string | null;
  createdAt: string;
  project?: { id: string; title: string } | null;
}

interface InvoicesResponse {
  items: InvoiceItem[];
  meta: { total: number; page: number; limit: number; pages: number };
}

const statusStyles: Record<string, { bg: string; text: string; dot: string }> = {
  draft:     { bg: 'bg-[#F3F4F6]', text: 'text-neutral-600', dot: 'bg-neutral-400' },
  sent:      { bg: 'bg-[#E8F0FE]', text: 'text-[#2563EB]', dot: 'bg-[#3678F1]' },
  viewed:    { bg: 'bg-[#FEF3C7]', text: 'text-[#946A00]', dot: 'bg-[#F4C430]' },
  paid:      { bg: 'bg-[#DBEAFE]', text: 'text-[#1E3A8A]', dot: 'bg-[#3678F1]' },
  overdue:   { bg: 'bg-[#FEE2E2]', text: 'text-[#991B1B]', dot: 'bg-[#F40F02]' },
  cancelled: { bg: 'bg-[#FEE2E2]', text: 'text-[#991B1B]', dot: 'bg-[#F40F02]' },
};

const STATUS_OPTIONS = ['', 'draft', 'sent', 'viewed', 'paid', 'overdue', 'cancelled'];

const formatCurrency = (paise: number) =>
  (paise / 100).toLocaleString('en-IN', { style: 'currency', currency: 'INR' });

export default function AdminInvoices() {
  useEffect(() => { document.title = 'Invoices – Admin – Claapo'; }, []);

  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const limit = 20;

  const queryParams = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (statusFilter) queryParams.set('status', statusFilter);

  const { data, loading, error } = useApiQuery<InvoicesResponse>(`/admin/invoices?${queryParams.toString()}`);
  const invoices = data?.items ?? [];
  const meta = data?.meta;

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-[#F3F4F6] w-full">
      <DashboardHeader />
      <div className="flex-1 flex min-h-0 overflow-hidden">
        <DashboardSidebar links={adminNavLinks} />
        <main className="flex-1 overflow-auto p-6">
          <div className="max-w-[1200px] mx-auto">
            {/* Page heading */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-xl font-bold text-neutral-900 tracking-tight">Invoices</h1>
                <p className="text-sm text-neutral-500 mt-0.5">Financial overview and tracking</p>
              </div>
              {meta && (
                <span className="text-xs text-neutral-400 font-medium">{meta.total.toLocaleString('en-IN')} total</span>
              )}
            </div>

            {/* Filter */}
            <div className="flex items-center gap-3 mb-4">
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                className="rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm text-neutral-700 focus:outline-none focus:ring-2 focus:ring-[#3678F1]/20 focus:border-[#3678F1]/40 transition-all"
              >
                <option value="">All Statuses</option>
                {STATUS_OPTIONS.filter(Boolean).map((s) => (
                  <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                ))}
              </select>
            </div>

            {error && (
              <div className="mb-4 rounded-xl bg-[#FEEBEA] border border-[#F40F02]/30 px-4 py-3 text-sm text-[#991B1B]">{error}</div>
            )}

            {/* Table */}
            <div className="rounded-2xl bg-white border border-neutral-200/60 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-neutral-100 bg-neutral-50/50">
                      <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Invoice #</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Issuer</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Recipient</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Amount</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Status</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Due Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {loading && invoices.length === 0 ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <tr key={i}>
                          {Array.from({ length: 6 }).map((_, j) => (
                            <td key={j} className="px-4 py-3.5"><div className="skeleton h-4 w-20 rounded" /></td>
                          ))}
                        </tr>
                      ))
                    ) : invoices.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-10 text-center text-neutral-400 text-sm">No invoices found</td>
                      </tr>
                    ) : (
                      invoices.map((inv) => {
                        const style = statusStyles[inv.status] ?? statusStyles.draft;
                        return (
                          <tr key={inv.id} className="hover:bg-[#F4F8FE] transition-colors">
                            <td className="px-4 py-3.5 font-medium text-neutral-900 whitespace-nowrap">
                              {inv.invoiceNumber || inv.id.slice(0, 8).toUpperCase()}
                            </td>
                            <td className="px-4 py-3.5 text-neutral-600 whitespace-nowrap">{inv.issuerName ?? '—'}</td>
                            <td className="px-4 py-3.5 text-neutral-600 whitespace-nowrap">{inv.recipientName ?? '—'}</td>
                            <td className="px-4 py-3.5 text-neutral-900 font-semibold whitespace-nowrap text-right tabular-nums">
                              {formatCurrency(inv.totalAmount)}
                            </td>
                            <td className="px-4 py-3.5 whitespace-nowrap">
                              <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold ${style.bg} ${style.text}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                                {inv.status.charAt(0).toUpperCase() + inv.status.slice(1)}
                              </span>
                            </td>
                            <td className="px-4 py-3.5 text-neutral-500 whitespace-nowrap text-xs">
                              {inv.dueDate
                                ? new Date(inv.dueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                                : '—'}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {meta && meta.pages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-neutral-100 bg-neutral-50/30">
                  <p className="text-xs text-neutral-500">
                    Page {meta.page} of {meta.pages}
                  </p>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      Previous
                    </button>
                    <button
                      type="button"
                      disabled={page >= meta.pages}
                      onClick={() => setPage((p) => p + 1)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
