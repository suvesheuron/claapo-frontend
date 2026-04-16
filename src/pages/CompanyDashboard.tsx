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
import { useAuth } from '../contexts/AuthContext';
import { companyNavLinks } from '../navigation/dashboardNav';
import { api, ApiException } from '../services/api';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

const statusConfig = {
  draft:     { bg: 'bg-[#F3F4F6]', border: 'border-neutral-200',  text: 'text-neutral-600', dot: 'bg-neutral-400',  label: 'Draft' },
  open:      { bg: 'bg-[#DCFCE7]', border: 'border-[#86EFAC]',    text: 'text-[#15803D]',   dot: 'bg-[#22C55E]',    label: 'Open' },
  active:    { bg: 'bg-[#FEF3C7]', border: 'border-[#F4C430]',    text: 'text-[#946A00]',   dot: 'bg-[#F4C430]',    label: 'Ongoing' },
  completed: { bg: 'bg-[#DBEAFE]', border: 'border-[#3678F1]',    text: 'text-[#1E3A8A]',   dot: 'bg-[#3678F1]',    label: 'Completed' },
  cancelled: { bg: 'bg-[#FEE2E2]', border: 'border-[#F40F02]',    text: 'text-[#991B1B]',   dot: 'bg-[#F40F02]',    label: 'Cancelled' },
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
  otherParticipantName?: string;
  isSameAccount?: boolean;
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
    otherParticipant?: { id: string; displayName: string };
    sender?: { id?: string; displayName?: string };
    isSameAccount?: boolean;
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
  const { user } = useAuth();
  const isSubuser = user?.mainUserId != null;
  
  useEffect(() => { document.title = 'Dashboard – Claapo'; }, []);

  const today = new Date();
  const [calendarYear, setCalendarYear] = useState(() => today.getFullYear());
  const [calendarMonth, setCalendarMonth] = useState(() => today.getMonth());
  const [panel, setPanel] = useState<PanelData | null>(null);
  const [dateChatGroups, setDateChatGroups] = useState<ProjectDayChatGroup[]>([]);
  const [expandedChatProject, setExpandedChatProject] = useState<string | null>(null);
  const [expandedChatPerson, setExpandedChatPerson] = useState<string | null>(null);
  const [personChatMessages, setPersonChatMessages] = useState<Array<{ id: string; senderId: string; senderLabel: string; content: string | null; createdAt: string; isSameAccount?: boolean }>>([]);
  const [personChatLoading, setPersonChatLoading] = useState(false);
  const [personChatError, setPersonChatError] = useState<string | null>(null);
  const [dateChatGroupsLoading, setDateChatGroupsLoading] = useState(false);
  const [dateChatGroupsError, setDateChatGroupsError] = useState<string | null>(null);
  const [panelClosing, setPanelClosing] = useState(false);

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
        otherParticipantName: m.otherParticipant?.displayName,
        isSameAccount: m.isSameAccount,
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
          otherParticipantName: m.otherParticipant?.displayName,
          isSameAccount: m.isSameAccount,
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
    if (panelClosing) return;
    setPanelClosing(true);
    // Match the exit animation duration in index.css (.panel-exit = 240ms)
    window.setTimeout(() => {
      setPanel(null);
      setPanelClosing(false);
      setDateChatGroups([]);
      setDateChatGroupsError(null);
      setExpandedChatProject(null);
      setExpandedChatPerson(null);
      setPersonChatMessages([]);
      setPersonChatError(null);
      setPersonChatLoading(false);
    }, 240);
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

  // When a person is selected inside a project, load THEIR messages for THAT DAY only
  useEffect(() => {
    if (!expandedChatPerson || !expandedChatProject) {
      setPersonChatMessages([]);
      setPersonChatError(null);
      setPersonChatLoading(false);
      return;
    }
    // Get the date range from the panel
    if (!panel?.dateIso) return;
    
    // Filter messages: only from selected day AND from/to this person
    const group = dateChatGroups.find((g) => g.projectId === expandedChatProject);
    if (!group) {
      setPersonChatMessages([]);
      setPersonChatLoading(false);
      return;
    }
    
    // Filter to only messages involving this person on this day
    const personMessages = group.items
      .filter((m) =>
        m.otherParticipantId === expandedChatPerson ||
        m.senderId === expandedChatPerson
      )
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      .map((m) => ({
        id: m.id,
        senderId: m.senderId,
        senderLabel: m.senderLabel,
        content: m.content,
        createdAt: m.createdAt,
        conversationId: m.conversationId,
        otherParticipantId: m.otherParticipantId,
        isSameAccount: m.isSameAccount,
      }));
    
    setPersonChatMessages(personMessages);
    setPersonChatLoading(false);
  }, [expandedChatPerson, expandedChatProject, dateChatGroups, panel]);

  const fmtChatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

  const greetingHour = today.getHours();
  const greeting = greetingHour < 12 ? 'Good morning' : greetingHour < 17 ? 'Good afternoon' : 'Good evening';
  const firstName = (user?.displayName ?? user?.email?.split('@')[0] ?? '').split(' ')[0];
  const todayLabel = today.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const totalProjects = projects.length;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } }
  } satisfies Record<string, any>;

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-[#F3F4F6] w-full">
      <DashboardHeader />
      <div className="flex-1 flex min-h-0 overflow-hidden">
        <DashboardSidebar links={companyNavLinks} />
        <main className="flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden relative">
          <div className="flex-1 min-h-0 overflow-auto">
            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6">

              <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">

              {/* ── Greeting banner ─────────────────────────────────── */}
              <motion.div
                variants={itemVariants}
                className="relative rounded-2xl bg-white border border-neutral-200/70 px-6 sm:px-8 py-6 overflow-hidden shadow-soft"
              >
                {/* Subtle brand wash on the right */}
                <div className="absolute inset-y-0 right-0 w-1/2 bg-gradient-to-l from-[#E8F0FE]/60 to-transparent pointer-events-none" />
                {/* Brand accent bar on the left */}
                <span aria-hidden className="absolute left-0 top-6 bottom-6 w-1 rounded-r-full bg-gradient-to-b from-[#3678F1] to-[#5B9DF9]" />

                <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 z-10 pl-3">
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#3678F1]">{todayLabel}</p>
                    <h1 className="text-[26px] sm:text-[28px] font-extrabold text-neutral-900 tracking-tight leading-tight mt-1">
                      {greeting}{firstName ? <>, <span className="text-[#3678F1]">{firstName}</span></> : ''}
                    </h1>
                    <p className="text-sm text-neutral-500 mt-1.5">Here's what's happening across your productions today.</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <RoleIndicator />
                  </div>
                </div>
              </motion.div>

              {/* ── Stats row ──────────────────────────────────────── */}
              <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {loading ? (
                  <>
                    {[1,2,3].map(i => (
                      <div key={i} className="rounded-2xl bg-white border border-neutral-200/70 p-5 h-[104px] overflow-hidden">
                        <div className="flex items-center gap-4 h-full">
                          <div className="skeleton w-12 h-12 rounded-xl shrink-0" />
                          <div className="flex-1 space-y-2.5">
                            <div className="skeleton h-2.5 w-24 rounded-full" />
                            <div className="skeleton h-7 w-16 rounded-md" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </>
                ) : (
                  <>
                    {[
                      { label: 'Active Projects', value: activeProjects, icon: FaFolder },
                      { label: 'Crew Hired',      value: crewHired,      icon: FaUsers  },
                      { label: 'Total Projects',  value: totalProjects,  icon: FaFolder },
                    ].map(({ label, value, icon: Icon }) => (
                      <div
                        key={label}
                        className="rounded-2xl bg-white border border-neutral-200/70 shadow-soft p-5 flex items-center gap-4 hover:border-[#3678F1] transition-colors duration-200"
                      >
                        <div className="w-12 h-12 rounded-xl bg-[#E8F0FE] ring-1 ring-[#3678F1]/15 flex items-center justify-center shrink-0">
                          <Icon className="text-[#3678F1] text-lg" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10.5px] uppercase tracking-[0.15em] text-neutral-500 font-bold">{label}</p>
                          <p className="text-[28px] font-extrabold text-neutral-900 tabular-nums leading-none mt-1.5">{value}</p>
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </motion.div>

              {/* ── Quick actions ──────────────────────────────────── */}
              <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  ...(isSubuser ? [] : [{ icon: FaPlus,  title: 'New Project', desc: 'Start a production', to: '/projects/new', primary: true as const }]),
                  { icon: FaUsers, title: 'Find Crew',    desc: 'Hire freelancers',  to: '/search' },
                  { icon: FaTruck, title: 'Find Vendors', desc: 'Equipment & services', to: '/search?type=vendors' },
                ].map((action) => (
                  <Link
                    key={action.title}
                    to={action.to}
                    className={`rounded-2xl p-5 border flex items-center gap-4 transition-colors duration-200 ${
                      action.primary
                        ? 'bg-gradient-to-br from-[#3678F1] to-[#2563EB] border-transparent text-white shadow-brand hover:border-white/40'
                        : 'bg-white border-neutral-200/70 shadow-soft text-neutral-700 hover:border-[#3678F1]'
                    }`}
                  >
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                        action.primary
                          ? 'bg-white/15 ring-1 ring-white/20'
                          : 'bg-[#E8F0FE] ring-1 ring-[#3678F1]/15'
                      }`}
                    >
                      <action.icon className={`text-[17px] ${action.primary ? 'text-white' : 'text-[#3678F1]'}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`text-[15px] font-bold truncate leading-tight ${action.primary ? 'text-white' : 'text-neutral-900'}`}>{action.title}</p>
                      <p className={`text-[12px] mt-1 truncate ${action.primary ? 'text-white/80' : 'text-neutral-500'}`}>{action.desc}</p>
                    </div>
                    {action.primary && (
                      <span className="hidden sm:inline-flex items-center justify-center w-9 h-9 rounded-full bg-white/15 ring-1 ring-white/25 text-white shrink-0">
                        <FaChevronRight className="text-[11px]" />
                      </span>
                    )}
                  </Link>
                ))}
              </motion.div>

              <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Calendar (full width on mobile, 3/4 on desktop) */}
                <div className="lg:col-span-3 order-2 lg:order-1 space-y-6">
                  <div className="rounded-2xl bg-white shadow-soft border border-neutral-200/70 p-5 sm:p-6">
                    <div className="flex items-center justify-between mb-5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-[#E8F0FE] flex items-center justify-center ring-1 ring-[#3678F1]/15">
                          <FaFolder className="text-[#3678F1] text-sm" />
                        </div>
                        <div>
                          <h2 className="text-[15px] font-bold text-neutral-900 leading-tight">Project Calendar</h2>
                          <p className="text-[11px] text-neutral-500 mt-0.5">Click any date to view scheduled projects</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={goPrevMonth}
                          aria-label="Previous month"
                          className="w-9 h-9 rounded-lg border border-neutral-200/80 bg-white text-neutral-600 hover:bg-[#E8F0FE] hover:border-[#3678F1]/30 hover:text-[#3678F1] flex items-center justify-center transition-all shrink-0"
                        >
                          <FaChevronLeft className="text-xs" />
                        </button>
                        <span className="text-sm font-semibold text-neutral-900 min-w-[130px] text-center tabular-nums px-1">{monthLabel} {yearLabel}</span>
                        <button
                          type="button"
                          onClick={goNextMonth}
                          aria-label="Next month"
                          className="w-9 h-9 rounded-lg border border-neutral-200/80 bg-white text-neutral-600 hover:bg-[#E8F0FE] hover:border-[#3678F1]/30 hover:text-[#3678F1] flex items-center justify-center transition-all shrink-0"
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
                            className="skeleton min-h-[44px] sm:min-h-[54px] rounded-xl"
                            style={{ animationDelay: `${(i % 7) * 80}ms` }}
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
                            } ${todayCell && !cfg ? 'ring-2 ring-[#3678F1]/30 border-[#3678F1]/40 bg-[#E8F0FE]/40' : ''} ${todayCell && cfg ? 'ring-2 ring-[#3678F1]/40 ring-offset-1' : ''} ${panel?.date === cell.d && !cell.muted ? 'ring-2 ring-[#3678F1] ring-offset-1' : ''} ${focusUnread ? 'ring-2 ring-[#F40F02]/70 ring-offset-1' : ''} ${secondaryUnread ? 'ring-1 ring-[#F40F02]/30' : ''}`}>
                              <span className={`text-[11px] sm:text-xs font-semibold leading-none ${todayCell ? 'text-[#3678F1]' : ''}`}>{cell.d}</span>
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
                                <span className="absolute top-0.5 right-0.5 w-3.5 h-3.5 rounded-full bg-[#3678F1] text-white text-[7px] font-bold flex items-center justify-center leading-none shadow-sm">{cell.projects.length}</span>
                              )}
                              {todayCell && !cfg && (
                                <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#3678F1]" />
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

                  {/* Quick links — Requests, Chats, Notifications */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[
                      { label: 'Requests',      icon: FaUsers,   to: '/projects',      desc: 'Booking requests' },
                      { label: 'Chats',         icon: FaMessage, to: '/conversations', desc: 'Open conversations' },
                      { label: 'Notifications', icon: FaFolder,  to: '/projects',      desc: 'Project updates' },
                    ].map(({ label, icon: Icon, to, desc }) => (
                      <Link
                        key={label}
                        to={to}
                        className="rounded-2xl bg-white border border-neutral-200/70 shadow-soft p-5 hover:border-[#3678F1] transition-colors duration-200"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="w-11 h-11 rounded-xl bg-[#E8F0FE] ring-1 ring-[#3678F1]/15 flex items-center justify-center">
                            <Icon className="text-[#3678F1] text-base" />
                          </div>
                          <FaChevronRight className="text-neutral-300 text-xs" />
                        </div>
                        <p className="text-[15px] font-bold text-neutral-900 leading-tight">{label}</p>
                        <p className="text-xs text-neutral-500 mt-1">{desc}</p>
                      </Link>
                    ))}
                  </div>
                </div>

                {/* Right sidebar */}
                <div className="space-y-6 order-1 lg:order-2">
                  {/* Ongoing Projects */}
                  <div className="rounded-2xl bg-white shadow-soft border border-neutral-200/70 p-5">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
                        <span className="w-1 h-4 rounded-full bg-[#3678F1]" />
                        Ongoing Projects
                      </h3>
                      <Link to="/projects" className="text-[11px] text-[#3678F1] hover:text-[#2563EB] font-semibold transition-colors">View all</Link>
                    </div>
                    {loading ? (
                      <div className="space-y-2">
                        {[1,2,3].map(i => (
                          <div key={i} className="h-[58px] rounded-xl border border-neutral-200/70 p-3 overflow-hidden">
                            <div className="skeleton h-2.5 w-3/5 rounded-full mb-2" />
                            <div className="skeleton h-2 w-2/5 rounded-full" />
                          </div>
                        ))}
                      </div>
                    ) : projects.filter(p => p.status !== 'completed' && p.status !== 'cancelled').length === 0 ? (
                      <div className="text-center py-6">
                        <div className="w-10 h-10 rounded-xl bg-[#E8F0FE] flex items-center justify-center mx-auto mb-2">
                          <FaFolder className="text-[#3678F1] text-sm" />
                        </div>
                        <p className="text-xs font-semibold text-neutral-600">No ongoing projects</p>
                        <p className="text-[11px] text-neutral-400 mt-0.5">Create one to get started</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {projects.filter(p => p.status !== 'completed' && p.status !== 'cancelled').slice(0,4).map((p) => {
                          const cfg = statusConfig[p.status] ?? statusConfig.draft;
                          return (
                            <Link
                              to={`/projects/${p.id}`}
                              key={p.id}
                              className="block rounded-xl border border-neutral-200/70 p-3 bg-white hover:border-[#3678F1] transition-colors duration-200"
                            >
                              <div className="flex items-start justify-between gap-2 mb-1">
                                <p className="text-xs font-bold text-neutral-900 truncate">{p.title}</p>
                                <span className={`text-[10px] px-2 py-0.5 rounded-full shrink-0 font-bold ${cfg.bg} ${cfg.text}`}>{cfg.label}</span>
                              </div>
                              {p.productionHouseName && (
                                <p className="text-[11px] text-neutral-500 truncate">{p.productionHouseName}</p>
                              )}
                            </Link>
                          );
                        })}
                      </div>
                    )}
                    <Link
                      to="/projects"
                      className="mt-4 rounded-xl flex items-center justify-center gap-1.5 w-full py-2.5 text-xs text-[#2563EB] bg-[#E8F0FE] hover:bg-[#DBEAFE] text-center font-bold transition-colors duration-200"
                    >
                      View All Projects
                      <FaChevronRight className="text-[10px]" />
                    </Link>
                  </div>

                  {/* Quick Actions */}
                  <div className="rounded-2xl bg-white shadow-soft border border-neutral-200/70 p-5">
                    <h3 className="text-sm font-bold text-neutral-900 mb-4 flex items-center gap-2">
                      <span className="w-1 h-4 rounded-full bg-[#3678F1]" />
                      Quick Actions
                    </h3>
                    <div className="space-y-1.5">
                      {[
                        { to: '/search',                icon: FaUsers,       label: 'Search Crew' },
                        { to: '/search?type=vendors',   icon: FaTruck,       label: 'Search Vendors' },
                        { to: '/team',                  icon: FaPeopleGroup, label: 'Manage Team' },
                      ].map(({ to, icon: Icon, label }) => (
                        <Link
                          key={label}
                          to={to}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-neutral-200/70 text-neutral-700 text-[13px] font-semibold hover:border-[#3678F1] transition-colors duration-200"
                        >
                          <div className="w-8 h-8 rounded-lg bg-[#E8F0FE] ring-1 ring-[#3678F1]/15 flex items-center justify-center shrink-0">
                            <Icon className="w-3.5 h-3.5 text-[#3678F1]" />
                          </div>
                          <span className="flex-1 truncate">{label}</span>
                          <FaChevronRight className="text-[10px] text-neutral-300" />
                        </Link>
                      ))}
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
          <div
            className={`fixed inset-0 bg-black/40 backdrop-blur-[2px] z-40 ${panelClosing ? 'backdrop-exit' : 'backdrop-enter'}`}
            onClick={closePanel}
          />
          <aside
            className={`fixed right-0 top-0 h-full w-full sm:w-[420px] md:w-[460px] lg:w-[480px] bg-white border-l border-neutral-200/60 shadow-2xl z-50 flex flex-col sm:rounded-l-3xl overflow-hidden ${panelClosing ? 'panel-exit' : 'panel-enter'}`}
          >
            {/* Header */}
            <div className="relative px-5 sm:px-6 pt-5 pb-4 border-b border-neutral-100 bg-gradient-to-br from-white via-[#F4F8FE] to-[#E8F0FE]/40">
              <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-[#3678F1]/10 to-transparent rounded-full blur-2xl pointer-events-none" />
              <div className="relative flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-12 h-12 rounded-2xl bg-white border border-[#3678F1]/15 shadow-sm flex flex-col items-center justify-center shrink-0">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-[#3678F1] leading-none">{panel.month.slice(0, 3)}</span>
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
                  <FaFolder className="w-2.5 h-2.5 text-[#3678F1]" />
                  {panel.projects.length} {panel.projects.length === 1 ? 'project' : 'projects'}
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-neutral-200 text-[11px] font-semibold text-neutral-700 shadow-sm">
                  <FaMessage className="w-2.5 h-2.5 text-[#3678F1]" />
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
                    <span className="w-1 h-3.5 rounded-full bg-[#3678F1]" />
                    Projects
                  </h4>
                  {panel.projects.length > 0 && (
                    <span className="text-[11px] font-semibold text-neutral-400 tabular-nums">{panel.projects.length}</span>
                  )}
                </div>

                {panel.projects.length === 0 ? (
                  <div className="text-center py-8 rounded-2xl border border-dashed border-neutral-200 bg-neutral-50/50">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#E8F0FE] to-[#DBEAFE] flex items-center justify-center mx-auto mb-3 shadow-sm">
                      <FaFolder className="text-[#3678F1] text-lg" />
                    </div>
                    <p className="text-sm font-bold text-neutral-900 mb-1">No project scheduled</p>
                    <p className="text-xs text-neutral-500 mb-5 px-4">This date is available for production</p>
                    {!isSubuser && (
                      <Link to="/projects/new" className="rounded-xl inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-br from-[#3678F1] to-[#2563EB] text-white text-xs font-bold hover:shadow-lg hover:shadow-[#3678F1]/25 transition-all duration-200">
                        <FaPlus className="w-3 h-3" /> Create Project
                      </Link>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {activeProjectsList.map((p) => {
                      const cfg = statusConfig[p.status] ?? statusConfig.draft;
                      return (
                        <article key={p.id} className="group rounded-2xl border border-neutral-200/80 bg-white hover:border-[#3678F1]/30 hover:shadow-md transition-all overflow-hidden">
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
                              <Link to={`/projects/${p.id}`} className="flex items-center justify-center gap-1 rounded-lg py-2 bg-[#3678F1] text-white text-[11px] font-semibold hover:bg-[#2563EB] shadow-sm transition-all">
                                <FaEye className="w-2.5 h-2.5" /> View
                              </Link>
                              <Link to="/search" className="flex items-center justify-center gap-1 rounded-lg py-2 bg-white border border-neutral-200 text-neutral-700 text-[11px] font-semibold hover:bg-neutral-50 hover:border-neutral-300 transition-all">
                                <FaUsers className="w-2.5 h-2.5" /> Crew
                              </Link>
                              <Link
                                to="/cancel-requests"
                                className="flex items-center justify-center gap-1 rounded-lg py-2 bg-white border border-[#F4C430]/50 text-[#946A00] text-[11px] font-semibold hover:bg-[#FEF3C7] hover:border-[#F4C430] transition-all"
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
                              to={`/projects/${p.id}`}
                              className="flex items-center justify-between gap-2 rounded-xl border border-neutral-200/60 px-3 py-2 bg-neutral-50/70 hover:bg-white hover:border-[#3678F1]/30 transition-all"
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
                    <span className="w-1 h-3.5 rounded-full bg-[#3678F1]" />
                    Chats on this day
                  </h4>
                  {totalChats > 0 && (
                    <span className="text-[11px] font-semibold text-neutral-400 tabular-nums">{totalChats}</span>
                  )}
                </div>

                {dateChatGroupsLoading && (
                  <div className="flex flex-col items-center justify-center py-8 gap-2">
                    <span className="w-7 h-7 border-[2.5px] border-[#3678F1]/15 border-t-[#3678F1] border-r-[#3678F1] rounded-full animate-spin" />
                    <span className="text-[11px] text-neutral-400 font-medium">Loading messages…</span>
                  </div>
                )}

                {!dateChatGroupsLoading && dateChatGroupsError && (
                  <div className="rounded-xl border border-[#F40F02]/30 bg-[#FEEBEA] px-3 py-3">
                    <p className="text-xs text-[#991B1B] font-medium">{dateChatGroupsError}</p>
                  </div>
                )}

                {!dateChatGroupsLoading && !dateChatGroupsError && dateChatGroups.length === 0 && (
                  <div className="text-center py-8 rounded-2xl border border-dashed border-neutral-200 bg-neutral-50/50">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#E8F0FE] to-[#DBEAFE] flex items-center justify-center mx-auto mb-2">
                      <FaMessage className="text-[#3678F1] text-sm" />
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
                        
                        // Get the participant name - prefer otherParticipantName from backend
                        // This is the most reliable source as it comes from the user's profile
                        const participantName = m.otherParticipantName || 
                                               (m.senderId === pid ? m.senderLabel : null) ||
                                               existing?.name ||
                                               '—';
                        
                        if (!existing) {
                          participantMap.set(pid, {
                            id: pid,
                            name: participantName,
                            messageCount: 1,
                            lastAt: m.createdAt,
                            lastContent: m.content,
                          });
                        } else {
                          existing.messageCount += 1;
                          // Update name if we found a better one (from otherParticipantName)
                          if (m.otherParticipantName && existing.name === '—') {
                            existing.name = m.otherParticipantName;
                          }
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
                                ? 'bg-gradient-to-r from-[#E8F0FE] to-white border-b border-neutral-100'
                                : 'bg-gradient-to-r from-[#F4F8FE] to-white hover:from-[#E8F0FE]'
                            }`}
                          >
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                              isExpanded ? 'bg-[#3678F1] text-white' : 'bg-[#E8F0FE] text-[#3678F1]'
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
                                      <div className="flex items-center gap-2.5 px-3.5 py-2.5 border-b border-neutral-100 bg-gradient-to-r from-[#F4F8FE] to-white">
                                        <button
                                          type="button"
                                          onClick={() => setExpandedChatPerson(null)}
                                          aria-label="Back to people"
                                          className="w-7 h-7 rounded-lg bg-white border border-neutral-200 flex items-center justify-center text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800 shrink-0 transition-all"
                                        >
                                          <FaChevronLeft className="w-2.5 h-2.5" />
                                        </button>
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#3678F1] to-[#5B9DF9] text-white text-[11px] font-extrabold flex items-center justify-center shrink-0 shadow-sm">
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
                                          to={`/chat/${person.id}?projectId=${encodeURIComponent(group.projectId)}`}
                                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#3678F1] text-white text-[10px] font-bold hover:bg-[#2563EB] shrink-0 transition-all"
                                        >
                                          <FaMessage className="w-2.5 h-2.5" /> Open
                                        </Link>
                                      </div>

                                      {/* Messages — full history, chat-bubble scroll region */}
                                      <div className="max-h-[22rem] min-h-[12rem] overflow-y-auto overscroll-contain px-3.5 py-3 bg-[#F4F8FE]/60 space-y-2">
                                        {personChatLoading ? (
                                          <div className="flex flex-col items-center justify-center gap-2 py-8">
                                            <span className="w-7 h-7 border-[2.5px] border-[#3678F1]/15 border-t-[#3678F1] border-r-[#3678F1] rounded-full animate-spin" />
                                            <span className="text-[11px] text-neutral-400 font-medium">Loading conversation…</span>
                                          </div>
                                        ) : personChatError ? (
                                          <div className="rounded-xl border border-[#F40F02]/30 bg-[#FEEBEA] px-3 py-2.5 mx-1">
                                            <p className="text-[11px] text-[#991B1B] font-medium">{personChatError}</p>
                                          </div>
                                        ) : personChatMessages.length === 0 ? (
                                          <p className="text-center text-[11px] text-neutral-400 py-8">No messages in this conversation.</p>
                                        ) : (
                                          (() => {
                                            let lastDateLabel = '';
                                            return personChatMessages.map((m) => {
                                              const isFromPerson = m.isSameAccount !== undefined ? !m.isSameAccount : m.senderId === person.id;
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
                                                          : 'bg-gradient-to-br from-[#3678F1] to-[#2563EB] text-white rounded-tr-sm'
                                                      }`}
                                                    >
                                                      <p className="text-[11px] whitespace-pre-wrap leading-snug">
                                                        {m.content?.trim() || (
                                                          <span className={`italic ${isFromPerson ? 'text-neutral-400' : 'text-white/75'}`}>
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
                                          className="w-full flex items-center gap-3 px-3.5 py-3 hover:bg-[#F4F8FE] transition-colors group/person text-left"
                                        >
                                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#3678F1] to-[#5B9DF9] text-white text-xs font-extrabold flex items-center justify-center shrink-0 shadow-sm">
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
                                              <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1.5 rounded-full bg-[#E8F0FE] text-[#3678F1] text-[9px] font-extrabold tabular-nums shrink-0">
                                                {person.messageCount}
                                              </span>
                                            </div>
                                          </div>
                                          <FaChevronRight className="w-2.5 h-2.5 text-neutral-300 group-hover/person:text-[#3678F1] shrink-0 transition-colors" />
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
                to={`/invoices?issuedOn=${panel.dateIso}`}
                className="flex items-center justify-center gap-2 w-full rounded-xl py-2.5 bg-[#E8F0FE] text-[#3678F1] text-xs font-bold border border-[#3678F1]/20 hover:bg-[#DBEAFE] transition-all"
              >
                <FaFileInvoice className="w-3.5 h-3.5" /> Invoices issued on this date
              </Link>
              {panel.projects.length > 0 && !isSubuser && (
                <Link to="/projects/new" className="flex items-center justify-center gap-2 w-full rounded-xl py-2.5 bg-gradient-to-r from-[#F4C430] to-[#D9A916] text-neutral-900 text-xs font-bold hover:shadow-md hover:shadow-[#F4C430]/30 transition-all duration-200">
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
