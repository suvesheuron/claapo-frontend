import { useEffect, useState, useCallback } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import {
  FaArrowLeft, FaUsers, FaTruck, FaLock, FaUnlock, FaHouse, FaFolder,
  FaTrash, FaBan, FaMessage, FaFileInvoice, FaMagnifyingGlass, FaUser,
  FaCalendar, FaTriangleExclamation, FaPeopleGroup,
} from 'react-icons/fa6';
import DashboardHeader from '../../components/DashboardHeader';
import DashboardSidebar from '../../components/DashboardSidebar';
import AppFooter from '../../components/AppFooter';
import Avatar from '../../components/Avatar';
import { api, ApiException } from '../../services/api';
import toast from 'react-hot-toast';
import { formatBudgetCompact } from '../../utils/currency';

interface Project {
  id: string;
  title: string;
  status: string;
  startDate: string;
  endDate: string;
  budgetMin?: number | null;
  budgetMax?: number | null;
  locationCity?: string | null;
  roles?: Array<{ id: string; roleName: string; qty: number }>;
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
}

const navLinks = [
  { icon: FaHouse,           label: 'Dashboard',    to: '/dashboard' },
  { icon: FaCalendar,        label: 'Availability', to: '/dashboard/company-availability' },
  { icon: FaFolder,          label: 'Projects',     to: '/dashboard/projects' },
  { icon: FaFolder,          label: 'Past Projects', to: '/dashboard/company-past-projects' },
  { icon: FaMagnifyingGlass, label: 'Search',       to: '/dashboard/search' },
  { icon: FaMessage,         label: 'Chat',         to: '/dashboard/conversations' },
  { icon: FaPeopleGroup,     label: 'Team',         to: '/dashboard/team' },
  { icon: FaUser,            label: 'Profile',      to: '/dashboard/company-profile' },
];

function formatDateRange(start: string, end: string): string {
  const s = new Date(start);
  const e = new Date(end);
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  if (s.getFullYear() === e.getFullYear()) {
    return `${months[s.getMonth()]} ${s.getDate()}–${months[e.getMonth()]} ${e.getDate()}, ${s.getFullYear()}`;
  }
  return `${months[s.getMonth()]} ${s.getDate()}, ${s.getFullYear()} – ${months[e.getMonth()]} ${e.getDate()}, ${e.getFullYear()}`;
}

const ACTIVE_STATUSES = ['pending', 'accepted', 'locked'];

export default function ProjectDetail() {
  const { id: projectId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [project, setProject] = useState<Project | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loadingProject, setLoadingProject] = useState(true);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [projectError, setProjectError] = useState<string | null>(null);

  const [lockingAll, setLockingAll] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [cancellingBookingId, setCancellingBookingId] = useState<string | null>(null);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [confirmDeleteProject, setConfirmDeleteProject] = useState(false);
  const [deletingProject, setDeletingProject] = useState(false);

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

  useEffect(() => {
    document.title = 'Project Details – CrewCall';
    loadProject();
    loadBookings();
  }, [loadProject, loadBookings]);

  const crewBookings   = bookings.filter((b) => b.target.role === 'individual');
  const vendorBookings = bookings.filter((b) => b.target.role === 'vendor');
  const allLocked      = bookings.length > 0 && bookings.every((b) => b.status === 'locked');
  const canDeleteProject = project && (project.status === 'draft' || project.status === 'cancelled');

  const totalBudget = project?.budgetMax ?? project?.budgetMin ?? 0;
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
      await Promise.all(accepted.map((b) => api.patch(`/bookings/${b.id}/lock`, {})));
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
      await api.patch(`/bookings/${bookingId}/cancel`, {});
      toast.success('Booking cancelled.');
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
      navigate('/dashboard/projects');
    } catch (err) {
      toast.error(err instanceof ApiException ? err.payload.message : 'Failed to delete project.');
    } finally {
      setDeletingProject(false);
    }
  };

  const getMemberName = (b: Booking) =>
    b.target.individualProfile?.displayName ??
    b.target.vendorProfile?.companyName ??
    b.target.email;

  const statusBadge = (status: string) => {
    if (status === 'locked')   return <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#DCFCE7] text-[#15803D]">Locked</span>;
    if (status === 'accepted') return <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#DBEAFE] text-[#1D4ED8]">Accepted</span>;
    return <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#FEF9E6] text-[#92400E]">Pending</span>;
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-[#F3F4F6] w-full">
      <DashboardHeader />

      <div className="flex-1 flex min-h-0 overflow-hidden">
        <DashboardSidebar links={navLinks} />

        <main className="flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden">
          <div className="flex-1 min-h-0 overflow-auto">
            <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-6 xl:px-8 py-5">

              <Link to="/dashboard/projects" className="inline-flex items-center gap-2 text-neutral-500 hover:text-[#3678F1] mb-5 text-sm transition-colors">
                <FaArrowLeft className="w-3.5 h-3.5" />
                Back to Projects
              </Link>

              {projectError && (
                <div className="flex items-center gap-3 rounded-2xl bg-red-50 border border-red-200 p-4 mb-5">
                  <FaTriangleExclamation className="text-red-500 shrink-0" />
                  <p className="text-sm text-red-700">{projectError}</p>
                </div>
              )}

              {loadingProject ? (
                <div className="animate-pulse mb-6">
                  <div className="h-6 bg-neutral-200 rounded w-1/3 mb-2" />
                  <div className="h-4 bg-neutral-100 rounded w-1/4" />
                </div>
              ) : project ? (
                <div className="flex items-start justify-between gap-4 mb-6">
                  <div>
                    <h1 className="text-xl font-bold text-neutral-900">{project.title}</h1>
                    <p className="text-sm text-neutral-500 mt-0.5">
                      {formatDateRange(project.startDate, project.endDate)}
                      {project.budgetMax ? ` · Budget: ${formatBudgetCompact(project.budgetMax)}` : project.budgetMin ? ` · Budget: ${formatBudgetCompact(project.budgetMin)}` : ''}
                      {project.locationCity ? ` · ${project.locationCity}` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {canDeleteProject && (
                      <button type="button" onClick={() => setConfirmDeleteProject(true)}
                        className="rounded-xl px-4 py-2 border border-[#FEE2E2] text-[#B91C1C] text-sm font-semibold hover:bg-[#FEE2E2] flex items-center gap-2 transition-colors">
                        <FaTrash className="w-3.5 h-3.5" /> Delete
                      </button>
                    )}
                    {!allLocked ? (
                      <button onClick={handleLockAll} disabled={lockingAll}
                        className="rounded-xl px-4 py-2 bg-[#3678F1] text-white text-sm font-semibold hover:bg-[#2563d4] flex items-center gap-2 transition-colors disabled:opacity-50">
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

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Crew */}
                <div className="rounded-2xl bg-white border border-neutral-200 p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-[#EEF4FF] flex items-center justify-center">
                        <FaUsers className="text-[#3678F1] text-sm" />
                      </div>
                      <h2 className="text-sm font-bold text-neutral-900">
                        Crew ({crewBookings.length})
                      </h2>
                    </div>
                    <Link to="/dashboard/search" className="text-xs text-[#3678F1] hover:underline font-medium">+ Add Crew</Link>
                  </div>

                  {loadingBookings ? (
                    <div className="space-y-2">
                      {[1, 2].map((i) => <div key={i} className="h-14 rounded-xl bg-neutral-100 animate-pulse" />)}
                    </div>
                  ) : crewBookings.length === 0 ? (
                    <div className="text-center py-8">
                      <FaUsers className="text-neutral-300 text-2xl mx-auto mb-2" />
                      <p className="text-sm text-neutral-500">No crew members assigned</p>
                      <Link to="/dashboard/search" className="text-xs text-[#3678F1] hover:underline mt-1 inline-block">Search for crew</Link>
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
                              {cancelError && <p className="text-xs text-red-600 mb-2">{cancelError}</p>}
                              <div className="flex gap-2">
                                <button onClick={() => handleCancelBooking(booking.id)}
                                  className="px-3 py-1.5 bg-[#F40F02] text-white text-xs font-semibold rounded-lg hover:bg-red-700 transition-colors">
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
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                {statusBadge(booking.status)}
                                <Link to={`/dashboard/chat/${booking.target.id}`} title="Chat"
                                  className="w-7 h-7 rounded-lg bg-[#F3F4F6] flex items-center justify-center text-neutral-500 hover:bg-[#EEF4FF] hover:text-[#3678F1] transition-colors">
                                  <FaMessage className="text-xs" />
                                </Link>
                                {booking.status === 'locked' && (
                                  <Link to="/dashboard/invoices" title="View Invoices"
                                    className="w-7 h-7 rounded-lg bg-[#F3F4F6] flex items-center justify-center text-neutral-500 hover:bg-[#EEF4FF] hover:text-[#3678F1] transition-colors">
                                    <FaFileInvoice className="text-xs" />
                                  </Link>
                                )}
                                {booking.status !== 'locked' && (
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
                <div className="rounded-2xl bg-white border border-neutral-200 p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-[#FEF9E6] flex items-center justify-center">
                        <FaTruck className="text-[#F4C430] text-sm" />
                      </div>
                      <h2 className="text-sm font-bold text-neutral-900">
                        Vendors ({vendorBookings.length})
                      </h2>
                    </div>
                    <Link to="/dashboard/search?type=vendors" className="text-xs text-[#3678F1] hover:underline font-medium">+ Add Vendor</Link>
                  </div>

                  {loadingBookings ? (
                    <div className="space-y-2">
                      {[1, 2].map((i) => <div key={i} className="h-14 rounded-xl bg-neutral-100 animate-pulse" />)}
                    </div>
                  ) : vendorBookings.length === 0 ? (
                    <div className="text-center py-8">
                      <FaTruck className="text-neutral-300 text-2xl mx-auto mb-2" />
                      <p className="text-sm text-neutral-500">No vendors assigned</p>
                      <Link to="/dashboard/search?type=vendors" className="text-xs text-[#3678F1] hover:underline mt-1 inline-block">Search for vendors</Link>
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
                              {cancelError && <p className="text-xs text-red-600 mb-2">{cancelError}</p>}
                              <div className="flex gap-2">
                                <button onClick={() => handleCancelBooking(booking.id)}
                                  className="px-3 py-1.5 bg-[#F40F02] text-white text-xs font-semibold rounded-lg hover:bg-red-700 transition-colors">
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
                              <div className="w-9 h-9 rounded-xl bg-[#EEF4FF] flex items-center justify-center shrink-0">
                                <FaTruck className="text-[#3678F1] text-xs" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-neutral-900 truncate">{getMemberName(booking)}</p>
                                <p className="text-[11px] text-neutral-500">
                                  {booking.projectRole?.roleName ?? 'Vendor'}
                                  {booking.rateOffered ? ` · ₹${(booking.rateOffered / 100).toLocaleString('en-IN')}/day` : ''}
                                </p>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                {statusBadge(booking.status)}
                                <Link to={`/dashboard/chat/${booking.target.id}`} title="Chat"
                                  className="w-7 h-7 rounded-lg bg-[#F3F4F6] flex items-center justify-center text-neutral-500 hover:bg-[#EEF4FF] hover:text-[#3678F1] transition-colors">
                                  <FaMessage className="text-xs" />
                                </Link>
                                <Link to="/dashboard/invoices" title="View Invoices"
                                  className="w-7 h-7 rounded-lg bg-[#F3F4F6] flex items-center justify-center text-neutral-500 hover:bg-[#EEF4FF] hover:text-[#3678F1] transition-colors">
                                  <FaFileInvoice className="text-xs" />
                                </Link>
                                {booking.status !== 'locked' && (
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
                <div className="rounded-2xl bg-white border border-neutral-200 p-5 mt-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-neutral-900">Budget Summary</h3>
                    <Link to="/dashboard/invoices" className="flex items-center gap-1.5 text-xs text-[#3678F1] font-semibold hover:underline">
                      <FaFileInvoice className="w-3 h-3" /> View Invoices
                    </Link>
                  </div>
                  {loadingBookings ? (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {[1,2,3,4].map((i) => <div key={i} className="h-16 rounded-xl bg-neutral-100 animate-pulse" />)}
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {[
                        { label: 'Total Budget', value: totalBudget ? formatBudgetCompact(totalBudget) : '—', color: 'text-neutral-900' },
                        { label: 'Crew Cost',    value: crewCost   ? formatBudgetCompact(crewCost)    : '—', color: 'text-[#3678F1]' },
                        { label: 'Vendor Cost',  value: vendorCost ? formatBudgetCompact(vendorCost)  : '—', color: 'text-[#F4C430]' },
                        { label: 'Remaining',    value: totalBudget ? formatBudgetCompact(remaining)  : '—', color: remaining >= 0 ? 'text-[#22C55E]' : 'text-red-500' },
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
          <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setConfirmDeleteProject(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
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
                  className="flex-1 rounded-xl py-2.5 bg-red-500 text-white text-sm font-semibold hover:bg-red-600 disabled:opacity-50 flex items-center justify-center gap-2">
                  <FaTrash className="w-3 h-3" /> {deletingProject ? 'Deleting…' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
