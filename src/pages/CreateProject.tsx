import { Link } from 'react-router-dom';
import { useEffect } from 'react';
import {
  FaArrowLeft,
  FaFolderPlus,
  FaCircleInfo,
  FaUsers,
  FaIndianRupeeSign,
  FaClipboardCheck,
  FaCalendar,
  FaPlus,
  FaLightbulb,
  FaCircleQuestion,
} from 'react-icons/fa6';
import DashboardHeader from '../components/DashboardHeader';
import AppFooter from '../components/AppFooter';

const roles = [
  { title: 'Director of Photography', sub: 'Camera & Lighting Lead' },
  { title: 'Camera Operator', sub: 'Primary Camera Work' },
  { title: 'Sound Engineer', sub: 'Audio Recording & Mixing' },
  { title: 'Gaffer', sub: 'Lighting Technician' },
  { title: 'Production Assistant', sub: 'General Support' },
  { title: 'Makeup Artist', sub: 'Talent Makeup & Hair' },
];

export default function CreateProject() {
  useEffect(() => {
    document.title = 'Create New Project – CrewCall';
  }, []);

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col">
      <DashboardHeader userName="Production Co." />
      <div className="flex-1 px-4 sm:px-8 lg:px-16 py-8 sm:py-12">
        <div className="max-w-[1400px] mx-auto">
          <Link to="/dashboard" className="inline-flex items-center gap-2 text-neutral-600 hover:text-neutral-900 mb-6">
            <FaArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-8 sm:mb-10">
            <div className="w-14 h-14 bg-neutral-800 flex items-center justify-center shrink-0">
              <FaFolderPlus className="text-white text-2xl" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl text-neutral-900 font-bold">Create New Project</h1>
              <p className="text-lg text-neutral-600 mt-1">Set up your project details to start hiring crew and vendors</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white border border-neutral-200 p-6 sm:p-10">
                <h2 className="text-xl text-neutral-900 mb-6 sm:mb-8 flex items-center gap-3 font-bold">
                  <FaCircleInfo className="text-neutral-600" /> Project Information
                </h2>
                <div className="space-y-6">
                  <div>
                    <label className="block text-neutral-900 text-sm mb-3 font-medium">Project Name *</label>
                    <input
                      type="text"
                      placeholder="e.g., Summer Commercial Campaign 2025"
                      className="w-full px-4 py-4 border border-neutral-300 bg-white text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-neutral-900"
                    />
                  </div>
                  <div>
                    <label className="block text-neutral-900 text-sm mb-3 font-medium">Project Description</label>
                    <textarea
                      rows={4}
                      placeholder="Brief description of the project, shooting locations, and any special requirements..."
                      className="w-full px-4 py-4 border border-neutral-300 bg-white text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-neutral-900"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-neutral-900 text-sm mb-3 font-medium">Start Date *</label>
                      <div className="relative">
                        <input type="date" className="w-full px-4 py-4 border border-neutral-300 bg-white text-neutral-900 focus:outline-none focus:border-neutral-900" />
                        <FaCalendar className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-neutral-900 text-sm mb-3 font-medium">End Date *</label>
                      <div className="relative">
                        <input type="date" className="w-full px-4 py-4 border border-neutral-300 bg-white text-neutral-900 focus:outline-none focus:border-neutral-900" />
                        <FaCalendar className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-neutral-900 text-sm mb-3 font-medium">Shooting Location</label>
                    <input
                      type="text"
                      placeholder="e.g., Mumbai, Maharashtra"
                      className="w-full px-4 py-4 border border-neutral-300 bg-white text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-neutral-900"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-white border border-neutral-200 p-6 sm:p-10">
                <h2 className="text-xl text-neutral-900 mb-6 sm:mb-8 flex items-center gap-3 font-bold">
                  <FaUsers className="text-neutral-600" /> Required Roles
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                  {roles.map((r) => (
                    <label key={r.title} className="flex items-center gap-3 p-4 border border-neutral-300 hover:border-neutral-900 cursor-pointer">
                      <input type="checkbox" className="w-5 h-5 border border-neutral-300 rounded" />
                      <div>
                        <div className="text-neutral-900 font-medium">{r.title}</div>
                        <div className="text-xs text-neutral-500">{r.sub}</div>
                      </div>
                    </label>
                  ))}
                </div>
                <button type="button" className="text-neutral-900 text-sm hover:underline flex items-center gap-2">
                  <FaPlus /> Add Custom Role
                </button>
              </div>

              <div className="bg-white border border-neutral-200 p-6 sm:p-10">
                <h2 className="text-xl text-neutral-900 mb-6 sm:mb-8 flex items-center gap-3 font-bold">
                  <FaIndianRupeeSign className="text-neutral-600" /> Budget Information
                </h2>
                <div className="mb-6">
                  <label className="block text-neutral-900 text-sm mb-3 font-medium">Total Project Budget *</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500">₹</span>
                      <input type="number" placeholder="Min Budget" className="w-full pl-10 pr-4 py-4 border border-neutral-300 bg-white text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-neutral-900" />
                    </div>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500">₹</span>
                      <input type="number" placeholder="Max Budget" className="w-full pl-10 pr-4 py-4 border border-neutral-300 bg-white text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-neutral-900" />
                    </div>
                  </div>
                  <p className="text-xs text-neutral-500 mt-2 flex items-center gap-1">
                    <FaCircleInfo /> Budget helps us match you with appropriate crew members
                  </p>
                </div>
                <div className="bg-neutral-50 border border-neutral-200 p-6">
                  <div className="flex items-start gap-3">
                    <FaLightbulb className="text-neutral-600 text-lg mt-1 shrink-0" />
                    <div>
                      <h3 className="text-neutral-900 text-sm font-bold mb-2">Budget Allocation Tips</h3>
                      <ul className="text-xs text-neutral-600 space-y-1">
                        <li>• Allocate 30-40% for crew salaries</li>
                        <li>• Reserve 20-30% for equipment rentals</li>
                        <li>• Keep 15-20% for post-production</li>
                        <li>• Maintain 10-15% buffer for contingencies</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-1">
              <div className="bg-white border border-neutral-200 p-6 sm:p-8 sticky top-8">
                <h3 className="text-lg text-neutral-900 mb-6 flex items-center gap-2 font-bold">
                  <FaClipboardCheck /> Project Summary
                </h3>
                <div className="space-y-6 mb-8">
                  <div>
                    <div className="text-xs text-neutral-500 mb-1">Project Name</div>
                    <div className="text-neutral-900">Not set</div>
                  </div>
                  <div>
                    <div className="text-xs text-neutral-500 mb-1">Duration</div>
                    <div className="text-neutral-900">Not set</div>
                  </div>
                  <div>
                    <div className="text-xs text-neutral-500 mb-1">Roles Required</div>
                    <div className="text-neutral-900">0 selected</div>
                  </div>
                  <div>
                    <div className="text-xs text-neutral-500 mb-1">Budget Range</div>
                    <div className="text-neutral-900">Not set</div>
                  </div>
                </div>
                <div className="border-t border-neutral-200 pt-6 mb-6">
                  <h4 className="text-sm text-neutral-900 font-bold mb-4">Next Steps</h4>
                  <ul className="space-y-3 text-sm text-neutral-600">
                    <li className="flex items-start gap-2">
                      <FaCircleInfo className="text-[6px] mt-2 shrink-0" />
                      <span>Search and filter crew members</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <FaCircleInfo className="text-[6px] mt-2 shrink-0" />
                      <span>Send booking requests</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <FaCircleInfo className="text-[6px] mt-2 shrink-0" />
                      <span>Finalize team and lock project</span>
                    </li>
                  </ul>
                </div>
                <button type="button" className="w-full py-4 bg-neutral-900 text-white hover:bg-neutral-800 mb-3 font-medium flex items-center justify-center gap-2">
                  <FaClipboardCheck /> Create Project
                </button>
                <button type="button" className="w-full py-4 border border-neutral-300 text-neutral-900 hover:border-neutral-900">
                  Save as Draft
                </button>
                <div className="bg-neutral-50 border border-neutral-200 p-6 mt-6">
                  <div className="flex items-start gap-3">
                    <FaCircleQuestion className="text-neutral-600 text-lg shrink-0" />
                    <div>
                      <h4 className="text-sm text-neutral-900 font-bold mb-2">Need Help?</h4>
                      <p className="text-xs text-neutral-600 mb-3">Our team is here to assist you with project setup</p>
                      <button type="button" className="text-xs text-neutral-900 hover:underline">Contact Support</button>
                    </div>
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
