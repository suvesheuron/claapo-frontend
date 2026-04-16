import { useEffect, useState } from 'react';
import {
  FaCircleCheck, FaXmark, FaTriangleExclamation, FaClock,
} from 'react-icons/fa6';
import DashboardHeader from '../../components/DashboardHeader';
import DashboardSidebar from '../../components/DashboardSidebar';
import AppFooter from '../../components/AppFooter';
import Avatar from '../../components/Avatar';
import { api, ApiException } from '../../services/api';
import toast from 'react-hot-toast';
import { useApiQuery } from '../../hooks/useApiQuery';
import { formatPaise } from '../../utils/currency';
import { companyNavLinks } from '../../navigation/dashboardNav';

interface CancelRequestBooking {
  id: string;
  status: string;
  rateOffered: number | null;
  cancelRequestReason: string | null;
  cancelRequestedAt: string | null;
  project: { id: string; title: string; startDate: string; endDate: string };
  target: {
    id: string;
    email: string;
    individualProfile?: { displayName?: string } | null;
    vendorProfile?: { companyName?: string } | null;
  };
  projectRole: { id: string; roleName: string } | null;
}

interface CancelRequestsResponse {
  items: CancelRequestBooking[];
}

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function CancelRequests() {
  useEffect(() => { document.title = 'Cancel Requests – Claapo'; }, []);

  const [actioning, setActioning] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const { data, loading, error, refetch } = useApiQuery<CancelRequestsResponse>('/bookings/cancel-requests');
  const requests = data?.items ?? [];

  const respond = async (bookingId: string, accept: boolean) => {
    const key = bookingId + (accept ? 'accept' : 'deny');
    setActioning(key);
    setActionError(null);
    try {
      await api.patch(`/bookings/${bookingId}/${accept ? 'accept-cancel' : 'deny-cancel'}`, {});
      toast.success(accept ? 'Cancellation approved.' : 'Cancellation request denied — booking remains active.');
      refetch();
    } catch (err) {
      const msg = err instanceof ApiException ? err.payload.message : 'Action failed.';
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
        <DashboardSidebar links={companyNavLinks} />

        <main className="flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden">
          <div className="flex-1 min-h-0 overflow-auto">
            <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-6 xl:px-8 py-6">

              {/* ── Page header ───────────────────────────────────── */}
              <div className="mb-6">
                <div className="flex items-center gap-2.5 mb-1.5">
                  <span className="w-1 h-6 rounded-full bg-[#3678F1]" />
                  <h1 className="text-xl font-bold text-neutral-900 tracking-tight">Cancellation Requests</h1>
                  {!loading && requests.length > 0 && (
                    <span className="inline-flex items-center h-6 px-2.5 rounded-full bg-neutral-100 text-[11px] font-semibold text-neutral-600 tabular-nums">
                      {requests.length}
                    </span>
                  )}
                </div>
                <p className="text-sm text-neutral-500 ml-3.5">
                  Crew or vendors who have requested to leave a project. Review and approve or deny.
                </p>
              </div>

              {(error || actionError) && (
                <div className="flex items-center gap-3 rounded-2xl bg-[#FEEBEA] border border-[#F40F02]/30 p-4 mb-5">
                  <div className="w-9 h-9 rounded-xl bg-white/60 flex items-center justify-center shrink-0">
                    <FaTriangleExclamation className="text-[#F40F02] text-xs" />
                  </div>
                  <p className="text-sm text-[#991B1B]">{error ?? actionError}</p>
                  {error && (
                    <button onClick={refetch} className="ml-auto text-xs text-[#991B1B] font-semibold hover:underline">
                      Retry
                    </button>
                  )}
                </div>
              )}

              {loading && (
                <div className="space-y-4">
                  {[1, 2].map((i) => (
                    <div key={i} className="rounded-2xl bg-white border border-neutral-200/70 p-5 sm:p-6 shadow-sm">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="skeleton w-11 h-11 rounded-full" />
                        <div className="flex-1 space-y-2">
                          <div className="skeleton h-4 w-1/3 rounded-md" />
                          <div className="skeleton h-3 w-1/2 rounded-full" />
                        </div>
                        <div className="skeleton w-28 h-6 rounded-full" />
                      </div>
                      <div className="skeleton h-16 rounded-xl mb-4" />
                      <div className="flex gap-2">
                        <div className="skeleton h-10 w-44 rounded-xl" />
                        <div className="skeleton h-10 w-36 rounded-xl" />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {!loading && !error && requests.length === 0 && (
                <div className="rounded-2xl bg-white border border-neutral-200/70 p-16 text-center shadow-sm">
                  <div className="w-16 h-16 rounded-2xl bg-[#E8F0FE] ring-1 ring-[#3678F1]/15 flex items-center justify-center mx-auto mb-5">
                    <FaClock className="text-[#3678F1] text-2xl" />
                  </div>
                  <h3 className="text-lg font-bold text-neutral-900 mb-2">No cancellation requests</h3>
                  <p className="text-sm text-neutral-500 max-w-sm mx-auto leading-relaxed">
                    No crew members or vendors have requested to cancel a booking. You're all clear.
                  </p>
                </div>
              )}

              {!loading && requests.length > 0 && (
                <div className="space-y-4">
                  {requests.map((req) => {
                    const targetName =
                      req.target.individualProfile?.displayName ??
                      req.target.vendorProfile?.companyName ??
                      req.target.email;
                    const isActioning = actioning?.startsWith(req.id);
                    return (
                      <div
                        key={req.id}
                        className="rounded-2xl bg-white border border-neutral-200/70 p-5 sm:p-6 shadow-sm hover:border-[#3678F1] transition-colors duration-200"
                      >
                        {/* Header: avatar + identity + status pill */}
                        <div className="flex items-start justify-between gap-4 mb-4">
                          <div className="flex items-start gap-3 flex-1 min-w-0">
                            <Avatar name={targetName} size="md" />
                            <div className="min-w-0 pt-0.5">
                              <h3 className="text-sm font-bold text-neutral-900 truncate">{targetName}</h3>
                              <p className="text-xs text-neutral-500 truncate mt-0.5">{req.project.title}</p>
                              {req.projectRole && (
                                <p className="text-[11px] text-neutral-400 mt-1 flex items-center gap-1.5">
                                  <span className="w-1 h-1 rounded-full bg-neutral-300 inline-block" />
                                  {req.projectRole.roleName}
                                </p>
                              )}
                              <p className="text-[11px] text-neutral-400 mt-0.5">
                                {formatDate(req.project.startDate)} – {formatDate(req.project.endDate)}
                              </p>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2 shrink-0">
                            {req.rateOffered && (
                              <span className="text-sm font-bold text-neutral-900 tabular-nums">{formatPaise(req.rateOffered)}</span>
                            )}
                            <span className="inline-flex items-center gap-1.5 h-6 px-2.5 rounded-full text-[10.5px] font-bold tracking-wide bg-[#FEF3C7] text-[#946A00]">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#F4C430]" />
                              Cancel Requested
                            </span>
                          </div>
                        </div>

                        {req.cancelRequestReason && (
                          <div className="rounded-xl bg-[#FEF3C7]/60 border border-[#F4C430]/40 px-4 py-3.5 mb-4">
                            <p className="text-[10.5px] font-bold text-[#946A00] mb-1 uppercase tracking-wider">Reason given</p>
                            <p className="text-xs text-[#946A00]/90 leading-relaxed">{req.cancelRequestReason}</p>
                          </div>
                        )}

                        {req.cancelRequestedAt && (
                          <p className="text-[11px] text-neutral-400 mb-4">
                            Requested on {formatDate(req.cancelRequestedAt)}
                          </p>
                        )}

                        <div className="flex items-center gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => respond(req.id, true)}
                            disabled={!!isActioning}
                            className="inline-flex items-center justify-center gap-1.5 h-10 px-5 rounded-xl bg-[#F40F02] text-white text-xs font-semibold hover:bg-[#C20D02] transition-colors shadow-sm shadow-[#F40F02]/15 disabled:opacity-50"
                          >
                            <FaCircleCheck className="w-3 h-3" />
                            {actioning === req.id + 'accept' ? 'Approving…' : 'Approve Cancellation'}
                          </button>
                          <button
                            type="button"
                            onClick={() => respond(req.id, false)}
                            disabled={!!isActioning}
                            className="inline-flex items-center justify-center gap-1.5 h-10 px-5 rounded-xl border border-neutral-200 text-neutral-600 text-xs font-semibold hover:border-[#3678F1] hover:text-[#3678F1] transition-colors disabled:opacity-50"
                          >
                            <FaXmark className="w-3 h-3" />
                            {actioning === req.id + 'deny' ? 'Denying…' : 'Deny — Keep Booked'}
                          </button>
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
