import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  FaCircleCheck, FaTriangleExclamation, FaClock,
  FaMessage, FaBan, FaLock, FaCalendar, FaChevronLeft, FaChevronRight,
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

type BookingStatus = 'accepted' | 'locked' | 'cancel_requested' | 'completed' | 'cancelled';

interface ProjectBooking {
  id: string;
  status: BookingStatus;
  projectId: string;
  rateOffered: number | null;
  message: string | null;
  createdAt: string;
  cancelRequestReason: string | null;
  cancelRequestedAt: string | null;
  shootDates: string[];
  project: { id: string; title: string; startDate: string; endDate: string; status: string };
  requester: { id: string; email: string; companyProfile?: { companyName?: string } | null };
}

interface BookingsResponse {
  items: ProjectBooking[];
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const STATUS_CONFIG: Record<string, { bg: string; text: string; label: string; icon: typeof FaCircleCheck }> = {
  accepted:         { bg: 'bg-[#DCFCE7]',  text: 'text-[#15803D]',  label: 'Accepted',           icon: FaCircleCheck },
  locked:           { bg: 'bg-[#DBEAFE]',  text: 'text-[#1E3A8A]',  label: 'Locked',             icon: FaLock },
  cancel_requested: { bg: 'bg-[#E8F0FE]',  text: 'text-[#1E3A8A]',  label: 'Cancel Requested',   icon: FaClock },
  completed:        { bg: 'bg-[#DBEAFE]',  text: 'text-[#1E3A8A]',  label: 'Completed',          icon: FaCircleCheck },
  cancelled:        { bg: 'bg-[#FEE2E2]',  text: 'text-[#991B1B]',  label: 'Cancelled',          icon: FaBan },
};

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function isDateInMonth(date: string, month: number, year: number): boolean {
  const d = new Date(date);
  return d.getMonth() === month && d.getFullYear() === year;
}

export default function ProjectDetails() {
  const { currentRole } = useRole();
  const navLinks = currentRole === 'Vendor' ? vendorNavLinks : individualNavLinks;

  useEffect(() => { document.title = 'Project Details – Claapo'; }, []);

  const [filterMonth, setFilterMonth] = useState(new Date().getMonth());
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());
  const [showAll, setShowAll] = useState(false);

  const [actioning, setActioning] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  const { data, loading, error, refetch } = useApiQuery<BookingsResponse>('/bookings/incoming');

  // Filter by month/year or show all
  const filteredBookings = useMemo(() => {
    if (!data?.items) return [];
    if (showAll) return data.items;
    return data.items.filter((booking) => {
      const shootDates = booking.shootDates || [booking.project.startDate];
      return shootDates.some((d) => isDateInMonth(d, filterMonth, filterYear));
    });
  }, [data?.items, filterMonth, filterYear, showAll]);

  // Sort by date (latest first)
  const sortedBookings = useMemo(() => {
    return [...filteredBookings].sort((a, b) => {
      const dateA = new Date(a.project.startDate).getTime();
      const dateB = new Date(b.project.startDate).getTime();
      return dateB - dateA;
    });
  }, [filteredBookings]);

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

  const goPrevMonth = () => {
    if (filterMonth === 0) {
      setFilterMonth(11);
      setFilterYear((y) => y - 1);
    } else {
      setFilterMonth((m) => m - 1);
    }
  };

  const goNextMonth = () => {
    if (filterMonth === 11) {
      setFilterMonth(0);
      setFilterYear((y) => y + 1);
    } else {
      setFilterMonth((m) => m + 1);
    }
  };

  const goToday = () => {
    const now = new Date();
    setFilterMonth(now.getMonth());
    setFilterYear(now.getFullYear());
  };

  const isCurrentMonth = (() => {
    const now = new Date();
    return now.getMonth() === filterMonth && now.getFullYear() === filterYear;
  })();

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-[#F3F4F6] w-full">
      <DashboardHeader />
      <div className="flex-1 flex min-h-0 overflow-hidden">
        <DashboardSidebar links={navLinks} />

        <main className="flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden">
          <div className="flex-1 min-h-0 overflow-auto">
            <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-6 xl:px-8 py-5">

              <div className="relative rounded-2xl bg-white border border-neutral-200/70 px-6 sm:px-8 py-6 overflow-hidden shadow-soft mb-5">
                <div className="absolute inset-y-0 right-0 w-1/2 bg-gradient-to-l from-[#E8F0FE]/60 to-transparent pointer-events-none" />
                <span aria-hidden className="absolute left-0 top-6 bottom-6 w-1 rounded-r-full bg-gradient-to-b from-[#3678F1] to-[#5B9DF9]" />
                <div className="relative z-10 pl-3 flex items-center justify-between gap-4 flex-wrap">
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#3678F1]">
                      {showAll ? 'All Time' : `${MONTHS[filterMonth]} ${filterYear}`}
                    </p>
                    <h1 className="text-[22px] sm:text-[24px] font-extrabold text-neutral-900 tracking-tight leading-tight mt-1">Project Details</h1>
                    <p className="text-sm text-neutral-500 mt-1.5">All your projects with companies — past and ongoing</p>
                  </div>
                  {!loading && sortedBookings.length > 0 && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#E8F0FE] border border-[#3678F1]/20 text-[#3678F1] text-xs font-bold shrink-0">
                      {sortedBookings.length} {sortedBookings.length === 1 ? 'project' : 'projects'}
                    </span>
                  )}
                </div>
              </div>

              {/* Month Filter */}
              <div className="flex items-center gap-2 mb-5 flex-wrap">
                <div className="flex items-center gap-1 bg-white rounded-xl border border-neutral-200 p-1">
                  <button
                    type="button"
                    onClick={goPrevMonth}
                    disabled={showAll}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-600 hover:bg-[#E8F0FE] hover:text-[#3678F1] disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-neutral-600 transition-colors"
                    aria-label="Previous month"
                  >
                    <FaChevronLeft className="text-xs" />
                  </button>
                  <div className="min-w-[140px] text-center px-1">
                    <p className="text-sm font-bold text-neutral-900 tabular-nums leading-tight">
                      {showAll ? 'All Time' : `${MONTHS[filterMonth]} ${filterYear}`}
                    </p>
                    {!isCurrentMonth && !showAll && (
                      <button
                        type="button"
                        onClick={goToday}
                        className="text-[10px] text-[#3678F1] font-bold hover:underline"
                      >
                        Jump to today
                      </button>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={goNextMonth}
                    disabled={showAll}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-600 hover:bg-[#E8F0FE] hover:text-[#3678F1] disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-neutral-600 transition-colors"
                    aria-label="Next month"
                  >
                    <FaChevronRight className="text-xs" />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAll(!showAll)}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                    showAll
                      ? 'bg-gradient-to-br from-[#3678F1] to-[#2563EB] text-white shadow-brand hover:from-[#2563EB] hover:to-[#1D4ED8]'
                      : 'bg-white border border-neutral-200 text-neutral-700 hover:border-[#3678F1] hover:text-[#3678F1]'
                  }`}
                >
                  {showAll ? 'Showing All' : 'Show All'}
                </button>
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
                <div className="space-y-3" aria-busy="true" aria-label="Loading projects">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="rounded-2xl bg-white border border-neutral-200/70 p-5 overflow-hidden" style={{ animationDelay: `${i * 60}ms` }}>
                      <div className="flex items-start gap-3 mb-3">
                        <div className="skeleton w-10 h-10 rounded-full shrink-0" />
                        <div className="flex-1 space-y-2">
                          <div className="skeleton h-4 rounded-md w-1/3" />
                          <div className="skeleton h-3 rounded-md w-1/2" />
                          <div className="skeleton h-3 rounded-md w-1/4" />
                        </div>
                        <div className="skeleton w-20 h-6 rounded-full shrink-0" />
                      </div>
                      <div className="skeleton h-8 rounded-xl w-full" />
                    </div>
                  ))}
                </div>
              )}

              {/* Empty state */}
              {!loading && !error && sortedBookings.length === 0 && (
                <div className="rounded-2xl bg-white shadow-soft border border-neutral-200/70 p-12 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-[#E8F0FE] ring-1 ring-[#3678F1]/15 flex items-center justify-center mx-auto mb-4">
                    <FaCalendar className="text-[#3678F1] text-2xl" />
                  </div>
                  <h3 className="text-base font-bold text-neutral-900 mb-2">
                    {showAll ? 'No projects yet' : `No projects in ${MONTHS[filterMonth]} ${filterYear}`}
                  </h3>
                  <p className="text-sm text-neutral-500">
                    {showAll ? 'Once you accept a booking, it will appear here.' : 'Try navigating to a different month or showing all projects.'}
                  </p>
                </div>
              )}

              {/* Booking cards */}
              {!loading && sortedBookings.length > 0 && (
                <div className="space-y-3">
                  {sortedBookings.map((booking) => {
                    const cfg = STATUS_CONFIG[booking.status] ?? STATUS_CONFIG.accepted;
                    const isActioning = actioning?.startsWith(booking.id);
                    const companyName = booking.requester.companyProfile?.companyName ?? booking.requester.email;
                    const StatusIcon = cfg.icon;
                    const isActiveBooking = booking.status === 'accepted' || booking.status === 'locked' || booking.status === 'cancel_requested';
                    return (
                      <div key={booking.id} className="rounded-2xl bg-white shadow-soft border border-neutral-200/70 p-5 hover:border-[#3678F1] transition-colors duration-200">
                        <div className="flex items-start justify-between gap-4 mb-3">
                          <div className="flex items-start gap-3 flex-1 min-w-0">
                            <Avatar name={companyName} size="md" />
                            <div className="min-w-0">
                              <h3 className="text-sm font-bold text-neutral-900 truncate">{companyName}</h3>
                              <p className="text-xs text-neutral-500 truncate">{booking.project.title}</p>
                              <p className="text-xs text-neutral-400 mt-0.5">
                                {booking.shootDates && booking.shootDates.length > 0
                                  ? `${formatDate(booking.shootDates[0])}${booking.shootDates.length > 1 ? ` – ${formatDate(booking.shootDates[booking.shootDates.length - 1])}` : ''}`
                                  : `${formatDate(booking.project.startDate)}${booking.project.endDate !== booking.project.startDate ? ` – ${formatDate(booking.project.endDate)}` : ''}`
                                }
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
                          <div className="rounded-xl bg-[#E8F0FE] border border-[#3678F1]/30 px-4 py-3 mb-4">
                            <p className="text-xs font-semibold text-[#1E3A8A] mb-0.5">Cancellation request pending company review</p>
                            {booking.cancelRequestReason && (
                              <p className="text-xs text-[#1E3A8A]">Reason: {booking.cancelRequestReason}</p>
                            )}
                            {booking.cancelRequestedAt && (
                              <p className="text-xs text-[#1E3A8A] mt-0.5">Requested on {formatDate(booking.cancelRequestedAt)}</p>
                            )}
                          </div>
                        )}

                        <div className="flex items-center gap-2 flex-wrap">
                          <Link
                            to={`/chat/${booking.requester.id}?projectId=${encodeURIComponent(booking.projectId)}`}
                            className="rounded-xl px-4 py-2 border border-neutral-200 text-neutral-700 text-xs font-semibold hover:bg-neutral-50 flex items-center gap-1.5 transition-colors"
                          >
                            <FaMessage className="w-3 h-3" /> Message
                          </Link>

                          {isActiveBooking && (
                            <button
                              type="button"
                              onClick={() => { setCancellingId(booking.id); setCancelReason(''); }}
                              disabled={!!isActioning}
                              className="rounded-xl px-4 py-2 bg-[#FEF3C7] border border-[#F4C430]/50 text-[#946A00] text-xs font-semibold hover:bg-[#FDE68A] hover:border-[#F4C430] flex items-center gap-1.5 transition-colors disabled:opacity-50 ml-auto"
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
                <div className="flex items-center gap-2 mb-4 p-3 bg-[#FEEBEA] border border-[#F40F02]/30 rounded-xl">
                  <FaTriangleExclamation className="text-[#F40F02] text-xs shrink-0" />
                  <p className="text-xs text-[#991B1B]">{actionError}</p>
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
                  className="flex-1 rounded-xl py-2.5 bg-gradient-to-br from-[#3678F1] to-[#2563EB] text-white text-sm font-semibold hover:from-[#2563EB] hover:to-[#1D4ED8] shadow-brand transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {actioning ? (
                    <><span className="w-6 h-6 border-[2.5px] border-white/30 border-t-white border-r-white rounded-full animate-spin" />Sending…</>
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
