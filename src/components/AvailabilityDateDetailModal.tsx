import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FaXmark, FaMessage, FaFileInvoice, FaUserPlus } from 'react-icons/fa6';
import type { BookingWithDetails, SlotStatus } from '../types/availability';
import { formatPaise } from '../utils/currency';
import { SLOT_STATUS_LABEL, SLOT_STATUS_BADGE } from '../utils/slotStatusStyles';

const DEFAULT_BLOCK_REASONS = ['Personal', 'Already booked externally', 'Not available', 'Traveling', 'Other'];

const STATUS_LABELS = SLOT_STATUS_LABEL;
const STATUS_BADGE_STYLE = SLOT_STATUS_BADGE;

function formatSingleDate(dateKey: string): string {
  return new Date(dateKey + 'T00:00:00').toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function resolveLocationForDate(
  dateKey: string,
  shootDateLocations: Array<{ date: string; location: string }> | null | undefined,
  shootDates: string[] | undefined,
  shootLocations: string[] | undefined,
): string | null {
  const pair = shootDateLocations?.find((p) => p.date === dateKey);
  if (pair?.location) return pair.location;
  if (shootDates && shootLocations) {
    const idx = shootDates.indexOf(dateKey);
    if (idx >= 0 && shootLocations[idx]) return shootLocations[idx];
  }
  return shootLocations?.[0] ?? null;
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
  /** Sliding right pane (e.g. individual dashboard); default is centered modal. */
  variant?: 'modal' | 'drawer';
  /** Shoot dates from all bookings for this month to check if date is a shoot date */
  allShootDates?: string[];
  /** For company view: target user ID for booking/chat actions */
  targetUserId?: string;
  /** For companyview: target user display name */
  targetUserName?: string;
  /** Callback when Chat button is clicked (for inquiry flow) */
  onChatClick?: (dateKey: string) => void;
  /** Callback when Book Crew button is clicked */
  onBookCrewClick?: (dateKey: string) => void;
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
  variant = 'modal',
  allShootDates = [],
  targetUserId,
  targetUserName: _targetUserName,
  onChatClick,
  onBookCrewClick,
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

  useEffect(() => {
    if (slot?.status === 'blocked') setBlockMode(false);
  }, [slot?.status]);

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

  const isDrawer = variant === 'drawer';

  const shellClass = isDrawer
    ? 'pointer-events-auto flex flex-col h-full min-h-0 w-full bg-white/95 backdrop-blur-xl border-l border-neutral-200/60 shadow-2xl rounded-l-3xl panel-enter'
    : 'pointer-events-auto w-[min(100vw-1.5rem,468px)] max-h-[min(90vh,720px)] overflow-hidden flex flex-col rounded-2xl bg-white shadow-2xl border border-neutral-200/80';

  const panel = (
    <div
      className={shellClass}
      role="dialog"
      aria-modal="true"
      aria-labelledby="avail-date-modal-title"
    >
        {!isDrawer && <div className="w-10 h-1 rounded-full bg-neutral-300 self-center mt-2 shrink-0 md:hidden" />}
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
            <p className="text-sm text-neutral-600">Available (no booking set for this date)</p>
          )}

          {booking && (() => {
            const dateLocation = resolveLocationForDate(
              selectedDate,
              booking.shootDateLocations,
              booking.shootDates,
              booking.shootLocations,
            );
            return (
            <div className="rounded-xl border border-neutral-200 bg-neutral-50/80 p-4 space-y-3">
              <p className="text-xs font-bold text-neutral-800 uppercase tracking-wide">Booking details</p>
              <div className="space-y-2 text-sm">
                {isCompany && booking.companyName ? (
                  <div className="flex justify-between gap-3">
                    <span className="text-neutral-500 shrink-0">Company</span>
                    <span className="font-semibold text-neutral-900 text-right">{booking.companyName}</span>
                  </div>
                ) : null}
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
                <div className="flex justify-between gap-3">
                  <span className="text-neutral-500 shrink-0">Date</span>
                  <span className="font-semibold text-neutral-900 text-right">{formatSingleDate(selectedDate)}</span>
                </div>
                {dateLocation ? (
                  <div className="flex justify-between gap-3">
                    <span className="text-neutral-500 shrink-0">Location</span>
                    <span className="font-semibold text-neutral-900 text-right">{dateLocation}</span>
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
                    to={`/chat/${chatUserId}?projectId=${encodeURIComponent(booking.projectId)}`}
                    onClick={onClose}
                    className="inline-flex flex-1 min-w-[120px] items-center justify-center gap-2 rounded-xl py-2.5 px-3 bg-[#E8F0FE] text-[#3678F1] text-sm font-semibold hover:bg-[#DBEAFE] border border-[#3678F1]/20"
                  >
                    <FaMessage className="text-sm" /> Chat
                  </Link>
                )}
                {/* Show Invoice button for completed bookings */}
                {booking.status === 'completed' && (
                  <Link
                    to={`/invoices?bookingId=${encodeURIComponent(booking.id)}`}
                    onClick={onClose}
                    className="inline-flex flex-1 min-w-[120px] items-center justify-center gap-2 rounded-xl py-2.5 px-3 bg-[#E8F0FE] text-[#3678F1] text-sm font-semibold hover:bg-[#DBEAFE] border border-[#3678F1]/20"
                  >
                    <FaFileInvoice className="text-sm" /> Invoice
                  </Link>
                )}
              </div>
            </div>
            );
          })()}

          {/* Show Chat and Book Crew buttons for company viewing a date without confirmed booking */}
          {isCompany && !booking && selectedDate && targetUserId && (
            <div className="space-y-3">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onChatClick?.(selectedDate);
                    onClose();
                  }}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl py-2.5 px-3 bg-gradient-to-br from-[#3678F1] to-[#2563EB] text-white text-sm font-semibold hover:from-[#2563EB] hover:to-[#1D4ED8] shadow-brand transition-colors"
                >
                  <FaMessage className="text-sm" /> Chat
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onBookCrewClick?.(selectedDate);
                    onClose();
                  }}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl py-2.5 px-3 bg-gradient-to-br from-[#3678F1] to-[#2563EB] text-white text-sm font-semibold hover:from-[#2563EB] hover:to-[#1D4ED8] shadow-brand transition-colors"
                >
                  <FaUserPlus className="text-sm" /> Book Crew
                </button>
              </div>
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
              You can view this crew or vendor member&apos;s calendar. Marking dates as Unavailable is available only on their account.
            </p>
          ) : null}

          {canMutate && effectiveStatus === 'blocked' && !booking && (
            <button
              type="button"
              onClick={() => onUnblock?.()}
              disabled={blocking}
              className="w-full rounded-xl py-3 bg-gradient-to-br from-[#3678F1] to-[#2563EB] text-white text-sm font-semibold hover:from-[#2563EB] hover:to-[#1D4ED8] shadow-brand disabled:opacity-60 transition-colors"
            >
              {blocking ? 'Saving…' : 'Mark as Available'}
            </button>
          )}

          {canMutate && effectiveStatus === 'available' && !blockMode && !booking && (
            <>
              <p className="text-sm text-neutral-600">Open for booking requests.</p>
              <button
                type="button"
                onClick={() => setBlockMode(true)}
                disabled={blocking}
                className="w-full rounded-xl py-3 bg-neutral-100 text-neutral-800 text-sm font-semibold hover:bg-neutral-200 disabled:opacity-60"
              >
                Mark as Unavailable
              </button>
            </>
          )}

          {canMutate && effectiveStatus === 'available' && blockMode && !booking && (
            <div className="space-y-3">
              <p className="text-sm font-bold text-neutral-900">Why are you marking this as Unavailable?</p>
              <div className="space-y-2">
                {reasonList.map((r) => (
                  <label
                    key={r}
                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer ${
                      blockReason === r ? 'border-[#3678F1] bg-[#E8F0FE]' : 'border-neutral-200 hover:bg-neutral-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="blockReason"
                      checked={blockReason === r}
                      onChange={() => setBlockReason(r)}
                      className="accent-[#3678F1]"
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
                  className="flex-1 rounded-xl py-2.5 bg-gradient-to-br from-[#3678F1] to-[#2563EB] text-white text-sm font-semibold hover:from-[#2563EB] hover:to-[#1D4ED8] shadow-brand disabled:opacity-50 transition-colors"
                >
                  {blocking ? 'Saving…' : 'Confirm'}
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

        <div className="px-5 py-3 border-t border-neutral-100 shrink-0 space-y-2">
          {allShootDates.includes(selectedDate ?? '') ? (
            <Link
              to={`/invoices?issuedOn=${encodeURIComponent(selectedDate ?? '')}`}
              onClick={onClose}
              className="w-full flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold bg-[#E8F0FE] text-[#3678F1] border border-[#3678F1]/20 hover:bg-[#DBEAFE]"
            >
              <FaFileInvoice className="text-sm" /> Invoices
            </Link>
          ) : null}
          
          {/* Direct cancellation button for booked/hired dates */}
          {!isCompany && booking && (booking.status === 'accepted' || booking.status === 'locked') && (
            <button
              type="button"
              onClick={() => {
                onRequestCancelBooking?.(booking);
                onClose();
              }}
              className="w-full rounded-xl py-2.5 border border-[#F40F02]/30 bg-[#FEEBEA] text-[#991B1B] text-sm font-semibold hover:bg-[#FDD8D5] transition-colors"
            >
              Request cancellation
            </button>
          )}
          
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl py-2.5 text-sm font-semibold text-neutral-600 hover:bg-neutral-50 border border-neutral-200"
          >
            Close
          </button>
        </div>
    </div>
  );

  if (isDrawer) {
    return (
      <>
        <div className="fixed inset-0 bg-black/25 backdrop-blur-[2px] z-40 lg:bg-black/10 lg:backdrop-blur-[1px]" aria-hidden onClick={onClose} />
        <aside className="fixed right-0 top-0 h-full z-50 w-full max-w-[380px] sm:max-w-[400px] flex flex-col min-h-0 shadow-2xl rounded-l-3xl overflow-hidden">
          {panel}
        </aside>
      </>
    );
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-[80] backdrop-blur-[1px]" aria-hidden onClick={onClose} />
      <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 pointer-events-none">
        {panel}
      </div>
    </>
  );
}
