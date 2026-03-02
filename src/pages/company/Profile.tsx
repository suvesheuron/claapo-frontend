import { useEffect } from 'react';
import {
  FaHouse, FaCalendar, FaFolder, FaMagnifyingGlass, FaUser,
  FaBuilding, FaPhone, FaEnvelope, FaLocationDot, FaIdCard,
} from 'react-icons/fa6';
import DashboardHeader from '../../components/DashboardHeader';
import DashboardSidebar from '../../components/DashboardSidebar';
import AppFooter from '../../components/AppFooter';
import Avatar from '../../components/Avatar';

const navLinks = [
  { icon: FaHouse,           label: 'Dashboard',      to: '/dashboard' },
  { icon: FaCalendar,        label: 'Availability',   to: '/dashboard/company-availability' },
  { icon: FaFolder,          label: 'Projects',        to: '/dashboard/projects' },
  { icon: FaFolder,          label: 'Past Projects',   to: '/dashboard/company-past-projects' },
  { icon: FaMagnifyingGlass, label: 'Search',          to: '/dashboard/search' },
  { icon: FaUser,            label: 'Profile',         to: '/dashboard/company-profile' },
];

export default function CompanyProfile() {
  useEffect(() => { document.title = 'Company Profile – Claapo'; }, []);

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-[#F3F4F6] w-full">
      <DashboardHeader />

      <div className="flex-1 flex min-h-0 overflow-hidden">
        <DashboardSidebar links={navLinks} />

        <main className="flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden">
          <div className="flex-1 min-h-0 overflow-auto">
            <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-6 xl:px-8 py-5">

              <div className="mb-5">
                <h1 className="text-xl font-bold text-neutral-900">Company Profile</h1>
                <p className="text-sm text-neutral-500 mt-0.5">Manage your company details and settings</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

                {/* Left — Company card */}
                <div className="lg:col-span-1 space-y-4">
                  <div className="rounded-2xl bg-white border border-neutral-200 p-5 text-center">
                    <div className="flex justify-center mb-3">
                      <div className="relative">
                        <Avatar name="Production Studios Inc." size="lg" />
                        <button
                          type="button"
                          className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#3678F1] text-white flex items-center justify-center shadow-sm hover:bg-[#2c65d4] transition-colors"
                          title="Change logo"
                        >
                          <span className="text-[10px] font-bold">✎</span>
                        </button>
                      </div>
                    </div>
                    <h2 className="text-base font-bold text-neutral-900 mb-0.5">Production Studios Inc.</h2>
                    <p className="text-xs text-neutral-500 mb-1">Production Company</p>
                    <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-[#D1FAE5] text-[#065F46] font-semibold">
                      ✓ Verified
                    </span>

                    <div className="mt-4 pt-4 border-t border-neutral-100 space-y-2 text-left">
                      {[
                        { icon: FaBuilding, label: 'Mumbai, Maharashtra' },
                        { icon: FaIdCard,   label: 'GST: 27AABCU9603R1ZM' },
                      ].map(({ icon: Icon, label }) => (
                        <div key={label} className="flex items-center gap-2 text-xs text-neutral-500">
                          <Icon className="w-3 h-3 text-neutral-400 shrink-0" />
                          <span>{label}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="rounded-2xl bg-white border border-neutral-200 p-4">
                    <h3 className="text-xs font-bold text-neutral-700 mb-3 uppercase tracking-wide">Activity</h3>
                    {[
                      { label: 'Total Projects', value: '24' },
                      { label: 'Crew Hired', value: '148' },
                      { label: 'Vendors Used', value: '37' },
                      { label: 'Active This Month', value: '3' },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex justify-between items-center py-2 border-b border-neutral-100 last:border-0">
                        <span className="text-xs text-neutral-500">{label}</span>
                        <span className="text-sm font-bold text-neutral-900">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right — Forms */}
                <div className="lg:col-span-2 space-y-4">
                  {/* Company info */}
                  <div className="rounded-2xl bg-white border border-neutral-200 p-5">
                    <h3 className="text-sm font-bold text-neutral-900 mb-4">Company Information</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-neutral-600 mb-1">Company Name</label>
                        <div className="relative">
                          <FaBuilding className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 w-3.5 h-3.5" />
                          <input
                            type="text"
                            defaultValue="Production Studios Inc."
                            className="w-full pl-9 pr-3 py-2.5 border border-neutral-300 rounded-xl text-sm focus:outline-none focus:border-[#3678F1] focus:ring-1 focus:ring-[#3678F1]/20 transition-all"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-neutral-600 mb-1">Phone</label>
                          <div className="relative">
                            <FaPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 w-3.5 h-3.5" />
                            <input
                              type="tel"
                              defaultValue="+91 98xxx xxxxx"
                              className="w-full pl-9 pr-3 py-2.5 border border-neutral-300 rounded-xl text-sm focus:outline-none focus:border-[#3678F1] focus:ring-1 focus:ring-[#3678F1]/20 transition-all"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-neutral-600 mb-1">
                            GST Number
                            <span className="ml-1 text-[10px] font-normal text-neutral-400 bg-neutral-100 px-1.5 py-0.5 rounded-full">Optional</span>
                          </label>
                          <div className="relative">
                            <FaIdCard className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 w-3.5 h-3.5" />
                            <input
                              type="text"
                              defaultValue="27AABCU9603R1ZM"
                              className="w-full pl-9 pr-3 py-2.5 border border-neutral-300 rounded-xl text-sm focus:outline-none focus:border-[#3678F1] focus:ring-1 focus:ring-[#3678F1]/20 transition-all"
                            />
                          </div>
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-neutral-600 mb-1">Business Email</label>
                        <div className="relative">
                          <FaEnvelope className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 w-3.5 h-3.5" />
                          <input
                            type="email"
                            defaultValue="contact@productionstudios.in"
                            className="w-full pl-9 pr-3 py-2.5 border border-neutral-300 rounded-xl text-sm focus:outline-none focus:border-[#3678F1] focus:ring-1 focus:ring-[#3678F1]/20 transition-all"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-neutral-600 mb-1">Address</label>
                        <div className="relative">
                          <FaLocationDot className="absolute left-3 top-3 text-neutral-400 w-3.5 h-3.5" />
                          <textarea
                            defaultValue="Studio 4, Film City, Goregaon East, Mumbai — 400065"
                            rows={2}
                            className="w-full pl-9 pr-3 py-2.5 border border-neutral-300 rounded-xl text-sm focus:outline-none focus:border-[#3678F1] focus:ring-1 focus:ring-[#3678F1]/20 transition-all resize-none"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 flex justify-end">
                      <button
                        type="button"
                        onClick={() => alert('Company info saved!')}
                        className="px-5 py-2.5 bg-[#3678F1] text-white rounded-xl text-sm font-semibold hover:bg-[#2c65d4] transition-colors"
                      >
                        Save Changes
                      </button>
                    </div>
                  </div>

                  {/* Password */}
                  <div className="rounded-2xl bg-white border border-neutral-200 p-5">
                    <h3 className="text-sm font-bold text-neutral-900 mb-4">Change Password</h3>
                    <div className="space-y-3">
                      {['Current Password', 'New Password', 'Confirm Password'].map((label) => (
                        <div key={label}>
                          <label className="block text-xs font-medium text-neutral-600 mb-1">{label}</label>
                          <input
                            type="password"
                            placeholder="••••••••"
                            className="w-full px-3 py-2.5 border border-neutral-300 rounded-xl text-sm focus:outline-none focus:border-[#3678F1] focus:ring-1 focus:ring-[#3678F1]/20 transition-all"
                          />
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 flex justify-end">
                      <button
                        type="button"
                        onClick={() => alert('Password updated!')}
                        className="px-5 py-2.5 bg-[#3678F1] text-white rounded-xl text-sm font-semibold hover:bg-[#2c65d4] transition-colors"
                      >
                        Update Password
                      </button>
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
