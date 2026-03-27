import { useEffect, useState, useCallback, useMemo } from 'react';
import { FaChevronLeft, FaChevronRight, FaCircleInfo } from 'react-icons/fa6';
import DashboardHeader from '../../components/DashboardHeader';
import DashboardSidebar from '../../components/DashboardSidebar';
import AppFooter from '../../components/AppFooter';
import AvailabilityDateDetailModal from '../../components/AvailabilityDateDetailModal';
import { api, ApiException } from '../../services/api';
import toast from 'react-hot-toast';
import { useApiQuery } from '../../hooks/useApiQuery';
import { vendorNavLinks } from '../../navigation/dashboardNav';
import type { BookingWithDetails } from '../../types/availability';
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
  booked:    'bg-[#DBEAFE] border-[#93C5FD] text-[#1D4ED8]',
  completed: 'bg-[#DBEAFE] border-[#93C5FD] text-[#1D4ED8]',
  blocked:   'bg-[#FEE2E2] border-[#FECACA] text-[#B91C1C]',
};

const VENDOR_BLOCK_REASONS = ['Equipment maintenance', 'Unavailable for rental', 'Reserved for other use', 'Other'];

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

  const displayDate = new Date(BASE_YEAR, BASE_MONTH + monthOffset, 1);
  const monthLabel  = MONTHS[displayDate.getMonth()];
  const yearLabel   = displayDate.getFullYear();

  const loadSlots = useCallback(async () => {
    setSlotsLoading(true);
    try {
      const res = await api.get<unknown>(`/availability/me?year=${yearLabel}&month=${displayDate.getMonth() + 1}`);
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
  }, [yearLabel, displayDate]);

  useEffect(() => { loadSlots(); }, [loadSlots]);

  const { data: equipmentList } = useApiQuery<{ id: string; name: string; availabilities?: { availableFrom: string; availableTo: string }[] }[]>(
    '/equipment/me',
  );
  const equipmentItems = equipmentList ?? [];

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

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-[#F3F4F6] w-full">
      <DashboardHeader />
      <div className="flex-1 flex min-h-0 overflow-hidden">
        <DashboardSidebar links={vendorNavLinks} />
        <main className="flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden">
          <div className="flex-1 min-h-0 overflow-auto">
            <div className="max-w-[1000px] mx-auto px-4 sm:px-6 lg:px-8 py-5">

              <div className="mb-5">
                <h1 className="text-xl font-bold text-neutral-900">Equipment Availability</h1>
                <p className="text-sm text-neutral-500 mt-0.5">Manage equipment schedule, block dates, and view rental history</p>
              </div>

              <div className="rounded-2xl bg-white border border-neutral-200 p-5">
                {/* Header */}
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
                            {cell.status === 'booked'    && (cell.project?.split(' ')[0] ?? 'Booked')}
                            {cell.status === 'completed' && (cell.project?.split(' ')[0] ?? 'Done')}
                            {cell.status === 'blocked'   && (cell.notes ? cell.notes.slice(0, 9) + (cell.notes.length > 9 ? '…' : '') : 'Blocked')}
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
                    { color: 'bg-[#3B82F6]',   label: 'Booked' },
                    { color: 'bg-[#3B82F6]',   label: 'Completed' },
                    { color: 'bg-[#EF4444]', label: 'Blocked' },
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

      <AvailabilityDateDetailModal
        open={!!detailDate}
        onClose={() => setDetailDate(null)}
        selectedDate={detailDate}
        slot={
          detailDate && apiSlots[detailDate]
            ? { date: detailDate, status: apiSlots[detailDate].status, notes: apiSlots[detailDate].notes }
            : undefined
        }
        booking={detailDate ? bookingDetails[detailDate] : undefined}
        mode="self_manage"
        blocking={saving}
        onBlock={handleBlock}
        onUnblock={handleUnblock}
        blockReasonOptions={vendorBlockReasons}
      />
    </div>
  );
}
