import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FaCalendar, FaTruck, FaHouse, FaChevronLeft, FaChevronRight, FaXmark, FaCircle, FaMessage, FaFileInvoice, FaPlus, FaLock, FaCircleInfo, FaUser } from 'react-icons/fa6';
import DashboardHeader from '../../components/DashboardHeader';
import DashboardSidebar from '../../components/DashboardSidebar';
import AppFooter from '../../components/AppFooter';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

type CellStatus = 'available' | 'booked' | 'completed' | 'blocked' | null;

interface CalendarCell {
  d: number;
  muted: boolean;
  status: CellStatus;
  equipment?: string;
  company?: string;
  project?: string;
  payment?: string;
  invoice?: string;
}

interface PanelData extends Omit<CalendarCell, 'muted'> {
  month: string;
  year: number;
}

const BASE_YEAR = 2025;
const BASE_MONTH = 0;

const bookedByMonth: Record<number, Record<number, Omit<CalendarCell, 'd' | 'muted'>>> = {
  0: {
    8:  { status: 'booked', equipment: 'RED Camera Package', company: 'Production Studios Inc.', project: 'Commercial Shoot', payment: '₹45,000', invoice: 'INV-001' },
    9:  { status: 'booked', equipment: 'RED Camera Package', company: 'Production Studios Inc.', project: 'Commercial Shoot', payment: '₹45,000', invoice: 'INV-001' },
    10: { status: 'booked', equipment: 'RED Camera Package', company: 'Production Studios Inc.', project: 'Commercial Shoot', payment: '₹45,000', invoice: 'INV-001' },
    15: { status: 'booked', equipment: 'Lighting Kit', company: 'Creative Agency', project: 'Music Video', payment: '₹24,000', invoice: 'INV-002' },
    16: { status: 'booked', equipment: 'Lighting Kit', company: 'Creative Agency', project: 'Music Video', payment: '₹24,000', invoice: 'INV-002' },
    17: { status: 'booked', equipment: 'Lighting Kit', company: 'Creative Agency', project: 'Music Video', payment: '₹24,000', invoice: 'INV-002' },
    22: { status: 'completed', equipment: 'Gimbal Stabilizer', company: 'Studio Shodwe', project: 'Music Video Production', payment: '₹15,000', invoice: 'INV-003' },
    23: { status: 'completed', equipment: 'Gimbal Stabilizer', company: 'Studio Shodwe', project: 'Music Video Production', payment: '₹15,000', invoice: 'INV-003' },
  },
  '-1': {
    5:  { status: 'completed', equipment: 'RED Camera Package', company: 'Film Studios', project: 'Documentary', payment: '₹60,000', invoice: 'INV-004' },
    6:  { status: 'completed', equipment: 'RED Camera Package', company: 'Film Studios', project: 'Documentary', payment: '₹60,000', invoice: 'INV-004' },
    18: { status: 'completed', equipment: 'Transport Van', company: 'Brand Co.', project: 'Product Launch', payment: '₹10,500', invoice: 'INV-005' },
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

const BLOCK_REASONS = ['Equipment maintenance', 'Unavailable for rental', 'Reserved for other use', 'Other'];

const navLinks = [
  { icon: FaHouse,     label: 'Dashboard',   to: '/dashboard' },
  { icon: FaCalendar,  label: 'Availability', to: '/dashboard/vendor-availability' },
  { icon: FaTruck,     label: 'Equipment',   to: '/dashboard/equipment' },
  { icon: FaUser,      label: 'Profile',     to: '/dashboard/vendor-profile' },
];

export default function VendorAvailability() {
  useEffect(() => { document.title = 'Equipment Availability – CrewCall'; }, []);

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
      equipment: cell.equipment,
      company: cell.company,
      project: cell.project,
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
    setBlockedDates((prev) => { const next = { ...prev }; delete next[getDateKey(panel.d)]; return next; });
    setPanel(null);
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-[#F3F4F6] w-full">
      <DashboardHeader userName="Equipment Rentals Co." />

      <div className="flex-1 flex min-h-0 overflow-hidden">
        <DashboardSidebar links={navLinks} />

        <main className="flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden">
          <div className="flex-1 min-h-0 overflow-auto">
            <div className="max-w-[1000px] mx-auto px-4 sm:px-6 lg:px-8 py-5">

              <div className="mb-5">
                <h1 className="text-xl font-bold text-neutral-900">Equipment Availability</h1>
                <p className="text-sm text-neutral-500 mt-0.5">Manage equipment schedule, block dates, and view rental history</p>
              </div>

              <div className="rounded-2xl bg-white border border-neutral-200 p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => setMonthOffset((o) => o - 1)} className="w-9 h-9 rounded-xl border border-neutral-200 flex items-center justify-center text-neutral-600 hover:bg-neutral-100 transition-colors">
                      <FaChevronLeft className="text-xs" />
                    </button>
                    <h2 className="text-base font-bold text-neutral-900 min-w-[150px] text-center">{monthLabel} {yearLabel}</h2>
                    <button type="button" onClick={() => setMonthOffset((o) => o + 1)} className="w-9 h-9 rounded-xl border border-neutral-200 flex items-center justify-center text-neutral-600 hover:bg-neutral-100 transition-colors">
                      <FaChevronRight className="text-xs" />
                    </button>
                  </div>
                  <button type="button" onClick={() => setMonthOffset(0)} className="text-xs text-[#3678F1] hover:underline font-medium">Today</button>
                </div>

                {monthOffset < 0 && (
                  <div className="flex items-center gap-2 mb-4 px-3 py-2 bg-[#EEF4FF] rounded-xl">
                    <FaCircleInfo className="text-[#3678F1] text-xs shrink-0" />
                    <p className="text-xs text-[#3678F1]">Viewing history — click completed dates to see rental details</p>
                  </div>
                )}

                <div className="grid grid-cols-7 gap-1 mb-1">
                  {DAYS.map((day) => (
                    <div key={day} className="text-center text-[11px] font-semibold text-neutral-400 py-1.5">{day}</div>
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
                        title={blockRsn ? `Blocked: ${blockRsn}` : cell.equipment ?? undefined}
                        className={`
                          rounded-xl border text-center p-1.5 min-h-[56px] sm:min-h-[64px] select-none flex flex-col items-center justify-center gap-0.5
                          ${cell.muted
                            ? 'bg-white border-neutral-100 text-neutral-300 cursor-default'
                            : `${cellStyle[cell.status ?? 'available'] ?? cellStyle.available} cal-cell cursor-pointer`
                          }
                          ${isSelected ? 'ring-2 ring-[#3678F1] ring-offset-1' : ''}
                        `}
                      >
                        <span className="text-xs font-bold leading-none">{cell.d}</span>
                        {!cell.muted && cell.status && (
                          <span className="text-[9px] leading-tight truncate w-full font-medium opacity-80">
                            {cell.status === 'available' && 'Free'}
                            {cell.status === 'booked' && (cell.equipment?.split(' ')[0] ?? 'Booked')}
                            {cell.status === 'completed' && (cell.equipment?.split(' ')[0] ?? 'Done')}
                            {cell.status === 'blocked' && (blockRsn ? blockRsn.slice(0, 9) + (blockRsn.length > 9 ? '…' : '') : 'Blocked')}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="flex flex-wrap gap-5 mt-5 pt-4 border-t border-neutral-100">
                  {[
                    { color: 'bg-[#22C55E]', label: 'Available' },
                    { color: 'bg-[#F40F02]', label: 'Booked' },
                    { color: 'bg-[#3678F1]', label: 'Completed' },
                    { color: 'bg-neutral-300', label: 'Blocked' },
                  ].map(({ color, label }) => (
                    <div key={label} className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${color}`} />
                      <span className="text-xs text-neutral-500">{label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 rounded-2xl bg-[#EEF4FF] border border-[#BFDBFE] p-4 flex items-start gap-3">
                <FaCircleInfo className="text-[#3678F1] mt-0.5 shrink-0" />
                <div className="text-xs text-[#1D4ED8] space-y-1">
                  <p className="font-semibold">Managing equipment availability</p>
                  <p>Click <strong>available</strong> dates to block equipment for maintenance or other reasons.</p>
                  <p>Navigate to <strong>past months</strong> to view completed rental history with payment details.</p>
                </div>
              </div>

            </div>
          </div>
          <AppFooter />
        </main>
      </div>

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

            <div className="px-5 py-3 border-b border-neutral-100">
              {panel.status === 'available' && <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#15803D] bg-[#DCFCE7] px-3 py-1.5 rounded-full"><FaCircle className="text-[8px] text-[#22C55E]" /> Available</span>}
              {panel.status === 'booked' && <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#B91C1C] bg-[#FEE2E2] px-3 py-1.5 rounded-full"><FaCircle className="text-[8px] text-[#F40F02]" /> Booked</span>}
              {panel.status === 'completed' && <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1D4ED8] bg-[#DBEAFE] px-3 py-1.5 rounded-full"><FaCircle className="text-[8px] text-[#3678F1]" /> Completed</span>}
              {panel.status === 'blocked' && <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-600 bg-[#F3F4F6] px-3 py-1.5 rounded-full"><FaLock className="text-[8px]" /> Blocked</span>}
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4">
              {panel.status === 'available' && !blockForm && (
                <div className="text-center py-8">
                  <div className="w-12 h-12 rounded-full bg-[#DCFCE7] flex items-center justify-center mx-auto mb-3">
                    <FaTruck className="text-[#22C55E] text-lg" />
                  </div>
                  <p className="text-sm font-semibold text-neutral-900 mb-1">Equipment available!</p>
                  <p className="text-xs text-neutral-500 mb-5">Open for rental booking requests</p>
                  <button type="button" onClick={() => setBlockForm(true)} className="rounded-xl w-full py-2.5 bg-[#F3F4F6] text-neutral-700 text-sm font-semibold hover:bg-neutral-200 transition-colors flex items-center justify-center gap-2">
                    <FaLock className="w-3 h-3" /> Block this date
                  </button>
                </div>
              )}

              {panel.status === 'available' && blockForm && (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-bold text-neutral-900 mb-1">Why are you blocking?</p>
                    <p className="text-xs text-neutral-400 mb-4">Equipment won't show as available for these dates.</p>
                    <div className="space-y-2">
                      {BLOCK_REASONS.map((r) => (
                        <label key={r} className="flex items-center gap-3 p-3 rounded-xl border cursor-pointer" style={{ borderColor: blockReason === r ? '#3678F1' : '#E5E7EB', background: blockReason === r ? '#EEF4FF' : 'white' }}>
                          <input type="radio" name="blockReason" value={r} checked={blockReason === r} onChange={() => setBlockReason(r)} className="accent-[#3678F1]" />
                          <span className={`text-sm font-medium ${blockReason === r ? 'text-[#3678F1]' : 'text-neutral-700'}`}>{r}</span>
                        </label>
                      ))}
                    </div>
                    {blockReason === 'Other' && (
                      <input type="text" placeholder="Describe your reason..." value={blockOther} onChange={(e) => setBlockOther(e.target.value)} className="mt-3 rounded-xl w-full px-4 py-3 border border-neutral-300 bg-white text-neutral-900 text-sm focus:outline-none focus:border-[#3678F1]" />
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={handleConfirmBlock} className="flex-1 rounded-xl py-2.5 bg-[#3678F1] text-white text-sm font-semibold hover:bg-[#2563d4] transition-colors">Confirm Block</button>
                    <button type="button" onClick={() => setBlockForm(false)} className="flex-1 rounded-xl py-2.5 bg-[#F3F4F6] text-neutral-700 text-sm font-semibold hover:bg-neutral-200 transition-colors">Cancel</button>
                  </div>
                </div>
              )}

              {panel.status === 'blocked' && (
                <div className="space-y-4">
                  <div className="rounded-xl bg-[#F3F4F6] p-4">
                    <p className="text-xs text-neutral-500 mb-1">Reason</p>
                    <p className="text-sm font-semibold text-neutral-900">{blockedDates[getDateKey(panel.d)] ?? '—'}</p>
                  </div>
                  <button type="button" onClick={handleUnblock} className="rounded-xl w-full py-2.5 bg-[#F4C430] text-neutral-900 text-sm font-bold hover:bg-[#e6b820] transition-colors">Unblock this date</button>
                </div>
              )}

              {(panel.status === 'booked' || panel.status === 'completed') && panel.equipment && (
                <div className="space-y-4">
                  <div className="rounded-xl bg-[#F3F4F6] p-4 space-y-3">
                    {[
                      { label: 'Equipment', value: panel.equipment },
                      { label: 'Project', value: panel.project },
                      { label: 'Company', value: panel.company },
                      { label: 'Payment', value: panel.payment },
                      { label: 'Status', value: panel.status === 'booked' ? 'Active Rental' : 'Completed' },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex justify-between gap-2">
                        <span className="text-xs text-neutral-500 shrink-0">{label}</span>
                        <span className="text-xs font-semibold text-neutral-900 text-right">{value}</span>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-2">
                    {panel.status === 'booked' && (
                      <button type="button" className="flex items-center justify-center gap-2 w-full rounded-xl py-2.5 bg-[#3678F1] text-white text-sm font-semibold hover:bg-[#2563d4] transition-colors">
                        <FaMessage className="w-3.5 h-3.5" /> Contact Company
                      </button>
                    )}
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
                <button type="button" onClick={() => alert('Equipment availability confirmed')} className="flex items-center justify-center gap-2 w-full rounded-xl py-2.5 bg-[#F4C430] text-neutral-900 text-sm font-bold hover:bg-[#e6b820] transition-colors">
                  <FaPlus className="w-3 h-3" /> Manage Availability
                </button>
              </div>
            )}
          </aside>
        </>
      )}
    </div>
  );
}
