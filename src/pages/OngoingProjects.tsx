import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FaClipboardList, FaCircleCheck, FaTriangleExclamation, FaClock,
  FaMessage, FaBan, FaLock,
} from 'react-icons/fa6';
import DashboardHeader from '../components/DashboardHeader';
import DashboardSidebar from '../components/DashboardSidebar';
import AppFooter from '../components/AppFooter';
import Avatar from '../components/Avatar';
import { api, ApiException } from '../services/api';
import toast from 'react-hot-toast';
import { useApiQuery } from '../hooks/useApiQuery';
import { useRole } from '../contexts/RoleContext';
import { formatPaise } from '../utils/currency';
import { individualNavLinks, vendorNavLinks } from '../navigation/dashboardNav';

type BookingStatus = 'accepted' | 'locked' | 'cancel_requested';

interface OngoingBooking {
  id: string;
  status: BookingStatus;
  projectId: string;
  rateOffered: number | null;
  message: string | null;
  createdAt: string;
  cancelRequestReason: string | null;
  cancelRequestedAt: string | null;
  project: { id: string; title: string; startDate: string; endDate: string };
  requester: { id: string; email: string; companyProfile?: { companyName?: string } | null };
}

interface BookingsResponse {
  items: OngoingBooking[];
}

const STATUS_CONFIG: Record<BookingStatus, { bg: string; text: string; label: string; icon: typeof FaCircleCheck }> = {
  accepted:         { bg: 'bg-[#DCFCE7]',  text: 'text-[#15803D]',  label: 'Accepted',           icon: FaCircleCheck },
  locked:           { bg: 'bg-[#DBEAFE]',  text: 'text-[#1D4ED8]',  label: 'Locked',             icon: FaLock },
  cancel_requested: { bg: 'bg-[#FEF3C7]',  text: 'text-[#92400E]',  label: 'Cancel Requested',   icon: FaClock },
};

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function OngoingProjects() {
  const { currentRole } = useRole();

  const navLinks = currentRole === 'Vendor' ? vendorNavLinks : individualNavLinks;

  useEffect(() => { document.title = 'Ongoing Projects – Claapo'; }, []);

  const [actioning, setActioning] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  const { data, loading, error, refetch } = useApiQuery<BookingsResponse>('/bookings/incoming');

  // Only show accepted / locked / cancel_requested bookings
  const ongoingBookings = (data?.items ?? []).filter(
    (b) => b.status === 'accepted' || b.status === 'locked' || b.status === 'cancel_requested',
  );

  const doRequestCancel = async (bookingId: string) => {
    setActioning(bookingId + 'req-cancel');
    setActionError(null);
    try {
      await api.patch(`/bookings/${bookingId}/request-cancel`, { reason: cancelReason || undefined });
      toast.success('Cancellation request sent. Awaiting company approval.');
      setCancellingId(null);
      setCancelReason('');
      refetch();
    } catch (err) {
      const msg = err instanceof ApiException ? err.payload.message : 'Failed to request cancellation.';
      toast.error(msg);
      setActionError(msg);
    } finally {
      setActioning(null);
    }
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-[#F3F4F6] w-full">
      <DashboardHeader />
      <div className="flex-1 flex min-h-0 overflow-hidden">
        <DashboardSidebar links={navLinks} />

        <main className="flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden">
          <div className="flex-1 min-h-0 overflow-auto">
            <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-6 xl:px-8 py-5">

              <div className="mb-5">
                <h1 className="text-xl font-bold text-neutral-900">Ongoing Projects</h1>
                <p className="text-sm text-neutral-500 mt-0.5">Your accepted and locked bookings. Request cancellation from here if needed.</p>
              </div>

              {/* Error */}
              {(error || actionError) && (
                <div className="flex items-center gap-3 rounded-2xl bg-red-50 border border-red-200 p-4 mb-4">
                  <FaTriangleExclamation className="text-red-500 shrink-0" />
                  <p className="text-sm text-red-700">{error ?? actionError}</p>
                  {error && <button onClick={refetch} className="ml-auto text-xs text-red-600 font-semibold hover:underline">Retry</button>}
                </div>
              )}

              {/* Loading skeleton */}
              {loading && (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="rounded-2xl bg-white border border-neutral-200 p-5 animate-pulse">
                      <div className="h-4 bg-neutral-200 rounded w-1/3 mb-3" />
                      <div className="h-3 bg-neutral-100 rounded w-1/2" />
                    </div>
                  ))}
                </div>
              )}

              {/* Empty state */}
              {!loading && !error && ongoingBookings.length === 0 && (
                <div className="rounded-2xl bg-white border border-neutral-200 p-12 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-[#EEF4FF] flex items-center justify-center mx-auto mb-4">
                    <FaClipboardList className="text-[#3678F1] text-2xl" />
                  </div>
                  <h3 className="text-base font-bold text-neutral-900 mb-2">No ongoing projects</h3>
                  <p className="text-sm text-neutral-500">Once you accept a booking, it will appear here.</p>
                </div>
              )}

              {/* Booking cards */}
              {!loading && ongoingBookings.length > 0 && (
                <div className="space-y-3">
                  {ongoingBookings.map((booking) => {
                    const cfg = STATUS_CONFIG[booking.status];
                    const isActioning = actioning?.startsWith(booking.id);
                    const companyName = booking.requester.companyProfile?.companyName ?? booking.requester.email;
                    const StatusIcon = cfg.icon;
                    return (
                      <div key={booking.id} className="rounded-2xl bg-white border border-neutral-200 p-5 hover:border-neutral-300 transition-all">
                        <div className="flex items-start justify-between gap-4 mb-3">
                          <div className="flex items-start gap-3 flex-1 min-w-0">
                            <Avatar name={companyName} size="md" />
                            <div className="min-w-0">
                              <h3 className="text-sm font-bold text-neutral-900 truncate">{companyName}</h3>
                              <p className="text-xs text-neutral-500 truncate">{booking.project.title}</p>
                              <p className="text-xs text-neutral-400 mt-0.5">
                                {formatDate(booking.project.startDate)}
                                {booking.project.endDate !== booking.project.startDate && ` – ${formatDate(booking.project.endDate)}`}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {booking.rateOffered && (
                              <span className="text-sm font-bold text-neutral-900">{formatPaise(booking.rateOffered)}</span>
                            )}
                            <span className={`text-[11px] px-2.5 py-1 rounded-full font-semibold flex items-center gap-1 ${cfg.bg} ${cfg.text}`}>
                              <StatusIcon className="w-2.5 h-2.5" /> {cfg.label}
                            </span>
                          </div>
                        </div>

                        {booking.message && (
                          <div className="rounded-xl bg-[#F3F4F6] px-4 py-3 mb-4">
                            <p className="text-xs text-neutral-600 leading-relaxed">{booking.message}</p>
                          </div>
                        )}

                        {/* Cancel request info banner */}
                        {booking.status === 'cancel_requested' && (
                          <div className="rounded-xl bg-[#FEF3C7] border border-[#FCD34D] px-4 py-3 mb-4">
                            <p className="text-xs font-semibold text-[#92400E] mb-0.5">Cancellation request pending company review</p>
                            {booking.cancelRequestReason && (
                              <p className="text-xs text-[#78350F]">Reason: {booking.cancelRequestReason}</p>
                            )}
                            {booking.cancelRequestedAt && (
                              <p className="text-xs text-[#78350F] mt-0.5">Requested on {formatDate(booking.cancelRequestedAt)}</p>
                            )}
                          </div>
                        )}

                        <div className="flex items-center gap-2 flex-wrap">
                          <Link
                            to={`/dashboard/chat/${booking.requester.id}`}
                            className="rounded-xl px-4 py-2 border border-neutral-200 text-neutral-700 text-xs font-semibold hover:bg-neutral-50 flex items-center gap-1.5 transition-colors"
                          >
                            <FaMessage className="w-3 h-3" /> Message
                          </Link>

                          {(booking.status === 'accepted' || booking.status === 'locked') && (
                            <button
                              type="button"
                              onClick={() => { setCancellingId(booking.id); setCancelReason(''); }}
                              disabled={!!isActioning}
                              className="rounded-xl px-4 py-2 bg-[#FEF9E6] text-[#92400E] text-xs font-semibold hover:bg-[#FDE68A] flex items-center gap-1.5 transition-colors disabled:opacity-50 ml-auto"
                            >
                              <FaBan className="w-3 h-3" /> Request Cancellation
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
          <AppFooter />
        </main>
      </div>

      {/* Request Cancellation Modal */}
      {cancellingId && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setCancellingId(null)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
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
                  onClick={() => setCancellingId(null)}
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
