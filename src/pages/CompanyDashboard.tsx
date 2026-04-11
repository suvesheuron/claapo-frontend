import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useEffect, useState, useMemo, useCallback } from 'react';
import { FaPlus, FaUsers, FaTruck, FaFolder, FaXmark, FaEye, FaMessage, FaPeopleGroup, FaFileInvoice, FaBan, FaChevronLeft, FaChevronRight } from 'react-icons/fa6';
import DashboardHeader from '../components/DashboardHeader';
import DashboardSidebar from '../components/DashboardSidebar';
import AppFooter from '../components/AppFooter';
import RoleIndicator from '../components/RoleIndicator';
import { useApiQuery } from '../hooks/useApiQuery';
import { useChatUnread } from '../contexts/ChatUnreadContext';
import { companyNavLinks } from '../navigation/dashboardNav';
import { api, ApiException } from '../services/api';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

const statusConfig = {
  draft:     { bg: 'bg-[#F3F4F6]', border: 'border-neutral-200', text: 'text-neutral-600', dot: 'bg-neutral-400', label: 'Draft' },
  open:      { bg: 'bg-[#DCFCE7]', border: 'border-[#86EFAC]', text: 'text-[#15803D]', dot: 'bg-[#16A34A]', label: 'Open' },
  active:    { bg: 'bg-[#FCD34D]', border: 'border-[#D97706]', text: 'text-[#78350F]', dot: 'bg-[#D97706]', label: 'Ongoing' },
  completed: { bg: 'bg-[#60A5FA]', border: 'border-[#1D4ED8]', text: 'text-[#0F1F4D]', dot: 'bg-[#1D4ED8]', label: 'Completed' },
  cancelled: { bg: 'bg-[#FCA5A5]', border: 'border-[#DC2626]', text: 'text-[#7F1D1D]', dot: 'bg-[#DC2626]', label: 'Cancelled' },
} as const;

interface Project {
  id: string;
  title: string;
  status: keyof typeof statusConfig;
  startDate: string;
  endDate: string;
  shootDates?: string[];
  productionHouseName?: string | null;
  locationCity?: string | null;
  _count?: { bookings: number };
}
interface ProjectsApiResponse { items: Project[]; meta: { total: number } }

// Priority order for calendar display: active > open > draft > completed > cancelled
const STATUS_PRIORITY: Record<string, number> = { active: 0, open: 1, draft: 2, completed: 3, cancelled: 4 };

interface CalendarCell { d: number; muted: boolean; projects: Project[] }
interface PanelData { date: number; month: string; year: number; projects: Project[]; dateIso: string }

interface DayChatMessage {
  id: string;
  content: string | null;
  createdAt: string;
  senderId: string;
  senderLabel: string;
  conversationId: string;
  otherParticipantId: string;
}

interface ProjectDayChatGroup {
  projectId: string;
  projectTitle: string;
  items: DayChatMessage[];
}

interface ProjectDayChatsResponse {
  items?: Array<{
    id: string;
    content: string | null;
    createdAt: string;
    conversationId: string;
    otherParticipantId: string;
    sender?: { id?: string; displayName?: string };
  }>;
  meta?: { pages?: number };
}

function getDateRangeIso(dateIso: string): { startIso: string; endIso: string } {
  const dayStart = new Date(`${dateIso}T00:00:00`);
  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayEnd.getDate() + 1);
  return { startIso: dayStart.toISOString(), endIso: dayEnd.toISOString() };
}

function buildCalendar(year: number, month: number, projects: Project[]): CalendarCell[] {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Map: day -> all projects that have a shoot date on that day
  const dayMap: Record<number, Project[]> = {};
  for (const p of projects) {
    // Use shootDates if available, otherwise fall back to startDate-endDate range (backward compatibility)
    if (p.shootDates && p.shootDates.length > 0) {
      // Use the specific shoot dates
      for (const shootDateStr of p.shootDates) {
        const shootDate = new Date(shootDateStr);
        if (shootDate.getFullYear() === year && shootDate.getMonth() === month) {
          const day = shootDate.getDate();
          if (!dayMap[day]) dayMap[day] = [];
          dayMap[day].push(p);
        }
      }
    } else {
      // Fallback: use entire project timeline (for projects without shootDates)
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
  const [dateChatGroups, setDateChatGroups] = useState<ProjectDayChatGroup[]>([]);
  const [expandedChatProject, setExpandedChatProject] = useState<string | null>(null);
  const [expandedChatPerson, setExpandedChatPerson] = useState<string | null>(null);
  const [personChatMessages, setPersonChatMessages] = useState<Array<{ id: string; senderId: string; senderLabel: string; content: string | null; createdAt: string }>>([]);
  const [personChatLoading, setPersonChatLoading] = useState(false);
  const [personChatError, setPersonChatError] = useState<string | null>(null);
  const [dateChatGroupsLoading, setDateChatGroupsLoading] = useState(false);
  const [dateChatGroupsError, setDateChatGroupsError] = useState<string | null>(null);

  const { data: projectsData, loading } = useApiQuery<ProjectsApiResponse>('/projects?limit=100');
  const projects = projectsData?.items ?? [];
  const { unreadByProject, unreadDateByProject } = useChatUnread();

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

  const activeProjects = projects.filter(p => p.status === 'active' || p.status === 'open').length;
  const crewHired = projects.reduce((acc, p) => acc + (p._count?.bookings ?? 0), 0);

  const isToday = (cell: CalendarCell) => {
    return !cell.muted && cell.d > 0 && cell.d === today.getDate() && displayDate.getMonth() === today.getMonth() && displayDate.getFullYear() === today.getFullYear();
  };

  const openPanel = (cell: CalendarCell) => {
    if (cell.muted || cell.d === 0) return;
    const m = displayDate.getMonth();
    const y = displayDate.getFullYear();
    const dateIso = `${y}-${String(m + 1).padStart(2, '0')}-${String(cell.d).padStart(2, '0')}`;
    setDateChatGroups([]);
    setDateChatGroupsError(null);
    setExpandedChatProject(null);
    setExpandedChatPerson(null);
    setPersonChatMessages([]);
    setPersonChatError(null);
    setPersonChatLoading(false);
    setPanel({ date: cell.d, month: monthLabel, year: yearLabel, projects: cell.projects, dateIso });
  };

  const fetchProjectDayChats = useCallback(async (projectId: string, dateIso: string) => {
    const { startIso, endIso } = getDateRangeIso(dateIso);
    const out: DayChatMessage[] = [];
    const firstRes = await api.get<ProjectDayChatsResponse>(
      `/conversations/project/${projectId}/messages/by-date?start=${encodeURIComponent(startIso)}&end=${encodeURIComponent(endIso)}&page=1&limit=50`,
    );
    for (const m of firstRes.items ?? []) {
      out.push({
        id: m.id,
        content: m.content,
        createdAt: m.createdAt,
        senderId: m.sender?.id ?? '',
        senderLabel: m.sender?.displayName ?? '—',
        conversationId: m.conversationId,
        otherParticipantId: m.otherParticipantId,
      });
    }
    const pages = Math.max(1, firstRes.meta?.pages ?? 1);
    for (let page = 2; page <= pages; page++) {
      const pageRes = await api.get<ProjectDayChatsResponse>(
        `/conversations/project/${projectId}/messages/by-date?start=${encodeURIComponent(startIso)}&end=${encodeURIComponent(endIso)}&page=${page}&limit=50`,
      );
      for (const m of pageRes.items ?? []) {
        out.push({
          id: m.id,
          content: m.content,
          createdAt: m.createdAt,
          senderId: m.sender?.id ?? '',
          senderLabel: m.sender?.displayName ?? '—',
          conversationId: m.conversationId,
          otherParticipantId: m.otherParticipantId,
        });
      }
    }
    out.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    return out;
  }, []);

  const loadDateChatGroups = useCallback(async (dateIso: string) => {
    const eligibleProjects = projects;
    if (eligibleProjects.length === 0) return [];
    const groups = await Promise.all(
      eligibleProjects.map(async (project) => {
        const items = await fetchProjectDayChats(project.id, dateIso);
        return { projectId: project.id, projectTitle: project.title, items };
      }),
    );
    return groups.filter((group) => group.items.length > 0);
  }, [fetchProjectDayChats, projects]);

  const closePanel = () => {
    setPanel(null);
    setDateChatGroups([]);
    setDateChatGroupsError(null);
    setExpandedChatProject(null);
    setExpandedChatPerson(null);
    setPersonChatMessages([]);
    setPersonChatError(null);
    setPersonChatLoading(false);
  };

  useEffect(() => {
    if (!panel) return;
    setDateChatGroupsLoading(true);
    setDateChatGroups([]);
    setDateChatGroupsError(null);
    void loadDateChatGroups(panel.dateIso)
      .then((groups) => setDateChatGroups(groups))
      .catch((err) => {
        setDateChatGroups([]);
        setDateChatGroupsError(err instanceof ApiException ? err.payload.message : 'Could not load project chats for this date.');
      })
      .finally(() => setDateChatGroupsLoading(false));
  }, [loadDateChatGroups, panel]);

  // When a person is selected inside a project, load their full conversation for that project
  useEffect(() => {
    if (!expandedChatPerson || !expandedChatProject) {
      setPersonChatMessages([]);
      setPersonChatError(null);
      setPersonChatLoading(false);
      return;
    }
    const group = dateChatGroups.find((g) => g.projectId === expandedChatProject);
    const sample = group?.items.find((m) => m.otherParticipantId === expandedChatPerson);
    if (!sample) return;
    const conversationId = sample.conversationId;
    let cancelled = false;
    setPersonChatLoading(true);
    setPersonChatError(null);
    void api
      .get<{ items: Array<{ id: string; senderId: string; content: string | null; createdAt: string; sender?: { displayName?: string } }> }>(
        `/conversations/${conversationId}/messages?limit=100`,
      )
      .then((res) => {
        if (cancelled) return;
        const sorted = (res.items ?? [])
          .slice()
          .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
          .map((m) => ({
            id: m.id,
            senderId: m.senderId,
            senderLabel: m.sender?.displayName ?? '—',
            content: m.content,
            createdAt: m.createdAt,
          }));
        setPersonChatMessages(sorted);
      })
      .catch((err) => {
        if (cancelled) return;
        setPersonChatError(err instanceof ApiException ? err.payload.message : 'Could not load conversation.');
        setPersonChatMessages([]);
      })
      .finally(() => {
        if (!cancelled) setPersonChatLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [expandedChatPerson, expandedChatProject, dateChatGroups]);

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
                    {loading ? (
                      <div className="grid grid-cols-7 gap-1" aria-busy="true" aria-label="Loading calendar">
                        {Array.from({ length: 42 }).map((_, i) => (
                          <div
                            key={i}
                            className="min-h-[44px] sm:min-h-[54px] rounded-xl bg-gradient-to-br from-neutral-100 to-neutral-50 border border-neutral-100 animate-pulse"
                            style={{ animationDelay: `${(i % 7) * 60}ms` }}
                          />
                        ))}
                      </div>
                    ) : (
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
                          const cellDateStr = `${displayDate.getFullYear()}-${String(displayDate.getMonth() + 1).padStart(2, '0')}-${String(cell.d).padStart(2, '0')}`;
                          // A cell has FOCUS unread when this exact date is the date a new
                          // message arrived for one of the cell's projects.
                          const focusUnread = cell.muted
                            ? 0
                            : cell.projects.reduce(
                                (acc, p) => acc + ((unreadDateByProject[p.id] === cellDateStr) ? (unreadByProject[p.id] ?? 0) : 0),
                                0,
                              );
                          // A cell has SECONDARY unread when one of its projects has unread
                          // messages but the message arrived on a DIFFERENT date than this cell.
                          const secondaryUnread = !cell.muted && focusUnread === 0 && cell.projects.some(
                            (p) => (unreadByProject[p.id] ?? 0) > 0 && unreadDateByProject[p.id] !== cellDateStr,
                          );
                          return (
                            <button key={i} type="button" onClick={() => openPanel(cell)} disabled={cell.muted} className={`cal-cell rounded-xl border text-center p-1 sm:p-1.5 min-h-[44px] sm:min-h-[54px] flex flex-col items-center justify-center gap-0.5 relative transition-all duration-150 ${
                              cell.muted ? 'bg-neutral-50/50 border-transparent text-neutral-300 cursor-default' :
                              cfg ? `${cfg.bg} ${cfg.border} ${cfg.text} cursor-pointer hover:shadow-sm hover:brightness-[0.97]` : 'bg-white border-neutral-200/60 text-neutral-600 hover:bg-neutral-50 hover:border-neutral-300 cursor-pointer'
                            } ${todayCell && !cfg ? 'ring-2 ring-[#3B5BDB]/30 border-[#3B5BDB]/40 bg-[#EEF4FF]/40' : ''} ${todayCell && cfg ? 'ring-2 ring-[#3B5BDB]/40 ring-offset-1' : ''} ${panel?.date === cell.d && !cell.muted ? 'ring-2 ring-[#3B5BDB] ring-offset-1' : ''} ${focusUnread ? 'ring-2 ring-[#F40F02]/70 ring-offset-1' : ''} ${secondaryUnread ? 'ring-1 ring-[#F40F02]/30' : ''}`}>
                              <span className={`text-[11px] sm:text-xs font-semibold leading-none ${todayCell ? 'text-[#3B5BDB]' : ''}`}>{cell.d}</span>
                              {primary && !cell.muted && (
                                <span className="text-[8px] sm:text-[9px] font-medium leading-tight truncate w-full opacity-80">{primary.title}</span>
                              )}
                              {focusUnread > 0 && (
                                <span
                                  className="absolute -top-1 -right-1 flex items-center justify-center"
                                  title={`${focusUnread} new message${focusUnread === 1 ? '' : 's'}`}
                                  aria-label={`${focusUnread} unread messages`}
                                >
                                  <span className="absolute inline-flex h-4 w-4 rounded-full bg-[#F40F02] opacity-70 animate-ping" />
                                  <span className="relative inline-flex h-4 w-4 rounded-full bg-[#F40F02] text-white text-[8px] font-bold items-center justify-center shadow-md">
                                    {focusUnread > 9 ? '9+' : focusUnread}
                                  </span>
                                </span>
                              )}
                              {secondaryUnread && (
                                <span
                                  className="absolute top-1 right-1 flex items-center justify-center pointer-events-none"
                                  aria-hidden
                                >
                                  <span className="absolute inline-flex h-1.5 w-1.5 rounded-full bg-[#F40F02] opacity-40 animate-ping" style={{ animationDuration: '2.4s' }} />
                                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#F40F02]/70" />
                                </span>
                              )}
                              {hasMultiple && !cell.muted && !focusUnread && !secondaryUnread && (
                                <span className="absolute top-0.5 right-0.5 w-3.5 h-3.5 rounded-full bg-[#3B5BDB] text-white text-[7px] font-bold flex items-center justify-center leading-none shadow-sm">{cell.projects.length}</span>
                              )}
                              {todayCell && !cfg && (
                                <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#3B5BDB]" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                    <div className="flex flex-wrap gap-x-5 gap-y-1.5 mt-4 pt-4 border-t border-neutral-100">
                      {Object.entries(statusConfig).map(([key, val]) => (
                        <div key={key} className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${val.dot}`} />
                          <span className="text-[11px] text-neutral-500 font-medium">{val.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Stats — below calendar */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {loading ? (
                      <>
                        {[1,2].map(i => <div key={i} className="rounded-3xl bg-white border border-neutral-100 shadow-soft p-5 animate-pulse h-24" />)}
                      </>
                    ) : (
                      <>
                        <div className="rounded-3xl bg-white shadow-soft border border-neutral-100 p-5 flex items-center gap-5 hover:shadow-float transition-shadow group">
                          <div className="w-14 h-14 rounded-2xl bg-[#FCD34D]/15 border border-[#D97706]/20 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                            <FaFolder className="text-[#D97706] text-xl" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[11px] uppercase tracking-widest text-neutral-500 font-bold">Active Projects</p>
                            <p className="text-3xl font-extrabold mt-1 text-neutral-900 tabular-nums">{activeProjects}</p>
                          </div>
                        </div>
                        <div className="rounded-3xl bg-white shadow-soft border border-neutral-100 p-5 flex items-center gap-5 hover:shadow-float transition-shadow group">
                          <div className="w-14 h-14 rounded-2xl bg-[#DCFCE7] border border-[#86EFAC] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                            <FaUsers className="text-[#15803D] text-xl" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[11px] uppercase tracking-widest text-neutral-500 font-bold">Crew Hired</p>
                            <p className="text-3xl font-extrabold mt-1 text-neutral-900 tabular-nums">{crewHired}</p>
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Quick links — Requests, Chats, Notifications */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[
                      { label: 'Requests', icon: FaUsers, to: '/dashboard/projects', desc: 'Booking requests' },
                      { label: 'Chats', icon: FaMessage, to: '/dashboard/conversations', desc: 'Open conversations' },
                      { label: 'Notifications', icon: FaFolder, to: '/dashboard/projects', desc: 'Project updates' },
                    ].map(({ label, icon: Icon, to, desc }) => (
                      <Link key={label} to={to} className="rounded-3xl bg-white border border-neutral-100 shadow-soft p-5 hover:shadow-float hover:border-[#3B5BDB]/20 hover:-translate-y-0.5 transition-all duration-200 group">
                        <div className="w-12 h-12 rounded-2xl bg-[#EEF4FF] border border-[#3B5BDB]/15 flex items-center justify-center mb-4 group-hover:bg-[#3B5BDB] group-hover:border-[#3B5BDB] transition-colors">
                          <Icon className="text-[#3B5BDB] text-lg group-hover:text-white transition-colors" />
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
                      <div className="w-8 h-8 rounded-xl bg-[#EEF4FF] border border-[#3B5BDB]/15 flex items-center justify-center">
                        <FaPlus className="w-3.5 h-3.5 text-[#3B5BDB]" />
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
      {panel && (() => {
        const activeProjectsList = panel.projects.filter(p => p.status !== 'cancelled');
        const cancelledProjectsList = panel.projects.filter(p => p.status === 'cancelled');
        const totalChats = dateChatGroups.reduce((acc, g) => acc + g.items.length, 0);
        const weekday = new Date(`${panel.dateIso}T00:00:00`).toLocaleDateString('en-IN', { weekday: 'long' });
        return (
        <>
          <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-40 animate-in fade-in duration-200" onClick={closePanel} />
          <aside className="fixed right-0 top-0 h-full w-full sm:w-[420px] md:w-[460px] lg:w-[480px] bg-white border-l border-neutral-200/60 shadow-2xl z-50 flex flex-col panel-enter sm:rounded-l-3xl overflow-hidden">
            {/* Header */}
            <div className="relative px-5 sm:px-6 pt-5 pb-4 border-b border-neutral-100 bg-gradient-to-br from-white via-[#F8FAFF] to-[#EEF4FF]/40">
              <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-[#3B5BDB]/10 to-transparent rounded-full blur-2xl pointer-events-none" />
              <div className="relative flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-12 h-12 rounded-2xl bg-white border border-[#3B5BDB]/15 shadow-sm flex flex-col items-center justify-center shrink-0">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-[#3B5BDB] leading-none">{panel.month.slice(0, 3)}</span>
                    <span className="text-lg font-extrabold text-neutral-900 leading-none mt-0.5 tabular-nums">{panel.date}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">{weekday}</p>
                    <h3 className="text-lg font-extrabold text-neutral-900 leading-tight truncate">{panel.month} {panel.year}</h3>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={closePanel}
                  aria-label="Close panel"
                  className="w-9 h-9 rounded-xl bg-white border border-neutral-200 flex items-center justify-center text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800 hover:border-neutral-300 shadow-sm transition-all shrink-0"
                >
                  <FaXmark className="text-sm" />
                </button>
              </div>
              {/* Summary pills */}
              <div className="relative flex flex-wrap items-center gap-2 mt-4">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-neutral-200 text-[11px] font-semibold text-neutral-700 shadow-sm">
                  <FaFolder className="w-2.5 h-2.5 text-[#3B5BDB]" />
                  {panel.projects.length} {panel.projects.length === 1 ? 'project' : 'projects'}
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-neutral-200 text-[11px] font-semibold text-neutral-700 shadow-sm">
                  <FaMessage className="w-2.5 h-2.5 text-[#7C3AED]" />
                  {totalChats} {totalChats === 1 ? 'message' : 'messages'}
                </span>
              </div>
            </div>

            {/* Scroll body */}
            <div className="flex-1 overflow-y-auto overscroll-contain">
              {/* ── Projects section ─────────────────────────────────── */}
              <section className="px-5 sm:px-6 pt-5 pb-2">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider flex items-center gap-2">
                    <span className="w-1 h-3.5 rounded-full bg-[#3B5BDB]" />
                    Projects
                  </h4>
                  {panel.projects.length > 0 && (
                    <span className="text-[11px] font-semibold text-neutral-400 tabular-nums">{panel.projects.length}</span>
                  )}
                </div>

                {panel.projects.length === 0 ? (
                  <div className="text-center py-8 rounded-2xl border border-dashed border-neutral-200 bg-neutral-50/50">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#EEF4FF] to-[#DBEAFE] flex items-center justify-center mx-auto mb-3 shadow-sm">
                      <FaFolder className="text-[#3B5BDB] text-lg" />
                    </div>
                    <p className="text-sm font-bold text-neutral-900 mb-1">No project scheduled</p>
                    <p className="text-xs text-neutral-500 mb-5 px-4">This date is available for production</p>
                    <Link to="/dashboard/projects/new" className="rounded-xl inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-br from-[#3B5BDB] to-[#2f4ac2] text-white text-xs font-bold hover:shadow-lg hover:shadow-[#3B5BDB]/25 transition-all duration-200">
                      <FaPlus className="w-3 h-3" /> Create Project
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {activeProjectsList.map((p) => {
                      const cfg = statusConfig[p.status] ?? statusConfig.draft;
                      return (
                        <article key={p.id} className="group rounded-2xl border border-neutral-200/80 bg-white hover:border-[#3B5BDB]/30 hover:shadow-md transition-all overflow-hidden">
                          {/* Accent bar */}
                          <div className={`h-1 w-full ${cfg.dot}`} />
                          <div className="p-4">
                            <div className="flex items-start justify-between gap-2 mb-3">
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-bold text-neutral-900 leading-tight line-clamp-2">{p.title}</p>
                              </div>
                              <span className={`text-[10px] px-2 py-0.5 rounded-full shrink-0 font-semibold ${cfg.bg} ${cfg.text} border ${cfg.border}`}>{cfg.label}</span>
                            </div>
                            {(p.productionHouseName || p.locationCity) && (
                              <dl className="space-y-1 mb-3">
                                {p.productionHouseName && (
                                  <div className="flex items-center gap-1.5 text-[11px]">
                                    <dt className="text-neutral-400 font-semibold uppercase tracking-wide text-[9px] w-14 shrink-0">House</dt>
                                    <dd className="text-neutral-700 font-medium truncate">{p.productionHouseName}</dd>
                                  </div>
                                )}
                                {p.locationCity && (
                                  <div className="flex items-center gap-1.5 text-[11px]">
                                    <dt className="text-neutral-400 font-semibold uppercase tracking-wide text-[9px] w-14 shrink-0">Location</dt>
                                    <dd className="text-neutral-700 font-medium truncate">{p.locationCity}</dd>
                                  </div>
                                )}
                              </dl>
                            )}
                            <div className="grid grid-cols-3 gap-2">
                              <Link to={`/dashboard/projects/${p.id}`} className="flex items-center justify-center gap-1 rounded-lg py-2 bg-[#3B5BDB] text-white text-[11px] font-semibold hover:bg-[#2f4ac2] shadow-sm transition-all">
                                <FaEye className="w-2.5 h-2.5" /> View
                              </Link>
                              <Link to="/dashboard/search" className="flex items-center justify-center gap-1 rounded-lg py-2 bg-white border border-neutral-200 text-neutral-700 text-[11px] font-semibold hover:bg-neutral-50 hover:border-neutral-300 transition-all">
                                <FaUsers className="w-2.5 h-2.5" /> Crew
                              </Link>
                              <Link
                                to="/dashboard/cancel-requests"
                                className="flex items-center justify-center gap-1 rounded-lg py-2 bg-white border border-amber-200 text-amber-700 text-[11px] font-semibold hover:bg-amber-50 hover:border-amber-300 transition-all"
                              >
                                <FaBan className="w-2.5 h-2.5" /> Cancel
                              </Link>
                            </div>
                          </div>
                        </article>
                      );
                    })}

                    {cancelledProjectsList.length > 0 && (
                      <div className="pt-1">
                        <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-2 px-1">Cancelled ({cancelledProjectsList.length})</p>
                        <div className="space-y-1.5">
                          {cancelledProjectsList.map((p) => (
                            <Link
                              key={p.id}
                              to={`/dashboard/projects/${p.id}`}
                              className="flex items-center justify-between gap-2 rounded-xl border border-neutral-200/60 px-3 py-2 bg-neutral-50/70 hover:bg-white hover:border-[#3B5BDB]/30 transition-all"
                            >
                              <p className="text-xs font-medium text-neutral-500 truncate line-through decoration-neutral-300">{p.title}</p>
                              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-[#FEE2E2] text-[#B91C1C] font-semibold shrink-0 uppercase tracking-wide">Cancelled</span>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </section>

              {/* Divider */}
              <div className="mx-5 sm:mx-6 my-4 border-t border-dashed border-neutral-200" />

              {/* ── Chats section ────────────────────────────────────── */}
              <section className="px-5 sm:px-6 pb-5">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider flex items-center gap-2">
                    <span className="w-1 h-3.5 rounded-full bg-[#7C3AED]" />
                    Chats on this day
                  </h4>
                  {totalChats > 0 && (
                    <span className="text-[11px] font-semibold text-neutral-400 tabular-nums">{totalChats}</span>
                  )}
                </div>

                {dateChatGroupsLoading && (
                  <div className="flex flex-col items-center justify-center py-8 gap-2">
                    <span className="w-6 h-6 border-2 border-[#3B5BDB]/20 border-t-[#3B5BDB] rounded-full animate-spin" />
                    <span className="text-[11px] text-neutral-400 font-medium">Loading messages…</span>
                  </div>
                )}

                {!dateChatGroupsLoading && dateChatGroupsError && (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-3">
                    <p className="text-xs text-red-700 font-medium">{dateChatGroupsError}</p>
                  </div>
                )}

                {!dateChatGroupsLoading && !dateChatGroupsError && dateChatGroups.length === 0 && (
                  <div className="text-center py-8 rounded-2xl border border-dashed border-neutral-200 bg-neutral-50/50">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#F3E8FF] to-[#EDE9FE] flex items-center justify-center mx-auto mb-2">
                      <FaMessage className="text-[#7C3AED] text-sm" />
                    </div>
                    <p className="text-xs font-semibold text-neutral-700">No messages on this day</p>
                    <p className="text-[11px] text-neutral-400 mt-0.5">Conversations will appear here</p>
                  </div>
                )}

                {!dateChatGroupsLoading && !dateChatGroupsError && dateChatGroups.length > 0 && (
                  <div className="space-y-2.5">
                    {dateChatGroups.map((group) => {
                      const isExpanded = expandedChatProject === group.projectId;
                      // Build unique participants with aggregated stats
                      const participantMap = new Map<string, { id: string; name: string; messageCount: number; lastAt: string; lastContent: string | null }>();
                      for (const m of group.items) {
                        const pid = m.otherParticipantId;
                        if (!pid) continue;
                        const existing = participantMap.get(pid);
                        // Prefer name from a message where sender === that participant
                        const candidateName = m.senderId === pid ? m.senderLabel : existing?.name;
                        if (!existing) {
                          participantMap.set(pid, {
                            id: pid,
                            name: candidateName ?? (m.senderId === pid ? m.senderLabel : '—'),
                            messageCount: 1,
                            lastAt: m.createdAt,
                            lastContent: m.content,
                          });
                        } else {
                          existing.messageCount += 1;
                          if (candidateName) existing.name = candidateName;
                          if (new Date(m.createdAt).getTime() > new Date(existing.lastAt).getTime()) {
                            existing.lastAt = m.createdAt;
                            existing.lastContent = m.content;
                          }
                        }
                      }
                      const participants = Array.from(participantMap.values()).sort(
                        (a, b) => new Date(b.lastAt).getTime() - new Date(a.lastAt).getTime(),
                      );
                      return (
                        <div key={group.projectId} className="rounded-2xl border border-neutral-200/80 bg-white overflow-hidden transition-all">
                          <button
                            type="button"
                            onClick={() => {
                              setExpandedChatProject(isExpanded ? null : group.projectId);
                              setExpandedChatPerson(null);
    setPersonChatMessages([]);
    setPersonChatError(null);
    setPersonChatLoading(false);
                            }}
                            aria-expanded={isExpanded}
                            className={`w-full flex items-center gap-2.5 px-3.5 py-3 text-left transition-colors ${
                              isExpanded
                                ? 'bg-gradient-to-r from-[#EEF4FF] to-white border-b border-neutral-100'
                                : 'bg-gradient-to-r from-[#F8FAFF] to-white hover:from-[#EEF4FF]'
                            }`}
                          >
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                              isExpanded ? 'bg-[#3B5BDB] text-white' : 'bg-[#EEF4FF] text-[#3B5BDB]'
                            }`}>
                              <FaFolder className="w-3 h-3" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold text-neutral-900 truncate">{group.projectTitle}</p>
                              <p className="text-[10px] text-neutral-500 font-medium mt-0.5">
                                <span className="inline-flex items-center gap-1">
                                  <FaPeopleGroup className="w-2.5 h-2.5" /> {participants.length} {participants.length === 1 ? 'person' : 'people'}
                                </span>
                                <span className="mx-1.5 text-neutral-300">·</span>
                                <span className="inline-flex items-center gap-1">
                                  <FaMessage className="w-2.5 h-2.5" /> {group.items.length} {group.items.length === 1 ? 'msg' : 'msgs'}
                                </span>
                              </p>
                            </div>
                            <FaChevronRight
                              className={`w-2.5 h-2.5 text-neutral-400 shrink-0 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                            />
                          </button>

                          {isExpanded && (
                            <div className="bg-white">
                              {participants.length === 0 ? (
                                <p className="px-4 py-4 text-[11px] text-neutral-400 text-center">No participants found.</p>
                              ) : expandedChatPerson && participantMap.has(expandedChatPerson) ? (
                                (() => {
                                  const person = participantMap.get(expandedChatPerson)!;
                                  const initial = (person.name?.trim()?.[0] ?? '?').toUpperCase();
                                  return (
                                    <div className="flex flex-col">
                                      {/* Person header with back */}
                                      <div className="flex items-center gap-2.5 px-3.5 py-2.5 border-b border-neutral-100 bg-gradient-to-r from-[#F8FAFF] to-white">
                                        <button
                                          type="button"
                                          onClick={() => setExpandedChatPerson(null)}
                                          aria-label="Back to people"
                                          className="w-7 h-7 rounded-lg bg-white border border-neutral-200 flex items-center justify-center text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800 shrink-0 transition-all"
                                        >
                                          <FaChevronLeft className="w-2.5 h-2.5" />
                                        </button>
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#3B5BDB] to-[#5B9DF9] text-white text-[11px] font-extrabold flex items-center justify-center shrink-0 shadow-sm">
                                          {initial}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <p className="text-xs font-bold text-neutral-900 truncate">{person.name}</p>
                                          <p className="text-[10px] text-neutral-500 font-medium">
                                            {personChatLoading
                                              ? 'Loading conversation…'
                                              : `${personChatMessages.length} ${personChatMessages.length === 1 ? 'message' : 'messages'} · full history`}
                                          </p>
                                        </div>
                                        <Link
                                          to={`/dashboard/chat/${person.id}?projectId=${encodeURIComponent(group.projectId)}`}
                                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#3B5BDB] text-white text-[10px] font-bold hover:bg-[#2f4ac2] shrink-0 transition-all"
                                        >
                                          <FaMessage className="w-2.5 h-2.5" /> Open
                                        </Link>
                                      </div>

                                      {/* Messages — full history, chat-bubble scroll region */}
                                      <div className="max-h-[22rem] min-h-[12rem] overflow-y-auto overscroll-contain px-3.5 py-3 bg-[#F8FAFF]/60 space-y-2">
                                        {personChatLoading ? (
                                          <div className="flex flex-col items-center justify-center gap-2 py-8">
                                            <span className="w-6 h-6 border-2 border-[#3B5BDB]/20 border-t-[#3B5BDB] rounded-full animate-spin" />
                                            <span className="text-[11px] text-neutral-400 font-medium">Loading conversation…</span>
                                          </div>
                                        ) : personChatError ? (
                                          <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 mx-1">
                                            <p className="text-[11px] text-red-700 font-medium">{personChatError}</p>
                                          </div>
                                        ) : personChatMessages.length === 0 ? (
                                          <p className="text-center text-[11px] text-neutral-400 py-8">No messages in this conversation.</p>
                                        ) : (
                                          (() => {
                                            let lastDateLabel = '';
                                            return personChatMessages.map((m) => {
                                              const isFromPerson = m.senderId === person.id;
                                              const dateLabel = new Date(m.createdAt).toLocaleDateString('en-IN', {
                                                day: 'numeric',
                                                month: 'short',
                                                year: 'numeric',
                                              });
                                              const showDivider = dateLabel !== lastDateLabel;
                                              lastDateLabel = dateLabel;
                                              return (
                                                <div key={m.id}>
                                                  {showDivider && (
                                                    <div className="flex items-center justify-center my-2">
                                                      <span className="text-[9px] font-bold text-neutral-500 uppercase tracking-wider bg-white border border-neutral-200 rounded-full px-2.5 py-0.5 shadow-sm">
                                                        {dateLabel}
                                                      </span>
                                                    </div>
                                                  )}
                                                  <div className={`flex flex-col ${isFromPerson ? 'items-start' : 'items-end'}`}>
                                                    <div
                                                      className={`max-w-[85%] rounded-2xl px-3 py-2 shadow-sm break-words ${
                                                        isFromPerson
                                                          ? 'bg-white border border-neutral-200 text-neutral-800 rounded-tl-sm'
                                                          : 'bg-gradient-to-br from-[#3B5BDB] to-[#2f4ac2] text-white rounded-tr-sm'
                                                      }`}
                                                    >
                                                      <p className="text-[11px] whitespace-pre-wrap leading-snug">
                                                        {m.content?.trim() || (
                                                          <span className={`italic ${isFromPerson ? 'text-neutral-400' : 'text-blue-100'}`}>
                                                            (attachment or empty)
                                                          </span>
                                                        )}
                                                      </p>
                                                    </div>
                                                    <span className="text-[9px] text-neutral-400 tabular-nums font-medium mt-0.5 px-1">
                                                      {fmtChatTime(m.createdAt)}
                                                    </span>
                                                  </div>
                                                </div>
                                              );
                                            });
                                          })()
                                        )}
                                      </div>
                                    </div>
                                  );
                                })()
                              ) : (
                                <ul className="divide-y divide-neutral-100 max-h-72 overflow-y-auto">
                                  {participants.map((person) => {
                                    const initial = (person.name?.trim()?.[0] ?? '?').toUpperCase();
                                    return (
                                      <li key={person.id}>
                                        <button
                                          type="button"
                                          onClick={() => setExpandedChatPerson(person.id)}
                                          className="w-full flex items-center gap-3 px-3.5 py-3 hover:bg-[#F8FAFF] transition-colors group/person text-left"
                                        >
                                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#3B5BDB] to-[#5B9DF9] text-white text-xs font-extrabold flex items-center justify-center shrink-0 shadow-sm">
                                            {initial}
                                          </div>
                                          <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-2">
                                              <p className="text-xs font-bold text-neutral-900 truncate">{person.name}</p>
                                              <span className="text-[10px] text-neutral-400 tabular-nums font-medium shrink-0">
                                                {fmtChatTime(person.lastAt)}
                                              </span>
                                            </div>
                                            <div className="flex items-center justify-between gap-2 mt-0.5">
                                              <p className="text-[11px] text-neutral-500 truncate leading-snug">
                                                {person.lastContent?.trim() || <span className="italic text-neutral-400">(attachment)</span>}
                                              </p>
                                              <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1.5 rounded-full bg-[#EEF4FF] text-[#3B5BDB] text-[9px] font-extrabold tabular-nums shrink-0">
                                                {person.messageCount}
                                              </span>
                                            </div>
                                          </div>
                                          <FaChevronRight className="w-2.5 h-2.5 text-neutral-300 group-hover/person:text-[#3B5BDB] shrink-0 transition-colors" />
                                        </button>
                                      </li>
                                    );
                                  })}
                                </ul>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            </div>

            {/* Footer actions */}
            <div className="px-5 sm:px-6 py-4 border-t border-neutral-100 bg-white space-y-2.5 shrink-0">
              <Link
                to={`/dashboard/invoices?issuedOn=${panel.dateIso}`}
                className="flex items-center justify-center gap-2 w-full rounded-xl py-2.5 bg-[#EEF4FF] text-[#3B5BDB] text-xs font-bold border border-[#3B5BDB]/20 hover:bg-[#DBEAFE] transition-all"
              >
                <FaFileInvoice className="w-3.5 h-3.5" /> Invoices issued on this date
              </Link>
              {panel.projects.length > 0 && (
                <Link to="/dashboard/projects/new" className="flex items-center justify-center gap-2 w-full rounded-xl py-2.5 bg-gradient-to-r from-[#F4C430] to-[#E6B820] text-neutral-900 text-xs font-bold hover:shadow-md hover:shadow-amber-500/20 transition-all duration-200">
                  <FaPlus className="w-3 h-3" /> New Project
                </Link>
              )}
            </div>
          </aside>
        </>
        );
      })()}
    </div>
  );
}
