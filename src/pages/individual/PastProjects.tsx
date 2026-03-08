import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaVideo, FaFileInvoice, FaHouse, FaCalendar, FaUser, FaMessage, FaCircleInfo, FaFolder } from 'react-icons/fa6';
import DashboardHeader from '../../components/DashboardHeader';
import DashboardSidebar from '../../components/DashboardSidebar';
import AppFooter from '../../components/AppFooter';
import { useApiQuery } from '../../hooks/useApiQuery';
import { formatPaise } from '../../utils/currency';

const navLinks = [
  { icon: FaHouse,     label: 'Dashboard',    to: '/dashboard' },
  { icon: FaCalendar,  label: 'Availability', to: '/dashboard/availability' },
  { icon: FaMessage,   label: 'Chat',         to: '/dashboard/conversations' },
  { icon: FaFolder,    label: 'Past Projects', to: '/dashboard/past-projects' },
  { icon: FaUser,      label: 'Profile',       to: '/dashboard/profile' },
];

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

export default function PastProjects() {
  useEffect(() => { document.title = 'Past Projects – Claapo'; }, []);

  const { data, loading, error } = useApiQuery<PastBookingsResponse>('/bookings/past');
  const items = data?.items ?? [];

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-[#F3F4F6] w-full">
      <DashboardHeader />

      <div className="flex-1 flex min-h-0 overflow-hidden">
        <DashboardSidebar links={navLinks} />

        <main className="flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden">
          <div className="flex-1 min-h-0 overflow-auto">
            <div className="max-w-[1000px] mx-auto px-4 sm:px-6 lg:px-8 py-5">

              <div className="mb-5">
                <h1 className="text-xl font-bold text-neutral-900">Completed Projects</h1>
                <p className="text-sm text-neutral-500 mt-0.5">Your past work history with chats and invoices</p>
              </div>

              <div className="rounded-2xl bg-[#EEF4FF] border border-[#BFDBFE] p-3 mb-5 flex items-start gap-2">
                <FaCircleInfo className="text-[#3678F1] mt-0.5 shrink-0 text-xs" />
                <p className="text-xs text-[#1D4ED8]">
                  You can also browse completed projects by navigating to past months on your <Link to="/dashboard/availability" className="font-semibold underline">Availability Calendar</Link>.
                </p>
              </div>

              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="rounded-2xl bg-white border border-neutral-200 p-4 animate-pulse">
                      <div className="h-9 bg-neutral-200 rounded-xl mb-3 w-1/3" />
                      <div className="h-4 bg-neutral-200 rounded mb-2" />
                      <div className="h-3 bg-neutral-100 rounded mb-1" />
                      <div className="h-3 bg-neutral-100 rounded mb-3" />
                      <div className="h-8 bg-neutral-100 rounded-xl" />
                    </div>
                  ))}
                </div>
              ) : error ? (
                <div className="rounded-2xl bg-red-50 border border-red-200 p-4 text-sm text-red-700">{error}</div>
              ) : items.length === 0 ? (
                <div className="rounded-2xl bg-white border border-neutral-200 p-8 text-center text-neutral-500 text-sm">
                  No completed projects yet. When projects you worked on are marked completed, they will appear here.
                </div>
              ) : (
                <>
                  <p className="text-xs text-neutral-400 mb-4">{items.length} project{items.length !== 1 ? 's' : ''}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {items.map((b) => (
                      <div key={b.id} className="rounded-2xl bg-white border border-neutral-200 p-4 hover:shadow-md hover:border-neutral-300 transition-all">
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <div className="w-9 h-9 rounded-xl bg-[#DBEAFE] flex items-center justify-center shrink-0">
                            <FaVideo className="text-[#3678F1] text-sm" />
                          </div>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#DBEAFE] text-[#1D4ED8]">Completed</span>
                        </div>
                        <h4 className="text-sm font-bold text-neutral-900 mb-1 truncate">{b.project.title}</h4>
                        <p className="text-xs text-neutral-500 mb-0.5">{b.projectRole?.roleName ?? 'Crew'} · {b.requester.companyProfile?.companyName ?? b.requester.email}</p>
                        <p className="text-xs text-neutral-400 mb-1">{formatDateRange(b.project.startDate, b.project.endDate)}</p>
                        {b.rateOffered != null && <p className="text-sm font-bold text-[#22C55E] mb-3">{formatPaise(b.rateOffered)}</p>}
                        {!b.rateOffered && <div className="mb-3" />}
                        <div className="flex items-center gap-2">
                          <Link
                            to={`/dashboard/chat/${b.requester.id}`}
                            className="flex-1 text-[11px] py-1.5 border border-neutral-200 text-neutral-600 rounded-xl hover:bg-neutral-50 text-center flex items-center justify-center gap-1 transition-colors"
                          >
                            <FaMessage className="w-2.5 h-2.5" /> Chat
                          </Link>
                          <Link
                            to="/dashboard/bookings"
                            className="flex-1 text-[11px] py-1.5 bg-[#3678F1] text-white rounded-xl hover:bg-[#2563d4] text-center flex items-center justify-center gap-1 font-semibold transition-colors"
                          >
                            <FaFileInvoice className="w-2.5 h-2.5" /> Invoices
                          </Link>
                        </div>
                      </div>
                    ))}
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
