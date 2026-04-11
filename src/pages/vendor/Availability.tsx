import { useEffect, useState, useCallback, useMemo } from 'react';
import { FaChevronLeft, FaChevronRight, FaCircleInfo } from 'react-icons/fa6';
import DashboardHeader from '../../components/DashboardHeader';
import DashboardSidebar from '../../components/DashboardSidebar';
import AppFooter from '../../components/AppFooter';
import VendorCalendarDayPanel from '../../components/VendorCalendarDayPanel';
import { api, ApiException } from '../../services/api';
import toast from 'react-hot-toast';
import { useApiQuery } from '../../hooks/useApiQuery';
import { vendorNavLinks } from '../../navigation/dashboardNav';
import type { BookingWithDetails, SlotStatus } from '../../types/availability';
import { parseAvailabilityMonthResponse } from '../../utils/parseAvailabilityResponse';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAYS   = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

type CellStatus = 'available' | 'booked' | 'completed' | 'blocked' | null;

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
  equipment?: string;
  company?: string;
  project?: string;
  payment?: string;
  invoice?: string;
  notes?: string;
}

function toFrontendStatus(s: string): CellStatus {
  if (s === 'past_work') return 'completed';
  if (s === 'blocked')   return 'blocked';
  if (s === 'booked')    return 'booked';
  return 'available';
}

function buildCalendar(
  year: number,
  month: number,
  slots: Record<string, AvailabilitySlot>,
  equipmentByDate?: Record<string, string[]>,
): CalendarCell[] {
  const firstDay    = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevDays    = new Date(year, month, 0).getDate();
  const cells: CalendarCell[] = [];
  for (let i = firstDay - 1; i >= 0; i--) cells.push({ d: prevDays - i, muted: true, status: null });
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const slot = slots[dateStr];
    const equipmentList = equipmentByDate?.[dateStr];
    const equipment = equipmentList?.length ? equipmentList.join(', ') : undefined;
    if (slot) {
      cells.push({
        d: day, muted: false,
        status:    toFrontendStatus(slot.status),
        project:   slot.projectTitle ?? undefined,
        company:   slot.companyName  ?? undefined,
        payment:   slot.rateOffered  ? `₹${(slot.rateOffered / 100).toLocaleString('en-IN')}` : undefined,
        invoice:   slot.invoiceId    ?? undefined,
        notes:     slot.notes        ?? undefined,
        equipment,
      });
    } else {
      cells.push({ d: day, muted: false, status: 'available', equipment });
    }
  }
  const rem = 7 - (cells.length % 7);
  if (rem < 7) for (let d2 = 1; d2 <= rem; d2++) cells.push({ d: d2, muted: true, status: null });
  return cells;
}

const cellStyle: Record<string, string> = {
  available: 'bg-[#DCFCE7] border-[#86EFAC] text-[#15803D]',
  booked:    'bg-[#FDE68A] border-[#F59E0B] text-[#92400E]',
  completed: 'bg-[#93C5FD] border-[#3B82F6] text-[#1E3A8A]',
  blocked:   'bg-[#FEE2E2] border-[#FECACA] text-[#B91C1C]',
};

const VENDOR_BLOCK_REASONS = ['Equipment maintenance', 'Unavailable for rental', 'Reserved for other use', 'Other'];

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

interface IncomingBooking {
  id: string;
  status: string;
  rateOffered?: number | null;
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

export default function VendorAvailability() {
  useEffect(() => { document.title = 'Equipment Availability – Claapo'; }, []);

  const today     = new Date();
  const BASE_YEAR  = today.getFullYear();
  const BASE_MONTH = today.getMonth();

  const vendorBlockReasons = useMemo(() => VENDOR_BLOCK_REASONS, []);

  const [monthOffset, setMonthOffset] = useState(0);
  const [detailDate, setDetailDate] = useState<string | null>(null);
  const [apiSlots,    setApiSlots]    = useState<Record<string, AvailabilitySlot>>({});
  const [bookingDetails, setBookingDetails] = useState<Record<string, BookingWithDetails>>({});
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [saving,      setSaving]      = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelBusy, setCancelBusy] = useState(false);

  const displayDate = new Date(BASE_YEAR, BASE_MONTH + monthOffset, 1);
  const monthLabel  = MONTHS[displayDate.getMonth()];
  const yearLabel   = displayDate.getFullYear();
  const monthIndex  = displayDate.getMonth();

  const loadSlots = useCallback(async () => {
    setSlotsLoading(true);
    try {
      const res = await api.get<unknown>(`/availability/me?year=${yearLabel}&month=${monthIndex + 1}`);
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
    }
    finally { setSlotsLoading(false); }
  }, [yearLabel, monthIndex]);

  useEffect(() => { loadSlots(); }, [loadSlots]);

  const { data: equipmentList } = useApiQuery<{ id: string; name: string; availabilities?: { availableFrom: string; availableTo: string }[] }[]>(
    '/equipment/me',
  );
  const equipmentItems = equipmentList ?? [];

  const { data: bookingsData, refetch: refetchBookings } = useApiQuery<{ items: IncomingBooking[] }>('/bookings/incoming');
  const { data: pastData } = useApiQuery<{ items: PastBookingItem[] }>('/bookings/past');
  const incomingItems = bookingsData?.items ?? [];
  const pastItems = pastData?.items ?? [];

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
  }, [detailDate, bookingDetails, incomingItems, pastItems]);

  const slotForDetailPanel = detailDate
    ? apiSlots[detailDate]
      ? {
          date: detailDate,
          status: apiSlots[detailDate]!.status as SlotStatus,
          notes: apiSlots[detailDate]!.notes ?? null,
        }
      : bookingDetails[detailDate]
        ? { date: detailDate, status: 'booked' as const, notes: null as string | null }
        : fallbackBookingsForDay.some((f) => f.status === 'past_work')
          ? { date: detailDate, status: 'past_work' as const, notes: null as string | null }
          : fallbackBookingsForDay.length
            ? { date: detailDate, status: 'booked' as const, notes: null as string | null }
            : { date: detailDate, status: 'available' as const, notes: null as string | null }
    : undefined;

  const equipmentByDate = (() => {
    const map: Record<string, string[]> = {};
    const monthStart = new Date(yearLabel, displayDate.getMonth(), 1);
    const monthEnd = new Date(yearLabel, displayDate.getMonth() + 1, 0);
    for (const eq of equipmentItems) {
      const avails = eq.availabilities ?? [];
      for (const a of avails) {
        const from = new Date(a.availableFrom);
        const to = new Date(a.availableTo);
        const start = from < monthStart ? monthStart : from;
        const end = to > monthEnd ? monthEnd : to;
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
          const key = d.toISOString().slice(0, 10);
          if (!map[key]) map[key] = [];
          if (!map[key].includes(eq.name)) map[key].push(eq.name);
        }
      }
    }
    return map;
  })();

  const calendarDays = buildCalendar(yearLabel, displayDate.getMonth(), apiSlots, equipmentByDate);

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
      await api.put('/availability/bulk', { slots: [{ date: detailDate, status: 'blocked', notes: reason }] });
      await loadSlots();
      setDetailDate(null);
    } catch (err) {
      toast.error(err instanceof ApiException ? err.payload.message : 'Failed to update availability.');
    } finally {
      setSaving(false);
    }
  };

  const handleUnblock = async () => {
    if (!detailDate) return;
    setSaving(true);
    try {
      await api.put('/availability/bulk', { slots: [{ date: detailDate, status: 'available' }] });
      await loadSlots();
      setDetailDate(null);
    } catch (err) {
      toast.error(err instanceof ApiException ? err.payload.message : 'Failed to update availability.');
    } finally {
      setSaving(false);
    }
  };

  const submitCancelRequest = async () => {
    if (!cancellingId) return;
    setCancelBusy(true);
    try {
      await api.patch(`/bookings/${cancellingId}/request-cancel`, { reason: cancelReason || undefined });
      toast.success('Cancellation request sent. Awaiting company approval.');
      setCancellingId(null);
      setCancelReason('');
      refetchBookings();
      await loadSlots();
    } catch (err) {
      toast.error(err instanceof ApiException ? err.payload.message : 'Failed to request cancellation.');
    } finally {
      setCancelBusy(false);
    }
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-[#F3F4F6] w-full">
      <DashboardHeader />
      <div className="flex-1 flex min-h-0 overflow-hidden">
        <DashboardSidebar links={vendorNavLinks} />
        <main className="flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden">
          <div className="flex-1 min-h-0 overflow-auto">
            <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-5">

              <div className="mb-5">
                <h1 className="text-xl font-bold text-neutral-900">Equipment Availability</h1>
                <p className="text-sm text-neutral-500 mt-0.5">Manage equipment schedule, block dates, and view rental history</p>
              </div>

              <div className="rounded-2xl bg-white border border-neutral-200 p-5 min-w-0">
                {/* Header */}
                <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => setMonthOffset((o) => o - 1)} className="w-9 h-9 rounded-xl border border-neutral-200 flex items-center justify-center text-neutral-600 hover:bg-neutral-100 transition-colors">
                      <FaChevronLeft className="text-xs" />
                    </button>
                    <h2 className="text-base font-bold text-neutral-900 min-w-[150px] text-center">{monthLabel} {yearLabel}</h2>
                    <button type="button" onClick={() => setMonthOffset((o) => o + 1)} className="w-9 h-9 rounded-xl border border-neutral-200 flex items-center justify-center text-neutral-600 hover:bg-neutral-100 transition-colors">
                      <FaChevronRight className="text-xs" />
                    </button>
                  </div>
                  <div className="flex items-center gap-3">
                    {slotsLoading && <span className="text-xs text-neutral-400">Loading…</span>}
                    <button type="button" onClick={() => setMonthOffset(0)} className="text-xs text-[#3B5BDB] hover:underline font-medium">Today</button>
                  </div>
                </div>

                {monthOffset < 0 && (
                  <div className="flex items-center gap-2 mb-4 px-3 py-2 bg-[#EEF4FF] rounded-xl">
                    <FaCircleInfo className="text-[#3B5BDB] text-xs shrink-0" />
                    <p className="text-xs text-[#3B5BDB]">Viewing history — click completed dates to see rental details</p>
                  </div>
                )}

                {/* Day headers */}
                <div className="grid grid-cols-7 gap-1 mb-1">
                  {DAYS.map((day) => (
                    <div key={day} className="text-center text-[11px] font-semibold text-neutral-400 py-1.5">{day}</div>
                  ))}
                </div>

                {/* Calendar grid */}
                <div className="grid grid-cols-7 gap-1">
                  {calendarDays.map((cell, i) => {
                    const ds = !cell.muted ? getDateStr(cell.d) : '';
                    const isSelected = !!ds && detailDate === ds;
                    return (
                      <div
                        key={i}
                        role={cell.muted ? undefined : 'button'}
                        tabIndex={cell.muted ? undefined : 0}
                        onClick={() => openDay(cell)}
                        title={cell.notes ? `Blocked: ${cell.notes}` : cell.equipment ?? undefined}
                        className={`
                          rounded-xl border text-center p-1.5 min-h-[56px] sm:min-h-[64px] select-none flex flex-col items-center justify-center gap-0.5
                          ${cell.muted
                            ? 'bg-white border-neutral-100 text-neutral-300 cursor-default'
                            : `${cellStyle[cell.status ?? 'available'] ?? cellStyle.available} cal-cell cursor-pointer`
                          }
                          ${isSelected ? 'ring-2 ring-[#3B5BDB] ring-offset-1' : ''}
                        `}
                      >
                        <span className="text-xs font-bold leading-none">{cell.d}</span>
                        {!cell.muted && cell.status && (
                          <span className="text-[9px] leading-tight truncate w-full font-medium opacity-80">
                            {cell.status === 'available' && 'Free'}
                            {cell.status === 'booked'    && (cell.project?.split(' ')[0] ?? 'Ongoing')}
                            {cell.status === 'completed' && (cell.project?.split(' ')[0] ?? 'Done')}
                            {cell.status === 'blocked'   && (cell.notes ? cell.notes.slice(0, 9) + (cell.notes.length > 9 ? '…' : '') : 'Unavailable')}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Legend */}
                <div className="flex flex-wrap gap-5 mt-5 pt-4 border-t border-neutral-100">
                  {[
                    { color: 'bg-[#22C55E]',   label: 'Available' },
                    { color: 'bg-[#F59E0B]',   label: 'Ongoing' },
                    { color: 'bg-[#3B82F6]',   label: 'Completed' },
                    { color: 'bg-[#EF4444]', label: 'Unavailable' },
                  ].map(({ color, label }) => (
                    <div key={label} className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${color}`} />
                      <span className="text-xs text-neutral-500">{label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 rounded-2xl bg-[#EEF4FF] border border-[#BFDBFE] p-4 flex items-start gap-3">
                <FaCircleInfo className="text-[#3B5BDB] mt-0.5 shrink-0" />
                <div className="text-xs text-[#1D4ED8] space-y-1">
                  <p className="font-semibold">Managing equipment availability</p>
                  <p>Click <strong>available</strong> dates to block equipment for maintenance or other reasons.</p>
                  <p>Navigate to <strong>past months</strong> to view completed rental history.</p>
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
              booking={detailDate ? bookingDetails[detailDate] : undefined}
              fallbackBookings={fallbackBookingsForDay}
              blockReasons={vendorBlockReasons}
              saving={saving}
              onBlock={handleBlock}
              onUnblock={handleUnblock}
              onRequestCancel={(id) => setCancellingId(id)}
            />
          </aside>
        </>
      )}

      {cancellingId && (
        <>
          <div className="fixed inset-0 bg-black/40 z-[60]" onClick={() => !cancelBusy && setCancellingId(null)} />
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 pointer-events-none">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 pointer-events-auto">
              <h2 className="text-base font-bold text-neutral-900 mb-2">Request cancellation</h2>
              <p className="text-sm text-neutral-600 mb-4">The production company must approve before your booking is released.</p>
              <label className="block text-xs font-semibold text-neutral-700 mb-1.5">Reason (optional)</label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                rows={3}
                className="w-full px-4 py-2.5 border border-neutral-300 rounded-xl text-sm bg-[#F3F4F6] focus:bg-white focus:outline-none focus:border-[#3B5BDB] resize-none mb-4"
              />
              <div className="flex gap-3">
                <button type="button" disabled={cancelBusy} onClick={() => { setCancellingId(null); setCancelReason(''); }} className="flex-1 py-2.5 rounded-xl border border-neutral-200 text-sm font-semibold text-neutral-700 hover:bg-neutral-50 disabled:opacity-50">
                  Back
                </button>
                <button type="button" disabled={cancelBusy} onClick={() => void submitCancelRequest()} className="flex-1 py-2.5 rounded-xl bg-amber-600 text-white text-sm font-semibold hover:bg-amber-700 disabled:opacity-50 flex items-center justify-center gap-2">
                  {cancelBusy ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Sending…</> : 'Send request'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
