import { useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { FaTruck, FaFileInvoice, FaMessage } from 'react-icons/fa6';
import DashboardHeader from '../../components/DashboardHeader';
import DashboardSidebar from '../../components/DashboardSidebar';
import AppFooter from '../../components/AppFooter';
import { useApiQuery } from '../../hooks/useApiQuery';
import { formatPaise } from '../../utils/currency';
import { vendorNavLinks } from '../../navigation/dashboardNav';

interface PastItem {
  id: string;
  rateOffered?: number | null;
  project: { id: string; title: string; startDate: string; endDate: string };
  requester: { id: string; companyProfile?: { companyName?: string } | null };
}

interface InvoiceRef { id: string; projectId?: string }

function formatDateRange(start: string, end: string): string {
  const s = new Date(start);
  const e = new Date(end);
  return `${s.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })} – ${e.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}`;
}

export default function PastRentals() {
  useEffect(() => { document.title = 'Past Rentals – Claapo'; }, []);

  const { data, loading, error } = useApiQuery<{ items: PastItem[] }>('/bookings/past');
  const { data: invData } = useApiQuery<{ items: InvoiceRef[] }>('/invoices?limit=100');
  const pastRentals = data?.items ?? [];
  const myInvoices = invData?.items ?? [];

  const invoiceByProject = useMemo(() => {
    const map: Record<string, string> = {};
    myInvoices.forEach((inv) => {
      if (inv.projectId && !map[inv.projectId]) map[inv.projectId] = inv.id;
    });
    return map;
  }, [myInvoices]);

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-[#F3F4F6] min-w-0 w-full">
      <DashboardHeader />

      <div className="flex-1 flex min-h-0 overflow-hidden">
        <DashboardSidebar links={vendorNavLinks} />

        <main className="flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden">
          <div className="flex-1 min-h-0 overflow-auto">
            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 md:px-8 lg:px-6 xl:px-8 py-4 sm:py-5">
              <div className="relative rounded-2xl bg-white border border-neutral-200/70 px-6 sm:px-8 py-6 mb-5 overflow-hidden shadow-soft">
                <div className="absolute inset-y-0 right-0 w-1/2 bg-gradient-to-l from-[#E8F0FE]/60 to-transparent pointer-events-none" />
                <span aria-hidden className="absolute left-0 top-6 bottom-6 w-1 rounded-r-full bg-gradient-to-b from-[#3678F1] to-[#5B9DF9]" />
                <div className="relative pl-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#3678F1]">History</p>
                  <h1 className="text-[26px] sm:text-[28px] font-extrabold text-neutral-900 tracking-tight leading-tight mt-1">Past Rentals</h1>
                  <p className="text-sm text-neutral-500 mt-1.5">View past rental history, chats, and invoices</p>
                </div>
              </div>

              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  {[1, 2, 3].map((i) => <div key={i} className="skeleton rounded-2xl h-40" />)}
                </div>
              ) : error ? (
                <div className="rounded-xl bg-[#FEEBEA] border border-[#F40F02]/30 p-4 text-sm text-[#991B1B]">{error}</div>
              ) : pastRentals.length === 0 ? (
                <div className="rounded-2xl bg-white border border-neutral-200/70 shadow-soft p-10 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-[#E8F0FE] ring-1 ring-[#3678F1]/15 flex items-center justify-center mx-auto mb-4">
                    <FaTruck className="text-[#3678F1] text-2xl" />
                  </div>
                  <p className="text-base font-bold text-neutral-900 mb-1">No past rentals yet</p>
                  <p className="text-sm text-neutral-500">Completed rentals will show up here.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  {pastRentals.map((rental) => {
                    const invoiceId = invoiceByProject[rental.project.id];
                    return (
                      <div key={rental.id} className="rounded-2xl bg-white border border-neutral-200/70 shadow-soft p-4 hover:border-[#3678F1] transition-colors duration-200">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h4 className="text-sm sm:text-base text-neutral-900 font-bold truncate">{rental.project.title}</h4>
                          <div className="w-9 h-9 rounded-xl bg-[#E8F0FE] ring-1 ring-[#3678F1]/15 flex items-center justify-center shrink-0">
                            <FaTruck className="text-[#3678F1] text-xs" />
                          </div>
                        </div>
                        <p className="text-xs sm:text-sm text-neutral-600 mb-1">{formatDateRange(rental.project.startDate, rental.project.endDate)}</p>
                        <p className="text-xs sm:text-sm text-neutral-600 mb-2">Company: {rental.requester.companyProfile?.companyName ?? '—'}</p>
                        <span className="inline-flex items-center gap-1.5 text-[10px] px-2 py-0.5 rounded-full bg-[#DBEAFE] text-[#1E3A8A] border border-[#3678F1] font-bold mb-3">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#3678F1]" /> Completed
                        </span>
                        {rental.rateOffered != null && <p className="text-sm font-bold text-[#3678F1] mb-3">{formatPaise(rental.rateOffered)}</p>}
                        <div className="flex items-center gap-2">
                          <Link to={`/chat/${rental.requester.id}?projectId=${encodeURIComponent(rental.project.id)}`} className="flex-1 text-xs px-3 py-2 rounded-lg bg-[#E8F0FE] text-[#2563EB] hover:bg-[#DBEAFE] text-center flex items-center justify-center gap-1 font-bold transition-colors duration-200">
                            <FaMessage className="w-3 h-3" /> Chat
                          </Link>
                          {invoiceId ? (
                            <Link to={`/invoice/${invoiceId}`} className="flex-1 text-xs px-3 py-2 rounded-lg bg-gradient-to-br from-[#3678F1] to-[#2563EB] text-white hover:from-[#2563EB] hover:to-[#1D4ED8] shadow-brand text-center flex items-center justify-center gap-1 font-bold transition-colors duration-200">
                              <FaFileInvoice className="inline" /> Invoice
                            </Link>
                          ) : (
                            <Link to="/invoice/new" className="flex-1 text-xs px-3 py-2 rounded-lg bg-gradient-to-br from-[#3678F1] to-[#2563EB] text-white hover:from-[#2563EB] hover:to-[#1D4ED8] shadow-brand text-center flex items-center justify-center gap-1 font-bold transition-colors duration-200">
                              <FaFileInvoice className="inline" /> Create Invoice
                            </Link>
                          )}
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
