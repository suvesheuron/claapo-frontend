/**
 * Bookings page — for individual crew and vendors to manage incoming booking requests.
 *
 * API calls:
 *   GET   /v1/bookings/me?role=target        — incoming requests where the user is the target
 *   PATCH /v1/bookings/:id/accept            — accept a request
 *   PATCH /v1/bookings/:id/decline           — decline a request
 *   PATCH /v1/bookings/:id/complete          — mark as completed (after the job)
 */

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FaCalendar, FaHouse, FaUser, FaCircleCheck, FaXmark,
  FaMessage, FaTriangleExclamation, FaClock, FaFolder,
} from 'react-icons/fa6';
import DashboardHeader from '../components/DashboardHeader';
import DashboardSidebar from '../components/DashboardSidebar';
import AppFooter from '../components/AppFooter';
import Avatar from '../components/Avatar';
import { api, ApiException } from '../services/api';
import { useApiQuery } from '../hooks/useApiQuery';
import { useRole } from '../contexts/RoleContext';
import { formatPaise } from '../utils/currency';

type BookingStatus = 'pending' | 'accepted' | 'declined' | 'completed' | 'cancelled';

interface Booking {
  id: string;
  status: BookingStatus;
  projectId: string;
  projectTitle: string | null;
  requesterName: string | null;
  rateOffered: number | null;
  message: string | null;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
}

interface BookingsResponse {
  data: Booking[];
  meta: { page: number; limit: number; total: number };
}

const STATUS_CONFIG: Record<BookingStatus, { bg: string; text: string; label: string }> = {
  pending:   { bg: 'bg-[#FEF9E6]',  text: 'text-[#92400E]',  label: 'Pending' },
  accepted:  { bg: 'bg-[#DCFCE7]',  text: 'text-[#15803D]',  label: 'Accepted' },
  declined:  { bg: 'bg-[#FEE2E2]',  text: 'text-[#B91C1C]',  label: 'Declined' },
  completed: { bg: 'bg-[#DBEAFE]',  text: 'text-[#1D4ED8]',  label: 'Completed' },
  cancelled: { bg: 'bg-[#F3F4F6]',  text: 'text-neutral-500', label: 'Cancelled' },
};

type TabFilter = 'all' | 'pending' | 'accepted' | 'completed';

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function Bookings() {
  const { currentRole } = useRole();

  const isVendor = currentRole === 'Vendor';

  const navLinksIndividual = [
    { icon: FaHouse,     label: 'Dashboard',    to: '/dashboard' },
    { icon: FaCalendar,  label: 'Availability', to: '/dashboard/availability' },
    { icon: FaFolder,    label: 'Bookings',     to: '/dashboard/bookings' },
    { icon: FaUser,      label: 'Profile',      to: '/dashboard/profile' },
  ];

  const navLinksVendor = [
    { icon: FaHouse,     label: 'Dashboard',    to: '/dashboard' },
    { icon: FaCalendar,  label: 'Availability', to: '/dashboard/vendor-availability' },
    { icon: FaFolder,    label: 'Bookings',     to: '/dashboard/bookings' },
    { icon: FaUser,      label: 'Profile',      to: '/dashboard/vendor-profile' },
  ];

  const navLinks = isVendor ? navLinksVendor : navLinksIndividual;

  useEffect(() => { document.title = 'Booking Requests – Claapo'; }, []);

  const [tab, setTab]       = useState<TabFilter>('all');
  const [actioning, setActioning] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const qs = tab === 'all' ? '' : `&status=${tab}`;
  const { data, loading, error, refetch } = useApiQuery<BookingsResponse>(
    `/bookings/me?role=target&limit=50${qs}`
  );

  const bookings = data?.data ?? [];

  const doAction = async (bookingId: string, action: 'accept' | 'decline' | 'complete') => {
    setActioning(bookingId + action);
    setActionError(null);
    try {
      await api.patch(`/bookings/${bookingId}/${action}`);
      refetch();
    } catch (err) {
      setActionError(err instanceof ApiException ? err.payload.message : `Failed to ${action} booking.`);
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
                      tab === t ? 'bg-[#3678F1] text-white shadow-sm' : 'text-neutral-600 hover:bg-[#F3F4F6]'
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
                    <FaClock className="text-[#3678F1] text-2xl" />
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
                    const cfg = STATUS_CONFIG[booking.status] ?? STATUS_CONFIG.pending;
                    const isActioning = actioning?.startsWith(booking.id);
                    return (
                      <div key={booking.id} className="rounded-2xl bg-white border border-neutral-200 p-5 hover:border-neutral-300 transition-all">
                        <div className="flex items-start justify-between gap-4 mb-3">
                          <div className="flex items-start gap-3 flex-1 min-w-0">
                            <Avatar name={booking.requesterName ?? 'Company'} size="md" />
                            <div className="min-w-0">
                              <h3 className="text-sm font-bold text-neutral-900 truncate">
                                {booking.requesterName ?? 'Production Company'}
                              </h3>
                              {booking.projectTitle && (
                                <p className="text-xs text-neutral-500 truncate">{booking.projectTitle}</p>
                              )}
                              <p className="text-xs text-neutral-400 mt-0.5">
                                {formatDate(booking.startDate)}
                                {booking.endDate && booking.endDate !== booking.startDate && ` – ${formatDate(booking.endDate)}`}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {booking.rateOffered && (
                              <span className="text-sm font-bold text-neutral-900">{formatPaise(booking.rateOffered)}</span>
                            )}
                            <span className={`text-[11px] px-2.5 py-1 rounded-full font-semibold ${cfg.bg} ${cfg.text}`}>
                              {cfg.label}
                            </span>
                          </div>
                        </div>

                        {booking.message && (
                          <div className="rounded-xl bg-[#F3F4F6] px-4 py-3 mb-4">
                            <p className="text-xs text-neutral-600 leading-relaxed">{booking.message}</p>
                          </div>
                        )}

                        <div className="flex items-center gap-2 flex-wrap">
                          {/* Message button — always available */}
                          <Link
                            to={`/dashboard/chat/${booking.projectId}`}
                            className="rounded-xl px-4 py-2 border border-neutral-200 text-neutral-700 text-xs font-semibold hover:bg-neutral-50 flex items-center gap-1.5 transition-colors"
                          >
                            <FaMessage className="w-3 h-3" /> Message
                          </Link>

                          {/* Pending actions */}
                          {booking.status === 'pending' && (
                            <>
                              <button
                                type="button"
                                onClick={() => doAction(booking.id, 'accept')}
                                disabled={!!isActioning}
                                className="rounded-xl px-4 py-2 bg-[#3678F1] text-white text-xs font-semibold hover:bg-[#2563d4] flex items-center gap-1.5 transition-colors disabled:opacity-50"
                              >
                                <FaCircleCheck className="w-3 h-3" />
                                {actioning === booking.id + 'accept' ? 'Accepting…' : 'Accept'}
                              </button>
                              <button
                                type="button"
                                onClick={() => doAction(booking.id, 'decline')}
                                disabled={!!isActioning}
                                className="rounded-xl px-4 py-2 bg-[#FEE2E2] text-[#B91C1C] text-xs font-semibold hover:bg-[#FECACA] flex items-center gap-1.5 transition-colors disabled:opacity-50"
                              >
                                <FaXmark className="w-3 h-3" />
                                {actioning === booking.id + 'decline' ? 'Declining…' : 'Decline'}
                              </button>
                            </>
                          )}

                          {/* Accepted: can mark complete */}
                          {booking.status === 'accepted' && (
                            <button
                              type="button"
                              onClick={() => doAction(booking.id, 'complete')}
                              disabled={!!isActioning}
                              className="rounded-xl px-4 py-2 bg-[#DCFCE7] text-[#15803D] text-xs font-semibold hover:bg-[#BBF7D0] flex items-center gap-1.5 transition-colors disabled:opacity-50"
                            >
                              <FaCircleCheck className="w-3 h-3" />
                              {actioning === booking.id + 'complete' ? 'Updating…' : 'Mark Complete'}
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
    </div>
  );
}
