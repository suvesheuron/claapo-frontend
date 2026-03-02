import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { FaArrowLeft, FaUsers, FaTruck, FaLock, FaUnlock, FaHouse, FaFolder, FaTrash, FaBan, FaMessage, FaFileInvoice, FaMagnifyingGlass, FaUser } from 'react-icons/fa6';
import DashboardHeader from '../../components/DashboardHeader';
import DashboardSidebar from '../../components/DashboardSidebar';
import AppFooter from '../../components/AppFooter';
import Avatar from '../../components/Avatar';

type CrewMember = { id: number; name: string; role: string; rate: string; status: string };
type Vendor = { id: number; name: string; equipment: string; rate: string; status: string };

const initialCrew: CrewMember[] = [
  { id: 1, name: 'Rajesh Kumar', role: 'Cinematographer', rate: '₹25,000/day', status: 'Confirmed' },
  { id: 2, name: 'Priya Sharma', role: 'Sound Engineer', rate: '₹15,000/day', status: 'Confirmed' },
  { id: 3, name: 'Arjun Menon', role: 'Director', rate: '₹45,000/day', status: 'Confirmed' },
];

const initialVendors: Vendor[] = [
  { id: 1, name: 'CineGear Rentals', equipment: 'RED Camera Package', rate: '₹15,000/day', status: 'Confirmed' },
  { id: 2, name: 'Mumbai Locations', equipment: 'Location Services', rate: '₹12,000/day', status: 'Confirmed' },
];

import { FaCalendar } from 'react-icons/fa6';

const navLinks = [
  { icon: FaHouse,           label: 'Dashboard',    to: '/dashboard' },
  { icon: FaCalendar,        label: 'Availability', to: '/dashboard/company-availability' },
  { icon: FaFolder,          label: 'Projects',     to: '/dashboard/projects' },
  { icon: FaFolder,          label: 'Past Projects', to: '/dashboard/company-past-projects' },
  { icon: FaMagnifyingGlass, label: 'Search',       to: '/dashboard/search' },
  { icon: FaUser,            label: 'Profile',      to: '/dashboard/company-profile' },
];

export default function ProjectDetail() {
  const { id: _id } = useParams<{ id: string }>();
  const [isLocked, setIsLocked] = useState(false);
  const [crew, setCrew] = useState<CrewMember[]>(initialCrew);
  const [vendors, setVendors] = useState<Vendor[]>(initialVendors);
  const [removingCrew, setRemovingCrew] = useState<number | null>(null);
  const [cancellingVendor, setCancellingVendor] = useState<number | null>(null);

  useEffect(() => {
    document.title = 'Project Details – Claapo';
  }, []);

  const handleRemoveCrew = (id: number) => {
    setRemovingCrew(id);
  };

  const confirmRemoveCrew = (id: number) => {
    setCrew((prev) => prev.filter((m) => m.id !== id));
    setRemovingCrew(null);
  };

  const handleCancelVendor = (id: number) => {
    setCancellingVendor(id);
  };

  const confirmCancelVendor = (id: number) => {
    setVendors((prev) => prev.filter((v) => v.id !== id));
    setCancellingVendor(null);
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-[#F3F4F6] w-full">
      <DashboardHeader />

      <div className="flex-1 flex min-h-0 overflow-hidden">
        <DashboardSidebar links={navLinks} />

        {/* Main content */}
        <main className="flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden">
          <div className="flex-1 min-h-0 overflow-auto">
            <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-6 xl:px-8 py-5">

              {/* Back + page header */}
              <Link
                to="/dashboard/projects"
                className="inline-flex items-center gap-2 text-neutral-500 hover:text-[#3678F1] mb-5 text-sm transition-colors"
              >
                <FaArrowLeft className="w-3.5 h-3.5" />
                Back to Projects
              </Link>

              <div className="flex items-start justify-between gap-4 mb-6">
                <div>
                  <h1 className="text-xl font-bold text-neutral-900">Commercial Shoot</h1>
                  <p className="text-sm text-neutral-500 mt-0.5">Jan 8–10, 2025 · Budget: ₹8.5L</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {!isLocked ? (
                    <button
                      onClick={() => setIsLocked(true)}
                      className="rounded-xl px-4 py-2 bg-[#3678F1] text-white text-sm font-semibold hover:bg-[#2563d4] flex items-center gap-2 transition-colors"
                    >
                      <FaLock className="w-3.5 h-3.5" /> Lock Project
                    </button>
                  ) : (
                    <button
                      onClick={() => setIsLocked(false)}
                      className="rounded-xl px-4 py-2 bg-[#F4C430] text-neutral-900 text-sm font-bold hover:bg-[#e6b820] flex items-center gap-2 transition-colors"
                    >
                      <FaUnlock className="w-3.5 h-3.5" /> Unlock
                    </button>
                  )}
                </div>
              </div>

              {/* Lock banner */}
              {isLocked && (
                <div className="rounded-2xl bg-[#DCFCE7] border border-[#86EFAC] p-4 mb-5 flex items-center gap-3">
                  <FaLock className="text-[#15803D] shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-[#15803D]">Project is locked</p>
                    <p className="text-xs text-[#166534] mt-0.5">All confirmed crew and vendors are locked for this project. Unlock to make changes.</p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Locked Crew */}
                <div className="rounded-2xl bg-white border border-neutral-200 p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-[#EEF4FF] flex items-center justify-center">
                        <FaUsers className="text-[#3678F1] text-sm" />
                      </div>
                      <h2 className="text-sm font-bold text-neutral-900">Crew ({crew.length})</h2>
                    </div>
                    {!isLocked && (
                      <Link
                        to="/dashboard/search"
                        className="text-xs text-[#3678F1] hover:underline font-medium"
                      >
                        + Add Crew
                      </Link>
                    )}
                  </div>

                  {crew.length === 0 ? (
                    <div className="text-center py-8">
                      <FaUsers className="text-neutral-300 text-2xl mx-auto mb-2" />
                      <p className="text-sm text-neutral-500">No crew members assigned</p>
                      <Link to="/dashboard/search" className="text-xs text-[#3678F1] hover:underline mt-1 inline-block">Search for crew</Link>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {crew.map((member) => (
                        <div key={member.id} className="rounded-xl border border-neutral-200 p-3 bg-[#FAFAFA]">
                          {removingCrew === member.id ? (
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-xs text-neutral-700 font-medium">Remove <span className="font-bold">{member.name}</span> from project?</p>
                              <div className="flex gap-2 shrink-0">
                                <button
                                  onClick={() => confirmRemoveCrew(member.id)}
                                  className="px-3 py-1.5 bg-[#F40F02] text-white text-xs font-semibold rounded-lg hover:bg-red-700 transition-colors"
                                >
                                  Remove
                                </button>
                                <button
                                  onClick={() => setRemovingCrew(null)}
                                  className="px-3 py-1.5 bg-neutral-100 text-neutral-700 text-xs font-semibold rounded-lg hover:bg-neutral-200 transition-colors"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-3">
                              <Avatar name={member.name} size="sm" />
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-neutral-900 truncate">{member.name}</p>
                                <p className="text-[11px] text-neutral-500">{member.role} · {member.rate}</p>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#DCFCE7] text-[#15803D]">
                                  {member.status}
                                </span>
                                <button
                                  type="button"
                                  title="View Chat"
                                  className="w-7 h-7 rounded-lg bg-[#F3F4F6] flex items-center justify-center text-neutral-500 hover:bg-[#EEF4FF] hover:text-[#3678F1] transition-colors"
                                >
                                  <FaMessage className="text-xs" />
                                </button>
                                {!isLocked && (
                                  <button
                                    type="button"
                                    title="Remove from project"
                                    onClick={() => handleRemoveCrew(member.id)}
                                    className="w-7 h-7 rounded-lg bg-[#F3F4F6] flex items-center justify-center text-neutral-400 hover:bg-[#FEE2E2] hover:text-[#F40F02] transition-colors"
                                  >
                                    <FaTrash className="text-xs" />
                                  </button>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Locked Vendors */}
                <div className="rounded-2xl bg-white border border-neutral-200 p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-[#FEF9E6] flex items-center justify-center">
                        <FaTruck className="text-[#F4C430] text-sm" />
                      </div>
                      <h2 className="text-sm font-bold text-neutral-900">Vendors ({vendors.length})</h2>
                    </div>
                    {!isLocked && (
                      <Link
                        to="/dashboard/search?type=vendors"
                        className="text-xs text-[#3678F1] hover:underline font-medium"
                      >
                        + Add Vendor
                      </Link>
                    )}
                  </div>

                  {vendors.length === 0 ? (
                    <div className="text-center py-8">
                      <FaTruck className="text-neutral-300 text-2xl mx-auto mb-2" />
                      <p className="text-sm text-neutral-500">No vendors assigned</p>
                      <Link to="/dashboard/search?type=vendors" className="text-xs text-[#3678F1] hover:underline mt-1 inline-block">Search for vendors</Link>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {vendors.map((vendor) => (
                        <div key={vendor.id} className="rounded-xl border border-neutral-200 p-3 bg-[#FAFAFA]">
                          {cancellingVendor === vendor.id ? (
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-xs text-neutral-700 font-medium">Cancel booking for <span className="font-bold">{vendor.name}</span>?</p>
                              <div className="flex gap-2 shrink-0">
                                <button
                                  onClick={() => confirmCancelVendor(vendor.id)}
                                  className="px-3 py-1.5 bg-[#F40F02] text-white text-xs font-semibold rounded-lg hover:bg-red-700 transition-colors"
                                >
                                  Cancel Booking
                                </button>
                                <button
                                  onClick={() => setCancellingVendor(null)}
                                  className="px-3 py-1.5 bg-neutral-100 text-neutral-700 text-xs font-semibold rounded-lg hover:bg-neutral-200 transition-colors"
                                >
                                  Keep
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-[#EEF4FF] flex items-center justify-center shrink-0">
                                <FaTruck className="text-[#3678F1] text-xs" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-neutral-900 truncate">{vendor.name}</p>
                                <p className="text-[11px] text-neutral-500">{vendor.equipment} · {vendor.rate}</p>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#DCFCE7] text-[#15803D]">
                                  {vendor.status}
                                </span>
                                <button
                                  type="button"
                                  title="View Invoice"
                                  className="w-7 h-7 rounded-lg bg-[#F3F4F6] flex items-center justify-center text-neutral-500 hover:bg-[#EEF4FF] hover:text-[#3678F1] transition-colors"
                                >
                                  <FaFileInvoice className="text-xs" />
                                </button>
                                {!isLocked && (
                                  <button
                                    type="button"
                                    title="Cancel vendor booking"
                                    onClick={() => handleCancelVendor(vendor.id)}
                                    className="w-7 h-7 rounded-lg bg-[#F3F4F6] flex items-center justify-center text-neutral-400 hover:bg-[#FEE2E2] hover:text-[#F40F02] transition-colors"
                                  >
                                    <FaBan className="text-xs" />
                                  </button>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Budget summary */}
              <div className="rounded-2xl bg-white border border-neutral-200 p-5 mt-5">
                <h3 className="text-sm font-bold text-neutral-900 mb-4">Budget Summary</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: 'Total Budget', value: '₹8.5L', color: 'text-neutral-900' },
                    { label: 'Crew Cost', value: `₹${(85000 * crew.length / 100000).toFixed(1)}L`, color: 'text-[#3678F1]' },
                    { label: 'Vendor Cost', value: `₹${(27000 * vendors.length / 100000).toFixed(1)}L`, color: 'text-[#F4C430]' },
                    { label: 'Remaining', value: '₹5.2L', color: 'text-[#22C55E]' },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="rounded-xl bg-[#F3F4F6] p-3">
                      <p className="text-xs text-neutral-500">{label}</p>
                      <p className={`text-lg font-bold mt-1 ${color}`}>{value}</p>
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
