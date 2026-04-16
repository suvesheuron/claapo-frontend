import { useEffect, useState, useCallback } from 'react';
import { FaChevronLeft, FaChevronRight, FaCircleInfo, FaBan, FaLock, FaCircleCheck, FaCalendarCheck } from 'react-icons/fa6';
import DashboardHeader from '../../components/DashboardHeader';
import DashboardSidebar from '../../components/DashboardSidebar';
import AppFooter from '../../components/AppFooter';
import AvailabilityDateDetailModal from '../../components/AvailabilityDateDetailModal';
import { api, ApiException } from '../../services/api';
import toast from 'react-hot-toast';
import { individualNavLinks } from '../../navigation/dashboardNav';
import type { BookingWithDetails } from '../../types/availability';
import { parseAvailabilityMonthResponse } from '../../utils/parseAvailabilityResponse';
import { useChatUnread } from '../../contexts/ChatUnreadContext';
import {
  CELL_STYLE,
  CELL_STATUS_LABEL,
  LEGEND_SWATCHES,
  toCellStatus,
  type CellStatus as CellStatusKey,
} from '../../utils/slotStatusStyles';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

type CellStatus = CellStatusKey | null;

interface AvailabilitySlot {
  date: string;
  status: 'available' | 'booked' | 'blocked' | 'past_work';
  notes?: string | null;
  projectTitle?: string | null;
  companyName?: string | null;
  roleName?: string | null;
  rateOffered?: number | null;
  invoiceId?: string | null;
}

interface CalendarCell {
  d: number;
  muted: boolean;
  status: CellStatus;
  project?: string;
  company?: string;
  role?: string;
  payment?: string;
  invoice?: string;
  notes?: string;
}

function buildCalendar(
  year: number,
  month: number,
  apiSlots: Record<string, AvailabilitySlot>
): CalendarCell[] {
  const firstDay   = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevDays   = new Date(year, month, 0).getDate();
  const cells: CalendarCell[] = [];

  for (let i = firstDay - 1; i >= 0; i--) cells.push({ d: prevDays - i, muted: true, status: null });

  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const slot = apiSlots[dateStr];
    if (slot) {
      cells.push({
        d: day,
        muted: false,
        status: toCellStatus(slot.status),
        project:  slot.projectTitle ?? undefined,
        company:  slot.companyName  ?? undefined,
        role:     slot.roleName     ?? undefined,
        payment:  slot.rateOffered  ? `₹${(slot.rateOffered / 100).toLocaleString('en-IN')}` : undefined,
        invoice:  slot.invoiceId    ?? undefined,
        notes:    slot.notes        ?? undefined,
      });
    } else {
      cells.push({ d: day, muted: false, status: 'available' });
    }
  }

  const rem = 7 - (cells.length % 7);
  if (rem < 7) for (let d2 = 1; d2 <= rem; d2++) cells.push({ d: d2, muted: true, status: null });
  return cells;
}

const cellStyle = CELL_STYLE;

export default function IndividualAvailability() {
  useEffect(() => { document.title = 'Availability – Claapo'; }, []);

  const today = new Date();
  const BASE_YEAR  = today.getFullYear();
  const BASE_MONTH = today.getMonth();

  const [monthOffset, setMonthOffset] = useState(0);
  const [detailDate, setDetailDate] = useState<string | null>(null);
  const [apiSlots, setApiSlots] = useState<Record<string, AvailabilitySlot>>({});
  const [bookingDetails, setBookingDetails] = useState<Record<string, BookingWithDetails>>({});
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [saving, setSaving] = useState(false);
  const { unreadByProject, unreadDateByProject } = useChatUnread();

  const displayDate = new Date(BASE_YEAR, BASE_MONTH + monthOffset, 1);
  const displayYear = displayDate.getFullYear();
  const displayMonth = displayDate.getMonth();
  const monthLabel  = MONTHS[displayMonth];
  const yearLabel   = displayYear;

  // Load slots from API when month changes
  const loadSlots = useCallback(async () => {
    setSlotsLoading(true);
    try {
      const res = await api.get<unknown>(`/availability/me?year=${displayYear}&month=${displayMonth + 1}`);
      const parsed = parseAvailabilityMonthResponse(res);
      setBookingDetails(parsed.bookingDetails);
      const map: Record<string, AvailabilitySlot> = {};
      for (const [key, s] of Object.entries(parsed.slots)) {
        const b = parsed.bookingDetails[key];
        map[key] = {
          date: key,
          status: s.status as AvailabilitySlot['status'],
          notes: s.notes ?? undefined,
          projectTitle: b?.projectTitle,
          companyName: b?.companyName,
          roleName: b?.roleName ?? undefined,
          rateOffered: b?.rateOffered ?? undefined,
          invoiceId: b?.invoiceId ?? undefined,
        };
      }
      setApiSlots(map);
    } catch {
      setBookingDetails({});
    } finally {
      setSlotsLoading(false);
      setHasLoadedOnce(true);
    }
  }, [displayYear, displayMonth]);

  useEffect(() => { loadSlots(); }, [loadSlots]);

  const calendarDays = buildCalendar(displayYear, displayMonth, apiSlots);

  // Collect all shoot dates from bookings for the current month
  const allShootDates = Object.values(bookingDetails).reduce((dates, booking) => {
    if (booking.shootDates?.length) {
      booking.shootDates.forEach(d => dates.add(d));
    }
    return dates;
  }, new Set<string>());

  // Month stats (exclude padding cells)
  const monthStats = calendarDays.reduce(
    (acc, c) => {
      if (c.muted) return acc;
      if (c.status === 'blocked') acc.blocked += 1;
      else if (c.status === 'booked') acc.booked += 1;
      else if (c.status === 'completed') acc.completed += 1;
      else acc.available += 1;
      return acc;
    },
    { available: 0, booked: 0, completed: 0, blocked: 0 },
  );

  const getDateStr = (d: number): string => {
    const m = String(displayDate.getMonth() + 1).padStart(2, '0');
    return `${yearLabel}-${m}-${String(d).padStart(2, '0')}`;
  };

  const openDay = (cell: CalendarCell) => {
    if (cell.muted) return;
    setDetailDate(getDateStr(cell.d));
  };

  const handleBlock = async (reason: string) => {
    if (!detailDate) return;
    setSaving(true);
    try {
      await api.put('/availability/bulk', {
        slots: [{ date: detailDate, status: 'blocked', notes: reason }],
      });
      await loadSlots();
      setDetailDate(null);
    } catch (err) {
      toast.error(err instanceof ApiException ? err.payload.message : 'Failed to block date.');
    } finally {
      setSaving(false);
    }
  };

  const handleUnblock = async () => {
    if (!detailDate) return;
    setSaving(true);
    try {
      await api.put('/availability/bulk', {
        slots: [{ date: detailDate, status: 'available' }],
      });
      await loadSlots();
      setDetailDate(null);
    } catch (err) {
      toast.error(err instanceof ApiException ? err.payload.message : 'Failed to unblock date.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-[#F3F4F6] w-full">
      <DashboardHeader />

      <div className="flex-1 flex min-h-0 overflow-hidden">
        <DashboardSidebar links={individualNavLinks} />

        <main className="flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden">
          <div className="flex-1 min-h-0 overflow-auto">
            <div className="max-w-[1000px] mx-auto px-4 sm:px-6 lg:px-8 py-5">

              <div className="relative rounded-2xl bg-white border border-neutral-200/70 px-6 sm:px-8 py-6 overflow-hidden shadow-soft mb-5">
                <div className="absolute inset-y-0 right-0 w-1/2 bg-gradient-to-l from-[#E8F0FE]/60 to-transparent pointer-events-none" />
                <span aria-hidden className="absolute left-0 top-6 bottom-6 w-1 rounded-r-full bg-gradient-to-b from-[#3678F1] to-[#5B9DF9]" />
                <div className="relative flex items-start justify-between gap-4 flex-wrap z-10 pl-3">
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#3678F1]">{monthLabel} {yearLabel}</p>
                    <h1 className="text-[22px] sm:text-[24px] font-extrabold text-neutral-900 tracking-tight leading-tight mt-1">Manage Schedule</h1>
                    <p className="text-sm text-neutral-500 mt-1.5">Block dates, review bookings, and track your month at a glance.</p>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {slotsLoading && !hasLoadedOnce ? (
                      <>
                        <div className="skeleton h-7 w-20 rounded-full" />
                        <div className="skeleton h-7 w-24 rounded-full" />
                        <div className="skeleton h-7 w-28 rounded-full" />
                      </>
                    ) : (
                      <>
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#DCFCE7] border border-[#86EFAC] px-2.5 py-1 text-[11px] font-bold text-[#15803D]">
                          <FaCircleCheck className="w-2.5 h-2.5" /> {monthStats.available} free
                        </span>
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#DBEAFE] border border-[#3678F1] px-2.5 py-1 text-[11px] font-bold text-[#1E3A8A]">
                          <FaCalendarCheck className="w-2.5 h-2.5" /> {monthStats.booked + monthStats.completed} booked
                        </span>
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FEE2E2] border border-[#F40F02] px-2.5 py-1 text-[11px] font-bold text-[#991B1B]">
                          <FaBan className="w-2.5 h-2.5" /> {monthStats.blocked} unavailable
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="rounded-2xl bg-white shadow-soft border border-neutral-200/70 p-5 hover:border-[#3678F1] transition-colors duration-200">
                {/* Calendar header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-1.5">
                    <button type="button" onClick={() => setMonthOffset((o) => o - 1)} className="w-9 h-9 rounded-xl border border-neutral-200 flex items-center justify-center text-neutral-600 hover:bg-[#E8F0FE] hover:text-[#3678F1] hover:border-[#3678F1]/30 transition-colors" aria-label="Previous month">
                      <FaChevronLeft className="text-xs" />
                    </button>
                    <h2 className="text-base font-bold text-neutral-900 min-w-[150px] text-center tabular-nums">{monthLabel} {yearLabel}</h2>
                    <button type="button" onClick={() => setMonthOffset((o) => o + 1)} className="w-9 h-9 rounded-xl border border-neutral-200 flex items-center justify-center text-neutral-600 hover:bg-[#E8F0FE] hover:text-[#3678F1] hover:border-[#3678F1]/30 transition-colors" aria-label="Next month">
                      <FaChevronRight className="text-xs" />
                    </button>
                  </div>
                  <div className="flex items-center gap-3">
                    {slotsLoading && (
                      <span className="inline-flex items-center gap-1.5 text-[11px] text-neutral-400 font-medium">
                        <span className="w-3 h-3 border-[1.5px] border-[#3678F1]/15 border-t-[#3678F1] border-r-[#3678F1] rounded-full animate-spin" />
                        Loading…
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => setMonthOffset(0)}
                      className="text-xs text-[#3678F1] hover:text-[#2563EB] font-semibold px-2.5 py-1.5 rounded-lg hover:bg-[#E8F0FE] transition-colors"
                    >
                      Today
                    </button>
                  </div>
                </div>

                {/* Past month hint */}
                {monthOffset < 0 && (
                  <div className="flex items-center gap-2 mb-4 px-3 py-2 bg-[#E8F0FE] rounded-xl">
                    <FaCircleInfo className="text-[#3678F1] text-xs shrink-0" />
                    <p className="text-xs text-[#3678F1]">Viewing history — click completed dates to see project details</p>
                  </div>
                )}

                {/* Day headers */}
                <div className="grid grid-cols-7 gap-1 mb-1">
                  {DAYS.map((day) => (
                    <div key={day} className="text-center text-[11px] font-semibold text-neutral-400 py-1.5">{day}</div>
                  ))}
                </div>

                {/* Calendar grid — larger cells */}
                {!hasLoadedOnce && slotsLoading ? (
                  <div className="grid grid-cols-7 gap-1" aria-busy="true" aria-label="Loading calendar">
                    {Array.from({ length: 42 }).map((_, i) => (
                      <div
                        key={i}
                        className="skeleton min-h-[56px] sm:min-h-[64px] rounded-xl"
                        style={{ animationDelay: `${(i % 7) * 60}ms` }}
                      />
                    ))}
                  </div>
                ) : (
                <div className="grid grid-cols-7 gap-1">
                  {calendarDays.map((cell, i) => {
                    const dateStr = !cell.muted ? getDateStr(cell.d) : '';
                    const isSelected = !!dateStr && detailDate === dateStr;
                    const cellProjectId = dateStr ? bookingDetails[dateStr]?.projectId : undefined;
                    const cellUnread = cellProjectId ? (unreadByProject[cellProjectId] ?? 0) : 0;
                    const focusUnread = !cell.muted && cellProjectId
                      && unreadDateByProject[cellProjectId] === dateStr
                      ? cellUnread
                      : 0;
                    const secondaryUnread = !cell.muted && !focusUnread
                      && cellProjectId
                      && (unreadByProject[cellProjectId] ?? 0) > 0
                      && unreadDateByProject[cellProjectId] !== dateStr;
                    return (
                      <div
                        key={i}
                        role={cell.muted ? undefined : 'button'}
                        tabIndex={cell.muted ? undefined : 0}
                        onClick={() => openDay(cell)}
                        title={
                          cell.notes
                            ? `Not available — ${cell.notes}`
                            : cell.status === 'blocked'
                              ? 'Not available'
                              : cell.project ?? undefined
                        }
                        className={`
                          relative rounded-xl border text-center p-1.5 min-h-[56px] sm:min-h-[64px] select-none flex flex-col items-center justify-center gap-0.5 transition-all overflow-hidden
                          ${cell.muted
                            ? 'bg-white border-neutral-100 text-neutral-300 cursor-default'
                            : `${cellStyle[cell.status ?? 'available'] ?? cellStyle.available} cal-cell cursor-pointer`
                          }
                          ${isSelected ? 'ring-2 ring-[#3678F1] ring-offset-1' : ''}
                          ${focusUnread ? 'ring-2 ring-[#F40F02]/70 ring-offset-1' : ''}
                          ${secondaryUnread ? 'ring-1 ring-[#F40F02]/30' : ''}
                        `}
                      >
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
                        {/* Diagonal stripe overlay for blocked cells */}
                        {!cell.muted && cell.status === 'blocked' && (
                          <span
                            aria-hidden
                            className="absolute inset-0 pointer-events-none opacity-30"
                            style={{
                              backgroundImage:
                                'repeating-linear-gradient(45deg, rgba(185,28,28,0.18) 0 4px, transparent 4px 8px)',
                            }}
                          />
                        )}
                        {!cell.muted && cell.status === 'blocked' && (
                          <span className="absolute top-0.5 right-0.5 w-3.5 h-3.5 rounded-full bg-[#DC2626] text-white flex items-center justify-center shadow-sm">
                            <FaLock className="w-1.5 h-1.5" />
                          </span>
                        )}
                        <span className={`relative text-xs font-bold leading-none ${cell.status === 'blocked' ? 'line-through decoration-[1.5px] decoration-[#991B1B]/60' : ''}`}>{cell.d}</span>
                        {!cell.muted && cell.status && (
                          <span className="relative text-[9px] leading-tight truncate w-full font-semibold opacity-90">
                            {cell.status === 'available' && CELL_STATUS_LABEL.available}
                            {cell.status === 'booked' && (cell.project?.split(' ')[0] ?? CELL_STATUS_LABEL.booked)}
                            {cell.status === 'completed' && (cell.project?.split(' ')[0] ?? CELL_STATUS_LABEL.completed)}
                            {cell.status === 'blocked' && (cell.notes ? cell.notes.slice(0, 9) + (cell.notes.length > 9 ? '…' : '') : CELL_STATUS_LABEL.blocked)}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
                )}

                {/* Legend */}
                <div className="flex flex-wrap gap-x-5 gap-y-2 mt-5 pt-4 border-t border-neutral-100">
                  {LEGEND_SWATCHES.map(({ key, swatch, label }) => (
                    <div key={key} className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded ${swatch}`} />
                      <span className="text-xs font-medium text-neutral-600">{label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tips */}
              <div className="mt-4 rounded-2xl bg-[#E8F0FE] border border-[#3678F1]/20 p-4 flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-white flex items-center justify-center shrink-0 ring-1 ring-[#3678F1]/15">
                  <FaCircleInfo className="text-[#3678F1] text-xs" />
                </div>
                <div className="text-xs text-[#2563EB] space-y-1">
                  <p className="font-bold text-[#1E3A8A]">How to use your calendar</p>
                  <p>Click any <strong>available</strong> date to block it with a reason.</p>
                  <p>Navigate to <strong>past months</strong> to view completed booking history.</p>
                  <p>Booking requests from companies will appear as <strong>booked</strong> dates after confirmation.</p>
                </div>
              </div>

            </div>
          </div>

          <AppFooter />
        </main>
      </div>

      <AvailabilityDateDetailModal
        open={!!detailDate}
        onClose={() => setDetailDate(null)}
        selectedDate={detailDate}
        slot={
          detailDate && apiSlots[detailDate]
            ? {
                date: detailDate,
                status: apiSlots[detailDate].status,
                notes: apiSlots[detailDate].notes,
              }
            : undefined
        }
        booking={detailDate ? bookingDetails[detailDate] : undefined}
        mode="self_manage"
        blocking={saving}
        onBlock={handleBlock}
        onUnblock={handleUnblock}
        allShootDates={Array.from(allShootDates)}
      />
    </div>
  );
}
