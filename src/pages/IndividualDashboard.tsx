import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { FaCalendar, FaBell, FaChevronLeft, FaChevronRight, FaXmark, FaCircle, FaMessage, FaLock, FaCircleInfo, FaTriangleExclamation, FaUser, FaBan } from 'react-icons/fa6';
import DashboardHeader from '../components/DashboardHeader';
import DashboardSidebar from '../components/DashboardSidebar';
import AppFooter from '../components/AppFooter';
import RoleIndicator from '../components/RoleIndicator';
import { api, ApiException } from '../services/api';
import { useApiQuery } from '../hooks/useApiQuery';
import { formatPaise } from '../utils/currency';
import { individualNavLinks } from '../navigation/dashboardNav';
import toast from 'react-hot-toast';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

const today = new Date();
const BASE_YEAR = today.getFullYear();
const BASE_MONTH = today.getMonth();

type CellStatus = 'available' | 'booked' | 'completed' | 'blocked' | null;

interface CalendarCell { d: number; muted: boolean; status: CellStatus; project?: string; bookingId?: string; bookingStatus?: string; }
interface PanelData { d: number; status: CellStatus; project?: string; month: string; year: number; bookingId?: string; bookingStatus?: string; }

interface IncomingBooking {
  id: string;
  status: string;
  rateOffered?: number | null;
  message?: string | null;
  project: { id: string; title: string; startDate: string; endDate: string; status?: string; companyUser?: { companyProfile?: { companyName?: string } | null } };
  requester: { id: string; email: string; companyProfile?: { companyName?: string } | null };
}
interface IncomingBookingsResponse { items: IncomingBooking[] }

const cellStyle: Record<string, string> = {
  available: 'bg-[#DCFCE7] border-[#86EFAC] text-[#15803D]',
  booked:    'bg-[#FEE2E2] border-[#FCA5A5] text-[#B91C1C]',
  completed: 'bg-[#DBEAFE] border-[#93C5FD] text-[#1D4ED8]',
  blocked:   'bg-[#F3F4F6] border-neutral-300 text-neutral-400',
};

function toStatus(s: string): CellStatus {
  if (s === 'past_work') return 'completed';
  if (s === 'blocked') return 'blocked';
  if (s === 'booked') return 'booked';
  return 'available';
}

function buildCalendar(
  year: number,
  month: number,
  apiSlots: Record<string, string>,
  bookings: IncomingBooking[],
): CalendarCell[] {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevDays = new Date(year, month, 0).getDate();
  const cells: CalendarCell[] = [];
  for (let i = firstDay - 1; i >= 0; i--) cells.push({ d: prevDays - i, muted: true, status: null });
  const bookedStatuses = ['pending', 'accepted', 'locked', 'cancel_requested'];
  for (let day = 1; day <= daysInMonth; day++) {
    const m = String(month + 1).padStart(2, '0');
    const dateStr = `${year}-${m}-${String(day).padStart(2, '0')}`;
    const slotStatus = apiSlots[dateStr];
    let status: CellStatus = slotStatus ? toStatus(slotStatus) : 'available';
    let project: string | undefined;
    let bookingId: string | undefined;
    let bookingStatus: string | undefined;
    for (const b of bookings) {
      if (b.project.status === 'cancelled') continue;
      const start = b.project.startDate.slice(0, 10);
      const end = b.project.endDate.slice(0, 10);
      if (dateStr >= start && dateStr <= end) {
        project = b.project.title;
        bookingId = b.id;
        bookingStatus = b.status;
        if (bookedStatuses.includes(b.status) && status !== 'completed') status = 'booked';
        break;
      }
    }
    cells.push({ d: day, muted: false, status, project, bookingId, bookingStatus });
  }
  const rem = 7 - (cells.length % 7);
  if (rem < 7) for (let d2 = 1; d2 <= rem; d2++) cells.push({ d: d2, muted: true, status: null });
  return cells;
}

export default function IndividualDashboard() {
  useEffect(() => { document.title = 'Dashboard – Claapo'; }, []);

  const [monthOffset, setMonthOffset] = useState(0);
  const [panel, setPanel] = useState<PanelData | null>(null);
  const [actioning, setActioning] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [availabilitySlots, setAvailabilitySlots] = useState<Record<string, string>>({});
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  const displayDate = new Date(BASE_YEAR, BASE_MONTH + monthOffset, 1);
  const displayYear = displayDate.getFullYear();
  const displayMonth = displayDate.getMonth();
  const monthLabel = MONTHS[displayMonth];
  const yearLabel = displayDate.getFullYear();

  const { data: bookingsData, loading: bookingsLoading, refetch: refetchBookings } =
    useApiQuery<IncomingBookingsResponse>('/bookings/incoming');
  const allBookings = bookingsData?.items ?? [];
  const pendingBookings = allBookings.filter(b => b.status === 'pending').slice(0, 5);

  const loadAvailability = useCallback(async () => {
    setAvailabilityLoading(true);
    try {
      const res = await api.get<{ slots?: Record<string, string> }>(
        `/availability/me?year=${displayYear}&month=${displayMonth + 1}`,
      );
      setAvailabilitySlots(res?.slots && typeof res.slots === 'object' ? res.slots : {});
    } catch {
      setAvailabilitySlots({});
    } finally {
      setAvailabilityLoading(false);
    }
  }, [displayYear, displayMonth]);

  useEffect(() => { loadAvailability(); }, [loadAvailability]);

  const calendarDays = buildCalendar(displayYear, displayMonth, availabilitySlots, allBookings);

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

  const doRequestCancel = useCallback(async (bookingId: string) => {
    setActioning(bookingId + 'req-cancel');
    setActionError(null);
    try {
      await api.patch(`/bookings/${bookingId}/request-cancel`, { reason: cancelReason || undefined });
      toast.success('Cancellation request sent. Awaiting company approval.');
      setCancellingId(null);
      setCancelReason('');
      refetchBookings();
      loadAvailability();
    } catch (err) {
      const msg = err instanceof ApiException ? err.payload.message : 'Failed to request cancellation.';
      toast.error(msg);
      setActionError(msg);
    } finally {
      setActioning(null);
    }
  }, [cancelReason, refetchBookings, loadAvailability]);

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-[#F3F4F6] w-full">
      <DashboardHeader />
      <div className="flex-1 flex min-h-0 overflow-hidden">
        <DashboardSidebar links={individualNavLinks} />
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

              <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                {/* Calendar */}
                <div className="lg:col-span-3 order-2 lg:order-1">
                  <div className="rounded-2xl bg-white border border-neutral-200 p-4 sm:p-5 relative">
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

                    {monthOffset < 0 && (
                      <div className="flex items-center gap-2 mb-3 px-3 py-2 bg-[#EEF4FF] rounded-xl">
                        <FaCircleInfo className="text-[#3B5BDB] text-xs shrink-0" />
                        <p className="text-xs text-[#3B5BDB]">Viewing history — go to <Link to="/dashboard/availability" className="underline">Availability</Link> to manage dates</p>
                      </div>
                    )}

                    <div className="grid grid-cols-7 gap-1 mb-1">
                      {DAYS.map((day) => <div key={day} className="text-center text-[11px] font-semibold text-neutral-400 py-1">{day}</div>)}
                    </div>
                    {(availabilityLoading || bookingsLoading) && (
                      <div className="absolute inset-0 rounded-2xl bg-white/80 flex items-center justify-center">
                        <span className="text-xs text-neutral-500">Loading calendar…</span>
                      </div>
                    )}
                    <div className="grid grid-cols-7 gap-1">
                      {calendarDays.map((cell, i) => (
                        <div key={i} role={cell.muted ? undefined : 'button'} tabIndex={cell.muted ? undefined : 0}
                          onClick={() => !cell.muted && setPanel({ d: cell.d, status: cell.status, project: cell.project, month: monthLabel, year: yearLabel, bookingId: cell.bookingId, bookingStatus: cell.bookingStatus })}
                          className={`rounded-xl border text-center p-1 sm:p-1.5 min-h-[44px] sm:min-h-[52px] select-none flex flex-col items-center justify-center gap-0.5 ${
                            cell.muted ? 'bg-white border-neutral-100 text-neutral-300 cursor-default' :
                            `${cellStyle[cell.status ?? 'available'] ?? cellStyle.available} cal-cell cursor-pointer`
                          } ${panel?.d === cell.d && !cell.muted ? 'ring-2 ring-[#3B5BDB] ring-offset-1' : ''}`}>
                          <span className="text-[11px] sm:text-xs font-semibold leading-none">{cell.d}</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-neutral-100">
                      {[
                        { color: 'bg-[#22C55E]', label: 'Available' },
                        { color: 'bg-[#F40F02]', label: 'Booked' },
                        { color: 'bg-[#3B5BDB]', label: 'Completed' },
                        { color: 'bg-neutral-300', label: 'Blocked' },
                      ].map(({ color, label }) => (
                        <div key={label} className="flex items-center gap-2">
                          <div className={`w-2.5 h-2.5 rounded-full ${color}`} />
                          <span className="text-xs text-neutral-500">{label}</span>
                        </div>
                      ))}
                    </div>
                    <p className="mt-3 text-[11px] text-neutral-400">
                      Go to <Link to="/dashboard/availability" className="text-[#3B5BDB] hover:underline">Availability</Link> to manage your schedule.
                    </p>
                  </div>
                </div>

                {/* Right column */}
                <div className="space-y-4 order-1 lg:order-2">
                  {/* Booking Requests */}
                  <div className="rounded-2xl bg-white border border-neutral-200 p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-6 h-6 rounded-lg bg-[#FEF9E6] flex items-center justify-center">
                        <FaBell className="text-[#F4C430] text-xs" />
                      </div>
                      <h3 className="text-sm font-bold text-neutral-900">Booking Requests</h3>
                      {pendingBookings.length > 0 && (
                        <span className="ml-auto text-xs font-bold text-white bg-[#F40F02] rounded-full w-5 h-5 flex items-center justify-center">
                          {pendingBookings.length}
                        </span>
                      )}
                    </div>

                    {actionError && (
                      <div className="flex items-center gap-2 mb-3 p-2.5 bg-red-50 border border-red-200 rounded-xl">
                        <FaTriangleExclamation className="text-red-500 text-xs shrink-0" />
                        <p className="text-xs text-red-700">{actionError}</p>
                      </div>
                    )}

                    {bookingsLoading ? (
                      <div className="space-y-2">
                        {[1,2].map(i => <div key={i} className="h-16 rounded-xl bg-neutral-100 animate-pulse" />)}
                      </div>
                    ) : pendingBookings.length === 0 ? (
                      <p className="text-xs text-neutral-400 text-center py-4">No pending requests</p>
                    ) : (
                      <div className="space-y-2">
                        {pendingBookings.map((b) => (
                          <div key={b.id} className="rounded-xl border border-neutral-200 p-3 bg-[#FAFAFA]">
                            <p className="text-xs font-semibold text-neutral-900 mb-0.5 truncate">{b.project.title}</p>
                            <p className="text-[11px] text-neutral-500 mb-1.5 truncate">
                              {b.requester.companyProfile?.companyName ?? b.requester.email}
                              {b.rateOffered ? ` · ${formatPaise(b.rateOffered)}` : ''}
                            </p>
                            <div className="flex gap-1.5">
                              <button disabled={actioning === b.id} onClick={() => doAction(b.id, 'accept')} className="flex-1 text-[11px] py-1.5 bg-[#22C55E] text-white rounded-lg hover:bg-[#16a34a] font-semibold transition-colors disabled:opacity-60">Accept</button>
                              <button disabled={actioning === b.id} onClick={() => doAction(b.id, 'decline')} className="flex-1 text-[11px] py-1.5 bg-[#F3F4F6] text-neutral-600 rounded-lg hover:bg-neutral-200 font-medium transition-colors disabled:opacity-60">Decline</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    <Link to="/dashboard/bookings" className="mt-3 rounded-xl block w-full py-2 text-xs text-[#3B5BDB] bg-[#EEF4FF] hover:bg-[#DBEAFE] text-center font-semibold transition-colors">
                      View All Bookings
                    </Link>
                  </div>

                  <div className="rounded-2xl bg-white border border-neutral-200 p-4">
                    <h3 className="text-sm font-bold text-neutral-900 mb-3">Quick Actions</h3>
                    <div className="space-y-1.5">
                      <Link to="/dashboard/availability" className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-[#F3F4F6] text-neutral-700 text-xs font-semibold hover:bg-[#EEF4FF] hover:text-[#3B5BDB] transition-colors">
                        <FaCalendar className="w-3 h-3" /> Manage Availability
                      </Link>
                      <Link to="/dashboard/conversations" className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-[#F3F4F6] text-neutral-700 text-xs font-semibold hover:bg-[#EEF4FF] hover:text-[#3B5BDB] transition-colors">
                        <FaMessage className="w-3 h-3" /> Open Chat
                      </Link>
                      <Link to="/dashboard/profile" className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-[#F3F4F6] text-neutral-700 text-xs font-semibold hover:bg-[#EEF4FF] hover:text-[#3B5BDB] transition-colors">
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

      {panel && (
        <>
          <div className="fixed inset-0 bg-black/20 z-40 lg:bg-transparent" onClick={() => setPanel(null)} />
          <aside className="fixed right-0 top-0 h-full w-72 bg-white border-l border-neutral-200 shadow-2xl z-50 flex flex-col panel-enter">
            <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100">
              <h3 className="text-base font-bold text-neutral-900">{panel.d} {panel.month} {panel.year}</h3>
              <button type="button" onClick={() => setPanel(null)} className="w-8 h-8 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-500 hover:bg-neutral-200">
                <FaXmark className="text-sm" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-4">
              <div className="px-5 py-3 mb-4">
                {panel.status === 'available' && <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#15803D] bg-[#DCFCE7] px-3 py-1.5 rounded-full"><FaCircle className="text-[8px]" /> Available</span>}
                {panel.status === 'booked' && <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#B91C1C] bg-[#FEE2E2] px-3 py-1.5 rounded-full"><FaCircle className="text-[8px]" /> Booked</span>}
                {panel.status === 'blocked' && <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-600 bg-[#F3F4F6] px-3 py-1.5 rounded-full"><FaLock className="text-[8px]" /> Blocked</span>}
              </div>
              <p className="text-xs text-neutral-500 text-center">
                Go to <Link to="/dashboard/availability" className="text-[#3B5BDB] hover:underline" onClick={() => setPanel(null)}>Availability</Link> to manage this date.
              </p>
              {panel.project && (
                <div className="mt-4 rounded-xl bg-[#F3F4F6] p-4 space-y-2">
                  <p className="text-xs font-bold text-neutral-900">{panel.project}</p>
                </div>
              )}
              {(panel.bookingId && (panel.bookingStatus === 'accepted' || panel.bookingStatus === 'locked')) && (
                <div className="mt-4">
                  <button
                    type="button"
                    onClick={() => setCancellingId(panel.bookingId!)}
                    disabled={!!actioning}
                    className="flex items-center justify-center gap-2 w-full rounded-xl py-2.5 border border-amber-300 bg-[#FEF3C7] text-[#92400E] text-sm font-semibold hover:bg-[#FDE68A] transition-colors disabled:opacity-60"
                  >
                    <FaBan className="w-3.5 h-3.5" /> Request Cancellation
                  </button>
                </div>
              )}
            </div>
            <div className="px-5 py-4 border-t border-neutral-100">
              <Link to="/dashboard/availability" onClick={() => setPanel(null)} className="flex items-center justify-center gap-2 w-full rounded-xl py-2.5 bg-[#3B5BDB] text-white text-sm font-semibold hover:bg-[#2f4ac2] transition-colors">
                <FaCalendar className="w-3 h-3" /> Manage Availability
              </Link>
            </div>
          </aside>
        </>
      )}

      {/* Request Cancellation Modal */}
      {cancellingId && (
        <>
          <div className="fixed inset-0 bg-black/40 z-[60]" onClick={() => setCancellingId(null)} />
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
              <h2 className="text-base font-bold text-neutral-900 mb-2">Request Cancellation</h2>
              <p className="text-sm text-neutral-600 mb-4">
                This will send a cancellation request to the production company. Your booking will remain active until the company approves the cancellation.
              </p>
              <div className="mb-4">
                <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                  Reason for cancellation <span className="font-normal text-neutral-400">(optional)</span>
                </label>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  rows={3}
                  placeholder="e.g., Already booked for another project during these dates…"
                  className="w-full px-4 py-2.5 border border-neutral-300 rounded-xl text-sm bg-[#F3F4F6] focus:bg-white focus:outline-none focus:border-[#3678F1] resize-none transition-all"
                />
              </div>
              {actionError && (
                <div className="flex items-center gap-2 mb-4 p-3 bg-red-50 border border-red-200 rounded-xl">
                  <FaTriangleExclamation className="text-red-500 text-xs shrink-0" />
                  <p className="text-xs text-red-700">{actionError}</p>
                </div>
              )}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => { setCancellingId(null); setActionError(null); }}
                  className="flex-1 rounded-xl py-2.5 border border-neutral-300 text-neutral-700 text-sm font-medium hover:bg-neutral-50 transition-colors"
                >
                  Keep Booking
                </button>
                <button
                  type="button"
                  onClick={() => doRequestCancel(cancellingId)}
                  disabled={!!actioning}
                  className="flex-1 rounded-xl py-2.5 bg-[#F59E0B] text-white text-sm font-semibold hover:bg-[#D97706] transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {actioning ? (
                    <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Sending…</>
                  ) : (
                    'Send Request'
                  )}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
