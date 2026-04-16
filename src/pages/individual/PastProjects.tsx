import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { FaVideo, FaFileInvoice, FaCircleInfo, FaChevronLeft, FaChevronRight, FaMessage } from 'react-icons/fa6';
import DashboardHeader from '../../components/DashboardHeader';
import DashboardSidebar from '../../components/DashboardSidebar';
import AppFooter from '../../components/AppFooter';
import { useApiQuery } from '../../hooks/useApiQuery';
import { formatPaise } from '../../utils/currency';
import { individualNavLinks } from '../../navigation/dashboardNav';

interface InvoiceRef { id: string }
interface InvoicesResponse { items: InvoiceRef[] }

interface PastBookingItem {
  id: string;
  status: string;
  rateOffered?: number | null;
  project: { id: string; title: string; startDate: string; endDate: string; status: string };
  requester: { id: string; email: string; companyProfile?: { companyName?: string } | null };
  projectRole?: { id: string; roleName: string } | null;
}

interface PastBookingsResponse {
  items: PastBookingItem[];
}

function formatDateRange(start: string, end: string): string {
  const s = new Date(start);
  const e = new Date(end);
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' };
  return `${s.toLocaleDateString('en-IN', opts)} – ${e.toLocaleDateString('en-IN', opts)}`;
}

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function PastProjects() {
  useEffect(() => { document.title = 'Past Projects – Claapo'; }, []);

  const { data, loading, error } = useApiQuery<PastBookingsResponse>('/bookings/past');
  const { data: invData } = useApiQuery<InvoicesResponse>('/invoices?limit=100');
  const items = data?.items ?? [];
  const myInvoices = invData?.items ?? [];

  // Build a map: projectId → invoiceId (first invoice for that project)
  const invoiceByProject = useMemo(() => {
    const map: Record<string, string> = {};
    myInvoices.forEach((inv: InvoiceRef & { projectId?: string }) => {
      if ((inv as { projectId?: string }).projectId && !map[(inv as { projectId?: string }).projectId!]) {
        map[(inv as { projectId?: string }).projectId!] = inv.id;
      }
    });
    return map;
  }, [myInvoices]);

  // Month/year filter
  const now = new Date();
  const [filterYear, setFilterYear] = useState(now.getFullYear());
  const [filterMonth, setFilterMonth] = useState<number | null>(null); // null = all months of year

  const filtered = useMemo(() => {
    return items.filter((b) => {
      const d = new Date(b.project.endDate);
      if (d.getFullYear() !== filterYear) return false;
      if (filterMonth !== null && d.getMonth() !== filterMonth) return false;
      return true;
    });
  }, [items, filterYear, filterMonth]);

  const yearsWithData = useMemo(() => {
    const years = new Set(items.map((b) => new Date(b.project.endDate).getFullYear()));
    return Array.from(years).sort((a, b) => b - a);
  }, [items]);

  if (!yearsWithData.includes(filterYear) && yearsWithData.length > 0) {
    // auto-switch to the most recent year with data
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-[#F3F4F6] w-full">
      <DashboardHeader />

      <div className="flex-1 flex min-h-0 overflow-hidden">
        <DashboardSidebar links={individualNavLinks} />

        <main className="flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden">
          <div className="flex-1 min-h-0 overflow-auto">
            <div className="max-w-[1000px] mx-auto px-4 sm:px-6 lg:px-8 py-5">

              <div className="relative rounded-2xl bg-white border border-neutral-200/70 px-6 sm:px-8 py-6 overflow-hidden shadow-soft mb-5">
                <div className="absolute inset-y-0 right-0 w-1/2 bg-gradient-to-l from-[#E8F0FE]/60 to-transparent pointer-events-none" />
                <span aria-hidden className="absolute left-0 top-6 bottom-6 w-1 rounded-r-full bg-gradient-to-b from-[#3678F1] to-[#5B9DF9]" />
                <div className="relative z-10 pl-3">
                  <h1 className="text-[22px] sm:text-[24px] font-extrabold text-neutral-900 tracking-tight leading-tight">Completed Projects</h1>
                  <p className="text-sm text-neutral-500 mt-1.5">Your past work history — chat and invoices per project</p>
                </div>
              </div>

              <div className="rounded-2xl bg-[#E8F0FE] border border-[#BFDBFE] p-3 mb-5 flex items-start gap-2">
                <FaCircleInfo className="text-[#3678F1] mt-0.5 shrink-0 text-xs" />
                <p className="text-xs text-[#1D4ED8]">
                  You can also browse past months on your <Link to="/availability" className="font-semibold underline">Availability Calendar</Link>.{' '}
                  <Link to="/invoice/new" className="font-semibold underline">Create an invoice</Link> for any project.
                </p>
              </div>

              {/* Year / Month filter */}
              {!loading && items.length > 0 && (
                <div className="flex items-center gap-2 mb-5 flex-wrap">
                  <button onClick={() => setFilterYear((y) => y - 1)} className="p-1.5 rounded-lg hover:bg-neutral-200 transition-colors">
                    <FaChevronLeft className="w-3 h-3 text-neutral-500" />
                  </button>
                  <span className="text-sm font-bold text-neutral-700 w-12 text-center">{filterYear}</span>
                  <button onClick={() => setFilterYear((y) => y + 1)} disabled={filterYear >= now.getFullYear()} className="p-1.5 rounded-lg hover:bg-neutral-200 disabled:opacity-30 transition-colors">
                    <FaChevronRight className="w-3 h-3 text-neutral-500" />
                  </button>
                  <div className="flex items-center gap-1 flex-wrap">
                    <button
                      onClick={() => setFilterMonth(null)}
                      className={`text-xs px-3 py-1 rounded-full font-semibold transition-colors ${filterMonth === null ? 'bg-[#3678F1] text-white' : 'bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-50'}`}
                    >All</button>
                    {MONTHS.map((m, i) => (
                      <button
                        key={m}
                        onClick={() => setFilterMonth(i)}
                        className={`text-xs px-3 py-1 rounded-full font-semibold transition-colors ${filterMonth === i ? 'bg-[#3678F1] text-white' : 'bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-50'}`}
                      >{m}</button>
                    ))}
                  </div>
                </div>
              )}

              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="rounded-2xl bg-white border border-neutral-200/70 p-4 overflow-hidden">
                      <div className="skeleton h-9 rounded-xl mb-3 w-1/3" />
                      <div className="skeleton h-4 rounded mb-2" />
                      <div className="skeleton h-3 rounded mb-1" />
                      <div className="skeleton h-3 rounded mb-3" />
                      <div className="skeleton h-8 rounded-xl" />
                    </div>
                  ))}
                </div>
              ) : error ? (
                <div className="rounded-2xl bg-[#FEEBEA] border border-[#F40F02]/30 p-4 text-sm text-[#991B1B]">{error}</div>
              ) : filtered.length === 0 ? (
                <div className="rounded-2xl bg-white shadow-soft border border-neutral-200/70 p-8 text-center text-neutral-500 text-sm">
                  {items.length === 0
                    ? 'No completed projects yet. When projects you worked on are marked completed, they will appear here.'
                    : `No projects found for ${filterMonth !== null ? `${MONTHS[filterMonth]} ` : ''}${filterYear}.`}
                </div>
              ) : (
                <>
                  <p className="text-xs text-neutral-400 mb-4">{filtered.length} project{filtered.length !== 1 ? 's' : ''}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filtered.map((b) => {
                      const invoiceId = invoiceByProject[b.project.id];
                      return (
                        <div key={b.id} className="rounded-2xl bg-white shadow-soft border border-neutral-200/70 p-4 hover:border-[#3678F1] transition-colors duration-200">
                          <div className="flex items-start justify-between gap-2 mb-3">
                            <div className="w-9 h-9 rounded-xl bg-[#E8F0FE] ring-1 ring-[#3678F1]/15 flex items-center justify-center shrink-0">
                              <FaVideo className="text-[#3678F1] text-sm" />
                            </div>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#DBEAFE] text-[#1E3A8A] border border-[#3678F1]">Completed</span>
                          </div>
                          <h4 className="text-sm font-bold text-neutral-900 mb-1 truncate">{b.project.title}</h4>
                          <p className="text-xs text-neutral-500 mb-0.5">{b.projectRole?.roleName ?? 'Crew'} · {b.requester.companyProfile?.companyName ?? b.requester.email}</p>
                          <p className="text-xs text-neutral-400 mb-1">{formatDateRange(b.project.startDate, b.project.endDate)}</p>
                          {b.rateOffered != null && <p className="text-sm font-bold text-[#22C55E] mb-3">{formatPaise(b.rateOffered)}</p>}
                          {!b.rateOffered && <div className="mb-3" />}
                          <div className="flex items-center gap-2">
                            <Link
                              to={`/chat/${b.requester.id}?projectId=${encodeURIComponent(b.project.id)}`}
                              className="flex-1 text-[11px] py-1.5 border border-neutral-200 text-neutral-600 rounded-xl hover:bg-neutral-50 text-center flex items-center justify-center gap-1 transition-colors"
                            >
                              <FaMessage className="w-2.5 h-2.5" /> Chat
                            </Link>
                            {invoiceId ? (
                              <Link
                                to={`/invoice/${invoiceId}`}
                                className="flex-1 text-[11px] py-1.5 bg-gradient-to-br from-[#3678F1] to-[#2563EB] text-white rounded-xl hover:from-[#2563EB] hover:to-[#1D4ED8] text-center flex items-center justify-center gap-1 font-semibold shadow-brand transition-colors"
                              >
                                <FaFileInvoice className="w-2.5 h-2.5" /> Invoice
                              </Link>
                            ) : (
                              <Link
                                to="/invoice/new"
                                className="flex-1 text-[11px] py-1.5 bg-gradient-to-br from-[#3678F1] to-[#2563EB] text-white rounded-xl hover:from-[#2563EB] hover:to-[#1D4ED8] text-center flex items-center justify-center gap-1 font-semibold shadow-brand transition-colors"
                              >
                                <FaFileInvoice className="w-2.5 h-2.5" /> Create Invoice
                              </Link>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </div>
          <AppFooter />
        </main>
      </div>
    </div>
  );
}
