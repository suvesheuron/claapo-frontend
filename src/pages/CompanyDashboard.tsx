import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useEffect, useState, useMemo } from 'react';
import { FaPlus, FaUsers, FaTruck, FaFolder, FaXmark, FaEye, FaMessage, FaPeopleGroup, FaFileInvoice, FaChevronLeft, FaChevronRight, FaStar, FaLock } from 'react-icons/fa6';
import DashboardHeader from '../components/DashboardHeader';
import DashboardSidebar from '../components/DashboardSidebar';
import AppFooter from '../components/AppFooter';
import RoleIndicator from '../components/RoleIndicator';
import { useApiQuery } from '../hooks/useApiQuery';
import { useChatUnread } from '../contexts/ChatUnreadContext';
import { useAuth } from '../contexts/AuthContext';
import { companyNavLinks } from '../navigation/dashboardNav';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

const statusConfig = {
  draft:     { bg: 'bg-[#F3F4F6]', border: 'border-neutral-200',  text: 'text-neutral-600', dot: 'bg-neutral-400',  label: 'Draft' },
  open:      { bg: 'bg-[#DCFCE7]', border: 'border-[#86EFAC]',    text: 'text-[#15803D]',   dot: 'bg-[#22C55E]',    label: 'Open' },
  active:    { bg: 'bg-[#FCD34D]', border: 'border-[#D97706]',    text: 'text-[#78350F]',   dot: 'bg-[#D97706]',    label: 'Ongoing' },
  completed: { bg: 'bg-[#60A5FA]', border: 'border-[#1D4ED8]',    text: 'text-[#0F1F4D]',   dot: 'bg-[#1D4ED8]',    label: 'Completed' },
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
  // Set when this row represents a project where THIS company is the booking
  // target (company→company collaboration). Used to label the calendar cell
  // and route the project-detail link to the read-only view.
  bookedByCompanyName?: string;
  bookedFromAnotherCompany?: boolean;
  // For c2c-target rows: booking ids that brought this project onto the
  // calendar (the company has been hired on these bookings) and whether
  // ALL of them are already target-side marked complete. Drives the
  // per-booking Mark Complete button on the date panel.
  bookingIds?: string[];
  allBookingsCompletedByTarget?: boolean;
}
interface ProjectsApiResponse { items: Project[]; meta: { total: number } }

// Shape of /bookings/incoming items as far as the dashboard needs to know.
// The endpoint already strips the heavy fields we don't need on the calendar.
interface IncomingBookingItem {
  id: string;
  projectId: string;
  status: string;
  shootDates?: string[];
  /** Set when this side (target = this company in the c2c flow) has
      already marked the booking complete; hides the Mark Complete CTA. */
  completedByTargetAt?: string | null;
  /** Set when the requester (the hiring company) has marked their side
      complete. From the receiver's perspective the engagement is done as
      soon as either side closes, so we factor this into the calendar cell
      color too. */
  completedByRequesterAt?: string | null;
  project: {
    id: string;
    title: string;
    status: keyof typeof statusConfig;
    startDate: string;
    endDate: string;
    locationCity?: string | null;
  };
  requester?: {
    id: string;
    email?: string | null;
    companyProfile?: { companyName?: string | null } | null;
  };
}
interface IncomingBookingsResponse { items?: IncomingBookingItem[] }

// Priority order for calendar display: active > open > draft > completed > cancelled
const STATUS_PRIORITY: Record<string, number> = { active: 0, open: 1, draft: 2, completed: 3, cancelled: 4 };

interface CalendarCell { d: number; muted: boolean; projects: Project[] }
interface PanelData { date: number; month: string; year: number; projects: Project[]; dateIso: string }



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
  const [panelClosing, setPanelClosing] = useState(false);

  const { data: projectsData, loading } = useApiQuery<ProjectsApiResponse>(
    '/projects?limit=100',
    { swr: true },
  );
  // Bookings where THIS company is the booking target (company→company). We
  // surface their shootDates on the calendar so the company sees the dates
  // they're committed to as a vendor/collaborator, not just their own
  // projects' shoot dates. Failed/empty responses degrade to an empty list —
  // never blocks the dashboard from rendering.
  const { data: incomingData } = useApiQuery<IncomingBookingsResponse>(
    '/bookings/incoming',
    { swr: true },
  );
  // Pulled to decide whether the Cast Search action is unlocked. Casting
  // Director / Agency companies (companyType === 'casting_director') get the
  // feature; everyone else sees it as a locked upsell.
  const { data: meData } = useApiQuery<{ profile?: { companyType?: string | null } | null }>(
    '/profile/me',
    { swr: true },
  );
  const isCastingDirector = meData?.profile?.companyType === 'casting_director';
  const ownProjects = projectsData?.items ?? [];
  const projects = useMemo<Project[]>(() => {
    const incomingItems = incomingData?.items ?? [];
    // Only accepted / locked bookings actually commit calendar dates.
    // Pending requests aren't a commitment yet; declined/cancelled freed the dates.
    const committed = incomingItems.filter(
      (b) => b.status === 'accepted' || b.status === 'locked',
    );
    // Dedupe by projectId — a single project may have several bookings for
    // this company, all pointing to the same project shell on the calendar.
    const byProjectId = new Map<string, Project>();
    for (const b of committed) {
      if (!b.project || b.project.status === 'cancelled') continue;
      const companyName =
        b.requester?.companyProfile?.companyName ?? b.requester?.email ?? 'Another company';
      const existing = byProjectId.get(b.projectId);
      const mergedDates = new Set<string>(existing?.shootDates ?? []);
      for (const d of b.shootDates ?? []) mergedDates.add(d);
      const mergedBookingIds = new Set<string>(existing?.bookingIds ?? []);
      mergedBookingIds.add(b.id);
      // Aggregate "is this engagement closed from the receiver's POV?". A
      // booking counts as closed when *either* side has marked complete —
      // the receiver themselves (completedByTargetAt) OR the hiring
      // company (completedByRequesterAt). Project-level completion by the
      // booker also wraps it. The flag is an AND across every backing
      // booking, so if the project has two booked dates and only one of
      // them is closed, the cell stays Ongoing.
      const prevAllCompleted = existing?.allBookingsCompletedByTarget ?? true;
      const thisCompleted =
        !!b.completedByTargetAt
        || !!b.completedByRequesterAt
        || b.project.status === 'completed';
      const allCompleted = prevAllCompleted && thisCompleted;
      byProjectId.set(b.projectId, {
        id: b.project.id,
        title: b.project.title,
        // Flip the calendar cell to Completed (blue) once every backing
        // booking is closed; otherwise it's an ongoing commitment.
        status: allCompleted ? 'completed' : 'active',
        startDate: b.project.startDate,
        endDate: b.project.endDate,
        shootDates: Array.from(mergedDates),
        locationCity: b.project.locationCity ?? null,
        bookedByCompanyName: companyName,
        bookedFromAnotherCompany: true,
        bookingIds: Array.from(mergedBookingIds),
        allBookingsCompletedByTarget: allCompleted,
      });
    }
    // Drop any incoming-booking entry that collides with the company's own
    // project (which is impossible in normal flow but cheap to guard).
    const ownIds = new Set(ownProjects.map((p) => p.id));
    const incomingProjects = Array.from(byProjectId.values()).filter((p) => !ownIds.has(p.id));
    return [...ownProjects, ...incomingProjects];
  }, [ownProjects, incomingData]);
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


  const isToday = (cell: CalendarCell) => {
    return !cell.muted && cell.d > 0 && cell.d === today.getDate() && displayDate.getMonth() === today.getMonth() && displayDate.getFullYear() === today.getFullYear();
  };

  const openPanel = (cell: CalendarCell) => {
    if (cell.muted || cell.d === 0) return;
    const m = displayDate.getMonth();
    const y = displayDate.getFullYear();
    const dateIso = `${y}-${String(m + 1).padStart(2, '0')}-${String(cell.d).padStart(2, '0')}`;
    setPanel({ date: cell.d, month: monthLabel, year: yearLabel, projects: cell.projects, dateIso });
  };

  const closePanel = () => {
    if (panelClosing) return;
    setPanelClosing(true);
    window.setTimeout(() => {
      setPanel(null);
      setPanelClosing(false);
    }, 240);
  };

  const greetingHour = today.getHours();
  const greeting = greetingHour < 12 ? 'Good morning' : greetingHour < 17 ? 'Good afternoon' : 'Good evening';
  const firstName = (user?.displayName ?? user?.email?.split('@')[0] ?? '').split(' ')[0];
  const todayLabel = today.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

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

              {/* ── Quick actions ──────────────────────────────────── */}
              <motion.div variants={itemVariants} className={`grid grid-cols-1 ${isCastingDirector ? 'md:grid-cols-2' : 'md:grid-cols-2 lg:grid-cols-4'} gap-4`}>
                {[
                  ...(isSubuser ? [] : [{ icon: FaPlus,  title: 'New Project', desc: 'Start a production', to: '/projects/new', primary: true as const, locked: false }]),
                  // Casting Director / Agency companies don't see Find Crew /
                  // Find Vendors — their primary discovery surface is Cast
                  // Search. Hiding these keeps the dashboard focused on cast
                  // hiring for that subtype.
                  ...(isCastingDirector ? [] : [
                    { icon: FaUsers, title: 'Find Crew',    desc: 'Hire freelancers',     to: '/search', locked: false },
                    { icon: FaTruck, title: 'Find Vendors', desc: 'Equipment & services', to: '/search?type=vendors', locked: false },
                  ]),
                  // Cast Search — unlocked only for Casting Director / Agency
                  // companyType. Server enforces the same gate, returning 403
                  // CAST_SEARCH_LOCKED for other companies.
                  {
                    icon: isCastingDirector ? FaStar : FaLock,
                    title: 'Cast Search',
                    desc: isCastingDirector ? 'Actors & models' : 'Casting Agency plan only',
                    to: isCastingDirector ? '/search/cast' : '#',
                    locked: !isCastingDirector,
                  },
                ].map((action) => (
                  <Link
                    key={action.title}
                    to={action.to}
                    onClick={(e) => { if (action.locked) e.preventDefault(); }}
                    aria-disabled={action.locked || undefined}
                    title={action.locked ? 'Upgrade to a Casting Director / Agency account to unlock Cast Search' : undefined}
                    className={`rounded-2xl p-5 border flex items-center gap-4 transition-colors duration-200 ${
                      action.locked
                        ? 'bg-neutral-50 border-neutral-200/70 text-neutral-400 cursor-not-allowed hover:border-neutral-200/70'
                        : action.primary
                          ? 'bg-gradient-to-br from-[#3678F1] to-[#2563EB] border-transparent text-white shadow-brand hover:border-white/40'
                          : 'bg-white border-neutral-200/70 shadow-soft text-neutral-700 hover:border-[#3678F1]'
                    }`}
                  >
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                        action.locked
                          ? 'bg-neutral-200/70 ring-1 ring-neutral-300/60'
                          : action.primary
                            ? 'bg-white/15 ring-1 ring-white/20'
                            : 'bg-[#E8F0FE] ring-1 ring-[#3678F1]/15'
                      }`}
                    >
                      <action.icon className={`text-[17px] ${action.locked ? 'text-neutral-400' : action.primary ? 'text-white' : 'text-[#3678F1]'}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`text-[15px] font-bold truncate leading-tight ${action.locked ? 'text-neutral-500' : action.primary ? 'text-white' : 'text-neutral-900'}`}>{action.title}</p>
                      <p className={`text-[12px] mt-1 truncate ${action.locked ? 'text-neutral-400' : action.primary ? 'text-white/80' : 'text-neutral-500'}`}>{action.desc}</p>
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
                      { label: 'Chats',         icon: FaMessage, to: '/chat', desc: 'Open conversations' },
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
                              <Link
                                to={`/chat?projectId=${encodeURIComponent(p.id)}`}
                                className="flex items-center justify-center gap-1 rounded-lg py-2 bg-white border border-neutral-200 text-neutral-700 text-[11px] font-semibold hover:bg-neutral-50 hover:border-neutral-300 transition-all"
                              >
                                <FaMessage className="w-2.5 h-2.5" /> Chat
                              </Link>
                              <Link
                                to={`/invoices/${encodeURIComponent(p.id)}`}
                                className="flex items-center justify-center gap-1 rounded-lg py-2 bg-white border border-neutral-200 text-neutral-700 text-[11px] font-semibold hover:bg-neutral-50 hover:border-neutral-300 transition-all"
                              >
                                <FaFileInvoice className="w-2.5 h-2.5" /> Invoice
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

            </div>
          </aside>
        </>
        );
      })()}
    </div>
  );
}
