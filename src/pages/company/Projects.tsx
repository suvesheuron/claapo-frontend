import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaPlus, FaHouse, FaFolder, FaLock, FaEye, FaCalendar, FaMagnifyingGlass, FaUser, FaTriangleExclamation, FaBan, FaMessage, FaPeopleGroup } from 'react-icons/fa6';
import DashboardHeader from '../../components/DashboardHeader';
import DashboardSidebar from '../../components/DashboardSidebar';
import AppFooter from '../../components/AppFooter';
import { useApiQuery } from '../../hooks/useApiQuery';
import { formatBudgetCompact } from '../../utils/currency';
import { api, ApiException } from '../../services/api';
import { useState } from 'react';

interface ProjectRole { id: string; roleName: string; qty: number }

interface Project {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  status: 'draft' | 'open' | 'active' | 'completed' | 'cancelled';
  budgetMin?: number;
  budgetMax?: number;
  locationCity?: string;
  roles?: ProjectRole[];
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

const statusConfig: Record<DisplayStatus, { bg: string; text: string; label: string }> = {
  active:    { bg: 'bg-[#DBEAFE]', text: 'text-[#1D4ED8]', label: 'Active' },
  planning:  { bg: 'bg-[#F3F4F6]', text: 'text-neutral-600', label: 'Planning' },
  'in-progress': { bg: 'bg-[#FEF9E6]', text: 'text-[#92400E]', label: 'In Progress' },
  completed: { bg: 'bg-[#DCFCE7]', text: 'text-[#15803D]', label: 'Completed' },
  cancelled: { bg: 'bg-[#FEE2E2]', text: 'text-[#B91C1C]', label: 'Cancelled' },
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

const navLinks = [
  { icon: FaHouse,           label: 'Dashboard',    to: '/dashboard' },
  { icon: FaCalendar,        label: 'Availability', to: '/dashboard/company-availability' },
  { icon: FaFolder,          label: 'Projects',     to: '/dashboard/projects' },
  { icon: FaFolder,          label: 'Past Projects',to: '/dashboard/company-past-projects' },
  { icon: FaMagnifyingGlass, label: 'Search',       to: '/dashboard/search' },
  { icon: FaMessage,         label: 'Chat',         to: '/dashboard/conversations' },
  { icon: FaPeopleGroup,     label: 'Team',         to: '/dashboard/team' },
  { icon: FaUser,            label: 'Profile',      to: '/dashboard/company-profile' },
];

export default function Projects() {
  const { data, loading, error, refetch } = useApiQuery<ProjectsResponse>('/projects?limit=50');
  const [lockingId, setLockingId] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [cancelActionError, setCancelActionError] = useState<string | null>(null);

  useEffect(() => {
    document.title = 'Projects – Claapo';
  }, []);

  const handleLock = async (projectId: string) => {
    setLockingId(projectId);
    try {
      await api.patch(`/bookings/${projectId}/lock`, {});
      refetch();
    } catch (err) {
      const msg = err instanceof ApiException ? err.payload.message : 'Could not lock project.';
      alert(msg);
    } finally {
      setLockingId(null);
    }
  };

  const handleCancel = async (projectId: string) => {
    setCancelActionError(null);
    try {
      await api.patch(`/projects/${projectId}`, { status: 'cancelled' });
      setCancellingId(null);
      refetch();
    } catch (err) {
      setCancelActionError(err instanceof ApiException ? err.payload.message : 'Could not cancel project.');
    }
  };

  const projects = data?.items ?? [];

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-[#F3F4F6] w-full">
      <DashboardHeader />

      <div className="flex-1 flex min-h-0 overflow-hidden">
        <DashboardSidebar links={navLinks} />

        <main className="flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden">
          <div className="flex-1 min-h-0 overflow-auto">
            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-6 xl:px-8 py-5">

              <div className="flex items-center justify-between mb-5">
                <div>
                  <h1 className="text-xl font-bold text-neutral-900">Projects</h1>
                  <p className="text-sm text-neutral-500 mt-0.5">Manage your production projects and team</p>
                </div>
                <Link
                  to="/dashboard/projects/new"
                  className="rounded-xl px-4 py-2.5 bg-[#3678F1] text-white text-sm font-semibold hover:bg-[#2563d4] flex items-center gap-2 transition-colors"
                >
                  <FaPlus className="w-3 h-3" />
                  <span className="hidden sm:inline">New Project</span>
                </Link>
              </div>

              {/* Error state */}
              {error && (
                <div className="flex items-center gap-3 rounded-2xl bg-red-50 border border-red-200 p-4 mb-5">
                  <FaTriangleExclamation className="text-red-500 shrink-0" />
                  <p className="text-sm text-red-700">{error}</p>
                  <button onClick={refetch} className="ml-auto text-xs text-red-600 font-semibold hover:underline">Retry</button>
                </div>
              )}

              {/* Loading skeleton */}
              {loading && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="rounded-2xl bg-white border border-neutral-200 p-5 animate-pulse">
                      <div className="h-4 bg-neutral-200 rounded w-3/4 mb-3" />
                      <div className="h-3 bg-neutral-100 rounded w-1/2 mb-4" />
                      <div className="grid grid-cols-3 gap-2">
                        {[1, 2, 3].map((j) => <div key={j} className="h-12 bg-neutral-100 rounded-xl" />)}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Empty state */}
              {!loading && !error && projects.length === 0 && (
                <div className="rounded-2xl bg-white border border-neutral-200 p-12 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-[#EEF4FF] flex items-center justify-center mx-auto mb-4">
                    <FaFolder className="text-[#3678F1] text-2xl" />
                  </div>
                  <h3 className="text-base font-bold text-neutral-900 mb-2">No projects yet</h3>
                  <p className="text-sm text-neutral-500 mb-5">Create your first project to get started</p>
                  <Link
                    to="/dashboard/projects/new"
                    className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 bg-[#F4C430] text-neutral-900 text-sm font-bold hover:bg-[#e6b820] transition-colors"
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
                    const crewCount = project.roles?.reduce((s, r) => s + r.qty, 0) ?? 0;
                    const budget = project.budgetMax
                      ? formatBudgetCompact(project.budgetMax)
                      : project.budgetMin
                      ? formatBudgetCompact(project.budgetMin)
                      : '—';

                    return (
                      <div
                        key={project.id}
                        className="rounded-2xl bg-white border border-neutral-200 p-5 hover:shadow-md hover:border-neutral-300 transition-all flex flex-col"
                      >
                        <div className="flex items-start justify-between gap-2 mb-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <div className="w-8 h-8 rounded-lg bg-[#EEF4FF] flex items-center justify-center shrink-0">
                                <FaCalendar className="text-[#3678F1] text-xs" />
                              </div>
                              <h3 className="text-sm font-bold text-neutral-900 truncate">{project.title}</h3>
                            </div>
                            <p className="text-xs text-neutral-400 pl-10">{formatDateRange(project.startDate, project.endDate)}</p>
                            {project.locationCity && (
                              <p className="text-xs text-neutral-400 pl-10 mt-0.5">{project.locationCity}</p>
                            )}
                          </div>
                          <span className={`text-[11px] px-2.5 py-1 rounded-full font-semibold shrink-0 ${cfg.bg} ${cfg.text}`}>
                            {cfg.label}
                          </span>
                        </div>

                        <div className="grid grid-cols-3 gap-2 mb-4">
                          <div className="rounded-xl bg-[#F3F4F6] p-2.5 text-center">
                            <p className="text-xs font-bold text-neutral-900">{crewCount || '—'}</p>
                            <p className="text-[10px] text-neutral-500 mt-0.5">Roles</p>
                          </div>
                          <div className="rounded-xl bg-[#F3F4F6] p-2.5 text-center">
                            <p className="text-xs font-bold text-neutral-900">{project.status === 'active' ? 'Open' : '—'}</p>
                            <p className="text-[10px] text-neutral-500 mt-0.5">Bookings</p>
                          </div>
                          <div className="rounded-xl bg-[#F3F4F6] p-2.5 text-center">
                            <p className="text-xs font-bold text-neutral-900 truncate">{budget}</p>
                            <p className="text-[10px] text-neutral-500 mt-0.5">Budget</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 mt-auto">
                          <Link to={`/dashboard/projects/${project.id}`} className="flex-1 rounded-xl py-2 border border-neutral-200 text-neutral-700 text-xs font-semibold text-center hover:bg-neutral-50 flex items-center justify-center gap-1.5 transition-colors">
                            <FaEye className="w-3 h-3" /> View
                          </Link>
                          {project.status !== 'completed' && project.status !== 'cancelled' && (
                            <>
                              <button onClick={() => handleLock(project.id)} disabled={lockingId === project.id}
                                className="rounded-xl px-3.5 py-2 bg-[#3678F1] text-white text-xs font-semibold hover:bg-[#2563d4] flex items-center gap-1.5 transition-colors disabled:opacity-50">
                                <FaLock className="w-3 h-3" />
                                {lockingId === project.id ? '…' : 'Lock'}
                              </button>
                              <button onClick={() => { setCancellingId(project.id); setCancelActionError(null); }}
                                className="rounded-xl px-3.5 py-2 bg-[#FEE2E2] text-[#B91C1C] text-xs font-semibold hover:bg-[#FECACA] flex items-center gap-1.5 transition-colors">
                                <FaBan className="w-3 h-3" />
                              </button>
                            </>
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
          <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setCancellingId(null)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
              <h2 className="text-base font-bold text-neutral-900 mb-2">Cancel Project?</h2>
              <p className="text-sm text-neutral-600 mb-4">
                This will cancel the project and notify all booked crew and vendors. This action cannot be undone.
              </p>
              {cancelActionError && (
                <div className="flex items-center gap-2 mb-4 p-3 bg-red-50 border border-red-200 rounded-xl">
                  <FaTriangleExclamation className="text-red-500 text-xs shrink-0" />
                  <p className="text-xs text-red-700">{cancelActionError}</p>
                </div>
              )}
              <div className="flex gap-3">
                <button type="button" onClick={() => setCancellingId(null)} className="flex-1 rounded-xl py-2.5 border border-neutral-300 text-neutral-700 text-sm font-medium hover:bg-neutral-50 transition-colors">Keep Project</button>
                <button type="button" onClick={() => handleCancel(cancellingId)} className="flex-1 rounded-xl py-2.5 bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition-colors flex items-center justify-center gap-1.5">
                  <FaBan className="w-3 h-3" /> Cancel Project
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
