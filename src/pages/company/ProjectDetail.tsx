import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { FaArrowLeft, FaUsers, FaTruck, FaLock, FaUnlock, FaHouse, FaFolder } from 'react-icons/fa6';
import DashboardHeader from '../../components/DashboardHeader';
import AppFooter from '../../components/AppFooter';
import RoleIndicator from '../../components/RoleIndicator';
import Avatar from '../../components/Avatar';

const lockedCrew = [
  { name: 'Rajesh Kumar', role: 'Cinematographer', rate: '₹25,000/day', status: 'Confirmed' },
  { name: 'Priya Sharma', role: 'Sound Engineer', rate: '₹15,000/day', status: 'Confirmed' },
  { name: 'Arjun Menon', role: 'Director', rate: '₹45,000/day', status: 'Confirmed' },
];

const lockedVendors = [
  { name: 'CineGear Rentals', equipment: 'RED Camera Package', rate: '₹15,000/day', status: 'Confirmed' },
  { name: 'Mumbai Locations', equipment: 'Location Services', rate: '₹12,000/day', status: 'Confirmed' },
];

const navLinks = [
  { icon: FaHouse, label: 'Dashboard', to: '/dashboard' },
  { icon: FaFolder, label: 'Projects', to: '/dashboard/projects' },
];

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const [isLocked, setIsLocked] = useState(false);

  useEffect(() => {
    document.title = 'Project Details – CrewCall';
  }, []);

  const handleLock = () => {
    setIsLocked(true);
    alert('Project locked! All confirmed crew and vendors are now locked.');
  };

  const handleUnlock = () => {
    setIsLocked(false);
    alert('Project unlocked. You can now make changes.');
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-neutral-50 min-w-0 w-full">
      <DashboardHeader />

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
            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 md:px-8 lg:px-6 xl:px-8 py-4 sm:py-5">
              <Link
                to="/dashboard/projects"
                className="inline-flex items-center gap-2 text-neutral-600 hover:text-neutral-900 mb-4 text-sm"
              >
                <FaArrowLeft className="w-4 h-4" />
                Back to Projects
              </Link>

              <div className="mb-4 sm:mb-5">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h1 className="text-xl sm:text-2xl md:text-3xl text-neutral-900 font-bold break-words">
                      Commercial Shoot
                    </h1>
                    <p className="text-sm text-neutral-600 mt-1">Jan 8-10, 2025 • Budget: ₹8.5L</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <RoleIndicator />
                    {!isLocked ? (
                      <button
                        onClick={handleLock}
                        className="px-4 py-2 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 text-sm font-medium flex items-center gap-2"
                      >
                        <FaLock className="w-4 h-4" />
                        Lock Project
                      </button>
                    ) : (
                      <button
                        onClick={handleUnlock}
                        className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm font-medium flex items-center gap-2"
                      >
                        <FaUnlock className="w-4 h-4" />
                        Unlock
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                {/* Locked Crew */}
                <div className="rounded-lg bg-white border border-neutral-200 p-4 sm:p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <FaUsers className="text-neutral-600" />
                    <h2 className="text-lg font-bold text-neutral-900">Locked Crew ({lockedCrew.length})</h2>
                  </div>
                  <div className="space-y-3">
                    {lockedCrew.map((member, idx) => (
                      <div key={idx} className="flex items-center gap-3 p-3 border border-neutral-200 rounded-lg">
                        <Avatar name={member.name} size="md" />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-neutral-900 truncate">{member.name}</h4>
                          <p className="text-sm text-neutral-600">{member.role}</p>
                          <p className="text-sm font-semibold text-neutral-900">{member.rate}</p>
                        </div>
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">
                          {member.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Locked Vendors */}
                <div className="rounded-lg bg-white border border-neutral-200 p-4 sm:p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <FaTruck className="text-neutral-600" />
                    <h2 className="text-lg font-bold text-neutral-900">Locked Vendors ({lockedVendors.length})</h2>
                  </div>
                  <div className="space-y-3">
                    {lockedVendors.map((vendor, idx) => (
                      <div key={idx} className="flex items-center gap-3 p-3 border border-neutral-200 rounded-lg">
                        <div className="w-12 h-12 rounded-lg bg-neutral-200 flex items-center justify-center">
                          <FaTruck className="text-neutral-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-neutral-900 truncate">{vendor.name}</h4>
                          <p className="text-sm text-neutral-600">{vendor.equipment}</p>
                          <p className="text-sm font-semibold text-neutral-900">{vendor.rate}</p>
                        </div>
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">
                          {vendor.status}
                        </span>
                      </div>
                    ))}
                  </div>
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

