import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaPlus, FaEye, FaTriangleExclamation, FaBan, FaFolder, FaCalendar } from 'react-icons/fa6';
import DashboardHeader from '../../components/DashboardHeader';
import DashboardSidebar from '../../components/DashboardSidebar';
import AppFooter from '../../components/AppFooter';
import { useApiQuery } from '../../hooks/useApiQuery';
import { formatBudgetCompact } from '../../utils/currency';
import { api, ApiException } from '../../services/api';
import toast from 'react-hot-toast';
import { useState } from 'react';
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

type DisplayStatus = 'active' | 'planning' | 'in-progress' | 'completed' | 'cancelled';

const statusMap: Record<Project['status'], DisplayStatus> = {
  draft:     'planning',
  open:      'planning',
  active:    'active',
  completed: 'completed',
  cancelled: 'cancelled',
};

const statusConfig: Record<DisplayStatus, { bg: string; text: string; label: string; accent: string }> = {
  active:    { bg: 'bg-blue-50', text: 'text-blue-700', label: 'Active', accent: 'border-l-blue-500' },
  planning:  { bg: 'bg-neutral-100', text: 'text-neutral-600', label: 'Planning', accent: 'border-l-neutral-400' },
  'in-progress': { bg: 'bg-amber-50', text: 'text-amber-700', label: 'In Progress', accent: 'border-l-amber-500' },
  completed: { bg: 'bg-emerald-50', text: 'text-emerald-700', label: 'Completed', accent: 'border-l-emerald-500' },
  cancelled: { bg: 'bg-red-50', text: 'text-red-700', label: 'Cancelled', accent: 'border-l-red-400' },
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
  const { data, loading, error, refetch } = useApiQuery<ProjectsResponse>('/projects?limit=50');
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [cancelActionError, setCancelActionError] = useState<string | null>(null);

  useEffect(() => {
    document.title = 'Projects – Claapo';
  }, []);

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

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-[#F8F9FB] w-full">
      <DashboardHeader />

      <div className="flex-1 flex min-h-0 overflow-hidden">
        <DashboardSidebar links={companyNavLinks} />

        <main className="flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden">
          <div className="flex-1 min-h-0 overflow-auto">
            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-6 xl:px-8 py-6">

              <div className="flex items-center justify-between mb-6">
                <div>
                  <div className="flex items-center gap-2.5 mb-1">
                    <div className="w-1 h-6 rounded-full bg-[#3B5BDB]" />
                    <h1 className="text-xl font-bold text-neutral-900 tracking-tight">Projects</h1>
                  </div>
                  <p className="text-sm text-neutral-500 ml-3.5">Manage your production projects and team</p>
                </div>
                <Link
                  to="/dashboard/projects/new"
                  className="rounded-xl px-5 py-2.5 bg-[#3B5BDB] text-white text-sm font-semibold hover:bg-[#2f4ac2] flex items-center gap-2 transition-all shadow-sm shadow-blue-500/20 hover:shadow-md hover:shadow-blue-500/25"
                >
                  <FaPlus className="w-3 h-3" />
                  <span className="hidden sm:inline">New Project</span>
                </Link>
              </div>

              {/* Error state */}
              {error && (
                <div className="flex items-center gap-3 rounded-2xl bg-red-50 border border-red-200/80 p-4 mb-5">
                  <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center shrink-0">
                    <FaTriangleExclamation className="text-red-500 text-xs" />
                  </div>
                  <p className="text-sm text-red-700">{error}</p>
                  <button onClick={refetch} className="ml-auto text-xs text-red-600 font-semibold hover:underline">Retry</button>
                </div>
              )}

              {/* Loading skeleton */}
              {loading && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="rounded-2xl bg-white border border-neutral-200/80 p-5 animate-pulse shadow-sm">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-9 h-9 bg-neutral-100 rounded-xl" />
                        <div className="flex-1">
                          <div className="h-4 bg-neutral-200 rounded-lg w-3/4 mb-2" />
                          <div className="h-3 bg-neutral-100 rounded-lg w-1/2" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 mb-4">
                        {[1, 2].map((j) => <div key={j} className="h-14 bg-neutral-50 rounded-xl border border-neutral-100" />)}
                      </div>
                      <div className="h-9 bg-neutral-100 rounded-xl" />
                    </div>
                  ))}
                </div>
              )}

              {/* Empty state */}
              {!loading && !error && projects.length === 0 && (
                <div className="rounded-2xl bg-white border border-neutral-200/80 p-16 text-center shadow-sm">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center mx-auto mb-5 border border-blue-100/60">
                    <FaFolder className="text-[#3B5BDB] text-2xl" />
                  </div>
                  <h3 className="text-lg font-bold text-neutral-900 mb-2">No projects yet</h3>
                  <p className="text-sm text-neutral-500 mb-6 max-w-xs mx-auto leading-relaxed">Create your first project to start managing productions and booking crew</p>
                  <Link
                    to="/dashboard/projects/new"
                    className="inline-flex items-center gap-2 rounded-xl px-6 py-3 bg-[#3B5BDB] text-white text-sm font-bold hover:bg-[#2f4ac2] transition-all shadow-sm shadow-blue-500/20 hover:shadow-md"
                  >
                    <FaPlus className="w-3 h-3" /> Create Project
                  </Link>
                </div>
              )}

              {/* Project cards */}
              {!loading && projects.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {projects.map((project) => {
                    const displayStatus = statusMap[project.status];
                    const cfg = statusConfig[displayStatus];
                    const peopleCount = project._count?.bookings ?? 0;
                    // Support both old budget field and new budgetMin/budgetMax fields
                    const rawBudget = project.budgetMax ?? project.budgetMin ?? project.budget ?? 0;
                    const budget = formatBudgetCompact(rawBudget);

                    return (
                      <div
                        key={project.id}
                        className={`rounded-2xl bg-white border border-neutral-200/80 border-l-[3px] ${cfg.accent} p-5 hover:shadow-md hover:border-neutral-300/80 transition-all duration-200 flex flex-col shadow-sm group`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2.5 mb-1.5">
                              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center shrink-0 border border-blue-100/40">
                                <FaCalendar className="text-[#3B5BDB] text-xs" />
                              </div>
                              <h3 className="text-sm font-bold text-neutral-900 truncate group-hover:text-[#3B5BDB] transition-colors">{project.title}</h3>
                            </div>
                            <p className="text-xs text-neutral-400 pl-[42px]">{formatDateRange(project.startDate, project.endDate)}</p>
                            {project.locationCity && (
                              <p className="text-xs text-neutral-400 pl-[42px] mt-0.5">{project.locationCity}</p>
                            )}
                          </div>
                          <span className={`text-[11px] px-2.5 py-1 rounded-full font-semibold shrink-0 ${cfg.bg} ${cfg.text}`}>
                            {cfg.label}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 mb-4">
                          <div className="rounded-xl bg-neutral-50/80 border border-neutral-100 p-3 text-center">
                            <p className="text-sm font-bold text-neutral-900 tabular-nums">{peopleCount}</p>
                            <p className="text-[10px] text-neutral-400 font-medium mt-0.5 uppercase tracking-wide">People</p>
                          </div>
                          <div className="rounded-xl bg-neutral-50/80 border border-neutral-100 p-3 text-center">
                            <p className="text-sm font-bold text-neutral-900 truncate tabular-nums">{budget}</p>
                            <p className="text-[10px] text-neutral-400 font-medium mt-0.5 uppercase tracking-wide">Budget</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 mt-auto">
                          <Link to={`/dashboard/projects/${project.id}`} className="flex-1 rounded-xl py-2.5 border border-neutral-200 text-neutral-600 text-xs font-semibold text-center hover:bg-neutral-50 hover:border-neutral-300 flex items-center justify-center gap-1.5 transition-all">
                            <FaEye className="w-3 h-3" /> View
                          </Link>
                          {project.status !== 'completed' && project.status !== 'cancelled' && (
                            <button onClick={() => { setCancellingId(project.id); setCancelActionError(null); }}
                              className="rounded-xl px-3.5 py-2.5 bg-red-50 text-red-500 border border-red-200/60 text-xs font-semibold hover:bg-red-100 hover:text-red-600 flex items-center gap-1.5 transition-all">
                              <FaBan className="w-3 h-3" />
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

      {/* Cancel Project Modal */}
      {cancellingId && (
        <>
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40" onClick={() => setCancellingId(null)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl w-full max-w-sm p-6 border border-neutral-200/60">
              <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center mb-4 border border-red-100">
                <FaBan className="text-red-500 text-sm" />
              </div>
              <h2 className="text-base font-bold text-neutral-900 mb-2">Cancel Project?</h2>
              <p className="text-sm text-neutral-500 mb-5 leading-relaxed">
                This will cancel the project and notify all booked crew and vendors. This action cannot be undone.
              </p>
              {cancelActionError && (
                <div className="flex items-center gap-2 mb-4 p-3 bg-red-50 border border-red-200/80 rounded-xl">
                  <FaTriangleExclamation className="text-red-500 text-xs shrink-0" />
                  <p className="text-xs text-red-700">{cancelActionError}</p>
                </div>
              )}
              <div className="flex gap-3">
                <button type="button" onClick={() => setCancellingId(null)} className="flex-1 rounded-xl py-2.5 border border-neutral-200 text-neutral-600 text-sm font-medium hover:bg-neutral-50 hover:border-neutral-300 transition-all">Keep Project</button>
                <button type="button" onClick={() => handleCancel(cancellingId)} className="flex-1 rounded-xl py-2.5 bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition-all shadow-sm shadow-red-500/20 flex items-center justify-center gap-1.5">
                  <FaBan className="w-3 h-3" /> Cancel
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
