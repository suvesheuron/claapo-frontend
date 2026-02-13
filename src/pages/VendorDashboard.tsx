import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaCalendar, FaTruck, FaFileInvoice, FaBell, FaHouse, FaFolder } from 'react-icons/fa6';
import DashboardHeader from '../components/DashboardHeader';
import AppFooter from '../components/AppFooter';
import RoleIndicator from '../components/RoleIndicator';

type CalendarCell = { d: number; muted: boolean; status?: 'available' | 'booked' | 'past-rental' | null };

const calendarDays: CalendarCell[] = [
  ...[29, 30, 31].map((d) => ({ d, muted: true })),
  ...[1, 2, 3, 4, 5, 6, 7].map((d) => ({ d, muted: false, status: 'available' })),
  { d: 8, muted: false, status: 'booked' },
  { d: 9, muted: false, status: 'booked' },
  { d: 10, muted: false, status: 'booked' },
  ...[11, 12, 13, 14].map((d) => ({ d, muted: false, status: 'available' })),
  { d: 15, muted: false, status: 'booked' },
  { d: 16, muted: false, status: 'booked' },
  { d: 17, muted: false, status: 'booked' },
  ...[18, 19, 20, 21].map((d) => ({ d, muted: false, status: 'available' })),
  { d: 22, muted: false, status: 'past-rental' },
  { d: 23, muted: false, status: 'past-rental' },
  ...[24, 25, 26, 27, 28, 29, 30, 31].map((d) => ({ d, muted: false, status: 'available' })),
  { d: 1, muted: true },
];

const equipment = [
  { name: 'RED Camera Package', rate: '₹15,000/day', status: 'available' },
  { name: 'Lighting Kit (LED)', rate: '₹8,000/day', status: 'available' },
  { name: 'Gimbal Stabilizer', rate: '₹5,000/day', status: 'booked' },
  { name: 'Transport Van', rate: '₹3,500/day', status: 'available' },
];

const bookingRequests = [
  { id: 1, company: 'Production Studios Inc.', equipment: 'RED Camera Package', dates: 'Jan 8-10, 2025', status: 'pending' },
  { id: 2, company: 'Creative Agency', equipment: 'Lighting Kit', dates: 'Jan 15-17, 2025', status: 'pending' },
];

const pastRentals = [
  { name: 'Music Video Production', date: 'Dec 22-23, 2024', company: 'Studio Shodwe', equipment: 'RED Camera Package', invoice: 'INV-001' },
  { name: 'Commercial Ad', date: 'Dec 15-17, 2024', company: 'Creative Agency', equipment: 'Lighting Kit', invoice: 'INV-002' },
];

const navLinks = [
  { icon: FaHouse, label: 'Dashboard', to: '/dashboard' },
  { icon: FaTruck, label: 'Equipment', to: '/dashboard/equipment' },
  { icon: FaCalendar, label: 'Availability', to: '/dashboard/vendor-availability' },
  { icon: FaFolder, label: 'Past Rentals', to: '/dashboard/past-rentals' },
];

export default function VendorDashboard() {
  useEffect(() => {
    document.title = 'Dashboard – CrewCall';
  }, []);

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 border-green-300 text-green-800';
      case 'booked':
        return 'bg-red-100 border-red-300 text-red-800';
      case 'past-rental':
        return 'bg-blue-100 border-blue-300 text-blue-800';
      default:
        return 'bg-neutral-100 border-neutral-200 text-neutral-600';
    }
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-neutral-50 min-w-0 w-full">
      <DashboardHeader userName="Equipment Rentals Co." />

      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Sidebar */}
        <aside className="hidden lg:flex lg:flex-col lg:w-56 xl:w-64 shrink-0 bg-white border-r border-neutral-200 overflow-y-auto">
          <nav className="p-3 space-y-1">
            {navLinks.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900 text-sm font-medium"
              >
                <item.icon className="w-5 h-5 shrink-0 text-neutral-500" />
                <span className="truncate">{item.label}</span>
              </Link>
            ))}
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden">
          <div className="flex-1 min-h-0 overflow-auto">
            <div id="dashboard-top" className="max-w-[1400px] mx-auto px-4 sm:px-6 md:px-8 lg:px-6 xl:px-8 py-4 sm:py-5">
              <div className="mb-4 sm:mb-5">
                <div className="flex items-center justify-between mb-2">
                  <h1 className="text-xl sm:text-2xl md:text-3xl text-neutral-900 font-bold break-words">
                    Vendor Dashboard
                  </h1>
                  <RoleIndicator />
                </div>
                <p className="text-xs sm:text-sm text-neutral-600 break-words">
                  Manage equipment availability, booking requests, and past rentals
                </p>
              </div>

              {/* Equipment Overview */}
              <div id="equipment-overview" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-5">
                {equipment.map((item, idx) => (
                  <div key={idx} className="rounded-lg bg-white border border-neutral-200 p-3 sm:p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-sm sm:text-base text-neutral-900 font-bold truncate">{item.name}</h3>
                      <FaTruck className="text-neutral-400 shrink-0" />
                    </div>
                    <p className="text-xs sm:text-sm text-neutral-600 mb-2">{item.rate}</p>
                    <span className={`text-[10px] sm:text-xs px-2 py-1 rounded ${
                      item.status === 'available' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {item.status === 'available' ? 'Available' : 'Booked'}
                    </span>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-4 gap-3 sm:gap-4 min-w-0 mb-4 sm:mb-5">
                {/* Equipment Calendar */}
                <div id="availability-calendar" className="lg:col-span-3 min-w-0 order-2 lg:order-1 overflow-hidden">
                  <div className="rounded-lg bg-white border border-neutral-200 p-3 sm:p-4 min-w-0 overflow-hidden">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3 mb-3 sm:mb-4">
                      <h2 className="text-base sm:text-lg text-neutral-900 font-bold break-words">
                        Equipment Availability Calendar
                      </h2>
                      <div className="flex items-center gap-2 flex-wrap">
                        <select className="rounded-lg px-2 py-1.5 border border-neutral-300 bg-white text-neutral-900 text-xs sm:text-sm min-h-[36px]">
                          <option>January</option>
                          <option>February</option>
                          <option>March</option>
                        </select>
                        <select className="rounded-lg px-2 py-1.5 border border-neutral-300 bg-white text-neutral-900 text-xs sm:text-sm min-h-[36px]">
                          <option>2025</option>
                          <option>2024</option>
                        </select>
                      </div>
                    </div>
                    <div className="w-full min-w-0 overflow-x-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
                      <div className="min-w-[260px] sm:min-w-0">
                        <div className="grid grid-cols-7 gap-0.5 mb-1.5 sm:mb-2 text-center text-[10px] sm:text-xs text-neutral-600 border-b border-neutral-200">
                          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                            <div key={day} className="p-0.5 sm:p-1 truncate">{day}</div>
                          ))}
                        </div>
                        <div className="grid grid-cols-7 gap-0.5">
                          {calendarDays.map((cell, i) => (
                            <div
                              key={i}
                              className={`rounded min-h-[32px] h-9 sm:h-12 md:h-14 p-0.5 sm:p-1 text-[10px] sm:text-xs border min-w-0 overflow-hidden ${
                                cell.muted
                                  ? 'text-neutral-400 border-neutral-200'
                                  : getStatusColor(cell.status ?? undefined)
                              }`}
                            >
                              {cell.d}
                              {cell.status && (
                                <div className="text-[8px] sm:text-[10px] mt-0.5 truncate">
                                  {cell.status === 'available' && 'Available'}
                                  {cell.status === 'booked' && 'Booked'}
                                  {cell.status === 'past-rental' && 'Past Rental'}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 sm:gap-3 mt-2 sm:mt-3 text-[10px] sm:text-xs">
                      <div className="flex items-center gap-1.5">
                        <div className="rounded w-3 h-3 bg-green-100 border border-green-300" />
                        <span className="text-neutral-600">Available</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="rounded w-3 h-3 bg-red-100 border border-red-300" />
                        <span className="text-neutral-600">Booked</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="rounded w-3 h-3 bg-blue-100 border border-blue-300" />
                        <span className="text-neutral-600">Past Rental</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Booking Requests & Quick Stats */}
                <div className="space-y-3 sm:space-y-4 order-1 lg:order-2 min-w-0">
                  <div className="rounded-lg bg-white border border-neutral-200 p-3 sm:p-4 min-w-0">
                    <div className="flex items-center gap-2 mb-2 sm:mb-3">
                      <FaBell className="text-neutral-600" />
                      <h3 className="text-sm sm:text-base text-neutral-900 font-bold break-words">
                        Booking Requests
                      </h3>
                    </div>
                    <div className="space-y-2 sm:space-y-3 max-h-[200px] overflow-y-auto">
                      {bookingRequests.map((request) => (
                        <div key={request.id} className="rounded-lg border border-neutral-200 p-2.5 sm:p-3 min-w-0">
                          <p className="text-xs sm:text-sm text-neutral-900 font-medium mb-1">{request.company}</p>
                          <p className="text-[10px] sm:text-xs text-neutral-600 mb-1">{request.equipment}</p>
                          <p className="text-[10px] sm:text-xs text-neutral-600 mb-2">{request.dates}</p>
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                alert(`Booking request accepted for ${request.equipment} from ${request.company}`);
                              }}
                              className="flex-1 text-[10px] sm:text-xs px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                            >
                              Accept
                            </button>
                            <button
                              onClick={() => {
                                alert(`Booking request declined for ${request.equipment} from ${request.company}`);
                              }}
                              className="flex-1 text-[10px] sm:text-xs px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                            >
                              Decline
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-lg bg-white border border-neutral-200 p-3 sm:p-4 min-w-0">
                    <h3 className="text-sm sm:text-base text-neutral-900 mb-2 sm:mb-3 font-bold">
                      Quick Stats
                    </h3>
                    <div className="space-y-2 sm:space-y-3">
                      <div className="flex items-center justify-between gap-2 min-w-0">
                        <span className="text-xs sm:text-sm text-neutral-600 truncate">Active Bookings</span>
                        <span className="text-sm sm:text-base text-neutral-900 font-bold shrink-0">4</span>
                      </div>
                      <div className="flex items-center justify-between gap-2 min-w-0">
                        <span className="text-xs sm:text-sm text-neutral-600 truncate">Past Rentals</span>
                        <span className="text-sm sm:text-base text-neutral-900 font-bold shrink-0">28</span>
                      </div>
                      <div className="flex items-center justify-between gap-2 min-w-0">
                        <span className="text-xs sm:text-sm text-neutral-600 truncate">This Month</span>
                        <span className="text-sm sm:text-base text-neutral-900 font-bold shrink-0">₹1.2L</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Past Rentals */}
              <div id="past-rentals" className="rounded-lg bg-white border border-neutral-200 p-3 sm:p-4 min-w-0">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <h2 className="text-base sm:text-lg text-neutral-900 font-bold break-words">
                    Past Rentals
                  </h2>
                  <div className="flex items-center gap-2">
                    <select className="rounded-lg px-2 py-1.5 border border-neutral-300 bg-white text-neutral-900 text-xs sm:text-sm min-h-[36px]">
                      <option>December 2024</option>
                      <option>November 2024</option>
                      <option>October 2024</option>
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
          </div>

          <AppFooter />
        </main>
      </div>
    </div>
  );
}

