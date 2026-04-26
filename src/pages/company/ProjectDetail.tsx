import { useEffect, useState, useCallback } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import {
  FaArrowLeft, FaUsers, FaTruck, FaLock, FaUnlock,
  FaTrash, FaBan, FaMessage, FaFileInvoice,
  FaTriangleExclamation, FaPenToSquare, FaCircleCheck,
} from 'react-icons/fa6';
import DashboardHeader from '../../components/DashboardHeader';
import DashboardSidebar from '../../components/DashboardSidebar';
import AppFooter from '../../components/AppFooter';
import Avatar from '../../components/Avatar';
import { api, ApiException } from '../../services/api';
import toast from 'react-hot-toast';
import { formatBudgetCompact } from '../../utils/currency';
import { companyNavLinks } from '../../navigation/dashboardNav';

interface Project {
  id: string;
  title: string;
  status: string;
  startDate: string;
  endDate: string;
  shootDates?: string[];
  shootLocations?: string[];
  budget?: number | null;
  /** Snake_case from API */
  budget_min?: number | null;
  budget_max?: number | null;
  budgetMin?: number | null;
  budgetMax?: number | null;
  locationCity?: string | null;
  roles?: Array<{ id: string; roleName: string; qty: number }>;
}

/** Total budget from project (supports camelCase or snake_case from API) */
function getProjectTotalBudget(p: Project | null | undefined): number {
  if (!p) return 0;
  // Check all possible budget field names
  const max = p.budgetMax ?? p.budget_max;
  const min = p.budgetMin ?? p.budget_min;
  const single = p.budget;
  const num = (typeof max === 'number' && max > 0 ? max : undefined) ?? 
              (typeof min === 'number' && min > 0 ? min : undefined) ?? 
              (typeof single === 'number' && single > 0 ? single : undefined);
  return typeof num === 'number' ? num : 0;
}

interface BookingTarget {
  id: string;
  email: string;
  role: string;
  individualProfile?: { displayName?: string } | null;
  vendorProfile?: { companyName?: string } | null;
}

interface Booking {
  id: string;
  projectId: string;
  status: string;
  rateOffered?: number | null;
  target: BookingTarget;
  projectRole?: { roleName: string } | null;
  shootDates?: string[];
  shootLocations?: string[];
  shootDateLocations?: Array<{ date: string; location: string }> | null;
}

interface SubUserAssignment {
  id: string;
  subUserId: string;
  accountUserId: string;
  projectId: string;
  createdAt: string;
  subUser: {
    id: string;
    email: string;
    displayName?: string | null;
    individualProfile?: { displayName?: string } | null;
    companyProfile?: { companyName?: string } | null;
  };
}

function formatDateRange(start: string, end: string): string {
  const s = new Date(start);
  const e = new Date(end);
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  if (s.getFullYear() === e.getFullYear()) {
    return `${months[s.getMonth()]} ${s.getDate()}–${months[e.getMonth()]} ${e.getDate()}, ${s.getFullYear()}`;
  }
  return `${months[s.getMonth()]} ${s.getDate()}, ${s.getFullYear()} – ${months[e.getMonth()]} ${e.getDate()}, ${e.getFullYear()}`;
}

function formatDateShort(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function getBookingDateLocationSummary(booking: Booking): string {
  const pairs = booking.shootDateLocations ?? [];
  if (pairs.length > 0) {
    return pairs
      .map((pair) => `${formatDateShort(pair.date)} (${pair.location})`)
      .join(', ');
  }
  const dates = booking.shootDates ?? [];
  const locations = booking.shootLocations ?? [];
  if (dates.length > 0 && locations.length > 0) {
    const fallbackPairs = dates.map((date, idx) => `${formatDateShort(date)} (${locations[idx] ?? locations[0] ?? 'TBD'})`);
    return fallbackPairs.join(', ');
  }
  if (dates.length > 0) return dates.map((d) => formatDateShort(d)).join(', ');
  if (locations.length > 0) return locations.join(', ');
  return '';
}

const ACTIVE_STATUSES = ['pending', 'accepted', 'locked', 'cancel_requested'];

export default function ProjectDetail() {
  const { id: projectId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [project, setProject] = useState<Project | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [subUsers, setSubUsers] = useState<SubUserAssignment[]>([]);
  const [loadingProject, setLoadingProject] = useState(true);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [loadingSubUsers, setLoadingSubUsers] = useState(true);
  const [projectError, setProjectError] = useState<string | null>(null);

  const [lockingAll, setLockingAll] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [cancellingBookingId, setCancellingBookingId] = useState<string | null>(null);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [confirmDeleteProject, setConfirmDeleteProject] = useState(false);
  const [deletingProject, setDeletingProject] = useState(false);
  const [activatingProject, setActivatingProject] = useState(false);
  const [confirmActivateProject, setConfirmActivateProject] = useState(false);
  const [activateError, setActivateError] = useState<string | null>(null);
  const [completingProject, setCompletingProject] = useState(false);
  const [confirmCompleteProject, setConfirmCompleteProject] = useState(false);
  const [completeError, setCompleteError] = useState<string | null>(null);

  const loadProject = useCallback(async () => {
    if (!projectId) return;
    setLoadingProject(true);
    setProjectError(null);
    try {
      const p = await api.get<Project>(`/projects/${projectId}`);
      setProject(p);
    } catch (err) {
      setProjectError(err instanceof ApiException ? err.payload.message : 'Failed to load project.');
    } finally {
      setLoadingProject(false);
    }
  }, [projectId]);

  const loadBookings = useCallback(async () => {
    if (!projectId) return;
    setLoadingBookings(true);
    try {
      const res = await api.get<{ items: Booking[] }>('/bookings/outgoing');
      setBookings(res.items.filter((b) => b.projectId === projectId && ACTIVE_STATUSES.includes(b.status)));
    } catch {
      setBookings([]);
    } finally {
      setLoadingBookings(false);
    }
  }, [projectId]);

  const loadSubUsers = useCallback(async () => {
    if (!projectId) return;
    setLoadingSubUsers(true);
    try {
      const res = await api.get<{ items: SubUserAssignment[] }>(`/projects/${projectId}/sub-users`);
      setSubUsers(res.items ?? []);
    } catch {
      setSubUsers([]);
    } finally {
      setLoadingSubUsers(false);
    }
  }, [projectId]);

  useEffect(() => {
    document.title = 'Project Details – Claapo';
    loadProject();
    loadBookings();
    loadSubUsers();
  }, [loadProject, loadBookings, loadSubUsers]);

  const crewBookings   = bookings.filter((b) => b.target.role === 'individual');
  const vendorBookings = bookings.filter((b) => b.target.role === 'vendor');
  const allLocked      = bookings.length > 0 && bookings.every((b) => b.status === 'locked');
  const canDeleteProject = project && (project.status === 'draft' || project.status === 'cancelled');
  const canActivateProject = project && (project.status === 'draft' || project.status === 'open');
  const canCompleteProject = project && (project.status === 'active' || project.status === 'open') && allLocked;

  const totalBudget = getProjectTotalBudget(project);
  const crewCost    = crewBookings.filter((b) => b.status === 'accepted' || b.status === 'locked').reduce((s, b) => s + (b.rateOffered ?? 0), 0);
  const vendorCost  = vendorBookings.filter((b) => b.status === 'accepted' || b.status === 'locked').reduce((s, b) => s + (b.rateOffered ?? 0), 0);
  const remaining   = totalBudget - crewCost - vendorCost;

  const handleLockAll = async () => {
    if (!projectId) return;
    setLockingAll(true);
    try {
      const accepted = bookings.filter((b) => b.status === 'accepted');
      if (accepted.length === 0) {
        toast.error('No accepted bookings to lock. Crew/vendors must accept their requests first.');
        return;
      }
      const body = project ? { shootDates: (project as Project).shootDates, shootLocations: (project as Project).shootLocations } : {};
      await Promise.all(accepted.map((b) => api.patch(`/bookings/${b.id}/lock`, body)));
      toast.success('Bookings locked.');
      await loadBookings();
    } catch (err) {
      toast.error(err instanceof ApiException ? err.payload.message : 'Could not lock bookings.');
    } finally {
      setLockingAll(false);
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    setCancelError(null);
    try {
      const booking = bookings.find((b) => b.id === bookingId);
      if (!booking) return;
      if (booking.status === 'pending') {
        await api.patch(`/bookings/${bookingId}/cancel`, {});
        toast.success('Booking request cancelled.');
      } else {
        await api.patch(`/bookings/${bookingId}/request-cancel`, {});
        toast.success('Cancellation request sent. Awaiting approval.');
      }
      setCancellingId(null);
      setCancellingBookingId(null);
      await loadBookings();
    } catch (err) {
      const msg = err instanceof ApiException ? err.payload.message : 'Could not cancel booking.';
      toast.error(msg);
      setCancelError(msg);
    }
  };

  const handleDeleteProject = async () => {
    if (!projectId) return;
    setDeletingProject(true);
    try {
      await api.delete(`/projects/${projectId}`);
      setConfirmDeleteProject(false);
      navigate('/projects');
    } catch (err) {
      toast.error(err instanceof ApiException ? err.payload.message : 'Failed to delete project.');
    } finally {
      setDeletingProject(false);
    }
  };

  const handleActivateProject = async () => {
    if (!projectId) return;
    setActivateError(null);
    setActivatingProject(true);
    try {
      await api.patch(`/projects/${projectId}`, { status: 'active' });
      toast.success('Project activated successfully!');
      setConfirmActivateProject(false);
      await loadProject();
    } catch (err) {
      const msg = err instanceof ApiException ? err.payload.message : 'Could not activate project.';
      toast.error(msg);
      setActivateError(msg);
    } finally {
      setActivatingProject(false);
    }
  };

  const handleCompleteProject = async () => {
    if (!projectId) return;
    setCompleteError(null);
    setCompletingProject(true);
    try {
      await api.patch(`/projects/${projectId}`, { status: 'completed' });
      toast.success('Project marked as completed!');
      setConfirmCompleteProject(false);
      await loadProject();
      await loadBookings();
    } catch (err) {
      const msg = err instanceof ApiException ? err.payload.message : 'Could not complete project.';
      toast.error(msg);
      setCompleteError(msg);
    } finally {
      setCompletingProject(false);
    }
  };

  const getMemberName = (b: Booking) =>
    b.target.individualProfile?.displayName ??
    b.target.vendorProfile?.companyName ??
    b.target.email;

  const statusBadge = (status: string) => {
    if (status === 'locked')   return <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#DCFCE7] text-[#15803D]">Locked</span>;
    if (status === 'accepted') return <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#DBEAFE] text-[#1D4ED8]">Accepted</span>;
    if (status === 'cancel_requested') return <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#FEF3C7] text-[#946A00]">Cancel Requested</span>;
    return <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#FEF9E6] text-[#92400E]">Pending</span>;
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-[#F3F4F6] w-full">
      <DashboardHeader />

      <div className="flex-1 flex min-h-0 overflow-hidden">
        <DashboardSidebar links={companyNavLinks} />

        <main className="flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden">
          <div className="flex-1 min-h-0 overflow-auto">
            <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-6 xl:px-8 py-5">

              <Link to="/projects" className="inline-flex items-center gap-2 text-neutral-500 hover:text-[#3678F1] mb-5 text-sm transition-colors">
                <FaArrowLeft className="w-3.5 h-3.5" />
                Back to Projects
              </Link>

              {projectError && (
                <div className="flex items-center gap-3 rounded-2xl bg-[#FEE2E2] border border-[#F40F02]/30 p-4 mb-5">
                  <FaTriangleExclamation className="text-[#F40F02] shrink-0" />
                  <p className="text-sm text-[#991B1B]">{projectError}</p>
                </div>
              )}

              {loadingProject ? (
                <div className="mb-6 space-y-2">
                  <div className="skeleton h-6 w-1/3 rounded-md" />
                  <div className="skeleton h-4 w-1/4 rounded-full" />
                </div>
              ) : project ? (
                <div className="flex items-start justify-between gap-4 mb-6">
                  <div>
                    <h1 className="text-xl font-bold text-neutral-900">{project.title}</h1>
                    <p className="text-sm text-neutral-500 mt-0.5">
                      {formatDateRange(project.startDate, project.endDate)}
                      {getProjectTotalBudget(project) > 0 ? ` · Budget: ${formatBudgetCompact(getProjectTotalBudget(project))}` : ''}
                      {project.locationCity ? ` · ${project.locationCity}` : ''}
                    </p>
                    {(project.shootDates?.length || project.shootLocations?.length) ? (
                      <p className="text-xs text-neutral-500 mt-1">
                        {project.shootDates?.length ? `Project dates: ${project.shootDates.map((d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })).join(', ')}` : ''}
                      </p>
                    ) : null}
                    {project.shootLocations?.length ? (
                      <p className="text-xs text-neutral-500 mt-0.5">
                        Project locations: {project.shootLocations.join(', ')}
                      </p>
                    ) : null}
                    {/* Project Assigned To - Sub-users */}
                    {!loadingSubUsers && subUsers.length > 0 && (
                      <p className="text-xs text-neutral-500 mt-1">
                        <span className="font-medium text-neutral-600">Assigned to:</span>{' '}
                        {subUsers.map((su) => su.subUser.displayName ?? su.subUser.email).join(', ')}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Link
                      to={`/projects/${projectId}/edit`}
                      className="rounded-xl px-4 py-2 border border-neutral-200 text-neutral-800 text-sm font-semibold hover:border-[#3678F1] hover:bg-[#E8F0FE] hover:text-[#3678F1] flex items-center gap-2 transition-colors"
                    >
                      <FaPenToSquare className="w-3.5 h-3.5" /> Edit
                    </Link>
                    {canDeleteProject && (
                      <button type="button" onClick={() => setConfirmDeleteProject(true)}
                        className="rounded-xl px-4 py-2 border border-[#FEE2E2] text-[#991B1B] text-sm font-semibold hover:bg-[#FEE2E2] hover:border-[#F40F02]/30 flex items-center gap-2 transition-colors">
                        <FaTrash className="w-3.5 h-3.5" /> Delete
                      </button>
                    )}
                    {canActivateProject && (
                      <button type="button" onClick={() => setConfirmActivateProject(true)}
                        className="rounded-xl px-4 py-2 bg-[#22C55E] text-white text-sm font-semibold hover:bg-[#16A34A] flex items-center gap-2 transition-colors disabled:opacity-50">
                        <FaUnlock className="w-3.5 h-3.5" />
                        Activate Project
                      </button>
                    )}
                    {!allLocked ? (
                      <button onClick={handleLockAll} disabled={lockingAll}
                        className="rounded-xl px-4 py-2 bg-gradient-to-br from-[#3678F1] to-[#2563EB] text-white text-sm font-semibold hover:from-[#2563EB] hover:to-[#1D4ED8] flex items-center gap-2 transition-colors duration-200 shadow-brand disabled:opacity-50">
                        <FaLock className="w-3.5 h-3.5" />
                        {lockingAll ? 'Locking…' : 'Lock Project'}
                      </button>
                    ) : (
                      <div className="rounded-xl px-4 py-2 bg-[#DCFCE7] text-[#15803D] text-sm font-bold flex items-center gap-2">
                        <FaUnlock className="w-3.5 h-3.5" /> All Locked
                      </div>
                    )}
                  </div>
                </div>
              ) : null}

              {allLocked && (
                <div className="rounded-2xl bg-[#DCFCE7] border border-[#86EFAC] p-4 mb-5 flex items-center gap-3">
                  <FaLock className="text-[#15803D] shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-[#15803D]">Project is locked</p>
                    <p className="text-xs text-[#166534] mt-0.5">All confirmed crew and vendors are locked for this project.</p>
                  </div>
                </div>
              )}

              {canCompleteProject && (
                <div className="rounded-2xl bg-[#E8F0FE] border border-[#3678F1]/20 p-4 mb-5 flex items-center justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="w-10 h-10 rounded-xl bg-white ring-1 ring-[#3678F1]/15 flex items-center justify-center shrink-0">
                      <FaCircleCheck className="text-[#3678F1] text-base" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-[#1E3A8A]">Ready to complete this project?</p>
                      <p className="text-xs text-[#2563EB] mt-0.5">All bookings are locked. Marking as complete will finalize the project and move it to Past Projects.</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setConfirmCompleteProject(true)}
                    className="rounded-xl px-5 py-2.5 bg-gradient-to-br from-[#3678F1] to-[#2563EB] text-white text-sm font-semibold hover:from-[#2563EB] hover:to-[#1D4ED8] flex items-center gap-2 transition-colors duration-200 shadow-brand shrink-0"
                  >
                    <FaCircleCheck className="w-3.5 h-3.5" />
                    Mark as Complete
                  </button>
                </div>
              )}

              <div id="project-bookings" className="grid grid-cols-1 lg:grid-cols-2 gap-5 scroll-mt-24">
                {/* Crew */}
                <div className="rounded-2xl bg-white border border-neutral-200 p-5 hover:border-[#3678F1] transition-colors duration-200">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-[#E8F0FE] ring-1 ring-[#3678F1]/15 flex items-center justify-center">
                        <FaUsers className="text-[#3678F1] text-sm" />
                      </div>
                      <h2 className="text-sm font-bold text-neutral-900">
                        Crew ({crewBookings.length})
                      </h2>
                    </div>
                    <Link to="/search" className="text-xs text-[#3678F1] hover:underline font-medium">+ Add Crew</Link>
                  </div>

                  {loadingBookings ? (
                    <div className="space-y-2">
                      {[1, 2].map((i) => <div key={i} className="skeleton h-14 rounded-xl" />)}
                    </div>
                  ) : crewBookings.length === 0 ? (
                    <div className="text-center py-8">
                      <FaUsers className="text-neutral-300 text-2xl mx-auto mb-2" />
                      <p className="text-sm text-neutral-500">No crew members assigned</p>
                      <Link to="/search" className="text-xs text-[#3678F1] hover:underline mt-1 inline-block">Search for crew</Link>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {crewBookings.map((booking) => (
                        <div key={booking.id} className="rounded-xl border border-neutral-200 p-3 bg-[#FAFAFA]">
                          {cancellingId === booking.id ? (
                            <div>
                              <p className="text-xs text-neutral-700 font-medium mb-2">
                                Cancel booking for <span className="font-bold">{getMemberName(booking)}</span>?
                              </p>
                              {cancelError && <p className="text-xs text-[#F40F02] mb-2">{cancelError}</p>}
                              <div className="flex gap-2">
                                <button onClick={() => handleCancelBooking(booking.id)}
                                  className="px-3 py-1.5 bg-[#F40F02] text-white text-xs font-semibold rounded-lg hover:bg-[#C50C00] transition-colors">
                                  Cancel Booking
                                </button>
                                <button onClick={() => { setCancellingId(null); setCancelError(null); }}
                                  className="px-3 py-1.5 bg-neutral-100 text-neutral-700 text-xs font-semibold rounded-lg hover:bg-neutral-200 transition-colors">
                                  Keep
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-3">
                              <Avatar name={getMemberName(booking)} size="sm" />
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-neutral-900 truncate">{getMemberName(booking)}</p>
                                <p className="text-[11px] text-neutral-500">
                                  {booking.projectRole?.roleName ?? 'Crew'}
                                  {booking.rateOffered ? ` · ₹${(booking.rateOffered / 100).toLocaleString('en-IN')}/day` : ''}
                                </p>
                                {(booking.shootDates?.length || booking.shootLocations?.length || booking.shootDateLocations?.length) ? (
                                  <p className="text-[10px] text-neutral-400 mt-0.5">
                                    {getBookingDateLocationSummary(booking)}
                                  </p>
                                ) : null}
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                {statusBadge(booking.status)}
                                <Link to={`/chat/${booking.target.id}?projectId=${encodeURIComponent(booking.projectId)}`} title="Chat"
                                  className="w-7 h-7 rounded-lg bg-[#F3F4F6] flex items-center justify-center text-neutral-500 hover:bg-[#E8F0FE] hover:text-[#3678F1] transition-colors">
                                  <FaMessage className="text-xs" />
                                </Link>
                                {booking.status === 'locked' && (
                                  <Link to={`/invoices/${booking.projectId}`} title="View Invoices"
                                    className="w-7 h-7 rounded-lg bg-[#F3F4F6] flex items-center justify-center text-neutral-500 hover:bg-[#E8F0FE] hover:text-[#3678F1] transition-colors">
                                    <FaFileInvoice className="text-xs" />
                                  </Link>
                                )}
                                {(booking.status === 'pending' || booking.status === 'accepted') && (
                                  <button type="button" title="Cancel booking" onClick={() => { setCancellingId(booking.id); setCancelError(null); }}
                                    className="w-7 h-7 rounded-lg bg-[#F3F4F6] flex items-center justify-center text-neutral-400 hover:bg-[#FEE2E2] hover:text-[#F40F02] transition-colors">
                                    <FaTrash className="text-xs" />
                                  </button>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Vendors */}
                <div className="rounded-2xl bg-white border border-neutral-200 p-5 hover:border-[#3678F1] transition-colors duration-200">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-[#E8F0FE] ring-1 ring-[#3678F1]/15 flex items-center justify-center">
                        <FaTruck className="text-[#3678F1] text-sm" />
                      </div>
                      <h2 className="text-sm font-bold text-neutral-900">
                        Vendors ({vendorBookings.length})
                      </h2>
                    </div>
                    <Link to="/search?type=vendors" className="text-xs text-[#3678F1] hover:underline font-medium">+ Add Vendor</Link>
                  </div>

                  {loadingBookings ? (
                    <div className="space-y-2">
                      {[1, 2].map((i) => <div key={i} className="skeleton h-14 rounded-xl" />)}
                    </div>
                  ) : vendorBookings.length === 0 ? (
                    <div className="text-center py-8">
                      <FaTruck className="text-neutral-300 text-2xl mx-auto mb-2" />
                      <p className="text-sm text-neutral-500">No vendors assigned</p>
                      <Link to="/search?type=vendors" className="text-xs text-[#3678F1] hover:underline mt-1 inline-block">Search for vendors</Link>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {vendorBookings.map((booking) => (
                        <div key={booking.id} className="rounded-xl border border-neutral-200 p-3 bg-[#FAFAFA]">
                          {cancellingBookingId === booking.id ? (
                            <div>
                              <p className="text-xs text-neutral-700 font-medium mb-2">
                                Cancel booking for <span className="font-bold">{getMemberName(booking)}</span>?
                              </p>
                              {cancelError && <p className="text-xs text-[#F40F02] mb-2">{cancelError}</p>}
                              <div className="flex gap-2">
                                <button onClick={() => handleCancelBooking(booking.id)}
                                  className="px-3 py-1.5 bg-[#F40F02] text-white text-xs font-semibold rounded-lg hover:bg-[#C50C00] transition-colors">
                                  Cancel Booking
                                </button>
                                <button onClick={() => { setCancellingBookingId(null); setCancelError(null); }}
                                  className="px-3 py-1.5 bg-neutral-100 text-neutral-700 text-xs font-semibold rounded-lg hover:bg-neutral-200 transition-colors">
                                  Keep
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-[#E8F0FE] ring-1 ring-[#3678F1]/15 flex items-center justify-center shrink-0">
                                <FaTruck className="text-[#3678F1] text-xs" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-neutral-900 truncate">{getMemberName(booking)}</p>
                                <p className="text-[11px] text-neutral-500">
                                  {booking.projectRole?.roleName ?? 'Vendor'}
                                  {booking.rateOffered ? ` · ₹${(booking.rateOffered / 100).toLocaleString('en-IN')}/day` : ''}
                                </p>
                                {(booking.shootDates?.length || booking.shootLocations?.length || booking.shootDateLocations?.length) ? (
                                  <p className="text-[10px] text-neutral-400 mt-0.5">
                                    {getBookingDateLocationSummary(booking)}
                                  </p>
                                ) : null}
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                {statusBadge(booking.status)}
                                <Link to={`/chat/${booking.target.id}?projectId=${encodeURIComponent(booking.projectId)}`} title="Chat"
                                  className="w-7 h-7 rounded-lg bg-[#F3F4F6] flex items-center justify-center text-neutral-500 hover:bg-[#E8F0FE] hover:text-[#3678F1] transition-colors">
                                  <FaMessage className="text-xs" />
                                </Link>
                                <Link to={`/invoices/${booking.projectId}`} title="View Invoices"
                                  className="w-7 h-7 rounded-lg bg-[#F3F4F6] flex items-center justify-center text-neutral-500 hover:bg-[#E8F0FE] hover:text-[#3678F1] transition-colors">
                                  <FaFileInvoice className="text-xs" />
                                </Link>
                                {(booking.status === 'pending' || booking.status === 'accepted') && (
                                  <button type="button" title="Cancel vendor booking"
                                    onClick={() => { setCancellingBookingId(booking.id); setCancelError(null); }}
                                    className="w-7 h-7 rounded-lg bg-[#F3F4F6] flex items-center justify-center text-neutral-400 hover:bg-[#FEE2E2] hover:text-[#F40F02] transition-colors">
                                    <FaBan className="text-xs" />
                                  </button>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Budget Summary */}
              {project && (
                <div className="rounded-2xl bg-white border border-neutral-200 p-5 mt-5 hover:border-[#3678F1] transition-colors duration-200">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-neutral-900">Budget Summary</h3>
                    <Link to={`/invoices/${project.id}`} className="flex items-center gap-1.5 text-xs text-[#3678F1] font-semibold hover:underline">
                      <FaFileInvoice className="w-3 h-3" /> View Invoices
                    </Link>
                  </div>
                  {loadingBookings ? (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {[1,2,3,4].map((i) => <div key={i} className="skeleton h-16 rounded-xl" />)}
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {[
                        { label: 'Total Budget', value: formatBudgetCompact(totalBudget), color: 'text-neutral-900' },
                        { label: 'Crew Cost',    value: formatBudgetCompact(crewCost),    color: 'text-[#3678F1]' },
                        { label: 'Vendor Cost',  value: formatBudgetCompact(vendorCost),  color: 'text-[#2563EB]' },
                        { label: 'Remaining',    value: formatBudgetCompact(remaining),   color: remaining >= 0 ? 'text-[#22C55E]' : 'text-[#F40F02]' },
                      ].map(({ label, value, color }) => (
                        <div key={label} className="rounded-xl bg-[#F3F4F6] p-3">
                          <p className="text-xs text-neutral-500">{label}</p>
                          <p className={`text-lg font-bold mt-1 ${color}`}>{value}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

            </div>
          </div>

          <AppFooter />
        </main>
      </div>

      {confirmDeleteProject && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40 backdrop-enter" onClick={() => setConfirmDeleteProject(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
              <div className="w-11 h-11 rounded-xl bg-[#FEE2E2] flex items-center justify-center mb-4 border border-[#F40F02]/20">
                <FaTrash className="text-[#F40F02] text-base" />
              </div>
              <h2 className="text-base font-bold text-neutral-900 mb-2">Delete project permanently?</h2>
              <p className="text-sm text-neutral-600 mb-4">
                {project?.title ? `"${project.title}" will be permanently removed.` : 'This project will be permanently removed.'} This cannot be undone.
              </p>
              <div className="flex gap-3">
                <button type="button" onClick={() => setConfirmDeleteProject(false)}
                  className="flex-1 rounded-xl py-2.5 border border-neutral-300 text-neutral-700 text-sm font-medium hover:bg-neutral-50 transition-colors">
                  Keep
                </button>
                <button type="button" disabled={deletingProject} onClick={handleDeleteProject}
                  className="flex-1 rounded-xl py-2.5 bg-[#F40F02] text-white text-sm font-semibold hover:bg-[#C50C00] disabled:opacity-50 flex items-center justify-center gap-2 transition-colors">
                  <FaTrash className="w-3 h-3" /> {deletingProject ? 'Deleting…' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {confirmActivateProject && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40 backdrop-enter" onClick={() => setConfirmActivateProject(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
              <div className="w-11 h-11 rounded-xl bg-[#DCFCE7] flex items-center justify-center mb-4 border border-[#86EFAC]">
                <FaUnlock className="text-[#15803D] text-base" />
              </div>
              <h2 className="text-base font-bold text-neutral-900 mb-2">Activate project?</h2>
              <p className="text-sm text-neutral-600 mb-4">
                {project?.title ? `"${project.title}"` : 'This project'} will become active and visible to all booked crew and vendors. They will be notified about the activation.
              </p>
              {activateError && (
                <div className="flex items-center gap-2 mb-4 p-3 bg-[#FEE2E2] border border-[#F40F02]/30 rounded-xl">
                  <FaTriangleExclamation className="text-[#F40F02] text-xs shrink-0" />
                  <p className="text-xs text-[#991B1B]">{activateError}</p>
                </div>
              )}
              <div className="flex gap-3">
                <button type="button" onClick={() => setConfirmActivateProject(false)}
                  className="flex-1 rounded-xl py-2.5 border border-neutral-300 text-neutral-700 text-sm font-medium hover:bg-neutral-50 transition-colors">
                  Cancel
                </button>
                <button type="button" disabled={activatingProject} onClick={handleActivateProject}
                  className="flex-1 rounded-xl py-2.5 bg-[#22C55E] text-white text-sm font-semibold hover:bg-[#16A34A] disabled:opacity-50 flex items-center justify-center gap-2 transition-colors">
                  <FaUnlock className="w-3 h-3" /> {activatingProject ? 'Activating…' : 'Activate Project'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {confirmCompleteProject && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40 backdrop-enter" onClick={() => setConfirmCompleteProject(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
              <div className="w-11 h-11 rounded-xl bg-[#E8F0FE] flex items-center justify-center mb-4 border border-[#3678F1]/20">
                <FaCircleCheck className="text-[#3678F1] text-base" />
              </div>
              <h2 className="text-base font-bold text-neutral-900 mb-2">Complete project?</h2>
              <p className="text-sm text-neutral-600 mb-2">
                {project?.title ? `"${project.title}"` : 'This project'} will be marked as completed. All booked crew and vendors will be notified, and the project will move to your Past Projects.
              </p>
              <p className="text-xs text-neutral-500 mb-4">
                Invoices can still be created and managed after completion.
              </p>
              {completeError && (
                <div className="flex items-center gap-2 mb-4 p-3 bg-[#FEE2E2] border border-[#F40F02]/30 rounded-xl">
                  <FaTriangleExclamation className="text-[#F40F02] text-xs shrink-0" />
                  <p className="text-xs text-[#991B1B]">{completeError}</p>
                </div>
              )}
              <div className="flex gap-3">
                <button type="button" onClick={() => setConfirmCompleteProject(false)}
                  className="flex-1 rounded-xl py-2.5 border border-neutral-300 text-neutral-700 text-sm font-medium hover:bg-neutral-50 transition-colors">
                  Cancel
                </button>
                <button type="button" disabled={completingProject} onClick={handleCompleteProject}
                  className="flex-1 rounded-xl py-2.5 bg-gradient-to-br from-[#3678F1] to-[#2563EB] text-white text-sm font-semibold hover:from-[#2563EB] hover:to-[#1D4ED8] disabled:opacity-50 flex items-center justify-center gap-2 transition-colors duration-200 shadow-brand">
                  <FaCircleCheck className="w-3 h-3" /> {completingProject ? 'Completing…' : 'Mark as Complete'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
