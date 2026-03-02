import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FaHouse, FaCalendar, FaFolder, FaMagnifyingGlass, FaUser,
  FaFileInvoice, FaMessage, FaCircleInfo, FaUsers, FaTruck,
} from 'react-icons/fa6';
import DashboardHeader from '../../components/DashboardHeader';
import DashboardSidebar from '../../components/DashboardSidebar';
import AppFooter from '../../components/AppFooter';

const navLinks = [
  { icon: FaHouse,           label: 'Dashboard',      to: '/dashboard' },
  { icon: FaCalendar,        label: 'Availability',   to: '/dashboard/company-availability' },
  { icon: FaFolder,          label: 'Projects',        to: '/dashboard/projects' },
  { icon: FaFolder,          label: 'Past Projects',   to: '/dashboard/company-past-projects' },
  { icon: FaMagnifyingGlass, label: 'Search',          to: '/dashboard/search' },
  { icon: FaUser,            label: 'Profile',         to: '/dashboard/company-profile' },
];

const pastProjects = [
  {
    id: 4,
    name: 'Brand Campaign',
    dates: 'Dec 5–6, 2024',
    crew: 9,
    vendors: 2,
    budget: '₹6.1L',
    client: 'Zara India',
    invoice: 'INV-C001',
  },
  {
    id: 5,
    name: 'Product Launch',
    dates: 'Dec 18–20, 2024',
    crew: 14,
    vendors: 4,
    budget: '₹11.2L',
    client: 'Samsung India',
    invoice: 'INV-C002',
  },
  {
    id: 6,
    name: 'Music Festival',
    dates: 'Nov 12–14, 2024',
    crew: 20,
    vendors: 6,
    budget: '₹18L',
    client: 'MTV India',
    invoice: 'INV-C003',
  },
  {
    id: 7,
    name: 'Web Series Ep 3',
    dates: 'Nov 25–26, 2024',
    crew: 11,
    vendors: 3,
    budget: '₹9.5L',
    client: 'Netflix India',
    invoice: 'INV-C004',
  },
  {
    id: 8,
    name: 'Corporate TVC',
    dates: 'Oct 10–12, 2024',
    crew: 8,
    vendors: 2,
    budget: '₹5.8L',
    client: 'HDFC Bank',
    invoice: 'INV-C005',
  },
  {
    id: 9,
    name: 'Indie Documentary',
    dates: 'Sep 22–25, 2024',
    crew: 7,
    vendors: 2,
    budget: '₹4.2L',
    client: 'Amazon Prime',
    invoice: 'INV-C006',
  },
];

export default function CompanyPastProjects() {
  useEffect(() => { document.title = 'Past Projects – Claapo'; }, []);

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-[#F3F4F6] w-full">
      <DashboardHeader />

      <div className="flex-1 flex min-h-0 overflow-hidden">
        <DashboardSidebar links={navLinks} />

        <main className="flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden">
          <div className="flex-1 min-h-0 overflow-auto">
            <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-6 xl:px-8 py-5">

              <div className="mb-5">
                <h1 className="text-xl font-bold text-neutral-900">Past Projects</h1>
                <p className="text-sm text-neutral-500 mt-0.5">Completed productions with crew, vendor, and invoice records</p>
              </div>

              {/* Info banner */}
              <div className="rounded-2xl bg-[#EEF4FF] border border-[#BFDBFE] p-3 mb-5 flex items-start gap-2">
                <FaCircleInfo className="text-[#3678F1] mt-0.5 shrink-0 text-xs" />
                <p className="text-xs text-[#1D4ED8]">
                  You can also browse completed projects by navigating to past months on your{' '}
                  <Link to="/dashboard/company-availability" className="font-semibold underline">
                    Availability Calendar
                  </Link>.
                </p>
              </div>

              {/* Filter row */}
              <div className="flex items-center gap-2 mb-4">
                <select className="rounded-xl px-3 py-2 border border-neutral-300 bg-white text-neutral-800 text-xs focus:outline-none focus:border-[#3678F1] transition-all">
                  <option>All time</option>
                  <option>December 2024</option>
                  <option>November 2024</option>
                  <option>October 2024</option>
                  <option>September 2024</option>
                </select>
                <span className="text-xs text-neutral-400">{pastProjects.length} projects</span>
              </div>

              {/* Cards grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {pastProjects.map((project) => (
                  <div
                    key={project.id}
                    className="rounded-2xl bg-white border border-neutral-200 p-4 hover:shadow-md hover:border-neutral-300 transition-all"
                  >
                    {/* Top row */}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="w-9 h-9 rounded-xl bg-[#D1FAE5] flex items-center justify-center shrink-0">
                        <FaFolder className="text-[#22C55E] text-sm" />
                      </div>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#D1FAE5] text-[#065F46]">
                        Completed
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-neutral-900 mb-1 truncate">{project.name}</h4>
                    <p className="text-xs text-neutral-500 mb-0.5">{project.client} · {project.dates}</p>

                    {/* Stats */}
                    <div className="flex items-center gap-3 my-2">
                      <span className="flex items-center gap-1 text-[11px] text-neutral-500">
                        <FaUsers className="w-2.5 h-2.5 text-neutral-400" />
                        {project.crew} crew
                      </span>
                      <span className="flex items-center gap-1 text-[11px] text-neutral-500">
                        <FaTruck className="w-2.5 h-2.5 text-neutral-400" />
                        {project.vendors} vendors
                      </span>
                    </div>

                    <p className="text-sm font-bold text-[#22C55E] mb-3">{project.budget}</p>

                    <div className="flex items-center gap-2">
                      <Link
                        to={`/dashboard/chat/${project.name.toLowerCase().replace(/\s+/g, '-')}`}
                        className="flex-1 text-[11px] py-1.5 border border-neutral-200 text-neutral-600 rounded-xl hover:bg-neutral-50 text-center flex items-center justify-center gap-1 transition-colors"
                      >
                        <FaMessage className="w-2.5 h-2.5" /> Chat
                      </Link>
                      <Link
                        to={`/dashboard/invoice/${project.invoice}`}
                        className="flex-1 text-[11px] py-1.5 bg-[#3678F1] text-white rounded-xl hover:bg-[#2563d4] text-center flex items-center justify-center gap-1 font-semibold transition-colors"
                      >
                        <FaFileInvoice className="w-2.5 h-2.5" /> Invoice
                      </Link>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          </div>
          <AppFooter />
        </main>
      </div>
    </div>
  );
}
