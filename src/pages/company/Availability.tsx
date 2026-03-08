import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  FaHouse, FaFolder, FaCalendar, FaMagnifyingGlass,
  FaChevronLeft, FaChevronRight, FaXmark, FaCircle, FaEye, FaPlus, FaUser,
  FaMessage, FaPeopleGroup,
} from 'react-icons/fa6';
import DashboardHeader from '../../components/DashboardHeader';
import DashboardSidebar from '../../components/DashboardSidebar';
import AppFooter from '../../components/AppFooter';
import RoleIndicator from '../../components/RoleIndicator';
import { useApiQuery } from '../../hooks/useApiQuery';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface ProjectItem {
  id: string;
  title: string;
  status: string;
  startDate: string;
  endDate: string;
  productionHouseName?: string | null;
  _count?: { bookings: number };
}

interface CalendarCell {
  d: number;
  muted: boolean;
  project?: ProjectItem | null;
}

interface PanelData {
  date: number;
  month: string;
  year: number;
  project: ProjectItem | null;
}

const statusConfig: Record<string, { bg: string; border: string; text: string; dot: string; label: string }> = {
  draft:     { bg: 'bg-[#F3F4F6]', border: 'border-neutral-300', text: 'text-neutral-600', dot: 'bg-neutral-400', label: 'Draft' },
  open:     { bg: 'bg-[#DBEAFE]', border: 'border-[#93C5FD]', text: 'text-[#1D4ED8]', dot: 'bg-[#3678F1]', label: 'Open' },
  active:   { bg: 'bg-[#DBEAFE]', border: 'border-[#93C5FD]', text: 'text-[#1D4ED8]', dot: 'bg-[#3678F1]', label: 'Active' },
  completed: { bg: 'bg-[#D1FAE5]', border: 'border-[#6EE7B7]', text: 'text-[#065F46]', dot: 'bg-[#22C55E]', label: 'Completed' },
  cancelled: { bg: 'bg-[#FEE2E2]', border: 'border-[#FCA5A5]', text: 'text-[#B91C1C]', dot: 'bg-red-400', label: 'Cancelled' },
};

function buildCalendar(year: number, month: number, projects: ProjectItem[]): CalendarCell[] {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevDays = new Date(year, month, 0).getDate();
  const dayMap: Record<number, ProjectItem> = {};
  for (const p of projects) {
    const start = new Date(p.startDate);
    const end = new Date(p.endDate);
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      if (d.getFullYear() === year && d.getMonth() === month) dayMap[d.getDate()] = p;
    }
  }
  const cells: CalendarCell[] = [];
  for (let i = firstDay - 1; i >= 0; i--) cells.push({ d: prevDays - i, muted: true });
  for (let day = 1; day <= daysInMonth; day++) cells.push({ d: day, muted: false, project: dayMap[day] ?? null });
  const rem = 7 - (cells.length % 7);
  if (rem < 7) for (let d2 = 1; d2 <= rem; d2++) cells.push({ d: d2, muted: true });
  return cells;
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

export default function CompanyAvailability() {
  useEffect(() => { document.title = 'Availability – Claapo'; }, []);

  const today = new Date();
  const [monthOffset, setMonthOffset] = useState(0);
  const [panel, setPanel] = useState<PanelData | null>(null);

  const { data: projectsData } = useApiQuery<{ items: ProjectItem[] }>('/projects?limit=100');
  const projects = projectsData?.items ?? [];

  const displayDate = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1);
  const monthLabel = MONTHS[displayDate.getMonth()];
  const yearLabel = displayDate.getFullYear();
  const calendarDays = useMemo(
    () => buildCalendar(yearLabel, displayDate.getMonth(), projects),
    [yearLabel, displayDate.getMonth(), projects]
  );

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

              {/* Header */}
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h1 className="text-xl font-bold text-neutral-900">Project Availability</h1>
                  <p className="text-sm text-neutral-500 mt-0.5">View and manage project schedule across months</p>
                </div>
                <div className="flex items-center gap-3">
                  <RoleIndicator />
                  <Link
                    to="/dashboard/projects/new"
                    className="flex items-center gap-2 px-3 py-2 bg-[#3678F1] text-white rounded-xl text-sm font-medium hover:bg-[#2c65d4] transition-colors"
                  >
                    <FaPlus className="w-3.5 h-3.5" />
                    <span>New Project</span>
                  </Link>
                </div>
              </div>

              {/* Calendar card */}
              <div className="bg-white rounded-2xl border border-neutral-200 p-4 sm:p-5 shadow-sm">
                {/* Month nav */}
                <div className="flex items-center justify-between mb-4">
                  <button
                    onClick={() => setMonthOffset((o) => o - 1)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-500 hover:bg-[#EEF4FF] hover:text-[#3678F1] transition-colors"
                  >
                    <FaChevronLeft className="w-3 h-3" />
                  </button>
                  <div className="text-center">
                    <span className="text-base font-bold text-neutral-900">{monthLabel}</span>
                    <span className="ml-2 text-base font-bold text-[#3678F1]">{yearLabel}</span>
                  </div>
                  <button
                    onClick={() => setMonthOffset((o) => o + 1)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-500 hover:bg-[#EEF4FF] hover:text-[#3678F1] transition-colors"
                  >
                    <FaChevronRight className="w-3 h-3" />
                  </button>
                </div>

                {/* Day headers */}
                <div className="grid grid-cols-7 mb-1">
                  {DAYS.map((d) => (
                    <div key={d} className="text-center text-[11px] font-semibold text-neutral-400 uppercase tracking-wide py-1.5">
                      {d}
                    </div>
                  ))}
                </div>

                {/* Calendar grid */}
                <div className="grid grid-cols-7 gap-0.5">
                  {calendarDays.map((cell, i) => {
                    const proj = cell.project;
                    const cfg = proj ? (statusConfig[proj.status] ?? statusConfig.draft) : null;
                    return (
                      <button
                        key={i}
                        onClick={() => openPanel(cell)}
                        disabled={cell.muted}
                        className={`relative min-h-[56px] sm:min-h-[64px] rounded-xl flex flex-col items-center justify-center gap-0.5 p-1.5 transition-all group
                          ${cell.muted ? 'opacity-30 cursor-default' : 'cursor-pointer hover:bg-[#F3F4F6]'}
                          ${proj && !cell.muted ? cfg!.bg + ' border ' + cfg!.border : ''}`}
                      >
                        <span className={`text-xs font-semibold leading-none ${cell.muted ? 'text-neutral-300' : proj ? cfg!.text : 'text-neutral-700'}`}>
                          {cell.d}
                        </span>
                        {proj && !cell.muted && (
                          <span className={`text-[9px] font-medium leading-tight text-center line-clamp-2 w-full ${cfg!.text}`}>
                            {proj.title}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Legend */}
                <div className="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t border-neutral-100">
                  {Object.entries(statusConfig).map(([, cfg]) => (
                    <div key={cfg.label} className="flex items-center gap-1.5">
                      <span className={`w-2.5 h-2.5 rounded-full ${cfg.dot}`} />
                      <span className="text-xs text-neutral-500">{cfg.label}</span>
                    </div>
                  ))}
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#F3F4F6] border border-neutral-300" />
                    <span className="text-xs text-neutral-500">No Projects</span>
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
        <div className="fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-[1px]" onClick={() => setPanel(null)} />
          <aside className="absolute right-0 top-0 h-full w-80 bg-white border-l border-neutral-200 shadow-2xl z-50 flex flex-col panel-enter">
            <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100">
              <div>
                <p className="text-xs text-neutral-500 uppercase tracking-wider font-medium">
                  {panel.month} {panel.year}
                </p>
                <p className="text-lg font-bold text-neutral-900">Day {panel.date}</p>
              </div>
              <button
                onClick={() => setPanel(null)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-400 hover:bg-[#F3F4F6] hover:text-neutral-700 transition-colors"
              >
                <FaXmark className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              {panel.project ? (
                <>
                  {(() => {
                    const cfg = statusConfig[panel.project.status] ?? statusConfig.draft;
                    return (
                      <div className={`rounded-xl p-4 mb-4 ${cfg.bg} border ${cfg.border}`}>
                        <div className="flex items-center gap-2 mb-2">
                          <FaCircle className={`text-[8px] ${cfg.text}`} />
                          <span className={`text-xs font-semibold uppercase tracking-wide ${cfg.text}`}>
                            {cfg.label}
                          </span>
                        </div>
                        <h3 className="font-bold text-neutral-900 text-base mb-1">{panel.project.title}</h3>
                        {panel.project.productionHouseName && (
                          <p className="text-xs text-neutral-600 mt-0.5">{panel.project.productionHouseName}</p>
                        )}
                      </div>
                    );
                  })()}

                  <div className="space-y-3 text-sm">
                    {panel.project._count && (
                      <div className="flex justify-between py-2 border-b border-neutral-100">
                        <span className="text-neutral-500">Bookings</span>
                        <span className="font-semibold text-neutral-900">{panel.project._count.bookings}</span>
                      </div>
                    )}
                  </div>

                  <Link
                    to={`/dashboard/projects/${panel.project.id}`}
                    className="mt-5 w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#3678F1] text-white rounded-xl text-sm font-medium hover:bg-[#2c65d4] transition-colors"
                  >
                    <FaEye className="w-3.5 h-3.5" />
                    View Project Details
                  </Link>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-48 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-[#EEF4FF] flex items-center justify-center mb-3">
                    <FaCalendar className="text-[#3678F1] text-lg" />
                  </div>
                  <p className="text-sm font-semibold text-neutral-700 mb-1">No Project Scheduled</p>
                  <p className="text-xs text-neutral-400 mb-4">This day is free for new projects</p>
                  <Link
                    to="/dashboard/projects/new"
                    className="flex items-center gap-2 px-4 py-2 bg-[#3678F1] text-white rounded-xl text-sm font-medium hover:bg-[#2c65d4] transition-colors"
                  >
                    <FaPlus className="w-3 h-3" />
                    Create Project
                  </Link>
                </div>
              )}
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
