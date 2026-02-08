import { Link } from 'react-router-dom';
import { useEffect } from 'react';
import { FaPlus, FaUsers, FaTruck } from 'react-icons/fa6';
import DashboardHeader from '../components/DashboardHeader';
import AppFooter from '../components/AppFooter';

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

export default function CompanyDashboard() {
  useEffect(() => {
    document.title = 'Dashboard – CrewCall';
  }, []);

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col">
      <DashboardHeader />
      <div className="flex-1 p-4 sm:p-8">
        <div className="max-w-[1400px] mx-auto">
          <div className="mb-6 sm:mb-8">
            <h1 className="text-3xl sm:text-4xl text-neutral-900 mb-2 font-bold">Dashboard</h1>
            <p className="text-lg text-neutral-600">Manage your projects and crew scheduling</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
            {quickActions.map((action) => (
              <Link
                key={action.title}
                to={action.to}
                className="rounded-lg p-6 bg-white border border-neutral-200 hover:border-neutral-900 text-left group block"
              >
                <div className="w-12 h-12 rounded-lg bg-neutral-100 group-hover:bg-neutral-700 flex items-center justify-center mb-4">
                  <action.icon className="text-neutral-600 group-hover:text-white text-xl" />
                </div>
                <h3 className="text-lg text-neutral-900 mb-2 font-bold">{action.title}</h3>
                <p className="text-sm text-neutral-600">{action.description}</p>
              </Link>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 sm:gap-8">
            <div className="lg:col-span-3">
<div className="rounded-lg bg-white border border-neutral-200 p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <h2 className="text-xl sm:text-2xl text-neutral-900 font-bold">Project Calendar</h2>
                  <div className="flex items-center gap-4">
                    <select className="rounded-lg px-3 py-2 border border-neutral-300 bg-white text-neutral-900 text-sm">
                      <option>January</option>
                      <option>February</option>
                      <option>March</option>
                    </select>
                    <select className="rounded-lg px-3 py-2 border border-neutral-300 bg-white text-neutral-900 text-sm">
                      <option>2025</option>
                      <option>2024</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-7 gap-1 mb-4 text-center text-sm text-neutral-600 border-b border-neutral-200">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                    <div key={day} className="p-2">{day}</div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {calendarDays.map((cell, i) => (
                    <div
                      key={i}
                      className={`rounded h-16 sm:h-20 p-2 text-sm border border-neutral-200 ${
                        cell.muted ? 'text-neutral-400' : 'text-neutral-900'
                      } ${cell.project === 'Commercial Shoot' ? 'bg-neutral-900 text-white' : ''} ${
                        cell.project === 'Documentary' ? 'bg-neutral-100' : ''
                      } ${cell.project === 'Music Video' ? 'bg-neutral-600 text-white' : ''}`}
                    >
                      {cell.d}
                      {cell.project && <div className="text-xs mt-1 truncate">{cell.project}</div>}
                    </div>
                  ))}
                </div>
                <div className="flex flex-wrap gap-4 sm:gap-6 mt-6 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="rounded w-4 h-4 bg-neutral-900" />
                    <span className="text-neutral-600">Active Projects</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="rounded w-4 h-4 bg-neutral-600" />
                    <span className="text-neutral-600">In Progress</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="rounded w-4 h-4 bg-neutral-100 border border-neutral-300" />
                    <span className="text-neutral-600">Planning</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-lg bg-white border border-neutral-200 p-4 sm:p-6">
                <h3 className="text-xl text-neutral-900 mb-6 font-bold">Ongoing Projects</h3>
                <div className="space-y-4">
                  {projects.map((p) => (
                    <div key={p.name} className="rounded-lg border border-neutral-200 p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm text-neutral-900 font-bold">{p.name}</h4>
                        <span className={`text-xs px-2 py-1 ${p.statusClass}`}>{p.status}</span>
                      </div>
                      <p className="text-xs text-neutral-600 mb-2">{p.dates}</p>
                      <div className="flex items-center gap-2 text-xs text-neutral-600">
                        <FaUsers className="w-3 h-3" />
                        <span>{p.crew} crew members</span>
                      </div>
                    </div>
                  ))}
                </div>
                <Link to="/dashboard/projects" className="rounded-lg block w-full mt-6 py-2 text-sm text-neutral-600 border border-neutral-200 hover:border-neutral-900 hover:text-neutral-900 text-center">
                  View All Projects
                </Link>
              </div>
              <div className="rounded-lg bg-white border border-neutral-200 p-4 sm:p-6">
                <h3 className="text-lg text-neutral-900 mb-4 font-bold">Quick Stats</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-neutral-600">Active Projects</span>
                    <span className="text-lg text-neutral-900 font-bold">3</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-neutral-600">Crew Hired</span>
                    <span className="text-lg text-neutral-900 font-bold">26</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-neutral-600">This Month</span>
                    <span className="text-lg text-neutral-900 font-bold">₹8.5L</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <AppFooter />
    </div>
  );
}
