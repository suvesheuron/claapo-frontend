import { useEffect, useState } from 'react';
import DashboardHeader from '../../components/DashboardHeader';
import DashboardSidebar from '../../components/DashboardSidebar';
import { useApiQuery } from '../../hooks/useApiQuery';
import { adminNavLinks } from './adminNavLinks';

interface ProjectItem {
  id: string;
  title: string;
  status: string;
  budgetPaise: number | null;
  createdAt: string;
  companyUser?: {
    id: string;
    email: string;
    companyProfile?: { companyName: string } | null;
  } | null;
  _count?: { bookings: number };
}

interface ProjectsResponse {
  items: ProjectItem[];
  meta: { total: number; page: number; limit: number; pages: number };
}

const statusStyles: Record<string, { bg: string; text: string; dot: string }> = {
  draft:       { bg: 'bg-neutral-100', text: 'text-neutral-600', dot: 'bg-neutral-400' },
  open:        { bg: 'bg-[#DBEAFE]', text: 'text-[#1D4ED8]', dot: 'bg-[#3B5BDB]' },
  active:      { bg: 'bg-[#DBEAFE]', text: 'text-[#1D4ED8]', dot: 'bg-[#3B5BDB]' },
  in_progress: { bg: 'bg-[#FEF9E6]', text: 'text-[#92400E]', dot: 'bg-[#F4C430]' },
  completed:   { bg: 'bg-[#D1FAE5]', text: 'text-[#065F46]', dot: 'bg-[#22C55E]' },
  cancelled:   { bg: 'bg-[#FEE2E2]', text: 'text-[#B91C1C]', dot: 'bg-red-400' },
};

const STATUS_OPTIONS = ['', 'draft', 'open', 'active', 'in_progress', 'completed', 'cancelled'];

const formatCurrency = (paise: number) =>
  (paise / 100).toLocaleString('en-IN', { style: 'currency', currency: 'INR' });

export default function AdminProjects() {
  useEffect(() => { document.title = 'Projects – Admin – Claapo'; }, []);

  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const limit = 20;

  const queryParams = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (statusFilter) queryParams.set('status', statusFilter);

  const { data, loading, error } = useApiQuery<ProjectsResponse>(`/admin/projects?${queryParams.toString()}`);
  const projects = data?.items ?? [];
  const meta = data?.meta;

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
                <h1 className="text-xl font-bold text-neutral-900 tracking-tight">Projects</h1>
                <p className="text-sm text-neutral-500 mt-0.5">All platform projects</p>
              </div>
              {meta && (
                <span className="text-xs text-neutral-400 font-medium">{meta.total.toLocaleString('en-IN')} total</span>
              )}
            </div>

            {/* Filter */}
            <div className="flex items-center gap-3 mb-4">
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                className="rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm text-neutral-700 focus:outline-none focus:ring-2 focus:ring-[#3B5BDB]/20 focus:border-[#3B5BDB]/40 transition-all"
              >
                <option value="">All Statuses</option>
                {STATUS_OPTIONS.filter(Boolean).map((s) => (
                  <option key={s} value={s}>{s.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())}</option>
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
                      <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Title</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Company</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Status</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Budget</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Created</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {loading && projects.length === 0 ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <tr key={i}>
                          {Array.from({ length: 5 }).map((_, j) => (
                            <td key={j} className="px-4 py-3.5"><div className="h-4 w-24 rounded bg-neutral-100 animate-pulse" /></td>
                          ))}
                        </tr>
                      ))
                    ) : projects.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-10 text-center text-neutral-400 text-sm">No projects found</td>
                      </tr>
                    ) : (
                      projects.map((p) => {
                        const style = statusStyles[p.status] ?? statusStyles.draft;
                        return (
                          <tr key={p.id} className="hover:bg-neutral-50/50 transition-colors">
                            <td className="px-4 py-3.5 font-medium text-neutral-900 whitespace-nowrap max-w-[260px] truncate">{p.title}</td>
                            <td className="px-4 py-3.5 text-neutral-600 whitespace-nowrap">
                              {p.companyUser?.companyProfile?.companyName ?? p.companyUser?.email ?? '—'}
                            </td>
                            <td className="px-4 py-3.5 whitespace-nowrap">
                              <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold ${style.bg} ${style.text}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                                {p.status.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                              </span>
                            </td>
                            <td className="px-4 py-3.5 text-neutral-600 whitespace-nowrap tabular-nums">
                              {p.budgetPaise ? formatCurrency(p.budgetPaise) : '—'}
                            </td>
                            <td className="px-4 py-3.5 text-neutral-500 whitespace-nowrap text-xs">
                              {new Date(p.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
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
