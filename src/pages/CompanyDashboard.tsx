import { Link } from 'react-router-dom';
import { useEffect } from 'react';
import { FaPlus, FaUsers, FaTruck, FaHouse, FaFolder } from 'react-icons/fa6';
import DashboardHeader from '../components/DashboardHeader';
import AppFooter from '../components/AppFooter';
import RoleIndicator from '../components/RoleIndicator';

const quickActions = [
  { icon: FaPlus, title: 'Create Project', description: 'Start a new film production', to: '/dashboard/projects/new' },
  { icon: FaUsers, title: 'Search Crew', description: 'Find freelance professionals', to: '/dashboard/search' },
  { icon: FaTruck, title: 'Search Vendors', description: 'Find equipment and services', to: '/dashboard/search?type=vendors' },
];

const projects = [
  { name: 'Commercial Shoot', dates: 'Jan 8-10, 2025', crew: 12, status: 'Active', statusClass: 'bg-neutral-900 text-white' },
  { name: 'Documentary', dates: 'Jan 15-17, 2025', crew: 8, status: 'Planning', statusClass: 'bg-neutral-100 text-neutral-700' },
  { name: 'Music Video', dates: 'Jan 22-23, 2025', crew: 6, status: 'In Progress', statusClass: 'bg-neutral-600 text-white' },
];

type CalendarCell = { d: number; muted: boolean; project?: string | null };
const calendarDays: CalendarCell[] = [
  ...[29, 30, 31].map((d) => ({ d, muted: true })),
  ...[1, 2, 3, 4, 5, 6, 7].map((d) => ({ d, muted: false, project: null })),
  { d: 8, muted: false, project: 'Commercial Shoot' },
  { d: 9, muted: false, project: 'Commercial Shoot' },
  { d: 10, muted: false, project: 'Commercial Shoot' },
  ...[11, 12, 13, 14].map((d) => ({ d, muted: false, project: null })),
  { d: 15, muted: false, project: 'Documentary' },
  { d: 16, muted: false, project: 'Documentary' },
  { d: 17, muted: false, project: 'Documentary' },
  ...[18, 19, 20, 21].map((d) => ({ d, muted: false, project: null })),
  { d: 22, muted: false, project: 'Music Video' },
  { d: 23, muted: false, project: 'Music Video' },
  ...[24, 25, 26, 27, 28, 29, 30, 31].map((d) => ({ d, muted: false, project: null })),
  { d: 1, muted: true },
];

const navLinks = [
  { icon: FaHouse, label: 'Dashboard', to: '/dashboard' },
  { icon: FaFolder, label: 'Projects', to: '/dashboard/projects' },
  { icon: FaUsers, label: 'Search Crew', to: '/dashboard/search' },
  { icon: FaTruck, label: 'Search Vendors', to: '/dashboard/search?type=vendors' },
];

export default function CompanyDashboard() {
  useEffect(() => {
    document.title = 'Dashboard – CrewCall';
  }, []);

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-neutral-50 min-w-0 w-full">
      <DashboardHeader />

      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Sidebar: hidden on mobile, visible from lg */}
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

        {/* Main content: flex-1, scrolls via overflow-auto */}
        <main className="flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden">
          <div className="flex-1 min-h-0 overflow-auto">
            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 md:px-8 lg:px-6 xl:px-8 py-4 sm:py-5">
              <div className="mb-4 sm:mb-5">
                <div className="flex items-center justify-between mb-2">
                  <h1 className="text-xl sm:text-2xl md:text-3xl text-neutral-900 font-bold break-words">
                    Company Dashboard
                  </h1>
                  <RoleIndicator />
                </div>
                <p className="text-xs sm:text-sm text-neutral-600 break-words">
                  Manage your projects and crew scheduling
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-5 min-w-0">
                {quickActions.map((action) => (
                  <Link
                    key={action.title}
                    to={action.to}
                    className="rounded-lg p-3 sm:p-4 bg-white border border-neutral-200 hover:border-neutral-900 text-left group block min-w-0"
                  >
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-neutral-100 group-hover:bg-neutral-700 flex items-center justify-center mb-2 sm:mb-3">
                      <action.icon className="text-neutral-600 group-hover:text-white text-base sm:text-lg" />
                    </div>
                    <h3 className="text-sm sm:text-base text-neutral-900 mb-0.5 font-bold">{action.title}</h3>
                    <p className="text-xs text-neutral-600">{action.description}</p>
                  </Link>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-4 gap-3 sm:gap-4 min-w-0">
                <div className="lg:col-span-3 min-w-0 order-2 lg:order-1 overflow-hidden">
                  <div className="rounded-lg bg-white border border-neutral-200 p-3 sm:p-4 min-w-0 overflow-hidden">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3 mb-3 sm:mb-4">
                      <h2 className="text-base sm:text-lg text-neutral-900 font-bold break-words">
                        Project Calendar
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
                              className={`rounded min-h-[32px] h-9 sm:h-12 md:h-14 p-0.5 sm:p-1 text-[10px] sm:text-xs border border-neutral-200 min-w-0 overflow-hidden ${
                                cell.muted ? 'text-neutral-400' : 'text-neutral-900'
                              } ${cell.project === 'Commercial Shoot' ? 'bg-neutral-900 text-white' : ''} ${
                                cell.project === 'Documentary' ? 'bg-neutral-100' : ''
                              } ${cell.project === 'Music Video' ? 'bg-neutral-600 text-white' : ''}`}
                            >
                              {cell.d}
                              {cell.project && (
                                <div className="text-[8px] sm:text-[10px] mt-0.5 truncate">{cell.project}</div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 sm:gap-3 mt-2 sm:mt-3 text-[10px] sm:text-xs">
                      <div className="flex items-center gap-1.5">
                        <div className="rounded w-3 h-3 bg-neutral-900" />
                        <span className="text-neutral-600">Active</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="rounded w-3 h-3 bg-neutral-600" />
                        <span className="text-neutral-600">In Progress</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="rounded w-3 h-3 bg-neutral-100 border border-neutral-300" />
                        <span className="text-neutral-600">Planning</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 sm:space-y-4 order-1 lg:order-2 min-w-0">
                  <div className="rounded-lg bg-white border border-neutral-200 p-3 sm:p-4 min-w-0">
                    <h3 className="text-sm sm:text-base text-neutral-900 mb-2 sm:mb-3 font-bold break-words">
                      Ongoing Projects
                    </h3>
                    <div className="space-y-2 sm:space-y-3 max-h-[200px] overflow-y-auto">
                      {projects.map((p) => (
                        <div key={p.name} className="rounded-lg border border-neutral-200 p-2.5 sm:p-3 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-0.5 min-w-0">
                            <h4 className="text-xs sm:text-sm text-neutral-900 font-bold truncate">{p.name}</h4>
                            <span
                              className={`text-[10px] sm:text-xs px-1.5 py-0.5 shrink-0 rounded ${p.statusClass}`}
                            >
                              {p.status}
                            </span>
                          </div>
                          <p className="text-[10px] sm:text-xs text-neutral-600">{p.dates}</p>
                          <div className="flex items-center gap-1.5 text-[10px] sm:text-xs text-neutral-600">
                            <FaUsers className="w-3 h-3 shrink-0" />
                            <span>{p.crew} crew</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <Link
                      to="/dashboard/projects"
                      className="rounded-lg block w-full mt-3 py-2 text-xs text-neutral-600 border border-neutral-200 hover:border-neutral-900 hover:text-neutral-900 text-center min-h-[36px] flex items-center justify-center"
                    >
                      View All Projects
                    </Link>
                  </div>
                  <div className="rounded-lg bg-white border border-neutral-200 p-3 sm:p-4 min-w-0">
                    <h3 className="text-sm sm:text-base text-neutral-900 mb-2 sm:mb-3 font-bold">
                      Quick Stats
                    </h3>
                    <div className="space-y-2 sm:space-y-3">
                      <div className="flex items-center justify-between gap-2 min-w-0">
                        <span className="text-xs sm:text-sm text-neutral-600 truncate">Active Projects</span>
                        <span className="text-sm sm:text-base text-neutral-900 font-bold shrink-0">3</span>
                      </div>
                      <div className="flex items-center justify-between gap-2 min-w-0">
                        <span className="text-xs sm:text-sm text-neutral-600 truncate">Crew Hired</span>
                        <span className="text-sm sm:text-base text-neutral-900 font-bold shrink-0">26</span>
                      </div>
                      <div className="flex items-center justify-between gap-2 min-w-0">
                        <span className="text-xs sm:text-sm text-neutral-600 truncate">This Month</span>
                        <span className="text-sm sm:text-base text-neutral-900 font-bold shrink-0">₹8.5L</span>
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
