import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FaPlus, FaEye, FaTriangleExclamation, FaBan, FaFolder,
  FaMagnifyingGlass, FaLocationDot, FaCalendarDays, FaUsers, FaIndianRupeeSign,
} from 'react-icons/fa6';
import DashboardHeader from '../../components/DashboardHeader';
import DashboardSidebar from '../../components/DashboardSidebar';
import AppFooter from '../../components/AppFooter';
import { useApiQuery } from '../../hooks/useApiQuery';
import { formatBudgetCompact } from '../../utils/currency';
import { api, ApiException } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import { companyNavLinks } from '../../navigation/dashboardNav';

interface ProjectRole { id: string; roleName: string; qty: number }

interface Project {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  status: 'draft' | 'open' | 'active' | 'completed' | 'cancelled';
  budget?: number | null;
  budgetMin?: number;
  budgetMax?: number;
  locationCity?: string;
  roles?: ProjectRole[];
  _count?: { bookings: number };
}

interface ProjectsResponse {
  items: Project[];
  meta: { page: number; limit: number; total: number };
}

type DisplayStatus = 'active' | 'planning' | 'completed' | 'cancelled';
type FilterKey = 'all' | DisplayStatus;

const statusMap: Record<Project['status'], DisplayStatus> = {
  draft:     'planning',
  open:      'planning',
  active:    'active',
  completed: 'completed',
  cancelled: 'cancelled',
};

const statusConfig: Record<DisplayStatus, {
  label: string;
  pillBg: string;
  pillText: string;
  dot: string;
}> = {
  active:    { label: 'Ongoing',   pillBg: 'bg-[#FEF3C7]', pillText: 'text-[#946A00]', dot: 'bg-[#F4C430]' },
  planning:  { label: 'Planning',  pillBg: 'bg-[#F3F4F6]', pillText: 'text-neutral-600', dot: 'bg-neutral-400' },
  completed: { label: 'Completed', pillBg: 'bg-[#DBEAFE]', pillText: 'text-[#1E3A8A]', dot: 'bg-[#3678F1]' },
  cancelled: { label: 'Cancelled', pillBg: 'bg-[#FEE2E2]', pillText: 'text-[#991B1B]', dot: 'bg-[#F40F02]' },
};

function formatDateRange(start: string, end: string): string {
  const s = new Date(start);
  const e = new Date(end);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  if (s.getFullYear() === e.getFullYear()) {
    return `${months[s.getMonth()]} ${s.getDate()}–${months[e.getMonth()]} ${e.getDate()}, ${s.getFullYear()}`;
  }
  return `${months[s.getMonth()]} ${s.getDate()}, ${s.getFullYear()} – ${months[e.getMonth()]} ${e.getDate()}, ${e.getFullYear()}`;
}

const REFETCH_INTERVAL_MS = 25_000;

export default function Projects() {
  const { user } = useAuth();
  const isSubuser = user?.mainUserId != null;
  
  const { data, loading, error, refetch } = useApiQuery<ProjectsResponse>('/projects?limit=50');
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [cancelActionError, setCancelActionError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterKey>('all');
  const [query, setQuery] = useState('');

  useEffect(() => { document.title = 'Projects – Claapo'; }, []);

  // Refetch periodically so people count and budget stay up to date
  useEffect(() => {
    const t = setInterval(refetch, REFETCH_INTERVAL_MS);
    return () => clearInterval(t);
  }, [refetch]);

  const handleCancel = async (projectId: string) => {
    setCancelActionError(null);
    try {
      await api.patch(`/projects/${projectId}`, { status: 'cancelled' });
      toast.success('Project cancelled.');
      setCancellingId(null);
      refetch();
    } catch (err) {
      const msg = err instanceof ApiException ? err.payload.message : 'Could not cancel project.';
      toast.error(msg);
      setCancelActionError(msg);
    }
  };

  const projects = data?.items ?? [];

  /* ─── Summary stats (computed, not fetched) ─── */
  const stats = useMemo(() => {
    let active = 0, planning = 0, completed = 0, cancelled = 0, totalBudget = 0;
    for (const p of projects) {
      const d = statusMap[p.status];
      if (d === 'active')    active++;
      if (d === 'planning')  planning++;
      if (d === 'completed') completed++;
      if (d === 'cancelled') cancelled++;
      totalBudget += (p.budgetMax ?? p.budgetMin ?? p.budget ?? 0);
    }
    return { total: projects.length, active, planning, completed, cancelled, totalBudget };
  }, [projects]);

  /* ─── Filtered view ─── */
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return projects.filter((p) => {
      if (filter !== 'all' && statusMap[p.status] !== filter) return false;
      if (!q) return true;
      return p.title.toLowerCase().includes(q)
          || (p.locationCity ?? '').toLowerCase().includes(q);
    });
  }, [projects, filter, query]);

  /* ─── Filter tab definitions ─── */
  const tabs: { key: FilterKey; label: string; count: number }[] = [
    { key: 'all',       label: 'All',       count: stats.total     },
    { key: 'active',    label: 'Active',    count: stats.active    },
    { key: 'planning',  label: 'Planning',  count: stats.planning  },
    { key: 'completed', label: 'Completed', count: stats.completed },
    { key: 'cancelled', label: 'Cancelled', count: stats.cancelled },
  ];

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-[#F3F4F6] w-full">
      <DashboardHeader />

      <div className="flex-1 flex min-h-0 overflow-hidden">
        <DashboardSidebar links={companyNavLinks} />

        <main className="flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden">
          <div className="flex-1 min-h-0 overflow-auto">
            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-7">

              {/* ═══════════ PAGE HEADER ═══════════ */}
              <div className="flex flex-wrap items-start justify-between gap-4 mb-7">
                <div>
                  <div className="flex items-center gap-3 mb-1.5">
                    <span className="w-1 h-7 rounded-full bg-[#3678F1]" />
                    <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">Projects</h1>
                    {!loading && (
                      <span className="inline-flex items-center h-6 px-2.5 rounded-full bg-neutral-100 text-[11px] font-semibold text-neutral-600 tabular-nums">
                        {stats.total}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-neutral-500 ml-4">
                    Manage your production projects, crew, and budgets.
                  </p>
                </div>
                {!isSubuser && (
                  <Link
                    to="/projects/new"
                    className="inline-flex items-center gap-2 rounded-xl h-11 px-5 bg-gradient-to-br from-[#3678F1] to-[#2563EB] text-white text-sm font-semibold hover:from-[#2563EB] hover:to-[#1D4ED8] transition-colors duration-200 shadow-brand"
                  >
                    <FaPlus className="w-3 h-3" />
                    New Project
                  </Link>
                )}
              </div>

              {/* ═══════════ STATS ROW ═══════════ */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                {[
                  { label: 'Total',     value: stats.total,                     accent: 'bg-[#E8F0FE] text-[#3678F1] ring-1 ring-[#3678F1]/15',  Icon: FaFolder        },
                  { label: 'Active',    value: stats.active,                    accent: 'bg-[#E8F0FE] text-[#3678F1] ring-1 ring-[#3678F1]/15',  Icon: FaCalendarDays  },
                  { label: 'Completed', value: stats.completed,                 accent: 'bg-[#E8F0FE] text-[#3678F1] ring-1 ring-[#3678F1]/15', Icon: FaUsers       },
                  { label: 'Total budget', value: formatBudgetCompact(stats.totalBudget), accent: 'bg-[#E8F0FE] text-[#3678F1] ring-1 ring-[#3678F1]/15', Icon: FaIndianRupeeSign },
                ].map(({ label, value, accent, Icon }) => (
                  <div key={label} className="bg-white border border-neutral-200/70 rounded-2xl px-4 py-4 shadow-sm hover:border-[#3678F1] transition-colors duration-200">
                    <div className="flex items-center justify-between">
                      <div className="min-w-0">
                        <p className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">{label}</p>
                        <p className="text-xl font-bold text-neutral-900 tabular-nums mt-1 truncate">{value}</p>
                      </div>
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${accent}`}>
                        <Icon className="text-sm" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* ═══════════ TOOLBAR: TABS + SEARCH ═══════════ */}
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 mb-5">
                {/* Filter tabs */}
                <div className="flex items-center gap-1 bg-white border border-neutral-200/70 rounded-xl p-1 shadow-sm overflow-x-auto scrollbar-hide">
                  {tabs.map((t) => {
                    const active = filter === t.key;
                    return (
                      <button
                        key={t.key}
                        type="button"
                        onClick={() => setFilter(t.key)}
                        className={`inline-flex items-center gap-2 h-9 px-3.5 rounded-lg text-[12.5px] font-semibold whitespace-nowrap transition-colors duration-150 ${
                          active
                            ? 'bg-gradient-to-br from-[#3678F1] to-[#2563EB] text-white shadow-brand'
                            : 'text-neutral-500 hover:text-neutral-800 hover:bg-[#E8F0FE]'
                        }`}
                      >
                        {t.label}
                        <span
                          className={`inline-flex items-center justify-center min-w-[20px] h-[18px] px-1.5 rounded-full text-[10px] font-bold tabular-nums ${
                            active ? 'bg-white/20 text-white' : 'bg-neutral-100 text-neutral-500'
                          }`}
                        >
                          {t.count}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Search */}
                <div className="relative lg:w-72">
                  <FaMagnifyingGlass className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 text-xs pointer-events-none" />
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search by title or city"
                    className="w-full h-11 pl-9 pr-3 rounded-xl bg-white border border-neutral-200/70 shadow-sm text-sm text-neutral-700 placeholder:text-neutral-400 focus:outline-none focus:border-[#3678F1] focus:ring-2 focus:ring-[#3678F1]/20 transition-colors"
                  />
                </div>
              </div>

              {/* ═══════════ ERROR STATE ═══════════ */}
              {error && (
                <div className="flex items-center gap-3 rounded-2xl bg-[#FEE2E2] border border-[#F40F02]/30 p-4 mb-5">
                  <div className="w-9 h-9 rounded-lg bg-white/60 flex items-center justify-center shrink-0">
                    <FaTriangleExclamation className="text-[#F40F02] text-xs" />
                  </div>
                  <p className="text-sm text-[#991B1B] flex-1">{error}</p>
                  <button onClick={refetch} className="text-xs text-[#991B1B] font-semibold hover:underline">Retry</button>
                </div>
              )}

              {/* ═══════════ LOADING SKELETON ═══════════ */}
              {loading && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="rounded-2xl bg-white border border-neutral-200/70 p-5 shadow-sm">
                      <div className="flex items-start gap-3 mb-4">
                        <div className="skeleton w-10 h-10 rounded-xl" />
                        <div className="flex-1 space-y-2">
                          <div className="skeleton h-4 w-3/4 rounded-md" />
                          <div className="skeleton h-3 w-1/2 rounded-full" />
                        </div>
                      </div>
                      <div className="flex gap-2 mb-4">
                        <div className="skeleton h-12 rounded-xl flex-1" />
                        <div className="skeleton h-12 rounded-xl flex-1" />
                        <div className="skeleton h-12 rounded-xl flex-1" />
                      </div>
                      <div className="skeleton h-10 rounded-xl" />
                    </div>
                  ))}
                </div>
              )}

              {/* ═══════════ EMPTY STATE ═══════════ */}
              {!loading && !error && projects.length === 0 && (
                <div className="rounded-2xl bg-white border border-neutral-200/70 p-16 text-center shadow-sm">
                  <div className="w-16 h-16 rounded-2xl bg-[#E8F0FE] flex items-center justify-center mx-auto mb-5">
                    <FaFolder className="text-[#3678F1] text-2xl" />
                  </div>
                  <h3 className="text-lg font-bold text-neutral-900 mb-2">No projects yet</h3>
                  <p className="text-sm text-neutral-500 mb-6 max-w-xs mx-auto leading-relaxed">
                    {!isSubuser 
                      ? "Create your first project to start managing productions and booking crew."
                      : "You don't have any projects yet. Ask your company admin to create one."}
                  </p>
                  {!isSubuser && (
                    <Link
                      to="/projects/new"
                      className="inline-flex items-center gap-2 rounded-xl px-6 py-3 bg-gradient-to-br from-[#3678F1] to-[#2563EB] text-white text-sm font-bold hover:from-[#2563EB] hover:to-[#1D4ED8] transition-colors duration-200 shadow-brand"
                    >
                      <FaPlus className="w-3 h-3" /> Create Project
                    </Link>
                  )}
                </div>
              )}

              {/* ═══════════ NO-MATCH STATE (filter/search returned nothing) ═══════════ */}
              {!loading && !error && projects.length > 0 && filtered.length === 0 && (
                <div className="rounded-2xl bg-white border border-dashed border-neutral-200 p-12 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-neutral-100 flex items-center justify-center mx-auto mb-4">
                    <FaMagnifyingGlass className="text-neutral-400 text-base" />
                  </div>
                  <p className="text-sm font-semibold text-neutral-700 mb-1">No projects match your filter</p>
                  <p className="text-xs text-neutral-400 mb-4">Try a different search or tab.</p>
                  <button
                    type="button"
                    onClick={() => { setFilter('all'); setQuery(''); }}
                    className="text-xs text-[#3678F1] font-semibold hover:underline"
                  >
                    Clear filters
                  </button>
                </div>
              )}

              {/* ═══════════ PROJECT CARDS ═══════════ */}
              {!loading && filtered.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filtered.map((project) => {
                    const displayStatus = statusMap[project.status];
                    const cfg = statusConfig[displayStatus];
                    const peopleCount = project._count?.bookings ?? 0;
                    const roleCount = project.roles?.length ?? 0;
                    const rawBudget = project.budgetMax ?? project.budgetMin ?? project.budget ?? 0;
                    const budget = formatBudgetCompact(rawBudget);
                    const cancellable = project.status !== 'completed' && project.status !== 'cancelled';

                    return (
                      <div
                        key={project.id}
                        className="rounded-2xl bg-white border border-neutral-200/70 p-5 flex flex-col shadow-sm hover:border-[#3678F1] transition-colors duration-200"
                      >
                        {/* Header: icon + title + status pill */}
                        <div className="flex items-start justify-between gap-3 mb-4">
                          <div className="flex items-start gap-3 min-w-0 flex-1">
                            <div className="w-10 h-10 rounded-xl bg-[#E8F0FE] ring-1 ring-[#3678F1]/15 flex items-center justify-center shrink-0">
                              <FaFolder className="text-[#3678F1] text-sm" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <h3 className="text-[14px] font-bold text-neutral-900 truncate">
                                {project.title}
                              </h3>
                              <div className="flex items-center gap-1.5 mt-1 text-[11px] text-neutral-500 truncate">
                                <FaCalendarDays className="text-neutral-300 text-[10px] shrink-0" />
                                <span className="truncate">{formatDateRange(project.startDate, project.endDate)}</span>
                              </div>
                              {project.locationCity && (
                                <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-neutral-400 truncate">
                                  <FaLocationDot className="text-neutral-300 text-[10px] shrink-0" />
                                  <span className="truncate">{project.locationCity}</span>
                                </div>
                              )}
                            </div>
                          </div>
                          <span className={`inline-flex items-center gap-1.5 h-6 px-2.5 rounded-full text-[10.5px] font-bold tracking-wide shrink-0 ${cfg.pillBg} ${cfg.pillText}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                            {cfg.label}
                          </span>
                        </div>

                        {/* Stats strip — 3 neutral tiles */}
                        <div className="grid grid-cols-3 gap-2 mb-4">
                          <div className="rounded-xl bg-neutral-50 border border-neutral-100 px-2 py-2.5 text-center">
                            <p className="text-sm font-bold text-neutral-900 tabular-nums">{peopleCount}</p>
                            <p className="text-[9.5px] text-neutral-400 font-semibold mt-0.5 uppercase tracking-wider">People</p>
                          </div>
                          <div className="rounded-xl bg-neutral-50 border border-neutral-100 px-2 py-2.5 text-center">
                            <p className="text-sm font-bold text-neutral-900 tabular-nums">{roleCount}</p>
                            <p className="text-[9.5px] text-neutral-400 font-semibold mt-0.5 uppercase tracking-wider">Roles</p>
                          </div>
                          <div className="rounded-xl bg-neutral-50 border border-neutral-100 px-2 py-2.5 text-center min-w-0">
                            <p className="text-sm font-bold text-neutral-900 tabular-nums truncate">{budget}</p>
                            <p className="text-[9.5px] text-neutral-400 font-semibold mt-0.5 uppercase tracking-wider">Budget</p>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 mt-auto">
                          <Link
                            to={`/projects/${project.id}`}
                            className="flex-1 inline-flex items-center justify-center gap-1.5 h-10 rounded-xl bg-gradient-to-br from-[#3678F1] to-[#2563EB] text-white text-[12.5px] font-semibold hover:from-[#2563EB] hover:to-[#1D4ED8] transition-colors duration-200 shadow-brand"
                          >
                            <FaEye className="w-3 h-3" /> View details
                          </Link>
                          {cancellable && (
                            <button
                              type="button"
                              aria-label="Cancel project"
                              onClick={() => { setCancellingId(project.id); setCancelActionError(null); }}
                              className="w-10 h-10 rounded-xl border border-neutral-200 text-neutral-400 hover:text-[#F40F02] hover:border-[#F40F02]/30 hover:bg-[#FEE2E2] transition-colors flex items-center justify-center"
                            >
                              <FaBan className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

            </div>
          </div>

          <AppFooter />
        </main>
      </div>

      {/* ═══════════ CANCEL MODAL ═══════════ */}
      {cancellingId && (
        <>
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 backdrop-enter" onClick={() => setCancellingId(null)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 border border-neutral-200/60">
              <div className="w-11 h-11 rounded-xl bg-[#FEE2E2] flex items-center justify-center mb-4 border border-[#F40F02]/20">
                <FaBan className="text-[#F40F02] text-base" />
              </div>
              <h2 className="text-base font-bold text-neutral-900 mb-2">Cancel project?</h2>
              <p className="text-sm text-neutral-500 mb-5 leading-relaxed">
                This will cancel the project and notify all booked crew and vendors. This action cannot be undone.
              </p>
              {cancelActionError && (
                <div className="flex items-center gap-2 mb-4 p-3 bg-[#FEE2E2] border border-[#F40F02]/30 rounded-xl">
                  <FaTriangleExclamation className="text-[#F40F02] text-xs shrink-0" />
                  <p className="text-xs text-[#991B1B]">{cancelActionError}</p>
                </div>
              )}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setCancellingId(null)}
                  className="flex-1 rounded-xl h-11 border border-neutral-200 text-neutral-700 text-sm font-semibold hover:bg-neutral-50 hover:border-neutral-300 transition-colors"
                >
                  Keep project
                </button>
                <button
                  type="button"
                  onClick={() => handleCancel(cancellingId)}
                  className="flex-1 rounded-xl h-11 bg-[#F40F02] text-white text-sm font-semibold hover:bg-[#C50C00] transition-colors flex items-center justify-center gap-1.5"
                >
                  <FaBan className="w-3 h-3" /> Cancel project
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
