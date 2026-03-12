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
            <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-6 xl:px-8 py-5">

              <div className="mb-5">
                <h1 className="text-xl font-bold text-neutral-900">Cancellation Requests</h1>
                <p className="text-sm text-neutral-500 mt-0.5">Crew or vendors who have requested to leave a project. Review and approve or deny.</p>
              </div>

              {(error || actionError) && (
                <div className="flex items-center gap-3 rounded-2xl bg-red-50 border border-red-200 p-4 mb-4">
                  <FaTriangleExclamation className="text-red-500 shrink-0" />
                  <p className="text-sm text-red-700">{error ?? actionError}</p>
                  {error && <button onClick={refetch} className="ml-auto text-xs text-red-600 font-semibold hover:underline">Retry</button>}
                </div>
              )}

              {loading && (
                <div className="space-y-3">
                  {[1, 2].map((i) => (
                    <div key={i} className="rounded-2xl bg-white border border-neutral-200 p-5 animate-pulse">
                      <div className="h-4 bg-neutral-200 rounded w-1/3 mb-3" />
                      <div className="h-3 bg-neutral-100 rounded w-1/2" />
                    </div>
                  ))}
                </div>
              )}

              {!loading && !error && requests.length === 0 && (
                <div className="rounded-2xl bg-white border border-neutral-200 p-12 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-[#EEF4FF] flex items-center justify-center mx-auto mb-4">
                    <FaClock className="text-[#3678F1] text-2xl" />
                  </div>
                  <h3 className="text-base font-bold text-neutral-900 mb-2">No cancellation requests</h3>
                  <p className="text-sm text-neutral-500">No crew members or vendors have requested to cancel a booking.</p>
                </div>
              )}

              {!loading && requests.length > 0 && (
                <div className="space-y-3">
                  {requests.map((req) => {
                    const targetName =
                      req.target.individualProfile?.displayName ??
                      req.target.vendorProfile?.companyName ??
                      req.target.email;
                    const isActioning = actioning?.startsWith(req.id);
                    return (
                      <div key={req.id} className="rounded-2xl bg-white border border-[#FCD34D] p-5">
                        <div className="flex items-start justify-between gap-4 mb-3">
                          <div className="flex items-start gap-3 flex-1 min-w-0">
                            <Avatar name={targetName} size="md" />
                            <div className="min-w-0">
                              <h3 className="text-sm font-bold text-neutral-900 truncate">{targetName}</h3>
                              <p className="text-xs text-neutral-500 truncate">{req.project.title}</p>
                              {req.projectRole && (
                                <p className="text-xs text-neutral-400 mt-0.5">Role: {req.projectRole.roleName}</p>
                              )}
                              <p className="text-xs text-neutral-400 mt-0.5">
                                {formatDate(req.project.startDate)} – {formatDate(req.project.endDate)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {req.rateOffered && (
                              <span className="text-sm font-bold text-neutral-900">{formatPaise(req.rateOffered)}</span>
                            )}
                            <span className="text-[11px] px-2.5 py-1 rounded-full font-semibold bg-[#FEF3C7] text-[#92400E] flex items-center gap-1">
                              <FaClock className="w-2.5 h-2.5" /> Cancel Requested
                            </span>
                          </div>
                        </div>

                        {req.cancelRequestReason && (
                          <div className="rounded-xl bg-[#FFFBEB] border border-[#FDE68A] px-4 py-3 mb-4">
                            <p className="text-xs font-semibold text-[#92400E] mb-0.5">Reason given:</p>
                            <p className="text-xs text-[#78350F] leading-relaxed">{req.cancelRequestReason}</p>
                          </div>
                        )}

                        {req.cancelRequestedAt && (
                          <p className="text-xs text-neutral-400 mb-3">Requested on {formatDate(req.cancelRequestedAt)}</p>
                        )}

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => respond(req.id, true)}
                            disabled={!!isActioning}
                            className="rounded-xl px-4 py-2 bg-red-500 text-white text-xs font-semibold hover:bg-red-600 flex items-center gap-1.5 transition-colors disabled:opacity-50"
                          >
                            <FaCircleCheck className="w-3 h-3" />
                            {actioning === req.id + 'accept' ? 'Approving…' : 'Approve Cancellation'}
                          </button>
                          <button
                            type="button"
                            onClick={() => respond(req.id, false)}
                            disabled={!!isActioning}
                            className="rounded-xl px-4 py-2 border border-neutral-300 text-neutral-700 text-xs font-semibold hover:bg-neutral-50 flex items-center gap-1.5 transition-colors disabled:opacity-50"
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
