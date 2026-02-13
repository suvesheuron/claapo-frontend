import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FaPlus, FaUsers, FaTruck, FaHouse, FaFolder, FaLock, FaEye } from 'react-icons/fa6';
import DashboardHeader from '../../components/DashboardHeader';
import AppFooter from '../../components/AppFooter';
import RoleIndicator from '../../components/RoleIndicator';

const projects = [
  { 
    id: 1,
    name: 'Commercial Shoot', 
    dates: 'Jan 8-10, 2025', 
    crew: 12, 
    vendors: 3,
    status: 'Active', 
    statusClass: 'bg-neutral-900 text-white',
    budget: '₹8.5L',
    locked: true,
  },
  { 
    id: 2,
    name: 'Documentary', 
    dates: 'Jan 15-17, 2025', 
    crew: 8, 
    vendors: 2,
    status: 'Planning', 
    statusClass: 'bg-neutral-100 text-neutral-700',
    budget: '₹5.2L',
    locked: false,
  },
  { 
    id: 3,
    name: 'Music Video', 
    dates: 'Jan 22-23, 2025', 
    crew: 6, 
    vendors: 1,
    status: 'In Progress', 
    statusClass: 'bg-neutral-600 text-white',
    budget: '₹3.8L',
    locked: false,
  },
];

const navLinks = [
  { icon: FaHouse, label: 'Dashboard', to: '/dashboard' },
  { icon: FaFolder, label: 'Projects', to: '/dashboard/projects' },
  { icon: FaUsers, label: 'Search Crew', to: '/dashboard/search' },
  { icon: FaTruck, label: 'Search Vendors', to: '/dashboard/search?type=vendors' },
];

export default function Projects() {
  const [selectedProject, setSelectedProject] = useState<number | null>(null);

  useEffect(() => {
    document.title = 'Projects – CrewCall';
  }, []);

  const handleLockProject = (projectId: number) => {
    // In real app, this would call an API
    alert(`Project locked! All confirmed crew and vendors are now locked for this project.`);
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
              <div className="mb-4 sm:mb-5">
                <div className="flex items-center justify-between mb-2">
                  <h1 className="text-xl sm:text-2xl md:text-3xl text-neutral-900 font-bold break-words">
                    Projects
                  </h1>
                  <div className="flex items-center gap-2">
                    <RoleIndicator />
                    <Link
                      to="/dashboard/projects/new"
                      className="px-4 py-2 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 text-sm font-medium flex items-center gap-2"
                    >
                      <FaPlus className="w-4 h-4" />
                      <span className="hidden sm:inline">New Project</span>
                    </Link>
                  </div>
                </div>
                <p className="text-xs sm:text-sm text-neutral-600 break-words">
                  Manage your production projects and team
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {projects.map((project) => (
                  <div key={project.id} className="rounded-lg bg-white border border-neutral-200 p-4 sm:p-6 hover:shadow-lg transition">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg sm:text-xl font-bold text-neutral-900 mb-1 truncate">{project.name}</h3>
                        <p className="text-sm text-neutral-600 mb-2">{project.dates}</p>
                        <div className="flex items-center gap-4 text-xs sm:text-sm text-neutral-600 mb-2">
                          <span className="flex items-center gap-1">
                            <FaUsers className="w-3 h-3" />
                            {project.crew} crew
                          </span>
                          <span className="flex items-center gap-1">
                            <FaTruck className="w-3 h-3" />
                            {project.vendors} vendors
                          </span>
                        </div>
                        <p className="text-sm font-semibold text-neutral-900 mb-3">Budget: {project.budget}</p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded shrink-0 ${project.statusClass}`}>
                        {project.status}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link
                        to={`/dashboard/projects/${project.id}`}
                        className="flex-1 px-3 py-2 border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 text-sm text-center flex items-center justify-center gap-2"
                      >
                        <FaEye className="w-4 h-4" />
                        View Details
                      </Link>
                      {!project.locked && (
                        <button
                          onClick={() => handleLockProject(project.id)}
                          className="px-3 py-2 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 text-sm flex items-center gap-2"
                        >
                          <FaLock className="w-4 h-4" />
                          Lock
                        </button>
                      )}
                      {project.locked && (
                        <span className="px-3 py-2 bg-green-100 text-green-800 rounded-lg text-sm flex items-center gap-2">
                          <FaLock className="w-4 h-4" />
                          Locked
                        </span>
                      )}
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

