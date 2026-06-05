import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams, useParams } from 'react-router-dom';
import { FaFileInvoice, FaPlus, FaTriangleExclamation, FaMagnifyingGlass, FaFolder, FaArrowLeft, FaUpload, FaCloudArrowUp } from 'react-icons/fa6';
import DashboardHeader from '../components/DashboardHeader';
import DashboardSidebar from '../components/DashboardSidebar';
import AppFooter from '../components/AppFooter';
import OfflineInvoiceModal from '../components/OfflineInvoiceModal';
import { useApiQuery } from '../hooks/useApiQuery';
import { useAuth } from '../contexts/AuthContext';
import { useRole } from '../contexts/RoleContext';
import { onInvoiceUpdated } from '../services/chatSocket';
import { formatPaise } from '../utils/currency';
import { companyNavLinks, individualNavLinks, vendorNavLinks, castNavLinks, locationNavLinks } from '../navigation/dashboardNav';

interface InvoiceItem {
  id: string;
  invoiceNumber: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  createdAt: string;
  dueDate: string | null;
  amount: number;
  totalAmount: number;
  /** Amount already paid (paise). >0 && < totalAmount = partial payment. */
  paidAmount?: number;
  /** Tax stored in paise; >0 when GST/IGST was applied */
  gstAmount?: number;
  taxType?: 'none' | 'gst' | 'igst';
  offlineBillingName?: string | null;
  offlineDepartment?: string | null;
  recordedOfflineByCompany?: boolean;
  project: { id: string; title: string } | null;
  issuer: {
    id: string;
    individualProfile?: { displayName: string; skills?: string[] | null } | null;
    vendorProfile?: { companyName: string; vendorServiceCategory?: string | null } | null;
    companyProfile?: { companyName: string } | null;
    castProfile?: { displayName: string; roleType?: string | null } | null;
  };
  recipient: {
    id: string;
    individualProfile?: { displayName: string; skills?: string[] | null } | null;
    vendorProfile?: { companyName: string; vendorServiceCategory?: string | null } | null;
    companyProfile?: { companyName: string } | null;
    castProfile?: { displayName: string; roleType?: string | null } | null;
  };
}

interface InvoicesResponse { items: InvoiceItem[]; meta: { total: number } }

interface Project {
  id: string;
  title: string;
  status: string;
  startDate: string;
  endDate: string;
  approvedBudget: number;
  closureAmount: number;
  gstOrIgstAmount: number;
  paidAmount: number;
  unpaidAmount: number;
  createdAt: string;
  conversationCount: number;
  invoiceCount: number;
  bookingCount: number;
}
interface ProjectsWithStatsResponse { items: Project[]; meta: { total: number } }
interface NotificationsResponse {
  items: Array<{
    type?: string;
    readAt?: string | null;
    data?: Record<string, unknown>;
  }>;
}

const STATUS_CFG = {
  draft:     { bg: 'bg-[#F4F8FE]', text: 'text-[#3678F1]',  ring: 'ring-[#3678F1]/20', dot: 'bg-[#3678F1]',  label: 'Draft' },
  sent:      { bg: 'bg-[#E8F0FE]', text: 'text-[#2563EB]',  ring: 'ring-[#3678F1]/30', dot: 'bg-[#3678F1]',  label: 'Sent' },
  paid:      { bg: 'bg-[#DCFCE7]', text: 'text-[#15803D]',  ring: 'ring-[#22C55E]/30', dot: 'bg-[#22C55E]',  label: 'Paid' },
  overdue:   { bg: 'bg-[#FEE2E2]', text: 'text-[#B91C1C]',  ring: 'ring-[#F40F02]/30', dot: 'bg-[#F40F02]',  label: 'Overdue' },
  cancelled: { bg: 'bg-neutral-50', text: 'text-neutral-400', ring: 'ring-neutral-200', dot: 'bg-neutral-300', label: 'Cancelled' },
};

const STATUS_ACCENT = {
  draft:     'bg-[#3678F1]/40',
  sent:      'bg-[#3678F1]',
  paid:      'bg-[#22C55E]',
  overdue:   'bg-[#F40F02]',
  cancelled: 'bg-neutral-200',
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function getPartyName(u: InvoiceItem['issuer']) {
  return (
    u.individualProfile?.displayName
    ?? u.vendorProfile?.companyName
    ?? u.companyProfile?.companyName
    ?? u.castProfile?.displayName
    ?? '—'
  );
}

function getIssuerDisplayName(inv: InvoiceItem) {
  if (inv.recordedOfflineByCompany && inv.offlineBillingName?.trim()) {
    return inv.offlineBillingName.trim();
  }
  return getPartyName(inv.issuer);
}

function getIssuerRoleLabel(inv: InvoiceItem): string | null {
  // Offline invoices recorded by a company carry the role/department on the
  // invoice itself (the recorded party isn't a Claapo user). Surface it here
  // so the list row matches what shows on the offline-invoice detail page.
  if (inv.recordedOfflineByCompany) {
    const dept = inv.offlineDepartment?.trim();
    return dept || null;
  }
  const ind = inv.issuer?.individualProfile;
  if (ind) {
    const firstSkill = ind.skills?.find((s) => !!s?.trim());
    return firstSkill?.trim() ?? 'Individual';
  }
  const vend = inv.issuer?.vendorProfile;
  if (vend) {
    return vend.vendorServiceCategory?.trim() || 'Vendor';
  }
  if (inv.issuer?.companyProfile) return 'Company';
  const cast = inv.issuer?.castProfile;
  if (cast) {
    const rt = cast.roleType?.trim();
    return rt ? rt.charAt(0).toUpperCase() + rt.slice(1) : 'Cast';
  }
  return null;
}

function invoiceHasGstApplied(inv: InvoiceItem) {
  const gst = inv.gstAmount ?? 0;
  const tt = inv.taxType ?? 'none';
  if (gst > 0) return true;
  return tt === 'gst' || tt === 'igst';
}

const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;
type InvoicePaymentFilter = 'all' | 'paid' | 'unpaid';

export default function InvoicesList() {
  useEffect(() => { document.title = 'Invoices – Claapo'; }, []);
  const { currentRole } = useRole();
  const { user } = useAuth();
  // For company viewers, an invoice with issuerUserId matching the company's
  // own account id means THIS company is the issuer (company→company spec 8),
  // not the recipient. Sub-users resolve to the main account here so the row
  // direction is consistent across the whole account.
  const companyAccountOwnerId = user?.mainUserId ?? user?.id ?? null;
  const [searchParams, setSearchParams] = useSearchParams();
  const { projectId: selectedProjectId } = useParams<{ projectId: string }>();
  const issuedOnRaw = searchParams.get('issuedOn')?.trim() ?? '';
  const issuedOn = ISO_DAY.test(issuedOnRaw) ? issuedOnRaw : '';
  const dateFromRaw = searchParams.get('dateFrom')?.trim() ?? '';
  const dateFrom = ISO_DAY.test(dateFromRaw) ? dateFromRaw : '';
  const dateToRaw = searchParams.get('dateTo')?.trim() ?? '';
  const dateTo = ISO_DAY.test(dateToRaw) ? dateToRaw : '';

  // Fetch projects list. SWR: render cached items synchronously on mount
  // while a fresh fetch runs in the background — combined with the
  // push-driven socket subscription below, re-entering this tab feels
  // instant instead of spinning for 500ms+ on every visit.
  const { data: projectsData, loading: projectsLoading, refetch: refetchProjects } = useApiQuery<ProjectsWithStatsResponse>(
    '/projects/my/with-stats?limit=100',
    { swr: true },
  );
  // For Cast users, additionally restrict the project list to projects where
  // they have an accepted/locked booking — without this filter the with-stats
  // endpoint surfaces inquiry-only projects (no booking yet) here, which is
  // wrong on the Invoices page since they cannot issue an invoice until the
  // booking is accepted. Crew/vendor have the same upstream behavior; leaving
  // them as-is to avoid changing their existing experience.
  const { data: castIncomingBookings } = useApiQuery<{ items: Array<{ status: string; project?: { id: string } }> }>(
    currentRole === 'Cast' ? '/bookings/incoming' : null,
    { swr: true },
  );
  const castInvoiceableProjectIds = useMemo(() => {
    if (currentRole !== 'Cast') return null;
    const ids = new Set<string>();
    for (const b of castIncomingBookings?.items ?? []) {
      if (b.status === 'accepted' || b.status === 'locked') {
        if (b.project?.id) ids.add(b.project.id);
      }
    }
    return ids;
  }, [currentRole, castIncomingBookings]);
  // ── Optimistic overlay state ────────────────────────────────────────
  //
  // Two maps, each cleared by the data source that supersedes it. Handler
  // populates both on an incoming-invoice event; they tick down as their
  // respective refetches resolve.
  //
  // - `optimisticInvoiceBumps`     → overlays project.invoiceCount;
  //                                  cleared on projectsData refetch.
  // - `optimisticLastInvoiceAt`    → overlays lastInvoiceAtByProject (sort);
  //                                  cleared on allInvoicesForSort refetch.
  const [optimisticInvoiceBumps, setOptimisticInvoiceBumps] = useState<Record<string, number>>({});
  const [optimisticLastInvoiceAt, setOptimisticLastInvoiceAt] = useState<Record<string, number>>({});
  useEffect(() => {
    // projectsData changed → server invoice counts are now authoritative.
    // Functional setState + identity check so the steady-state empty case
    // doesn't trigger a pointless re-render.
    if (projectsData !== undefined) {
      setOptimisticInvoiceBumps((prev) => (Object.keys(prev).length === 0 ? prev : {}));
    }
  }, [projectsData]);

  const projects = useMemo(() => {
    const all = projectsData?.items ?? [];
    const filtered = !castInvoiceableProjectIds
      ? all
      : all.filter((p) => castInvoiceableProjectIds.has(p.id));
    // Overlay any pending optimistic bumps so the UI is instant even if the
    // refetch is still in flight. No-op when the map is empty (steady state).
    const bumpKeys = Object.keys(optimisticInvoiceBumps);
    if (bumpKeys.length === 0) return filtered;
    return filtered.map((p) => {
      const bump = optimisticInvoiceBumps[p.id];
      return bump ? { ...p, invoiceCount: (p.invoiceCount ?? 0) + bump } : p;
    });
  }, [projectsData, castInvoiceableProjectIds, optimisticInvoiceBumps]);
  const { data: notificationsData, refetch: refetchNotifications } = useApiQuery<NotificationsResponse>(
    currentRole === 'Company' ? '/notifications?limit=100' : null,
    { swr: true },
  );
  // Pulled in for ALL roles now — the project list needs the most-recent
  // invoice timestamp per project so we can sort projects by latest invoice
  // activity. The company "new invoice" badge still uses this same data.
  const { data: allInvoicesForSort, refetch: refetchAllInvoicesForSort } = useApiQuery<InvoicesResponse>(
    '/invoices?limit=100',
    { swr: true },
  );
  useEffect(() => {
    // allInvoicesForSort changed → the sort source is now authoritative.
    // Same idempotent pattern as the bumps clear above — skip the re-render
    // when there's nothing to clear (the common case).
    if (allInvoicesForSort !== undefined) {
      setOptimisticLastInvoiceAt((prev) => (Object.keys(prev).length === 0 ? prev : {}));
    }
  }, [allInvoicesForSort]);

  // Build invoice list URL with optional project filter
  const listPath = useMemo(() => {
    const q = new URLSearchParams({ limit: '100' });
    if (issuedOn) q.set('issuedOn', issuedOn);
    if (dateFrom) q.set('dateFrom', dateFrom);
    if (dateTo) q.set('dateTo', dateTo);
    if (selectedProjectId) q.set('projectId', selectedProjectId);
    return `/invoices?${q.toString()}`;
  }, [issuedOn, dateFrom, dateTo, selectedProjectId]);

  const { data, loading, error, refetch: refetchInvoices } = useApiQuery<InvoicesResponse>(listPath, { swr: true });
  const allInvoices = data?.items ?? [];

  // ── Push-driven refresh — single trigger, debounced reconciliation ─────
  //
  // The optimistic patch (above) makes the UI instant: when invoice_updated
  // arrives with isIncoming=true + projectId, the affected project row's
  // count bumps in the same render that processes the event (~5ms).
  //
  // The refetch is just a slow background reconciliation — it loads the
  // authoritative state, then the clear effects on projectsData/
  // allInvoicesForSort drop the optimistic overlay. With the optimistic
  // path carrying the speed, redundant triggers (notification_created,
  // invoiceAlertsCount-change) were causing the page to fire refreshAll
  // multiple times per event — combined with NavBadgesContext also firing
  // its own 3-query refetch, the local backend was processing ~14
  // concurrent requests per invoice. Down to ONE trigger now.
  //
  // Refetches are debounced ~300ms so back-to-back events (e.g. a status
  // flip followed by a paid event) collapse into a single reconcile cycle
  // instead of cancelling each other and starting fresh.
  const refreshAll = useMemo(
    () => () => {
      refetchProjects();
      refetchInvoices();
      refetchAllInvoicesForSort();
      refetchNotifications();
    },
    [refetchProjects, refetchInvoices, refetchAllInvoicesForSort, refetchNotifications],
  );
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const debouncedRefreshAll = useMemo(
    () => () => {
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = setTimeout(() => {
        refreshTimerRef.current = null;
        refreshAll();
      }, 300);
    },
    [refreshAll],
  );

  useEffect(() => {
    const cleanupInvoice = onInvoiceUpdated((payload) => {
      // Optimistic patch — incoming invoices bump the target project's count
      // and timestamp synchronously. Visible inside one React render cycle.
      // Outgoing events and non-`sent` status flips skip the bump because
      // they don't change the per-project invoice count.
      if (payload.isIncoming && payload.status === 'sent' && payload.projectId) {
        const pid = payload.projectId;
        setOptimisticInvoiceBumps((prev) => ({ ...prev, [pid]: (prev[pid] ?? 0) + 1 }));
        setOptimisticLastInvoiceAt((prev) => ({ ...prev, [pid]: Date.now() }));
      }
      // Schedule reconciliation; NOT awaited — UI is already correct via
      // the optimistic patch. The fetch just confirms.
      debouncedRefreshAll();
    });
    return () => {
      cleanupInvoice();
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
        refreshTimerRef.current = null;
      }
    };
  }, [debouncedRefreshAll]);

  const [projectListSearch, setProjectListSearch] = useState('');
  const [projectListPaymentFilter, setProjectListPaymentFilter] = useState<InvoicePaymentFilter>('all');
  const [projectListTaxOnly, setProjectListTaxOnly] = useState(false);
  const [offlineInvoiceModal, setOfflineInvoiceModal] = useState<null | 'company' | 'vendor'>(null);
  const [selectedProjectPaymentFilter, setSelectedProjectPaymentFilter] = useState<InvoicePaymentFilter>('all');
  const [selectedProjectSearch, setSelectedProjectSearch] = useState('');
  const [taxInvoicesOnly, setTaxInvoicesOnly] = useState(false);

  // Filter by date range (client-side) — not used on a single-project invoice view
  const invoices = useMemo(() => {
    let filtered = allInvoices;
    if (currentRole === 'Company') {
      filtered = filtered.filter((inv) => inv.status !== 'draft');
    }
    if (!selectedProjectId && (dateFrom || dateTo)) {
      filtered = filtered.filter((inv) => {
        const invDate = new Date(inv.createdAt).setHours(0, 0, 0, 0);
        const from = dateFrom ? new Date(dateFrom + 'T00:00:00').getTime() : 0;
        const to = dateTo ? new Date(dateTo + 'T23:59:59').getTime() : Infinity;
        return invDate >= from && invDate <= to;
      });
    }
    return filtered;
  }, [allInvoices, dateFrom, dateTo, currentRole, selectedProjectId]);

  const selectedProjectInvoices = useMemo(() => {
    let filtered = invoices;
    if (selectedProjectPaymentFilter === 'paid') {
      filtered = filtered.filter((inv) => inv.status === 'paid');
    } else if (selectedProjectPaymentFilter === 'unpaid') {
      filtered = filtered.filter((inv) => inv.status === 'sent' || inv.status === 'overdue');
    }
    if (taxInvoicesOnly) {
      filtered = filtered.filter((inv) => invoiceHasGstApplied(inv));
    }
    if (selectedProjectSearch.trim()) {
      const q = selectedProjectSearch.trim().toLowerCase();
      filtered = filtered.filter((inv) => {
        const issuerName = getIssuerDisplayName(inv).toLowerCase();
        const issuerRole = (getIssuerRoleLabel(inv) ?? '').toLowerCase();
        return issuerName.includes(q) || issuerRole.includes(q);
      });
    }
    return filtered;
  }, [invoices, selectedProjectPaymentFilter, selectedProjectSearch, taxInvoicesOnly]);

  // Split into active vs cancelled so cancelled rows live in their own bottom
  // section and don't break up the active list visually.
  const activeProjectInvoices = useMemo(
    () => selectedProjectInvoices.filter((inv) => inv.status !== 'cancelled'),
    [selectedProjectInvoices],
  );
  const cancelledProjectInvoices = useMemo(
    () => selectedProjectInvoices.filter((inv) => inv.status === 'cancelled'),
    [selectedProjectInvoices],
  );

  const navLinks = currentRole === 'Company' ? companyNavLinks
    : currentRole === 'Vendor' ? vendorNavLinks
    : currentRole === 'Location' ? locationNavLinks
    : currentRole === 'Cast' ? castNavLinks
    : individualNavLinks;

  // Companies can also create invoices when they were booked by another
  // company (spec 8 company→company). Cast can create invoices for accepted
  // bookings — same flow as crew/individual.
  const canCreate =
    currentRole === 'Individual' ||
    currentRole === 'Vendor' ||
    currentRole === 'Company' ||
    currentRole === 'Cast' ||
    currentRole === 'Location';

  // Render one invoice list row. Extracted so the active and cancelled
  // sections share identical row markup without duplication.
  const renderInvoiceRow = (inv: InvoiceItem) => {
    const cfg = STATUS_CFG[inv.status] ?? STATUS_CFG.draft;
    const accent = STATUS_ACCENT[inv.status] ?? STATUS_ACCENT.draft;
    // Company viewers can see invoices in BOTH directions now (spec 8): on
    // their own projects they're the recipient, on booked-on projects they're
    // the issuer. Detect direction per row so the counterparty / role label
    // make sense either way. Crew/vendor pages keep the original behavior.
    const companyIsIssuer =
      currentRole === 'Company'
      && !!companyAccountOwnerId
      && inv.issuer?.id === companyAccountOwnerId;
    const counterparty =
      currentRole === 'Company'
        ? companyIsIssuer
          ? getPartyName(inv.recipient)
          : getIssuerDisplayName(inv)
        : getPartyName(inv.recipient);
    const showProjectFirst = currentRole === 'Vendor' || currentRole === 'Individual';
    const projectTitle = inv.project?.title ?? 'No project';
    const issuerRole =
      currentRole === 'Company' && !companyIsIssuer
        ? getIssuerRoleLabel(inv)
        : null;
    const headline = showProjectFirst ? projectTitle : counterparty;
    const isCancelled = inv.status === 'cancelled';
    const paidSoFar = inv.paidAmount ?? 0;
    const isPartial = inv.status !== 'paid' && inv.status !== 'cancelled' && paidSoFar > 0 && paidSoFar < inv.totalAmount;
    return (
      <Link
        key={inv.id}
        to={`/invoice/${inv.id}`}
        className={`group relative flex items-center gap-4 p-5 rounded-2xl bg-white border border-neutral-200/80 shadow-sm hover:border-[#3678F1] transition-colors duration-200 overflow-hidden ${isCancelled ? 'opacity-75' : ''}`}
      >
        <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl ${accent}`} />
        <div className="w-10 h-10 rounded-xl bg-[#E8F0FE] flex items-center justify-center shrink-0">
          <FaFileInvoice className="text-[#3678F1] text-sm" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <p className="text-sm font-bold text-neutral-900 group-hover:text-[#3678F1] transition-colors duration-200 truncate">
              {headline}
            </p>
            {issuerRole ? (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#F4F8FE] text-[#3678F1] ring-1 ring-[#3678F1]/20 inline-flex items-center">
                {issuerRole}
              </span>
            ) : null}
            {isPartial ? (
              <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full ring-1 bg-[#FEF9C3] text-[#854D0E] ring-[#EAB308]/30 inline-flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#EAB308]" />
                Part Payment of {formatPaise(paidSoFar)}
              </span>
            ) : (
              <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full ring-1 ${cfg.bg} ${cfg.text} ${cfg.ring} inline-flex items-center gap-1`}>
                <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                {cfg.label}
              </span>
            )}
          </div>
          <p className="text-xs text-neutral-500 truncate">
            {showProjectFirst ? (
              <>
                Production House: <span className="text-neutral-600 font-medium">{counterparty}</span>
                <span className="text-neutral-300 mx-1">·</span>
                Invoice: <span className="text-neutral-600 font-medium">{inv.invoiceNumber}</span>
              </>
            ) : (
              <>
                {projectTitle}
                <span className="text-neutral-300 mx-1">·</span>
                Invoice: <span className="text-neutral-600 font-medium">{inv.invoiceNumber}</span>
              </>
            )}
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
  };

  // Find selected project details
  const selectedProject = projects.find(p => p.id === selectedProjectId);

  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      // Only surface projects that actually have invoices for this user — a
      // booked-but-uninvoiced project has nothing to view here (all roles).
      // The "Create Invoice" button (→ /invoice/new) still lists every booked
      // project, so first-time invoicing is unaffected; once an invoice exists
      // the project appears here. invoiceCount is role-aware (issuer/recipient).
      if ((project.invoiceCount ?? 0) <= 0) return false;
      if (projectListSearch.trim() && !project.title.toLowerCase().includes(projectListSearch.trim().toLowerCase())) {
        return false;
      }
      if (projectListTaxOnly && (project.gstOrIgstAmount ?? 0) <= 0) return false;
      if (projectListPaymentFilter === 'paid' && (project.paidAmount ?? 0) <= 0) return false;
      if (projectListPaymentFilter === 'unpaid' && (project.unpaidAmount ?? 0) <= 0) return false;
      return true;
    });
  }, [projects, projectListSearch, projectListTaxOnly, projectListPaymentFilter]);

  // Projects that actually have invoices (before search/payment/tax filters) —
  // the base set the list shows; drives the "no invoices yet" empty state and
  // the "X of Y match filters" denominator.
  const invoicedProjectCount = useMemo(
    () => projects.filter((p) => (p.invoiceCount ?? 0) > 0).length,
    [projects],
  );
  const hasListFilters = projectListSearch.trim() !== '' || projectListPaymentFilter !== 'all' || projectListTaxOnly;

  const unreadInvoiceByProject = useMemo(() => {
    if (currentRole !== 'Company') return {} as Record<string, number>;
    const statusByInvoiceId = new Map(
      (allInvoicesForSort?.items ?? []).map((inv) => [inv.id, inv.status]),
    );
    const counts: Record<string, number> = {};
    for (const n of notificationsData?.items ?? []) {
      if (n.readAt || n.type !== 'invoice_sent') continue;
      const rawInvoiceId = n.data?.invoiceId;
      if (typeof rawInvoiceId !== 'string' || statusByInvoiceId.get(rawInvoiceId) !== 'sent') continue;
      const rawProjectId = n.data?.projectId;
      if (typeof rawProjectId !== 'string' || !rawProjectId) continue;
      counts[rawProjectId] = (counts[rawProjectId] ?? 0) + 1;
    }
    return counts;
  }, [currentRole, notificationsData, allInvoicesForSort]);

  const unreadInvoiceProjectCount = useMemo(
    () => filteredProjects.reduce((sum, p) => sum + ((unreadInvoiceByProject[p.id] ?? 0) > 0 ? 1 : 0), 0),
    [filteredProjects, unreadInvoiceByProject],
  );

  // Most recent invoice timestamp per project — drives the sort so the project
  // whose latest invoice arrived most recently shows at the top. Overlays
  // any optimistic `invoice_updated` timestamp so the affected project jumps
  // to the top before the background refetch returns.
  const lastInvoiceAtByProject = useMemo(() => {
    const map: Record<string, number> = {};
    for (const inv of allInvoicesForSort?.items ?? []) {
      const pid = inv.project?.id;
      if (!pid) continue;
      const t = new Date(inv.createdAt).getTime();
      if (!Number.isFinite(t)) continue;
      if (!(pid in map) || t > map[pid]) map[pid] = t;
    }
    for (const [pid, t] of Object.entries(optimisticLastInvoiceAt)) {
      if (!(pid in map) || t > map[pid]) map[pid] = t;
    }
    return map;
  }, [allInvoicesForSort, optimisticLastInvoiceAt]);

  const sortedProjects = useMemo(() => {
    return [...filteredProjects].sort((a, b) => {
      // Tier 1: projects with unread invoice notifications.
      const aUnread = (unreadInvoiceByProject[a.id] ?? 0) > 0;
      const bUnread = (unreadInvoiceByProject[b.id] ?? 0) > 0;
      if (aUnread !== bUnread) return aUnread ? -1 : 1;
      // Tier 2: by most-recent invoice timestamp. Projects with no invoices
      // fall through to the project's createdAt below.
      const aLast = lastInvoiceAtByProject[a.id];
      const bLast = lastInvoiceAtByProject[b.id];
      if (aLast != null && bLast != null && aLast !== bLast) return bLast - aLast;
      if (aLast != null && bLast == null) return -1;
      if (aLast == null && bLast != null) return 1;
      // Tier 3: newest project first.
      const aCreated = new Date(a.createdAt ?? 0).getTime();
      const bCreated = new Date(b.createdAt ?? 0).getTime();
      return bCreated - aCreated;
    });
  }, [filteredProjects, unreadInvoiceByProject, lastInvoiceAtByProject]);

  function clearProjectListFilters() {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete('dateFrom');
      next.delete('dateTo');
      return next;
    });
    setProjectListSearch('');
    setProjectListPaymentFilter('all');
    setProjectListTaxOnly(false);
  }

  function formatProjectDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' });
  }

  // Project List View
  const renderProjectList = () => {
    if (projectsLoading) {
      return (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="rounded-2xl bg-white border border-neutral-200/80 px-6 py-5"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <div className="flex items-start gap-4">
                <div className="skeleton w-12 h-12 rounded-xl shrink-0" />
                <div className="flex-1 space-y-3">
                  <div className="skeleton h-5 w-2/5 rounded-lg" />
                  <div className="skeleton h-3 w-1/3 rounded-lg" />
                  <div className="skeleton h-3 w-1/4 rounded-lg" />
                </div>
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (projects.length === 0) {
      return (
        <div className="rounded-3xl bg-white border border-neutral-200/80 py-20 text-center px-6 flex flex-col items-center justify-center mt-4">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-[#E8F0FE] to-[#DBEAFE] flex items-center justify-center mx-auto mb-5 border border-[#3678F1]/10 shadow-sm">
            <FaFolder className="text-[#3678F1] text-2xl" />
          </div>
          <p className="text-lg font-bold text-neutral-900 mb-1.5">No projects yet</p>
          <p className="text-sm text-neutral-500 max-w-md mx-auto leading-relaxed">
            Create a project or accept a booking to start managing invoices.
          </p>
        </div>
      );
    }

    if (filteredProjects.length === 0) {
      // No list filters active ⇒ the user simply has no invoiced projects yet.
      if (!hasListFilters) {
        return (
          <div className="rounded-3xl bg-white border border-neutral-200/80 py-16 text-center px-6 flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-2xl bg-[#E8F0FE] ring-1 ring-[#3678F1]/15 flex items-center justify-center mb-4">
              <FaFileInvoice className="text-[#3678F1] text-2xl" />
            </div>
            <p className="text-base font-bold text-neutral-900 mb-1.5">No invoices yet</p>
            <p className="text-sm text-neutral-500 max-w-xs mx-auto mb-5">
              {canCreate
                ? 'Once you raise an invoice for a project, it will appear here.'
                : 'Projects with invoices will appear here.'}
            </p>
            {canCreate && (
              <Link to="/invoice/new" className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-br from-[#3678F1] to-[#2563EB] text-white rounded-xl text-sm font-semibold hover:from-[#2563EB] hover:to-[#1D4ED8] shadow-brand transition-colors duration-200">
                <FaPlus className="w-3.5 h-3.5" /> Create Invoice
              </Link>
            )}
          </div>
        );
      }
      return (
        <div className="rounded-2xl bg-white border border-dashed border-neutral-200 py-12 text-center px-6">
          <div className="w-12 h-12 rounded-2xl bg-[#E8F0FE] ring-1 ring-[#3678F1]/15 flex items-center justify-center mx-auto mb-3">
            <FaMagnifyingGlass className="text-[#3678F1] text-base" />
          </div>
          <p className="text-sm font-bold text-neutral-900 mb-1">No projects match these filters</p>
          <p className="text-xs text-neutral-500 mb-4">Try changing search, tax filter, or paid/unpaid.</p>
          <button
            type="button"
            onClick={clearProjectListFilters}
            className="text-xs text-[#3678F1] font-bold hover:underline"
          >
            Clear all filters
          </button>
        </div>
      );
    }

    return (
      <ul className="space-y-2">
        {sortedProjects.map((project) => {
          const unreadForProject = unreadInvoiceByProject[project.id] ?? 0;
          return (
            <li key={project.id}>
              <Link
                to={`/invoices/${project.id}`}
                className="relative flex items-start gap-4 px-6 py-5 rounded-2xl border transition-colors duration-200 group overflow-hidden bg-white border-neutral-200/80 hover:border-[#3678F1]"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#EEF1FF] to-[#DBEAFE] flex items-center justify-center shrink-0 border border-[#3678F1]/10">
                  <FaFileInvoice className="text-[#3678F1] text-lg" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="min-w-0">
                      <p className="text-base font-semibold truncate text-neutral-900 group-hover:text-[#3678F1]">
                        {project.title}
                      </p>
                      <p className="text-xs text-neutral-500 mt-1">
                        {formatProjectDate(project.startDate)} — {formatProjectDate(project.endDate)}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      {unreadForProject > 0 && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FEEBEA] text-[#F40F02] ring-1 ring-[#F40F02]/20">
                          {unreadForProject > 99 ? '99+' : unreadForProject} new
                        </span>
                      )}
                      <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full capitalize ${
                        project.status === 'active' ? 'bg-[#DCFCE7] text-[#15803D] ring-1 ring-[#22C55E]/30' :
                        project.status === 'completed' ? 'bg-[#DBEAFE] text-[#1E3A8A] ring-1 ring-[#3678F1]/30' :
                        project.status === 'draft' ? 'bg-neutral-50 text-neutral-500 ring-1 ring-neutral-200' :
                        'bg-neutral-50 text-neutral-500 ring-1 ring-neutral-200'
                      }`}>
                        {project.status}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 mt-2">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#E8F0FE] border border-[#3678F1]/10">
                      <FaFileInvoice className="text-[#3678F1] text-xs" />
                      <span className="text-xs font-semibold text-[#3678F1]">{project.invoiceCount} {project.invoiceCount === 1 ? 'invoice' : 'invoices'}</span>
                    </div>
                    {project.invoiceCount === 0 && (
                      <p className="text-xs text-neutral-400">No invoices yet</p>
                    )}
                  </div>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    );
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-[#F3F4F6] w-full">
      <DashboardHeader />

      <div className="flex-1 flex min-h-0 overflow-hidden">
        <DashboardSidebar links={navLinks} />

        <main className="flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden">
          <div className="flex-1 min-h-0 overflow-auto">
            <div className="max-w-[1000px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
              {selectedProjectId ? (
                <>
                  {/* Invoice List View with back button */}
                  <div className="mb-6 space-y-4">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0 flex-1">
                        <Link
                          to="/invoices"
                          className="inline-flex items-center gap-2 text-sm text-neutral-600 hover:text-[#3678F1] font-semibold mb-3 transition-colors"
                        >
                          <FaArrowLeft className="w-3.5 h-3.5" />
                          Back to Projects
                        </Link>
                        <h1 className="text-2xl font-bold tracking-tight text-neutral-900 flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-xl bg-[#E8F0FE] flex items-center justify-center">
                            <FaFileInvoice className="text-[#3678F1] text-sm" />
                          </div>
                          {selectedProject?.title ?? 'Project Invoices'}
                        </h1>
                        <p className="text-sm text-neutral-500 mt-1.5 ml-[46px]">
                          {currentRole === 'Company' ? 'Invoices on this project — received and issued' : 'Invoices you have sent to clients'}
                        </p>
                        {issuedOn && (
                          <p className="text-xs text-[#3678F1] font-medium mt-2 ml-[46px] flex flex-wrap items-center gap-2">
                            Showing invoices issued on{' '}
                            {new Date(issuedOn + 'T12:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                            <button
                              type="button"
                              onClick={() => {
                                setSearchParams((prev) => {
                                  const next = new URLSearchParams(prev);
                                  next.delete('issuedOn');
                                  return next;
                                });
                              }}
                              className="text-neutral-500 hover:text-neutral-800 underline underline-offset-2 font-semibold"
                            >
                              Clear date filter
                            </button>
                          </p>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2 shrink-0 justify-end sm:mt-1">
                        {currentRole === 'Company' && selectedProject && (
                          <Link
                            to={`/invoices/${selectedProject.id}/offline`}
                            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold border border-neutral-200 bg-white text-neutral-800 hover:border-[#3678F1]/40 hover:text-[#3678F1] transition-colors"
                          >
                            <FaCloudArrowUp className="w-3.5 h-3.5" /> View Offline Invoices
                          </Link>
                        )}
                        {currentRole === 'Company' && selectedProject && (
                          <button
                            type="button"
                            onClick={() => setOfflineInvoiceModal('company')}
                            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold border border-neutral-200 bg-white text-neutral-800 hover:border-[#3678F1]/40 hover:text-[#3678F1] transition-colors"
                          >
                            <FaUpload className="w-3.5 h-3.5" /> Upload Offline Invoice
                          </button>
                        )}
                        {canCreate && (
                          <Link
                            to="/invoice/new"
                            className="inline-flex shrink-0 items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-br from-[#3678F1] to-[#2563EB] text-white rounded-xl text-sm font-semibold hover:from-[#2563EB] hover:to-[#1D4ED8] shadow-brand transition-colors duration-200"
                          >
                            <FaPlus className="w-3.5 h-3.5" /> Create Invoice
                          </Link>
                        )}
                      </div>
                    </div>

                    {currentRole === 'Company' && selectedProject && (
                      <div className="w-full rounded-2xl border border-neutral-200 bg-white p-3.5 sm:p-4 space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-2.5">
                          <div className="rounded-lg border border-neutral-100 bg-neutral-50 px-3 py-2">
                            <p className="text-[10px] uppercase tracking-wider font-semibold text-neutral-500">Approved Budget</p>
                            <p className="text-sm font-bold text-neutral-900 mt-0.5">{formatPaise(selectedProject.approvedBudget ?? 0)}</p>
                          </div>
                          <div className="rounded-lg border border-neutral-100 bg-neutral-50 px-3 py-2">
                            <p className="text-[10px] uppercase tracking-wider font-semibold text-neutral-500">Closure Amount</p>
                            <p className="text-sm font-bold text-neutral-900 mt-0.5">{formatPaise(selectedProject.closureAmount ?? 0)}</p>
                          </div>
                          <div className="rounded-lg border border-neutral-100 bg-neutral-50 px-3 py-2">
                            <p className="text-[10px] uppercase tracking-wider font-semibold text-neutral-500">GST/IGST Amount</p>
                            <p className="text-sm font-bold text-neutral-900 mt-0.5">{formatPaise(selectedProject.gstOrIgstAmount ?? 0)}</p>
                          </div>
                          <div className="rounded-lg border border-[#22C55E]/20 bg-[#DCFCE7]/50 px-3 py-2">
                            <p className="text-[10px] uppercase tracking-wider font-semibold text-[#15803D]">Paid Amount</p>
                            <p className="text-sm font-bold text-[#15803D] mt-0.5">{formatPaise(selectedProject.paidAmount ?? 0)}</p>
                          </div>
                          <div className="rounded-lg border border-[#F40F02]/20 bg-[#FEEBEA]/60 px-3 py-2">
                            <p className="text-[10px] uppercase tracking-wider font-semibold text-[#B91C1C]">Unpaid Amount</p>
                            <p className="text-sm font-bold text-[#B91C1C] mt-0.5">{formatPaise(selectedProject.unpaidAmount ?? 0)}</p>
                          </div>
                        </div>

                        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:gap-3">
                          <div className="relative min-w-0 flex-1 w-full">
                            <FaMagnifyingGlass className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 w-3.5 h-3.5 pointer-events-none" />
                            <input
                              type="text"
                              value={selectedProjectSearch}
                              onChange={(e) => setSelectedProjectSearch(e.target.value)}
                              placeholder="Search by sender or role (e.g., Director, Editor)…"
                              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-neutral-200 bg-white text-sm placeholder-neutral-400 focus:outline-none focus:border-[#3678F1]/40 focus:ring-2 focus:ring-[#3678F1]/10 transition-all"
                            />
                          </div>
                          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 shrink-0">
                            <label className="inline-flex items-center gap-2 cursor-pointer select-none rounded-lg border border-neutral-200 bg-neutral-50 px-2.5 py-2">
                              <input
                                type="checkbox"
                                checked={taxInvoicesOnly}
                                onChange={(e) => setTaxInvoicesOnly(e.target.checked)}
                                className="h-3.5 w-3.5 rounded border-neutral-300 text-[#3678F1] focus:ring-2 focus:ring-[#3678F1]/20"
                              />
                              <span className="text-xs font-semibold text-neutral-700 whitespace-nowrap">Tax Invoices Only</span>
                            </label>
                            <div className="flex items-center gap-1 p-0.5 bg-neutral-100 rounded-full">
                              {(['all', 'paid', 'unpaid'] as InvoicePaymentFilter[]).map((value) => (
                                <button
                                  key={value}
                                  type="button"
                                  onClick={() => setSelectedProjectPaymentFilter(value)}
                                  className={`px-3 py-1.5 text-[11px] font-semibold rounded-full capitalize transition-colors ${
                                    selectedProjectPaymentFilter === value
                                      ? 'bg-[#3678F1] text-white'
                                      : 'text-neutral-600 hover:text-neutral-900'
                                  }`}
                                >
                                  {value}
                                </button>
                              ))}
                            </div>
                          </div>
                          {(selectedProjectSearch.trim() || selectedProjectPaymentFilter !== 'all' || taxInvoicesOnly) && (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedProjectSearch('');
                                setSelectedProjectPaymentFilter('all');
                                setTaxInvoicesOnly(false);
                              }}
                              className="text-xs text-[#3678F1] font-semibold hover:underline xl:ml-auto shrink-0"
                            >
                              Clear
                            </button>
                          )}
                        </div>
                      </div>
                    )}
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

              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="rounded-2xl bg-white border border-neutral-200/80 shadow-sm p-5 flex gap-4">
                      <div className="skeleton w-10 h-10 rounded-xl shrink-0" />
                      <div className="flex-1 space-y-3">
                        <div className="skeleton h-4 w-1/3 rounded-lg" />
                        <div className="skeleton h-3 w-1/2 rounded-lg" />
                      </div>
                      <div className="skeleton w-20 h-8 rounded-xl shrink-0" />
                    </div>
                  ))}
                </div>
              ) : selectedProjectInvoices.length === 0 ? (
                <div className="rounded-2xl bg-white border border-neutral-200/80 shadow-sm p-16 text-center">
                  <div className="w-16 h-16 rounded-full bg-[#E8F0FE] flex items-center justify-center mx-auto mb-5">
                    <FaFileInvoice className="text-[#3678F1] text-2xl" />
                  </div>
                  {selectedProjectPaymentFilter !== 'all' || taxInvoicesOnly || selectedProjectSearch.trim() || issuedOn ? (
                    <>
                      <p className="text-base font-semibold text-neutral-700 mb-2">No invoices match current filters</p>
                      <p className="text-sm text-neutral-400 mb-5 max-w-xs mx-auto">
                        Try adjusting search, the tax invoice filter, or paid/unpaid — or clear filters to see all invoices.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setSearchParams((prev) => {
                            const next = new URLSearchParams(prev);
                            next.delete('issuedOn');
                            return next;
                          });
                          setSelectedProjectSearch('');
                          setSelectedProjectPaymentFilter('all');
                          setTaxInvoicesOnly(false);
                        }}
                        className="text-sm text-[#3678F1] font-semibold hover:underline underline-offset-2"
                      >
                        Clear filters
                      </button>
                    </>
                  ) : (
                    <>
                      <p className="text-base font-semibold text-neutral-700 mb-2">No invoices yet</p>
                      <p className="text-sm text-neutral-400 mb-5 max-w-xs mx-auto">
                        {canCreate ? 'Create your first invoice for a project you were booked on.' : 'Invoices sent to you will appear here.'}
                      </p>
                      {canCreate && (
                        <Link to="/invoice/new" className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-br from-[#3678F1] to-[#2563EB] text-white rounded-xl text-sm font-semibold hover:from-[#2563EB] hover:to-[#1D4ED8] shadow-brand transition-colors duration-200">
                          <FaPlus className="w-3.5 h-3.5" /> Create Invoice
                        </Link>
                      )}
                    </>
                  )}
                </div>
              ) : (
                <div className="space-y-6">
                  {activeProjectInvoices.length > 0 && (
                    <div className="space-y-2.5">
                      {activeProjectInvoices.map((inv) => renderInvoiceRow(inv))}
                    </div>
                  )}
                  {cancelledProjectInvoices.length > 0 && (
                    <div className="space-y-2.5">
                      <div className="flex items-center gap-2 pt-2">
                        <span className="h-px flex-1 bg-neutral-200" />
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                          Cancelled · {cancelledProjectInvoices.length}
                        </span>
                        <span className="h-px flex-1 bg-neutral-200" />
                      </div>
                      {cancelledProjectInvoices.map((inv) => renderInvoiceRow(inv))}
                    </div>
                  )}
                </div>
              )}
                </>
              ) : (
                <>
                  {/* Projects List Header */}
                  <div className="mb-6 space-y-3">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div>
                      <h1 className="text-2xl font-bold tracking-tight text-neutral-900 flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-[#E8F0FE] flex items-center justify-center">
                          <FaFileInvoice className="text-[#3678F1] text-sm" />
                        </div>
                        Invoices
                      </h1>
                      <p className="text-sm text-neutral-500 mt-1.5 ml-[46px]">
                        {projectsLoading
                          ? 'Loading your projects…'
                          : invoicedProjectCount === 0
                            ? 'No invoices yet'
                            : hasListFilters
                              ? `${filteredProjects.length} of ${invoicedProjectCount} project${invoicedProjectCount === 1 ? '' : 's'} match filters`
                              : 'Select a project to view invoices'}
                        {!projectsLoading && currentRole === 'Company' && unreadInvoiceProjectCount > 0 && (
                          <span className="ml-1 text-[#F40F02] font-semibold">
                            · {unreadInvoiceProjectCount} project{unreadInvoiceProjectCount === 1 ? '' : 's'} with new invoices
                          </span>
                        )}
                      </p>
                      {canCreate && (
                        <div className="mt-3 ml-[46px] flex flex-wrap gap-2">
                          <Link
                            to="/invoice/new"
                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-br from-[#3678F1] to-[#2563EB] text-white rounded-xl text-sm font-semibold hover:from-[#2563EB] hover:to-[#1D4ED8] shadow-brand transition-colors duration-200"
                          >
                            <FaPlus className="w-3.5 h-3.5" /> Create Invoice
                          </Link>
                          <button
                            type="button"
                            onClick={() => setOfflineInvoiceModal('vendor')}
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold border border-neutral-200 bg-white text-neutral-800 hover:border-[#3678F1]/40 hover:text-[#3678F1] transition-colors"
                          >
                            Send Offline Invoice
                          </button>
                        </div>
                      )}
                      </div>
                    </div>
                    {invoicedProjectCount > 0 && (
                      <div className="flex flex-col gap-3 p-3 bg-white rounded-xl border border-neutral-200/70 shadow-sm">
                        <div className="relative">
                          <FaMagnifyingGlass className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 w-3.5 h-3.5 pointer-events-none" />
                          <input
                            type="text"
                            value={projectListSearch}
                            onChange={(e) => setProjectListSearch(e.target.value)}
                            placeholder="Search by project name…"
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-neutral-200 bg-white text-sm placeholder-neutral-400 focus:outline-none focus:border-[#3678F1]/40 focus:ring-2 focus:ring-[#3678F1]/10 transition-all"
                          />
                        </div>
                        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:gap-3">
                          <label className="inline-flex items-center gap-2 cursor-pointer select-none rounded-lg border border-neutral-200 bg-neutral-50 px-2.5 py-2 shrink-0">
                            <input
                              type="checkbox"
                              checked={projectListTaxOnly}
                              onChange={(e) => setProjectListTaxOnly(e.target.checked)}
                              className="h-3.5 w-3.5 rounded border-neutral-300 text-[#3678F1] focus:ring-2 focus:ring-[#3678F1]/20"
                            />
                            <span className="text-xs font-semibold text-neutral-700 whitespace-nowrap">Tax Invoices Only</span>
                          </label>
                          <div className="flex items-center gap-1 p-0.5 bg-neutral-100 rounded-full shrink-0">
                            {(['all', 'paid', 'unpaid'] as InvoicePaymentFilter[]).map((value) => (
                              <button
                                key={value}
                                type="button"
                                onClick={() => setProjectListPaymentFilter(value)}
                                className={`px-3 py-1.5 text-[11px] font-semibold rounded-full capitalize transition-colors ${
                                  projectListPaymentFilter === value
                                    ? 'bg-[#3678F1] text-white'
                                    : 'text-neutral-600 hover:text-neutral-900'
                                }`}
                              >
                                {value}
                              </button>
                            ))}
                          </div>
                          {(projectListSearch.trim() || projectListPaymentFilter !== 'all' || projectListTaxOnly) && (
                            <button
                              type="button"
                              onClick={clearProjectListFilters}
                              className="text-xs text-[#3678F1] font-semibold hover:underline xl:ml-auto shrink-0"
                            >
                              Clear
                            </button>
                          )}
                        </div>
                      </div>
                    )}
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

                  {/* Scrollable project list */}
                  {renderProjectList()}
                </>
              )}
            </div>
          </div>
          <AppFooter />
        </main>
      </div>
      <OfflineInvoiceModal
        open={offlineInvoiceModal !== null}
        onClose={() => setOfflineInvoiceModal(null)}
        mode={offlineInvoiceModal === 'vendor' ? 'vendor-send' : 'company-upload'}
        project={
          offlineInvoiceModal === 'company' && selectedProject
            ? {
                id: selectedProject.id,
                title: selectedProject.title,
                startDate: selectedProject.startDate,
                endDate: selectedProject.endDate,
              }
            : undefined
        }
        onSuccess={() => {
          refetchProjects();
          refetchInvoices();
        }}
      />
    </div>
  );
}
