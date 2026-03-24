import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaCircleInfo, FaUsers, FaTruck, FaFolder, FaMessage } from 'react-icons/fa6';
import DashboardHeader from '../../components/DashboardHeader';
import DashboardSidebar from '../../components/DashboardSidebar';
import AppFooter from '../../components/AppFooter';
import { useApiQuery } from '../../hooks/useApiQuery';
import { formatBudgetCompact } from '../../utils/currency';
import { companyNavLinks } from '../../navigation/dashboardNav';

interface ProjectItem {
  id: string;
  title: string;
  status: string;
  startDate: string;
  endDate: string;
  productionHouseName?: string | null;
  budgetMax?: number | null;
  budgetMin?: number | null;
  _count?: { bookings: number };
  roles?: { qty: number }[];
}

function formatDateRange(start: string, end: string): string {
  const s = new Date(start);
  const e = new Date(end);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  if (s.getFullYear() === e.getFullYear()) {
    return `${months[s.getMonth()]} ${s.getDate()}–${months[e.getMonth()]} ${e.getDate()}, ${s.getFullYear()}`;
  }
  return `${months[s.getMonth()]} ${s.getDate()}, ${s.getFullYear()} – ${months[e.getMonth()]} ${e.getDate()}, ${e.getFullYear()}`;
}

export default function CompanyPastProjects() {
  useEffect(() => { document.title = 'Past Projects – Claapo'; }, []);

  const { data, loading, error } = useApiQuery<{ items: ProjectItem[] }>('/projects?limit=100');
  const allProjects = data?.items ?? [];
  const pastProjects = allProjects.filter(p => p.status === 'completed' || p.status === 'cancelled');

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-[#F8F9FB] w-full">
      <DashboardHeader />

      <div className="flex-1 flex min-h-0 overflow-hidden">
        <DashboardSidebar links={companyNavLinks} />

        <main className="flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden">
          <div className="flex-1 min-h-0 overflow-auto">
            <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-6 xl:px-8 py-6">

              <div className="mb-6">
                <div className="flex items-center gap-2.5 mb-1">
                  <div className="w-1 h-6 rounded-full bg-[#3B5BDB]" />
                  <h1 className="text-xl font-bold text-neutral-900 tracking-tight">Past Projects</h1>
                </div>
                <p className="text-sm text-neutral-500 ml-3.5">Completed productions with crew, vendor, and invoice records</p>
              </div>

              {/* Info banner */}
              <div className="rounded-2xl bg-gradient-to-r from-blue-50/80 to-indigo-50/50 border border-blue-200/50 p-4 mb-5 flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-blue-100/80 flex items-center justify-center shrink-0 mt-0.5">
                  <FaCircleInfo className="text-[#3B5BDB] text-xs" />
                </div>
                <p className="text-xs text-blue-700/80 leading-relaxed pt-1">
                  You can also browse completed projects by navigating to past months on your{' '}
                  <Link to="/dashboard/company-availability" className="font-semibold underline decoration-blue-300 underline-offset-2 hover:text-blue-800 transition-colors">
                    Availability Calendar
                  </Link>.
                </p>
              </div>

              {error && (
                <div className="rounded-2xl bg-red-50 border border-red-200/80 p-4 mb-4 text-sm text-red-700 flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-red-100 flex items-center justify-center shrink-0">
                    <FaCircleInfo className="text-red-500 text-xs" />
                  </div>
                  {error}
                </div>
              )}

              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[1,2,3,4,5,6].map(i => (
                    <div key={i} className="rounded-2xl bg-white border border-neutral-200/80 p-5 animate-pulse shadow-sm">
                      <div className="flex items-start justify-between mb-3">
                        <div className="w-9 h-9 bg-neutral-100 rounded-xl" />
                        <div className="w-16 h-5 bg-neutral-100 rounded-full" />
                      </div>
                      <div className="h-4 bg-neutral-200 rounded-lg w-3/4 mb-2" />
                      <div className="h-3 bg-neutral-100 rounded-lg w-full mb-3" />
                      <div className="flex gap-3 mb-3">
                        <div className="h-3 bg-neutral-100 rounded w-16" />
                        <div className="h-3 bg-neutral-100 rounded w-20" />
                      </div>
                      <div className="h-9 bg-neutral-50 rounded-xl border border-neutral-100" />
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  <p className="text-xs text-neutral-400 mb-4 font-medium tracking-wide">{pastProjects.length} past project{pastProjects.length !== 1 ? 's' : ''}</p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {pastProjects.length === 0 ? (
                      <div className="col-span-full rounded-2xl bg-white border border-neutral-200/80 p-14 text-center shadow-sm">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-neutral-50 to-neutral-100 flex items-center justify-center mx-auto mb-4 border border-neutral-200/60">
                          <FaFolder className="text-neutral-300 text-2xl" />
                        </div>
                        <p className="text-sm font-bold text-neutral-700 mb-1">No past projects yet</p>
                        <p className="text-xs text-neutral-400 leading-relaxed max-w-xs mx-auto">Completed or cancelled projects will appear here once your first project wraps up</p>
                      </div>
                    ) : (
                      pastProjects.map((project) => {
                        const crewCount = project.roles?.reduce((s, r) => s + r.qty, 0) ?? 0;
                        const budget = project.budgetMax != null ? formatBudgetCompact(project.budgetMax) : project.budgetMin != null ? formatBudgetCompact(project.budgetMin) : '—';
                        const isCancelled = project.status === 'cancelled';
                        return (
                          <div key={project.id} className={`rounded-2xl bg-white border border-neutral-200/80 border-l-[3px] ${isCancelled ? 'border-l-red-400' : 'border-l-emerald-500'} p-5 hover:shadow-md hover:border-neutral-300/80 transition-all duration-200 shadow-sm group`}>
                            <div className="flex items-start justify-between gap-2 mb-3">
                              <div className={`w-9 h-9 rounded-xl ${isCancelled ? 'bg-red-50 border border-red-100/60' : 'bg-emerald-50 border border-emerald-100/60'} flex items-center justify-center shrink-0`}>
                                <FaFolder className={`${isCancelled ? 'text-red-400' : 'text-emerald-500'} text-sm`} />
                              </div>
                              <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full ${isCancelled ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'}`}>
                                {isCancelled ? 'Cancelled' : 'Completed'}
                              </span>
                            </div>
                            <h4 className="text-sm font-bold text-neutral-900 mb-1 truncate group-hover:text-[#3B5BDB] transition-colors">{project.title}</h4>
                            <p className="text-xs text-neutral-500 mb-0.5 leading-relaxed">{project.productionHouseName ?? '—'} · {formatDateRange(project.startDate, project.endDate)}</p>
                            <div className="flex items-center gap-3 my-3">
                              <span className="flex items-center gap-1.5 text-[11px] text-neutral-500 bg-neutral-50 px-2 py-1 rounded-md border border-neutral-100">
                                <FaUsers className="w-2.5 h-2.5 text-neutral-400" />
                                {crewCount} roles
                              </span>
                              {project._count != null && (
                                <span className="flex items-center gap-1.5 text-[11px] text-neutral-500 bg-neutral-50 px-2 py-1 rounded-md border border-neutral-100">
                                  <FaTruck className="w-2.5 h-2.5 text-neutral-400" />
                                  {project._count.bookings} bookings
                                </span>
                              )}
                            </div>
                            <p className={`text-sm font-bold mb-3 ${isCancelled ? 'text-neutral-400' : 'text-emerald-600'}`}>{budget}</p>
                            <div className="flex items-center gap-2">
                              <Link to={`/dashboard/projects/${project.id}`} className="flex-1 text-[11px] py-2 border border-neutral-200 text-neutral-600 rounded-xl hover:bg-neutral-50 hover:border-neutral-300 text-center flex items-center justify-center gap-1.5 transition-all font-semibold">
                                <FaMessage className="w-2.5 h-2.5" /> View Details
                              </Link>
                            </div>
                          </div>
                        );
                      })
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
