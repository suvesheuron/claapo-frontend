import { Link } from 'react-router-dom';
import { useEffect, useState, useMemo } from 'react';
import { FaPlus, FaUsers, FaTruck, FaHouse, FaFolder, FaChevronLeft, FaChevronRight, FaXmark, FaEye, FaMagnifyingGlass, FaCalendar, FaUser, FaMessage, FaPeopleGroup } from 'react-icons/fa6';
import DashboardHeader from '../components/DashboardHeader';
import DashboardSidebar from '../components/DashboardSidebar';
import AppFooter from '../components/AppFooter';
import RoleIndicator from '../components/RoleIndicator';
import { useApiQuery } from '../hooks/useApiQuery';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

const statusConfig = {
  draft:       { bg: 'bg-[#F3F4F6]', border: 'border-neutral-200', text: 'text-neutral-600', dot: 'bg-neutral-400', label: 'Draft' },
  open:        { bg: 'bg-[#DBEAFE]', border: 'border-[#93C5FD]', text: 'text-[#1D4ED8]', dot: 'bg-[#3678F1]', label: 'Open' },
  active:      { bg: 'bg-[#DBEAFE]', border: 'border-[#93C5FD]', text: 'text-[#1D4ED8]', dot: 'bg-[#3678F1]', label: 'Active' },
  in_progress: { bg: 'bg-[#FEF9E6]', border: 'border-[#FDE68A]', text: 'text-[#92400E]', dot: 'bg-[#F4C430]', label: 'In Progress' },
  completed:   { bg: 'bg-[#D1FAE5]', border: 'border-[#6EE7B7]', text: 'text-[#065F46]', dot: 'bg-[#22C55E]', label: 'Completed' },
  cancelled:   { bg: 'bg-[#FEE2E2]', border: 'border-[#FCA5A5]', text: 'text-[#B91C1C]', dot: 'bg-red-400', label: 'Cancelled' },
} as const;

interface Project {
  id: string;
  title: string;
  status: keyof typeof statusConfig;
  startDate: string;
  endDate: string;
  productionHouseName?: string | null;
  locationCity?: string | null;
  _count?: { bookings: number };
}
interface ProjectsApiResponse { items: Project[]; meta: { total: number } }

interface CalendarCell { d: number; muted: boolean; project?: Project | null }
interface PanelData { date: number; month: string; year: number; project: Project | null }

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

function buildCalendar(year: number, month: number, projects: Project[]): CalendarCell[] {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevDays = new Date(year, month, 0).getDate();

  // Build a map: day -> project
  const dayMap: Record<number, Project> = {};
  for (const p of projects) {
    const start = new Date(p.startDate);
    const end = new Date(p.endDate);
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      if (d.getFullYear() === year && d.getMonth() === month) {
        dayMap[d.getDate()] = p;
      }
    }
  }

  const cells: CalendarCell[] = [];
  for (let i = firstDay - 1; i >= 0; i--) cells.push({ d: prevDays - i, muted: true });
  for (let day = 1; day <= daysInMonth; day++) cells.push({ d: day, muted: false, project: dayMap[day] ?? null });
  const rem = 7 - (cells.length % 7);
  if (rem < 7) for (let d2 = 1; d2 <= rem; d2++) cells.push({ d: d2, muted: true });
  return cells;
}

export default function CompanyDashboard() {
  useEffect(() => { document.title = 'Dashboard – Claapo'; }, []);

  const today = new Date();
  const [monthOffset, setMonthOffset] = useState(0);
  const [panel, setPanel] = useState<PanelData | null>(null);

  const { data: projectsData, loading } = useApiQuery<ProjectsApiResponse>('/projects?limit=100');
  const projects = projectsData?.items ?? [];

  const displayDate = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1);
  const monthLabel = MONTHS[displayDate.getMonth()];
  const yearLabel = displayDate.getFullYear();

  const calendarDays = useMemo(
    () => buildCalendar(displayDate.getFullYear(), displayDate.getMonth(), projects),
    [displayDate.getFullYear(), displayDate.getMonth(), projects]
  );

  const activeProjects = projects.filter(p => p.status === 'active' || p.status === 'in_progress' || p.status === 'open').length;
  const crewHired = projects.reduce((acc, p) => acc + (p._count?.bookings ?? 0), 0);

  const openPanel = (cell: CalendarCell) => {
    if (cell.muted) return;
    setPanel({ date: cell.d, month: monthLabel, year: yearLabel, project: cell.project ?? null });
  };

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
                  <h1 className="text-xl font-bold text-neutral-900">Company Dashboard</h1>
                  <p className="text-sm text-neutral-500 mt-0.5">Manage projects and crew scheduling</p>
                </div>
                <RoleIndicator />
              </div>

              {/* Quick actions */}
              <div className="grid grid-cols-3 gap-3 mb-5">
                {[
                  { icon: FaPlus,  title: 'New Project', desc: 'Start a production', to: '/dashboard/projects/new', primary: true },
                  { icon: FaUsers, title: 'Find Crew',    desc: 'Hire freelancers',  to: '/dashboard/search' },
                  { icon: FaTruck, title: 'Find Vendors', desc: 'Equipment & services', to: '/dashboard/search?type=vendors' },
                ].map((action) => (
                  <Link key={action.title} to={action.to} className={`rounded-2xl p-4 border flex items-center gap-3 group transition-all hover:shadow-sm ${
                    action.primary ? 'bg-[#3678F1] border-[#3678F1] text-white hover:bg-[#2563d4]' : 'bg-white border-neutral-200 text-neutral-700 hover:border-[#3678F1]'
                  }`}>
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${action.primary ? 'bg-white/20' : 'bg-[#F3F4F6] group-hover:bg-[#EEF4FF]'}`}>
                      <action.icon className={`text-sm ${action.primary ? 'text-white' : 'text-neutral-500 group-hover:text-[#3678F1]'}`} />
                    </div>
                    <div className="min-w-0">
                      <p className={`text-sm font-bold truncate ${action.primary ? 'text-white' : 'text-neutral-900'}`}>{action.title}</p>
                      <p className={`text-xs truncate ${action.primary ? 'text-blue-100' : 'text-neutral-500'}`}>{action.desc}</p>
                    </div>
                  </Link>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                {/* Calendar (full width at top, 3/4 on desktop) */}
                <div className="lg:col-span-3 order-2 lg:order-1 space-y-4">
                  <div className="rounded-2xl bg-white border border-neutral-200 p-4 sm:p-5">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-base font-bold text-neutral-900">Project Calendar</h2>
                      <div className="flex items-center gap-2">
                        <button type="button" onClick={() => setMonthOffset((o) => o - 1)} className="w-8 h-8 rounded-lg border border-neutral-200 flex items-center justify-center text-neutral-600 hover:bg-neutral-100 transition-colors">
                          <FaChevronLeft className="text-xs" />
                        </button>
                        <span className="text-sm font-semibold text-neutral-900 min-w-[120px] text-center">{monthLabel} {yearLabel}</span>
                        <button type="button" onClick={() => setMonthOffset((o) => o + 1)} className="w-8 h-8 rounded-lg border border-neutral-200 flex items-center justify-center text-neutral-600 hover:bg-neutral-100 transition-colors">
                          <FaChevronRight className="text-xs" />
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-7 gap-1 mb-1">
                      {DAYS.map((day) => (
                        <div key={day} className="text-center text-[11px] font-semibold text-neutral-400 py-1">{day}</div>
                      ))}
                    </div>
                    <div className="grid grid-cols-7 gap-1">
                      {calendarDays.map((cell, i) => {
                        const cfg = cell.project ? (statusConfig[cell.project.status] ?? statusConfig.draft) : null;
                        return (
                          <button key={i} type="button" onClick={() => openPanel(cell)} disabled={cell.muted} className={`cal-cell rounded-xl border text-center p-1 sm:p-1.5 min-h-[44px] sm:min-h-[52px] flex flex-col items-center justify-center gap-0.5 ${
                            cell.muted ? 'bg-white border-neutral-100 text-neutral-300 cursor-default' :
                            cfg ? `${cfg.bg} ${cfg.border} ${cfg.text} cursor-pointer` : 'bg-white border-neutral-200 text-neutral-600 hover:bg-[#F3F4F6] cursor-pointer'
                          } ${panel?.date === cell.d && !cell.muted ? 'ring-2 ring-[#3678F1] ring-offset-1' : ''}`}>
                            <span className="text-[11px] sm:text-xs font-semibold leading-none">{cell.d}</span>
                            {cell.project && !cell.muted && (
                              <span className="text-[8px] sm:text-[9px] font-medium leading-tight truncate w-full opacity-80">{cell.project.title}</span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                    <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-neutral-100">
                      {Object.entries(statusConfig).map(([key, val]) => (
                        <div key={key} className="flex items-center gap-2">
                          <div className={`w-2.5 h-2.5 rounded-full ${val.dot}`} />
                          <span className="text-xs text-neutral-500">{val.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Stats — below calendar as per PRD layout */}
                  <div className="grid grid-cols-2 gap-3">
                    {loading ? (
                      <>
                        {[1,2].map(i => <div key={i} className="rounded-2xl bg-white border border-neutral-200 p-4 animate-pulse h-20" />)}
                      </>
                    ) : (
                      <>
                        <div className="rounded-2xl bg-white border border-neutral-200 p-4">
                          <p className="text-xs text-neutral-500">Active Projects</p>
                          <p className="text-2xl font-bold mt-1 text-[#3678F1]">{activeProjects}</p>
                        </div>
                        <div className="rounded-2xl bg-white border border-neutral-200 p-4">
                          <p className="text-xs text-neutral-500">Crew Hired</p>
                          <p className="text-2xl font-bold mt-1 text-[#3678F1]">{crewHired}</p>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Quick links — Requests, Chat, Notifications */}
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: 'Requests', icon: FaUsers, to: '/dashboard/projects', desc: 'View all booking requests' },
                      { label: 'Chats',    icon: FaMessage, to: '/dashboard/conversations', desc: 'Open conversations' },
                      { label: 'Notifications', icon: FaFolder, to: '/dashboard/projects', desc: 'Project updates' },
                    ].map(({ label, icon: Icon, to, desc }) => (
                      <Link key={label} to={to} className="rounded-2xl bg-white border border-neutral-200 p-4 hover:border-[#3678F1] hover:shadow-sm transition-all group">
                        <div className="w-8 h-8 rounded-lg bg-[#EEF4FF] flex items-center justify-center mb-2 group-hover:bg-[#DBEAFE]">
                          <Icon className="text-[#3678F1] text-sm" />
                        </div>
                        <p className="text-sm font-bold text-neutral-900">{label}</p>
                        <p className="text-xs text-neutral-500 mt-0.5">{desc}</p>
                      </Link>
                    ))}
                  </div>
                </div>

                {/* Right sidebar */}
                <div className="space-y-4 order-1 lg:order-2">
                  <div className="rounded-2xl bg-white border border-neutral-200 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
                        <FaFolder className="w-3.5 h-3.5 text-[#3678F1]" />
                        <span>Ongoing Projects</span>
                      </h3>
                      <Link to="/dashboard/projects" className="text-xs text-[#3678F1] hover:underline">All</Link>
                    </div>
                    {loading ? (
                      <div className="space-y-2">
                        {[1,2,3].map(i => <div key={i} className="h-14 rounded-xl bg-neutral-100 animate-pulse" />)}
                      </div>
                    ) : projects.filter(p => p.status !== 'completed' && p.status !== 'cancelled').length === 0 ? (
                      <p className="text-xs text-neutral-400 text-center py-4">No ongoing projects</p>
                    ) : (
                      <div className="space-y-2">
                        {projects.filter(p => p.status !== 'completed' && p.status !== 'cancelled').slice(0,4).map((p) => {
                          const cfg = statusConfig[p.status] ?? statusConfig.draft;
                          return (
                            <Link to={`/dashboard/projects/${p.id}`} key={p.id} className="block rounded-xl border border-neutral-200 p-3 bg-[#FAFAFA] hover:border-[#3678F1] transition-colors">
                              <div className="flex items-start justify-between gap-2 mb-1">
                                <p className="text-xs font-bold text-neutral-900 truncate">{p.title}</p>
                                <span className={`text-[10px] px-2 py-0.5 rounded-full shrink-0 font-semibold ${cfg.bg} ${cfg.text}`}>{cfg.label}</span>
                              </div>
                              {p.productionHouseName && <p className="text-[11px] text-neutral-500 truncate">{p.productionHouseName}</p>}
                            </Link>
                          );
                        })}
                      </div>
                    )}
                    <Link to="/dashboard/projects" className="mt-3 rounded-xl block w-full py-2 text-xs text-[#3678F1] bg-[#EEF4FF] hover:bg-[#DBEAFE] text-center font-semibold transition-colors">
                      View All Projects
                    </Link>
                  </div>

                  <div className="rounded-2xl bg-white border border-neutral-200 p-4">
                    <h3 className="text-sm font-bold text-neutral-900 mb-3">Quick Actions</h3>
                    <div className="space-y-1.5">
                      <Link to="/dashboard/search" className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-[#F3F4F6] text-neutral-700 text-xs font-semibold hover:bg-[#EEF4FF] hover:text-[#3678F1] transition-colors">
                        <FaUsers className="w-3 h-3 text-neutral-500" /> Search Crew
                      </Link>
                      <Link to="/dashboard/search?type=vendors" className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-[#F3F4F6] text-neutral-700 text-xs font-semibold hover:bg-[#EEF4FF] hover:text-[#3678F1] transition-colors">
                        <FaTruck className="w-3 h-3 text-neutral-500" /> Search Vendors
                      </Link>
                      <Link to="/dashboard/team" className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-[#F3F4F6] text-neutral-700 text-xs font-semibold hover:bg-[#EEF4FF] hover:text-[#3678F1] transition-colors">
                        <FaPeopleGroup className="w-3 h-3 text-neutral-500" /> Manage Team
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <AppFooter />
        </main>
      </div>

      {/* Sliding panel */}
      {panel && (
        <>
          <div className="fixed inset-0 bg-black/20 z-40 lg:bg-transparent" onClick={() => setPanel(null)} />
          <aside className="fixed right-0 top-0 h-full w-80 bg-white border-l border-neutral-200 shadow-2xl z-50 flex flex-col panel-enter">
            <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100">
              <div>
                <p className="text-xs text-neutral-400">{panel.month} {panel.year}</p>
                <h3 className="text-lg font-bold text-neutral-900">{panel.date} {panel.month}</h3>
              </div>
              <button type="button" onClick={() => setPanel(null)} className="w-8 h-8 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-500 hover:bg-neutral-200 transition-colors">
                <FaXmark className="text-sm" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-4">
              {panel.project ? (
                <>
                  {(() => { const cfg = statusConfig[panel.project.status] ?? statusConfig.draft; return (
                    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full mb-4 ${cfg.bg} ${cfg.text}`}>{cfg.label}</span>
                  ); })()}
                  <div className="rounded-xl bg-[#F3F4F6] p-4 space-y-3 mb-4">
                    {[
                      { label: 'Project', value: panel.project.title },
                      { label: 'Production House', value: panel.project.productionHouseName ?? '—' },
                      { label: 'Location', value: panel.project.locationCity ?? '—' },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex justify-between gap-2">
                        <span className="text-xs text-neutral-500 shrink-0">{label}</span>
                        <span className="text-xs font-semibold text-neutral-900 text-right">{value}</span>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-2">
                    <Link to={`/dashboard/projects/${panel.project.id}`} className="flex items-center justify-center gap-2 w-full rounded-xl py-2.5 bg-[#3678F1] text-white text-sm font-semibold hover:bg-[#2563d4] transition-colors">
                      <FaEye className="w-3.5 h-3.5" /> View Project
                    </Link>
                    <Link to="/dashboard/search" className="flex items-center justify-center gap-2 w-full rounded-xl py-2.5 bg-[#F3F4F6] text-neutral-700 text-sm font-semibold hover:bg-neutral-200 transition-colors">
                      <FaUsers className="w-3.5 h-3.5" /> Manage Crew
                    </Link>
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <div className="w-12 h-12 rounded-full bg-[#F3F4F6] flex items-center justify-center mx-auto mb-3">
                    <FaFolder className="text-neutral-400 text-lg" />
                  </div>
                  <p className="text-sm font-semibold text-neutral-900 mb-1">No project scheduled</p>
                  <p className="text-xs text-neutral-500 mb-5">This date is available for production</p>
                  <Link to="/dashboard/projects/new" className="rounded-xl inline-flex items-center gap-2 px-5 py-2.5 bg-[#3678F1] text-white text-sm font-bold hover:bg-[#2563d4] transition-colors">
                    <FaPlus className="w-3 h-3" /> Create Project
                  </Link>
                </div>
              )}
            </div>
          </aside>
        </>
      )}
    </div>
  );
}
