import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FaCalendar, FaTruck, FaFileInvoice, FaBell, FaHouse, FaChevronLeft, FaChevronRight, FaXmark, FaCircle, FaMessage, FaPlus, FaUser } from 'react-icons/fa6';
import DashboardHeader from '../components/DashboardHeader';
import DashboardSidebar from '../components/DashboardSidebar';
import AppFooter from '../components/AppFooter';
import RoleIndicator from '../components/RoleIndicator';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

type CellStatus = 'available' | 'booked' | 'completed' | null;

interface CalendarCell {
  d: number;
  muted: boolean;
  status: CellStatus;
  equipment?: string;
  company?: string;
  project?: string;
  invoice?: string;
}

interface PanelData {
  date: number;
  month: string;
  year: number;
  status: CellStatus;
  equipment?: string;
  company?: string;
  project?: string;
  invoice?: string;
}

const BASE_YEAR = 2025;
const BASE_MONTH = 0;

const bookedByMonth: Record<number, Record<number, Omit<CalendarCell, 'd' | 'muted'>>> = {
  0: { // January 2025
    8:  { status: 'booked',    equipment: 'RED Camera Package', company: 'Production Studios Inc.', project: 'Commercial Shoot', invoice: 'INV-001' },
    9:  { status: 'booked',    equipment: 'RED Camera Package', company: 'Production Studios Inc.', project: 'Commercial Shoot', invoice: 'INV-001' },
    10: { status: 'booked',    equipment: 'RED Camera Package', company: 'Production Studios Inc.', project: 'Commercial Shoot', invoice: 'INV-001' },
    15: { status: 'booked',    equipment: 'Lighting Kit (LED)', company: 'Creative Agency',         project: 'Music Video',       invoice: 'INV-002' },
    16: { status: 'booked',    equipment: 'Lighting Kit (LED)', company: 'Creative Agency',         project: 'Music Video',       invoice: 'INV-002' },
    17: { status: 'booked',    equipment: 'Lighting Kit (LED)', company: 'Creative Agency',         project: 'Music Video',       invoice: 'INV-002' },
    22: { status: 'completed', equipment: 'Gimbal Stabilizer',  company: 'Studio Shodwe',           project: 'Music Video Prod',  invoice: 'INV-003' },
    23: { status: 'completed', equipment: 'Gimbal Stabilizer',  company: 'Studio Shodwe',           project: 'Music Video Prod',  invoice: 'INV-003' },
  },
  '-1': { // December 2024
    5:  { status: 'completed', equipment: 'RED Camera Package', company: 'Film Studios',   project: 'Documentary',     invoice: 'INV-004' },
    6:  { status: 'completed', equipment: 'RED Camera Package', company: 'Film Studios',   project: 'Documentary',     invoice: 'INV-004' },
    18: { status: 'completed', equipment: 'Transport Van',      company: 'Brand Co.',      project: 'Product Launch',  invoice: 'INV-005' },
    19: { status: 'completed', equipment: 'Transport Van',      company: 'Brand Co.',      project: 'Product Launch',  invoice: 'INV-005' },
    22: { status: 'completed', equipment: 'Lighting Kit (LED)', company: 'Creative Agency',project: 'Commercial Ad',   invoice: 'INV-006' },
    23: { status: 'completed', equipment: 'Lighting Kit (LED)', company: 'Creative Agency',project: 'Commercial Ad',   invoice: 'INV-006' },
  },
};

function buildCalendar(monthOffset: number): CalendarCell[] {
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
    const override = monthData[day];
    cells.push({ d: day, muted: false, ...(override ?? { status: 'available' as CellStatus }) });
  }
  const rem = 7 - (cells.length % 7);
  if (rem < 7) for (let d2 = 1; d2 <= rem; d2++) cells.push({ d: d2, muted: true, status: null });
  return cells;
}

const cellStyle: Record<string, string> = {
  available:    'bg-[#DCFCE7] border-[#86EFAC] text-[#15803D]',
  booked:       'bg-[#FEE2E2] border-[#FCA5A5] text-[#B91C1C]',
  completed:     'bg-[#DBEAFE] border-[#93C5FD] text-[#1D4ED8]',
};

const equipment = [
  { name: 'RED Camera Package', rate: '₹15,000/day', status: 'available' },
  { name: 'Lighting Kit (LED)', rate: '₹8,000/day', status: 'available' },
  { name: 'Gimbal Stabilizer', rate: '₹5,000/day', status: 'booked' },
  { name: 'Transport Van', rate: '₹3,500/day', status: 'available' },
];

const bookingRequests = [
  { id: 1, company: 'Production Studios Inc.', equipment: 'RED Camera Package', dates: 'Jan 8–10' },
  { id: 2, company: 'Creative Agency', equipment: 'Lighting Kit', dates: 'Jan 15–17' },
];

const pastRentals = [
  { name: 'Music Video Production', date: 'Dec 22–23, 2024', company: 'Studio Shodwe', equipment: 'RED Camera Package', invoice: 'INV-001' },
  { name: 'Commercial Ad', date: 'Dec 15–17, 2024', company: 'Creative Agency', equipment: 'Lighting Kit', invoice: 'INV-002' },
];

const navLinks = [
  { icon: FaHouse,     label: 'Dashboard',   to: '/dashboard' },
  { icon: FaCalendar,  label: 'Availability', to: '/dashboard/vendor-availability' },
  { icon: FaTruck,     label: 'Equipment',   to: '/dashboard/equipment' },
  { icon: FaUser,      label: 'Profile',     to: '/dashboard/vendor-profile' },
];

export default function VendorDashboard() {
  useEffect(() => { document.title = 'Dashboard – CrewCall'; }, []);

  const [monthOffset, setMonthOffset] = useState(0);
  const [panel, setPanel] = useState<PanelData | null>(null);

  const displayDate = new Date(2025, monthOffset, 1);
  const monthLabel = MONTHS[displayDate.getMonth()];
  const yearLabel = displayDate.getFullYear();
  const calendarDays = buildCalendar(monthOffset);

  const openPanel = (cell: CalendarCell) => {
    if (cell.muted) return;
    setPanel({ date: cell.d, month: monthLabel, year: yearLabel, status: cell.status, equipment: cell.equipment, company: cell.company, project: cell.project, invoice: cell.invoice });
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-[#F3F4F6] w-full">
      <DashboardHeader userName="Equipment Rentals Co." />

      <div className="flex-1 flex min-h-0 overflow-hidden">
        <DashboardSidebar links={navLinks} />

        {/* Main content */}
        <main className="flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden">
          <div className="flex-1 min-h-0 overflow-auto">
            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-6 xl:px-8 py-5">

              <div className="flex items-center justify-between mb-5">
                <div>
                  <h1 className="text-xl font-bold text-neutral-900">Vendor Dashboard</h1>
                  <p className="text-sm text-neutral-500 mt-0.5">Equipment availability and rental management</p>
                </div>
                <RoleIndicator />
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3 mb-5">
                {[
                  { label: 'Active Bookings', value: '4', color: 'text-[#3678F1]' },
                  { label: 'Past Rentals', value: '28', color: 'text-neutral-900' },
                  { label: 'This Month', value: '₹1.2L', color: 'text-[#22C55E]' },
                ].map(({ label, value, color }) => (
                  <div key={label} className="rounded-2xl bg-white border border-neutral-200 p-4">
                    <p className="text-xs text-neutral-500">{label}</p>
                    <p className={`text-xl font-bold mt-1 ${color}`}>{value}</p>
                  </div>
                ))}
              </div>

              {/* Equipment overview */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                {equipment.map((item) => (
                  <div key={item.name} className="rounded-2xl bg-white border border-neutral-200 p-4">
                    <div className="w-8 h-8 rounded-lg bg-[#EEF4FF] flex items-center justify-center mb-2">
                      <FaTruck className="text-[#3678F1] text-sm" />
                    </div>
                    <h3 className="text-xs font-bold text-neutral-900 mb-0.5 line-clamp-1">{item.name}</h3>
                    <p className="text-[11px] text-neutral-500 mb-2">{item.rate}</p>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      item.status === 'available'
                        ? 'bg-[#DCFCE7] text-[#15803D]'
                        : 'bg-[#FEE2E2] text-[#B91C1C]'
                    }`}>
                      {item.status === 'available' ? 'Available' : 'Booked'}
                    </span>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-5">
                {/* Calendar */}
                <div className="lg:col-span-3 order-2 lg:order-1">
                  <div className="rounded-2xl bg-white border border-neutral-200 p-4 sm:p-5">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-base font-bold text-neutral-900">Equipment Calendar</h2>
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
                      {calendarDays.map((cell, i) => (
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
                              : cell.status && cellStyle[cell.status]
                                ? `${cellStyle[cell.status]} cursor-pointer`
                                : 'bg-white border-neutral-200 text-neutral-600 hover:bg-[#F3F4F6] cursor-pointer'}
                            ${panel?.date === cell.d && !cell.muted ? 'ring-2 ring-[#3678F1] ring-offset-1' : ''}
                          `}
                        >
                          <span className="text-[11px] sm:text-xs font-semibold leading-none">{cell.d}</span>
                          {cell.status && !cell.muted && cell.status !== 'available' && (
                            <span className="text-[8px] sm:text-[9px] font-medium leading-tight truncate w-full opacity-80">
                              {cell.status === 'booked' ? (cell.equipment ?? 'Booked') : (cell.equipment ?? 'Done')}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>

                    <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-neutral-100">
                      {[
                        { color: 'bg-[#22C55E]', label: 'Available' },
                        { color: 'bg-[#F40F02]', label: 'Booked' },
                        { color: 'bg-[#3678F1]', label: 'Completed' },
                      ].map(({ color, label }) => (
                        <div key={label} className="flex items-center gap-2">
                          <div className={`w-2.5 h-2.5 rounded-full ${color}`} />
                          <span className="text-xs text-neutral-500">{label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Booking requests */}
                <div className="space-y-4 order-1 lg:order-2">
                  <div className="rounded-2xl bg-white border border-neutral-200 p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-6 h-6 rounded-lg bg-[#FEF9E6] flex items-center justify-center">
                        <FaBell className="text-[#F4C430] text-xs" />
                      </div>
                      <h3 className="text-sm font-bold text-neutral-900">Requests</h3>
                      <span className="ml-auto text-xs font-bold text-white bg-[#F40F02] rounded-full w-5 h-5 flex items-center justify-center">
                        {bookingRequests.length}
                      </span>
                    </div>
                    <div className="space-y-2">
                      {bookingRequests.map((r) => (
                        <div key={r.id} className="rounded-xl border border-neutral-200 p-3 bg-[#FAFAFA]">
                          <p className="text-xs font-semibold text-neutral-900 mb-0.5">{r.company}</p>
                          <p className="text-[11px] text-neutral-500 mb-0.5">{r.equipment}</p>
                          <p className="text-[11px] text-neutral-400 mb-2">{r.dates}</p>
                          <div className="flex gap-1.5">
                            <button
                              onClick={() => alert(`Accepted: ${r.equipment} for ${r.company}`)}
                              className="flex-1 text-[11px] py-1.5 bg-[#22C55E] text-white rounded-lg hover:bg-[#16a34a] font-semibold transition-colors"
                            >
                              Accept
                            </button>
                            <button
                              onClick={() => alert(`Declined: ${r.equipment} for ${r.company}`)}
                              className="flex-1 text-[11px] py-1.5 bg-[#F3F4F6] text-neutral-600 rounded-lg hover:bg-neutral-200 font-medium transition-colors"
                            >
                              Decline
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Past Rentals */}
              <div className="rounded-2xl bg-white border border-neutral-200 p-4 sm:p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base font-bold text-neutral-900">Recent Rentals</h2>
                  <Link to="/dashboard/past-rentals" className="text-xs text-[#3678F1] hover:underline font-medium">View all</Link>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {pastRentals.map((rental, idx) => (
                    <div key={idx} className="rounded-xl border border-neutral-200 p-4 hover:shadow-sm hover:border-neutral-300 transition-all">
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="w-8 h-8 rounded-lg bg-[#EEF4FF] flex items-center justify-center shrink-0">
                          <FaTruck className="text-[#3678F1] text-xs" />
                        </div>
                        <span className="text-[10px] text-neutral-400">{rental.date}</span>
                      </div>
                      <h4 className="text-sm font-bold text-neutral-900 mb-0.5">{rental.name}</h4>
                      <p className="text-xs text-neutral-500 mb-0.5">{rental.equipment}</p>
                      <p className="text-xs text-neutral-400 mb-3">{rental.company}</p>
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/dashboard/chat/${rental.name.toLowerCase().replace(/\s+/g, '-')}`}
                          className="flex-1 text-[11px] py-1.5 border border-neutral-200 text-neutral-600 rounded-lg hover:bg-neutral-50 text-center flex items-center justify-center gap-1 transition-colors"
                        >
                          <FaMessage className="w-3 h-3" /> Chat
                        </Link>
                        <Link
                          to={`/dashboard/invoice/${rental.invoice}`}
                          className="flex-1 text-[11px] py-1.5 bg-[#F3F4F6] text-neutral-800 rounded-lg hover:bg-neutral-200 text-center flex items-center justify-center gap-1 font-medium transition-colors"
                        >
                          <FaFileInvoice className="w-3 h-3" /> Invoice
                        </Link>
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

            <div className="px-5 py-3 border-b border-neutral-100">
              {panel.status === 'available' && (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#15803D] bg-[#DCFCE7] px-3 py-1.5 rounded-full">
                  <FaCircle className="text-[8px] text-[#22C55E]" /> Available
                </span>
              )}
              {panel.status === 'booked' && (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#B91C1C] bg-[#FEE2E2] px-3 py-1.5 rounded-full">
                  <FaCircle className="text-[8px] text-[#F40F02]" /> Booked
                </span>
              )}
              {panel.status === 'completed' && (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1D4ED8] bg-[#DBEAFE] px-3 py-1.5 rounded-full">
                  <FaCircle className="text-[8px] text-[#3678F1]" /> Past Rental
                </span>
              )}
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4">
              {panel.status === 'available' && (
                <div className="text-center py-8">
                  <div className="w-12 h-12 rounded-full bg-[#DCFCE7] flex items-center justify-center mx-auto mb-3">
                    <FaTruck className="text-[#22C55E] text-lg" />
                  </div>
                  <p className="text-sm font-semibold text-neutral-900 mb-1">Equipment available!</p>
                  <p className="text-xs text-neutral-500 mb-5">This date is open for rental bookings</p>
                  <button
                    type="button"
                    className="rounded-xl w-full py-2.5 bg-[#F3F4F6] text-neutral-700 text-sm font-medium hover:bg-neutral-200 transition-colors"
                    onClick={() => alert('Date blocked!')}
                  >
                    Block this date
                  </button>
                </div>
              )}

              {(panel.status === 'booked' || panel.status === 'completed') && panel.equipment && (
                <div className="space-y-4">
                  <div className="rounded-xl bg-[#F3F4F6] p-4 space-y-3">
                    {[
                      { label: 'Equipment', value: panel.equipment },
                      { label: 'Project', value: panel.project },
                      { label: 'Company', value: panel.company },
                      { label: 'Status', value: panel.status === 'booked' ? 'Active Rental' : 'Completed Rental' },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex justify-between gap-2">
                        <span className="text-xs text-neutral-500 shrink-0">{label}</span>
                        <span className="text-xs font-semibold text-neutral-900 text-right">{value}</span>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-2">
                    {panel.status === 'booked' && (
                      <button
                        type="button"
                        className="flex items-center justify-center gap-2 w-full rounded-xl py-2.5 bg-[#3678F1] text-white text-sm font-semibold hover:bg-[#2563d4] transition-colors"
                      >
                        <FaMessage className="w-3.5 h-3.5" /> Contact Company
                      </button>
                    )}
                    {panel.invoice && (
                      <Link
                        to={`/dashboard/invoice/${panel.invoice}`}
                        className="flex items-center justify-center gap-2 w-full rounded-xl py-2.5 bg-[#F3F4F6] text-neutral-700 text-sm font-semibold hover:bg-neutral-200 transition-colors"
                      >
                        <FaFileInvoice className="w-3.5 h-3.5" /> View Invoice
                      </Link>
                    )}
                  </div>
                </div>
              )}
            </div>

            {panel.status === 'available' && (
              <div className="px-5 py-4 border-t border-neutral-100">
                <button
                  type="button"
                  className="flex items-center justify-center gap-2 w-full rounded-xl py-2.5 bg-[#F4C430] text-neutral-900 text-sm font-bold hover:bg-[#e6b820] transition-colors"
                  onClick={() => alert('Set equipment availability')}
                >
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
