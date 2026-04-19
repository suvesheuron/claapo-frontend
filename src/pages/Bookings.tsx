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
  shootDateLocations?: Array<{ date: string; location: string }> | null;
  project: { id: string; title: string; startDate: string; endDate: string; status?: string; locationCity?: string | null };
  requester: { id: string; email: string; companyProfile?: { companyName?: string } | null };
  vendorEquipment?: { id: string; name: string } | null;
  equipmentAlreadyBookedFor?: { projectTitle: string; startDate: string; endDate: string } | null;
}

interface BookingsResponse {
  items: Booking[];
}

const STATUS_CONFIG: Record<BookingStatus, { bg: string; text: string; label: string }> = {
  pending:          { bg: 'bg-[#E8F0FE]',  text: 'text-[#1E3A8A]',  label: 'Pending' },
  accepted:         { bg: 'bg-[#DCFCE7]',  text: 'text-[#15803D]',  label: 'Accepted' },
  declined:         { bg: 'bg-[#FEE2E2]',  text: 'text-[#991B1B]',  label: 'Declined' },
  completed:        { bg: 'bg-[#DBEAFE]',  text: 'text-[#1E3A8A]',  label: 'Completed' },
  cancelled:        { bg: 'bg-[#FEE2E2]',  text: 'text-[#991B1B]',  label: 'Cancelled' },
  locked:           { bg: 'bg-[#DBEAFE]',  text: 'text-[#1E3A8A]',  label: 'Locked' },
  expired:          { bg: 'bg-[#F3F4F6]',  text: 'text-neutral-500', label: 'Expired' },
  cancel_requested: { bg: 'bg-[#E8F0FE]',  text: 'text-[#1E3A8A]',  label: 'Cancel Requested' },
};

type TabFilter = 'all' | 'pending' | 'accepted' | 'completed';

function matchesTab(status: BookingStatus, tab: TabFilter): boolean {
  if (tab === 'all') return true;
  if (tab === 'accepted') {
    return status === 'accepted' || status === 'locked';
  }
  return status === tab;
}

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
  const bookings = allBookings.filter((b) => matchesTab(b.status, tab));

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
            <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-6 xl:px-8 py-6">

              <div className="relative rounded-2xl bg-white border border-neutral-200/70 px-6 sm:px-8 py-6 overflow-hidden shadow-soft mb-6">
                <div className="absolute inset-y-0 right-0 w-1/2 bg-gradient-to-l from-[#E8F0FE]/60 to-transparent pointer-events-none" />
                <span aria-hidden className="absolute left-0 top-6 bottom-6 w-1 rounded-r-full bg-gradient-to-b from-[#3678F1] to-[#5B9DF9]" />
                <div className="relative z-10 pl-3 flex items-center justify-between gap-4 flex-wrap">
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#3678F1]">Inbox</p>
                    <h1 className="text-[22px] sm:text-[24px] font-extrabold text-neutral-900 tracking-tight leading-tight mt-1">Project Requests</h1>
                    <p className="text-sm text-neutral-500 mt-1.5">Review incoming project requests from production companies.</p>
                  </div>
                  {!loading && allBookings.filter((b) => b.status === 'pending').length > 0 && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#F40F02]/10 border border-[#F40F02]/20 text-[#F40F02] text-xs font-bold shrink-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#F40F02] animate-pulse" />
                      {allBookings.filter((b) => b.status === 'pending').length} pending
                    </span>
                  )}
                </div>
              </div>

              {/* Tab filter */}
              <div className="flex items-center gap-0.5 mb-5 bg-white rounded-xl p-1 border border-neutral-200 w-fit">
                {(['all', 'pending', 'accepted', 'completed'] as TabFilter[]).map((t) => {
                  const count = allBookings.filter((b) => matchesTab(b.status, t)).length;
                  const isActive = tab === t;
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTab(t)}
                      className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-colors capitalize flex items-center gap-1.5 ${
                        isActive ? 'bg-[#3678F1] text-white shadow-sm' : 'text-neutral-600 hover:bg-[#E8F0FE] hover:text-[#3678F1]'
                      }`}
                    >
                      {t}
                      <span className={`text-[10px] min-w-[18px] h-[18px] px-1.5 rounded-full font-bold flex items-center justify-center tabular-nums ${isActive ? 'bg-white/25 text-white' : 'bg-neutral-100 text-neutral-500'}`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Error */}
              {(error || actionError) && (
                <div className="flex items-center gap-3 rounded-2xl bg-[#FEEBEA] border border-[#F40F02]/30 p-4 mb-4">
                  <FaTriangleExclamation className="text-[#F40F02] shrink-0" />
                  <p className="text-sm text-[#991B1B]">{error ?? actionError}</p>
                  {error && <button onClick={refetch} className="ml-auto text-xs text-[#F40F02] font-semibold hover:underline">Retry</button>}
                </div>
              )}

              {/* Loading skeleton */}
              {loading && (
                <div className="space-y-3" aria-busy="true" aria-label="Loading booking requests">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="rounded-2xl bg-white border border-neutral-200/70 overflow-hidden" style={{ animationDelay: `${i * 60}ms` }}>
                      <div className="px-5 py-4 border-b border-neutral-100 flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <div className="skeleton w-10 h-10 rounded-full shrink-0" />
                          <div className="flex-1 space-y-2">
                            <div className="skeleton h-4 rounded-md w-2/5" />
                            <div className="skeleton h-3 rounded-md w-1/3" />
                          </div>
                        </div>
                        <div className="skeleton w-16 h-5 rounded-full shrink-0" />
                      </div>
                      <div className="p-5 space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {[1,2].map((j) => (
                            <div key={j} className="flex items-start gap-2.5">
                              <div className="skeleton w-8 h-8 rounded-lg shrink-0" />
                              <div className="flex-1 space-y-1.5">
                                <div className="skeleton h-2 w-1/3 rounded" />
                                <div className="skeleton h-3 w-3/5 rounded-md" />
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="skeleton h-10 rounded-xl" />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Empty state */}
              {!loading && !error && bookings.length === 0 && (
                <div className="rounded-2xl bg-white border border-neutral-200/70 p-12 text-center shadow-soft">
                  <div className="w-16 h-16 rounded-2xl bg-[#E8F0FE] ring-1 ring-[#3678F1]/15 flex items-center justify-center mx-auto mb-4">
                    <FaClock className="text-[#3678F1] text-2xl" />
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
                        className="rounded-2xl bg-white border border-neutral-200/70 shadow-soft hover:border-[#3678F1] transition-colors duration-200 overflow-hidden"
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
                              <div className="w-8 h-8 rounded-lg bg-[#E8F0FE] ring-1 ring-[#3678F1]/15 flex items-center justify-center shrink-0">
                                <FaBriefcase className="w-3.5 h-3.5 text-[#3678F1]" />
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
                                <div className="w-8 h-8 rounded-lg bg-[#E8F0FE] ring-1 ring-[#3678F1]/15 flex items-center justify-center shrink-0">
                                  <FaLocationDot className="w-3.5 h-3.5 text-[#3678F1]" />
                                </div>
                                <div className="min-w-0">
                                  <p className="text-[10px] uppercase tracking-wider font-semibold text-neutral-400">Location</p>
                                  <p className="text-sm font-semibold text-neutral-900 truncate">{booking.project.locationCity}</p>
                                </div>
                              </div>
                            )}

                            {booking.rateOffered != null && (
                              <div className="flex items-start gap-2.5">
                                <div className="w-8 h-8 rounded-lg bg-[#E8F0FE] ring-1 ring-[#3678F1]/15 flex items-center justify-center shrink-0">
                                  <FaIndianRupeeSign className="w-3.5 h-3.5 text-[#3678F1]" />
                                </div>
                                <div className="min-w-0">
                                  <p className="text-[10px] uppercase tracking-wider font-semibold text-neutral-400">Rate Offered</p>
                                  <p className="text-sm font-bold text-neutral-900">{formatPaise(booking.rateOffered)}<span className="text-[11px] font-medium text-neutral-500">/day</span></p>
                                </div>
                              </div>
                            )}

                            {booking.vendorEquipment && (
                              <div className="flex items-start gap-2.5">
                                <div className="w-8 h-8 rounded-lg bg-[#E8F0FE] ring-1 ring-[#3678F1]/15 flex items-center justify-center shrink-0">
                                  <FaBriefcase className="w-3.5 h-3.5 text-[#3678F1]" />
                                </div>
                                <div className="min-w-0">
                                  <p className="text-[10px] uppercase tracking-wider font-semibold text-neutral-400">Equipment</p>
                                  <p className="text-sm font-semibold text-neutral-900 truncate">{booking.vendorEquipment.name}</p>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Shoot dates with locations */}
                          {shootDates.length > 0 && (
                            <div className="rounded-xl bg-[#F4F8FE] border border-[#3678F1]/15 p-3.5">
                              <div className="flex items-center gap-2 mb-2">
                                <FaCalendarDay className="w-3.5 h-3.5 text-[#3678F1]" />
                                <p className="text-[10px] uppercase tracking-wider font-bold text-[#3678F1]">
                                  Hire dates · {shootDates.length} {shootDates.length === 1 ? 'day' : 'days'}
                                </p>
                              </div>

                              {/* Check if we have location data */}
                              {booking.shootDateLocations && booking.shootDateLocations.length > 0 ? (
                                <div className="space-y-2">
                                  {booking.shootDateLocations.map((pair) => (
                                    <div key={pair.date} className="flex items-start gap-2.5 bg-white rounded-lg border border-[#3678F1]/20 p-2.5">
                                      <div className="flex items-center gap-2 flex-1 min-w-0">
                                        <div className="w-7 h-7 rounded-md bg-[#E8F0FE] ring-1 ring-[#3678F1]/15 flex items-center justify-center shrink-0">
                                          <FaCalendarDay className="w-3 h-3 text-[#3678F1]" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                          <p className="text-xs font-semibold text-neutral-900">{formatShootDate(pair.date)}</p>
                                        </div>
                                      </div>
                                      <div className="flex items-start gap-1.5 flex-1 min-w-0">
                                        <FaLocationDot className="w-3 h-3 text-[#3678F1] mt-0.5 shrink-0" />
                                        <p className="text-xs text-neutral-700 font-medium truncate">{pair.location}</p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                /* Fallback: show dates without locations (backward compatibility) */
                                <ul className="flex flex-wrap gap-1.5">
                                  {shootDates.map((d) => (
                                    <li
                                      key={d}
                                      className="inline-flex items-center text-[11px] font-semibold bg-white text-[#3678F1] px-2.5 py-1 rounded-lg border border-[#3678F1]/30 shadow-sm"
                                    >
                                      {formatShootDate(d)}
                                    </li>
                                  ))}
                                </ul>
                              )}
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
                            <div className="rounded-xl bg-[#FEF3C7] border border-[#F4C430] px-4 py-3 flex items-start gap-2.5">
                              <FaTriangleExclamation className="text-[#946A00] shrink-0 mt-0.5" />
                              <div className="min-w-0">
                                <p className="text-xs font-semibold text-[#946A00]">This equipment is already committed to another shoot</p>
                                <p className="text-xs text-[#946A00] mt-0.5">
                                  {booking.equipmentAlreadyBookedFor.projectTitle} ({formatDate(booking.equipmentAlreadyBookedFor.startDate)}
                                  {booking.equipmentAlreadyBookedFor.endDate !== booking.equipmentAlreadyBookedFor.startDate && ` – ${formatDate(booking.equipmentAlreadyBookedFor.endDate)}`})
                                </p>
                                <p className="text-[11px] text-[#946A00] mt-1">Decline this request or offer an alternative if you have another unit.</p>
                              </div>
                            </div>
                          )}

                          {/* Actions */}
                          <div className="flex items-center gap-2 flex-wrap pt-1">
                            <Link
                              to={`/chat/${booking.requester.id}?projectId=${encodeURIComponent(booking.projectId)}`}
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
                                  className="rounded-xl px-4 py-2 bg-gradient-to-br from-[#3678F1] to-[#2563EB] text-white text-xs font-semibold hover:from-[#2563EB] hover:to-[#1D4ED8] flex items-center gap-1.5 transition-colors disabled:opacity-50 shadow-brand"
                                >
                                  <FaCircleCheck className="w-3 h-3" />
                                  {actioning === booking.id + 'accept' ? 'Accepting…' : 'Accept'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => doAction(booking.id, 'decline')}
                                  disabled={!!isActioning}
                                  className="rounded-xl px-4 py-2 bg-[#FEEBEA] border border-[#F40F02]/30 text-[#991B1B] text-xs font-semibold hover:bg-[#FDD8D5] flex items-center gap-1.5 transition-colors disabled:opacity-50"
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
                                className="rounded-xl px-4 py-2 border border-[#F4C430] text-[#946A00] text-xs font-semibold hover:bg-[#FEF3C7] flex items-center gap-1.5 transition-colors"
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
