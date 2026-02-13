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
    <div className="min-h-screen bg-neutral-50 flex flex-col min-w-0 w-full max-w-full overflow-x-hidden">
      <DashboardHeader userName="Production Co." />
      <div className="flex-1 px-4 sm:px-6 md:px-8 lg:px-16 py-6 sm:py-8 md:py-12 min-w-0 w-full max-w-full overflow-x-hidden">
        <div className="w-full max-w-[1400px] mx-auto min-w-0 max-w-full">
          <Link to="/dashboard" className="inline-flex items-center gap-2 text-neutral-600 hover:text-neutral-900 mb-4 sm:mb-6 text-sm sm:text-base min-h-[44px] items-center">
            <FaArrowLeft className="w-4 h-4 shrink-0" /> <span className="truncate">Back to Dashboard</span>
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 mb-5 sm:mb-6 md:mb-8 lg:mb-10">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg bg-neutral-800 flex items-center justify-center shrink-0">
              <FaFolderPlus className="text-white text-xl sm:text-2xl" />
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl sm:text-3xl md:text-4xl text-neutral-900 font-bold">Create New Project</h1>
              <p className="text-base sm:text-lg text-neutral-600 mt-1">Set up your project details to start hiring crew and vendors</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8 min-w-0">
            <div className="lg:col-span-2 space-y-4 sm:space-y-6 order-1 min-w-0 overflow-hidden">
              <div className="rounded-lg bg-white border border-neutral-200 p-4 sm:p-6 md:p-8 lg:p-10 min-w-0">
                <h2 className="text-lg sm:text-xl text-neutral-900 mb-4 sm:mb-6 md:mb-8 flex items-center gap-2 sm:gap-3 font-bold flex-wrap">
                  <FaCircleInfo className="text-neutral-600 shrink-0" /> Project Information
                </h2>
                <div className="space-y-4 sm:space-y-6">
                  <div className="min-w-0">
                    <label className="block text-neutral-900 text-sm mb-2 sm:mb-3 font-medium">Project Name *</label>
                    <input
                      type="text"
                      placeholder="e.g., Summer Commercial Campaign 2025"
                      className="rounded-lg w-full min-w-0 px-3 sm:px-4 py-3 sm:py-4 border border-neutral-300 bg-white text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-neutral-900 text-base"
                    />
                  </div>
                  <div className="min-w-0">
                    <label className="block text-neutral-900 text-sm mb-2 sm:mb-3 font-medium">Project Description</label>
                    <textarea
                      rows={4}
                      placeholder="Brief description of the project, shooting locations, and any special requirements..."
                      className="rounded-lg w-full min-w-0 px-3 sm:px-4 py-3 sm:py-4 border border-neutral-300 bg-white text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-neutral-900 text-base resize-y"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 min-w-0">
                    <div className="min-w-0">
                      <label className="block text-neutral-900 text-sm mb-2 sm:mb-3 font-medium">Start Date *</label>
                      <div className="relative">
                        <input type="date" className="rounded-lg w-full px-4 py-3 sm:py-4 border border-neutral-300 bg-white text-neutral-900 text-base focus:outline-none focus:border-neutral-900 min-h-[44px]" />
                        <FaCalendar className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
                      </div>
                    </div>
                    <div className="min-w-0">
                      <label className="block text-neutral-900 text-sm mb-2 sm:mb-3 font-medium">End Date *</label>
                      <div className="relative">
                        <input type="date" className="rounded-lg w-full px-4 py-3 sm:py-4 border border-neutral-300 bg-white text-neutral-900 text-base focus:outline-none focus:border-neutral-900 min-h-[44px]" />
                        <FaCalendar className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
                      </div>
                    </div>
                  </div>
                  <div className="min-w-0">
                    <label className="block text-neutral-900 text-sm mb-2 sm:mb-3 font-medium">Shooting Location</label>
                    <input
                      type="text"
                      placeholder="e.g., Mumbai, Maharashtra"
                      className="rounded-lg w-full min-w-0 px-3 sm:px-4 py-3 sm:py-4 border border-neutral-300 bg-white text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-neutral-900 text-base"
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-lg bg-white border border-neutral-200 p-4 sm:p-6 md:p-8 lg:p-10 min-w-0">
                <h2 className="text-lg sm:text-xl text-neutral-900 mb-4 sm:mb-6 md:mb-8 flex items-center gap-2 sm:gap-3 font-bold flex-wrap">
                  <FaUsers className="text-neutral-600 shrink-0" /> Required Roles
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
                  {roles.map((r) => (
                    <label key={r.title} className="rounded-lg flex items-center gap-2 sm:gap-3 p-3 sm:p-4 border border-neutral-300 hover:border-neutral-900 hover:bg-neutral-50 cursor-pointer min-w-0">
                      <input type="checkbox" className="w-5 h-5 border border-neutral-300 rounded shrink-0" />
                      <div className="min-w-0">
                        <div className="text-neutral-900 font-medium text-sm sm:text-base truncate">{r.title}</div>
                        <div className="text-xs text-neutral-500 truncate">{r.sub}</div>
                      </div>
                    </label>
                  ))}
                </div>
                <button type="button" className="text-neutral-900 text-sm hover:underline flex items-center gap-2">
                  <FaPlus /> Add Custom Role
                </button>
              </div>

<div className="rounded-lg bg-white border border-neutral-200 p-4 sm:p-6 md:p-8 lg:p-10 min-w-0">
                <h2 className="text-lg sm:text-xl text-neutral-900 mb-4 sm:mb-6 md:mb-8 flex items-center gap-2 sm:gap-3 font-bold flex-wrap">
                  <FaIndianRupeeSign className="text-neutral-600 shrink-0" /> Budget Information
                </h2>
                <div className="mb-4 sm:mb-6">
                  <label className="block text-neutral-900 text-sm mb-2 sm:mb-3 font-medium">Total Project Budget *</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    <div className="relative min-w-0">
                      <span className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-neutral-500">₹</span>
                      <input type="number" placeholder="Min Budget" className="rounded-lg w-full min-w-0 pl-8 sm:pl-10 pr-3 sm:pr-4 py-3 sm:py-4 border border-neutral-300 bg-white text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-neutral-900 text-base" />
                    </div>
                    <div className="relative min-w-0">
                      <span className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-neutral-500">₹</span>
                      <input type="number" placeholder="Max Budget" className="rounded-lg w-full min-w-0 pl-8 sm:pl-10 pr-3 sm:pr-4 py-3 sm:py-4 border border-neutral-300 bg-white text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-neutral-900 text-base" />
                    </div>
                  </div>
                  <p className="text-xs text-neutral-500 mt-2 flex items-center gap-1">
                    <FaCircleInfo /> Budget helps us match you with appropriate crew members
                  </p>
                </div>
                <div className="rounded-lg bg-neutral-50 border border-neutral-200 p-4 sm:p-6 min-w-0">
                  <div className="flex items-start gap-2 sm:gap-3 min-w-0">
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

            <div className="lg:col-span-1 min-w-0 order-2 lg:order-2 overflow-hidden">
              <div className="rounded-lg bg-white border border-neutral-200 p-4 sm:p-6 md:p-8 lg:sticky lg:top-8 min-w-0">
                <h3 className="text-base sm:text-lg text-neutral-900 mb-4 sm:mb-6 flex items-center gap-2 font-bold flex-wrap">
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
                <button
                  type="button"
                  onClick={() => {
                    alert('Project created successfully!');
                    // In real app, this would submit form data to API
                  }}
                  className="rounded-lg w-full py-3.5 sm:py-4 bg-neutral-900 text-white hover:bg-neutral-700 mb-3 font-medium flex items-center justify-center gap-2 min-h-[44px] text-base sm:text-lg"
                >
                  <FaClipboardCheck /> Create Project
                </button>
                <button
                  type="button"
                  onClick={() => {
                    alert('Project saved as draft!');
                  }}
                  className="rounded-lg w-full py-3.5 sm:py-4 border border-neutral-300 text-neutral-900 hover:border-neutral-900 hover:bg-neutral-50 min-h-[44px]"
                >
                  Save as Draft
                </button>
                <div className="rounded-lg bg-neutral-50 border border-neutral-200 p-4 sm:p-6 mt-4 sm:mt-6 min-w-0">
                  <div className="flex items-start gap-2 sm:gap-3 min-w-0">
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
