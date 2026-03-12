import { useEffect, useState } from 'react';
import { FaPlus, FaXmark, FaTriangleExclamation, FaCircleCheck, FaTrash, FaEye, FaEyeSlash, FaPeopleGroup } from 'react-icons/fa6';
import DashboardHeader from '../../components/DashboardHeader';
import DashboardSidebar from '../../components/DashboardSidebar';
import AppFooter from '../../components/AppFooter';
import Avatar from '../../components/Avatar';
import { api, ApiException } from '../../services/api';
import toast from 'react-hot-toast';
import { useApiQuery } from '../../hooks/useApiQuery';
import { toE164India } from '../../utils/phone';
import { companyNavLinks } from '../../navigation/dashboardNav';

interface SubUser { id: string; email: string; phone: string; isActive: boolean; createdAt: string }
interface SubUsersResponse { items: SubUser[] }
interface Project { id: string; title: string }
interface ProjectsResponse { items: Project[] }

export default function TeamPage() {
  useEffect(() => { document.title = 'Team Management – Claapo'; }, []);

  const { data: subUsersData, loading: loadingUsers, refetch: refetchUsers, error: usersError } =
    useApiQuery<SubUsersResponse>('/profile/sub-users/list');

  const { data: projectsData } = useApiQuery<ProjectsResponse>('/projects?limit=100');

  const subUsers = subUsersData?.items ?? [];
  const projects = projectsData?.items ?? [];

  // Create sub-user form
  const [showCreate, setShowCreate] = useState(false);
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
      await api.post('/profile/sub-users', { email: email.trim(), phone: e164Phone, password });
      toast.success('Sub-user created.');
      setCreateSuccess(true);
      setShowCreate(false);
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

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-[#F3F4F6] w-full">
      <DashboardHeader />
      <div className="flex-1 flex min-h-0 overflow-hidden">
        <DashboardSidebar links={companyNavLinks} />
        <main className="flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden">
          <div className="flex-1 min-h-0 overflow-auto">
            <div className="max-w-[900px] mx-auto px-4 sm:px-6 lg:px-8 py-5">

              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-xl font-bold text-neutral-900 flex items-center gap-2">
                    <FaPeopleGroup className="text-[#3678F1]" /> Team Management
                  </h1>
                  <p className="text-sm text-neutral-500 mt-0.5">Create sub-user accounts and assign them to projects</p>
                </div>
                <button
                  type="button"
                  onClick={() => { setShowCreate(true); setCreateError(null); }}
                  className="rounded-xl px-4 py-2.5 bg-[#3678F1] text-white text-sm font-semibold hover:bg-[#2563d4] inline-flex items-center gap-2 transition-colors"
                >
                  <FaPlus className="w-3 h-3" /> Add Sub-User
                </button>
              </div>

              {createSuccess && (
                <div className="flex items-center gap-2 mb-4 p-3 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm font-medium">
                  <FaCircleCheck /> Sub-user created successfully!
                </div>
              )}
              {assignSuccess && (
                <div className="flex items-center gap-2 mb-4 p-3 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm font-medium">
                  <FaCircleCheck /> Project assigned successfully!
                </div>
              )}

              {/* Info card */}
              <div className="rounded-2xl bg-[#EEF4FF] border border-[#BFDBFE] p-4 mb-5">
                <h3 className="text-sm font-bold text-[#1D4ED8] mb-1">How Sub-User IDs work</h3>
                <ul className="text-xs text-[#3678F1] space-y-1">
                  <li>• Sub-users can log in with their own email and password</li>
                  <li>• They can only access projects you assign to them</li>
                  <li>• They cannot see other projects or manage the team</li>
                  <li>• Sub-users inherit your account role (Company/Vendor)</li>
                </ul>
              </div>

              {/* Sub-users list */}
              <div className="rounded-2xl bg-white border border-neutral-200 p-5">
                <h2 className="text-sm font-bold text-neutral-900 mb-4">Sub-Users ({subUsers.length})</h2>

                {usersError && (
                  <div className="flex items-center gap-3 rounded-xl bg-red-50 border border-red-200 p-3 mb-4">
                    <FaTriangleExclamation className="text-red-500 shrink-0" />
                    <p className="text-sm text-red-700">{usersError}</p>
                  </div>
                )}

                {loadingUsers ? (
                  <div className="space-y-3">
                    {[1,2,3].map(i => <div key={i} className="h-16 rounded-xl bg-neutral-100 animate-pulse" />)}
                  </div>
                ) : subUsers.length === 0 ? (
                  <div className="text-center py-10">
                    <div className="w-12 h-12 rounded-full bg-[#F3F4F6] flex items-center justify-center mx-auto mb-3">
                      <FaPeopleGroup className="text-neutral-400 text-lg" />
                    </div>
                    <p className="text-sm font-semibold text-neutral-700 mb-1">No sub-users yet</p>
                    <p className="text-xs text-neutral-400 mb-4">Add team members to collaborate on projects</p>
                    <button
                      type="button"
                      onClick={() => setShowCreate(true)}
                      className="rounded-xl px-4 py-2.5 bg-[#3678F1] text-white text-sm font-semibold hover:bg-[#2563d4] inline-flex items-center gap-2 transition-colors"
                    >
                      <FaPlus className="w-3 h-3" /> Add First Sub-User
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {subUsers.map(u => (
                      <div key={u.id} className="flex items-center gap-4 p-4 rounded-xl border border-neutral-200 bg-[#FAFAFA] hover:border-neutral-300 transition-colors">
                        <Avatar name={u.email} size="md" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-neutral-900 truncate">{u.email}</p>
                          <p className="text-xs text-neutral-500 truncate">{u.phone}</p>
                          <span className={`inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${u.isActive ? 'bg-[#DCFCE7] text-[#15803D]' : 'bg-[#F3F4F6] text-neutral-500'}`}>
                            {u.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button type="button" onClick={() => { setAssigningUser(u); setAssignProjectId(''); setAssignError(null); }}
                            className="rounded-xl px-3 py-2 border border-[#3678F1] text-[#3678F1] text-xs font-semibold hover:bg-[#EEF4FF] transition-colors">
                            Assign Project
                          </button>
                          <button type="button" onClick={() => { setDeletingUser(u); setDeleteError(null); }}
                            className="rounded-xl px-3 py-2 border border-red-200 text-red-600 text-xs font-semibold hover:bg-red-50 transition-colors flex items-center gap-1">
                            <FaTrash className="w-3 h-3" /> Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          <AppFooter />
        </main>
      </div>

      {/* Create Sub-User Modal */}
      {showCreate && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setShowCreate(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-base font-bold text-neutral-900">Add Sub-User</h2>
                <button type="button" onClick={() => setShowCreate(false)} className="w-8 h-8 rounded-lg bg-neutral-100 flex items-center justify-center hover:bg-neutral-200 transition-colors">
                  <FaXmark className="text-neutral-500 text-sm" />
                </button>
              </div>

              {createError && (
                <div className="flex items-center gap-2 mb-4 p-3 bg-red-50 border border-red-200 rounded-xl">
                  <FaTriangleExclamation className="text-red-500 text-xs shrink-0" />
                  <p className="text-xs text-red-700">{createError}</p>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1.5">Email <span className="text-[#F40F02]">*</span></label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="subuser@example.com" disabled={creating}
                    className="w-full px-4 py-2.5 border border-neutral-300 rounded-xl text-sm focus:outline-none focus:border-[#3678F1] focus:bg-white bg-[#F3F4F6] disabled:opacity-50 transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1.5">Phone <span className="text-[#F40F02]">*</span></label>
                  <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+919900112233" disabled={creating}
                    className="w-full px-4 py-2.5 border border-neutral-300 rounded-xl text-sm focus:outline-none focus:border-[#3678F1] focus:bg-white bg-[#F3F4F6] disabled:opacity-50 transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1.5">Password <span className="text-[#F40F02]">*</span></label>
                  <div className="relative">
                    <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min 8 characters" disabled={creating}
                      className="w-full px-4 py-2.5 pr-11 border border-neutral-300 rounded-xl text-sm focus:outline-none focus:border-[#3678F1] focus:bg-white bg-[#F3F4F6] disabled:opacity-50 transition-all" />
                    <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 p-1" aria-label={showPassword ? 'Hide password' : 'Show password'}>
                      {showPassword ? <FaEyeSlash className="w-4 h-4" /> : <FaEye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-5">
                <button type="button" onClick={() => setShowCreate(false)} disabled={creating}
                  className="flex-1 rounded-xl py-2.5 border border-neutral-300 text-neutral-700 text-sm font-medium hover:bg-neutral-50 transition-colors disabled:opacity-50">
                  Cancel
                </button>
                <button type="button" onClick={handleCreate} disabled={creating}
                  className="flex-1 rounded-xl py-2.5 bg-[#3678F1] text-white text-sm font-semibold hover:bg-[#2563d4] transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
                  {creating ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Creating…</> : 'Create Sub-User'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Assign Project Modal */}
      {assigningUser && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setAssigningUser(null)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-base font-bold text-neutral-900">Assign Project</h2>
                <button type="button" onClick={() => setAssigningUser(null)} className="w-8 h-8 rounded-lg bg-neutral-100 flex items-center justify-center hover:bg-neutral-200 transition-colors">
                  <FaXmark className="text-neutral-500 text-sm" />
                </button>
              </div>

              <p className="text-sm text-neutral-600 mb-4">
                Assigning a project to <span className="font-semibold">{assigningUser.email}</span>
              </p>

              {assignError && (
                <div className="flex items-center gap-2 mb-4 p-3 bg-red-50 border border-red-200 rounded-xl">
                  <FaTriangleExclamation className="text-red-500 text-xs shrink-0" />
                  <p className="text-xs text-red-700">{assignError}</p>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1.5">Select Project</label>
                <select value={assignProjectId} onChange={(e) => setAssignProjectId(e.target.value)} disabled={assigning}
                  className="w-full px-4 py-2.5 border border-neutral-300 rounded-xl text-sm focus:outline-none focus:border-[#3678F1] bg-[#F3F4F6] focus:bg-white disabled:opacity-50 transition-all">
                  <option value="">Choose a project…</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                </select>
              </div>

              <div className="flex gap-3 mt-5">
                <button type="button" onClick={() => setAssigningUser(null)} disabled={assigning}
                  className="flex-1 rounded-xl py-2.5 border border-neutral-300 text-neutral-700 text-sm font-medium hover:bg-neutral-50 transition-colors disabled:opacity-50">
                  Cancel
                </button>
                <button type="button" onClick={handleAssign} disabled={assigning || !assignProjectId}
                  className="flex-1 rounded-xl py-2.5 bg-[#3678F1] text-white text-sm font-semibold hover:bg-[#2563d4] transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
                  {assigning ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Assigning…</> : 'Assign'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Delete Sub-User Modal */}
      {deletingUser && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40" onClick={() => !deleting && setDeletingUser(null)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
              <h2 className="text-base font-bold text-neutral-900 mb-2">Remove Sub-User?</h2>
              <p className="text-sm text-neutral-600 mb-4">
                <span className="font-semibold">{deletingUser.email}</span> will no longer be able to log in or access assigned projects. This cannot be undone.
              </p>
              {deleteError && (
                <div className="flex items-center gap-2 mb-4 p-3 bg-red-50 border border-red-200 rounded-xl">
                  <FaTriangleExclamation className="text-red-500 text-xs shrink-0" />
                  <p className="text-xs text-red-700">{deleteError}</p>
                </div>
              )}
              <div className="flex gap-3">
                <button type="button" onClick={() => setDeletingUser(null)} disabled={deleting}
                  className="flex-1 rounded-xl py-2.5 border border-neutral-300 text-neutral-700 text-sm font-medium hover:bg-neutral-50 transition-colors disabled:opacity-50">
                  Cancel
                </button>
                <button type="button" onClick={handleDelete} disabled={deleting}
                  className="flex-1 rounded-xl py-2.5 bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
                  {deleting ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Removing…</> : <><FaTrash className="w-3 h-3" /> Remove</>}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
