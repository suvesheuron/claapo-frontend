import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useEffect, useState, useMemo, useCallback } from 'react';
import { FaPlus, FaUsers, FaTruck, FaFolder, FaXmark, FaEye, FaMessage, FaPeopleGroup, FaFileInvoice, FaBan, FaChevronLeft, FaChevronRight } from 'react-icons/fa6';
import DashboardHeader from '../components/DashboardHeader';
import DashboardSidebar from '../components/DashboardSidebar';
import AppFooter from '../components/AppFooter';
import RoleIndicator from '../components/RoleIndicator';
import { useApiQuery } from '../hooks/useApiQuery';
import { companyNavLinks } from '../navigation/dashboardNav';
import { api, ApiException } from '../services/api';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

const statusConfig = {
  draft:       { bg: 'bg-[#F3F4F6]', border: 'border-neutral-200', text: 'text-neutral-600', dot: 'bg-neutral-400', label: 'Draft' },
  open:        { bg: 'bg-[#DBEAFE]', border: 'border-[#93C5FD]', text: 'text-[#1D4ED8]', dot: 'bg-[#3B5BDB]', label: 'Open' },
  active:      { bg: 'bg-[#DBEAFE]', border: 'border-[#93C5FD]', text: 'text-[#1D4ED8]', dot: 'bg-[#3B5BDB]', label: 'Active' },
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

// Priority order for calendar display: active/open > draft > completed > cancelled
const STATUS_PRIORITY: Record<string, number> = { active: 0, open: 1, in_progress: 2, draft: 3, completed: 4, cancelled: 5 };

interface CalendarCell { d: number; muted: boolean; projects: Project[] }
interface PanelData { date: number; month: string; year: number; projects: Project[]; dateIso: string }

function localDateKey(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

interface DayChatMessage {
  id: string;
  content: string | null;
  createdAt: string;
  senderLabel: string;
  conversationId: string;
}

function buildCalendar(year: number, month: number, projects: Project[]): CalendarCell[] {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Map: day -> all projects that span that day
  const dayMap: Record<number, Project[]> = {};
  for (const p of projects) {
    const start = new Date(p.startDate);
    const end = new Date(p.endDate);
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      if (d.getFullYear() === year && d.getMonth() === month) {
        const day = d.getDate();
        if (!dayMap[day]) dayMap[day] = [];
        dayMap[day].push(p);
      }
    }
  }

  // Sort each day's projects by priority (active first, cancelled last)
  for (const day in dayMap) {
    dayMap[day].sort((a, b) => (STATUS_PRIORITY[a.status] ?? 9) - (STATUS_PRIORITY[b.status] ?? 9));
  }

  const cells: CalendarCell[] = [];
  for (let i = 0; i < firstDay; i++) cells.push({ d: 0, muted: true, projects: [] });
  for (let day = 1; day <= daysInMonth; day++) cells.push({ d: day, muted: false, projects: dayMap[day] ?? [] });
  while (cells.length % 7 !== 0) cells.push({ d: 0, muted: true, projects: [] });
  return cells;
}

export default function CompanyDashboard() {
  useEffect(() => { document.title = 'Dashboard – Claapo'; }, []);

  const today = new Date();
  const [calendarYear, setCalendarYear] = useState(() => today.getFullYear());
  const [calendarMonth, setCalendarMonth] = useState(() => today.getMonth());
  const [panel, setPanel] = useState<PanelData | null>(null);
  const [dayChatsForProject, setDayChatsForProject] = useState<string | null>(null);
  const [dayChatsLoading, setDayChatsLoading] = useState(false);
  const [dayChatsItems, setDayChatsItems] = useState<DayChatMessage[]>([]);
  const [dayChatsError, setDayChatsError] = useState<string | null>(null);

  const { data: projectsData, loading } = useApiQuery<ProjectsApiResponse>('/projects?limit=100');
  const projects = projectsData?.items ?? [];

  const displayDate = new Date(calendarYear, calendarMonth, 1);
  const monthLabel = MONTHS[displayDate.getMonth()];
  const yearLabel = displayDate.getFullYear();

  const goPrevMonth = () => {
    const d = new Date(calendarYear, calendarMonth - 1, 1);
    setCalendarYear(d.getFullYear());
    setCalendarMonth(d.getMonth());
  };
  const goNextMonth = () => {
    const d = new Date(calendarYear, calendarMonth + 1, 1);
    setCalendarYear(d.getFullYear());
    setCalendarMonth(d.getMonth());
  };

  const calendarDays = useMemo(
    () => buildCalendar(displayDate.getFullYear(), displayDate.getMonth(), projects),
    [calendarYear, calendarMonth, projects]
  );

  const activeProjects = projects.filter(p => p.status === 'active' || p.status === 'in_progress' || p.status === 'open').length;
  const crewHired = projects.reduce((acc, p) => acc + (p._count?.bookings ?? 0), 0);

  const isToday = (cell: CalendarCell) => {
    return !cell.muted && cell.d > 0 && cell.d === today.getDate() && displayDate.getMonth() === today.getMonth() && displayDate.getFullYear() === today.getFullYear();
  };

  const openPanel = (cell: CalendarCell) => {
    if (cell.muted || cell.d === 0) return;
    const m = displayDate.getMonth();
    const y = displayDate.getFullYear();
    const dateIso = `${y}-${String(m + 1).padStart(2, '0')}-${String(cell.d).padStart(2, '0')}`;
    setDayChatsForProject(null);
    setDayChatsItems([]);
    setDayChatsError(null);
    setPanel({ date: cell.d, month: monthLabel, year: yearLabel, projects: cell.projects, dateIso });
  };

  const fetchProjectDayChats = useCallback(async (projectId: string, dateIso: string) => {
    type ConvRow = { id: string; project?: { id: string } | null };
    type MsgRow = {
      id: string;
      content: string | null;
      createdAt: string;
      sender?: { displayName?: string };
    };
    const convRes = await api.get<{ items: ConvRow[] }>('/conversations?page=1&limit=100');
    const convs = (convRes.items ?? []).filter((c) => c.project?.id === projectId);
    const out: DayChatMessage[] = [];
    for (const c of convs) {
      let cursor: string | undefined;
      for (let page = 0; page < 20; page++) {
        const q = cursor ? `?limit=100&cursor=${encodeURIComponent(cursor)}` : '?limit=100';
        const msgRes = await api.get<{ items: MsgRow[]; nextCursor: string | null }>(`/conversations/${c.id}/messages${q}`);
        const batch = msgRes.items ?? [];
        for (const m of batch) {
          if (localDateKey(m.createdAt) === dateIso) {
            out.push({
              id: m.id,
              content: m.content,
              createdAt: m.createdAt,
              senderLabel: m.sender?.displayName ?? '—',
              conversationId: c.id,
            });
          }
        }
        cursor = msgRes.nextCursor ?? undefined;
        if (!cursor || batch.length === 0) break;
      }
    }
    out.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    return out;
  }, []);

  const toggleDayChats = useCallback(
    (projectId: string, dateIso: string) => {
      if (dayChatsForProject === projectId) {
        setDayChatsForProject(null);
        setDayChatsItems([]);
        setDayChatsError(null);
        return;
      }
      setDayChatsForProject(projectId);
      setDayChatsLoading(true);
      setDayChatsError(null);
      setDayChatsItems([]);
      void fetchProjectDayChats(projectId, dateIso)
        .then(setDayChatsItems)
        .catch((err) => {
          setDayChatsError(err instanceof ApiException ? err.payload.message : 'Could not load chats.');
          setDayChatsItems([]);
        })
        .finally(() => setDayChatsLoading(false));
    },
    [dayChatsForProject, fetchProjectDayChats],
  );

  const closePanel = () => {
    setPanel(null);
    setDayChatsForProject(null);
    setDayChatsItems([]);
    setDayChatsError(null);
  };

  const fmtChatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

  const greetingHour = today.getHours();
  const greeting = greetingHour < 12 ? 'Good morning' : greetingHour < 17 ? 'Good afternoon' : 'Good evening';

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } }
  } satisfies Record<string, any>;

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-[#F8F9FB] w-full">
      <DashboardHeader />
      <div className="flex-1 flex min-h-0 overflow-hidden">
        <DashboardSidebar links={companyNavLinks} />
        <main className="flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-[#3B5BDB]/5 via-[#5B9DF9]/5 to-transparent rounded-full blur-3xl pointer-events-none" />
          <div className="flex-1 min-h-0 overflow-auto z-10">
            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-6 xl:px-8 py-5">
              
              <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">

              {/* Greeting banner */}
              <motion.div variants={itemVariants} className="relative rounded-3xl bg-white shadow-soft border border-neutral-100 px-8 py-6 overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-[#3B5BDB]/10 via-[#7c96ff]/5 to-transparent rounded-full blur-2xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
                <div className="absolute bottom-0 right-32 w-40 h-40 bg-[#5B9DF9]/10 rounded-full blur-2xl translate-y-1/2 pointer-events-none" />
                <div className="relative flex items-center justify-between z-10">
                  <div>
                    <h1 className="text-2xl font-extrabold text-neutral-900 tracking-tight">{greeting}</h1>
                    <p className="text-sm text-neutral-500 mt-1">Manage your projects and crew scheduling</p>
                  </div>
                  <RoleIndicator />
                </div>
              </motion.div>

              {/* Quick actions */}
              <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { icon: FaPlus,  title: 'New Project', desc: 'Start a production', to: '/dashboard/projects/new', primary: true },
                  { icon: FaUsers, title: 'Find Crew',    desc: 'Hire freelancers',  to: '/dashboard/search' },
                  { icon: FaTruck, title: 'Find Vendors', desc: 'Equipment & services', to: '/dashboard/search?type=vendors' },
                ].map((action) => (
                  <Link key={action.title} to={action.to} className={`rounded-3xl p-5 border flex items-center gap-4 group transition-all duration-300 ${
                    action.primary
                      ? 'bg-gradient-to-br from-[#3B5BDB] to-[#2f4ac2] border-transparent text-white shadow-float hover:shadow-[0_15px_40px_-10px_rgba(59,91,219,0.3)] hover:-translate-y-1'
                      : 'bg-white shadow-soft border-neutral-100 text-neutral-700 hover:shadow-float hover:border-[#3B5BDB]/30 hover:-translate-y-1'
                  }`}>
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110 ${
                      action.primary ? 'bg-white/20' : 'bg-gradient-to-br from-[#EEF4FF] border border-[#3B5BDB]/10'
                    }`}>
                      <action.icon className={`text-lg ${action.primary ? 'text-white' : 'text-[#3B5BDB]'}`} />
                    </div>
                    <div className="min-w-0">
                      <p className={`text-base font-bold truncate ${action.primary ? 'text-white' : 'text-neutral-900'}`}>{action.title}</p>
                      <p className={`text-xs mt-0.5 truncate ${action.primary ? 'text-blue-100' : 'text-neutral-500'}`}>{action.desc}</p>
                    </div>
                  </Link>
                ))}
              </motion.div>

              <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Calendar (full width at top, 3/4 on desktop) */}
                <div className="lg:col-span-3 order-2 lg:order-1 space-y-6">
                  <div className="rounded-3xl bg-white shadow-soft border border-neutral-100 p-6">
                    <div className="flex items-center justify-between mb-5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#EEF4FF] to-[#DBEAFE] flex items-center justify-center">
                          <FaFolder className="text-[#3B5BDB] text-xs" />
                        </div>
                        <h2 className="text-base font-bold text-neutral-900">Project Calendar</h2>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={goPrevMonth}
                          aria-label="Previous month"
                          className="w-9 h-9 rounded-xl border border-neutral-200/80 bg-white text-neutral-600 hover:bg-[#EEF4FF] hover:border-[#3B5BDB]/30 hover:text-[#3B5BDB] flex items-center justify-center transition-all shrink-0"
                        >
                          <FaChevronLeft className="text-xs" />
                        </button>
                        <span className="text-sm font-semibold text-neutral-900 min-w-[130px] text-center tabular-nums px-1">{monthLabel} {yearLabel}</span>
                        <button
                          type="button"
                          onClick={goNextMonth}
                          aria-label="Next month"
                          className="w-9 h-9 rounded-xl border border-neutral-200/80 bg-white text-neutral-600 hover:bg-[#EEF4FF] hover:border-[#3B5BDB]/30 hover:text-[#3B5BDB] flex items-center justify-center transition-all shrink-0"
                        >
                          <FaChevronRight className="text-xs" />
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-7 gap-1 mb-2">
                      {DAYS.map((day) => (
                        <div key={day} className="text-center text-[11px] font-semibold text-neutral-400 py-1.5 uppercase tracking-wide">{day}</div>
                      ))}
                    </div>
                    <div className="grid grid-cols-7 gap-1">
                      {calendarDays.map((cell, i) => {
                        if (cell.muted && cell.d === 0) {
                          return <div key={i} className="min-h-[44px] sm:min-h-[54px]" aria-hidden />;
                        }
                        // Primary project is the highest-priority non-cancelled project; fall back to first
                        const primary = cell.projects.find(p => p.status !== 'cancelled') ?? cell.projects[0] ?? null;
                        const cfg = primary ? (statusConfig[primary.status] ?? statusConfig.draft) : null;
                        const hasMultiple = cell.projects.length > 1;
                        const todayCell = isToday(cell);
                        return (
                          <button key={i} type="button" onClick={() => openPanel(cell)} disabled={cell.muted} className={`cal-cell rounded-xl border text-center p-1 sm:p-1.5 min-h-[44px] sm:min-h-[54px] flex flex-col items-center justify-center gap-0.5 relative transition-all duration-150 ${
                            cell.muted ? 'bg-neutral-50/50 border-transparent text-neutral-300 cursor-default' :
                            cfg ? `${cfg.bg} ${cfg.border} ${cfg.text} cursor-pointer hover:shadow-sm hover:brightness-[0.97]` : 'bg-white border-neutral-200/60 text-neutral-600 hover:bg-neutral-50 hover:border-neutral-300 cursor-pointer'
                          } ${todayCell && !cfg ? 'ring-2 ring-[#3B5BDB]/30 border-[#3B5BDB]/40 bg-[#EEF4FF]/40' : ''} ${todayCell && cfg ? 'ring-2 ring-[#3B5BDB]/40 ring-offset-1' : ''} ${panel?.date === cell.d && !cell.muted ? 'ring-2 ring-[#3B5BDB] ring-offset-1' : ''}`}>
                            <span className={`text-[11px] sm:text-xs font-semibold leading-none ${todayCell ? 'text-[#3B5BDB]' : ''}`}>{cell.d}</span>
                            {primary && !cell.muted && (
                              <span className="text-[8px] sm:text-[9px] font-medium leading-tight truncate w-full opacity-80">{primary.title}</span>
                            )}
                            {hasMultiple && !cell.muted && (
                              <span className="absolute top-0.5 right-0.5 w-3.5 h-3.5 rounded-full bg-[#3B5BDB] text-white text-[7px] font-bold flex items-center justify-center leading-none shadow-sm">{cell.projects.length}</span>
                            )}
                            {todayCell && !cfg && (
                              <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#3B5BDB]" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                    <div className="flex flex-wrap gap-x-5 gap-y-1.5 mt-4 pt-4 border-t border-neutral-100">
                      {Object.entries(statusConfig).map(([key, val]) => (
                        <div key={key} className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${val.dot}`} />
                          <span className="text-[11px] text-neutral-500 font-medium">{val.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Stats — below calendar as per PRD layout */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {loading ? (
                      <>
                        {[1,2].map(i => <div key={i} className="rounded-3xl bg-white border border-neutral-100 shadow-soft p-5 animate-pulse h-24" />)}
                      </>
                    ) : (
                      <>
                        <div className="rounded-3xl bg-white shadow-soft border border-neutral-100 p-5 flex items-center gap-5 hover:shadow-float transition-shadow group">
                          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#EEF4FF] to-white border border-[#3B5BDB]/10 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                            <FaFolder className="text-[#3B5BDB] text-xl" />
                          </div>
                          <div>
                            <p className="text-xs uppercase tracking-widest text-neutral-500 font-bold">Active Projects</p>
                            <p className="text-3xl font-extrabold mt-1 text-neutral-900">{activeProjects}</p>
                          </div>
                        </div>
                        <div className="rounded-3xl bg-white shadow-soft border border-neutral-100 p-5 flex items-center gap-5 hover:shadow-float transition-shadow group">
                          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#ECFDF5] to-white border border-emerald-500/10 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                            <FaUsers className="text-emerald-500 text-xl" />
                          </div>
                          <div>
                            <p className="text-xs uppercase tracking-widest text-neutral-500 font-bold">Crew Hired</p>
                            <p className="text-3xl font-extrabold mt-1 text-neutral-900">{crewHired}</p>
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Quick links — Requests, Chat, Notifications */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[
                      { label: 'Requests', icon: FaUsers, to: '/dashboard/projects', desc: 'Booking requests', color: 'from-[#3B5BDB] to-[#5B9DF9]' },
                      { label: 'Chats',    icon: FaMessage, to: '/dashboard/conversations', desc: 'Open conversations', color: 'from-[#7C3AED] to-[#A78BFA]' },
                      { label: 'Notifications', icon: FaFolder, to: '/dashboard/projects', desc: 'Project updates', color: 'from-[#EA580C] to-[#FB923C]' },
                    ].map(({ label, icon: Icon, to, desc, color }) => (
                      <Link key={label} to={to} className="rounded-3xl bg-white border border-neutral-100 shadow-soft p-5 hover:shadow-float hover:-translate-y-1 transition-all duration-300 group">
                        <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center mb-4 shadow-sm group-hover:scale-110 transition-transform`}>
                          <Icon className="text-white text-lg" />
                        </div>
                        <p className="text-base font-bold text-neutral-900">{label}</p>
                        <p className="text-xs text-neutral-500 mt-1">{desc}</p>
                      </Link>
                    ))}
                  </div>
                </div>

                {/* Right sidebar */}
                <div className="space-y-6 order-1 lg:order-2">
                  <div className="rounded-3xl bg-white shadow-soft border border-neutral-100 p-6">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-[#EEF4FF] to-[#DBEAFE] flex items-center justify-center">
                          <FaFolder className="w-2.5 h-2.5 text-[#3B5BDB]" />
                        </div>
                        <span>Ongoing Projects</span>
                      </h3>
                      <Link to="/dashboard/projects" className="text-xs text-[#3B5BDB] hover:underline font-medium">All</Link>
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
                            <Link to={`/dashboard/projects/${p.id}`} key={p.id} className="block rounded-xl border border-neutral-200/60 p-3 bg-neutral-50/50 hover:bg-white hover:border-[#3B5BDB]/30 hover:shadow-sm transition-all duration-150">
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
                    <Link to="/dashboard/projects" className="mt-3 rounded-xl block w-full py-2.5 text-xs text-[#3B5BDB] bg-gradient-to-br from-[#EEF4FF] to-[#DBEAFE]/60 hover:from-[#DBEAFE] hover:to-[#C7D9FE]/60 text-center font-semibold transition-all duration-150">
                      View All Projects
                    </Link>
                  </div>

                  <div className="rounded-3xl bg-white shadow-soft border border-neutral-100 p-6">
                    <h3 className="text-base font-bold text-neutral-900 mb-4 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#FEF9E6] to-[#FDE68A]/40 flex items-center justify-center">
                        <FaPlus className="w-3.5 h-3.5 text-[#92400E]" />
                      </div>
                      <span>Quick Actions</span>
                    </h3>
                    <div className="space-y-2">
                      <Link to="/dashboard/search" className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-neutral-50/80 border border-transparent text-neutral-700 text-sm font-semibold hover:bg-[#EEF4FF] hover:border-[#3B5BDB]/20 hover:text-[#3B5BDB] transition-all duration-200">
                        <div className="w-8 h-8 rounded-xl bg-white shadow-sm flex items-center justify-center shrink-0">
                          <FaUsers className="w-3.5 h-3.5 text-neutral-400" />
                        </div>
                        Search Crew
                      </Link>
                      <Link to="/dashboard/search?type=vendors" className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-neutral-50/80 border border-transparent text-neutral-700 text-sm font-semibold hover:bg-[#EEF4FF] hover:border-[#3B5BDB]/20 hover:text-[#3B5BDB] transition-all duration-200">
                        <div className="w-8 h-8 rounded-xl bg-white shadow-sm flex items-center justify-center shrink-0">
                          <FaTruck className="w-3.5 h-3.5 text-neutral-400" />
                        </div>
                        Search Vendors
                      </Link>
                      <Link to="/dashboard/team" className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-neutral-50/80 border border-transparent text-neutral-700 text-sm font-semibold hover:bg-[#EEF4FF] hover:border-[#3B5BDB]/20 hover:text-[#3B5BDB] transition-all duration-200">
                        <div className="w-8 h-8 rounded-xl bg-white shadow-sm flex items-center justify-center shrink-0">
                          <FaPeopleGroup className="w-3.5 h-3.5 text-neutral-400" />
                        </div>
                        Manage Team
                      </Link>
                    </div>
                  </div>
                </div>
              </motion.div>
              
              </motion.div>
            </div>
          </div>
          <AppFooter />
        </main>
      </div>

      {/* Sliding panel */}
      {panel && (
        <>
          <div className="fixed inset-0 bg-black/25 backdrop-blur-[2px] z-40 lg:bg-black/10 lg:backdrop-blur-[1px]" onClick={closePanel} />
          <aside className="fixed right-0 top-0 h-full w-80 bg-white/95 backdrop-blur-xl border-l border-neutral-200/60 shadow-2xl z-50 flex flex-col panel-enter rounded-l-3xl">
            <div className="flex items-center justify-between px-5 py-5 border-b border-neutral-100">
              <div>
                <p className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider">{panel.month} {panel.year}</p>
                <h3 className="text-xl font-bold text-neutral-900 mt-0.5">{panel.date} {panel.month}</h3>
              </div>
              <button type="button" onClick={closePanel} className="w-9 h-9 rounded-xl bg-neutral-100/80 flex items-center justify-center text-neutral-500 hover:bg-neutral-200 hover:text-neutral-700 transition-all">
                <FaXmark className="text-sm" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-5">
              {panel.projects.length === 0 ? (
                <div className="text-center py-10">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#EEF4FF] to-[#DBEAFE] flex items-center justify-center mx-auto mb-4 shadow-sm">
                    <FaFolder className="text-[#3B5BDB] text-lg" />
                  </div>
                  <p className="text-sm font-bold text-neutral-900 mb-1">No project scheduled</p>
                  <p className="text-xs text-neutral-500 mb-6">This date is available for production</p>
                  <Link to="/dashboard/projects/new" className="rounded-xl inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-br from-[#3B5BDB] to-[#2f4ac2] text-white text-sm font-bold hover:shadow-lg hover:shadow-[#3B5BDB]/25 transition-all duration-200">
                    <FaPlus className="w-3 h-3" /> Create Project
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Active / non-cancelled projects */}
                  {panel.projects.filter(p => p.status !== 'cancelled').map((p) => {
                    const cfg = statusConfig[p.status] ?? statusConfig.draft;
                    return (
                      <div key={p.id} className={`rounded-2xl border p-4 shadow-sm ${cfg.bg} ${cfg.border}`}>
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <p className="text-sm font-bold text-neutral-900 leading-tight">{p.title}</p>
                          <span className={`text-[10px] px-2.5 py-0.5 rounded-full shrink-0 font-semibold ${cfg.bg} ${cfg.text} border ${cfg.border}`}>{cfg.label}</span>
                        </div>
                        <div className="space-y-1.5 mb-4">
                          {p.productionHouseName && (
                            <p className="text-xs text-neutral-600"><span className="text-neutral-400 font-medium">House</span> · {p.productionHouseName}</p>
                          )}
                          {p.locationCity && (
                            <p className="text-xs text-neutral-600"><span className="text-neutral-400 font-medium">Location</span> · {p.locationCity}</p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Link to={`/dashboard/projects/${p.id}`} className="flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2.5 bg-[#3B5BDB] text-white text-xs font-semibold hover:bg-[#2f4ac2] shadow-sm shadow-[#3B5BDB]/20 transition-all">
                            <FaEye className="w-3 h-3" /> View
                          </Link>
                          <Link to="/dashboard/search" className="flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2.5 bg-white border border-neutral-200/80 text-neutral-700 text-xs font-semibold hover:bg-neutral-50 hover:border-neutral-300 shadow-sm transition-all">
                            <FaUsers className="w-3 h-3" /> Crew
                          </Link>
                        </div>
                        <div className="flex gap-2 mt-2">
                          <Link
                            to="/dashboard/cancel-requests"
                            className="flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2.5 bg-white border border-amber-200/80 text-amber-800 text-xs font-semibold hover:bg-amber-50 hover:border-amber-300 shadow-sm transition-all"
                          >
                            <FaBan className="w-3 h-3" /> Request cancellation
                          </Link>
                          <button
                            type="button"
                            onClick={() => panel && toggleDayChats(p.id, panel.dateIso)}
                            className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2.5 border text-xs font-semibold shadow-sm transition-all ${
                              dayChatsForProject === p.id
                                ? 'bg-[#EEF4FF] border-[#3B5BDB]/40 text-[#3B5BDB]'
                                : 'bg-white border-neutral-200/80 text-neutral-700 hover:bg-neutral-50 hover:border-neutral-300'
                            }`}
                          >
                            <FaMessage className="w-3 h-3" /> Chats
                          </button>
                        </div>
                        {dayChatsForProject === p.id && (
                          <div className="mt-3 rounded-xl border border-neutral-200/80 bg-white/90 p-3 max-h-48 overflow-y-auto">
                            <p className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider mb-2">
                              Messages on {panel.dateIso} · {p.title}
                            </p>
                            {dayChatsLoading && (
                              <div className="flex justify-center py-4">
                                <span className="w-5 h-5 border-2 border-[#3B5BDB]/30 border-t-[#3B5BDB] rounded-full animate-spin" />
                              </div>
                            )}
                            {dayChatsError && <p className="text-xs text-red-600">{dayChatsError}</p>}
                            {!dayChatsLoading && !dayChatsError && dayChatsItems.length === 0 && (
                              <p className="text-xs text-neutral-500">No project chats on this date.</p>
                            )}
                            {!dayChatsLoading && dayChatsItems.length > 0 && (
                              <ul className="space-y-2">
                                {dayChatsItems.map((m) => (
                                  <li key={m.id} className="text-xs border-b border-neutral-100 last:border-0 pb-2 last:pb-0">
                                    <div className="flex items-center justify-between gap-2 mb-0.5">
                                      <span className="font-semibold text-neutral-800 truncate">{m.senderLabel}</span>
                                      <span className="text-[10px] text-neutral-400 shrink-0 tabular-nums">{fmtChatTime(m.createdAt)}</span>
                                    </div>
                                    <p className="text-neutral-600 line-clamp-3 whitespace-pre-wrap break-words">
                                      {m.content?.trim() || '(attachment or empty)'}
                                    </p>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Cancelled projects — shown collapsed below */}
                  {panel.projects.filter(p => p.status === 'cancelled').length > 0 && (
                    <div>
                      <p className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider mb-2">Also on this date</p>
                      <div className="space-y-2">
                        {panel.projects.filter(p => p.status === 'cancelled').map((p) => (
                          <Link key={p.id} to={`/dashboard/projects/${p.id}`}
                            className="flex items-center justify-between gap-2 rounded-xl border border-neutral-200/60 px-3 py-2.5 bg-neutral-50/50 hover:border-[#3B5BDB]/30 hover:shadow-sm transition-all duration-150">
                            <p className="text-xs font-medium text-neutral-500 truncate">{p.title}</p>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#FEE2E2] text-[#B91C1C] font-semibold shrink-0">Cancelled</span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="px-5 py-4 border-t border-neutral-100 space-y-3">
              <Link
                to={`/dashboard/invoices?issuedOn=${panel.dateIso}`}
                className="flex items-center justify-center gap-2 w-full rounded-xl py-2.5 bg-[#EEF4FF] text-[#3B5BDB] text-sm font-semibold border border-[#3B5BDB]/20 hover:bg-[#DBEAFE] transition-all"
              >
                <FaFileInvoice className="w-3.5 h-3.5" /> Invoices issued on this date
              </Link>
              {panel.projects.length > 0 && (
                <Link to="/dashboard/projects/new" className="flex items-center justify-center gap-2 w-full rounded-xl py-2.5 bg-gradient-to-r from-[#F4C430] to-[#E6B820] text-neutral-900 text-sm font-bold hover:shadow-md hover:shadow-amber-500/20 transition-all duration-200">
                  <FaPlus className="w-3 h-3" /> New Project
                </Link>
              )}
            </div>
          </aside>
        </>
      )}
    </div>
  );
}
