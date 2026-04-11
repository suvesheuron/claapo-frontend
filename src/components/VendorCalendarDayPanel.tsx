import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaXmark, FaMessage, FaFileInvoice, FaCalendarDay } from 'react-icons/fa6';
import type { BookingWithDetails, SlotStatus } from '../types/availability';
import { formatPaise } from '../utils/currency';

export interface VendorFallbackBookingRow {
  id: string;
  projectId: string;
  projectTitle: string;
  companyLabel: string;
  /** Company main user id — for project-scoped chat */
  companyUserId: string;
  status: string;
  rateOffered?: number | null;
  equipmentLabel?: string | null;
}

const STATUS_LABELS: Record<SlotStatus, string> = {
  available: 'Available',
  booked: 'Booked',
  past_work: 'Completed',
  blocked: 'Blocked',
};

const BADGE: Record<SlotStatus, string> = {
  available:            'bg-[#DCFCE7] text-[#15803D]',
  booked:               'bg-[#DBEAFE] text-[#1D4ED8]',
  past_work:            'bg-[#DBEAFE] text-[#1D4ED8]',
  blocked:              'bg-[#FEE2E2] text-[#B91C1C]',
};

interface VendorCalendarDayPanelProps {
  selectedDate: string | null;
  onDismiss: () => void;
  slot?: { date: string; status: SlotStatus; notes?: string | null };
  booking?: BookingWithDetails;
  fallbackBookings?: VendorFallbackBookingRow[];
  blockReasons: string[];
  saving: boolean;
  onBlock: (reason: string) => Promise<void> | void;
  onUnblock: () => Promise<void> | void;
  onRequestCancel?: (bookingId: string) => void;
  /** Right sliding pane (full height); default is inline card beside calendar */
  variant?: 'card' | 'drawer';
  /** Shoot dates from all bookings for this month to check if date is a shoot date */
  allShootDates?: string[];
}

export default function VendorCalendarDayPanel({
  selectedDate,
  onDismiss,
  slot,
  booking,
  fallbackBookings = [],
  blockReasons,
  saving,
  onBlock,
  onUnblock,
  onRequestCancel,
  variant = 'card',
  allShootDates = [],
}: VendorCalendarDayPanelProps) {
  const [blockMode, setBlockMode] = useState(false);
  const [blockPick, setBlockPick] = useState(blockReasons[0] ?? 'Other');
  const [blockOther, setBlockOther] = useState('');
  const isDrawer = variant === 'drawer';

  if (!selectedDate) {
    if (isDrawer) return null;
    return (
      <div className="rounded-2xl border border-neutral-200 bg-white p-5 min-h-[220px] flex flex-col items-center justify-center text-center">
        <FaCalendarDay className="text-neutral-300 text-3xl mb-3" />
        <p className="text-sm font-semibold text-neutral-700">Select a calendar day</p>
        <p className="text-xs text-neutral-400 mt-1 max-w-[200px]">
          Booked dates show the project and rental details here. You can request cancellation when applicable.
        </p>
      </div>
    );
  }

  const title = new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const effectiveStatus: SlotStatus = slot?.status ?? 'available';
  const rows: { full?: BookingWithDetails; fallback?: VendorFallbackBookingRow }[] =
    booking ? [{ full: booking }] : fallbackBookings.map((f) => ({ fallback: f }));

  const runBlock = async () => {
    const reason = blockPick === 'Other' ? blockOther.trim() : blockPick;
    if (!reason) return;
    await onBlock(reason);
    setBlockMode(false);
    setBlockOther('');
  };

  return (
    <div
      className={
        isDrawer
          ? 'flex flex-col h-full min-h-0 overflow-hidden bg-white'
          : 'rounded-2xl border border-neutral-200 bg-white flex flex-col min-h-[220px] max-h-[min(70vh,520px)] overflow-hidden'
      }
    >
      <div className={`flex items-start justify-between gap-2 shrink-0 border-b border-neutral-100 ${isDrawer ? 'px-5 py-5' : 'px-4 py-3'}`}>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">Selected day</p>
          <p className="text-sm font-bold text-neutral-900">{title}</p>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          className="shrink-0 w-8 h-8 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-500 hover:bg-neutral-200"
          aria-label="Clear selection"
        >
          <FaXmark className="text-sm" />
        </button>
      </div>

      <div className={`flex-1 min-h-0 overflow-y-auto space-y-3 ${isDrawer ? 'px-5 py-5' : 'px-4 py-3'}`}>
        <div>
          <span className={`inline-flex px-2.5 py-1 rounded-full text-[11px] font-semibold ${BADGE[effectiveStatus]}`}>
            {STATUS_LABELS[effectiveStatus]}
          </span>
        </div>

        {rows.length === 0 && (effectiveStatus === 'booked' || effectiveStatus === 'past_work') && (
          <p className="text-xs text-neutral-500">
            Booking details will appear when your availability is synced for this date. Open Manage Schedule if this persists.
          </p>
        )}

        {rows.map((row, idx) => {
          const b = row.full;
          const f = row.fallback;
          const titleText = b?.projectTitle ?? f?.projectTitle ?? 'Booking';
          const company = b?.companyName ?? f?.companyLabel ?? '—';
          const equip = b?.roleName ?? f?.equipmentLabel ?? null;
          const rate = b?.rateOffered ?? f?.rateOffered ?? null;
          const id = b?.id ?? f?.id;
          const st = (b?.status ?? f?.status ?? '').toLowerCase();
          const canReqCancel =
            !!onRequestCancel && !!id && (st === 'accepted' || st === 'locked');
          const projectId = b?.projectId ?? f?.projectId;
          const companyChatId = b?.companyUserId ?? f?.companyUserId;

          return (
            <div key={id ?? idx} className="rounded-xl border border-neutral-200 bg-neutral-50/80 p-3 space-y-2">
              <p className="text-[11px] font-bold text-neutral-500 uppercase tracking-wide">Project / rental</p>
              <p className="text-sm font-bold text-neutral-900 leading-snug">{titleText}</p>
              <p className="text-xs text-neutral-600">
                <span className="text-neutral-400">Company</span> · {company}
              </p>
              {equip ? (
                <p className="text-xs text-neutral-600">
                  <span className="text-neutral-400">Equipment / role</span> · {equip}
                </p>
              ) : null}
              {rate != null ? (
                <p className="text-xs text-neutral-600">
                  <span className="text-neutral-400">Rate</span> · {formatPaise(rate)}
                </p>
              ) : null}
              {b?.shootDates?.length ? (
                <p className="text-[11px] text-neutral-500">{b.shootDates.length} shoot day(s) in booking</p>
              ) : null}

              <div className="flex flex-wrap gap-2 pt-1">
                {companyChatId && projectId && (
                  <Link
                    to={`/dashboard/chat/${companyChatId}?projectId=${encodeURIComponent(projectId)}`}
                    className="inline-flex flex-1 min-w-[100px] items-center justify-center gap-1.5 rounded-lg py-2 px-2 bg-[#EEF4FF] text-[#3B5BDB] text-xs font-semibold border border-[#3B5BDB]/20"
                  >
                    <FaMessage className="text-xs" /> Chat
                  </Link>
                )}
              </div>
            </div>
          );
        })}

        {effectiveStatus === 'blocked' && slot?.notes && (
          <div className="text-xs">
            <p className="font-semibold text-neutral-500 mb-1">Block note</p>
            <p className="text-neutral-800 border border-neutral-200 rounded-lg p-2 bg-white">{slot.notes}</p>
          </div>
        )}

        {effectiveStatus === 'blocked' && !booking && (
          <button
            type="button"
            onClick={() => onUnblock()}
            disabled={saving}
            className="w-full rounded-xl py-2.5 bg-[#3B5BDB] text-white text-xs font-semibold hover:bg-[#2f4ac2] disabled:opacity-60"
          >
            {saving ? 'Saving…' : 'Mark date available'}
          </button>
        )}

        {effectiveStatus === 'available' && !booking && fallbackBookings.length === 0 && slot && (
          <>
            {!blockMode ? (
              <button
                type="button"
                onClick={() => setBlockMode(true)}
                disabled={saving}
                className="w-full rounded-xl py-2.5 bg-neutral-100 text-neutral-800 text-xs font-semibold hover:bg-neutral-200 disabled:opacity-60"
              >
                Block this date
              </button>
            ) : (
              <div className="space-y-2">
                <p className="text-xs font-bold text-neutral-800">Reason</p>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {blockReasons.map((r) => (
                    <label key={r} className="flex items-center gap-2 text-xs cursor-pointer">
                      <input type="radio" name="blk" checked={blockPick === r} onChange={() => setBlockPick(r)} className="accent-[#3B5BDB]" />
                      {r}
                    </label>
                  ))}
                </div>
                {blockPick === 'Other' && (
                  <input
                    type="text"
                    value={blockOther}
                    onChange={(e) => setBlockOther(e.target.value)}
                    placeholder="Describe…"
                    className="w-full rounded-lg px-3 py-2 border border-neutral-300 text-xs"
                  />
                )}
                <div className="flex gap-2">
                  <button type="button" disabled={saving} onClick={runBlock} className="flex-1 py-2 rounded-lg bg-[#3B5BDB] text-white text-xs font-semibold disabled:opacity-50">
                    {saving ? 'Saving…' : 'Confirm'}
                  </button>
                  <button type="button" disabled={saving} onClick={() => setBlockMode(false)} className="flex-1 py-2 rounded-lg bg-neutral-100 text-xs font-semibold">
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        <div className="border-t border-neutral-100 pt-4 mt-4">
          {allShootDates.includes(selectedDate) ? (
            <Link
              to={`/dashboard/invoices?issuedOn=${selectedDate}`}
              className="flex w-full items-center justify-center gap-2 rounded-xl py-2.5 bg-[#EEF4FF] text-[#3B5BDB] text-xs font-semibold border border-[#3B5BDB]/20 hover:bg-[#DBEAFE] transition-colors"
            >
              <FaFileInvoice className="text-xs" /> Invoices
            </Link>
          ) : null}
          
          {/* Direct cancellation button for booked/hired dates */}
          {(booking || fallbackBookings.some(fb => fb.status === 'accepted' || fb.status === 'locked')) && (
            <button
              type="button"
              onClick={() => {
                const bookingId = booking?.id ?? fallbackBookings.find(fb => fb.status === 'accepted' || fb.status === 'locked')?.id;
                if (bookingId) onRequestCancel?.(bookingId);
              }}
              className="mt-2 w-full rounded-xl py-2.5 border border-amber-300 bg-amber-50 text-amber-900 text-xs font-semibold hover:bg-amber-100 transition-colors"
            >
              Request cancellation
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
