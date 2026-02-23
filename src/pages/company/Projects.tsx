import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaPlus, FaUsers, FaTruck, FaHouse, FaFolder, FaLock, FaEye, FaCalendar, FaMagnifyingGlass, FaUser } from 'react-icons/fa6';
import DashboardHeader from '../../components/DashboardHeader';
import DashboardSidebar from '../../components/DashboardSidebar';
import AppFooter from '../../components/AppFooter';

const projects = [
  {
    id: 1,
    name: 'Commercial Shoot',
    dates: 'Jan 8–10, 2025',
    crew: 12,
    vendors: 3,
    status: 'active' as const,
    budget: '₹8.5L',
    locked: true,
  },
  {
    id: 2,
    name: 'Documentary',
    dates: 'Jan 15–17, 2025',
    crew: 8,
    vendors: 2,
    status: 'planning' as const,
    budget: '₹5.2L',
    locked: false,
  },
  {
    id: 3,
    name: 'Music Video',
    dates: 'Jan 22–23, 2025',
    crew: 6,
    vendors: 1,
    status: 'in-progress' as const,
    budget: '₹3.8L',
    locked: false,
  },
];

type Status = 'active' | 'planning' | 'in-progress';

const statusConfig: Record<Status, { bg: string; text: string; label: string }> = {
  active:      { bg: 'bg-[#DBEAFE]', text: 'text-[#1D4ED8]', label: 'Active' },
  planning:    { bg: 'bg-[#F3F4F6]', text: 'text-neutral-600', label: 'Planning' },
  'in-progress': { bg: 'bg-[#FEF9E6]', text: 'text-[#92400E]', label: 'In Progress' },
};

const navLinks = [
  { icon: FaHouse,           label: 'Dashboard',    to: '/dashboard' },
  { icon: FaCalendar,        label: 'Availability', to: '/dashboard/company-availability' },
  { icon: FaFolder,          label: 'Projects',     to: '/dashboard/projects' },
  { icon: FaFolder,          label: 'Past Projects', to: '/dashboard/company-past-projects' },
  { icon: FaMagnifyingGlass, label: 'Search',       to: '/dashboard/search' },
  { icon: FaUser,            label: 'Profile',      to: '/dashboard/company-profile' },
];

export default function Projects() {
  useEffect(() => {
    document.title = 'Projects – CrewCall';
  }, []);

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-[#F3F4F6] w-full">
      <DashboardHeader />

      <div className="flex-1 flex min-h-0 overflow-hidden">
        <DashboardSidebar links={navLinks} />

        <main className="flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden">
          <div className="flex-1 min-h-0 overflow-auto">
            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-6 xl:px-8 py-5">

              <div className="flex items-center justify-between mb-5">
                <div>
                  <h1 className="text-xl font-bold text-neutral-900">Projects</h1>
                  <p className="text-sm text-neutral-500 mt-0.5">Manage your production projects and team</p>
                </div>
                <div className="flex items-center gap-3">
                  <Link
                    to="/dashboard/projects/new"
                    className="rounded-xl px-4 py-2.5 bg-[#3678F1] text-white text-sm font-semibold hover:bg-[#2563d4] flex items-center gap-2 transition-colors"
                  >
                    <FaPlus className="w-3 h-3" />
                    <span className="hidden sm:inline">New Project</span>
                  </Link>
                </div>
              </div>

              {/* Empty state hint */}
              {projects.length === 0 && (
                <div className="rounded-2xl bg-white border border-neutral-200 p-12 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-[#EEF4FF] flex items-center justify-center mx-auto mb-4">
                    <FaFolder className="text-[#3678F1] text-2xl" />
                  </div>
                  <h3 className="text-base font-bold text-neutral-900 mb-2">No projects yet</h3>
                  <p className="text-sm text-neutral-500 mb-5">Create your first project to get started</p>
                  <Link
                    to="/dashboard/projects/new"
                    className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 bg-[#F4C430] text-neutral-900 text-sm font-bold hover:bg-[#e6b820] transition-colors"
                  >
                    <FaPlus className="w-3 h-3" /> Create Project
                  </Link>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {projects.map((project) => {
                  const cfg = statusConfig[project.status];
                  return (
                    <div
                      key={project.id}
                      className="rounded-2xl bg-white border border-neutral-200 p-5 hover:shadow-md hover:border-neutral-300 transition-all flex flex-col"
                    >
                      {/* Card header */}
                      <div className="flex items-start justify-between gap-2 mb-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-8 h-8 rounded-lg bg-[#EEF4FF] flex items-center justify-center shrink-0">
                              <FaCalendar className="text-[#3678F1] text-xs" />
                            </div>
                            <h3 className="text-sm font-bold text-neutral-900 truncate">{project.name}</h3>
                          </div>
                          <p className="text-xs text-neutral-400 pl-10">{project.dates}</p>
                        </div>
                        <span className={`text-[11px] px-2.5 py-1 rounded-full font-semibold shrink-0 ${cfg.bg} ${cfg.text}`}>
                          {cfg.label}
                        </span>
                      </div>

                      {/* Metadata */}
                      <div className="grid grid-cols-3 gap-2 mb-4">
                        <div className="rounded-xl bg-[#F3F4F6] p-2.5 text-center">
                          <p className="text-xs font-bold text-neutral-900">{project.crew}</p>
                          <p className="text-[10px] text-neutral-500 mt-0.5">Crew</p>
                        </div>
                        <div className="rounded-xl bg-[#F3F4F6] p-2.5 text-center">
                          <p className="text-xs font-bold text-neutral-900">{project.vendors}</p>
                          <p className="text-[10px] text-neutral-500 mt-0.5">Vendors</p>
                        </div>
                        <div className="rounded-xl bg-[#F3F4F6] p-2.5 text-center">
                          <p className="text-xs font-bold text-neutral-900">{project.budget}</p>
                          <p className="text-[10px] text-neutral-500 mt-0.5">Budget</p>
                        </div>
                      </div>

                      {/* Lock status */}
                      {project.locked && (
                        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#DCFCE7] mb-3">
                          <FaLock className="w-3 h-3 text-[#15803D]" />
                          <span className="text-[11px] font-semibold text-[#15803D]">Crew & Vendors Locked</span>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex items-center gap-2 mt-auto">
                        <Link
                          to={`/dashboard/projects/${project.id}`}
                          className="flex-1 rounded-xl py-2 border border-neutral-200 text-neutral-700 text-xs font-semibold text-center hover:bg-neutral-50 flex items-center justify-center gap-1.5 transition-colors"
                        >
                          <FaEye className="w-3 h-3" /> View Details
                        </Link>
                        {!project.locked && (
                          <button
                            onClick={() => alert(`Project locked! All confirmed crew and vendors are now locked.`)}
                            className="rounded-xl px-3.5 py-2 bg-[#3678F1] text-white text-xs font-semibold hover:bg-[#2563d4] flex items-center gap-1.5 transition-colors"
                          >
                            <FaLock className="w-3 h-3" /> Lock
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>
          </div>

          <AppFooter />
        </main>
      </div>
    </div>
  );
}
