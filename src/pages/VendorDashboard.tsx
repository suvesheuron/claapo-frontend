import { useEffect, useState, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { FaCalendar, FaTruck, FaBell, FaChevronLeft, FaChevronRight, FaMessage, FaTriangleExclamation, FaUser } from 'react-icons/fa6';
import { api, ApiException } from '../services/api';
import { useApiQuery } from '../hooks/useApiQuery';
import { useChatUnread } from '../contexts/ChatUnreadContext';
import { formatPaise, formatRateRange } from '../utils/currency';
import DashboardHeader from '../components/DashboardHeader';
import DashboardSidebar from '../components/DashboardSidebar';
import AppFooter from '../components/AppFooter';
import VendorCalendarDayPanel from '../components/VendorCalendarDayPanel';
import { vendorNavLinks } from '../navigation/dashboardNav';
import type { BookingWithDetails, SlotStatus } from '../types/availability';
import { parseAvailabilityMonthResponse } from '../utils/parseAvailabilityResponse';
import { CELL_STYLE_COMPACT, type CellStatus as CellStatusKey } from '../utils/slotStatusStyles';
import toast from 'react-hot-toast';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

type CellStatus = CellStatusKey | null;

interface CalendarCell {
  d: number;
  muted: boolean;
  status: CellStatus;
  equipment?: string;
  company?: string;
  project?: string;
  invoice?: string;
}

const _today = new Date();
const BASE_YEAR = _today.getFullYear();
const BASE_MONTH = _today.getMonth();

function normalizeDateOnly(input: string): string {
  const direct = /^(\d{4}-\d{2}-\d{2})/.exec(input);
  if (direct?.[1]) return direct[1];
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return input;
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function getBookingDateKeys(booking: { shootDates?: string[] | null }): string[] {
  if (!booking.shootDates?.length) return [];
  return [...new Set(booking.shootDates.map((d) => normalizeDateOnly(d)).filter(Boolean))];
}

function buildCalendar(monthOffset: number, bookingsByDay?: Record<string, { status: CellStatus; company?: string; project?: string; invoice?: string }>): CalendarCell[] {
  const d = new Date(BASE_YEAR, BASE_MONTH + monthOffset, 1);
  const year = d.getFullYear();
  const month = d.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevDays = new Date(year, month, 0).getDate();
  const cells: CalendarCell[] = [];
  for (let i = firstDay - 1; i >= 0; i--) cells.push({ d: prevDays - i, muted: true, status: null });
  const monthData = bookingsByDay ?? {};
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const override = monthData[dateStr];
    cells.push({ d: day, muted: false, ...(override ?? { status: 'available' as CellStatus }) });
  }
  const rem = 7 - (cells.length % 7);
  if (rem < 7) for (let d2 = 1; d2 <= rem; d2++) cells.push({ d: d2, muted: true, status: null });
  return cells;
}

const cellStyle = CELL_STYLE_COMPACT;

function cellStatusToSlotStatus(s: CellStatus | null | undefined): SlotStatus {
  if (!s) return 'available';
  if (s === 'completed') return 'past_work';
  return s as SlotStatus;
}

interface EquipmentItem {
  id: string;
  name: string;
  dailyBudget?: number | null;
}

interface IncomingBooking {
  id: string; status: string; rateOffered?: number | null; message?: string | null;
  shootDates?: string[] | null;
  project: { id: string; title: string; startDate?: string; endDate?: string };
  requester: { id: string; email: string; companyProfile?: { companyName?: string } | null };
}
interface PastBookingItem {
  id: string;
  shootDates?: string[] | null;
  project: { id: string; title: string; startDate: string; endDate: string };
  requester: { id: string; companyProfile?: { companyName?: string } | null };
}

export default function VendorDashboard() {
  useEffect(() => { document.title = 'Dashboard – Claapo'; }, []);

  const [monthOffset, setMonthOffset] = useState(0);
  const [detailDate, setDetailDate] = useState<string | null>(null);
  const [monthSlotDetails, setMonthSlotDetails] = useState<
    Record<string, { date: string; status: SlotStatus; notes?: string | null }>
  >({});
  const [bookingDetails, setBookingDetails] = useState<Record<string, BookingWithDetails>>({});
  const [availLoading, setAvailLoading] = useState(false);
  const [detailSaving, setDetailSaving] = useState(false);
  const [actioning, setActioning] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  const displayDate = new Date(BASE_YEAR, BASE_MONTH + monthOffset, 1);
  const monthLabel = MONTHS[displayDate.getMonth()];
  const yearLabel = displayDate.getFullYear();

  const { data: bookingsData, loading: bookingsLoading, refetch: refetchBookings } =
    useApiQuery<{ items: IncomingBooking[] }>('/bookings/incoming');
  const { unreadByProject, unreadShootDatesByProject } = useChatUnread();
  const { data: pastData } = useApiQuery<{ items: PastBookingItem[] }>('/bookings/past');
  const { data: equipmentList } = useApiQuery<EquipmentItem[] | { items: EquipmentItem[] }>('/equipment/me');

  const incomingItems = bookingsData?.items ?? [];
  const pendingBookings = incomingItems.filter(b => b.status === 'pending').slice(0, 5);

  // Dates with pending booking requests
  const pendingDates = useMemo(() => {
    const dates = new Set<string>();
    incomingItems
      .filter(b => b.status === 'pending')
      .forEach(b => {
        getBookingDateKeys(b).forEach(d => dates.add(d));
      });
    return dates;
  }, [incomingItems]);

  const unreadShootDates = useMemo(() => {
    const dates = new Set<string>();
    Object.entries(unreadShootDatesByProject).forEach(([projectId, shootDates]) => {
      if ((unreadByProject[projectId] ?? 0) <= 0) return;
      shootDates.forEach((d) => dates.add(d));
    });
    return dates;
  }, [unreadByProject, unreadShootDatesByProject]);

  const activeCount = incomingItems.filter(b => b.status === 'accepted' || b.status === 'locked').length;
  const pastItems = pastData?.items ?? [];
  const pastCount = pastItems.length;
  const equipmentArray = Array.isArray(equipmentList) ? equipmentList : (equipmentList as { items?: EquipmentItem[] })?.items ?? [];

  const bookingRangesByDay = useMemo(() => {
    const map: Record<string, { status: CellStatus; project?: string; company?: string }> = {};
    const add = (dateKeys: string[], status: CellStatus, project?: string, company?: string) => {
      dateKeys.forEach((dateStr) => {
        map[dateStr] = { status, project, company };
      });
    };
    incomingItems.filter(b => (b.status === 'accepted' || b.status === 'locked')).forEach((b) => {
      const dateKeys = getBookingDateKeys(b);
      if (dateKeys.length === 0) return;
      add(dateKeys, 'booked', b.project.title, b.requester.companyProfile?.companyName ?? undefined);
    });
    pastItems.forEach((b) => {
      const dateKeys = getBookingDateKeys(b);
      if (dateKeys.length === 0) return;
      add(dateKeys, 'completed', b.project.title, b.requester.companyProfile?.companyName ?? undefined);
    });
    return map;
  }, [incomingItems, pastItems]);

  const mergedBookingsByDay = useMemo(() => {
    const map: Record<string, { status: CellStatus; project?: string; company?: string }> = { ...bookingRangesByDay };
    for (const [d, s] of Object.entries(monthSlotDetails)) {
      if (s.status === 'blocked') {
        const prev = map[d];
        map[d] = {
          status: 'blocked',
          project: prev?.project,
          company: prev?.company,
        };
      }
    }
    return map;
  }, [bookingRangesByDay, monthSlotDetails]);

  const calendarDays = buildCalendar(monthOffset, mergedBookingsByDay);

  const slotForDetailPanel = detailDate
    ? monthSlotDetails[detailDate] ?? {
        date: detailDate,
        status: cellStatusToSlotStatus(mergedBookingsByDay[detailDate]?.status ?? null),
        notes: null as string | null,
      }
    : undefined;

  const vendorBlockReasons = useMemo(() => ['Equipment maintenance', 'Unavailable for rental', 'Reserved for other use', 'Other'], []);

  const fallbackBookingsForDay = useMemo(() => {
    if (!detailDate || bookingDetails[detailDate]) return [];
    const out: {
      id: string;
      projectId: string;
      projectTitle: string;
      companyLabel: string;
      companyUserId: string;
      status: string;
      rateOffered?: number | null;
      equipmentLabel?: string | null;
    }[] = [];
    for (const b of incomingItems) {
      const dateKeys = getBookingDateKeys(b);
      if (
        (b.status === 'accepted' || b.status === 'locked') &&
        dateKeys.includes(detailDate)
      ) {
        out.push({
          id: b.id,
          projectId: b.project.id,
          projectTitle: b.project.title,
          companyLabel: b.requester.companyProfile?.companyName ?? b.requester.email,
          companyUserId: b.requester.id,
          status: b.status,
          rateOffered: b.rateOffered ?? null,
          equipmentLabel: null,
        });
      }
    }
    for (const b of pastItems) {
      if (getBookingDateKeys(b).includes(detailDate)) {
        out.push({
          id: b.id,
          projectId: b.project.id,
          projectTitle: b.project.title,
          companyLabel: b.requester.companyProfile?.companyName ?? '—',
          companyUserId: b.requester.id,
          status: 'past_work',
          rateOffered: null,
          equipmentLabel: null,
        });
      }
    }
    return out;
  }, [detailDate, incomingItems, pastItems, bookingDetails]);

  const loadVendorAvailability = useCallback(async () => {
    setAvailLoading(true);
    try {
      const d = new Date(BASE_YEAR, BASE_MONTH + monthOffset, 1);
      const res = await api.get<unknown>(
        `/availability/me?year=${d.getFullYear()}&month=${d.getMonth() + 1}`,
      );
      const parsed = parseAvailabilityMonthResponse(res);
      setMonthSlotDetails(parsed.slots);
      setBookingDetails(parsed.bookingDetails);
    } catch {
      setMonthSlotDetails({});
      setBookingDetails({});
    } finally {
      setAvailLoading(false);
    }
  }, [monthOffset]);

  useEffect(() => {
    loadVendorAvailability();
  }, [loadVendorAvailability]);

  const getDateStr = (d: number) => {
    const m = String(displayDate.getMonth() + 1).padStart(2, '0');
    return `${yearLabel}-${m}-${String(d).padStart(2, '0')}`;
  };

  const handleDetailBlock = async (reason: string) => {
    if (!detailDate) return;
    setDetailSaving(true);
    try {
      await api.put('/availability/bulk', { slots: [{ date: detailDate, status: 'blocked', notes: reason }] });
      await loadVendorAvailability();
      setDetailDate(null);
    } catch (err) {
      toast.error(err instanceof ApiException ? err.payload.message : 'Failed to update availability.');
    } finally {
      setDetailSaving(false);
    }
  };

  const handleDetailUnblock = async () => {
    if (!detailDate) return;
    setDetailSaving(true);
    try {
      await api.put('/availability/bulk', { slots: [{ date: detailDate, status: 'available' }] });
      await loadVendorAvailability();
      setDetailDate(null);
    } catch (err) {
      toast.error(err instanceof ApiException ? err.payload.message : 'Failed to update.');
    } finally {
      setDetailSaving(false);
    }
  };

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

  const doRequestCancel = useCallback(async () => {
    if (!cancellingId) return;
    setActioning(cancellingId + 'req-cancel');
    setActionError(null);
    try {
      await api.patch(`/bookings/${cancellingId}/request-cancel`, { reason: cancelReason || undefined });
      toast.success('Cancellation request sent. Awaiting company approval.');
      setCancellingId(null);
      setCancelReason('');
      refetchBookings();
      await loadVendorAvailability();
    } catch (err) {
      const msg = err instanceof ApiException ? err.payload.message : 'Failed to request cancellation.';
      toast.error(msg);
      setActionError(msg);
    } finally {
      setActioning(null);
    }
  }, [cancellingId, cancelReason, refetchBookings, loadVendorAvailability]);

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-[#F3F4F6] w-full">
      <DashboardHeader />

      <div className="flex-1 flex min-h-0 overflow-hidden">
        <DashboardSidebar links={vendorNavLinks} />

        {/* Main content */}
        <main className="flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden">
          <div className="flex-1 min-h-0 overflow-auto">
            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-6 xl:px-8 py-5">

              <div className="relative rounded-2xl bg-white border border-neutral-200/70 px-6 sm:px-8 py-6 mb-5 overflow-hidden shadow-soft">
                <div className="absolute inset-y-0 right-0 w-1/2 bg-gradient-to-l from-[#E8F0FE]/60 to-transparent pointer-events-none" />
                <span aria-hidden className="absolute left-0 top-6 bottom-6 w-1 rounded-r-full bg-gradient-to-b from-[#3678F1] to-[#5B9DF9]" />
                <div className="relative pl-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#3678F1]">Vendor</p>
                  <h1 className="text-[26px] sm:text-[28px] font-extrabold text-neutral-900 tracking-tight leading-tight mt-1">Vendor Dashboard</h1>
                  <p className="text-sm text-neutral-500 mt-1.5">Equipment availability and rental management</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                {/* Calendar — left, 3/4 width on desktop */}
                <div className="lg:col-span-3 order-2 lg:order-1">
                    <div className="rounded-2xl bg-white border border-neutral-200/70 shadow-soft p-4 sm:p-5 min-w-0 hover:border-[#3678F1] transition-colors duration-200">
                      <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-[#E8F0FE] flex items-center justify-center ring-1 ring-[#3678F1]/15">
                            <FaCalendar className="text-[#3678F1] text-sm" />
                          </div>
                          <h2 className="text-base font-bold text-neutral-900">Equipment Calendar</h2>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setMonthOffset((o) => o - 1)}
                            className="w-9 h-9 rounded-lg border border-neutral-200/80 bg-white text-neutral-600 hover:bg-[#E8F0FE] hover:border-[#3678F1]/30 hover:text-[#3678F1] flex items-center justify-center transition-colors"
                          >
                            <FaChevronLeft className="text-xs" />
                          </button>
                          <span className="text-sm font-semibold text-neutral-900 min-w-[130px] text-center tabular-nums px-1">
                            {monthLabel} {yearLabel}
                          </span>
                          <button
                            type="button"
                            onClick={() => setMonthOffset((o) => o + 1)}
                            className="w-9 h-9 rounded-lg border border-neutral-200/80 bg-white text-neutral-600 hover:bg-[#E8F0FE] hover:border-[#3678F1]/30 hover:text-[#3678F1] flex items-center justify-center transition-colors"
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
                            onClick={() => !cell.muted && setDetailDate(getDateStr(cell.d))}
                            disabled={cell.muted}
                            className={`
                              cal-cell rounded-xl border text-center p-1 sm:p-1.5 relative
                              min-h-[44px] sm:min-h-[52px] flex flex-col items-center justify-center gap-0.5
                              ${cell.muted
                                ? 'bg-white border-neutral-100 text-neutral-300 cursor-default'
                                : cell.status && cellStyle[cell.status]
                                  ? `${cellStyle[cell.status]} cursor-pointer`
                                  : 'bg-white border-neutral-200 text-neutral-600 hover:bg-[#F3F4F6] cursor-pointer'}
                              ${!cell.muted && detailDate === getDateStr(cell.d) ? 'ring-2 ring-[#3678F1] ring-offset-1' : ''}
                            `}
                          >
                            <span className="text-[11px] sm:text-xs font-semibold leading-none">{cell.d}</span>
                            {/* Pending booking request indicator */}
                            {pendingDates.has(getDateStr(cell.d)) && (
                              <span className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-[#F40F02] animate-pulse" />
                            )}
                            {/* Inquiry/message shoot-date indicator */}
                            {!pendingDates.has(getDateStr(cell.d)) && unreadShootDates.has(getDateStr(cell.d)) && (
                              <span className="absolute top-0.5 right-0.5 flex items-center justify-center">
                                <span className="absolute inline-flex h-2.5 w-2.5 rounded-full bg-[#F40F02] opacity-45 animate-ping" />
                                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#F40F02]" />
                              </span>
                            )}
                            {cell.status && !cell.muted && cell.status !== 'available' && (
                              <span className="text-[8px] sm:text-[9px] font-medium leading-tight truncate w-full opacity-80">
                                {cell.status === 'blocked'
                                  ? 'Unavailable'
                                  : cell.status === 'booked'
                                    ? (cell.project?.split(/\s|,/).slice(0, 2).join(' ') || 'Ongoing')
                                    : (cell.project?.split(/\s|,/).slice(0, 2).join(' ') || 'Completed')}
                              </span>
                            )}
                          </button>
                        ))}
                      </div>

                      <div className="flex flex-wrap gap-x-5 gap-y-1.5 mt-4 pt-4 border-t border-neutral-100">
                        {availLoading && (
                          <span className="text-[10px] text-neutral-400 w-full">Syncing availability…</span>
                        )}
                        {[
                          { color: 'bg-[#22C55E]', label: 'Available' },
                          { color: 'bg-[#3678F1]', label: 'Ongoing' },
                          { color: 'bg-[#A3A3A3]', label: 'Completed' },
                          { color: 'bg-[#F40F02]', label: 'Unavailable' },
                        ].map(({ color, label }) => (
                          <div key={label} className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${color}`} />
                            <span className="text-[11px] text-neutral-500 font-medium">{label}</span>
                          </div>
                        ))}
                      </div>
                      <p className="mt-3 text-[11px] text-neutral-400">
                        Go to <Link to="/vendor-availability" className="text-[#3678F1] hover:underline">Availability</Link> to manage your schedule.
                      </p>
                    </div>
                </div>

                {/* Right column — Booking Requests, Recent Rentals, Quick Actions */}
                <div className="space-y-4 order-1 lg:order-2">
                  {/* Booking Requests */}
                  <div className="rounded-2xl bg-white border border-neutral-200/70 shadow-soft p-4 hover:border-[#3678F1] transition-colors duration-200">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-7 h-7 rounded-lg bg-[#E8F0FE] ring-1 ring-[#3678F1]/15 flex items-center justify-center">
                        <FaBell className="text-[#3678F1] text-xs" />
                      </div>
                      <h3 className="text-sm font-bold text-neutral-900">Booking Requests</h3>
                      {pendingBookings.length > 0 && (
                        <span className="ml-auto text-xs font-bold text-white bg-[#F40F02] rounded-full w-5 h-5 flex items-center justify-center">{pendingBookings.length}</span>
                      )}
                    </div>
                    {actionError && (
                      <div className="flex items-center gap-2 mb-3 p-2.5 bg-[#FEEBEA] border border-[#F40F02]/30 rounded-xl">
                        <FaTriangleExclamation className="text-[#F40F02] text-xs shrink-0" />
                        <p className="text-xs text-[#991B1B]">{actionError}</p>
                      </div>
                    )}
                    {bookingsLoading ? (
                      <div className="space-y-2">{[1,2].map(i => <div key={i} className="skeleton h-16 rounded-xl" />)}</div>
                    ) : pendingBookings.length === 0 ? (
                      <p className="text-xs text-neutral-400 text-center py-4">No pending requests</p>
                    ) : (
                      <div className="space-y-2">
                        {pendingBookings.map((b) => (
                          <div key={b.id} className="rounded-xl border border-neutral-200/70 p-3 bg-white hover:border-[#3678F1] transition-colors duration-200">
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
                    <Link to="/bookings" className="mt-3 rounded-xl block w-full py-2.5 text-xs text-[#2563EB] bg-[#E8F0FE] hover:bg-[#DBEAFE] text-center font-bold transition-colors duration-200">View All Bookings</Link>
                  </div>

                  {/* Recent Rentals */}
                  <div className="rounded-2xl bg-white border border-neutral-200/70 shadow-soft p-4 hover:border-[#3678F1] transition-colors duration-200">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
                        <span className="w-1 h-4 rounded-full bg-[#3678F1]" />
                        Recent Rentals
                      </h3>
                      <Link to="/past-rentals" className="text-[11px] text-[#3678F1] hover:text-[#2563EB] font-semibold transition-colors">View all</Link>
                    </div>
                    {pastItems.length === 0 ? (
                      <p className="text-xs text-neutral-400 text-center py-4">No past rentals yet</p>
                    ) : (
                      <div className="space-y-2">
                        {pastItems.slice(0, 4).map((b) => (
                          <Link key={b.id} to={`/projects/${b.project.id}`} className="block rounded-xl border border-neutral-200/70 p-3 bg-white hover:border-[#3678F1] transition-colors duration-200">
                            <p className="text-xs font-semibold text-neutral-900 truncate">{b.project.title}</p>
                            <p className="text-[11px] text-neutral-500 truncate">{b.requester.companyProfile?.companyName ?? '—'}</p>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Stats — same column as individual dashboard */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-2xl bg-white border border-neutral-200/70 shadow-soft p-3 hover:border-[#3678F1] transition-colors duration-200">
                      <p className="text-[11px] text-neutral-500">Active Bookings</p>
                      <p className="text-lg font-bold text-[#3678F1]">{activeCount}</p>
                    </div>
                    <div className="rounded-2xl bg-white border border-neutral-200/70 shadow-soft p-3 hover:border-[#3678F1] transition-colors duration-200">
                      <p className="text-[11px] text-neutral-500">Past Rentals</p>
                      <p className="text-lg font-bold text-[#3678F1]">{pastCount}</p>
                    </div>
                  </div>

                  {/* Equipment summary — in sidebar when present */}
                  {equipmentArray.length > 0 && (
                    <div className="rounded-2xl bg-white border border-neutral-200/70 shadow-soft p-4 hover:border-[#3678F1] transition-colors duration-200">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
                          <span className="w-1 h-4 rounded-full bg-[#3678F1]" />
                          Equipment
                        </h3>
                        <Link to="/equipment" className="text-[11px] text-[#3678F1] hover:text-[#2563EB] font-semibold transition-colors">View all</Link>
                      </div>
                      <div className="space-y-2">
                        {equipmentArray.slice(0, 3).map((item) => (
                          <Link key={item.id} to="/equipment" className="block rounded-xl border border-neutral-200/70 p-2.5 bg-white hover:border-[#3678F1] transition-colors duration-200">
                            <p className="text-xs font-semibold text-neutral-900 truncate">{item.name}</p>
                            <p className="text-[10px] text-neutral-500">{item.dailyBudget != null ? formatRateRange(item.dailyBudget) : '—'}</p>
                          </Link>
                        ))}
                        {equipmentArray.length > 3 && <p className="text-[10px] text-neutral-400">+{equipmentArray.length - 3} more</p>}
                      </div>
                    </div>
                  )}

                  {/* Quick Actions */}
                  <div className="rounded-2xl bg-white border border-neutral-200/70 shadow-soft p-4 hover:border-[#3678F1] transition-colors duration-200">
                    <h3 className="text-sm font-bold text-neutral-900 mb-3 flex items-center gap-2">
                      <span className="w-1 h-4 rounded-full bg-[#3678F1]" />
                      Quick Actions
                    </h3>
                    <div className="space-y-1.5">
                      <Link to="/vendor-availability" className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-neutral-200/70 text-neutral-700 text-[13px] font-semibold hover:border-[#3678F1] transition-colors duration-200">
                        <div className="w-8 h-8 rounded-lg bg-[#E8F0FE] ring-1 ring-[#3678F1]/15 flex items-center justify-center shrink-0">
                          <FaCalendar className="w-3.5 h-3.5 text-[#3678F1]" />
                        </div>
                        <span className="flex-1 truncate">Manage Availability</span>
                      </Link>
                      <Link to="/conversations" className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-neutral-200/70 text-neutral-700 text-[13px] font-semibold hover:border-[#3678F1] transition-colors duration-200">
                        <div className="w-8 h-8 rounded-lg bg-[#E8F0FE] ring-1 ring-[#3678F1]/15 flex items-center justify-center shrink-0">
                          <FaMessage className="w-3.5 h-3.5 text-[#3678F1]" />
                        </div>
                        <span className="flex-1 truncate">Open Chat</span>
                      </Link>
                      <Link to="/equipment" className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-neutral-200/70 text-neutral-700 text-[13px] font-semibold hover:border-[#3678F1] transition-colors duration-200">
                        <div className="w-8 h-8 rounded-lg bg-[#E8F0FE] ring-1 ring-[#3678F1]/15 flex items-center justify-center shrink-0">
                          <FaTruck className="w-3.5 h-3.5 text-[#3678F1]" />
                        </div>
                        <span className="flex-1 truncate">Equipment</span>
                      </Link>
                      <Link to="/vendor-profile" className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-neutral-200/70 text-neutral-700 text-[13px] font-semibold hover:border-[#3678F1] transition-colors duration-200">
                        <div className="w-8 h-8 rounded-lg bg-[#E8F0FE] ring-1 ring-[#3678F1]/15 flex items-center justify-center shrink-0">
                          <FaUser className="w-3.5 h-3.5 text-[#3678F1]" />
                        </div>
                        <span className="flex-1 truncate">Edit Profile</span>
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

      {detailDate && (
        <>
          <div
            className="fixed inset-0 bg-black/25 backdrop-blur-[2px] z-40 lg:bg-black/10 lg:backdrop-blur-[1px]"
            onClick={() => setDetailDate(null)}
            aria-hidden
          />
          <aside className="fixed right-0 top-0 h-full w-full max-w-[380px] sm:max-w-[400px] bg-white/95 backdrop-blur-xl border-l border-neutral-200/60 shadow-2xl z-50 flex flex-col panel-enter rounded-l-3xl">
            <VendorCalendarDayPanel
              variant="drawer"
              selectedDate={detailDate}
              onDismiss={() => setDetailDate(null)}
              slot={slotForDetailPanel}
              booking={bookingDetails[detailDate]
                ? bookingDetails[detailDate]
                : undefined}
              fallbackBookings={fallbackBookingsForDay}
              blockReasons={vendorBlockReasons}
              saving={detailSaving}
              onBlock={async (reason) => { await handleDetailBlock(reason); }}
              onUnblock={async () => { await handleDetailUnblock(); }}
              onRequestCancel={(bookingId) => { setCancellingId(bookingId); }}
            />
          </aside>
        </>
      )}

      {cancellingId && (
        <>
          <div className="fixed inset-0 bg-black/40 z-[60]" onClick={() => !actioning?.endsWith('req-cancel') && setCancellingId(null)} />
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 pointer-events-none">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 pointer-events-auto">
              <h2 className="text-base font-bold text-neutral-900 mb-2">Request cancellation</h2>
              <p className="text-sm text-neutral-600 mb-4">
                The production company must approve before your booking is released.
              </p>
              <div className="mb-4">
                <label className="block text-xs font-semibold text-neutral-700 mb-1.5">Reason (optional)</label>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  rows={3}
                  placeholder="e.g., Equipment conflict…"
                  className="w-full px-4 py-2.5 border border-neutral-300 rounded-xl text-sm bg-[#F3F4F6] focus:bg-white focus:outline-none focus:border-[#3678F1] resize-none"
                />
              </div>
              {actionError && (
                <div className="flex items-center gap-2 mb-4 p-3 bg-[#FEEBEA] border border-[#F40F02]/30 rounded-xl">
                  <FaTriangleExclamation className="text-[#F40F02] text-xs shrink-0" />
                  <p className="text-xs text-[#991B1B]">{actionError}</p>
                </div>
              )}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => { setCancellingId(null); setCancelReason(''); setActionError(null); }}
                  disabled={!!actioning}
                  className="flex-1 py-2.5 rounded-xl border border-neutral-200 text-sm font-semibold text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => void doRequestCancel()}
                  disabled={!!actioning}
                  className="flex-1 py-2.5 rounded-xl bg-[#F40F02] text-white text-sm font-semibold hover:bg-[#C70D02] disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {actioning?.endsWith('req-cancel') ? (
                    <><span className="w-6 h-6 border-[2.5px] border-white/30 border-t-white border-r-white rounded-full animate-spin" /> Sending…</>
                  ) : (
                    'Send request'
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
