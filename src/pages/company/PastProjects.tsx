import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FaHouse, FaCalendar, FaFolder, FaMagnifyingGlass, FaUser,
  FaFileInvoice, FaMessage, FaCircleInfo, FaUsers, FaTruck,
  FaPeopleGroup,
} from 'react-icons/fa6';
import DashboardHeader from '../../components/DashboardHeader';
import DashboardSidebar from '../../components/DashboardSidebar';
import AppFooter from '../../components/AppFooter';
import { useApiQuery } from '../../hooks/useApiQuery';
import { formatBudgetCompact } from '../../utils/currency';

const navLinks = [
  { icon: FaHouse,           label: 'Dashboard',      to: '/dashboard' },
  { icon: FaCalendar,        label: 'Availability',   to: '/dashboard/company-availability' },
  { icon: FaFolder,          label: 'Projects',        to: '/dashboard/projects' },
  { icon: FaFolder,          label: 'Past Projects',   to: '/dashboard/company-past-projects' },
  { icon: FaMagnifyingGlass, label: 'Search',          to: '/dashboard/search' },
  { icon: FaMessage,         label: 'Chat',            to: '/dashboard/conversations' },
  { icon: FaPeopleGroup,     label: 'Team',            to: '/dashboard/team' },
  { icon: FaUser,            label: 'Profile',         to: '/dashboard/company-profile' },
];

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
    <div className="h-screen flex flex-col overflow-hidden bg-[#F3F4F6] w-full">
      <DashboardHeader />

      <div className="flex-1 flex min-h-0 overflow-hidden">
        <DashboardSidebar links={navLinks} />

        <main className="flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden">
          <div className="flex-1 min-h-0 overflow-auto">
            <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-6 xl:px-8 py-5">

              <div className="mb-5">
                <h1 className="text-xl font-bold text-neutral-900">Past Projects</h1>
                <p className="text-sm text-neutral-500 mt-0.5">Completed productions with crew, vendor, and invoice records</p>
              </div>

              {/* Info banner */}
              <div className="rounded-2xl bg-[#EEF4FF] border border-[#BFDBFE] p-3 mb-5 flex items-start gap-2">
                <FaCircleInfo className="text-[#3678F1] mt-0.5 shrink-0 text-xs" />
                <p className="text-xs text-[#1D4ED8]">
                  You can also browse completed projects by navigating to past months on your{' '}
                  <Link to="/dashboard/company-availability" className="font-semibold underline">
                    Availability Calendar
                  </Link>.
                </p>
              </div>

              {error && (
                <div className="rounded-2xl bg-red-50 border border-red-200 p-4 mb-4 text-sm text-red-700">
                  {error}
                </div>
              )}

              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[1,2,3,4,5,6].map(i => (
                    <div key={i} className="rounded-2xl bg-white border border-neutral-200 p-4 animate-pulse h-44" />
                  ))}
                </div>
              ) : (
                <>
                  <p className="text-xs text-neutral-400 mb-4">{pastProjects.length} past project{pastProjects.length !== 1 ? 's' : ''}</p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {pastProjects.length === 0 ? (
                      <div className="col-span-full rounded-2xl bg-white border border-neutral-200 p-8 text-center">
                        <FaFolder className="text-neutral-300 text-2xl mx-auto mb-2" />
                        <p className="text-sm font-medium text-neutral-600">No past projects yet</p>
                        <p className="text-xs text-neutral-400 mt-1">Completed or cancelled projects will appear here</p>
                      </div>
                    ) : (
                      pastProjects.map((project) => {
                        const crewCount = project.roles?.reduce((s, r) => s + r.qty, 0) ?? 0;
                        const budget = project.budgetMax != null ? formatBudgetCompact(project.budgetMax) : project.budgetMin != null ? formatBudgetCompact(project.budgetMin) : '—';
                        return (
                          <div key={project.id} className="rounded-2xl bg-white border border-neutral-200 p-4 hover:shadow-md hover:border-neutral-300 transition-all">
                            <div className="flex items-start justify-between gap-2 mb-3">
                              <div className="w-9 h-9 rounded-xl bg-[#D1FAE5] flex items-center justify-center shrink-0">
                                <FaFolder className="text-[#22C55E] text-sm" />
                              </div>
                              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${project.status === 'cancelled' ? 'bg-[#FEE2E2] text-[#B91C1C]' : 'bg-[#D1FAE5] text-[#065F46]'}`}>
                                {project.status === 'cancelled' ? 'Cancelled' : 'Completed'}
                              </span>
                            </div>
                            <h4 className="text-sm font-bold text-neutral-900 mb-1 truncate">{project.title}</h4>
                            <p className="text-xs text-neutral-500 mb-0.5">{project.productionHouseName ?? '—'} · {formatDateRange(project.startDate, project.endDate)}</p>
                            <div className="flex items-center gap-3 my-2">
                              <span className="flex items-center gap-1 text-[11px] text-neutral-500">
                                <FaUsers className="w-2.5 h-2.5 text-neutral-400" />
                                {crewCount} roles
                              </span>
                              {project._count != null && (
                                <span className="flex items-center gap-1 text-[11px] text-neutral-500">
                                  <FaTruck className="w-2.5 h-2.5 text-neutral-400" />
                                  {project._count.bookings} bookings
                                </span>
                              )}
                            </div>
                            <p className="text-sm font-bold text-[#22C55E] mb-3">{budget}</p>
                            <div className="flex items-center gap-2">
                              <Link to={`/dashboard/projects/${project.id}`} className="flex-1 text-[11px] py-1.5 border border-neutral-200 text-neutral-600 rounded-xl hover:bg-neutral-50 text-center flex items-center justify-center gap-1 transition-colors">
                                <FaMessage className="w-2.5 h-2.5" /> View
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
