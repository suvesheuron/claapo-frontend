import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaHouse, FaCalendar, FaFolder, FaUser } from 'react-icons/fa6';
import DashboardHeader from '../../components/DashboardHeader';
import AppFooter from '../../components/AppFooter';
import RoleIndicator from '../../components/RoleIndicator';
import Avatar from '../../components/Avatar';

const navLinks = [
  { icon: FaHouse, label: 'Dashboard', to: '/dashboard' },
  { icon: FaCalendar, label: 'Availability', to: '/dashboard/availability' },
  { icon: FaFolder, label: 'Past Projects', to: '/dashboard/past-projects' },
  { icon: FaUser, label: 'Profile', to: '/dashboard/profile' },
];

export default function Profile() {
  useEffect(() => {
    document.title = 'Profile – CrewCall';
  }, []);

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-neutral-50 min-w-0 w-full">
      <DashboardHeader userName="John Director" />

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
                    My Profile
                  </h1>
                  <RoleIndicator />
                </div>
                <p className="text-xs sm:text-sm text-neutral-600 break-words">
                  Manage your profile information and settings
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                <div className="lg:col-span-1">
                  <div className="rounded-lg bg-white border border-neutral-200 p-6 text-center">
                    <div className="flex justify-center mb-4">
                      <Avatar name="John Director" size="lg" />
                    </div>
                    <h2 className="text-xl font-bold text-neutral-900 mb-1">John Director</h2>
                    <p className="text-sm text-neutral-600 mb-4">Director / DOP</p>
                    <button
                      onClick={() => {
                        alert('Profile saved successfully!');
                      }}
                      className="w-full px-4 py-2 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 text-sm"
                    >
                      Save Profile
                    </button>
                  </div>
                </div>

                <div className="lg:col-span-2 space-y-4 sm:space-y-6">
                  <div className="rounded-lg bg-white border border-neutral-200 p-4 sm:p-6">
                    <h3 className="text-lg font-bold text-neutral-900 mb-4">Personal Information</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-1">Full Name</label>
                        <input type="text" defaultValue="John Director" className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:border-neutral-900" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-1">Email</label>
                        <input type="email" defaultValue="john.director@example.com" className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:border-neutral-900" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-1">Phone</label>
                        <input type="tel" defaultValue="+91 98765 43210" className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:border-neutral-900" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-1">Location</label>
                        <input type="text" defaultValue="Mumbai, India" className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:border-neutral-900" />
                      </div>
                    </div>
                  </div>

                  <div className="rounded-lg bg-white border border-neutral-200 p-4 sm:p-6">
                    <h3 className="text-lg font-bold text-neutral-900 mb-4">Professional Details</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-1">Primary Role</label>
                        <input type="text" defaultValue="Director" className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:border-neutral-900" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-1">Experience</label>
                        <input type="text" defaultValue="12 years" className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:border-neutral-900" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-1">Daily Rate</label>
                        <input type="text" defaultValue="₹45,000/day" className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:border-neutral-900" />
                      </div>
                      <div className="pt-2">
                        <button
                          type="button"
                          onClick={() => {
                            alert('Profile updated successfully!');
                          }}
                          className="px-4 py-2 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 text-sm font-medium"
                        >
                          Save Changes
                        </button>
                      </div>
                    </div>
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

