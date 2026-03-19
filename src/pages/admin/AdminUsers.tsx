import { useEffect, useState, useCallback } from 'react';
import { FaUsers, FaMagnifyingGlass, FaCheck, FaToggleOn, FaToggleOff } from 'react-icons/fa6';
import toast from 'react-hot-toast';
import DashboardHeader from '../../components/DashboardHeader';
import DashboardSidebar from '../../components/DashboardSidebar';
import { useApiQuery } from '../../hooks/useApiQuery';
import { api } from '../../services/api';
import { adminNavLinks } from './adminNavLinks';

interface UserItem {
  id: string;
  email: string;
  phone: string | null;
  role: string;
  isVerified: boolean;
  isActive: boolean;
  createdAt: string;
  individualProfile?: { displayName: string } | null;
  companyProfile?: { companyName: string; isGstVerified: boolean } | null;
  vendorProfile?: { companyName: string; isGstVerified: boolean } | null;
}

interface UsersResponse {
  items: UserItem[];
  meta: { total: number; page: number; limit: number; pages: number };
}

const ROLES = ['', 'individual', 'company', 'vendor', 'admin'] as const;

function getUserName(u: UserItem): string {
  return u.companyProfile?.companyName
    ?? u.vendorProfile?.companyName
    ?? u.individualProfile?.displayName
    ?? u.email.split('@')[0];
}

function isGstVerified(u: UserItem): boolean | null {
  if (u.companyProfile) return u.companyProfile.isGstVerified;
  if (u.vendorProfile) return u.vendorProfile.isGstVerified;
  return null;
}

export default function AdminUsers() {
  useEffect(() => { document.title = 'Users – Admin – Claapo'; }, []);

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [role, setRole] = useState('');
  const limit = 20;

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(search); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [search]);

  const queryParams = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (debouncedSearch) queryParams.set('search', debouncedSearch);
  if (role) queryParams.set('role', role);

  const { data, loading, error, refetch } = useApiQuery<UsersResponse>(`/admin/users?${queryParams.toString()}`);
  const users = data?.items ?? [];
  const meta = data?.meta;

  const toggleStatus = useCallback(async (userId: string, currentlyActive: boolean) => {
    try {
      await api.patch(`/admin/users/${userId}/status`, {
        status: currentlyActive ? 'inactive' : 'active',
      });
      toast.success(currentlyActive ? 'User deactivated' : 'User activated');
      refetch();
    } catch {
      toast.error('Failed to update user status');
    }
  }, [refetch]);

  const verifyGst = useCallback(async (userId: string) => {
    try {
      await api.post(`/admin/users/${userId}/verify-gst`);
      toast.success('GST marked as verified');
      refetch();
    } catch {
      toast.error('Failed to verify GST');
    }
  }, [refetch]);

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-[#F8F9FB] w-full">
      <DashboardHeader />
      <div className="flex-1 flex min-h-0 overflow-hidden">
        <DashboardSidebar links={adminNavLinks} />
        <main className="flex-1 overflow-auto p-6">
          <div className="max-w-[1200px] mx-auto">
            {/* Page heading */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-xl font-bold text-neutral-900 tracking-tight">Users</h1>
                <p className="text-sm text-neutral-500 mt-0.5">Manage platform user accounts</p>
              </div>
              {meta && (
                <span className="text-xs text-neutral-400 font-medium">{meta.total.toLocaleString('en-IN')} total</span>
              )}
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <div className="relative flex-1 min-w-[200px] max-w-[360px]">
                <FaMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 text-xs" />
                <input
                  type="text"
                  placeholder="Search by email or phone..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-neutral-200 bg-white text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#3B5BDB]/20 focus:border-[#3B5BDB]/40 transition-all"
                />
              </div>
              <select
                value={role}
                onChange={(e) => { setRole(e.target.value); setPage(1); }}
                className="rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm text-neutral-700 focus:outline-none focus:ring-2 focus:ring-[#3B5BDB]/20 focus:border-[#3B5BDB]/40 transition-all"
              >
                <option value="">All Roles</option>
                {ROLES.filter(Boolean).map((r) => (
                  <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
                ))}
              </select>
            </div>

            {error && (
              <div className="mb-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
            )}

            {/* Table */}
            <div className="rounded-2xl bg-white border border-neutral-200/60 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-neutral-100 bg-neutral-50/50">
                      <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Name</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Email</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Role</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Status</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">GST</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Created</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {loading && users.length === 0 ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <tr key={i}>
                          {Array.from({ length: 7 }).map((_, j) => (
                            <td key={j} className="px-4 py-3.5"><div className="h-4 w-20 rounded bg-neutral-100 animate-pulse" /></td>
                          ))}
                        </tr>
                      ))
                    ) : users.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-10 text-center text-neutral-400 text-sm">No users found</td>
                      </tr>
                    ) : (
                      users.map((u) => {
                        const gst = isGstVerified(u);
                        return (
                          <tr key={u.id} className="hover:bg-neutral-50/50 transition-colors">
                            <td className="px-4 py-3.5 font-medium text-neutral-900 whitespace-nowrap">{getUserName(u)}</td>
                            <td className="px-4 py-3.5 text-neutral-600 whitespace-nowrap">{u.email}</td>
                            <td className="px-4 py-3.5 whitespace-nowrap">
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#EEF2FF] text-[#3B5BDB]">
                                {u.role}
                              </span>
                            </td>
                            <td className="px-4 py-3.5 whitespace-nowrap">
                              <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                                u.isActive ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'
                              }`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${u.isActive ? 'bg-green-500' : 'bg-red-400'}`} />
                                {u.isActive ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                            <td className="px-4 py-3.5 whitespace-nowrap">
                              {gst === null ? (
                                <span className="text-xs text-neutral-300">—</span>
                              ) : gst ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-green-700">
                                  <FaCheck className="text-[9px]" /> Verified
                                </span>
                              ) : (
                                <span className="text-[11px] font-medium text-amber-600">Pending</span>
                              )}
                            </td>
                            <td className="px-4 py-3.5 text-neutral-500 whitespace-nowrap text-xs">
                              {new Date(u.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </td>
                            <td className="px-4 py-3.5 whitespace-nowrap text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() => toggleStatus(u.id, u.isActive)}
                                  title={u.isActive ? 'Deactivate' : 'Activate'}
                                  className={`p-1.5 rounded-lg transition-colors ${
                                    u.isActive
                                      ? 'text-green-600 hover:bg-green-50'
                                      : 'text-neutral-400 hover:bg-neutral-100'
                                  }`}
                                >
                                  {u.isActive ? <FaToggleOn className="text-lg" /> : <FaToggleOff className="text-lg" />}
                                </button>
                                {gst === false && (
                                  <button
                                    type="button"
                                    onClick={() => verifyGst(u.id)}
                                    title="Verify GST"
                                    className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold text-[#3B5BDB] bg-[#EEF2FF] hover:bg-[#DBEAFE] transition-colors"
                                  >
                                    Verify GST
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {meta && meta.pages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-neutral-100 bg-neutral-50/30">
                  <p className="text-xs text-neutral-500">
                    Page {meta.page} of {meta.pages}
                  </p>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      Previous
                    </button>
                    <button
                      type="button"
                      disabled={page >= meta.pages}
                      onClick={() => setPage((p) => p + 1)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
