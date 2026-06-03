import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  FaArrowLeft,
  FaCloudArrowUp,
  FaFileInvoice,
  FaMagnifyingGlass,
  FaTriangleExclamation,
} from 'react-icons/fa6';
import DashboardHeader from '../components/DashboardHeader';
import DashboardSidebar from '../components/DashboardSidebar';
import AppFooter from '../components/AppFooter';
import { useApiQuery } from '../hooks/useApiQuery';
import { useRole } from '../contexts/RoleContext';
import { formatPaise } from '../utils/currency';
import {
  companyNavLinks,
  individualNavLinks,
  vendorNavLinks,
  castNavLinks,
  locationNavLinks,
} from '../navigation/dashboardNav';

interface InvoiceItem {
  id: string;
  invoiceNumber: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  createdAt: string;
  dueDate: string | null;
  amount: number;
  totalAmount: number;
  gstAmount?: number;
  taxType?: 'none' | 'gst' | 'igst';
  offlineBillingName?: string | null;
  offlineDepartment?: string | null;
  recordedOfflineByCompany?: boolean;
  project: { id: string; title: string } | null;
  issuer: {
    id: string;
    individualProfile?: { displayName: string } | null;
    castProfile?: { displayName: string } | null;
    vendorProfile?: { companyName: string } | null;
    companyProfile?: { companyName: string } | null;
  };
}

interface InvoicesResponse {
  items: InvoiceItem[];
  meta: { total: number };
}

const STATUS_CFG: Record<
  InvoiceItem['status'],
  { bg: string; text: string; label: string }
> = {
  draft: { bg: 'bg-[#F4F8FE]', text: 'text-[#3678F1]', label: 'Draft' },
  sent: { bg: 'bg-[#E8F0FE]', text: 'text-[#2563EB]', label: 'Sent' },
  paid: { bg: 'bg-[#DCFCE7]', text: 'text-[#15803D]', label: 'Paid' },
  overdue: { bg: 'bg-[#FEE2E2]', text: 'text-[#B91C1C]', label: 'Overdue' },
  cancelled: { bg: 'bg-neutral-50', text: 'text-neutral-400', label: 'Cancelled' },
};

type PaymentFilter = 'all' | 'paid' | 'unpaid';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function getIssuerLabel(inv: InvoiceItem): string {
  if (inv.offlineBillingName?.trim()) return inv.offlineBillingName.trim();
  return (
    inv.issuer.individualProfile?.displayName ??
    inv.issuer.castProfile?.displayName ??
    inv.issuer.vendorProfile?.companyName ??
    inv.issuer.companyProfile?.companyName ??
    '—'
  );
}

export default function OfflineInvoices() {
  const { projectId } = useParams<{ projectId?: string }>();
  const isProjectScoped = !!projectId;
  useEffect(() => {
    document.title = isProjectScoped
      ? 'Project Offline Invoices – Claapo'
      : 'Offline Invoices – Claapo';
  }, [isProjectScoped]);
  const { currentRole } = useRole();

  const navLinks =
    currentRole === 'Company'
      ? companyNavLinks
      : currentRole === 'Vendor'
        ? vendorNavLinks
        : currentRole === 'Location'
          ? locationNavLinks
          : currentRole === 'Cast'
            ? castNavLinks
            : individualNavLinks;

  const listUrl = projectId
    ? `/invoices?projectId=${encodeURIComponent(projectId)}&limit=200`
    : '/invoices?limit=200';
  const { data, loading, error, refetch } = useApiQuery<InvoicesResponse>(listUrl);

  const allInvoices = data?.items ?? [];
  const offlineInvoices = useMemo(
    () => allInvoices.filter((inv) => !!inv.recordedOfflineByCompany),
    [allInvoices],
  );

  const projectTitle = useMemo(() => {
    if (!projectId) return null;
    const match = offlineInvoices.find((inv) => inv.project?.id === projectId);
    return match?.project?.title ?? null;
  }, [offlineInvoices, projectId]);

  const [search, setSearch] = useState('');
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilter>('all');

  const filtered = useMemo(() => {
    let out = offlineInvoices;
    if (paymentFilter === 'paid') out = out.filter((inv) => inv.status === 'paid');
    if (paymentFilter === 'unpaid')
      out = out.filter((inv) => inv.status === 'sent' || inv.status === 'overdue');
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      out = out.filter((inv) => {
        const number = (inv.invoiceNumber ?? '').toLowerCase();
        const issuer = getIssuerLabel(inv).toLowerCase();
        const dept = (inv.offlineDepartment ?? '').toLowerCase();
        const project = (inv.project?.title ?? '').toLowerCase();
        return (
          number.includes(q) ||
          issuer.includes(q) ||
          dept.includes(q) ||
          project.includes(q)
        );
      });
    }
    return out;
  }, [offlineInvoices, paymentFilter, search]);

  // Split active vs cancelled (treat cancelled as the "deleted" bucket — it's
  // how the API marks invoices retired by either party). They appear at the
  // bottom in a separate section for cleaner organization.
  const activeFiltered = useMemo(
    () => filtered.filter((inv) => inv.status !== 'cancelled'),
    [filtered],
  );
  const cancelledFiltered = useMemo(
    () => filtered.filter((inv) => inv.status === 'cancelled'),
    [filtered],
  );

  const renderOfflineRow = (inv: InvoiceItem) => {
    const cfg = STATUS_CFG[inv.status] ?? STATUS_CFG.draft;
    const issuer = getIssuerLabel(inv);
    const isCancelled = inv.status === 'cancelled';
    return (
      <li key={inv.id}>
        <Link
          to={`/invoice/${inv.id}`}
          className={`block rounded-2xl bg-white border border-neutral-200 hover:border-[#3678F1]/40 transition-colors px-4 sm:px-5 py-4 ${isCancelled ? 'opacity-75' : ''}`}
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-[#3678F1] text-white text-[9px] font-bold tracking-wider">
                  OFFLINE
                </span>
                <span className="text-xs font-mono text-neutral-500">
                  {inv.invoiceNumber}
                </span>
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.text}`}>
                  {cfg.label}
                </span>
                {inv.offlineDepartment ? (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#E8F0FE] text-[#2563EB] ring-1 ring-[#3678F1]/20">
                    {inv.offlineDepartment}
                  </span>
                ) : null}
              </div>
              <p className="text-sm font-bold text-neutral-900 mt-1.5">{issuer}</p>
              <p className="text-xs text-neutral-500 mt-1 flex items-center gap-1.5">
                <FaFileInvoice className="text-neutral-400 w-3 h-3" />
                {isProjectScoped ? null : (
                  <>
                    {inv.project?.title ?? 'No project'}
                    <span className="text-neutral-300">·</span>
                  </>
                )}
                Issued {formatDate(inv.createdAt)}
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-lg font-bold text-neutral-900">{formatPaise(inv.totalAmount)}</p>
              {inv.gstAmount ? (
                <p className="text-[11px] text-neutral-500">Tax {formatPaise(inv.gstAmount)}</p>
              ) : null}
            </div>
          </div>
        </Link>
      </li>
    );
  };

  const stats = useMemo(() => {
    let closureAmount = 0;
    let taxAmount = 0;
    let paidAmount = 0;
    let unpaidAmount = 0;
    for (const inv of filtered) {
      if (inv.status === 'cancelled') continue;
      closureAmount += inv.amount ?? 0;
      taxAmount += inv.gstAmount ?? 0;
      if (inv.status === 'paid') paidAmount += inv.totalAmount ?? 0;
      else if (inv.status === 'sent' || inv.status === 'overdue')
        unpaidAmount += inv.totalAmount ?? 0;
    }
    return {
      count: filtered.length,
      closureAmount,
      taxAmount,
      paidAmount,
      unpaidAmount,
    };
  }, [filtered]);

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-neutral-50 min-w-0 w-full">
      <DashboardHeader />
      <div className="flex-1 flex min-h-0 overflow-hidden">
        <DashboardSidebar links={navLinks} />
        <main className="flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden">
          <div className="flex-1 min-h-0 overflow-auto">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8 py-4 sm:py-6">
              <Link
                to={projectId ? `/invoices/${projectId}` : '/invoices'}
                className="inline-flex items-center gap-2 text-sm text-neutral-600 hover:text-[#3678F1] font-semibold mb-3 transition-colors"
              >
                <FaArrowLeft className="w-3.5 h-3.5" />
                {projectId ? 'Back to Project Invoices' : 'Back to Invoices'}
              </Link>

              <div className="mb-5 flex items-center gap-3 flex-wrap">
                <div className="w-9 h-9 rounded-xl bg-[#E8F0FE] flex items-center justify-center">
                  <FaCloudArrowUp className="text-[#3678F1] text-sm" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
                    {isProjectScoped
                      ? projectTitle
                        ? `Offline Invoices · ${projectTitle}`
                        : 'Project Offline Invoices'
                      : 'Offline Invoices'}
                  </h1>
                  <p className="text-sm text-neutral-500 mt-1">
                    {isProjectScoped
                      ? 'Offline invoices recorded for this project. Amounts and GST roll up into project closure totals.'
                      : 'Invoices recorded for parties not on Claapo. Their amounts and GST roll up into project closure totals.'}
                  </p>
                </div>
              </div>

              {/* Stats */}
              <div className="mb-5 rounded-2xl bg-white border border-neutral-200 p-3.5 sm:p-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-2.5">
                  <div className="rounded-lg border border-neutral-100 bg-neutral-50 px-3 py-2">
                    <p className="text-[10px] uppercase tracking-wider font-semibold text-neutral-500">
                      Offline invoices
                    </p>
                    <p className="text-sm font-bold text-neutral-900 mt-0.5">
                      {stats.count}
                    </p>
                  </div>
                  <div className="rounded-lg border border-neutral-100 bg-neutral-50 px-3 py-2">
                    <p className="text-[10px] uppercase tracking-wider font-semibold text-neutral-500">
                      Closure Amount
                    </p>
                    <p className="text-sm font-bold text-neutral-900 mt-0.5">
                      {formatPaise(stats.closureAmount)}
                    </p>
                  </div>
                  <div className="rounded-lg border border-neutral-100 bg-neutral-50 px-3 py-2">
                    <p className="text-[10px] uppercase tracking-wider font-semibold text-neutral-500">
                      GST / IGST
                    </p>
                    <p className="text-sm font-bold text-neutral-900 mt-0.5">
                      {formatPaise(stats.taxAmount)}
                    </p>
                  </div>
                  <div className="rounded-lg border border-[#22C55E]/20 bg-[#DCFCE7]/50 px-3 py-2">
                    <p className="text-[10px] uppercase tracking-wider font-semibold text-[#15803D]">
                      Paid Amount
                    </p>
                    <p className="text-sm font-bold text-[#15803D] mt-0.5">
                      {formatPaise(stats.paidAmount)}
                    </p>
                  </div>
                  <div className="rounded-lg border border-[#F40F02]/20 bg-[#FEEBEA]/60 px-3 py-2">
                    <p className="text-[10px] uppercase tracking-wider font-semibold text-[#B91C1C]">
                      Unpaid Amount
                    </p>
                    <p className="text-sm font-bold text-[#B91C1C] mt-0.5">
                      {formatPaise(stats.unpaidAmount)}
                    </p>
                  </div>
                </div>

                <div className="mt-3 flex flex-col gap-3 xl:flex-row xl:items-center xl:gap-3">
                  <div className="relative min-w-0 flex-1 w-full">
                    <FaMagnifyingGlass className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 w-3.5 h-3.5 pointer-events-none" />
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search by invoice no., party, project, department…"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-neutral-200 bg-white text-sm placeholder-neutral-400 focus:outline-none focus:border-[#3678F1]/40 focus:ring-2 focus:ring-[#3678F1]/10"
                    />
                  </div>
                  <div className="flex items-center gap-1 p-0.5 bg-neutral-100 rounded-full self-start">
                    {(['all', 'paid', 'unpaid'] as PaymentFilter[]).map((v) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => setPaymentFilter(v)}
                        className={`px-3 py-1.5 text-[11px] font-semibold rounded-full capitalize transition-colors ${
                          paymentFilter === v
                            ? 'bg-[#3678F1] text-white'
                            : 'text-neutral-600 hover:text-neutral-900'
                        }`}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* List */}
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="rounded-2xl bg-white border border-neutral-200 px-6 py-5"
                    >
                      <div className="skeleton h-5 w-1/3 rounded-lg mb-2" />
                      <div className="skeleton h-3 w-1/2 rounded-lg" />
                    </div>
                  ))}
                </div>
              ) : error ? (
                <div className="flex items-center gap-3 rounded-2xl bg-[#FEEBEA] border border-[#F40F02]/30 p-5">
                  <FaTriangleExclamation className="text-[#F40F02] text-xl shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-[#991B1B]">
                      Failed to load offline invoices
                    </p>
                    <p className="text-xs text-[#991B1B]/80 mt-0.5">{error}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => refetch?.()}
                    className="text-xs font-semibold text-[#991B1B] underline"
                  >
                    Retry
                  </button>
                </div>
              ) : filtered.length === 0 ? (
                <div className="rounded-3xl bg-white border border-neutral-200 py-16 text-center px-6">
                  <div className="w-16 h-16 rounded-2xl bg-[#E8F0FE] mx-auto flex items-center justify-center mb-4">
                    <FaCloudArrowUp className="text-[#3678F1] text-xl" />
                  </div>
                  <p className="text-base font-bold text-neutral-900 mb-1.5">
                    {offlineInvoices.length === 0
                      ? 'No offline invoices yet'
                      : 'No offline invoices match these filters'}
                  </p>
                  <p className="text-sm text-neutral-500 max-w-md mx-auto">
                    {offlineInvoices.length === 0
                      ? isProjectScoped
                        ? 'No offline invoices have been recorded for this project yet. Use “Upload Offline Invoice” on the project invoices page.'
                        : 'Open a project from the Invoices page and tap “Upload Offline Invoice” to record one for a party not on Claapo.'
                      : 'Try clearing the search or status filter.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {activeFiltered.length > 0 && (
                    <ul className="space-y-2">
                      {activeFiltered.map((inv) => renderOfflineRow(inv))}
                    </ul>
                  )}
                  {cancelledFiltered.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 pt-2">
                        <span className="h-px flex-1 bg-neutral-200" />
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                          Deleted · {cancelledFiltered.length}
                        </span>
                        <span className="h-px flex-1 bg-neutral-200" />
                      </div>
                      <ul className="space-y-2">
                        {cancelledFiltered.map((inv) => renderOfflineRow(inv))}
                      </ul>
                    </div>
                  )}
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
