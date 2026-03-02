import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaVideo, FaFileInvoice, FaHouse, FaCalendar, FaUser, FaMessage, FaCircleInfo, FaFolder } from 'react-icons/fa6';
import DashboardHeader from '../../components/DashboardHeader';
import DashboardSidebar from '../../components/DashboardSidebar';
import AppFooter from '../../components/AppFooter';

const navLinks = [
  { icon: FaHouse,     label: 'Dashboard',    to: '/dashboard' },
  { icon: FaCalendar,  label: 'Availability', to: '/dashboard/availability' },
  { icon: FaFolder,    label: 'Past Projects', to: '/dashboard/past-projects' },
  { icon: FaUser,      label: 'Profile',       to: '/dashboard/profile' },
];

const pastProjects = [
  { name: 'Music Video Production', date: 'Dec 22–23, 2024', role: 'Director', company: 'Studio Shodwe', invoice: 'INV-001', payment: '₹52,000' },
  { name: 'Commercial Ad', date: 'Dec 15–17, 2024', role: 'DOP', company: 'Creative Agency', invoice: 'INV-002', payment: '₹45,000' },
  { name: 'Documentary Film', date: 'Nov 28–30, 2024', role: 'Director', company: 'Film Studios', invoice: 'INV-003', payment: '₹60,000' },
  { name: 'Brand Film', date: 'Nov 15–17, 2024', role: 'DOP', company: 'Ad Agency', invoice: 'INV-004', payment: '₹38,000' },
  { name: 'Short Film', date: 'Oct 28–30, 2024', role: 'Director', company: 'Indie Films', invoice: 'INV-005', payment: '₹28,000' },
];

export default function PastProjects() {
  useEffect(() => { document.title = 'Past Projects – Claapo'; }, []);

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-[#F3F4F6] w-full">
      <DashboardHeader userName="John Director" />

      <div className="flex-1 flex min-h-0 overflow-hidden">
        <DashboardSidebar links={navLinks} />

        <main className="flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden">
          <div className="flex-1 min-h-0 overflow-auto">
            <div className="max-w-[1000px] mx-auto px-4 sm:px-6 lg:px-8 py-5">

              <div className="mb-5">
                <h1 className="text-xl font-bold text-neutral-900">Completed Projects</h1>
                <p className="text-sm text-neutral-500 mt-0.5">Your past work history with chats and invoices</p>
              </div>

              {/* Tip banner */}
              <div className="rounded-2xl bg-[#EEF4FF] border border-[#BFDBFE] p-3 mb-5 flex items-start gap-2">
                <FaCircleInfo className="text-[#3678F1] mt-0.5 shrink-0 text-xs" />
                <p className="text-xs text-[#1D4ED8]">
                  You can also browse completed projects by navigating to past months on your <Link to="/dashboard/availability" className="font-semibold underline">Availability Calendar</Link>.
                </p>
              </div>

              <div className="flex items-center gap-2 mb-4">
                <select className="rounded-xl px-3 py-2 border border-neutral-300 bg-white text-neutral-800 text-xs focus:outline-none focus:border-[#3678F1] transition-all">
                  <option>All time</option>
                  <option>December 2024</option>
                  <option>November 2024</option>
                  <option>October 2024</option>
                </select>
                <span className="text-xs text-neutral-400">{pastProjects.length} projects</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {pastProjects.map((project, idx) => (
                  <div key={idx} className="rounded-2xl bg-white border border-neutral-200 p-4 hover:shadow-md hover:border-neutral-300 transition-all">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="w-9 h-9 rounded-xl bg-[#DBEAFE] flex items-center justify-center shrink-0">
                        <FaVideo className="text-[#3678F1] text-sm" />
                      </div>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#DBEAFE] text-[#1D4ED8]">Completed</span>
                    </div>
                    <h4 className="text-sm font-bold text-neutral-900 mb-1 truncate">{project.name}</h4>
                    <p className="text-xs text-neutral-500 mb-0.5">{project.role} · {project.company}</p>
                    <p className="text-xs text-neutral-400 mb-1">{project.date}</p>
                    <p className="text-sm font-bold text-[#22C55E] mb-3">{project.payment}</p>
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
