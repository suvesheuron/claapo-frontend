import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FaCalendar, FaVideo, FaFileInvoice, FaBell, FaHouse, FaUser, FaChevronLeft, FaChevronRight, FaXmark, FaCircle, FaMessage, FaPlus, FaLock, FaCircleInfo, FaFolder } from 'react-icons/fa6';
import DashboardHeader from '../components/DashboardHeader';
import DashboardSidebar from '../components/DashboardSidebar';
import AppFooter from '../components/AppFooter';
import RoleIndicator from '../components/RoleIndicator';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

type CellStatus = 'available' | 'booked' | 'completed' | 'blocked' | null;

interface CalendarCell {
  d: number;
  muted: boolean;
  status: CellStatus;
  project?: string;
  company?: string;
  role?: string;
  payment?: string;
  invoice?: string;
}

interface PanelData extends Omit<CalendarCell, 'muted'> {
  month: string;
  year: number;
}

const BASE_YEAR = 2025;
const BASE_MONTH = 0; // January

// Mock data for specific months (monthOffset 0 = Jan 2025)
const bookedByMonth: Record<number, Record<number, Omit<CalendarCell, 'd' | 'muted'>>> = {
  0: { // January 2025
    8:  { status: 'booked', project: 'Commercial Shoot', company: 'Production Studios Inc.', role: 'Director', payment: '₹45,000', invoice: 'INV-001' },
    9:  { status: 'booked', project: 'Commercial Shoot', company: 'Production Studios Inc.', role: 'Director', payment: '₹45,000', invoice: 'INV-001' },
    10: { status: 'booked', project: 'Commercial Shoot', company: 'Production Studios Inc.', role: 'Director', payment: '₹45,000', invoice: 'INV-001' },
    15: { status: 'booked', project: 'Documentary Film', company: 'Film Studios', role: 'DOP', payment: '₹38,000', invoice: 'INV-002' },
    16: { status: 'booked', project: 'Documentary Film', company: 'Film Studios', role: 'DOP', payment: '₹38,000', invoice: 'INV-002' },
    17: { status: 'booked', project: 'Documentary Film', company: 'Film Studios', role: 'DOP', payment: '₹38,000', invoice: 'INV-002' },
    22: { status: 'completed', project: 'Music Video', company: 'Studio Shodwe', role: 'Director', payment: '₹52,000', invoice: 'INV-003' },
    23: { status: 'completed', project: 'Music Video', company: 'Studio Shodwe', role: 'Director', payment: '₹52,000', invoice: 'INV-003' },
  },
  '-1': { // December 2024
    10: { status: 'completed', project: 'Brand Film', company: 'Ad Agency', role: 'DOP', payment: '₹60,000', invoice: 'INV-004' },
    11: { status: 'completed', project: 'Brand Film', company: 'Ad Agency', role: 'DOP', payment: '₹60,000', invoice: 'INV-004' },
    20: { status: 'completed', project: 'TVC Shoot', company: 'Creative Co.', role: 'Director', payment: '₹75,000', invoice: 'INV-005' },
    21: { status: 'completed', project: 'TVC Shoot', company: 'Creative Co.', role: 'Director', payment: '₹75,000', invoice: 'INV-005' },
    22: { status: 'completed', project: 'TVC Shoot', company: 'Creative Co.', role: 'Director', payment: '₹75,000', invoice: 'INV-005' },
  },
};

function buildCalendar(monthOffset: number, blockedDates: Record<string, string>): CalendarCell[] {
  const d = new Date(BASE_YEAR, BASE_MONTH + monthOffset, 1);
  const year = d.getFullYear();
  const month = d.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevDays = new Date(year, month, 0).getDate();

  const cells: CalendarCell[] = [];
  for (let i = firstDay - 1; i >= 0; i--) cells.push({ d: prevDays - i, muted: true, status: null });

  const monthData = bookedByMonth[monthOffset] ?? {};

  for (let day = 1; day <= daysInMonth; day++) {
    const blockKey = `${year}-${month}-${day}`;
    if (blockedDates[blockKey]) {
      cells.push({ d: day, muted: false, status: 'blocked' });
    } else {
      const override = monthData[day];
      cells.push({ d: day, muted: false, ...(override ?? { status: 'available' as CellStatus }) });
    }
  }

  const rem = 7 - (cells.length % 7);
  if (rem < 7) for (let d2 = 1; d2 <= rem; d2++) cells.push({ d: d2, muted: true, status: null });
  return cells;
}

const cellStyle: Record<string, string> = {
  available: 'bg-[#DCFCE7] border-[#86EFAC] text-[#15803D]',
  booked:    'bg-[#FEE2E2] border-[#FCA5A5] text-[#B91C1C]',
  completed: 'bg-[#DBEAFE] border-[#93C5FD] text-[#1D4ED8]',
  blocked:   'bg-[#F3F4F6] border-neutral-300 text-neutral-400',
};

const BLOCK_REASONS = ['Personal', 'Already booked externally', 'Not available', 'Traveling', 'Other'];

const notifications = [
  { id: 1, project: 'Commercial Shoot', from: 'Production Studios Inc.', dates: 'Jan 8–10, 2025' },
  { id: 2, project: 'Documentary', from: 'Film Studios', dates: 'Jan 15–17, 2025' },
];

const navLinks = [
  { icon: FaHouse, label: 'Dashboard', to: '/dashboard' },
  { icon: FaCalendar, label: 'Availability', to: '/dashboard/availability' },
  { icon: FaFolder, label: 'Past Projects', to: '/dashboard/past-projects' },
  { icon: FaUser, label: 'Profile', to: '/dashboard/profile' },
];

export default function IndividualDashboard() {
  useEffect(() => { document.title = 'Dashboard – CrewCall'; }, []);

  const [monthOffset, setMonthOffset] = useState(0);
  const [panel, setPanel] = useState<PanelData | null>(null);
  const [blockedDates, setBlockedDates] = useState<Record<string, string>>({});
  const [blockForm, setBlockForm] = useState(false);
  const [blockReason, setBlockReason] = useState(BLOCK_REASONS[0]);
  const [blockOther, setBlockOther] = useState('');

  const displayDate = new Date(BASE_YEAR, BASE_MONTH + monthOffset, 1);
  const monthLabel = MONTHS[displayDate.getMonth()];
  const yearLabel = displayDate.getFullYear();
  const calendarDays = buildCalendar(monthOffset, blockedDates);

  const getDateKey = (d: number) => `${yearLabel}-${displayDate.getMonth()}-${d}`;

  const openPanel = (cell: CalendarCell) => {
    if (cell.muted) return;
    setBlockForm(false);
    setBlockReason(BLOCK_REASONS[0]);
    setBlockOther('');
    const isBlocked = !!blockedDates[getDateKey(cell.d)];
    setPanel({
      d: cell.d,
      status: isBlocked ? 'blocked' : cell.status,
      project: cell.project,
      company: cell.company,
      role: cell.role,
      payment: cell.payment,
      invoice: cell.invoice,
      month: monthLabel,
      year: yearLabel,
    });
  };

  const handleConfirmBlock = () => {
    if (!panel) return;
    const reason = blockReason === 'Other' ? blockOther : blockReason;
    if (!reason.trim()) return;
    setBlockedDates((prev) => ({ ...prev, [getDateKey(panel.d)]: reason }));
    setPanel(null);
    setBlockForm(false);
  };

  const handleUnblock = () => {
    if (!panel) return;
    setBlockedDates((prev) => {
      const next = { ...prev };
      delete next[getDateKey(panel.d)];
      return next;
    });
    setPanel(null);
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-[#F3F4F6] w-full">
      <DashboardHeader userName="John Director" />

      <div className="flex-1 flex min-h-0 overflow-hidden">
        <DashboardSidebar links={navLinks} />

        <main className="flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden">
          <div className="flex-1 min-h-0 overflow-auto">
            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-6 xl:px-8 py-5">

              <div className="flex items-center justify-between mb-5">
                <div>
                  <h1 className="text-xl font-bold text-neutral-900">My Dashboard</h1>
                  <p className="text-sm text-neutral-500 mt-0.5">Your availability and booking overview</p>
                </div>
                <RoleIndicator />
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3 mb-5">
                {[
                  { label: 'Active Bookings', value: '2', color: 'text-[#3678F1]' },
                  { label: 'Completed', value: '12', color: 'text-[#3678F1]' },
                  { label: 'This Month', value: '₹2.5L', color: 'text-[#22C55E]' },
                ].map(({ label, value, color }) => (
                  <div key={label} className="rounded-2xl bg-white border border-neutral-200 p-4">
                    <p className="text-xs text-neutral-500">{label}</p>
                    <p className={`text-xl font-bold mt-1 ${color}`}>{value}</p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                {/* Calendar */}
                <div className="lg:col-span-3 order-2 lg:order-1">
                  <div className="rounded-2xl bg-white border border-neutral-200 p-4 sm:p-5">
                    <div className="flex items-center justify-between mb-2">
                      <h2 className="text-base font-bold text-neutral-900">Availability Calendar</h2>
                      <div className="flex items-center gap-2">
                        <button type="button" onClick={() => setMonthOffset((o) => o - 1)} className="w-8 h-8 rounded-lg border border-neutral-200 flex items-center justify-center text-neutral-600 hover:bg-neutral-100 transition-colors">
                          <FaChevronLeft className="text-xs" />
                        </button>
                        <span className="text-sm font-semibold text-neutral-900 min-w-[130px] text-center">{monthLabel} {yearLabel}</span>
                        <button type="button" onClick={() => setMonthOffset((o) => o + 1)} className="w-8 h-8 rounded-lg border border-neutral-200 flex items-center justify-center text-neutral-600 hover:bg-neutral-100 transition-colors">
                          <FaChevronRight className="text-xs" />
                        </button>
                      </div>
                    </div>

                    {/* History hint for past months */}
                    {monthOffset < 0 && (
                      <div className="flex items-center gap-2 mb-3 px-3 py-2 bg-[#EEF4FF] rounded-xl">
                        <FaCircleInfo className="text-[#3678F1] text-xs shrink-0" />
                        <p className="text-xs text-[#3678F1]">Viewing history — click any completed date to see project details</p>
                      </div>
                    )}

                    <div className="grid grid-cols-7 gap-1 mb-1">
                      {DAYS.map((day) => (
                        <div key={day} className="text-center text-[11px] font-semibold text-neutral-400 py-1">{day}</div>
                      ))}
                    </div>

                    <div className="grid grid-cols-7 gap-1">
                      {calendarDays.map((cell, i) => {
                        const isSelected = panel?.d === cell.d && !cell.muted;
                        const blockKey = getDateKey(cell.d);
                        const blockRsn = blockedDates[blockKey];
                        return (
                          <div
                            key={i}
                            role={cell.muted ? undefined : 'button'}
                            tabIndex={cell.muted ? undefined : 0}
                            onClick={() => openPanel(cell)}
                            title={blockRsn ? `Blocked: ${blockRsn}` : cell.project ?? undefined}
                            className={`
                              rounded-xl border text-center p-1 sm:p-1.5 min-h-[44px] sm:min-h-[52px] select-none flex flex-col items-center justify-center gap-0.5
                              ${cell.muted
                                ? 'bg-white border-neutral-100 text-neutral-300 cursor-default'
                                : `${cellStyle[cell.status ?? 'available'] ?? cellStyle.available} cal-cell cursor-pointer`
                              }
                              ${isSelected ? 'ring-2 ring-[#3678F1] ring-offset-1' : ''}
                            `}
                          >
                            <span className="text-[11px] sm:text-xs font-semibold leading-none">{cell.d}</span>
                            {!cell.muted && cell.status && (
                              <span className="text-[8px] sm:text-[9px] leading-tight truncate w-full opacity-80 font-medium">
                                {cell.status === 'available' && 'Free'}
                                {cell.status === 'booked' && (cell.project ?? 'Booked')}
                                {cell.status === 'completed' && (cell.project ?? 'Done')}
                                {cell.status === 'blocked' && (blockRsn ? blockRsn.slice(0, 8) + (blockRsn.length > 8 ? '…' : '') : 'Blocked')}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Legend */}
                    <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-neutral-100">
                      {[
                        { color: 'bg-[#22C55E]', label: 'Available' },
                        { color: 'bg-[#F40F02]', label: 'Booked' },
                        { color: 'bg-[#3678F1]', label: 'Completed' },
                        { color: 'bg-neutral-300', label: 'Blocked' },
                      ].map(({ color, label }) => (
                        <div key={label} className="flex items-center gap-2">
                          <div className={`w-2.5 h-2.5 rounded-full ${color}`} />
                          <span className="text-xs text-neutral-500">{label}</span>
                        </div>
                      ))}
                    </div>

                    <p className="mt-3 text-[11px] text-neutral-400">
                      Navigate to past months to view your completed project history.
                    </p>
                  </div>
                </div>

                {/* Right column */}
                <div className="space-y-4 order-1 lg:order-2">
                  <div className="rounded-2xl bg-white border border-neutral-200 p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-6 h-6 rounded-lg bg-[#FEF9E6] flex items-center justify-center">
                        <FaBell className="text-[#F4C430] text-xs" />
                      </div>
                      <h3 className="text-sm font-bold text-neutral-900">Booking Requests</h3>
                      <span className="ml-auto text-xs font-bold text-white bg-[#F40F02] rounded-full w-5 h-5 flex items-center justify-center">
                        {notifications.length}
                      </span>
                    </div>
                    <div className="space-y-2">
                      {notifications.map((n) => (
                        <div key={n.id} className="rounded-xl border border-neutral-200 p-3 bg-[#FAFAFA]">
                          <p className="text-xs font-semibold text-neutral-900 mb-0.5">{n.project}</p>
                          <p className="text-[11px] text-neutral-500 mb-2">{n.from} · {n.dates}</p>
                          <div className="flex gap-1.5">
                            <button onClick={() => alert(`Accepted: ${n.project}`)} className="flex-1 text-[11px] py-1.5 bg-[#22C55E] text-white rounded-lg hover:bg-[#16a34a] font-semibold transition-colors">Accept</button>
                            <button onClick={() => alert(`Declined: ${n.project}`)} className="flex-1 text-[11px] py-1.5 bg-[#F3F4F6] text-neutral-600 rounded-lg hover:bg-neutral-200 font-medium transition-colors">Decline</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-2xl bg-white border border-neutral-200 p-4">
                    <h3 className="text-sm font-bold text-neutral-900 mb-3">Quick Actions</h3>
                    <div className="space-y-1.5">
                      <Link
                        to="/dashboard/availability"
                        className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-[#F3F4F6] text-neutral-700 text-xs font-semibold hover:bg-[#EEF4FF] hover:text-[#3678F1] transition-colors"
                      >
                        <FaCalendar className="w-3 h-3" /> Manage Availability
                      </Link>
                      <Link
                        to="/dashboard/profile"
                        className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-[#F3F4F6] text-neutral-700 text-xs font-semibold hover:bg-[#EEF4FF] hover:text-[#3678F1] transition-colors"
                      >
                        <FaUser className="w-3 h-3" /> Edit Profile
                      </Link>
                    </div>
                  </div>

                </div>
              </div>

              {/* Recent Completed Projects (from current month data) */}
              <div className="rounded-2xl bg-white border border-neutral-200 p-4 sm:p-5 mt-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base font-bold text-neutral-900">Recent Bookings</h2>
                  <p className="text-xs text-neutral-400">Click past dates on calendar for details</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {[
                    { name: 'Music Video Production', date: 'Dec 22–23, 2024', role: 'Director', company: 'Studio Shodwe', invoice: 'INV-001', status: 'completed' },
                    { name: 'Commercial Ad', date: 'Dec 15–17, 2024', role: 'DOP', company: 'Creative Agency', invoice: 'INV-002', status: 'completed' },
                    { name: 'Commercial Shoot', date: 'Jan 8–10, 2025', role: 'Director', company: 'Production Studios', invoice: '', status: 'booked' },
                  ].map((project, idx) => (
                    <div key={idx} className="rounded-xl border border-neutral-200 p-4 hover:shadow-sm hover:border-neutral-300 transition-all">
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="w-8 h-8 rounded-lg bg-[#DBEAFE] flex items-center justify-center shrink-0">
                          <FaVideo className="text-[#3678F1] text-xs" />
                        </div>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          project.status === 'completed' ? 'bg-[#DBEAFE] text-[#1D4ED8]' : 'bg-[#FEE2E2] text-[#B91C1C]'
                        }`}>
                          {project.status === 'completed' ? 'Completed' : 'Booked'}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-neutral-900 mb-0.5 truncate">{project.name}</h4>
                      <p className="text-xs text-neutral-500 mb-3">{project.role} · {project.company} · {project.date}</p>
                      <div className="flex items-center gap-2">
                        <Link to={`/dashboard/chat/${project.name.toLowerCase().replace(/\s+/g, '-')}`} className="flex-1 text-[11px] py-1.5 border border-neutral-200 text-neutral-600 rounded-lg hover:bg-neutral-50 text-center flex items-center justify-center gap-1 transition-colors">
                          <FaMessage className="w-3 h-3" /> Chat
                        </Link>
                        {project.invoice && (
                          <Link to={`/dashboard/invoice/${project.invoice}`} className="flex-1 text-[11px] py-1.5 bg-[#F3F4F6] text-neutral-800 rounded-lg hover:bg-neutral-200 text-center flex items-center justify-center gap-1 font-medium transition-colors">
                            <FaFileInvoice className="w-3 h-3" /> Invoice
                          </Link>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
          <AppFooter />
        </main>
      </div>

      {/* Right-side sliding panel */}
      {panel && (
        <>
          <div className="fixed inset-0 bg-black/20 z-40 lg:bg-transparent" onClick={() => { setPanel(null); setBlockForm(false); }} />
          <aside className="fixed right-0 top-0 h-full w-80 bg-white border-l border-neutral-200 shadow-2xl z-50 side-panel flex flex-col panel-enter">
            <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100">
              <div>
                <p className="text-xs text-neutral-400">{panel.month} {panel.year}</p>
                <h3 className="text-lg font-bold text-neutral-900">{panel.d} {panel.month}</h3>
              </div>
              <button type="button" onClick={() => { setPanel(null); setBlockForm(false); }} className="w-8 h-8 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-500 hover:bg-neutral-200 transition-colors">
                <FaXmark className="text-sm" />
              </button>
            </div>

            {/* Status badge */}
            <div className="px-5 py-3 border-b border-neutral-100">
              {panel.status === 'available' && <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#15803D] bg-[#DCFCE7] px-3 py-1.5 rounded-full"><FaCircle className="text-[8px] text-[#22C55E]" /> Available</span>}
              {panel.status === 'booked' && <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#B91C1C] bg-[#FEE2E2] px-3 py-1.5 rounded-full"><FaCircle className="text-[8px] text-[#F40F02]" /> Booked</span>}
              {panel.status === 'completed' && <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1D4ED8] bg-[#DBEAFE] px-3 py-1.5 rounded-full"><FaCircle className="text-[8px] text-[#3678F1]" /> Completed</span>}
              {panel.status === 'blocked' && <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-600 bg-[#F3F4F6] px-3 py-1.5 rounded-full"><FaLock className="text-[8px]" /> Blocked</span>}
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4">
              {/* Available — no block form */}
              {panel.status === 'available' && !blockForm && (
                <div className="text-center py-8">
                  <div className="w-12 h-12 rounded-full bg-[#DCFCE7] flex items-center justify-center mx-auto mb-3">
                    <FaCalendar className="text-[#22C55E] text-lg" />
                  </div>
                  <p className="text-sm font-semibold text-neutral-900 mb-1">You're available!</p>
                  <p className="text-xs text-neutral-500 mb-5">This date is open for booking requests</p>
                  <button type="button" onClick={() => setBlockForm(true)} className="rounded-xl w-full py-2.5 bg-[#F3F4F6] text-neutral-700 text-sm font-semibold hover:bg-neutral-200 transition-colors flex items-center justify-center gap-2">
                    <FaLock className="w-3 h-3" /> Block this date
                  </button>
                </div>
              )}

              {/* Block Date Reason Form */}
              {panel.status === 'available' && blockForm && (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-bold text-neutral-900 mb-1">Why are you blocking this date?</p>
                    <p className="text-xs text-neutral-400 mb-4">This will hide the date from booking requests.</p>
                    <div className="space-y-2">
                      {BLOCK_REASONS.map((r) => (
                        <label key={r} className="flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors hover:bg-[#F3F4F6]" style={{ borderColor: blockReason === r ? '#3678F1' : '#E5E7EB', background: blockReason === r ? '#EEF4FF' : 'white' }}>
                          <input
                            type="radio"
                            name="blockReason"
                            value={r}
                            checked={blockReason === r}
                            onChange={() => setBlockReason(r)}
                            className="accent-[#3678F1]"
                          />
                          <span className={`text-sm font-medium ${blockReason === r ? 'text-[#3678F1]' : 'text-neutral-700'}`}>{r}</span>
                        </label>
                      ))}
                    </div>
                    {blockReason === 'Other' && (
                      <input
                        type="text"
                        placeholder="Describe your reason..."
                        value={blockOther}
                        onChange={(e) => setBlockOther(e.target.value)}
                        className="mt-3 rounded-xl w-full px-4 py-3 border border-neutral-300 bg-white text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-[#3678F1] text-sm"
                      />
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={handleConfirmBlock} className="flex-1 rounded-xl py-2.5 bg-[#3678F1] text-white text-sm font-semibold hover:bg-[#2563d4] transition-colors">
                      Confirm Block
                    </button>
                    <button type="button" onClick={() => setBlockForm(false)} className="flex-1 rounded-xl py-2.5 bg-[#F3F4F6] text-neutral-700 text-sm font-semibold hover:bg-neutral-200 transition-colors">
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Blocked date */}
              {panel.status === 'blocked' && (
                <div className="space-y-4">
                  <div className="rounded-xl bg-[#F3F4F6] p-4">
                    <p className="text-xs text-neutral-500 mb-1">Reason for blocking</p>
                    <p className="text-sm font-semibold text-neutral-900">{blockedDates[getDateKey(panel.d)] ?? '—'}</p>
                  </div>
                  <button type="button" onClick={handleUnblock} className="rounded-xl w-full py-2.5 bg-[#F4C430] text-neutral-900 text-sm font-bold hover:bg-[#e6b820] transition-colors">
                    Unblock this date
                  </button>
                </div>
              )}

              {/* Booked / Completed — show project details */}
              {(panel.status === 'booked' || panel.status === 'completed') && panel.project && (
                <div className="space-y-4">
                  <div className="rounded-xl bg-[#F3F4F6] p-4 space-y-3">
                    {[
                      { label: 'Project', value: panel.project },
                      { label: 'Company', value: panel.company },
                      { label: 'Your Role', value: panel.role },
                      { label: 'Payment', value: panel.payment },
                      { label: 'Status', value: panel.status === 'booked' ? 'Confirmed' : 'Completed' },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex justify-between gap-2">
                        <span className="text-xs text-neutral-500 shrink-0">{label}</span>
                        <span className="text-xs font-semibold text-neutral-900 text-right">{value}</span>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-2">
                    <button type="button" className="flex items-center justify-center gap-2 w-full rounded-xl py-2.5 bg-[#3678F1] text-white text-sm font-semibold hover:bg-[#2563d4] transition-colors">
                      <FaMessage className="w-3.5 h-3.5" /> View Chat
                    </button>
                    {panel.invoice && (
                      <Link to={`/dashboard/invoice/${panel.invoice}`} className="flex items-center justify-center gap-2 w-full rounded-xl py-2.5 bg-[#F3F4F6] text-neutral-700 text-sm font-semibold hover:bg-neutral-200 transition-colors">
                        <FaFileInvoice className="w-3.5 h-3.5" /> View Invoice
                      </Link>
                    )}
                  </div>
                </div>
              )}
            </div>

            {panel.status === 'available' && !blockForm && (
              <div className="px-5 py-4 border-t border-neutral-100">
                <button type="button" className="flex items-center justify-center gap-2 w-full rounded-xl py-2.5 bg-[#F4C430] text-neutral-900 text-sm font-bold hover:bg-[#e6b820] transition-colors" onClick={() => alert('Availability confirmed')}>
                  <FaPlus className="w-3 h-3" /> Mark as Available
                </button>
              </div>
            )}
          </aside>
        </>
      )}
    </div>
  );
}
