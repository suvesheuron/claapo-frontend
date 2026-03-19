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
    <div className="h-screen flex flex-col overflow-hidden bg-[#F8F9FB] w-full">
      <DashboardHeader />
      <div className="flex-1 flex min-h-0 overflow-hidden">
        <DashboardSidebar links={companyNavLinks} />

        <main className="flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden">
          <div className="flex-1 min-h-0 overflow-auto">
            <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-6 xl:px-8 py-6">

              <div className="mb-6">
                <div className="flex items-center gap-2.5 mb-1">
                  <div className="w-1 h-6 rounded-full bg-amber-500" />
                  <h1 className="text-xl font-bold text-neutral-900 tracking-tight">Cancellation Requests</h1>
                </div>
                <p className="text-sm text-neutral-500 ml-3.5">Crew or vendors who have requested to leave a project. Review and approve or deny.</p>
              </div>

              {(error || actionError) && (
                <div className="flex items-center gap-3 rounded-2xl bg-red-50 border border-red-200/80 p-4 mb-5">
                  <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center shrink-0">
                    <FaTriangleExclamation className="text-red-500 text-xs" />
                  </div>
                  <p className="text-sm text-red-700">{error ?? actionError}</p>
                  {error && <button onClick={refetch} className="ml-auto text-xs text-red-600 font-semibold hover:underline">Retry</button>}
                </div>
              )}

              {loading && (
                <div className="space-y-4">
                  {[1, 2].map((i) => (
                    <div key={i} className="rounded-2xl bg-white border border-neutral-200/80 p-6 animate-pulse shadow-sm border-l-[3px] border-l-amber-300">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-neutral-100 rounded-full" />
                        <div className="flex-1">
                          <div className="h-4 bg-neutral-200 rounded-lg w-1/3 mb-2" />
                          <div className="h-3 bg-neutral-100 rounded-lg w-1/2" />
                        </div>
                        <div className="w-24 h-6 bg-amber-50 rounded-full" />
                      </div>
                      <div className="h-16 bg-amber-50/50 rounded-xl mb-3" />
                      <div className="flex gap-2">
                        <div className="h-9 bg-neutral-100 rounded-xl w-36" />
                        <div className="h-9 bg-neutral-50 rounded-xl w-32 border border-neutral-100" />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {!loading && !error && requests.length === 0 && (
                <div className="rounded-2xl bg-white border border-neutral-200/80 p-16 text-center shadow-sm">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center mx-auto mb-5 border border-blue-100/60">
                    <FaClock className="text-[#3B5BDB] text-2xl" />
                  </div>
                  <h3 className="text-lg font-bold text-neutral-900 mb-2">No cancellation requests</h3>
                  <p className="text-sm text-neutral-500 max-w-sm mx-auto leading-relaxed">No crew members or vendors have requested to cancel a booking. You're all clear.</p>
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
                      <div key={req.id} className="rounded-2xl bg-white border border-neutral-200/80 border-l-[3px] border-l-amber-400 p-5 sm:p-6 shadow-sm hover:shadow-md transition-all duration-200">
                        <div className="flex items-start justify-between gap-4 mb-4">
                          <div className="flex items-start gap-3 flex-1 min-w-0">
                            <Avatar name={targetName} size="md" />
                            <div className="min-w-0 pt-0.5">
                              <h3 className="text-sm font-bold text-neutral-900 truncate">{targetName}</h3>
                              <p className="text-xs text-neutral-500 truncate mt-0.5">{req.project.title}</p>
                              {req.projectRole && (
                                <p className="text-[11px] text-neutral-400 mt-1 flex items-center gap-1">
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
                            <span className="text-[11px] px-2.5 py-1 rounded-full font-semibold bg-amber-50 text-amber-700 border border-amber-200/60 flex items-center gap-1.5">
                              <FaClock className="w-2.5 h-2.5" /> Cancel Requested
                            </span>
                          </div>
                        </div>

                        {req.cancelRequestReason && (
                          <div className="rounded-xl bg-amber-50/60 border border-amber-200/50 px-4 py-3.5 mb-4">
                            <p className="text-[11px] font-semibold text-amber-700 mb-1 uppercase tracking-wide">Reason given</p>
                            <p className="text-xs text-amber-900/80 leading-relaxed">{req.cancelRequestReason}</p>
                          </div>
                        )}

                        {req.cancelRequestedAt && (
                          <p className="text-[11px] text-neutral-400 mb-4">Requested on {formatDate(req.cancelRequestedAt)}</p>
                        )}

                        <div className="flex items-center gap-2.5 pt-1">
                          <button
                            type="button"
                            onClick={() => respond(req.id, true)}
                            disabled={!!isActioning}
                            className="rounded-xl px-5 py-2.5 bg-red-500 text-white text-xs font-semibold hover:bg-red-600 flex items-center gap-1.5 transition-all shadow-sm shadow-red-500/15 disabled:opacity-50"
                          >
                            <FaCircleCheck className="w-3 h-3" />
                            {actioning === req.id + 'accept' ? 'Approving...' : 'Approve Cancellation'}
                          </button>
                          <button
                            type="button"
                            onClick={() => respond(req.id, false)}
                            disabled={!!isActioning}
                            className="rounded-xl px-5 py-2.5 border border-neutral-200 text-neutral-600 text-xs font-semibold hover:bg-neutral-50 hover:border-neutral-300 flex items-center gap-1.5 transition-all disabled:opacity-50"
                          >
                            <FaXmark className="w-3 h-3" />
                            {actioning === req.id + 'deny' ? 'Denying...' : 'Deny — Keep Booked'}
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
