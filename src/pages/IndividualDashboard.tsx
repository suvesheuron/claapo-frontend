import { useEffect, useState, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { FaCalendar, FaBell, FaChevronLeft, FaChevronRight, FaCircleInfo, FaTriangleExclamation, FaUser, FaMessage } from 'react-icons/fa6';
import DashboardHeader from '../components/DashboardHeader';
import DashboardSidebar from '../components/DashboardSidebar';
import AppFooter from '../components/AppFooter';
import RoleIndicator from '../components/RoleIndicator';
import VendorCalendarDayPanel from '../components/VendorCalendarDayPanel';
import { api, ApiException } from '../services/api';
import { useApiQuery } from '../hooks/useApiQuery';
import { useChatUnread } from '../contexts/ChatUnreadContext';
import { formatPaise } from '../utils/currency';
import { individualNavLinks } from '../navigation/dashboardNav';
import toast from 'react-hot-toast';
import type { BookingWithDetails, SlotStatus } from '../types/availability';
import { parseAvailabilityMonthResponse } from '../utils/parseAvailabilityResponse';
import { CELL_STYLE_COMPACT, LEGEND_SWATCHES, type CellStatus as CellStatusKey } from '../utils/slotStatusStyles';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

const today = new Date();
const BASE_YEAR = today.getFullYear();
const BASE_MONTH = today.getMonth();

type CellStatus = CellStatusKey | null;

interface CalendarCell { d: number; muted: boolean; status: CellStatus; project?: string; company?: string; }

interface IncomingBooking {
  id: string;
  status: string;
  rateOffered?: number | null;
  message?: string | null;
  shootDates?: string[] | null;
  project: { id: string; title: string; startDate: string; endDate: string; status?: string; companyUser?: { companyProfile?: { companyName?: string } | null } };
  requester: { id: string; email: string; companyProfile?: { companyName?: string } | null };
}
interface IncomingBookingsResponse { items: IncomingBooking[] }

interface PastBookingItem {
  id: string;
  shootDates?: string[] | null;
  project: { id: string; title: string; startDate: string; endDate: string };
  requester: { id: string; companyProfile?: { companyName?: string } | null };
}

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

function buildCalendar(monthOffset: number, bookingsByDay?: Record<string, { status: CellStatus; company?: string; project?: string }>): CalendarCell[] {
  const d = new Date(BASE_YEAR, BASE_MONTH + monthOffset, 1);
  const year = d.getFullYear();
  const month = d.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: CalendarCell[] = [];
  // Empty placeholder cells (no prev-month numbers) to align first row to the right weekday
  for (let i = 0; i < firstDay; i++) cells.push({ d: 0, muted: true, status: null });
  const monthData = bookingsByDay ?? {};
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const override = monthData[dateStr];
    cells.push({ d: day, muted: false, ...(override ?? { status: 'available' as CellStatus }) });
  }
  const rem = 7 - (cells.length % 7);
  if (rem < 7) for (let d2 = 0; d2 < rem; d2++) cells.push({ d: 0, muted: true, status: null });
  return cells;
}

const cellStyle = CELL_STYLE_COMPACT;

function cellStatusToSlotStatus(s: CellStatus | null | undefined): SlotStatus {
  if (!s) return 'available';
  if (s === 'completed') return 'past_work';
  return s as SlotStatus;
}

export default function IndividualDashboard() {
  useEffect(() => { document.title = 'Dashboard – Claapo'; }, []);

  const [monthOffset, setMonthOffset] = useState(0);
  const [detailDate, setDetailDate] = useState<string | null>(null);
  const [panelClosing, setPanelClosing] = useState(false);
  const [actioning, setActioning] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [monthSlotDetails, setMonthSlotDetails] = useState<
    Record<string, { date: string; status: SlotStatus; notes?: string | null }>
  >({});
  const [bookingDetails, setBookingDetails] = useState<Record<string, BookingWithDetails>>({});
  const [availLoading, setAvailLoading] = useState(false);
  const [detailSaving, setDetailSaving] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  const displayDate = new Date(BASE_YEAR, BASE_MONTH + monthOffset, 1);
  const displayYear = displayDate.getFullYear();
  const displayMonth = displayDate.getMonth();
  const monthLabel = MONTHS[displayMonth];
  const yearLabel = displayDate.getFullYear();

  const { data: bookingsData, loading: bookingsLoading, refetch: refetchBookings } =
    useApiQuery<IncomingBookingsResponse>('/bookings/incoming');
  const { unreadByProject, unreadShootDatesByProject } = useChatUnread();
  const { data: pastData } = useApiQuery<{ items: PastBookingItem[] }>('/bookings/past');
  const allBookings = bookingsData?.items ?? [];
  const pendingBookings = allBookings.filter(b => b.status === 'pending').slice(0, 5);

  // Dates with pending booking requests
  const pendingDates = useMemo(() => {
    const dates = new Set<string>();
    allBookings
      .filter(b => b.status === 'pending')
      .forEach(b => {
        getBookingDateKeys(b).forEach(d => dates.add(d));
      });
    return dates;
  }, [allBookings]);

  const unreadShootDates = useMemo(() => {
    const dates = new Set<string>();
    Object.entries(unreadShootDatesByProject).forEach(([projectId, shootDates]) => {
      if ((unreadByProject[projectId] ?? 0) <= 0) return;
      shootDates.forEach((d) => dates.add(d));
    });
    return dates;
  }, [unreadByProject, unreadShootDatesByProject]);

  const pastItems = pastData?.items ?? [];
  const activeCount = allBookings.filter(b => b.status === 'accepted' || b.status === 'locked').length;
  const pastCount = pastItems.length;

  const bookingRangesByDay = useMemo(() => {
    const map: Record<string, { status: CellStatus; project?: string; company?: string }> = {};
    const add = (dateKeys: string[], status: CellStatus, project?: string, company?: string) => {
      dateKeys.forEach((dateStr) => {
        map[dateStr] = { status, project, company };
      });
    };
    allBookings
      .filter(b => (b.status === 'accepted' || b.status === 'locked' || b.status === 'cancel_requested'))
      .forEach((b) => {
        if (b.project.status === 'cancelled') return;
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
  }, [allBookings, pastItems]);

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

  // Collect all shoot dates from bookings for the current month
  const allShootDates = useMemo(() => {
    const dates = new Set<string>();
    allBookings
      .filter(b => (b.status === 'accepted' || b.status === 'locked' || b.status === 'cancel_requested') && b.project.status !== 'cancelled')
      .forEach(b => {
        getBookingDateKeys(b).forEach(d => dates.add(d));
      });
    pastItems.forEach(b => {
      getBookingDateKeys(b).forEach(d => dates.add(d));
    });
    return Array.from(dates);
  }, [allBookings, pastItems]);

  const slotForDetailPanel = detailDate
    ? monthSlotDetails[detailDate] ?? {
        date: detailDate,
        status: cellStatusToSlotStatus(mergedBookingsByDay[detailDate]?.status ?? null),
        notes: null as string | null,
      }
    : undefined;

  const individualBlockReasons = useMemo(
    () => ['Personal', 'Already booked externally', 'Not available', 'Traveling', 'Other'],
    [],
  );

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
    for (const b of allBookings) {
      const dateKeys = getBookingDateKeys(b);
      if (
        (b.status === 'accepted' || b.status === 'locked' || b.status === 'cancel_requested') &&
        b.project.status !== 'cancelled' &&
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
  }, [detailDate, allBookings, pastItems, bookingDetails]);

  const loadAvailability = useCallback(async () => {
    setAvailLoading(true);
    try {
      const d = new Date(BASE_YEAR, BASE_MONTH + monthOffset, 1);
      const res = await api.get<unknown>(`/availability/me?year=${d.getFullYear()}&month=${d.getMonth() + 1}`);
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

  useEffect(() => { loadAvailability(); }, [loadAvailability]);

  const closeDetailPanel = useCallback(() => {
    if (panelClosing) return;
    setPanelClosing(true);
    window.setTimeout(() => {
      setDetailDate(null);
      setPanelClosing(false);
    }, 240);
  }, [panelClosing]);

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

  const getDateStr = (d: number) => {
    const m = String(displayMonth + 1).padStart(2, '0');
    return `${displayYear}-${m}-${String(d).padStart(2, '0')}`;
  };

  const handleDetailBlock = async (reason: string) => {
    if (!detailDate) return;
    setDetailSaving(true);
    try {
      await api.put('/availability/bulk', { slots: [{ date: detailDate, status: 'blocked', notes: reason }] });
      await loadAvailability();
      closeDetailPanel();
    } catch (err) {
      toast.error(err instanceof ApiException ? err.payload.message : 'Failed to block date.');
    } finally {
      setDetailSaving(false);
    }
  };

  const handleDetailUnblock = async () => {
    if (!detailDate) return;
    setDetailSaving(true);
    try {
      await api.put('/availability/bulk', { slots: [{ date: detailDate, status: 'available' }] });
      await loadAvailability();
      closeDetailPanel();
    } catch (err) {
      toast.error(err instanceof ApiException ? err.payload.message : 'Failed to unblock date.');
    } finally {
      setDetailSaving(false);
    }
  };

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
      await loadAvailability();
    } catch (err) {
      const msg = err instanceof ApiException ? err.payload.message : 'Failed to request cancellation.';
      toast.error(msg);
      setActionError(msg);
    } finally {
      setActioning(null);
    }
  }, [cancellingId, cancelReason, refetchBookings, loadAvailability]);

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-[#F3F4F6] w-full">
      <DashboardHeader />
      <div className="flex-1 flex min-h-0 overflow-hidden">
        <DashboardSidebar links={individualNavLinks} />
        <main className="flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden">
          <div className="flex-1 min-h-0 overflow-auto">
            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-6 xl:px-8 py-5">

              <div className="relative rounded-2xl bg-white border border-neutral-200/70 px-6 sm:px-8 py-6 overflow-hidden shadow-soft mb-5">
                <div className="absolute inset-y-0 right-0 w-1/2 bg-gradient-to-l from-[#E8F0FE]/60 to-transparent pointer-events-none" />
                <span aria-hidden className="absolute left-0 top-6 bottom-6 w-1 rounded-r-full bg-gradient-to-b from-[#3678F1] to-[#5B9DF9]" />
                <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 z-10 pl-3">
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#3678F1]">
                      {today.toLocaleDateString('en-IN', { weekday: 'long', day: '2-digit', month: 'short' })}
                    </p>
                    <h1 className="text-[22px] sm:text-[24px] font-extrabold text-neutral-900 tracking-tight leading-tight mt-1">My Dashboard</h1>
                    <p className="text-sm text-neutral-500 mt-1.5">Your availability and booking overview</p>
                  </div>
                  <RoleIndicator />
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                <div className="lg:col-span-3 order-2 lg:order-1">
                  <div className="rounded-2xl bg-white shadow-soft border border-neutral-200/70 p-4 sm:p-5 min-w-0 relative hover:border-[#3678F1] transition-colors duration-200">
                    <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
                      <h2 className="text-base font-bold text-neutral-900 flex items-center gap-2">
                        <span className="w-1 h-4 rounded-full bg-[#3678F1]" />
                        Availability Calendar
                      </h2>
                      <div className="flex items-center gap-1.5">
                        <button type="button" onClick={() => setMonthOffset((o) => o - 1)} className="w-8 h-8 rounded-lg border border-neutral-200 flex items-center justify-center text-neutral-600 hover:bg-[#E8F0FE] hover:text-[#3678F1] hover:border-[#3678F1]/30 transition-colors">
                          <FaChevronLeft className="text-xs" />
                        </button>
                        <span className="text-sm font-semibold text-neutral-900 min-w-[130px] text-center tabular-nums">{monthLabel} {yearLabel}</span>
                        <button type="button" onClick={() => setMonthOffset((o) => o + 1)} className="w-8 h-8 rounded-lg border border-neutral-200 flex items-center justify-center text-neutral-600 hover:bg-[#E8F0FE] hover:text-[#3678F1] hover:border-[#3678F1]/30 transition-colors">
                          <FaChevronRight className="text-xs" />
                        </button>
                      </div>
                    </div>

                    {monthOffset < 0 && (
                      <div className="flex items-center gap-2 mb-3 px-3 py-2 bg-[#E8F0FE] rounded-xl">
                        <FaCircleInfo className="text-[#3678F1] text-xs shrink-0" />
                        <p className="text-xs text-[#3678F1]">Viewing history — go to <Link to="/availability" className="underline">Availability</Link> to manage dates</p>
                      </div>
                    )}

                    <div className="grid grid-cols-7 gap-1 mb-1">
                      {DAYS.map((day) => <div key={day} className="text-center text-[11px] font-semibold text-neutral-400 py-1">{day}</div>)}
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
                          <span className="text-[11px] sm:text-xs font-semibold leading-none">{cell.muted ? '' : cell.d}</span>
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
                            <span className="text-[8px] sm:text-[9px] font-medium leading-tight truncate w-full opacity-80 px-0.5">
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
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-4 pt-4 border-t border-neutral-100">
                      {availLoading && (
                        <span className="inline-flex items-center gap-1.5 text-[11px] text-neutral-400 mr-2">
                          <span className="w-3 h-3 border-[1.5px] border-[#3678F1]/15 border-t-[#3678F1] border-r-[#3678F1] rounded-full animate-spin" />
                          Syncing availability…
                        </span>
                      )}
                      {LEGEND_SWATCHES.map(({ key, swatch, label }) => (
                        <div key={key} className="flex items-center gap-1.5">
                          <span className={`w-3 h-3 rounded ${swatch}`} />
                          <span className="text-[11px] font-medium text-neutral-500">{label}</span>
                        </div>
                      ))}
                    </div>
                    <p className="mt-3 text-[11px] text-neutral-400">
                      Tap a date for details. Full schedule:{' '}
                      <Link to="/availability" className="text-[#3678F1] hover:underline">Availability</Link>.
                    </p>
                  </div>
                </div>

                <div className="space-y-4 order-1 lg:order-2">
                  <div className="rounded-2xl bg-white shadow-soft border border-neutral-200/70 p-4 hover:border-[#3678F1] transition-colors duration-200">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-7 h-7 rounded-lg bg-[#E8F0FE] ring-1 ring-[#3678F1]/15 flex items-center justify-center shrink-0">
                        <FaBell className="text-[#3678F1] text-xs" />
                      </div>
                      <h3 className="text-sm font-bold text-neutral-900">Booking Requests</h3>
                      {pendingBookings.length > 0 && (
                        <span className="ml-auto text-[10px] font-bold text-white bg-[#F40F02] rounded-full min-w-5 h-5 px-1.5 flex items-center justify-center tabular-nums">
                          {pendingBookings.length}
                        </span>
                      )}
                    </div>

                    {actionError && (
                      <div className="flex items-center gap-2 mb-3 p-2.5 bg-[#FEEBEA] border border-[#F40F02]/30 rounded-xl">
                        <FaTriangleExclamation className="text-[#F40F02] text-xs shrink-0" />
                        <p className="text-xs text-[#991B1B]">{actionError}</p>
                      </div>
                    )}

                    {bookingsLoading ? (
                      <div className="space-y-2">
                        {[1,2].map(i => <div key={i} className="skeleton h-16 rounded-xl" />)}
                      </div>
                    ) : pendingBookings.length === 0 ? (
                      <div className="text-center py-6 rounded-xl border border-dashed border-neutral-200 bg-neutral-50/50">
                        <p className="text-xs font-semibold text-neutral-600">You're all caught up</p>
                        <p className="text-[11px] text-neutral-400 mt-0.5">No pending requests</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {pendingBookings.map((b) => (
                          <div key={b.id} className="rounded-xl border border-neutral-200/70 p-3 bg-white hover:border-[#3678F1] transition-colors duration-200">
                            <p className="text-xs font-semibold text-neutral-900 mb-0.5 truncate">{b.project.title}</p>
                            <p className="text-[11px] text-neutral-500 mb-2 truncate">
                              {b.requester.companyProfile?.companyName ?? b.requester.email}
                              {b.rateOffered ? ` · ${formatPaise(b.rateOffered)}` : ''}
                            </p>
                            <div className="flex gap-1.5">
                              <button disabled={actioning === b.id} onClick={() => doAction(b.id, 'accept')} className="flex-1 text-[11px] py-1.5 bg-[#22C55E] text-white rounded-lg hover:bg-[#16A34A] font-semibold transition-colors disabled:opacity-60">Accept</button>
                              <button disabled={actioning === b.id} onClick={() => doAction(b.id, 'decline')} className="flex-1 text-[11px] py-1.5 bg-[#F3F4F6] text-neutral-600 rounded-lg hover:bg-neutral-200 font-medium transition-colors disabled:opacity-60">Decline</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    <Link to="/bookings" className="mt-3 rounded-xl flex items-center justify-center gap-1.5 w-full py-2.5 text-xs text-[#3678F1] bg-[#E8F0FE] hover:bg-[#DBEAFE] text-center font-bold transition-colors duration-200">
                      View All Bookings
                      <FaChevronRight className="text-[10px]" />
                    </Link>
                  </div>

                  <div className="rounded-2xl bg-white shadow-soft border border-neutral-200/70 p-4 hover:border-[#3678F1] transition-colors duration-200">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
                        <span className="w-1 h-4 rounded-full bg-[#3678F1]" />
                        Recent projects
                      </h3>
                      <Link to="/bookings" className="text-[11px] text-[#3678F1] hover:text-[#2563EB] font-semibold transition-colors">View all</Link>
                    </div>
                    {pastItems.length === 0 ? (
                      <div className="text-center py-6 rounded-xl border border-dashed border-neutral-200 bg-neutral-50/50">
                        <p className="text-xs font-semibold text-neutral-600">No completed projects yet</p>
                        <p className="text-[11px] text-neutral-400 mt-0.5">Finished shoots will appear here</p>
                      </div>
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

                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-2xl bg-white shadow-soft border border-neutral-200/70 p-3 hover:border-[#3678F1] transition-colors duration-200">
                      <p className="text-[11px] font-medium text-neutral-500">Active bookings</p>
                      {bookingsLoading ? (
                        <div className="skeleton h-6 w-10 rounded-md mt-1" />
                      ) : (
                        <p className="text-xl font-extrabold text-[#3678F1] tabular-nums mt-0.5">{activeCount}</p>
                      )}
                    </div>
                    <div className="rounded-2xl bg-white shadow-soft border border-neutral-200/70 p-3 hover:border-[#3678F1] transition-colors duration-200">
                      <p className="text-[11px] font-medium text-neutral-500">Completed</p>
                      {bookingsLoading ? (
                        <div className="skeleton h-6 w-10 rounded-md mt-1" />
                      ) : (
                        <p className="text-xl font-extrabold text-[#3678F1] tabular-nums mt-0.5">{pastCount}</p>
                      )}
                    </div>
                  </div>

                  <div className="rounded-2xl bg-white shadow-soft border border-neutral-200/70 p-4 hover:border-[#3678F1] transition-colors duration-200">
                    <h3 className="text-sm font-bold text-neutral-900 mb-3 flex items-center gap-2">
                      <span className="w-1 h-4 rounded-full bg-[#3678F1]" />
                      Quick Actions
                    </h3>
                    <div className="space-y-1.5">
                      <Link to="/availability" className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-neutral-200/70 text-neutral-700 text-[13px] font-semibold hover:border-[#3678F1] transition-colors duration-200">
                        <div className="w-8 h-8 rounded-lg bg-[#E8F0FE] ring-1 ring-[#3678F1]/15 flex items-center justify-center shrink-0">
                          <FaCalendar className="w-3.5 h-3.5 text-[#3678F1]" />
                        </div>
                        <span className="flex-1 truncate">Manage Availability</span>
                        <FaChevronRight className="text-[10px] text-neutral-300" />
                      </Link>
                      <Link to="/conversations" className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-neutral-200/70 text-neutral-700 text-[13px] font-semibold hover:border-[#3678F1] transition-colors duration-200">
                        <div className="w-8 h-8 rounded-lg bg-[#E8F0FE] ring-1 ring-[#3678F1]/15 flex items-center justify-center shrink-0">
                          <FaMessage className="w-3.5 h-3.5 text-[#3678F1]" />
                        </div>
                        <span className="flex-1 truncate">Open Chat</span>
                        <FaChevronRight className="text-[10px] text-neutral-300" />
                      </Link>
                      <Link to="/profile" className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-neutral-200/70 text-neutral-700 text-[13px] font-semibold hover:border-[#3678F1] transition-colors duration-200">
                        <div className="w-8 h-8 rounded-lg bg-[#E8F0FE] ring-1 ring-[#3678F1]/15 flex items-center justify-center shrink-0">
                          <FaUser className="w-3.5 h-3.5 text-[#3678F1]" />
                        </div>
                        <span className="flex-1 truncate">Edit Profile</span>
                        <FaChevronRight className="text-[10px] text-neutral-300" />
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
            className={`fixed inset-0 bg-black/40 backdrop-blur-[2px] z-40 ${panelClosing ? 'backdrop-exit' : 'backdrop-enter'}`}
            onClick={closeDetailPanel}
            aria-hidden
          />
          <aside className={`fixed right-0 top-0 h-full w-full sm:w-[420px] md:w-[440px] lg:w-[460px] bg-white border-l border-neutral-200/60 shadow-2xl z-50 flex flex-col sm:rounded-l-3xl overflow-hidden ${panelClosing ? 'panel-exit' : 'panel-enter'}`}>
            <VendorCalendarDayPanel
              variant="drawer"
              selectedDate={detailDate}
              onDismiss={closeDetailPanel}
              slot={slotForDetailPanel}
              booking={bookingDetails[detailDate]}
              fallbackBookings={fallbackBookingsForDay}
              blockReasons={individualBlockReasons}
              saving={detailSaving}
              onBlock={async (reason) => { await handleDetailBlock(reason); }}
              onUnblock={async () => { await handleDetailUnblock(); }}
              onRequestCancel={(bookingId) => { setCancellingId(bookingId); }}
              allShootDates={allShootDates}
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
                  placeholder="e.g., Schedule conflict…"
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
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-br from-[#3678F1] to-[#2563EB] text-white text-sm font-semibold shadow-brand hover:from-[#2563EB] hover:to-[#1D4ED8] disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
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
