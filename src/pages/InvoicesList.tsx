import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FaFileInvoice, FaPlus, FaTriangleExclamation, FaMagnifyingGlass } from 'react-icons/fa6';
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
  draft:     { bg: 'bg-neutral-50',   text: 'text-neutral-500',  ring: 'ring-neutral-200', dot: 'bg-neutral-400',  label: 'Draft' },
  sent:      { bg: 'bg-blue-50',      text: 'text-blue-600',     ring: 'ring-blue-200',    dot: 'bg-blue-500',     label: 'Sent' },
  paid:      { bg: 'bg-emerald-50',   text: 'text-emerald-600',  ring: 'ring-emerald-200', dot: 'bg-emerald-500',  label: 'Paid' },
  overdue:   { bg: 'bg-red-50',       text: 'text-red-600',      ring: 'ring-red-200',     dot: 'bg-red-500',      label: 'Overdue' },
  cancelled: { bg: 'bg-neutral-50',   text: 'text-neutral-400',  ring: 'ring-neutral-200', dot: 'bg-neutral-300',  label: 'Cancelled' },
};

const STATUS_ACCENT = {
  draft:     'bg-neutral-300',
  sent:      'bg-blue-400',
  paid:      'bg-emerald-400',
  overdue:   'bg-red-400',
  cancelled: 'bg-neutral-200',
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
  const allInvoices = data?.items ?? [];
  const [projectSearch, setProjectSearch] = useState('');
  const invoices = projectSearch.trim()
    ? allInvoices.filter((inv) =>
        (inv.project?.title ?? '').toLowerCase().includes(projectSearch.trim().toLowerCase()),
      )
    : allInvoices;

  const navLinks = currentRole === 'Company' ? companyNavLinks
    : currentRole === 'Vendor' ? vendorNavLinks
    : individualNavLinks;

  const canCreate = currentRole === 'Individual' || currentRole === 'Vendor';

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-[#F8F9FB] w-full">
      <DashboardHeader />

      <div className="flex-1 flex min-h-0 overflow-hidden">
        <DashboardSidebar links={navLinks} />

        <main className="flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden">
          <div className="flex-1 min-h-0 overflow-auto">
            <div className="max-w-[1000px] mx-auto px-4 sm:px-6 lg:px-8 py-6">

              {/* Page header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-neutral-900 flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-[#EEF1FF] flex items-center justify-center">
                      <FaFileInvoice className="text-[#3B5BDB] text-sm" />
                    </div>
                    Invoices
                  </h1>
                  <p className="text-sm text-neutral-500 mt-1.5 ml-[46px]">
                    {currentRole === 'Company' ? 'Invoices received from crew and vendors' : 'Invoices you have sent to clients'}
                  </p>
                </div>
                {canCreate && (
                  <Link
                    to="/dashboard/invoice/new"
                    className="flex items-center gap-2 px-5 py-2.5 bg-[#3B5BDB] text-white rounded-xl text-sm font-semibold hover:bg-[#2f4ac2] shadow-sm hover:shadow-md transition-all duration-200"
                  >
                    <FaPlus className="w-3.5 h-3.5" /> Create Invoice
                  </Link>
                )}
              </div>

              {/* Search bar */}
              {!loading && allInvoices.length > 0 && (
                <div className="mb-5">
                  <label className="sr-only" htmlFor="invoice-project-search">Search by project name</label>
                  <div className="relative">
                    <FaMagnifyingGlass className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 w-3.5 h-3.5" />
                    <input
                      id="invoice-project-search"
                      type="text"
                      value={projectSearch}
                      onChange={(e) => setProjectSearch(e.target.value)}
                      placeholder="Search by project name…"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-neutral-200 bg-white text-sm placeholder-neutral-400 focus:outline-none focus:border-[#3B5BDB]/40 focus:ring-2 focus:ring-[#3B5BDB]/10 shadow-sm transition-all duration-200"
                    />
                  </div>
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="flex items-center gap-3 rounded-2xl bg-red-50 border border-red-100 p-4 mb-5 shadow-sm">
                  <div className="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
                    <FaTriangleExclamation className="text-red-500" />
                  </div>
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="rounded-2xl bg-white border border-neutral-200/80 shadow-sm p-5 animate-pulse flex gap-4">
                      <div className="w-10 h-10 rounded-xl bg-neutral-100 shrink-0" />
                      <div className="flex-1 space-y-3">
                        <div className="h-4 bg-neutral-100 rounded-lg w-1/3" />
                        <div className="h-3 bg-neutral-50 rounded-lg w-1/2" />
                      </div>
                      <div className="w-20 h-8 bg-neutral-50 rounded-xl shrink-0" />
                    </div>
                  ))}
                </div>
              ) : invoices.length === 0 ? (
                <div className="rounded-2xl bg-white border border-neutral-200/80 shadow-sm p-16 text-center">
                  <div className="w-16 h-16 rounded-full bg-[#EEF1FF] flex items-center justify-center mx-auto mb-5">
                    <FaFileInvoice className="text-[#3B5BDB] text-2xl" />
                  </div>
                  {projectSearch.trim() ? (
                    <>
                      <p className="text-base font-semibold text-neutral-700 mb-2">No invoices match your search</p>
                      <p className="text-sm text-neutral-400 mb-5 max-w-xs mx-auto">Try a different project name or clear the search.</p>
                      <button type="button" onClick={() => setProjectSearch('')} className="text-sm text-[#3B5BDB] font-semibold hover:underline underline-offset-2">Clear search</button>
                    </>
                  ) : (
                    <>
                      <p className="text-base font-semibold text-neutral-700 mb-2">No invoices yet</p>
                      <p className="text-sm text-neutral-400 mb-5 max-w-xs mx-auto">
                        {canCreate ? 'Create your first invoice for a project you were booked on.' : 'Invoices sent to you will appear here.'}
                      </p>
                      {canCreate && (
                        <Link to="/dashboard/invoice/new" className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#3B5BDB] text-white rounded-xl text-sm font-semibold hover:bg-[#2f4ac2] shadow-sm hover:shadow-md transition-all duration-200">
                          <FaPlus className="w-3.5 h-3.5" /> Create Invoice
                        </Link>
                      )}
                    </>
                  )}
                </div>
              ) : (
                <div className="space-y-2.5">
                  {invoices.map((inv) => {
                    const cfg = STATUS_CFG[inv.status] ?? STATUS_CFG.draft;
                    const accent = STATUS_ACCENT[inv.status] ?? STATUS_ACCENT.draft;
                    const counterparty = currentRole === 'Company' ? getPartyName(inv.issuer) : getPartyName(inv.recipient);
                    return (
                      <Link
                        key={inv.id}
                        to={`/dashboard/invoice/${inv.id}`}
                        className="group relative flex items-center gap-4 p-5 rounded-2xl bg-white border border-neutral-200/80 shadow-sm hover:shadow-md hover:border-neutral-300 transition-all duration-200 overflow-hidden"
                      >
                        {/* Status accent line on left */}
                        <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl ${accent}`} />

                        <div className="w-10 h-10 rounded-xl bg-[#EEF1FF] flex items-center justify-center shrink-0">
                          <FaFileInvoice className="text-[#3B5BDB] text-sm" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2.5 mb-1">
                            <p className="text-sm font-bold text-neutral-900 group-hover:text-[#3B5BDB] transition-colors duration-200">{inv.invoiceNumber}</p>
                            <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full ring-1 ${cfg.bg} ${cfg.text} ${cfg.ring} inline-flex items-center gap-1`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                              {cfg.label}
                            </span>
                          </div>
                          <p className="text-xs text-neutral-500 truncate">
                            {inv.project?.title ?? 'No project'} <span className="text-neutral-300 mx-1">·</span> {currentRole === 'Company' ? 'From' : 'To'}: <span className="text-neutral-600 font-medium">{counterparty}</span>
                          </p>
                          {inv.dueDate && (
                            <p className="text-[10px] text-neutral-400 mt-1">Due {formatDate(inv.dueDate)}</p>
                          )}
                        </div>
                        <div className="text-right shrink-0 pl-3">
                          <p className="text-sm font-bold text-neutral-900 tabular-nums">{formatPaise(inv.totalAmount)}</p>
                          <p className="text-[10px] text-neutral-400 mt-1 tabular-nums">{formatDate(inv.createdAt)}</p>
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
