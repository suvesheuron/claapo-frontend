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
    <div className="h-screen flex flex-col overflow-hidden bg-neutral-50 min-w-0 w-full">
      <DashboardHeader />

      <div className="flex-1 flex min-h-0 overflow-hidden">
        <DashboardSidebar links={vendorNavLinks} />

        <main className="flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden">
          <div className="flex-1 min-h-0 overflow-auto">
            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 md:px-8 lg:px-6 xl:px-8 py-4 sm:py-5">
              <div className="mb-4 sm:mb-5">
                <h1 className="text-xl sm:text-2xl text-neutral-900 font-bold">Past Rentals</h1>
                <p className="text-xs sm:text-sm text-neutral-600 mt-0.5">View past rental history, chats, and invoices</p>
              </div>

              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  {[1, 2, 3].map((i) => <div key={i} className="rounded-lg border border-neutral-200 p-4 animate-pulse h-40" />)}
                </div>
              ) : error ? (
                <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-700">{error}</div>
              ) : pastRentals.length === 0 ? (
                <div className="rounded-xl bg-white border border-neutral-200 p-8 text-center text-neutral-500 text-sm">No past rentals yet.</div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  {pastRentals.map((rental) => {
                    const invoiceId = invoiceByProject[rental.project.id];
                    return (
                      <div key={rental.id} className="rounded-lg border border-neutral-200 p-3 sm:p-4 hover:shadow-md transition">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h4 className="text-sm sm:text-base text-neutral-900 font-bold truncate">{rental.project.title}</h4>
                          <FaTruck className="text-neutral-400 shrink-0" />
                        </div>
                        <p className="text-xs sm:text-sm text-neutral-600 mb-1">{formatDateRange(rental.project.startDate, rental.project.endDate)}</p>
                        <p className="text-xs sm:text-sm text-neutral-600 mb-3">Company: {rental.requester.companyProfile?.companyName ?? '—'}</p>
                        {rental.rateOffered != null && <p className="text-sm font-semibold text-[#22C55E] mb-3">{formatPaise(rental.rateOffered)}</p>}
                        <div className="flex items-center gap-2">
                          <Link to={`/dashboard/chat/${rental.requester.id}`} className="flex-1 text-xs px-3 py-1.5 bg-neutral-100 text-neutral-700 rounded hover:bg-neutral-200 text-center flex items-center justify-center gap-1">
                            <FaMessage className="w-3 h-3" /> Chat
                          </Link>
                          {invoiceId ? (
                            <Link to={`/dashboard/invoice/${invoiceId}`} className="flex-1 text-xs px-3 py-1.5 bg-[#3B5BDB] text-white rounded hover:bg-[#2f4ac2] text-center flex items-center justify-center gap-1">
                              <FaFileInvoice className="inline" /> Invoice
                            </Link>
                          ) : (
                            <Link to="/dashboard/invoice/new" className="flex-1 text-xs px-3 py-1.5 bg-[#3B5BDB] text-white rounded hover:bg-[#2f4ac2] text-center flex items-center justify-center gap-1">
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
