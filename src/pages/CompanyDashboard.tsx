import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { FaPlus, FaUsers, FaTruck, FaHouse, FaFolder, FaChevronLeft, FaChevronRight, FaXmark, FaCircle, FaEye, FaMagnifyingGlass, FaCalendar, FaUser } from 'react-icons/fa6';
import DashboardHeader from '../components/DashboardHeader';
import DashboardSidebar from '../components/DashboardSidebar';
import AppFooter from '../components/AppFooter';
import RoleIndicator from '../components/RoleIndicator';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface ProjectInfo {
  name: string;
  crew: number;
  vendors: number;
  budget: string;
  status: 'active' | 'planning' | 'in-progress' | 'completed';
  id: number;
}

interface CalendarCell {
  d: number;
  muted: boolean;
  project?: ProjectInfo | null;
}

interface PanelData {
  date: number;
  month: string;
  year: number;
  project: ProjectInfo | null;
}

const BASE_YEAR = 2025;
const BASE_MONTH = 0;

const projectsByMonth: Record<number, Record<number, ProjectInfo>> = {
  0: { // Jan 2025
    8:  { name: 'Commercial Shoot', crew: 12, vendors: 3, budget: '₹8.5L', status: 'active', id: 1 },
    9:  { name: 'Commercial Shoot', crew: 12, vendors: 3, budget: '₹8.5L', status: 'active', id: 1 },
    10: { name: 'Commercial Shoot', crew: 12, vendors: 3, budget: '₹8.5L', status: 'active', id: 1 },
    15: { name: 'Documentary', crew: 8, vendors: 2, budget: '₹5.2L', status: 'planning', id: 2 },
    16: { name: 'Documentary', crew: 8, vendors: 2, budget: '₹5.2L', status: 'planning', id: 2 },
    17: { name: 'Documentary', crew: 8, vendors: 2, budget: '₹5.2L', status: 'planning', id: 2 },
    22: { name: 'Music Video', crew: 6, vendors: 1, budget: '₹3.8L', status: 'in-progress', id: 3 },
    23: { name: 'Music Video', crew: 6, vendors: 1, budget: '₹3.8L', status: 'in-progress', id: 3 },
  },
  '-1': { // Dec 2024
    5:  { name: 'Brand Campaign', crew: 9, vendors: 2, budget: '₹6.1L', status: 'completed', id: 4 },
    6:  { name: 'Brand Campaign', crew: 9, vendors: 2, budget: '₹6.1L', status: 'completed', id: 4 },
    18: { name: 'Product Launch', crew: 14, vendors: 4, budget: '₹11.2L', status: 'completed', id: 5 },
    19: { name: 'Product Launch', crew: 14, vendors: 4, budget: '₹11.2L', status: 'completed', id: 5 },
    20: { name: 'Product Launch', crew: 14, vendors: 4, budget: '₹11.2L', status: 'completed', id: 5 },
  },
  '-2': { // Nov 2024
    12: { name: 'Music Festival', crew: 20, vendors: 6, budget: '₹18L', status: 'completed', id: 6 },
    13: { name: 'Music Festival', crew: 20, vendors: 6, budget: '₹18L', status: 'completed', id: 6 },
    14: { name: 'Music Festival', crew: 20, vendors: 6, budget: '₹18L', status: 'completed', id: 6 },
    25: { name: 'Web Series Ep 3', crew: 11, vendors: 3, budget: '₹9.5L', status: 'completed', id: 7 },
    26: { name: 'Web Series Ep 3', crew: 11, vendors: 3, budget: '₹9.5L', status: 'completed', id: 7 },
  },
};

const statusConfig = {
  active:        { bg: 'bg-[#DBEAFE]', border: 'border-[#93C5FD]', text: 'text-[#1D4ED8]', dot: 'bg-[#3678F1]', label: 'Active' },
  planning:      { bg: 'bg-[#F3F4F6]', border: 'border-neutral-200', text: 'text-neutral-600', dot: 'bg-neutral-400', label: 'Planning' },
  'in-progress': { bg: 'bg-[#FEF9E6]', border: 'border-[#FDE68A]', text: 'text-[#92400E]', dot: 'bg-[#F4C430]', label: 'In Progress' },
  completed:     { bg: 'bg-[#D1FAE5]', border: 'border-[#6EE7B7]', text: 'text-[#065F46]', dot: 'bg-[#22C55E]', label: 'Completed' },
};

function buildCalendar(monthOffset: number): CalendarCell[] {
  const d = new Date(BASE_YEAR, BASE_MONTH + monthOffset, 1);
  const year = d.getFullYear();
  const month = d.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevDays = new Date(year, month, 0).getDate();
  const data = projectsByMonth[monthOffset] ?? {};

  const cells: CalendarCell[] = [];
  for (let i = firstDay - 1; i >= 0; i--) cells.push({ d: prevDays - i, muted: true });
  for (let day = 1; day <= daysInMonth; day++) cells.push({ d: day, muted: false, project: data[day] ?? null });
  const rem = 7 - (cells.length % 7);
  if (rem < 7) for (let d2 = 1; d2 <= rem; d2++) cells.push({ d: d2, muted: true });
  return cells;
}

const quickActions = [
  { icon: FaPlus, title: 'New Project', desc: 'Start a new production', to: '/dashboard/projects/new', primary: true },
  { icon: FaUsers, title: 'Find Crew', desc: 'Hire freelancers', to: '/dashboard/search' },
  { icon: FaTruck, title: 'Find Vendors', desc: 'Equipment & services', to: '/dashboard/search?type=vendors' },
];

const navLinks = [
  { icon: FaHouse,           label: 'Dashboard',    to: '/dashboard' },
  { icon: FaCalendar,        label: 'Availability', to: '/dashboard/company-availability' },
  { icon: FaFolder,          label: 'Projects',     to: '/dashboard/projects' },
  { icon: FaFolder,          label: 'Past Projects', to: '/dashboard/company-past-projects' },
  { icon: FaMagnifyingGlass, label: 'Search',       to: '/dashboard/search' },
  { icon: FaUser,            label: 'Profile',      to: '/dashboard/company-profile' },
];

const ongoingProjects = [
  { id: 1, name: 'Commercial Shoot', dates: 'Jan 8–10', crew: 12, status: 'active' as const },
  { id: 2, name: 'Documentary', dates: 'Jan 15–17', crew: 8, status: 'planning' as const },
  { id: 3, name: 'Music Video', dates: 'Jan 22–23', crew: 6, status: 'in-progress' as const },
];

export default function CompanyDashboard() {
  useEffect(() => { document.title = 'Dashboard – CrewCall'; }, []);

  const [monthOffset, setMonthOffset] = useState(0);
  const [panel, setPanel] = useState<PanelData | null>(null);

  const displayDate = new Date(BASE_YEAR, BASE_MONTH + monthOffset, 1);
  const monthLabel = MONTHS[displayDate.getMonth()];
  const yearLabel = displayDate.getFullYear();
  const calendarDays = buildCalendar(monthOffset);

  const openPanel = (cell: CalendarCell) => {
    if (cell.muted) return;
    setPanel({ date: cell.d, month: monthLabel, year: yearLabel, project: cell.project ?? null });
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-[#F3F4F6] w-full">
      <DashboardHeader />

      <div className="flex-1 flex min-h-0 overflow-hidden">
        <DashboardSidebar links={navLinks} />

        {/* Main */}
        <main className="flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden">
          <div className="flex-1 min-h-0 overflow-auto">
            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-6 xl:px-8 py-5">

              {/* Page header */}
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h1 className="text-xl font-bold text-neutral-900">Company Dashboard</h1>
                  <p className="text-sm text-neutral-500 mt-0.5">Manage projects and crew scheduling</p>
                </div>
                <RoleIndicator />
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-3 gap-3 mb-5">
                {[
                  { label: 'Active Projects', value: '3', color: 'text-[#3678F1]' },
                  { label: 'Crew Hired', value: '26', color: 'text-neutral-900' },
                  { label: 'This Month', value: '₹8.5L', color: 'text-[#22C55E]' },
                ].map(({ label, value, color }) => (
                  <div key={label} className="rounded-2xl bg-white border border-neutral-200 p-4">
                    <p className="text-xs text-neutral-500">{label}</p>
                    <p className={`text-xl font-bold mt-1 ${color}`}>{value}</p>
                  </div>
                ))}
              </div>

              {/* Quick actions */}
              <div className="grid grid-cols-3 gap-3 mb-5">
                {quickActions.map((action) => (
                  <Link
                    key={action.title}
                    to={action.to}
                    className={`rounded-2xl p-4 border flex items-center gap-3 group transition-all hover:shadow-sm ${
                      action.primary
                        ? 'bg-[#3678F1] border-[#3678F1] text-white hover:bg-[#2563d4]'
                        : 'bg-white border-neutral-200 text-neutral-700 hover:border-[#3678F1]'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      action.primary ? 'bg-white/20' : 'bg-[#F3F4F6] group-hover:bg-[#EEF4FF]'
                    }`}>
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
                {/* Calendar */}
                <div className="lg:col-span-3 order-2 lg:order-1">
                  <div className="rounded-2xl bg-white border border-neutral-200 p-4 sm:p-5">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-base font-bold text-neutral-900">Project Calendar</h2>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setMonthOffset((o) => o - 1)}
                          className="w-8 h-8 rounded-lg border border-neutral-200 flex items-center justify-center text-neutral-600 hover:bg-neutral-100 transition-colors"
                        >
                          <FaChevronLeft className="text-xs" />
                        </button>
                        <span className="text-sm font-semibold text-neutral-900 min-w-[120px] text-center">
                          {monthLabel} {yearLabel}
                        </span>
                        <button
                          type="button"
                          onClick={() => setMonthOffset((o) => o + 1)}
                          className="w-8 h-8 rounded-lg border border-neutral-200 flex items-center justify-center text-neutral-600 hover:bg-neutral-100 transition-colors"
                        >
                          <FaChevronRight className="text-xs" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-7 gap-1 mb-1">
                      {DAYS.map((day) => (
                        <div key={day} className="text-center text-[11px] font-semibold text-neutral-400 py-1">
                          {day}
                        </div>
                      ))}
                    </div>

                    <div className="grid grid-cols-7 gap-1">
                      {calendarDays.map((cell, i) => {
                        const cfg = cell.project ? statusConfig[cell.project.status] : null;
                        return (
                          <button
                            key={i}
                            type="button"
                            onClick={() => openPanel(cell)}
                            disabled={cell.muted}
                            className={`
                              cal-cell rounded-xl border text-center p-1 sm:p-1.5
                              min-h-[44px] sm:min-h-[52px] flex flex-col items-center justify-center gap-0.5
                              ${cell.muted
                                ? 'bg-white border-neutral-100 text-neutral-300 cursor-default'
                                : cfg
                                  ? `${cfg.bg} ${cfg.border} ${cfg.text} cursor-pointer`
                                  : 'bg-white border-neutral-200 text-neutral-600 hover:bg-[#F3F4F6] cursor-pointer'}
                              ${panel?.date === cell.d && !cell.muted ? 'ring-2 ring-[#3678F1] ring-offset-1' : ''}
                            `}
                          >
                            <span className="text-[11px] sm:text-xs font-semibold leading-none">{cell.d}</span>
                            {cell.project && !cell.muted && (
                              <span className="text-[8px] sm:text-[9px] font-medium leading-tight truncate w-full opacity-80">
                                {cell.project.name}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {/* Legend */}
                    <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-neutral-100">
                      {Object.entries(statusConfig).map(([key, val]) => (
                        <div key={key} className="flex items-center gap-2">
                          <div className={`w-2.5 h-2.5 rounded-full ${val.dot}`} />
                          <span className="text-xs text-neutral-500">{val.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right sidebar */}
                <div className="space-y-4 order-1 lg:order-2">
                  <div className="rounded-2xl bg-white border border-neutral-200 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-bold text-neutral-900">Ongoing Projects</h3>
                      <Link to="/dashboard/projects" className="text-xs text-[#3678F1] hover:underline">All</Link>
                    </div>
                    <div className="space-y-2">
                      {ongoingProjects.map((p) => {
                        const cfg = statusConfig[p.status];
                        return (
                          <div key={p.id} className="rounded-xl border border-neutral-200 p-3 bg-[#FAFAFA]">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <p className="text-xs font-bold text-neutral-900 truncate">{p.name}</p>
                              <span className={`text-[10px] px-2 py-0.5 rounded-full shrink-0 font-semibold ${cfg.bg} ${cfg.text}`}>
                                {cfg.label}
                              </span>
                            </div>
                            <p className="text-[11px] text-neutral-500">{p.dates} · {p.crew} crew</p>
                          </div>
                        );
                      })}
                    </div>
                    <Link
                      to="/dashboard/projects"
                      className="mt-3 rounded-xl block w-full py-2 text-xs text-[#3678F1] bg-[#EEF4FF] hover:bg-[#DBEAFE] text-center font-semibold transition-colors"
                    >
                      View All Projects
                    </Link>
                  </div>

                  <div className="rounded-2xl bg-white border border-neutral-200 p-4">
                    <h3 className="text-sm font-bold text-neutral-900 mb-3">Quick Links</h3>
                    <div className="space-y-1.5">
                      <Link
                        to="/dashboard/search"
                        className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-[#F3F4F6] text-neutral-700 text-xs font-semibold hover:bg-neutral-200 transition-colors"
                      >
                        <FaUsers className="w-3 h-3 text-neutral-500" /> Search Crew
                      </Link>
                      <Link
                        to="/dashboard/search?type=vendors"
                        className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-[#F3F4F6] text-neutral-700 text-xs font-semibold hover:bg-neutral-200 transition-colors"
                      >
                        <FaTruck className="w-3 h-3 text-neutral-500" /> Search Vendors
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
          <aside className="fixed right-0 top-0 h-full w-80 bg-white border-l border-neutral-200 shadow-2xl z-50 side-panel flex flex-col panel-enter">
            <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100">
              <div>
                <p className="text-xs text-neutral-400">{panel.month} {panel.year}</p>
                <h3 className="text-lg font-bold text-neutral-900">{panel.date} {panel.month}</h3>
              </div>
              <button
                type="button"
                onClick={() => setPanel(null)}
                className="w-8 h-8 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-500 hover:bg-neutral-200 transition-colors"
              >
                <FaXmark className="text-sm" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4">
              {panel.project ? (
                <>
                  <div className="flex items-center gap-2 mb-4">
                    {(() => { const cfg = statusConfig[panel.project.status]; return (
                      <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full ${cfg.bg} ${cfg.text}`}>
                        <FaCircle className="text-[8px]" style={{ color: cfg.dot.replace('bg-', '') }} />
                        {cfg.label}
                      </span>
                    ); })()}
                  </div>

                  <div className="rounded-xl bg-[#F3F4F6] p-4 space-y-3 mb-4">
                    {[
                      { label: 'Project', value: panel.project.name },
                      { label: 'Crew Assigned', value: `${panel.project.crew} members` },
                      { label: 'Vendors', value: `${panel.project.vendors} vendors` },
                      { label: 'Budget', value: panel.project.budget },
                      { label: 'Status', value: statusConfig[panel.project.status].label },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex justify-between gap-2">
                        <span className="text-xs text-neutral-500 shrink-0">{label}</span>
                        <span className="text-xs font-semibold text-neutral-900 text-right">{value}</span>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-2">
                    <Link
                      to={`/dashboard/projects/${panel.project.id}`}
                      className="flex items-center justify-center gap-2 w-full rounded-xl py-2.5 bg-[#3678F1] text-white text-sm font-semibold hover:bg-[#2563d4] transition-colors"
                    >
                      <FaEye className="w-3.5 h-3.5" /> View Project
                    </Link>
                    <Link
                      to="/dashboard/search"
                      className="flex items-center justify-center gap-2 w-full rounded-xl py-2.5 bg-[#F3F4F6] text-neutral-700 text-sm font-semibold hover:bg-neutral-200 transition-colors"
                    >
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
                    <Link
                      to="/dashboard/projects/new"
                      className="rounded-xl inline-flex items-center gap-2 px-5 py-2.5 bg-[#3678F1] text-white text-sm font-bold hover:bg-[#2563d4] transition-colors"
                    >
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
