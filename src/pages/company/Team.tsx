import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FaPlus, FaXmark, FaTriangleExclamation, FaCircleCheck, FaTrash, FaEye, FaEyeSlash, FaPeopleGroup, FaFolder } from 'react-icons/fa6';
import DashboardHeader from '../../components/DashboardHeader';
import DashboardSidebar from '../../components/DashboardSidebar';
import AppFooter from '../../components/AppFooter';
import Avatar from '../../components/Avatar';
import { api, ApiException } from '../../services/api';
import toast from 'react-hot-toast';
import { useApiQuery } from '../../hooks/useApiQuery';
import { toE164India } from '../../utils/phone';
import { useRole } from '../../contexts/RoleContext';
import { companyNavLinks, vendorNavLinks } from '../../navigation/dashboardNav';

interface SubUser {
  id: string;
  email: string;
  phone: string;
  displayName?: string | null;
  isActive: boolean;
  createdAt: string;
  assignedProjects?: { id: string; title: string }[];
}
interface SubUsersResponse { items: SubUser[] }
interface Project { id: string; title: string }
interface ProjectsResponse { items: Project[] }

export default function TeamPage() {
  useEffect(() => { document.title = 'Team Management – Claapo'; }, []);
  const { currentRole } = useRole();

  const navLinks = currentRole === 'Vendor' ? vendorNavLinks : companyNavLinks;
  const projectsEndpoint =
    currentRole === 'Vendor'
      ? '/projects/my/with-stats?limit=100'
      : '/projects?limit=100';

  const { data: subUsersData, loading: loadingUsers, refetch: refetchUsers, error: usersError } =
    useApiQuery<SubUsersResponse>('/profile/sub-users/list');

  const { data: projectsData } = useApiQuery<ProjectsResponse>(projectsEndpoint);

  const subUsers = subUsersData?.items ?? [];
  const projects = projectsData?.items ?? [];

  // Create sub-user form
  const [showCreate, setShowCreate] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail]       = useState('');
  const [phone, setPhone]       = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createSuccess, setCreateSuccess] = useState(false);

  // Assign project
  const [assigningUser, setAssigningUser] = useState<SubUser | null>(null);
  const [assignProjectId, setAssignProjectId] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [assignError, setAssignError] = useState<string | null>(null);
  const [assignSuccess, setAssignSuccess] = useState(false);

  // Delete sub-user
  const [deletingUser, setDeletingUser] = useState<SubUser | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!email?.trim() || !phone?.trim() || !password) { setCreateError('All fields are required.'); return; }
    const e164Phone = toE164India(phone.trim());
    if (e164Phone.replace(/\D/g, '').length < 10) { setCreateError('Enter a valid 10-digit phone number.'); return; }
    setCreating(true); setCreateError(null);
    try {
      await api.post('/profile/sub-users', { 
        email: email.trim(), 
        displayName: displayName.trim() || undefined,
        phone: e164Phone, 
        password 
      });
      toast.success('Sub-user created.');
      setCreateSuccess(true);
      setShowCreate(false);
      setDisplayName('');
      setEmail(''); setPhone(''); setPassword('');
      refetchUsers();
      setTimeout(() => setCreateSuccess(false), 3000);
    } catch (err) {
      const msg = err instanceof ApiException ? err.payload.message : 'Failed to create sub-user.';
      toast.error(msg);
      setCreateError(msg);
    } finally {
      setCreating(false);
    }
  };

  const handleAssign = async () => {
    if (!assigningUser || !assignProjectId) { setAssignError('Select a project.'); return; }
    setAssigning(true); setAssignError(null);
    try {
      await api.post(`/profile/sub-users/${assigningUser.id}/assign-project`, { projectId: assignProjectId });
      toast.success('Project assigned.');
      setAssignSuccess(true);
      setAssigningUser(null);
      setAssignProjectId('');
      refetchUsers();
      setTimeout(() => setAssignSuccess(false), 3000);
    } catch (err) {
      const msg = err instanceof ApiException ? err.payload.message : 'Failed to assign project.';
      toast.error(msg);
      setAssignError(msg);
    } finally {
      setAssigning(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingUser) return;
    setDeleting(true); setDeleteError(null);
    try {
      await api.delete(`/profile/sub-users/${deletingUser.id}`);
      toast.success('Sub-user removed.');
      setDeletingUser(null);
      refetchUsers();
    } catch (err) {
      const msg = err instanceof ApiException ? err.payload.message : 'Failed to remove sub-user.';
      toast.error(msg);
      setDeleteError(msg);
    } finally {
      setDeleting(false);
    }
  };

  const isMainOnlyRestriction = usersError?.toLowerCase().includes('main') ?? false;

  const modalInputClass = 'w-full px-4 py-2.5 border border-neutral-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#3678F1]/20 focus:border-[#3678F1] disabled:opacity-50 transition-all placeholder:text-neutral-400';

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-[#F3F4F6] w-full">
      <DashboardHeader />
      <div className="flex-1 flex min-h-0 overflow-hidden">
        <DashboardSidebar links={navLinks} />
        <main className="flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden">
          <div className="flex-1 min-h-0 overflow-auto">
            <div className="max-w-[900px] mx-auto px-4 sm:px-6 lg:px-8 py-6">

              {/* Page Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-xl font-bold text-neutral-900 tracking-tight flex items-center gap-2.5">
                    <span className="w-9 h-9 rounded-xl bg-[#E8F0FE] ring-1 ring-[#3678F1]/15 flex items-center justify-center">
                      <FaPeopleGroup className="text-[#3678F1] text-sm" />
                    </span>
                    Team Management
                  </h1>
                  <p className="text-sm text-neutral-500 mt-1.5 ml-[46px]">
                    Create sub-user accounts and assign them to projects
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => { setShowCreate(true); setCreateError(null); }}
                  className="inline-flex items-center gap-2 h-11 px-5 rounded-xl bg-gradient-to-br from-[#3678F1] to-[#2563EB] text-white text-sm font-semibold hover:from-[#2563EB] hover:to-[#1D4ED8] transition-colors shadow-brand"
                >
                  <FaPlus className="w-3 h-3" />
                  <span className="hidden sm:inline">Add Sub-User</span>
                  <span className="sm:hidden">Add</span>
                </button>
              </div>

              {/* Success Alerts */}
              {createSuccess && (
                <div className="flex items-center gap-2.5 mb-4 px-4 py-3 bg-[#DCFCE7] border border-[#22C55E]/30 rounded-xl text-[#15803D] text-sm font-medium">
                  <FaCircleCheck className="shrink-0" /> Sub-user created successfully!
                </div>
              )}
              {assignSuccess && (
                <div className="flex items-center gap-2.5 mb-4 px-4 py-3 bg-[#DCFCE7] border border-[#22C55E]/30 rounded-xl text-[#15803D] text-sm font-medium">
                  <FaCircleCheck className="shrink-0" /> Project assigned successfully!
                </div>
              )}

              {isMainOnlyRestriction && (
                <div className="flex items-center gap-3 rounded-2xl bg-[#E8F0FE] border border-[#3678F1]/20 p-4 mb-5">
                  <div className="w-9 h-9 rounded-xl bg-white/60 flex items-center justify-center shrink-0">
                    <FaTriangleExclamation className="text-[#3678F1] text-sm" />
                  </div>
                  <p className="text-sm text-[#1E3A8A]">
                    Only the main account can manage team members. You are logged in as a sub-user.
                  </p>
                </div>
              )}

              {/* Info card */}
              <div className="rounded-2xl bg-[#F4F8FE] border border-[#3678F1]/15 p-5 mb-5">
                <h3 className="text-sm font-bold text-[#1E3A8A] mb-2.5 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-md bg-white text-[#3678F1] flex items-center justify-center text-[10px] font-bold">i</span>
                  How Sub-User IDs work
                </h3>
                <ul className="text-[13px] text-[#2563EB] space-y-1.5 ml-7">
                  <li className="flex items-start gap-2"><span className="w-1 h-1 rounded-full bg-[#3678F1] mt-1.5 shrink-0" />Sub-users can log in with their own email and password</li>
                  <li className="flex items-start gap-2"><span className="w-1 h-1 rounded-full bg-[#3678F1] mt-1.5 shrink-0" />They can only access projects you assign to them</li>
                  <li className="flex items-start gap-2"><span className="w-1 h-1 rounded-full bg-[#3678F1] mt-1.5 shrink-0" />They cannot see other projects or manage the team</li>
                  <li className="flex items-start gap-2"><span className="w-1 h-1 rounded-full bg-[#3678F1] mt-1.5 shrink-0" />Sub-users inherit your account role (Company/Vendor)</li>
                </ul>
              </div>

              {/* Sub-users list */}
              <div className="rounded-2xl bg-white border border-neutral-200/70 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-neutral-100 flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
                      <span className="w-1 h-4 rounded-full bg-[#3678F1]" />
                      Sub-Users
                    </h2>
                    <p className="text-xs text-neutral-400 mt-0.5 ml-3">
                      {subUsers.length} team member{subUsers.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>

                <div className="p-5">
                  {usersError && (
                    <div className="flex items-center gap-3 rounded-xl bg-[#FEEBEA] border border-[#F40F02]/30 p-3 mb-4">
                      <FaTriangleExclamation className="text-[#F40F02] shrink-0 text-sm" />
                      <p className="text-sm text-[#991B1B]">{usersError}</p>
                    </div>
                  )}

                  {loadingUsers ? (
                    <div className="space-y-3">
                      {[1,2,3].map(i => <div key={i} className="skeleton h-[88px] rounded-xl" />)}
                    </div>
                  ) : !isMainOnlyRestriction && subUsers.length === 0 ? (
                    <div className="text-center py-14">
                      <div className="w-16 h-16 rounded-2xl bg-[#E8F0FE] ring-1 ring-[#3678F1]/15 flex items-center justify-center mx-auto mb-4">
                        <FaPeopleGroup className="text-[#3678F1] text-xl" />
                      </div>
                      <p className="text-sm font-bold text-neutral-900 mb-1">No sub-users yet</p>
                      <p className="text-sm text-neutral-500 mb-5 max-w-xs mx-auto">
                        Add team members to collaborate on your projects together
                      </p>
                      <button
                        type="button"
                        onClick={() => setShowCreate(true)}
                        className="inline-flex items-center gap-2 h-10 px-5 rounded-xl bg-gradient-to-br from-[#3678F1] to-[#2563EB] text-white text-sm font-semibold hover:from-[#2563EB] hover:to-[#1D4ED8] transition-colors shadow-brand"
                      >
                        <FaPlus className="w-3 h-3" /> Add First Sub-User
                      </button>
                    </div>
                  ) : isMainOnlyRestriction ? (
                    <div className="text-center py-14">
                      <div className="w-16 h-16 rounded-2xl bg-neutral-100 flex items-center justify-center mx-auto mb-4">
                        <FaPeopleGroup className="text-neutral-400 text-xl" />
                      </div>
                      <p className="text-sm text-neutral-500">
                        You need to log in with the main account to view and manage sub-users.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {subUsers.map(u => {
                        const assigned = u.assignedProjects ?? [];
                        return (
                          <div
                            key={u.id}
                            className="flex flex-col sm:flex-row sm:items-stretch gap-4 p-4 rounded-xl border border-neutral-200/70 bg-white hover:border-[#3678F1] transition-colors duration-200"
                          >
                            <div className="flex gap-4 flex-1 min-w-0">
                              <Avatar name={u.displayName ?? u.email} size="md" />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="text-sm font-bold text-neutral-900 truncate">{u.displayName ?? u.email}</p>
                                  <span className={`inline-flex items-center gap-1.5 h-5 px-2 rounded-full text-[10px] font-bold tracking-wide ${
                                    u.isActive
                                      ? 'bg-[#DCFCE7] text-[#15803D]'
                                      : 'bg-[#F3F4F6] text-neutral-500'
                                  }`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${u.isActive ? 'bg-[#22C55E]' : 'bg-neutral-400'}`} />
                                    {u.isActive ? 'Active' : 'Inactive'}
                                  </span>
                                </div>
                                <p className="text-xs text-neutral-500 truncate mt-0.5">{u.phone}</p>
                                <div className="mt-3">
                                  <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                                    <FaFolder className="w-3 h-3" /> Assigned projects
                                  </p>
                                  {assigned.length === 0 ? (
                                    <p className="text-xs text-neutral-400">
                                      None yet — use Assign Project to grant access.
                                    </p>
                                  ) : (
                                    <ul className="flex flex-wrap gap-1.5">
                                      {assigned.map((proj) => (
                                        <li key={proj.id}>
                                          {currentRole === 'Vendor' ? (
                                            <Link
                                              to={`/conversations/${proj.id}`}
                                              className="inline-flex items-center gap-1 rounded-lg px-2 py-1 bg-[#E8F0FE] text-[11px] font-semibold text-[#2563EB] hover:bg-[#DBEAFE] transition-colors max-w-[220px]"
                                              title={proj.title}
                                            >
                                              <span className="truncate">{proj.title}</span>
                                            </Link>
                                          ) : (
                                            <Link
                                              to={`/projects/${proj.id}`}
                                              className="inline-flex items-center gap-1 rounded-lg px-2 py-1 bg-[#E8F0FE] text-[11px] font-semibold text-[#2563EB] hover:bg-[#DBEAFE] transition-colors max-w-[220px]"
                                              title={proj.title}
                                            >
                                              <span className="truncate">{proj.title}</span>
                                            </Link>
                                          )}
                                        </li>
                                      ))}
                                    </ul>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end sm:flex-col sm:justify-center sm:items-stretch pt-3 sm:pt-0 border-t sm:border-t-0 border-neutral-100">
                              <button
                                type="button"
                                onClick={() => { setAssigningUser(u); setAssignProjectId(''); setAssignError(null); }}
                                className="inline-flex items-center justify-center h-9 px-3 rounded-xl border border-neutral-200 text-[#3678F1] text-xs font-semibold hover:border-[#3678F1] hover:bg-[#F4F8FE] transition-colors sm:w-full"
                                title="Assign Project"
                              >
                                <span className="hidden sm:inline">Assign Project</span>
                                <span className="sm:hidden">Assign</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => { setDeletingUser(u); setDeleteError(null); }}
                                className="inline-flex items-center justify-center gap-1.5 h-9 px-3 rounded-xl border border-neutral-200 text-[#F40F02] text-xs font-semibold hover:border-[#F40F02] hover:bg-[#FEEBEA] transition-colors sm:w-full"
                                title="Remove"
                              >
                                <FaTrash className="w-3 h-3" /> <span className="hidden sm:inline">Remove</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          <AppFooter />
        </main>
      </div>

      {/* Create Sub-User Modal */}
      {showCreate && (
        <>
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40" onClick={() => setShowCreate(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl border border-neutral-200/60 w-full max-w-md overflow-hidden">
              <div className="px-6 py-4 border-b border-neutral-100 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-neutral-900">Add Sub-User</h2>
                  <p className="text-xs text-neutral-400 mt-0.5">Create a new team member account</p>
                </div>
                <button type="button" onClick={() => setShowCreate(false)} className="w-8 h-8 rounded-lg bg-neutral-100 flex items-center justify-center hover:bg-neutral-200 transition-colors">
                  <FaXmark className="text-neutral-500 text-sm" />
                </button>
              </div>

              <div className="p-6">
                {createError && (
                  <div className="flex items-center gap-2.5 mb-4 p-3 bg-[#FEEBEA] border border-[#F40F02]/30 rounded-xl">
                    <FaTriangleExclamation className="text-[#F40F02] text-xs shrink-0" />
                    <p className="text-sm text-[#991B1B]">{createError}</p>
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1.5">Name</label>
                    <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="John Doe (optional)" disabled={creating}
                      className={modalInputClass} />
                    <p className="text-[10px] text-neutral-400 mt-1">This name will be shown in chats and project details</p>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1.5">Email <span className="text-[#F40F02]">*</span></label>
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="subuser@example.com" disabled={creating}
                      className={modalInputClass} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1.5">Phone <span className="text-[#F40F02]">*</span></label>
                    <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+919900112233" disabled={creating}
                      className={modalInputClass} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1.5">Password <span className="text-[#F40F02]">*</span></label>
                    <div className="relative">
                      <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min 8 characters" disabled={creating}
                        className={`${modalInputClass} pr-11`} />
                      <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 p-1 rounded-md hover:bg-neutral-100 transition-colors" aria-label={showPassword ? 'Hide password' : 'Show password'}>
                        {showPassword ? <FaEyeSlash className="w-4 h-4" /> : <FaEye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 border-t border-neutral-100 bg-neutral-50/50 flex gap-3">
                <button type="button" onClick={() => setShowCreate(false)} disabled={creating}
                  className="flex-1 rounded-xl py-2.5 border border-neutral-200 text-neutral-700 text-sm font-medium hover:bg-neutral-100 transition-colors disabled:opacity-50">
                  Cancel
                </button>
                <button type="button" onClick={handleCreate} disabled={creating}
                  className="flex-1 rounded-xl py-2.5 bg-gradient-to-br from-[#3678F1] to-[#2563EB] text-white text-sm font-semibold hover:from-[#2563EB] hover:to-[#1D4ED8] transition-colors disabled:opacity-60 flex items-center justify-center gap-2 shadow-brand">
                  {creating ? <><span className="w-4 h-4 border-[2.5px] border-white/40 border-t-white border-r-white rounded-full animate-spin" />Creating…</> : 'Create Sub-User'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Assign Project Modal */}
      {assigningUser && (
        <>
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40" onClick={() => setAssigningUser(null)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl border border-neutral-200/60 w-full max-w-md overflow-hidden">
              <div className="px-6 py-4 border-b border-neutral-100 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-neutral-900">Assign Project</h2>
                  <p className="text-xs text-neutral-400 mt-0.5">Select a project for this team member</p>
                </div>
                <button type="button" onClick={() => setAssigningUser(null)} className="w-8 h-8 rounded-lg bg-neutral-100 flex items-center justify-center hover:bg-neutral-200 transition-colors">
                  <FaXmark className="text-neutral-500 text-sm" />
                </button>
              </div>

              <div className="p-6">
                <div className="flex items-center gap-3 mb-5 p-3 rounded-xl bg-neutral-50 border border-neutral-100">
                  <Avatar name={assigningUser.displayName ?? assigningUser.email} size="sm" />
                  <span className="text-sm font-semibold text-neutral-800 truncate">{assigningUser.displayName ?? assigningUser.email}</span>
                </div>

                {assignError && (
                  <div className="flex items-center gap-2.5 mb-4 p-3 bg-[#FEEBEA] border border-[#F40F02]/30 rounded-xl">
                    <FaTriangleExclamation className="text-[#F40F02] text-xs shrink-0" />
                    <p className="text-sm text-[#991B1B]">{assignError}</p>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1.5">Select Project</label>
                  <select value={assignProjectId} onChange={(e) => setAssignProjectId(e.target.value)} disabled={assigning}
                    className={modalInputClass}>
                    <option value="">Choose a project...</option>
                    {projects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                  </select>
                </div>
              </div>

              <div className="px-6 py-4 border-t border-neutral-100 bg-neutral-50/50 flex gap-3">
                <button type="button" onClick={() => setAssigningUser(null)} disabled={assigning}
                  className="flex-1 rounded-xl py-2.5 border border-neutral-200 text-neutral-700 text-sm font-medium hover:bg-neutral-100 transition-colors disabled:opacity-50">
                  Cancel
                </button>
                <button type="button" onClick={handleAssign} disabled={assigning || !assignProjectId}
                  className="flex-1 rounded-xl py-2.5 bg-gradient-to-br from-[#3678F1] to-[#2563EB] text-white text-sm font-semibold hover:from-[#2563EB] hover:to-[#1D4ED8] transition-colors disabled:opacity-60 flex items-center justify-center gap-2 shadow-brand">
                  {assigning ? <><span className="w-4 h-4 border-[2.5px] border-white/40 border-t-white border-r-white rounded-full animate-spin" />Assigning…</> : 'Assign'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Delete Sub-User Modal */}
      {deletingUser && (
        <>
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40" onClick={() => !deleting && setDeletingUser(null)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl border border-neutral-200/60 w-full max-w-sm overflow-hidden">
              <div className="p-6">
                <div className="w-12 h-12 rounded-2xl bg-[#FEEBEA] ring-1 ring-[#F40F02]/20 flex items-center justify-center mx-auto mb-4">
                  <FaTrash className="text-[#F40F02]" />
                </div>
                <h2 className="text-base font-bold text-neutral-900 mb-2 text-center">Remove Sub-User?</h2>
                <p className="text-sm text-neutral-600 text-center leading-relaxed">
                  <span className="font-semibold">{deletingUser.email}</span> will no longer be able to log in or access assigned projects. This cannot be undone.
                </p>
              </div>
              {deleteError && (
                <div className="mx-6 mb-4 flex items-center gap-2.5 p-3 bg-[#FEEBEA] border border-[#F40F02]/30 rounded-xl">
                  <FaTriangleExclamation className="text-[#F40F02] text-xs shrink-0" />
                  <p className="text-sm text-[#991B1B]">{deleteError}</p>
                </div>
              )}
              <div className="px-6 py-4 border-t border-neutral-100 bg-neutral-50/50 flex gap-3">
                <button type="button" onClick={() => setDeletingUser(null)} disabled={deleting}
                  className="flex-1 rounded-xl py-2.5 border border-neutral-200 text-neutral-700 text-sm font-medium hover:bg-neutral-100 transition-colors disabled:opacity-50">
                  Cancel
                </button>
                <button type="button" onClick={handleDelete} disabled={deleting}
                  className="flex-1 rounded-xl py-2.5 bg-[#F40F02] text-white text-sm font-semibold hover:bg-[#C20D02] transition-colors disabled:opacity-60 flex items-center justify-center gap-2 shadow-sm shadow-[#F40F02]/15">
                  {deleting ? <><span className="w-4 h-4 border-[2.5px] border-white/40 border-t-white border-r-white rounded-full animate-spin" />Removing…</> : <><FaTrash className="w-3 h-3" /> Remove</>}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
