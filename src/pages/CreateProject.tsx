import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import {
  FaArrowLeft, FaFolderPlus, FaCircleInfo, FaUsers, FaIndianRupeeSign,
  FaClipboardCheck, FaCalendar, FaPlus, FaLightbulb, FaHouse, FaFolder, FaMagnifyingGlass, FaUser,
} from 'react-icons/fa6';
import DashboardHeader from '../components/DashboardHeader';
import DashboardSidebar from '../components/DashboardSidebar';
import AppFooter from '../components/AppFooter';

const roles = [
  { title: 'Director of Photography', sub: 'Camera & Lighting Lead' },
  { title: 'Camera Operator', sub: 'Primary Camera Work' },
  { title: 'Sound Engineer', sub: 'Audio Recording & Mixing' },
  { title: 'Gaffer', sub: 'Lighting Technician' },
  { title: 'Production Assistant', sub: 'General Support' },
  { title: 'Makeup Artist', sub: 'Talent Makeup & Hair' },
];

const navLinks = [
  { icon: FaHouse,           label: 'Dashboard',    to: '/dashboard' },
  { icon: FaCalendar,        label: 'Availability', to: '/dashboard/company-availability' },
  { icon: FaFolder,          label: 'Projects',     to: '/dashboard/projects' },
  { icon: FaFolder,          label: 'Past Projects', to: '/dashboard/company-past-projects' },
  { icon: FaMagnifyingGlass, label: 'Search',       to: '/dashboard/search' },
  { icon: FaUser,            label: 'Profile',      to: '/dashboard/company-profile' },
];

export default function CreateProject() {
  useEffect(() => { document.title = 'Create New Project – Claapo'; }, []);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);

  const toggleRole = (title: string) => {
    setSelectedRoles((prev) =>
      prev.includes(title) ? prev.filter((r) => r !== title) : [...prev, title]
    );
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-[#F3F4F6] w-full">
      <DashboardHeader userName="Production Co." />

      <div className="flex-1 flex min-h-0 overflow-hidden">
        <DashboardSidebar links={navLinks} />

        {/* Main */}
        <main className="flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden">
          <div className="flex-1 min-h-0 overflow-auto">
            <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-5">

              <Link to="/dashboard/projects" className="inline-flex items-center gap-2 text-neutral-500 hover:text-[#3678F1] mb-5 text-sm transition-colors">
                <FaArrowLeft className="w-3.5 h-3.5" /> Back to Projects
              </Link>

              <div className="flex items-center gap-3 mb-6">
                <div className="w-11 h-11 rounded-2xl bg-[#3678F1] flex items-center justify-center shrink-0">
                  <FaFolderPlus className="text-white text-lg" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-neutral-900">Create New Project</h1>
                  <p className="text-sm text-neutral-500 mt-0.5">Set up your project to start hiring crew and vendors</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* Left: form */}
                <div className="lg:col-span-2 space-y-4">
                  {/* Project Info */}
                  <div className="rounded-2xl bg-white border border-neutral-200 p-5">
                    <h2 className="text-sm font-bold text-neutral-900 mb-4 flex items-center gap-2">
                      <FaCircleInfo className="text-[#3678F1]" /> Project Information
                    </h2>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-neutral-700 text-xs mb-1.5 font-semibold">Project Name <span className="text-[#F40F02]">*</span></label>
                        <input type="text" placeholder="e.g., Summer Commercial Campaign 2025" className="rounded-xl w-full px-4 py-2.5 border border-neutral-300 bg-[#F3F4F6] text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-[#3678F1] focus:bg-white text-sm transition-all" />
                      </div>
                      <div>
                        <label className="block text-neutral-700 text-xs mb-1.5 font-semibold">Project Description</label>
                        <textarea rows={3} placeholder="Brief description of the project, locations, and requirements..." className="rounded-xl w-full px-4 py-2.5 border border-neutral-300 bg-[#F3F4F6] text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-[#3678F1] focus:bg-white text-sm transition-all resize-none" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-neutral-700 text-xs mb-1.5 font-semibold">Start Date <span className="text-[#F40F02]">*</span></label>
                          <div className="relative">
                            <input type="date" className="date-input-no-native-icon rounded-xl w-full px-4 py-2.5 border border-neutral-300 bg-[#F3F4F6] text-neutral-900 focus:outline-none focus:border-[#3678F1] focus:bg-white text-sm transition-all" />
                            <FaCalendar className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 text-xs pointer-events-none" />
                          </div>
                        </div>
                        <div>
                          <label className="block text-neutral-700 text-xs mb-1.5 font-semibold">End Date <span className="text-[#F40F02]">*</span></label>
                          <div className="relative">
                            <input type="date" className="date-input-no-native-icon rounded-xl w-full px-4 py-2.5 border border-neutral-300 bg-[#F3F4F6] text-neutral-900 focus:outline-none focus:border-[#3678F1] focus:bg-white text-sm transition-all" />
                            <FaCalendar className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 text-xs pointer-events-none" />
                          </div>
                        </div>
                      </div>
                      <div>
                        <label className="block text-neutral-700 text-xs mb-1.5 font-semibold">Shooting Location</label>
                        <input type="text" placeholder="e.g., Mumbai, Maharashtra" className="rounded-xl w-full px-4 py-2.5 border border-neutral-300 bg-[#F3F4F6] text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-[#3678F1] focus:bg-white text-sm transition-all" />
                      </div>
                    </div>
                  </div>

                  {/* Required Roles */}
                  <div className="rounded-2xl bg-white border border-neutral-200 p-5">
                    <h2 className="text-sm font-bold text-neutral-900 mb-4 flex items-center gap-2">
                      <FaUsers className="text-[#3678F1]" /> Required Roles
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                      {roles.map((r) => {
                        const checked = selectedRoles.includes(r.title);
                        return (
                          <label
                            key={r.title}
                            className={`rounded-xl flex items-center gap-3 p-3 border cursor-pointer transition-all ${
                              checked
                                ? 'border-[#3678F1] bg-[#EEF4FF]'
                                : 'border-neutral-200 bg-[#FAFAFA] hover:border-neutral-300'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleRole(r.title)}
                              className="w-4 h-4 rounded border-neutral-300 accent-[#3678F1] shrink-0"
                            />
                            <div className="min-w-0">
                              <p className={`text-xs font-semibold truncate ${checked ? 'text-[#3678F1]' : 'text-neutral-900'}`}>{r.title}</p>
                              <p className="text-[11px] text-neutral-400 truncate">{r.sub}</p>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                    <button type="button" className="text-[#3678F1] text-xs hover:underline flex items-center gap-1.5 font-medium">
                      <FaPlus className="w-2.5 h-2.5" /> Add Custom Role
                    </button>
                  </div>

                  {/* Budget */}
                  <div className="rounded-2xl bg-white border border-neutral-200 p-5">
                    <h2 className="text-sm font-bold text-neutral-900 mb-4 flex items-center gap-2">
                      <FaIndianRupeeSign className="text-[#3678F1]" /> Budget Information
                    </h2>
                    <div>
                      <label className="block text-neutral-700 text-xs mb-1.5 font-semibold">Total Project Budget <span className="text-[#F40F02]">*</span></label>
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 text-sm">₹</span>
                          <input type="number" placeholder="Min Budget" className="rounded-xl w-full pl-7 pr-4 py-2.5 border border-neutral-300 bg-[#F3F4F6] text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-[#3678F1] focus:bg-white text-sm transition-all" />
                        </div>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 text-sm">₹</span>
                          <input type="number" placeholder="Max Budget" className="rounded-xl w-full pl-7 pr-4 py-2.5 border border-neutral-300 bg-[#F3F4F6] text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-[#3678F1] focus:bg-white text-sm transition-all" />
                        </div>
                      </div>
                      <div className="rounded-xl bg-[#EEF4FF] border border-[#BFDBFE] p-3">
                        <div className="flex items-start gap-2">
                          <FaLightbulb className="text-[#3678F1] text-sm mt-0.5 shrink-0" />
                          <div className="text-xs text-[#1D4ED8] space-y-0.5">
                            <p className="font-semibold">Budget Tips</p>
                            <p>30–40% crew · 20–30% equipment · 15% post-production · 10–15% buffer</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right: summary */}
                <div>
                  <div className="rounded-2xl bg-white border border-neutral-200 p-5 lg:sticky lg:top-5">
                    <h3 className="text-sm font-bold text-neutral-900 mb-4 flex items-center gap-2">
                      <FaClipboardCheck className="text-[#3678F1]" /> Project Summary
                    </h3>
                    <div className="space-y-3 mb-5">
                      {[
                        { label: 'Project Name', value: 'Not set' },
                        { label: 'Duration', value: 'Not set' },
                        { label: 'Roles', value: selectedRoles.length ? `${selectedRoles.length} selected` : '0 selected' },
                        { label: 'Budget', value: 'Not set' },
                      ].map(({ label, value }) => (
                        <div key={label} className="flex justify-between gap-2">
                          <span className="text-xs text-neutral-400">{label}</span>
                          <span className={`text-xs font-semibold ${value === 'Not set' || value === '0 selected' ? 'text-neutral-400' : 'text-neutral-900'}`}>{value}</span>
                        </div>
                      ))}
                    </div>

                    <div className="border-t border-neutral-100 pt-4 mb-4">
                      <p className="text-xs font-bold text-neutral-700 mb-3">Next Steps</p>
                      <ul className="space-y-2">
                        {['Search & filter crew members', 'Send booking requests', 'Lock confirmed team'].map((step) => (
                          <li key={step} className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#3678F1] shrink-0" />
                            <span className="text-xs text-neutral-500">{step}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <button
                      type="button"
                      onClick={() => alert('Project created successfully!')}
                      className="rounded-xl w-full py-3 bg-[#3678F1] text-white font-semibold text-sm hover:bg-[#2563d4] mb-2 flex items-center justify-center gap-2 transition-colors shadow-sm"
                    >
                      <FaClipboardCheck /> Create Project
                    </button>
                    <button
                      type="button"
                      onClick={() => alert('Saved as draft!')}
                      className="rounded-xl w-full py-2.5 border border-neutral-300 text-neutral-700 text-sm font-medium hover:bg-neutral-50 transition-colors"
                    >
                      Save as Draft
                    </button>
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
