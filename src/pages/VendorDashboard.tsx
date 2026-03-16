import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { FaCalendar, FaTruck, FaBell, FaChevronLeft, FaChevronRight, FaXmark, FaCircle, FaMessage, FaTriangleExclamation, FaPlus, FaUser } from 'react-icons/fa6';
import { api, ApiException } from '../services/api';
import toast from 'react-hot-toast';
import { useApiQuery } from '../hooks/useApiQuery';
import { formatPaise, formatRateRange } from '../utils/currency';
import DashboardHeader from '../components/DashboardHeader';
import DashboardSidebar from '../components/DashboardSidebar';
import AppFooter from '../components/AppFooter';
import { vendorNavLinks } from '../navigation/dashboardNav';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

type CellStatus = 'available' | 'booked' | 'completed' | null;

interface DayBooking {
  status: CellStatus;
  equipment?: string;
  location?: string;
  project?: string;
  company?: string;
}

interface CalendarCell {
  d: number;
  muted: boolean;
  status: CellStatus;
  bookings: DayBooking[];
}

interface PanelData {
  date: number;
  month: string;
  year: number;
  status: CellStatus;
  bookings: DayBooking[];
}

const _today = new Date();
const BASE_YEAR = _today.getFullYear();
const BASE_MONTH = _today.getMonth();

function datesBetween(start: string, end: string): string[] {
  const out: string[] = [];
  const s = new Date(start);
  const e = new Date(end);
  for (let d = new Date(s); d <= e; d.setDate(d.getDate() + 1)) {
    out.push(d.toISOString().slice(0, 10));
  }
  return out;
}

function buildCalendar(monthOffset: number, bookingsByDay?: Record<string, DayBooking[]>): CalendarCell[] {
  const d = new Date(BASE_YEAR, BASE_MONTH + monthOffset, 1);
  const year = d.getFullYear();
  const month = d.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevDays = new Date(year, month, 0).getDate();
  const cells: CalendarCell[] = [];
  for (let i = firstDay - 1; i >= 0; i--) cells.push({ d: prevDays - i, muted: true, status: null, bookings: [] });
  const monthData = bookingsByDay ?? {};
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const list = monthData[dateStr] ?? [];
    const status: CellStatus = list.length === 0 ? 'available' : (list[0].status ?? 'available');
    cells.push({ d: day, muted: false, status, bookings: list });
  }
  const rem = 7 - (cells.length % 7);
  if (rem < 7) for (let d2 = 1; d2 <= rem; d2++) cells.push({ d: d2, muted: true, status: null, bookings: [] });
  return cells;
}

const cellStyle: Record<string, string> = {
  available:    'bg-[#DCFCE7] border-[#86EFAC] text-[#15803D]',
  booked:       'bg-[#FEE2E2] border-[#FCA5A5] text-[#B91C1C]',
  completed:     'bg-[#DBEAFE] border-[#93C5FD] text-[#1D4ED8]',
};

interface EquipmentItem {
  id: string;
  name: string;
  dailyRateMin?: number | null;
  dailyRateMax?: number | null;
}

interface IncomingBooking {
  id: string; status: string; rateOffered?: number | null; message?: string | null;
  project: { id: string; title: string; startDate?: string; endDate?: string; locationCity?: string | null; shootLocations?: string[] };
  requester: { id: string; email: string; companyProfile?: { companyName?: string } | null };
  vendorEquipment?: { id: string; name: string } | null;
}
interface PastBookingItem {
  id: string; project: { id: string; title: string; startDate: string; endDate: string; locationCity?: string | null; shootLocations?: string[] };
  requester: { companyProfile?: { companyName?: string } | null };
  vendorEquipment?: { id: string; name: string } | null;
}

export default function VendorDashboard() {
  useEffect(() => { document.title = 'Dashboard – Claapo'; }, []);

  const [monthOffset, setMonthOffset] = useState(0);
  const [panel, setPanel] = useState<PanelData | null>(null);
  const [actioning, setActioning] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const displayDate = new Date(BASE_YEAR, BASE_MONTH + monthOffset, 1);
  const monthLabel = MONTHS[displayDate.getMonth()];
  const yearLabel = displayDate.getFullYear();

  const { data: bookingsData, loading: bookingsLoading, refetch: refetchBookings } =
    useApiQuery<{ items: IncomingBooking[] }>('/bookings/incoming');
  const { data: pastData } = useApiQuery<{ items: PastBookingItem[] }>('/bookings/past');
  const { data: equipmentList } = useApiQuery<EquipmentItem[] | { items: EquipmentItem[] }>('/equipment/me');

  const incomingItems = bookingsData?.items ?? [];
  const pendingBookings = incomingItems.filter(b => b.status === 'pending').slice(0, 5);
  const activeCount = incomingItems.filter(b => b.status === 'accepted' || b.status === 'locked').length;
  const pastItems = pastData?.items ?? [];
  const pastCount = pastItems.length;
  const equipmentArray = Array.isArray(equipmentList) ? equipmentList : (equipmentList as { items?: EquipmentItem[] })?.items ?? [];

  const bookingsByDay = (() => {
    const map: Record<string, DayBooking[]> = {};
    const add = (start: string, end: string, status: CellStatus, opts: { project?: string; company?: string; equipment?: string; location?: string }) => {
      const entry: DayBooking = { status, project: opts.project, company: opts.company, equipment: opts.equipment, location: opts.location };
      datesBetween(start, end).forEach((dateStr) => {
        if (!map[dateStr]) map[dateStr] = [];
        map[dateStr].push(entry);
      });
    };
    const locationText = (p: { locationCity?: string | null; shootLocations?: string[] }) => {
      if (p.locationCity) return p.locationCity;
      if (p.shootLocations?.length) return p.shootLocations.join(', ');
      return undefined;
    };
    incomingItems.filter(b => (b.status === 'accepted' || b.status === 'locked') && b.project?.startDate && b.project?.endDate).forEach((b) => {
      add(b.project.startDate!, b.project.endDate!, 'booked', {
        project: b.project.title,
        company: b.requester.companyProfile?.companyName ?? undefined,
        equipment: b.vendorEquipment?.name,
        location: locationText(b.project),
      });
    });
    pastItems.forEach((b) => {
      add(b.project.startDate, b.project.endDate, 'completed', {
        project: b.project.title,
        company: b.requester.companyProfile?.companyName ?? undefined,
        equipment: b.vendorEquipment?.name,
        location: locationText(b.project),
      });
    });
    return map;
  })();

  const calendarDays = buildCalendar(monthOffset, bookingsByDay);

  const doAction = useCallback(async (id: string, action: 'accept' | 'decline') => {
    setActioning(id);
    setActionError(null);
    try {
      await api.patch(`/bookings/${id}/${action}`, {});
      refetchBookings();
    } catch (err) {
      setActionError(err instanceof ApiException ? err.payload.message : 'Action failed');
    } finally {
      setActioning(null);
    }
  }, [refetchBookings]);

  const openPanel = (cell: CalendarCell) => {
    if (cell.muted) return;
    setPanel({ date: cell.d, month: monthLabel, year: yearLabel, status: cell.status, bookings: cell.bookings });
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-[#F3F4F6] w-full">
      <DashboardHeader />

      <div className="flex-1 flex min-h-0 overflow-hidden">
        <DashboardSidebar links={vendorNavLinks} />

        {/* Main content */}
        <main className="flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden">
          <div className="flex-1 min-h-0 overflow-auto">
            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-6 xl:px-8 py-5">

              <div className="mb-5">
                <h1 className="text-xl font-bold text-neutral-900">Vendor Dashboard</h1>
                <p className="text-sm text-neutral-500 mt-0.5">Equipment availability and rental management</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                {/* Calendar — left, 3/4 width on desktop */}
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
                              {cell.status === 'booked' ? (cell.bookings[0]?.equipment ?? 'Booked') : (cell.bookings[0]?.equipment ?? 'Done')}
                            </span>
                          )}
                          {cell.bookings.length > 1 && !cell.muted && (
                            <span className="absolute top-0.5 right-0.5 w-3.5 h-3.5 rounded-full bg-[#3678F1] text-white text-[7px] font-bold flex items-center justify-center leading-none">{cell.bookings.length}</span>
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
                    <p className="mt-3 text-[11px] text-neutral-400">
                      Go to <Link to="/dashboard/vendor-availability" className="text-[#3678F1] hover:underline">Availability</Link> to manage your schedule.
                    </p>
                  </div>
                </div>

                {/* Right column — Booking Requests, Recent Rentals, Quick Actions */}
                <div className="space-y-4 order-1 lg:order-2">
                  {/* Booking Requests */}
                  <div className="rounded-2xl bg-white border border-neutral-200 p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-6 h-6 rounded-lg bg-[#FEF9E6] flex items-center justify-center">
                        <FaBell className="text-[#F4C430] text-xs" />
                      </div>
                      <h3 className="text-sm font-bold text-neutral-900">Booking Requests</h3>
                      {pendingBookings.length > 0 && (
                        <span className="ml-auto text-xs font-bold text-white bg-[#F40F02] rounded-full w-5 h-5 flex items-center justify-center">{pendingBookings.length}</span>
                      )}
                    </div>
                    {actionError && (
                      <div className="flex items-center gap-2 mb-3 p-2.5 bg-red-50 border border-red-200 rounded-xl">
                        <FaTriangleExclamation className="text-red-500 text-xs shrink-0" />
                        <p className="text-xs text-red-700">{actionError}</p>
                      </div>
                    )}
                    {bookingsLoading ? (
                      <div className="space-y-2">{[1,2].map(i => <div key={i} className="h-16 rounded-xl bg-neutral-100 animate-pulse" />)}</div>
                    ) : pendingBookings.length === 0 ? (
                      <p className="text-xs text-neutral-400 text-center py-4">No pending requests</p>
                    ) : (
                      <div className="space-y-2">
                        {pendingBookings.map((b) => (
                          <div key={b.id} className="rounded-xl border border-neutral-200 p-3 bg-[#FAFAFA]">
                            <p className="text-xs font-semibold text-neutral-900 mb-0.5 truncate">{b.project.title}</p>
                            <p className="text-[11px] text-neutral-500 mb-1.5 truncate">{b.requester.companyProfile?.companyName ?? b.requester.email}{b.rateOffered ? ` · ${formatPaise(b.rateOffered)}` : ''}</p>
                            <div className="flex gap-1.5">
                              <button disabled={actioning === b.id} onClick={() => doAction(b.id, 'accept')} className="flex-1 text-[11px] py-1.5 bg-[#22C55E] text-white rounded-lg hover:bg-[#16a34a] font-semibold transition-colors disabled:opacity-60">Accept</button>
                              <button disabled={actioning === b.id} onClick={() => doAction(b.id, 'decline')} className="flex-1 text-[11px] py-1.5 bg-[#F3F4F6] text-neutral-600 rounded-lg hover:bg-neutral-200 font-medium transition-colors disabled:opacity-60">Decline</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    <Link to="/dashboard/bookings" className="mt-3 rounded-xl block w-full py-2 text-xs text-[#3678F1] bg-[#EEF4FF] hover:bg-[#DBEAFE] text-center font-semibold transition-colors">View All Bookings</Link>
                  </div>

                  {/* Recent Rentals */}
                  <div className="rounded-2xl bg-white border border-neutral-200 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-bold text-neutral-900">Recent Rentals</h3>
                      <Link to="/dashboard/past-rentals" className="text-xs text-[#3678F1] hover:underline font-medium">View all</Link>
                    </div>
                    {pastItems.length === 0 ? (
                      <p className="text-xs text-neutral-400 text-center py-4">No past rentals yet</p>
                    ) : (
                      <div className="space-y-2">
                        {pastItems.slice(0, 4).map((b) => (
                          <Link key={b.id} to={`/dashboard/projects/${b.project.id}`} className="block rounded-xl border border-neutral-200 p-3 bg-[#FAFAFA] hover:border-[#3678F1]/50 transition-colors">
                            <p className="text-xs font-semibold text-neutral-900 truncate">{b.project.title}</p>
                            <p className="text-[11px] text-neutral-500 truncate">{b.requester.companyProfile?.companyName ?? '—'}</p>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Stats — same column as individual dashboard */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-2xl bg-white border border-neutral-200 p-3">
                      <p className="text-[11px] text-neutral-500">Active Bookings</p>
                      <p className="text-lg font-bold text-[#3678F1]">{activeCount}</p>
                    </div>
                    <div className="rounded-2xl bg-white border border-neutral-200 p-3">
                      <p className="text-[11px] text-neutral-500">Past Rentals</p>
                      <p className="text-lg font-bold text-[#3678F1]">{pastCount}</p>
                    </div>
                  </div>

                  {/* Equipment summary — in sidebar when present */}
                  {equipmentArray.length > 0 && (
                    <div className="rounded-2xl bg-white border border-neutral-200 p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-bold text-neutral-900">Equipment</h3>
                        <Link to="/dashboard/equipment" className="text-xs text-[#3678F1] hover:underline font-medium">View all</Link>
                      </div>
                      <div className="space-y-2">
                        {equipmentArray.slice(0, 3).map((item) => (
                          <Link key={item.id} to="/dashboard/equipment" className="block rounded-xl border border-neutral-200 p-2.5 bg-[#FAFAFA] hover:border-[#3678F1]/50 transition-colors">
                            <p className="text-xs font-semibold text-neutral-900 truncate">{item.name}</p>
                            <p className="text-[10px] text-neutral-500">{item.dailyRateMin != null || item.dailyRateMax != null ? formatRateRange(item.dailyRateMin, item.dailyRateMax) : '—'}</p>
                          </Link>
                        ))}
                        {equipmentArray.length > 3 && <p className="text-[10px] text-neutral-400">+{equipmentArray.length - 3} more</p>}
                      </div>
                    </div>
                  )}

                  {/* Quick Actions */}
                  <div className="rounded-2xl bg-white border border-neutral-200 p-4">
                    <h3 className="text-sm font-bold text-neutral-900 mb-3">Quick Actions</h3>
                    <div className="space-y-1.5">
                      <Link to="/dashboard/vendor-availability" className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-[#F3F4F6] text-neutral-700 text-xs font-semibold hover:bg-[#EEF4FF] hover:text-[#3678F1] transition-colors">
                        <FaCalendar className="w-3 h-3" /> Manage Availability
                      </Link>
                      <Link to="/dashboard/conversations" className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-[#F3F4F6] text-neutral-700 text-xs font-semibold hover:bg-[#EEF4FF] hover:text-[#3678F1] transition-colors">
                        <FaMessage className="w-3 h-3" /> Open Chat
                      </Link>
                      <Link to="/dashboard/equipment" className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-[#F3F4F6] text-neutral-700 text-xs font-semibold hover:bg-[#EEF4FF] hover:text-[#3678F1] transition-colors">
                        <FaTruck className="w-3 h-3" /> Equipment
                      </Link>
                      <Link to="/dashboard/vendor-profile" className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-[#F3F4F6] text-neutral-700 text-xs font-semibold hover:bg-[#EEF4FF] hover:text-[#3678F1] transition-colors">
                        <FaUser className="w-3 h-3" /> Edit Profile
                      </Link>
                    </div>
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
                    onClick={() => toast('Go to Availability to block this date.')}
                  >
                    Block this date
                  </button>
                </div>
              )}

              {(panel.status === 'booked' || panel.status === 'completed') && panel.bookings.length > 0 && (
                <div className="space-y-4">
                  <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">Equipment &amp; location</p>
                  {panel.bookings.map((b, idx) => (
                    <div key={idx} className="rounded-xl bg-[#F3F4F6] p-4 space-y-2">
                      {b.equipment && (
                        <div className="flex justify-between gap-2">
                          <span className="text-xs text-neutral-500 shrink-0">Equipment</span>
                          <span className="text-xs font-semibold text-neutral-900 text-right">{b.equipment}</span>
                        </div>
                      )}
                      {b.location && (
                        <div className="flex justify-between gap-2">
                          <span className="text-xs text-neutral-500 shrink-0">Where</span>
                          <span className="text-xs font-semibold text-neutral-900 text-right">{b.location}</span>
                        </div>
                      )}
                      {b.project && (
                        <div className="flex justify-between gap-2">
                          <span className="text-xs text-neutral-500 shrink-0">Project</span>
                          <span className="text-xs font-semibold text-neutral-900 text-right">{b.project}</span>
                        </div>
                      )}
                      {b.company && (
                        <div className="flex justify-between gap-2">
                          <span className="text-xs text-neutral-500 shrink-0">Company</span>
                          <span className="text-xs font-semibold text-neutral-900 text-right">{b.company}</span>
                        </div>
                      )}
                    </div>
                  ))}

                  <div className="space-y-2">
                    {panel.status === 'booked' && (
                      <Link
                        to="/dashboard/conversations"
                        className="flex items-center justify-center gap-2 w-full rounded-xl py-2.5 bg-[#3678F1] text-white text-sm font-semibold hover:bg-[#2563d4] transition-colors"
                      >
                        <FaMessage className="w-3.5 h-3.5" /> Contact Company
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
                  onClick={() => toast('Go to Availability to manage your schedule.')}
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
