import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import {
  FaArrowLeft, FaFolderPlus, FaCircleInfo, FaClipboardCheck, FaPlus,
  FaTriangleExclamation, FaXmark, FaLocationDot, FaCalendar,
} from 'react-icons/fa6';
import DashboardHeader from '../components/DashboardHeader';
import DashboardSidebar from '../components/DashboardSidebar';
import AppFooter from '../components/AppFooter';
import { api, ApiException } from '../services/api';
import { companyNavLinks } from '../navigation/dashboardNav';
import { useAuth } from '../contexts/AuthContext';

interface ProjectResponse {
  id: string;
  title: string;
}

interface CompanyProfileData {
  companyName?: string | null;
}

interface MeResponse {
  id: string;
  email: string;
  role: string;
  mainUserId: string | null;
  profile?: CompanyProfileData | null;
}

interface DateLocation {
  date: string;
  location: string;
}

export default function CreateProject() {
  const navigate = useNavigate();
  const { user: _user } = useAuth();

  useEffect(() => { document.title = 'Create New Project – Claapo'; }, []);

  // Fetch company profile on mount
  const [companyName, setCompanyName] = useState('');
  const [_loadingProfile, setLoadingProfile] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const me = await api.get<MeResponse>('/users/me');
        const profileData = me.profile as CompanyProfileData | undefined;
        setCompanyName(profileData?.companyName ?? '');
      } catch (err) {
        console.error('Failed to fetch company profile:', err);
      } finally {
        setLoadingProfile(false);
      }
    };
    fetchProfile();
  }, []);

  // Form state
  const [title, setTitle]                     = useState('');
  const [description, setDescription]         = useState('');
  const [startDate, setStartDate]             = useState('');
  const [endDate, setEndDate]                 = useState('');
  const [projectDates, setProjectDates] = useState<DateLocation[]>([{ date: '', location: '' }]);

  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const addProjectDate = () => setProjectDates(prev => [...prev, { date: '', location: '' }]);
  const removeProjectDate = (i: number) => setProjectDates(prev => prev.filter((_, idx) => idx !== i));
  const updateProjectDate = (i: number, field: 'date' | 'location', val: string) => {
    setProjectDates(prev => prev.map((d, idx) => idx === i ? { ...d, [field]: val } : d));
  };

  const duration = startDate && endDate
    ? (() => {
        const s = new Date(startDate);
        const e = new Date(endDate);
        const days = Math.max(1, Math.round((e.getTime() - s.getTime()) / 86_400_000) + 1);
        return `${days} day${days > 1 ? 's' : ''}`;
      })()
    : 'Not set';

  const handleCreate = async () => {
    if (!title.trim()) { setError('Project name is required.'); return; }
    const validDates = projectDates.filter(d => d.date.trim());
    if (!validDates.length) { setError('At least one project date is required.'); return; }
    
    // Validate all dates have locations
    const datesWithoutLocation = validDates.filter(d => !d.location.trim());
    if (datesWithoutLocation.length > 0) {
      setError('Please specify a location for each project date.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      await api.post<ProjectResponse>('/projects', {
        title: title.trim(),
        productionHouseName: companyName.trim() || undefined,
        description: description.trim() || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        shootDates: validDates.map(d => d.date),
        shootLocations: validDates.map(d => d.location.trim()),
      });

      navigate('/dashboard/projects');
    } catch (err) {
      setError(err instanceof ApiException ? err.payload.message : 'Failed to create project.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (iso: string) => {
    if (!iso) return '';
    return new Date(iso + 'T12:00:00').toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-[#F3F4F6] w-full">
      <DashboardHeader />

      <div className="flex-1 flex min-h-0 overflow-hidden">
        <DashboardSidebar links={companyNavLinks} />

        {/* Main */}
        <main className="flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden">
          <div className="flex-1 min-h-0 overflow-auto">
            <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-5">

              <Link to="/dashboard/projects" className="inline-flex items-center gap-2 text-neutral-500 hover:text-[#3B5BDB] mb-5 text-sm transition-colors">
                <FaArrowLeft className="w-3.5 h-3.5" /> Back to Projects
              </Link>

              <div className="flex items-center gap-3 mb-6">
                <div className="w-11 h-11 rounded-2xl bg-[#3B5BDB] flex items-center justify-center shrink-0">
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
                      <FaCircleInfo className="text-[#3B5BDB]" /> Project Information
                    </h2>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-neutral-700 text-xs mb-1.5 font-semibold">Project Name <span className="text-[#F40F02]">*</span></label>
                        <input
                          type="text"
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          placeholder="e.g., Summer Commercial Campaign 2025"
                          disabled={loading}
                          className="rounded-xl w-full px-4 py-2.5 border border-neutral-300 bg-[#F3F4F6] text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-[#3B5BDB] focus:bg-white text-sm transition-all disabled:opacity-50"
                        />
                      </div>
                      <div>
                        <label className="block text-neutral-700 text-xs mb-1.5 font-semibold">Production House Name</label>
                        <input
                          type="text"
                          value={companyName}
                          disabled
                          className="rounded-xl w-full px-4 py-2.5 border border-neutral-300 bg-neutral-100 text-neutral-900 text-sm cursor-not-allowed opacity-60"
                        />
                      </div>
                      <div>
                        <label className="block text-neutral-700 text-xs mb-1.5 font-semibold">Project Description</label>
                        <textarea
                          rows={3}
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          placeholder="Brief description of the project, genre, and requirements..."
                          disabled={loading}
                          className="rounded-xl w-full px-4 py-2.5 border border-neutral-300 bg-[#F3F4F6] text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-[#3B5BDB] focus:bg-white text-sm transition-all resize-none disabled:opacity-50"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-neutral-700 text-xs mb-1.5 font-semibold">Start Date <span className="text-neutral-400 font-normal">(optional)</span></label>
                          <div className="relative">
                            <input
                              type="date"
                              value={startDate}
                              onChange={(e) => setStartDate(e.target.value)}
                              disabled={loading}
                              className="date-input-no-native-icon rounded-xl w-full px-4 py-2.5 border border-neutral-300 bg-[#F3F4F6] text-neutral-900 focus:outline-none focus:border-[#3B5BDB] focus:bg-white text-sm transition-all disabled:opacity-50"
                            />
                            <FaCalendar className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 text-xs pointer-events-none" />
                          </div>
                        </div>
                        <div>
                          <label className="block text-neutral-700 text-xs mb-1.5 font-semibold">End Date <span className="text-neutral-400 font-normal">(optional)</span></label>
                          <div className="relative">
                            <input
                              type="date"
                              value={endDate}
                              min={startDate}
                              onChange={(e) => setEndDate(e.target.value)}
                              disabled={loading}
                              className="date-input-no-native-icon rounded-xl w-full px-4 py-2.5 border border-neutral-300 bg-[#F3F4F6] text-neutral-900 focus:outline-none focus:border-[#3B5BDB] focus:bg-white text-sm transition-all disabled:opacity-50"
                            />
                            <FaCalendar className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 text-xs pointer-events-none" />
                          </div>
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-neutral-700 text-xs font-semibold">Project Dates <span className="text-[#F40F02]">*</span></label>
                          <button
                            type="button"
                            onClick={addProjectDate}
                            className="text-xs text-[#3B5BDB] hover:underline flex items-center gap-1"
                          >
                            <FaPlus className="w-2.5 h-2.5" /> Add Date
                          </button>
                        </div>
                        <div className="space-y-2">
                          {projectDates.map((pair, i) => (
                            <div key={i} className="rounded-xl bg-white border border-neutral-200 p-3">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-semibold text-neutral-900">
                                    {pair.date ? formatDate(pair.date) : 'Select a date'}
                                  </span>
                                  {pair.location.trim() ? (
                                    <span className="text-[9px] bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full font-semibold border border-emerald-200">
                                      ✓ Location set
                                    </span>
                                  ) : (
                                    <span className="text-[9px] bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full font-semibold border border-amber-200">
                                      ⚠ Location needed
                                    </span>
                                  )}
                                </div>
                                {projectDates.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => removeProjectDate(i)}
                                    className="text-neutral-400 hover:text-red-500 transition-colors"
                                    aria-label={`Remove date ${i + 1}`}
                                  >
                                    <FaXmark className="w-3 h-3" />
                                  </button>
                                )}
                              </div>

                              <div className="flex gap-2">
                                <div className="relative flex-1">
                                  <input
                                    type="date"
                                    value={pair.date}
                                    onChange={(e) => updateProjectDate(i, 'date', e.target.value)}
                                    disabled={loading}
                                    min={startDate}
                                    max={endDate}
                                    className="rounded-lg w-full px-3 py-2 border border-neutral-300 bg-[#F3F4F6] text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#3B5BDB]/20 focus:border-[#3B5BDB] text-xs transition-all disabled:opacity-50"
                                  />
                                </div>
                                <div className="relative flex-[2]">
                                  <FaLocationDot className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 text-xs pointer-events-none" />
                                  <input
                                    type="text"
                                    value={pair.location}
                                    onChange={(e) => updateProjectDate(i, 'location', e.target.value)}
                                    placeholder="e.g., Mumbai, Film City"
                                    disabled={loading}
                                    className="rounded-lg w-full pl-9 pr-3 py-2 border border-neutral-300 bg-[#F3F4F6] text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#3B5BDB]/20 focus:border-[#3B5BDB] text-xs transition-all disabled:opacity-50"
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        e.preventDefault();
                                        if (i < projectDates.length - 1) {
                                          const next = document.querySelector(`[data-date-index="${i + 1}"]`) as HTMLInputElement;
                                          next?.focus();
                                        }
                                      }
                                    }}
                                    data-date-index={i}
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right: summary */}
                <div>
                  <div className="rounded-2xl bg-white border border-neutral-200 p-5 lg:sticky lg:top-5">
                    <h3 className="text-sm font-bold text-neutral-900 mb-4 flex items-center gap-2">
                      <FaClipboardCheck className="text-[#3B5BDB]" /> Project Summary
                    </h3>
                    <div className="space-y-3 mb-5">
                      {[
                        { label: 'Project Name',      value: title.trim() || 'Not set' },
                        { label: 'Production House',  value: companyName.trim() || 'Not set' },
                        { label: 'Duration',          value: duration },
                        { label: 'Project dates',     value: projectDates.filter(d => d.date).length
                          ? projectDates.filter(d => d.date).map(d => `${formatDate(d.date)} · ${d.location || 'TBD'}`).join(', ')
                          : 'Not set'
                        },
                      ].map(({ label, value }) => (
                        <div key={label} className="flex justify-between gap-2">
                          <span className="text-xs text-neutral-400">{label}</span>
                          <span className={`text-xs font-semibold text-right max-w-[160px] ${value === 'Not set' ? 'text-neutral-400' : 'text-neutral-900'}`}>{value}</span>
                        </div>
                      ))}
                    </div>

                    <div className="border-t border-neutral-100 pt-4 mb-4">
                      <p className="text-xs font-bold text-neutral-700 mb-3">Next Steps</p>
                      <ul className="space-y-2">
                        {['Search & filter crew members', 'Send booking requests', 'Lock confirmed team'].map((step) => (
                          <li key={step} className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#3B5BDB] shrink-0" />
                            <span className="text-xs text-neutral-500">{step}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {error && (
                      <div className="flex items-start gap-2 rounded-xl bg-red-50 border border-red-200 px-3 py-2.5 mb-2">
                        <FaTriangleExclamation className="text-red-500 text-xs shrink-0 mt-0.5" />
                        <p className="text-xs text-red-700 leading-snug">{error}</p>
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => handleCreate()}
                      disabled={loading}
                      className="rounded-xl w-full py-3 bg-[#3B5BDB] text-white font-semibold text-sm hover:bg-[#2f4ac2] mb-2 flex items-center justify-center gap-2 transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {loading ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Creating…</> : <><FaClipboardCheck /> Create Project</>}
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
