import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FaCircleCheck, FaXmark,
  FaMessage, FaTriangleExclamation, FaClock, FaStar,
} from 'react-icons/fa6';
import DashboardHeader from '../components/DashboardHeader';
import DashboardSidebar from '../components/DashboardSidebar';
import AppFooter from '../components/AppFooter';
import Avatar from '../components/Avatar';
import ReviewForm from '../components/ReviewForm';
import { api, ApiException } from '../services/api';
import toast from 'react-hot-toast';
import { useApiQuery } from '../hooks/useApiQuery';
import { useRole } from '../contexts/RoleContext';
import { formatPaise } from '../utils/currency';
import { individualNavLinks, vendorNavLinks } from '../navigation/dashboardNav';

type BookingStatus = 'pending' | 'accepted' | 'declined' | 'completed' | 'cancelled' | 'locked' | 'expired' | 'cancel_requested';

interface Booking {
  id: string;
  status: BookingStatus;
  projectId: string;
  rateOffered: number | null;
  message: string | null;
  createdAt: string;
  project: { id: string; title: string; startDate: string; endDate: string; status?: string };
  requester: { id: string; email: string; companyProfile?: { companyName?: string } | null };
  vendorEquipment?: { id: string; name: string } | null;
  equipmentAlreadyBookedFor?: { projectTitle: string; startDate: string; endDate: string } | null;
}

interface BookingsResponse {
  items: Booking[];
}

const STATUS_CONFIG: Record<BookingStatus, { bg: string; text: string; label: string }> = {
  pending:          { bg: 'bg-[#FEF9E6]',  text: 'text-[#92400E]',  label: 'Pending' },
  accepted:         { bg: 'bg-[#DCFCE7]',  text: 'text-[#15803D]',  label: 'Accepted' },
  declined:         { bg: 'bg-[#FEE2E2]',  text: 'text-[#B91C1C]',  label: 'Declined' },
  completed:        { bg: 'bg-[#DBEAFE]',  text: 'text-[#1D4ED8]',  label: 'Completed' },
  cancelled:        { bg: 'bg-[#F3F4F6]',  text: 'text-neutral-500', label: 'Cancelled' },
  locked:           { bg: 'bg-[#DBEAFE]',  text: 'text-[#1D4ED8]',  label: 'Locked' },
  expired:          { bg: 'bg-[#F3F4F6]',  text: 'text-neutral-400', label: 'Expired' },
  cancel_requested: { bg: 'bg-[#FEF3C7]',  text: 'text-[#92400E]',  label: 'Cancel Requested' },
};

type TabFilter = 'all' | 'pending' | 'accepted' | 'completed';

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function Bookings() {
  const { currentRole } = useRole();

  const navLinks =
    currentRole === 'Vendor'
      ? vendorNavLinks
      : individualNavLinks;

  useEffect(() => { document.title = 'Booking Requests – Claapo'; }, []);

  const [tab, setTab]       = useState<TabFilter>('all');
  const [actioning, setActioning] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [reviewBookingId, setReviewBookingId] = useState<string | null>(null);
  const { data, loading, error, refetch } = useApiQuery<BookingsResponse>('/bookings/incoming');

  // Exclude cancelled projects (backend also filters; this guards against stale data)
  const allBookings = (data?.items ?? []).filter((b) => b.project?.status !== 'cancelled');
  const bookings = tab === 'all' ? allBookings : allBookings.filter(b => b.status === tab);

  const doAction = async (bookingId: string, action: 'accept' | 'decline') => {
    setActioning(bookingId + action);
    setActionError(null);
    try {
      await api.patch(`/bookings/${bookingId}/${action}`, {});
      toast.success(action === 'accept' ? 'Booking accepted.' : 'Booking declined.');
      refetch();
    } catch (err) {
      const msg = err instanceof ApiException ? err.payload.message : `Failed to ${action} booking.`;
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
                <h1 className="text-xl font-bold text-neutral-900">Booking Requests</h1>
                <p className="text-sm text-neutral-500 mt-0.5">Manage incoming booking requests from production companies</p>
              </div>

              {/* Tab filter */}
              <div className="flex items-center gap-1 mb-5 bg-white rounded-xl p-1 border border-neutral-200 w-fit">
                {(['all', 'pending', 'accepted', 'completed'] as TabFilter[]).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTab(t)}
                    className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors capitalize ${
                      tab === t ? 'bg-[#3B5BDB] text-white shadow-sm' : 'text-neutral-600 hover:bg-[#F3F4F6]'
                    }`}
                  >
                    {t}
                  </button>
                ))}
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
              {!loading && !error && bookings.length === 0 && (
                <div className="rounded-2xl bg-white border border-neutral-200 p-12 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-[#EEF4FF] flex items-center justify-center mx-auto mb-4">
                    <FaClock className="text-[#3B5BDB] text-2xl" />
                  </div>
                  <h3 className="text-base font-bold text-neutral-900 mb-2">No booking requests</h3>
                  <p className="text-sm text-neutral-500">
                    {tab === 'pending' ? 'No pending requests right now.' : 'Booking requests will appear here.'}
                  </p>
                </div>
              )}

              {/* Booking cards */}
              {!loading && bookings.length > 0 && (
                <div className="space-y-3">
                  {bookings.map((booking) => {
                    const cfg = STATUS_CONFIG[booking.status as BookingStatus] ?? STATUS_CONFIG.pending;
                    const isActioning = actioning?.startsWith(booking.id);
                    const companyName = booking.requester.companyProfile?.companyName ?? booking.requester.email;
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
                            <span className={`text-[11px] px-2.5 py-1 rounded-full font-semibold ${cfg.bg} ${cfg.text}`}>{cfg.label}</span>
                          </div>
                        </div>

                        {booking.vendorEquipment && (
                          <p className="text-xs text-neutral-600 mb-2">
                            <span className="font-semibold text-neutral-700">Equipment requested:</span>{' '}
                            {booking.vendorEquipment.name}
                          </p>
                        )}

                        {booking.equipmentAlreadyBookedFor && (
                          <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 mb-4 flex items-start gap-2">
                            <FaTriangleExclamation className="text-amber-600 shrink-0 mt-0.5" />
                            <div>
                              <p className="text-xs font-semibold text-amber-800">This equipment is already given to another shoot</p>
                              <p className="text-xs text-amber-700 mt-0.5">
                                {booking.equipmentAlreadyBookedFor.projectTitle} ({formatDate(booking.equipmentAlreadyBookedFor.startDate)}
                                {booking.equipmentAlreadyBookedFor.endDate !== booking.equipmentAlreadyBookedFor.startDate && ` – ${formatDate(booking.equipmentAlreadyBookedFor.endDate)}`})
                              </p>
                              <p className="text-[11px] text-amber-600 mt-1">You can decline this request or offer an alternative if you have another unit.</p>
                            </div>
                          </div>
                        )}

                        {booking.message && (
                          <div className="rounded-xl bg-[#F3F4F6] px-4 py-3 mb-4">
                            <p className="text-xs text-neutral-600 leading-relaxed">{booking.message}</p>
                          </div>
                        )}

                        <div className="flex items-center gap-2 flex-wrap">
                          <Link to={`/dashboard/chat/${booking.requester.id}`} className="rounded-xl px-4 py-2 border border-neutral-200 text-neutral-700 text-xs font-semibold hover:bg-neutral-50 flex items-center gap-1.5 transition-colors">
                            <FaMessage className="w-3 h-3" /> Message
                          </Link>

                          {booking.status === 'pending' && (
                            <>
                              <button type="button" onClick={() => doAction(booking.id, 'accept')} disabled={!!isActioning}
                                className="rounded-xl px-4 py-2 bg-[#3B5BDB] text-white text-xs font-semibold hover:bg-[#2f4ac2] flex items-center gap-1.5 transition-colors disabled:opacity-50">
                                <FaCircleCheck className="w-3 h-3" />
                                {actioning === booking.id + 'accept' ? 'Accepting…' : 'Accept'}
                              </button>
                              <button type="button" onClick={() => doAction(booking.id, 'decline')} disabled={!!isActioning}
                                className="rounded-xl px-4 py-2 bg-[#FEE2E2] text-[#B91C1C] text-xs font-semibold hover:bg-[#FECACA] flex items-center gap-1.5 transition-colors disabled:opacity-50">
                                <FaXmark className="w-3 h-3" />
                                {actioning === booking.id + 'decline' ? 'Declining…' : 'Decline'}
                              </button>
                            </>
                          )}

                          {(booking.status === 'accepted' || booking.status === 'locked') && (
                            <button type="button" onClick={() => setReviewBookingId(reviewBookingId === booking.id ? null : booking.id)}
                              className="rounded-xl px-4 py-2 border border-amber-300 text-amber-700 text-xs font-semibold hover:bg-amber-50 flex items-center gap-1.5 transition-colors">
                              <FaStar className="w-3 h-3" /> Leave Review
                            </button>
                          )}
                        </div>

                        {/* Review form */}
                        {reviewBookingId === booking.id && (
                          <div className="mt-3">
                            <ReviewForm bookingId={booking.id} onSubmitted={() => { setReviewBookingId(null); toast.success('Review submitted!'); }} />
                          </div>
                        )}
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

    </div>
  );
}
