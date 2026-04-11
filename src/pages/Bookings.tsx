import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FaCircleCheck, FaXmark,
  FaMessage, FaTriangleExclamation, FaClock, FaStar,
  FaCalendarDay, FaBriefcase, FaLocationDot, FaIndianRupeeSign,
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
  shootDates?: string[] | null;
  project: { id: string; title: string; startDate: string; endDate: string; status?: string; locationCity?: string | null };
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

function formatShootDate(iso: string): string {
  return new Date(iso.length === 10 ? iso + 'T12:00:00' : iso).toLocaleDateString('en-IN', {
    weekday: 'short', day: 'numeric', month: 'short',
  });
}

function formatTimeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

export default function Bookings() {
  const { currentRole } = useRole();

  const navLinks =
    currentRole === 'Vendor'
      ? vendorNavLinks
      : individualNavLinks;

  useEffect(() => { document.title = 'Project Requests – Claapo'; }, []);

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
    <div className="h-screen flex flex-col overflow-hidden bg-[#F8F9FB] w-full">
      <DashboardHeader />
      <div className="flex-1 flex min-h-0 overflow-hidden">
        <DashboardSidebar links={navLinks} />

        <main className="flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden">
          <div className="flex-1 min-h-0 overflow-auto">
            <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-6 xl:px-8 py-6">

              <div className="mb-6">
                <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">Project Requests</h1>
                <p className="text-sm text-neutral-500 mt-1">Review incoming project requests from production companies</p>
              </div>

              {/* Tab filter */}
              <div className="flex items-center gap-1 mb-5 bg-white rounded-xl p-1 border border-neutral-200 w-fit shadow-sm">
                {(['all', 'pending', 'accepted', 'completed'] as TabFilter[]).map((t) => {
                  const count = t === 'all' ? allBookings.length : allBookings.filter((b) => b.status === t).length;
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTab(t)}
                      className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors capitalize flex items-center gap-2 ${
                        tab === t ? 'bg-brand-primary text-white shadow-sm' : 'text-neutral-600 hover:bg-neutral-50'
                      }`}
                    >
                      {t}
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold ${tab === t ? 'bg-white/20 text-white' : 'bg-neutral-100 text-neutral-500'}`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
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
                <div className="rounded-2xl bg-white border border-neutral-200 p-12 text-center shadow-sm">
                  <div className="w-16 h-16 rounded-2xl bg-brand-primary/10 flex items-center justify-center mx-auto mb-4">
                    <FaClock className="text-brand-primary text-2xl" />
                  </div>
                  <h3 className="text-base font-bold text-neutral-900 mb-2">No booking requests</h3>
                  <p className="text-sm text-neutral-500 max-w-sm mx-auto">
                    {tab === 'pending'
                      ? 'No pending requests right now. New requests will show up here when companies want to hire you.'
                      : 'Booking requests will appear here.'}
                  </p>
                </div>
              )}

              {/* Booking cards */}
              {!loading && bookings.length > 0 && (
                <div className="space-y-4">
                  {bookings.map((booking) => {
                    const cfg = STATUS_CONFIG[booking.status as BookingStatus] ?? STATUS_CONFIG.pending;
                    const isActioning = actioning?.startsWith(booking.id);
                    const companyName = booking.requester.companyProfile?.companyName ?? booking.requester.email;
                    const shootDates = (booking.shootDates ?? []).map((d) =>
                      typeof d === 'string' ? d.slice(0, 10) : new Date(d as unknown as string).toISOString().slice(0, 10),
                    );

                    return (
                      <div
                        key={booking.id}
                        className="rounded-2xl bg-white border border-neutral-200 shadow-sm hover:shadow-md hover:border-neutral-300 transition-all overflow-hidden"
                      >
                        {/* Header strip */}
                        <div className="px-5 py-4 border-b border-neutral-100 flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3 flex-1 min-w-0">
                            <Avatar name={companyName} size="md" />
                            <div className="min-w-0">
                              <h3 className="text-sm font-bold text-neutral-900 truncate">{companyName}</h3>
                              <p className="text-xs text-neutral-500 mt-0.5">Requested {formatTimeAgo(booking.createdAt)}</p>
                            </div>
                          </div>
                          <span className={`text-[11px] px-2.5 py-1 rounded-full font-semibold whitespace-nowrap ${cfg.bg} ${cfg.text}`}>
                            {cfg.label}
                          </span>
                        </div>

                        {/* Body */}
                        <div className="p-5 space-y-4">

                          {/* Quick facts grid */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="flex items-start gap-2.5">
                              <div className="w-8 h-8 rounded-lg bg-brand-primary/10 flex items-center justify-center shrink-0">
                                <FaBriefcase className="w-3.5 h-3.5 text-brand-primary" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-[10px] uppercase tracking-wider font-semibold text-neutral-400">Project</p>
                                <p className="text-sm font-semibold text-neutral-900 truncate">{booking.project.title}</p>
                                <p className="text-[11px] text-neutral-500 mt-0.5">
                                  {formatDate(booking.project.startDate)}
                                  {booking.project.endDate !== booking.project.startDate && ` – ${formatDate(booking.project.endDate)}`}
                                </p>
                              </div>
                            </div>

                            {booking.project.locationCity && (
                              <div className="flex items-start gap-2.5">
                                <div className="w-8 h-8 rounded-lg bg-brand-primary/10 flex items-center justify-center shrink-0">
                                  <FaLocationDot className="w-3.5 h-3.5 text-brand-primary" />
                                </div>
                                <div className="min-w-0">
                                  <p className="text-[10px] uppercase tracking-wider font-semibold text-neutral-400">Location</p>
                                  <p className="text-sm font-semibold text-neutral-900 truncate">{booking.project.locationCity}</p>
                                </div>
                              </div>
                            )}

                            {booking.rateOffered != null && (
                              <div className="flex items-start gap-2.5">
                                <div className="w-8 h-8 rounded-lg bg-brand-primary/10 flex items-center justify-center shrink-0">
                                  <FaIndianRupeeSign className="w-3.5 h-3.5 text-brand-primary" />
                                </div>
                                <div className="min-w-0">
                                  <p className="text-[10px] uppercase tracking-wider font-semibold text-neutral-400">Rate Offered</p>
                                  <p className="text-sm font-bold text-neutral-900">{formatPaise(booking.rateOffered)}<span className="text-[11px] font-medium text-neutral-500">/day</span></p>
                                </div>
                              </div>
                            )}

                            {booking.vendorEquipment && (
                              <div className="flex items-start gap-2.5">
                                <div className="w-8 h-8 rounded-lg bg-brand-primary/10 flex items-center justify-center shrink-0">
                                  <FaBriefcase className="w-3.5 h-3.5 text-brand-primary" />
                                </div>
                                <div className="min-w-0">
                                  <p className="text-[10px] uppercase tracking-wider font-semibold text-neutral-400">Equipment</p>
                                  <p className="text-sm font-semibold text-neutral-900 truncate">{booking.vendorEquipment.name}</p>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Shoot dates — the part that was missing */}
                          {shootDates.length > 0 && (
                            <div className="rounded-xl bg-brand-primary/5 border border-brand-primary/15 p-3.5">
                              <div className="flex items-center gap-2 mb-2">
                                <FaCalendarDay className="w-3.5 h-3.5 text-brand-primary" />
                                <p className="text-[10px] uppercase tracking-wider font-bold text-brand-primary">
                                  Hire dates · {shootDates.length} {shootDates.length === 1 ? 'day' : 'days'}
                                </p>
                              </div>
                              <ul className="flex flex-wrap gap-1.5">
                                {shootDates.map((d) => (
                                  <li
                                    key={d}
                                    className="inline-flex items-center text-[11px] font-semibold bg-white text-brand-primary px-2.5 py-1 rounded-lg border border-brand-primary/30 shadow-sm"
                                  >
                                    {formatShootDate(d)}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Message */}
                          {booking.message && (
                            <div className="rounded-xl bg-neutral-50 border border-neutral-200 px-4 py-3">
                              <p className="text-[10px] uppercase tracking-wider font-semibold text-neutral-400 mb-1">Message</p>
                              <p className="text-xs text-neutral-700 leading-relaxed whitespace-pre-wrap">{booking.message}</p>
                            </div>
                          )}

                          {/* Equipment conflict warning */}
                          {booking.equipmentAlreadyBookedFor && (
                            <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 flex items-start gap-2.5">
                              <FaTriangleExclamation className="text-amber-600 shrink-0 mt-0.5" />
                              <div className="min-w-0">
                                <p className="text-xs font-semibold text-amber-800">This equipment is already committed to another shoot</p>
                                <p className="text-xs text-amber-700 mt-0.5">
                                  {booking.equipmentAlreadyBookedFor.projectTitle} ({formatDate(booking.equipmentAlreadyBookedFor.startDate)}
                                  {booking.equipmentAlreadyBookedFor.endDate !== booking.equipmentAlreadyBookedFor.startDate && ` – ${formatDate(booking.equipmentAlreadyBookedFor.endDate)}`})
                                </p>
                                <p className="text-[11px] text-amber-600 mt-1">Decline this request or offer an alternative if you have another unit.</p>
                              </div>
                            </div>
                          )}

                          {/* Actions */}
                          <div className="flex items-center gap-2 flex-wrap pt-1">
                            <Link
                              to={`/dashboard/chat/${booking.requester.id}?projectId=${encodeURIComponent(booking.projectId)}`}
                              className="rounded-xl px-4 py-2 border border-neutral-300 text-neutral-700 text-xs font-semibold hover:bg-neutral-50 flex items-center gap-1.5 transition-colors"
                            >
                              <FaMessage className="w-3 h-3" /> Message
                            </Link>

                            {booking.status === 'pending' && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => doAction(booking.id, 'accept')}
                                  disabled={!!isActioning}
                                  className="rounded-xl px-4 py-2 bg-brand-primary text-white text-xs font-semibold hover:bg-brand-primary/90 flex items-center gap-1.5 transition-colors disabled:opacity-50 shadow-sm"
                                >
                                  <FaCircleCheck className="w-3 h-3" />
                                  {actioning === booking.id + 'accept' ? 'Accepting…' : 'Accept'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => doAction(booking.id, 'decline')}
                                  disabled={!!isActioning}
                                  className="rounded-xl px-4 py-2 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold hover:bg-red-100 flex items-center gap-1.5 transition-colors disabled:opacity-50"
                                >
                                  <FaXmark className="w-3 h-3" />
                                  {actioning === booking.id + 'decline' ? 'Declining…' : 'Decline'}
                                </button>
                              </>
                            )}

                            {(booking.status === 'accepted' || booking.status === 'locked') && (
                              <button
                                type="button"
                                onClick={() => setReviewBookingId(reviewBookingId === booking.id ? null : booking.id)}
                                className="rounded-xl px-4 py-2 border border-amber-300 text-amber-700 text-xs font-semibold hover:bg-amber-50 flex items-center gap-1.5 transition-colors"
                              >
                                <FaStar className="w-3 h-3" /> Leave Review
                              </button>
                            )}
                          </div>

                          {/* Review form */}
                          {reviewBookingId === booking.id && (
                            <div className="pt-1">
                              <ReviewForm bookingId={booking.id} onSubmitted={() => { setReviewBookingId(null); toast.success('Review submitted!'); }} />
                            </div>
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

    </div>
  );
}
