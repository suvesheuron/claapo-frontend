import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaTruck, FaFileInvoice, FaHouse, FaCalendar, FaFolder, FaUser } from 'react-icons/fa6';
import DashboardHeader from '../../components/DashboardHeader';
import DashboardSidebar from '../../components/DashboardSidebar';
import AppFooter from '../../components/AppFooter';
import RoleIndicator from '../../components/RoleIndicator';

const navLinks = [
  { icon: FaHouse,     label: 'Dashboard',   to: '/dashboard' },
  { icon: FaCalendar,  label: 'Availability', to: '/dashboard/vendor-availability' },
  { icon: FaTruck,     label: 'Equipment',   to: '/dashboard/equipment' },
  { icon: FaUser,      label: 'Profile',     to: '/dashboard/vendor-profile' },
];

const pastRentals = [
  { name: 'Music Video Production', date: 'Dec 22-23, 2024', company: 'Studio Shodwe', equipment: 'RED Camera Package', invoice: 'INV-001' },
  { name: 'Commercial Ad', date: 'Dec 15-17, 2024', company: 'Creative Agency', equipment: 'Lighting Kit', invoice: 'INV-002' },
  { name: 'Documentary Film', date: 'Nov 28-30, 2024', company: 'Film Studios', equipment: 'Gimbal Stabilizer', invoice: 'INV-003' },
  { name: 'Brand Film', date: 'Nov 15-17, 2024', company: 'Ad Agency', equipment: 'Transport Van', invoice: 'INV-004' },
  { name: 'Short Film', date: 'Oct 28-30, 2024', company: 'Indie Films', equipment: 'Sound Recording Kit', invoice: 'INV-005' },
];

export default function PastRentals() {
  useEffect(() => {
    document.title = 'Past Rentals – CrewCall';
  }, []);

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-neutral-50 min-w-0 w-full">
      <DashboardHeader userName="Equipment Rentals Co." />

      <div className="flex-1 flex min-h-0 overflow-hidden">
        <DashboardSidebar links={navLinks} />

        <main className="flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden">
          <div className="flex-1 min-h-0 overflow-auto">
            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 md:px-8 lg:px-6 xl:px-8 py-4 sm:py-5">
              <div className="mb-4 sm:mb-5">
                <div className="flex items-center justify-between mb-2">
                  <h1 className="text-xl sm:text-2xl md:text-3xl text-neutral-900 font-bold break-words">
                    Past Rentals
                  </h1>
                  <RoleIndicator />
                </div>
                <p className="text-xs sm:text-sm text-neutral-600 break-words">
                  View past rental history, chats, and invoices
                </p>
              </div>

              <div className="mb-4 sm:mb-5">
                <div className="flex items-center gap-2">
                  <select className="rounded-lg px-2 py-1.5 border border-neutral-300 bg-white text-neutral-900 text-xs sm:text-sm min-h-[36px]">
                    <option>December 2024</option>
                    <option>November 2024</option>
                    <option>October 2024</option>
                    <option>All Time</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {pastRentals.map((rental, idx) => (
                  <div key={idx} className="rounded-lg border border-neutral-200 p-3 sm:p-4 hover:shadow-md transition">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h4 className="text-sm sm:text-base text-neutral-900 font-bold truncate">{rental.name}</h4>
                      <FaTruck className="text-neutral-400 shrink-0" />
                    </div>
                    <p className="text-xs sm:text-sm text-neutral-600 mb-1">{rental.date}</p>
                    <p className="text-xs sm:text-sm text-neutral-700 mb-1">Equipment: {rental.equipment}</p>
                    <p className="text-xs sm:text-sm text-neutral-600 mb-3">Company: {rental.company}</p>
                    <div className="flex items-center gap-2">
                        <Link
                          to={`/dashboard/chat/${rental.name.toLowerCase().replace(/\s+/g, '-')}`}
                          className="flex-1 text-xs px-3 py-1.5 bg-neutral-100 text-neutral-700 rounded hover:bg-neutral-200 text-center flex items-center justify-center"
                        >
                          View Chat
                        </Link>
                        <Link
                          to={`/dashboard/invoice/${rental.invoice}`}
                          className="flex-1 text-xs px-3 py-1.5 bg-neutral-900 text-white rounded hover:bg-neutral-800 text-center flex items-center justify-center gap-1"
                        >
                          <FaFileInvoice className="inline" />
                          Invoice
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

