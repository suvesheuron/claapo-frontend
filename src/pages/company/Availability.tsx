import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  FaChevronLeft, FaChevronRight, FaXmark, FaCircle, FaEye, FaPlus, FaCalendar, FaFileInvoice,
} from 'react-icons/fa6';
import DashboardHeader from '../../components/DashboardHeader';
import DashboardSidebar from '../../components/DashboardSidebar';
import AppFooter from '../../components/AppFooter';
import RoleIndicator from '../../components/RoleIndicator';
import { useApiQuery } from '../../hooks/useApiQuery';
import { companyNavLinks } from '../../navigation/dashboardNav';

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
  dateIso: string;
}

const statusConfig: Record<string, { bg: string; border: string; text: string; dot: string; label: string }> = {
  draft:     { bg: 'bg-neutral-50', border: 'border-neutral-200', text: 'text-neutral-500', dot: 'bg-neutral-400', label: 'Draft' },
  open:     { bg: 'bg-blue-50/70', border: 'border-blue-200/60', text: 'text-blue-600', dot: 'bg-blue-500', label: 'Open' },
  active:   { bg: 'bg-blue-50/70', border: 'border-blue-200/60', text: 'text-blue-600', dot: 'bg-blue-500', label: 'Active' },
  completed: { bg: 'bg-emerald-50/70', border: 'border-emerald-200/60', text: 'text-emerald-600', dot: 'bg-emerald-500', label: 'Completed' },
  cancelled: { bg: 'bg-red-50/70', border: 'border-red-200/60', text: 'text-red-600', dot: 'bg-red-400', label: 'Cancelled' },
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

  const isToday = (cell: CalendarCell) =>
    !cell.muted &&
    cell.d === today.getDate() &&
    displayDate.getMonth() === today.getMonth() &&
    yearLabel === today.getFullYear();

  const openPanel = (cell: CalendarCell) => {
    if (cell.muted) return;
    const m = displayDate.getMonth();
    const y = displayDate.getFullYear();
    const dateIso = `${y}-${String(m + 1).padStart(2, '0')}-${String(cell.d).padStart(2, '0')}`;
    setPanel({ date: cell.d, month: monthLabel, year: yearLabel, project: cell.project ?? null, dateIso });
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-[#F8F9FB] w-full">
      <DashboardHeader />

      <div className="flex-1 flex min-h-0 overflow-hidden">
        <DashboardSidebar links={companyNavLinks} />

        <main className="flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden">
          <div className="flex-1 min-h-0 overflow-auto">
            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-6 xl:px-8 py-6">

              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <div className="flex items-center gap-2.5 mb-1">
                    <div className="w-1 h-6 rounded-full bg-[#3B5BDB]" />
                    <h1 className="text-xl font-bold text-neutral-900 tracking-tight">Project Availability</h1>
                  </div>
                  <p className="text-sm text-neutral-500 ml-3.5">View and manage project schedule across months</p>
                </div>
                <div className="flex items-center gap-3">
                  <RoleIndicator />
                  <Link
                    to="/dashboard/projects/new"
                    className="flex items-center gap-2 px-4 py-2.5 bg-[#3B5BDB] text-white rounded-xl text-sm font-semibold hover:bg-[#2f4ac2] transition-all shadow-sm shadow-blue-500/20 hover:shadow-md hover:shadow-blue-500/25"
                  >
                    <FaPlus className="w-3 h-3" />
                    <span>New Project</span>
                  </Link>
                </div>
              </div>

              {/* Calendar card */}
              <div className="bg-white rounded-2xl border border-neutral-200/80 p-5 sm:p-6 shadow-sm hover:shadow-md transition-shadow duration-300">
                {/* Month nav */}
                <div className="flex items-center justify-between mb-5">
                  <button
                    onClick={() => setMonthOffset((o) => o - 1)}
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 transition-all border border-transparent hover:border-neutral-200"
                  >
                    <FaChevronLeft className="w-3 h-3" />
                  </button>
                  <div className="text-center">
                    <span className="text-lg font-bold text-neutral-900 tracking-tight">{monthLabel}</span>
                    <span className="ml-2 text-lg font-bold text-[#3B5BDB]/80">{yearLabel}</span>
                  </div>
                  <button
                    onClick={() => setMonthOffset((o) => o + 1)}
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 transition-all border border-transparent hover:border-neutral-200"
                  >
                    <FaChevronRight className="w-3 h-3" />
                  </button>
                </div>

                {/* Day headers */}
                <div className="grid grid-cols-7 mb-2">
                  {DAYS.map((d) => (
                    <div key={d} className="text-center text-[11px] font-semibold text-neutral-400 uppercase tracking-wider py-2">
                      {d}
                    </div>
                  ))}
                </div>

                {/* Calendar grid */}
                <div className="grid grid-cols-7 gap-1">
                  {calendarDays.map((cell, i) => {
                    const proj = cell.project;
                    const cfg = proj ? (statusConfig[proj.status] ?? statusConfig.draft) : null;
                    const todayCell = isToday(cell);
                    return (
                      <button
                        key={i}
                        onClick={() => openPanel(cell)}
                        disabled={cell.muted}
                        className={`relative min-h-[60px] sm:min-h-[68px] rounded-xl flex flex-col items-center justify-center gap-0.5 p-1.5 transition-all duration-200 group border
                          ${cell.muted
                            ? 'opacity-25 cursor-default border-transparent'
                            : 'cursor-pointer hover:ring-2 hover:ring-[#3B5BDB]/10 hover:shadow-sm'
                          }
                          ${proj && !cell.muted
                            ? cfg!.bg + ' ' + 'border-' + cfg!.border.replace('border-', '')
                            : !cell.muted
                              ? 'border-neutral-100 hover:border-neutral-200 hover:bg-neutral-50/50'
                              : 'border-transparent'
                          }
                          ${todayCell && !proj ? 'ring-2 ring-[#3B5BDB]/20 bg-blue-50/30 border-blue-100' : ''}
                          ${todayCell && proj ? 'ring-2 ring-[#3B5BDB]/25' : ''}`}
                      >
                        {todayCell && (
                          <span className="absolute top-1 right-1.5 w-1.5 h-1.5 rounded-full bg-[#3B5BDB]" />
                        )}
                        <span className={`text-xs font-semibold leading-none ${cell.muted ? 'text-neutral-300' : proj ? cfg!.text : todayCell ? 'text-[#3B5BDB]' : 'text-neutral-700'}`}>
                          {cell.d}
                        </span>
                        {proj && !cell.muted && (
                          <span className={`text-[9px] font-medium leading-tight text-center line-clamp-2 w-full ${cfg!.text} opacity-80`}>
                            {proj.title}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Legend */}
                <div className="flex flex-wrap items-center gap-3 mt-5 pt-5 border-t border-neutral-100">
                  {Object.entries(statusConfig).map(([, cfg]) => (
                    <div key={cfg.label} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-neutral-50/80">
                      <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                      <span className="text-[11px] font-medium text-neutral-500">{cfg.label}</span>
                    </div>
                  ))}
                  <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-neutral-50/80">
                    <span className="w-2 h-2 rounded-full bg-neutral-200 border border-neutral-300" />
                    <span className="text-[11px] font-medium text-neutral-500">No Projects</span>
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
          <div className="absolute inset-0 bg-black/25 backdrop-blur-sm" onClick={() => setPanel(null)} />
          <aside className="absolute right-0 top-0 h-full w-[340px] bg-white/95 backdrop-blur-md border-l border-neutral-200/60 shadow-2xl z-50 flex flex-col panel-enter">
            <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100">
              <div>
                <p className="text-[11px] text-neutral-400 uppercase tracking-widest font-semibold">
                  {panel.month} {panel.year}
                </p>
                <p className="text-xl font-bold text-neutral-900 tracking-tight mt-0.5">Day {panel.date}</p>
              </div>
              <button
                onClick={() => setPanel(null)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 transition-all"
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
                      <div className={`rounded-xl p-4 mb-5 ${cfg.bg} border ${cfg.border}`}>
                        <div className="flex items-center gap-2 mb-2.5">
                          <FaCircle className={`text-[7px] ${cfg.text}`} />
                          <span className={`text-[11px] font-semibold uppercase tracking-wider ${cfg.text}`}>
                            {cfg.label}
                          </span>
                        </div>
                        <h3 className="font-bold text-neutral-900 text-base leading-snug mb-1">{panel.project.title}</h3>
                        {panel.project.productionHouseName && (
                          <p className="text-xs text-neutral-500 mt-1">{panel.project.productionHouseName}</p>
                        )}
                      </div>
                    );
                  })()}

                  <div className="space-y-3 text-sm">
                    {panel.project._count && (
                      <div className="flex justify-between items-center py-2.5 px-1 border-b border-neutral-100">
                        <span className="text-neutral-500 text-xs">Bookings</span>
                        <span className="font-bold text-neutral-900 text-sm tabular-nums">{panel.project._count.bookings}</span>
                      </div>
                    )}
                  </div>

                  <Link
                    to={`/dashboard/projects/${panel.project.id}`}
                    className="mt-6 w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#3B5BDB] text-white rounded-xl text-sm font-semibold hover:bg-[#2f4ac2] transition-all shadow-sm shadow-blue-500/20 hover:shadow-md"
                  >
                    <FaEye className="w-3.5 h-3.5" />
                    View Project Details
                  </Link>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-56 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center mb-4 border border-blue-100/60">
                    <FaCalendar className="text-[#3B5BDB] text-xl" />
                  </div>
                  <p className="text-sm font-bold text-neutral-800 mb-1">No Project Scheduled</p>
                  <p className="text-xs text-neutral-400 mb-5 leading-relaxed">This day is available for<br />new projects</p>
                  <Link
                    to="/dashboard/projects/new"
                    className="flex items-center gap-2 px-5 py-2.5 bg-[#3B5BDB] text-white rounded-xl text-sm font-semibold hover:bg-[#2f4ac2] transition-all shadow-sm shadow-blue-500/20"
                  >
                    <FaPlus className="w-3 h-3" />
                    Create Project
                  </Link>
                </div>
              )}
            </div>
            <div className="px-5 py-4 border-t border-neutral-100 shrink-0">
              <Link
                to={`/dashboard/invoices?issuedOn=${panel.dateIso}`}
                className="flex w-full items-center justify-center gap-2 rounded-xl py-2.5 bg-[#EEF4FF] text-[#3B5BDB] text-sm font-semibold border border-[#3B5BDB]/20 hover:bg-[#DBEAFE] transition-all"
              >
                <FaFileInvoice className="w-3.5 h-3.5" /> Invoices issued on this date
              </Link>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
