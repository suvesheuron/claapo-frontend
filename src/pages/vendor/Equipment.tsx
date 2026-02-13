import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaTruck, FaHouse, FaCalendar, FaFolder } from 'react-icons/fa6';
import DashboardHeader from '../../components/DashboardHeader';
import AppFooter from '../../components/AppFooter';
import RoleIndicator from '../../components/RoleIndicator';

const navLinks = [
  { icon: FaHouse, label: 'Dashboard', to: '/dashboard' },
  { icon: FaTruck, label: 'Equipment', to: '/dashboard/equipment' },
  { icon: FaCalendar, label: 'Availability', to: '/dashboard/vendor-availability' },
  { icon: FaFolder, label: 'Past Rentals', to: '/dashboard/past-rentals' },
];

const equipment = [
  { name: 'RED Camera Package', rate: '₹15,000/day', status: 'available' },
  { name: 'Lighting Kit (LED)', rate: '₹8,000/day', status: 'available' },
  { name: 'Gimbal Stabilizer', rate: '₹5,000/day', status: 'booked' },
  { name: 'Transport Van', rate: '₹3,500/day', status: 'available' },
  { name: 'Sound Recording Kit', rate: '₹6,000/day', status: 'available' },
  { name: 'Drone Package', rate: '₹12,000/day', status: 'booked' },
];

export default function Equipment() {
  useEffect(() => {
    document.title = 'Equipment – CrewCall';
  }, []);

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

        <main className="flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden">
          <div className="flex-1 min-h-0 overflow-auto">
            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 md:px-8 lg:px-6 xl:px-8 py-4 sm:py-5">
              <div className="mb-4 sm:mb-5">
                <div className="flex items-center justify-between mb-2">
                  <h1 className="text-xl sm:text-2xl md:text-3xl text-neutral-900 font-bold break-words">
                    Equipment Management
                  </h1>
                  <RoleIndicator />
                </div>
                <p className="text-xs sm:text-sm text-neutral-600 break-words">
                  Manage your equipment inventory and rates
                </p>
              </div>

              <div className="mb-4 sm:mb-5">
                <button
                  onClick={() => {
                    alert('Add Equipment functionality - In production, this would open a form to add new equipment');
                  }}
                  className="px-4 py-2 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 text-sm font-medium"
                >
                  + Add Equipment
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {equipment.map((item, idx) => (
                  <div key={idx} className="rounded-lg bg-white border border-neutral-200 p-4 sm:p-6">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-base sm:text-lg text-neutral-900 font-bold truncate">{item.name}</h3>
                      <FaTruck className="text-neutral-400 shrink-0" />
                    </div>
                    <p className="text-sm sm:text-base text-neutral-600 mb-3">{item.rate}</p>
                    <div className="flex items-center justify-between">
                      <span className={`text-xs sm:text-sm px-2 py-1 rounded ${
                        item.status === 'available' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {item.status === 'available' ? 'Available' : 'Booked'}
                      </span>
                      <button
                        onClick={() => {
                          alert(`Edit ${item.name} - In production, this would open an edit form`);
                        }}
                        className="text-xs sm:text-sm text-neutral-600 hover:text-neutral-900"
                      >
                        Edit
                      </button>
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

