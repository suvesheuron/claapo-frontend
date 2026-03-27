import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FaXmark, FaMessage, FaFileInvoice, FaPlus } from 'react-icons/fa6';
import type { BookingWithDetails, SlotStatus } from '../types/availability';
import { formatPaise } from '../utils/currency';

const DEFAULT_BLOCK_REASONS = ['Personal', 'Already booked externally', 'Not available', 'Traveling', 'Other'];

const STATUS_LABELS: Record<SlotStatus, string> = {
  available: 'Available',
  booked: 'Booked',
  past_work: 'Completed',
  blocked: 'Blocked',
};

const STATUS_BADGE_STYLE: Record<SlotStatus, string> = {
  available: 'bg-[#DCFCE7] text-[#15803D]',
  booked: 'bg-[#DBEAFE] text-[#1D4ED8]',
  past_work: 'bg-[#DBEAFE] text-[#1D4ED8]',
  blocked: 'bg-[#FEE2E2] text-[#B91C1C]',
};

function formatDateRange(dateStrings: string[]): string {
  if (!dateStrings?.length) return '';
  const dates = dateStrings.map((d) => new Date(d + 'T00:00:00'));
  if (dates.length === 1) {
    return dates[0].toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  }
  const sorted = [...dates].sort((a, b) => a.getTime() - b.getTime());
  const start = sorted[0];
  const end = sorted[sorted.length - 1];
  const sameMonth = start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear();
  if (sameMonth) {
    return `${start.toLocaleDateString('en-IN', { day: 'numeric' })} - ${end.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`;
  }
  return `${start.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} - ${end.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`;
}

export interface AvailabilityDateDetailModalProps {
  open: boolean;
  onClose: () => void;
  selectedDate: string | null;
  /** Slot for this date if returned by API; otherwise treated as open day. */
  slot: { date: string; status: SlotStatus; notes?: string | null } | undefined;
  booking: BookingWithDetails | undefined;
  /** Company viewing crew/vendor: read-only, booking-aware actions like mobile. */
  mode: 'company_readonly' | 'self_manage';
  blocking?: boolean;
  onBlock?: (reason: string) => Promise<void>;
  onUnblock?: () => Promise<void>;
  /** Individual/vendor: start cancellation flow (parent shows confirm UI). */
  onRequestCancelBooking?: (booking: BookingWithDetails) => void;
  /** Override block-reason presets (e.g. vendors use equipment-specific reasons). */
  blockReasonOptions?: string[];
}

export default function AvailabilityDateDetailModal({
  open,
  onClose,
  selectedDate,
  slot,
  booking,
  mode,
  blocking = false,
  onBlock,
  onUnblock,
  onRequestCancelBooking,
  blockReasonOptions,
}: AvailabilityDateDetailModalProps) {
  const reasonList = blockReasonOptions?.length ? blockReasonOptions : DEFAULT_BLOCK_REASONS;
  const [blockMode, setBlockMode] = useState(false);
  const [blockReason, setBlockReason] = useState(reasonList[0]);
  const [blockOther, setBlockOther] = useState('');
  const reasonListFirst = reasonList[0];

  useEffect(() => {
    if (!open) {
      setBlockMode(false);
      setBlockReason(reasonListFirst);
      setBlockOther('');
    }
  }, [open, selectedDate, reasonListFirst]);

  if (!open || !selectedDate) return null;

  const isCompany = mode === 'company_readonly';
  const canMutate = mode === 'self_manage' && !!onBlock && !!onUnblock;

  const effectiveStatus: SlotStatus = slot?.status ?? 'available';
  const selectedSlot = slot;

  const title = new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const chatUserId = booking
    ? isCompany
      ? booking.targetUserId
      : booking.companyUserId
    : null;

  const handleConfirmBlock = async () => {
    if (!onBlock) return;
    const reason = blockReason === 'Other' ? blockOther : blockReason;
    if (!reason.trim()) return;
    await onBlock(reason.trim());
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-[80] backdrop-blur-[1px]" aria-hidden onClick={onClose} />
      <div
        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[90] w-[min(100vw-1.5rem,468px)] max-h-[min(90vh,720px)] overflow-hidden flex flex-col rounded-2xl bg-white shadow-2xl border border-neutral-200/80"
        role="dialog"
        aria-modal="true"
        aria-labelledby="avail-date-modal-title"
      >
        <div className="w-10 h-1 rounded-full bg-neutral-300 self-center mt-2 shrink-0 md:hidden" />
        <div className="flex items-start justify-between gap-2 px-5 pt-4 pb-2 border-b border-neutral-100">
          <h2 id="avail-date-modal-title" className="text-base font-bold text-neutral-900 leading-snug pr-2">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 w-9 h-9 rounded-xl bg-neutral-100 flex items-center justify-center text-neutral-500 hover:bg-neutral-200"
            aria-label="Close"
          >
            <FaXmark className="text-sm" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {selectedSlot ? (
            <div>
              <span
                className={`inline-flex px-3 py-1.5 rounded-full text-xs font-semibold ${STATUS_BADGE_STYLE[effectiveStatus] ?? STATUS_BADGE_STYLE.available}`}
              >
                {STATUS_LABELS[effectiveStatus]}
              </span>
            </div>
          ) : (
            <p className="text-sm text-neutral-600">Available (no booking/block set for this date)</p>
          )}

          {booking && (
            <div className="rounded-xl border border-neutral-200 bg-neutral-50/80 p-4 space-y-3">
              <p className="text-xs font-bold text-neutral-800 uppercase tracking-wide">Booking details</p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between gap-3">
                  <span className="text-neutral-500 shrink-0">Project</span>
                  <span className="font-semibold text-neutral-900 text-right">{booking.projectTitle}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-neutral-500 shrink-0">{isCompany ? 'Crew/Vendor' : 'Company'}</span>
                  <span className="font-semibold text-neutral-900 text-right">
                    {isCompany ? booking.targetDisplayName : booking.companyName}
                  </span>
                </div>
                {booking.roleName ? (
                  <div className="flex justify-between gap-3">
                    <span className="text-neutral-500 shrink-0">Role</span>
                    <span className="font-semibold text-neutral-900 text-right">{booking.roleName}</span>
                  </div>
                ) : null}
                {booking.rateOffered != null ? (
                  <div className="flex justify-between gap-3">
                    <span className="text-neutral-500 shrink-0">Rate</span>
                    <span className="font-semibold text-neutral-900 text-right">{formatPaise(booking.rateOffered)}</span>
                  </div>
                ) : null}
                {booking.shootDates?.length > 0 ? (
                  <div className="flex justify-between gap-3">
                    <span className="text-neutral-500 shrink-0">Dates</span>
                    <span className="font-semibold text-neutral-900 text-right">{formatDateRange(booking.shootDates)}</span>
                  </div>
                ) : null}
                {booking.shootLocations?.length ? (
                  <div className="flex justify-between gap-3">
                    <span className="text-neutral-500 shrink-0">Locations</span>
                    <span className="font-semibold text-neutral-900 text-right">{booking.shootLocations.join(', ')}</span>
                  </div>
                ) : null}
                {booking.message ? (
                  <div>
                    <p className="text-neutral-500 text-xs mb-0.5">Message</p>
                    <p className="text-sm text-neutral-800 whitespace-pre-wrap">{booking.message}</p>
                  </div>
                ) : null}
              </div>

              <div className="flex flex-wrap gap-2 pt-2">
                {chatUserId && (
                  <Link
                    to={`/dashboard/chat/${chatUserId}`}
                    onClick={onClose}
                    className="inline-flex flex-1 min-w-[120px] items-center justify-center gap-2 rounded-xl py-2.5 px-3 bg-[#EEF4FF] text-[#3B5BDB] text-sm font-semibold hover:bg-[#DBEAFE] border border-[#3B5BDB]/20"
                  >
                    <FaMessage className="text-sm" /> Chat
                  </Link>
                )}
                {booking.invoiceId ? (
                  <Link
                    to={`/dashboard/invoice/${booking.invoiceId}`}
                    onClick={onClose}
                    className="inline-flex flex-1 min-w-[120px] items-center justify-center gap-2 rounded-xl py-2.5 px-3 bg-emerald-50 text-emerald-800 text-sm font-semibold hover:bg-emerald-100 border border-emerald-200/60"
                  >
                    <FaFileInvoice className="text-sm" /> View invoice
                  </Link>
                ) : (
                  <Link
                    to="/dashboard/invoice/new"
                    onClick={onClose}
                    className={`inline-flex flex-1 min-w-[120px] items-center justify-center gap-2 rounded-xl py-2.5 px-3 text-sm font-semibold border ${
                      isCompany
                        ? 'bg-neutral-100 text-neutral-400 border-neutral-200 pointer-events-none cursor-not-allowed'
                        : 'bg-emerald-50 text-emerald-800 border-emerald-200/60 hover:bg-emerald-100'
                    }`}
                    aria-disabled={isCompany}
                    tabIndex={isCompany ? -1 : undefined}
                  >
                    <FaPlus className="text-sm" /> Create invoice
                  </Link>
                )}
              </div>

              {!isCompany &&
                onRequestCancelBooking &&
                (booking.status === 'accepted' || booking.status === 'locked') && (
                  <button
                    type="button"
                    onClick={() => {
                      onRequestCancelBooking(booking);
                      onClose();
                    }}
                    className="w-full rounded-xl py-2.5 border border-amber-300 bg-amber-50 text-amber-900 text-sm font-semibold hover:bg-amber-100"
                  >
                    Request cancellation
                  </button>
                )}
            </div>
          )}

          {selectedSlot?.notes && !booking ? (
            <div>
              <p className="text-xs font-semibold text-neutral-500 mb-1">Notes</p>
              <p className="text-sm text-neutral-800 whitespace-pre-wrap border border-neutral-200 rounded-xl p-3 bg-neutral-50">
                {selectedSlot.notes}
              </p>
            </div>
          ) : null}

          {effectiveStatus === 'booked' && !booking ? (
            <p className="text-xs text-neutral-500">This date is booked via booking workflow. Details may still be loading.</p>
          ) : null}

          {effectiveStatus === 'past_work' && !booking ? (
            <p className="text-xs text-neutral-500">This is a completed work date (system-managed).</p>
          ) : null}

          {isCompany && !booking ? (
            <p className="text-xs text-neutral-500">
              You can view this crew or vendor member&apos;s calendar. Blocking is available only on their account.
            </p>
          ) : null}

          {canMutate && effectiveStatus === 'blocked' && !booking && (
            <button
              type="button"
              onClick={() => onUnblock?.()}
              disabled={blocking}
              className="w-full rounded-xl py-3 bg-[#3B5BDB] text-white text-sm font-semibold hover:bg-[#2f4ac2] disabled:opacity-60"
            >
              {blocking ? 'Saving…' : 'Mark as available'}
            </button>
          )}

          {canMutate && !selectedSlot && !booking && (
            <>
              <p className="text-sm font-semibold text-neutral-900">Block this date</p>
              <div className="space-y-2">
                {reasonList.map((reason) => (
                  <button
                    key={reason}
                    type="button"
                    disabled={blocking}
                    onClick={() => onBlock?.(reason)}
                    className="w-full flex items-center gap-2 rounded-xl border border-red-200 bg-red-50/50 px-3 py-2.5 text-left text-sm text-red-900 hover:bg-red-50 disabled:opacity-60"
                  >
                    {reason}
                  </button>
                ))}
              </div>
            </>
          )}

          {canMutate && effectiveStatus === 'available' && selectedSlot && !blockMode && !booking && (
            <>
              <p className="text-sm text-neutral-600">Open for booking requests.</p>
              <button
                type="button"
                onClick={() => setBlockMode(true)}
                disabled={blocking}
                className="w-full rounded-xl py-3 bg-neutral-100 text-neutral-800 text-sm font-semibold hover:bg-neutral-200 disabled:opacity-60"
              >
                Block this date
              </button>
            </>
          )}

          {canMutate && effectiveStatus === 'available' && selectedSlot && blockMode && !booking && (
            <div className="space-y-3">
              <p className="text-sm font-bold text-neutral-900">Why are you blocking?</p>
              <div className="space-y-2">
                {reasonList.map((r) => (
                  <label
                    key={r}
                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer ${
                      blockReason === r ? 'border-[#3B5BDB] bg-[#EEF4FF]' : 'border-neutral-200 hover:bg-neutral-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="blockReason"
                      checked={blockReason === r}
                      onChange={() => setBlockReason(r)}
                      className="accent-[#3B5BDB]"
                    />
                    <span className="text-sm font-medium text-neutral-800">{r}</span>
                  </label>
                ))}
              </div>
              {blockReason === 'Other' && (
                <input
                  type="text"
                  value={blockOther}
                  onChange={(e) => setBlockOther(e.target.value)}
                  placeholder="Describe your reason…"
                  className="w-full rounded-xl px-4 py-3 border border-neutral-300 text-sm"
                />
              )}
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={blocking}
                  onClick={handleConfirmBlock}
                  className="flex-1 rounded-xl py-2.5 bg-[#3B5BDB] text-white text-sm font-semibold disabled:opacity-50"
                >
                  {blocking ? 'Saving…' : 'Confirm block'}
                </button>
                <button
                  type="button"
                  disabled={blocking}
                  onClick={() => setBlockMode(false)}
                  className="flex-1 rounded-xl py-2.5 bg-neutral-100 text-neutral-700 text-sm font-semibold"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="px-5 py-3 border-t border-neutral-100 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl py-2.5 text-sm font-semibold text-neutral-600 hover:bg-neutral-50 border border-neutral-200"
          >
            Close
          </button>
        </div>
      </div>
    </>
  );
}
