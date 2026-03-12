import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaFileInvoice, FaPlus, FaTriangleExclamation } from 'react-icons/fa6';
import DashboardHeader from '../components/DashboardHeader';
import DashboardSidebar from '../components/DashboardSidebar';
import AppFooter from '../components/AppFooter';
import { useApiQuery } from '../hooks/useApiQuery';
import { useRole } from '../contexts/RoleContext';
import { formatPaise } from '../utils/currency';
import { companyNavLinks, individualNavLinks, vendorNavLinks } from '../navigation/dashboardNav';

interface InvoiceItem {
  id: string;
  invoiceNumber: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  createdAt: string;
  dueDate: string | null;
  amount: number;
  totalAmount: number;
  project: { id: string; title: string } | null;
  issuer: { id: string; individualProfile?: { displayName: string } | null; vendorProfile?: { companyName: string } | null; companyProfile?: { companyName: string } | null };
  recipient: { id: string; individualProfile?: { displayName: string } | null; vendorProfile?: { companyName: string } | null; companyProfile?: { companyName: string } | null };
}

interface InvoicesResponse { items: InvoiceItem[]; meta: { total: number } }

const STATUS_CFG = {
  draft:     { bg: 'bg-neutral-100',  text: 'text-neutral-600',  label: 'Draft' },
  sent:      { bg: 'bg-blue-50',      text: 'text-blue-700',     label: 'Sent' },
  paid:      { bg: 'bg-green-50',     text: 'text-green-700',    label: 'Paid' },
  overdue:   { bg: 'bg-red-50',       text: 'text-red-700',      label: 'Overdue' },
  cancelled: { bg: 'bg-neutral-100',  text: 'text-neutral-400',  label: 'Cancelled' },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function getPartyName(u: InvoiceItem['issuer']) {
  return u.individualProfile?.displayName ?? u.vendorProfile?.companyName ?? u.companyProfile?.companyName ?? '—';
}

export default function InvoicesList() {
  useEffect(() => { document.title = 'Invoices – Claapo'; }, []);
  const { currentRole } = useRole();

  const { data, loading, error } = useApiQuery<InvoicesResponse>('/invoices?limit=50');
  const invoices = data?.items ?? [];

  const navLinks = currentRole === 'Company' ? companyNavLinks
    : currentRole === 'Vendor' ? vendorNavLinks
    : individualNavLinks;

  const canCreate = currentRole === 'Individual' || currentRole === 'Vendor';

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-[#F3F4F6] w-full">
      <DashboardHeader />

      <div className="flex-1 flex min-h-0 overflow-hidden">
        <DashboardSidebar links={navLinks} />

        <main className="flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden">
          <div className="flex-1 min-h-0 overflow-auto">
            <div className="max-w-[1000px] mx-auto px-4 sm:px-6 lg:px-8 py-5">

              <div className="flex items-center justify-between mb-5">
                <div>
                  <h1 className="text-xl font-bold text-neutral-900 flex items-center gap-2">
                    <FaFileInvoice className="text-[#3678F1]" /> Invoices
                  </h1>
                  <p className="text-sm text-neutral-500 mt-0.5">
                    {currentRole === 'Company' ? 'Invoices received from crew and vendors' : 'Invoices you have sent to clients'}
                  </p>
                </div>
                {canCreate && (
                  <Link
                    to="/dashboard/invoice/new"
                    className="flex items-center gap-2 px-4 py-2 bg-[#3678F1] text-white rounded-xl text-sm font-semibold hover:bg-[#2c65d4] transition-colors"
                  >
                    <FaPlus className="w-3.5 h-3.5" /> Create Invoice
                  </Link>
                )}
              </div>

              {error && (
                <div className="flex items-center gap-3 rounded-2xl bg-red-50 border border-red-200 p-4 mb-4">
                  <FaTriangleExclamation className="text-red-500 shrink-0" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="rounded-2xl bg-white border border-neutral-200 p-4 animate-pulse flex gap-4">
                      <div className="w-10 h-10 rounded-xl bg-neutral-200 shrink-0" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-neutral-200 rounded w-1/3" />
                        <div className="h-3 bg-neutral-100 rounded w-1/2" />
                      </div>
                      <div className="w-20 h-8 bg-neutral-100 rounded-xl shrink-0" />
                    </div>
                  ))}
                </div>
              ) : invoices.length === 0 ? (
                <div className="rounded-2xl bg-white border border-neutral-200 p-12 text-center">
                  <div className="w-16 h-16 rounded-full bg-[#EEF4FF] flex items-center justify-center mx-auto mb-4">
                    <FaFileInvoice className="text-[#3678F1] text-2xl" />
                  </div>
                  <p className="text-base font-semibold text-neutral-700 mb-1">No invoices yet</p>
                  <p className="text-sm text-neutral-400 mb-4">
                    {canCreate ? 'Create your first invoice for a project you were booked on.' : 'Invoices sent to you will appear here.'}
                  </p>
                  {canCreate && (
                    <Link to="/dashboard/invoice/new" className="inline-flex items-center gap-2 px-4 py-2 bg-[#3678F1] text-white rounded-xl text-sm font-semibold hover:bg-[#2c65d4] transition-colors">
                      <FaPlus className="w-3.5 h-3.5" /> Create Invoice
                    </Link>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {invoices.map((inv) => {
                    const cfg = STATUS_CFG[inv.status] ?? STATUS_CFG.draft;
                    const counterparty = currentRole === 'Company' ? getPartyName(inv.issuer) : getPartyName(inv.recipient);
                    return (
                      <Link
                        key={inv.id}
                        to={`/dashboard/invoice/${inv.id}`}
                        className="flex items-center gap-4 p-4 rounded-2xl bg-white border border-neutral-200 hover:border-[#3678F1] hover:shadow-sm transition-all group"
                      >
                        <div className="w-10 h-10 rounded-xl bg-[#EEF4FF] flex items-center justify-center shrink-0">
                          <FaFileInvoice className="text-[#3678F1]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <p className="text-sm font-bold text-neutral-900 group-hover:text-[#3678F1] transition-colors">{inv.invoiceNumber}</p>
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.text}`}>{cfg.label}</span>
                          </div>
                          <p className="text-xs text-neutral-600 truncate">
                            {inv.project?.title ?? 'No project'} · {currentRole === 'Company' ? 'From' : 'To'}: {counterparty}
                          </p>
                          {inv.dueDate && (
                            <p className="text-[10px] text-neutral-400 mt-0.5">Due {formatDate(inv.dueDate)}</p>
                          )}
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-bold text-neutral-900">{formatPaise(inv.totalAmount)}</p>
                          <p className="text-[10px] text-neutral-400 mt-0.5">{formatDate(inv.createdAt)}</p>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
          <AppFooter />
        </main>
      </div>
    </div>
  );
}
