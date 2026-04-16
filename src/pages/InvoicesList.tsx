import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams, useParams } from 'react-router-dom';
import { FaFileInvoice, FaPlus, FaTriangleExclamation, FaMagnifyingGlass, FaCalendar, FaFolder, FaArrowLeft } from 'react-icons/fa6';
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

interface Project {
  id: string;
  title: string;
  status: string;
  startDate: string;
  endDate: string;
  createdAt: string;
  conversationCount: number;
  invoiceCount: number;
  bookingCount: number;
}
interface ProjectsWithStatsResponse { items: Project[]; meta: { total: number } }

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
  return u.individualProfile?.displayName ?? u.vendorProfile?.companyName ?? u.companyProfile?.companyName ?? '—';
}

const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;

export default function InvoicesList() {
  useEffect(() => { document.title = 'Invoices – Claapo'; }, []);
  const { currentRole } = useRole();
  const [searchParams, setSearchParams] = useSearchParams();
  const { projectId: selectedProjectId } = useParams<{ projectId: string }>();
  const issuedOnRaw = searchParams.get('issuedOn')?.trim() ?? '';
  const issuedOn = ISO_DAY.test(issuedOnRaw) ? issuedOnRaw : '';
  const dateFromRaw = searchParams.get('dateFrom')?.trim() ?? '';
  const dateFrom = ISO_DAY.test(dateFromRaw) ? dateFromRaw : '';
  const dateToRaw = searchParams.get('dateTo')?.trim() ?? '';
  const dateTo = ISO_DAY.test(dateToRaw) ? dateToRaw : '';

  // Fetch projects list
  const { data: projectsData, loading: projectsLoading } = useApiQuery<ProjectsWithStatsResponse>('/projects/my/with-stats?limit=100');
  const projects = projectsData?.items ?? [];

  // Build invoice list URL with optional project filter
  const listPath = useMemo(() => {
    const q = new URLSearchParams({ limit: '100' });
    if (issuedOn) q.set('issuedOn', issuedOn);
    if (dateFrom) q.set('dateFrom', dateFrom);
    if (dateTo) q.set('dateTo', dateTo);
    if (selectedProjectId) q.set('projectId', selectedProjectId);
    return `/invoices?${q.toString()}`;
  }, [issuedOn, dateFrom, dateTo, selectedProjectId]);

  const { data, loading, error } = useApiQuery<InvoicesResponse>(listPath);
  const allInvoices = data?.items ?? [];
  const [projectSearch, setProjectSearch] = useState('');

  // Filter by date range (client-side)
  const invoices = useMemo(() => {
    let filtered = allInvoices;
    if (dateFrom || dateTo) {
      filtered = filtered.filter((inv) => {
        const invDate = new Date(inv.createdAt).setHours(0, 0, 0, 0);
        const from = dateFrom ? new Date(dateFrom + 'T00:00:00').getTime() : 0;
        const to = dateTo ? new Date(dateTo + 'T23:59:59').getTime() : Infinity;
        return invDate >= from && invDate <= to;
      });
    }
    if (projectSearch.trim()) {
      filtered = filtered.filter((inv) =>
        (inv.project?.title ?? '').toLowerCase().includes(projectSearch.trim().toLowerCase()),
      );
    }
    return filtered;
  }, [allInvoices, dateFrom, dateTo, projectSearch]);

  const navLinks = currentRole === 'Company' ? companyNavLinks
    : currentRole === 'Vendor' ? vendorNavLinks
    : individualNavLinks;

  const canCreate = currentRole === 'Individual' || currentRole === 'Vendor';

  // Find selected project details
  const selectedProject = projects.find(p => p.id === selectedProjectId);

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

    return (
      <ul className="space-y-2">
        {projects.map((project) => {
          const hasInvoices = project.invoiceCount > 0;
          return (
            <li key={project.id}>
              <Link
                to={`/invoices/${project.id}`}
                className={`relative flex items-start gap-4 px-6 py-5 rounded-2xl border transition-colors duration-200 group overflow-hidden ${
                  hasInvoices
                    ? 'bg-white border-neutral-200/80 hover:border-[#3678F1]'
                    : 'bg-white border-neutral-200/80 opacity-60 cursor-not-allowed'
                }`}
                onClick={(e) => {
                  if (!hasInvoices) {
                    e.preventDefault();
                  }
                }}
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#EEF1FF] to-[#DBEAFE] flex items-center justify-center shrink-0 border border-[#3678F1]/10">
                  <FaFileInvoice className="text-[#3678F1] text-lg" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="min-w-0">
                      <p className={`text-base font-semibold truncate ${hasInvoices ? 'text-neutral-900 group-hover:text-[#3678F1]' : 'text-neutral-600'}`}>
                        {project.title}
                      </p>
                      <p className="text-xs text-neutral-500 mt-1">
                        {formatProjectDate(project.startDate)} — {formatProjectDate(project.endDate)}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
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
                  <div className="flex items-center justify-between mb-6">
                    <div>
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
                        {currentRole === 'Company' ? 'Invoices received from crew and vendors' : 'Invoices you have sent to clients'}
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
                {canCreate && (
                  <Link
                    to="/invoice/new"
                    className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-br from-[#3678F1] to-[#2563EB] text-white rounded-xl text-sm font-semibold hover:from-[#2563EB] hover:to-[#1D4ED8] shadow-brand transition-colors duration-200"
                  >
                    <FaPlus className="w-3.5 h-3.5" /> Create Invoice
                  </Link>
                )}
              </div>

              {/* Search bar and filters */}
              {!loading && allInvoices.length > 0 && (
                <div className="mb-5 space-y-3">
                  <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
                    <div className="flex-1 min-w-0">
                      <label className="sr-only" htmlFor="invoice-project-search">Search by project name</label>
                      <div className="relative">
                        <FaMagnifyingGlass className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 w-3.5 h-3.5" />
                        <input
                          id="invoice-project-search"
                          type="text"
                          value={projectSearch}
                          onChange={(e) => setProjectSearch(e.target.value)}
                          placeholder="Search by project name…"
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-neutral-200 bg-white text-sm placeholder-neutral-400 focus:outline-none focus:border-[#3678F1]/40 focus:ring-2 focus:ring-[#3678F1]/10 shadow-sm transition-all duration-200"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Date range filter */}
                  <div className="flex flex-wrap items-center gap-3 p-3 bg-white rounded-xl border border-neutral-200 shadow-sm">
                    <FaCalendar className="text-neutral-400 w-4 h-4" />
                    <label htmlFor="invoice-date-from" className="text-xs font-medium text-neutral-600 whitespace-nowrap">
                      From
                    </label>
                    <input
                      id="invoice-date-from"
                      type="date"
                      value={dateFrom}
                      className="rounded-lg border border-neutral-200 bg-white px-2.5 py-2 text-sm text-neutral-900 focus:outline-none focus:border-[#3678F1]/40"
                      onChange={(e) => {
                        const v = e.target.value;
                        setSearchParams((prev) => {
                          const next = new URLSearchParams(prev);
                          if (v) next.set('dateFrom', v);
                          else next.delete('dateFrom');
                          return next;
                        });
                      }}
                    />
                    <label htmlFor="invoice-date-to" className="text-xs font-medium text-neutral-600 whitespace-nowrap">
                      To
                    </label>
                    <input
                      id="invoice-date-to"
                      type="date"
                      value={dateTo}
                      min={dateFrom || undefined}
                      className="rounded-lg border border-neutral-200 bg-white px-2.5 py-2 text-sm text-neutral-900 focus:outline-none focus:border-[#3678F1]/40"
                      onChange={(e) => {
                        const v = e.target.value;
                        setSearchParams((prev) => {
                          const next = new URLSearchParams(prev);
                          if (v) next.set('dateTo', v);
                          else next.delete('dateTo');
                          return next;
                        });
                      }}
                    />
                    {(dateFrom || dateTo) && (
                      <button
                        type="button"
                        onClick={() => {
                          setSearchParams((prev) => {
                            const next = new URLSearchParams(prev);
                            next.delete('dateFrom');
                            next.delete('dateTo');
                            return next;
                          });
                        }}
                        className="text-xs text-[#3678F1] font-semibold hover:underline underline-offset-2 ml-auto"
                      >
                        Clear dates
                      </button>
                    )}
                  </div>

                  {/* Active date filter indicator */}
                  {(dateFrom || dateTo) && (
                    <p className="text-xs text-[#3678F1] font-medium flex items-center gap-2">
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#3678F1]" />
                      Showing invoices from{' '}
                      {dateFrom ? new Date(dateFrom + 'T12:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                      {' '}to{' '}
                      {dateTo ? new Date(dateTo + 'T12:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                    </p>
                  )}
                </div>
              )}

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
              ) : invoices.length === 0 ? (
                <div className="rounded-2xl bg-white border border-neutral-200/80 shadow-sm p-16 text-center">
                  <div className="w-16 h-16 rounded-full bg-[#E8F0FE] flex items-center justify-center mx-auto mb-5">
                    <FaFileInvoice className="text-[#3678F1] text-2xl" />
                  </div>
                  {projectSearch.trim() ? (
                    <>
                      <p className="text-base font-semibold text-neutral-700 mb-2">No invoices match your search</p>
                      <p className="text-sm text-neutral-400 mb-5 max-w-xs mx-auto">Try a different project name or clear the search.</p>
                      <button type="button" onClick={() => setProjectSearch('')} className="text-sm text-[#3678F1] font-semibold hover:underline underline-offset-2">Clear search</button>
                    </>
                  ) : dateFrom || dateTo ? (
                    <>
                      <p className="text-base font-semibold text-neutral-700 mb-2">No invoices in this date range</p>
                      <p className="text-sm text-neutral-400 mb-5 max-w-xs mx-auto">
                        Nothing was issued between{' '}
                        {dateFrom ? new Date(dateFrom + 'T12:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                        {' '}and{' '}
                        {dateTo ? new Date(dateTo + 'T12:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setSearchParams((prev) => {
                            const next = new URLSearchParams(prev);
                            next.delete('dateFrom');
                            next.delete('dateTo');
                            return next;
                          });
                        }}
                        className="text-sm text-[#3678F1] font-semibold hover:underline underline-offset-2"
                      >
                        View all invoices
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
                <div className="space-y-2.5">
                  {invoices.map((inv) => {
                    const cfg = STATUS_CFG[inv.status] ?? STATUS_CFG.draft;
                    const accent = STATUS_ACCENT[inv.status] ?? STATUS_ACCENT.draft;
                    const counterparty = currentRole === 'Company' ? getPartyName(inv.issuer) : getPartyName(inv.recipient);
                    return (
                      <Link
                        key={inv.id}
                        to={`/invoice/${inv.id}`}
                        className="group relative flex items-center gap-4 p-5 rounded-2xl bg-white border border-neutral-200/80 shadow-sm hover:border-[#3678F1] transition-colors duration-200 overflow-hidden"
                      >
                        {/* Status accent line on left */}
                        <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl ${accent}`} />

                        <div className="w-10 h-10 rounded-xl bg-[#E8F0FE] flex items-center justify-center shrink-0">
                          <FaFileInvoice className="text-[#3678F1] text-sm" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2.5 mb-1">
                            <p className="text-sm font-bold text-neutral-900 group-hover:text-[#3678F1] transition-colors duration-200">{inv.invoiceNumber}</p>
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
                </>
              ) : (
                <>
                  {/* Projects List Header */}
                  <div className="mb-6">
                    <h1 className="text-2xl font-bold tracking-tight text-neutral-900 flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-[#E8F0FE] flex items-center justify-center">
                        <FaFileInvoice className="text-[#3678F1] text-sm" />
                      </div>
                      Invoices
                    </h1>
                    <p className="text-sm text-neutral-500 mt-1.5 ml-[46px]">
                      {projectsLoading
                        ? 'Loading your projects…'
                        : projects.length === 0
                          ? 'No projects yet'
                          : 'Select a project to view invoices'}
                    </p>
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
    </div>
  );
}
