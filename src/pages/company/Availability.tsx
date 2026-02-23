import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FaHouse, FaFolder, FaCalendar, FaMagnifyingGlass,
  FaChevronLeft, FaChevronRight, FaXmark, FaCircle, FaEye, FaPlus, FaUser,
} from 'react-icons/fa6';
import DashboardHeader from '../../components/DashboardHeader';
import DashboardSidebar from '../../components/DashboardSidebar';
import AppFooter from '../../components/AppFooter';
import RoleIndicator from '../../components/RoleIndicator';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];
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

// Month-keyed project data
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
  active:      { bg: 'bg-[#DBEAFE]', border: 'border-[#93C5FD]', text: 'text-[#1D4ED8]', dot: 'bg-[#3678F1]', label: 'Active' },
  planning:    { bg: 'bg-[#F3F4F6]', border: 'border-neutral-300', text: 'text-neutral-600', dot: 'bg-neutral-400', label: 'Planning' },
  'in-progress': { bg: 'bg-[#FEF9E6]', border: 'border-[#FDE68A]', text: 'text-[#92400E]', dot: 'bg-[#F4C430]', label: 'In Progress' },
  completed:   { bg: 'bg-[#D1FAE5]', border: 'border-[#6EE7B7]', text: 'text-[#065F46]', dot: 'bg-[#22C55E]', label: 'Completed' },
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

const navLinks = [
  { icon: FaHouse,           label: 'Dashboard',    to: '/dashboard' },
  { icon: FaCalendar,        label: 'Availability', to: '/dashboard/company-availability' },
  { icon: FaFolder,          label: 'Projects',     to: '/dashboard/projects' },
  { icon: FaFolder,          label: 'Past Projects', to: '/dashboard/company-past-projects' },
  { icon: FaMagnifyingGlass, label: 'Search',       to: '/dashboard/search' },
  { icon: FaUser,            label: 'Profile',      to: '/dashboard/company-profile' },
];

export default function CompanyAvailability() {
  useEffect(() => { document.title = 'Availability – CrewCall'; }, []);

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
                    const cfg = proj ? statusConfig[proj.status] : null;
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
                            {proj.name}
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
                    const cfg = statusConfig[panel.project.status];
                    return (
                      <div className={`rounded-xl p-4 mb-4 ${cfg.bg} border ${cfg.border}`}>
                        <div className="flex items-center gap-2 mb-2">
                          <FaCircle className={`text-[8px] ${cfg.text}`} />
                          <span className={`text-xs font-semibold uppercase tracking-wide ${cfg.text}`}>
                            {cfg.label}
                          </span>
                        </div>
                        <h3 className="font-bold text-neutral-900 text-base mb-1">{panel.project.name}</h3>
                      </div>
                    );
                  })()}

                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between py-2 border-b border-neutral-100">
                      <span className="text-neutral-500">Crew Members</span>
                      <span className="font-semibold text-neutral-900">{panel.project.crew}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-neutral-100">
                      <span className="text-neutral-500">Vendors</span>
                      <span className="font-semibold text-neutral-900">{panel.project.vendors}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-neutral-100">
                      <span className="text-neutral-500">Budget</span>
                      <span className="font-semibold text-neutral-900">{panel.project.budget}</span>
                    </div>
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
