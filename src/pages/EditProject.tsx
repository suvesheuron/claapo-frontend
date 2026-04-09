import { Link, useNavigate, useParams } from 'react-router-dom';
import { useEffect, useState, useCallback } from 'react';
import {
  FaArrowLeft, FaPenToSquare, FaCircleInfo, FaClipboardCheck, FaPlus,
  FaTriangleExclamation, FaXmark, FaLocationDot, FaCalendar,
} from 'react-icons/fa6';
import DashboardHeader from '../components/DashboardHeader';
import DashboardSidebar from '../components/DashboardSidebar';
import AppFooter from '../components/AppFooter';
import { api, ApiException } from '../services/api';
import { companyNavLinks } from '../navigation/dashboardNav';

interface ProjectResponse {
  id: string;
  title: string;
  productionHouseName?: string | null;
  description?: string | null;
  startDate: string;
  endDate: string;
  deliveryDate?: string | null;
  locationCity?: string | null;
  shootDates?: string[];
  shootLocations?: string[];
  budget?: number | null;
  budget_min?: number | null;
}

function isoDateOnly(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso.slice(0, 10);
  return d.toISOString().slice(0, 10);
}

export default function EditProject() {
  const navigate = useNavigate();
  const { id: projectId } = useParams<{ id: string }>();
  useEffect(() => { document.title = 'Edit Project – Claapo'; }, []);

  // Form state
  const [title, setTitle]                     = useState('');
  const [productionHouseName, setProductionHouseName] = useState('');
  const [description, setDescription]         = useState('');
  const [startDate, setStartDate]             = useState('');
  const [endDate, setEndDate]                 = useState('');
  const [deliveryDate, setDeliveryDate]       = useState('');
  const [locationCity, setLocationCity]       = useState('');
  const [shootDates, setShootDates] = useState<string[]>(['']);
  const [shootLocations, setShootLocations]   = useState<string[]>(['']);

  const [budget, setBudget] = useState('');

  const [loadingProject, setLoadingProject] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const loadProject = useCallback(async () => {
    if (!projectId) return;
    setLoadingProject(true);
    setError(null);
    try {
      const p = await api.get<ProjectResponse>(`/projects/${projectId}`);
      setTitle(p.title ?? '');
      setProductionHouseName(p.productionHouseName ?? '');
      setDescription(p.description ?? '');
      setStartDate(isoDateOnly(p.startDate));
      setEndDate(isoDateOnly(p.endDate));
      setDeliveryDate(p.deliveryDate ? isoDateOnly(p.deliveryDate) : '');
      setLocationCity(p.locationCity ?? '');
      const sd = p.shootDates?.length ? p.shootDates.map(isoDateOnly) : [''];
      setShootDates(sd.length ? sd : ['']);
      const sl = p.shootLocations?.length ? [...p.shootLocations] : [''];
      setShootLocations(sl.length ? sl : ['']);
      const b = p.budget ?? p.budget_min;
      setBudget(b != null && b > 0 ? String(b) : '');
    } catch (err) {
      setError(err instanceof ApiException ? err.payload.message : 'Failed to load project.');
    } finally {
      setLoadingProject(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadProject();
  }, [loadProject]);

  const addShootDate = () => setShootDates(prev => [...prev, '']);
  const removeShootDate = (i: number) => setShootDates(prev => prev.filter((_, idx) => idx !== i));
  const updateShootDate = (i: number, val: string) => setShootDates(prev => prev.map((v, idx) => idx === i ? val : v));
  const addLocation = () => setShootLocations(prev => [...prev, '']);
  const removeLocation = (i: number) => setShootLocations(prev => prev.filter((_, idx) => idx !== i));
  const updateLocation = (i: number, val: string) => setShootLocations(prev => prev.map((v, idx) => idx === i ? val : v));

  const duration = startDate && endDate
    ? (() => {
        const s = new Date(startDate);
        const e = new Date(endDate);
        const days = Math.max(1, Math.round((e.getTime() - s.getTime()) / 86_400_000) + 1);
        return `${days} day${days > 1 ? 's' : ''}`;
      })()
    : 'Not set';

  const handleSave = async () => {
    if (!projectId) return;
    if (!title.trim()) { setError('Project name is required.'); return; }
    const filteredShootDates = shootDates.filter(d => d.trim());
    if (!filteredShootDates.length) { setError('At least one shoot date is required.'); return; }
    setError(null);
    setLoading(true);

    try {
      await api.patch(`/projects/${projectId}`, {
        title: title.trim(),
        productionHouseName: productionHouseName.trim() || undefined,
        description: description.trim() || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        deliveryDate: deliveryDate || undefined,
        locationCity: locationCity.trim() || undefined,
        shootDates: filteredShootDates,
        shootLocations: shootLocations.filter(s => s.trim()),
        budget: budget ? Math.round(parseFloat(budget)) : undefined,
      });

      navigate(`/dashboard/projects/${projectId}`);
    } catch (err) {
      setError(err instanceof ApiException ? err.payload.message : 'Failed to save project.');
    } finally {
      setLoading(false);
    }
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

              <Link to={projectId ? `/dashboard/projects/${projectId}` : '/dashboard/projects'} className="inline-flex items-center gap-2 text-neutral-500 hover:text-[#3B5BDB] mb-5 text-sm transition-colors">
                <FaArrowLeft className="w-3.5 h-3.5" /> Back to project
              </Link>

              <div className="flex items-center gap-3 mb-6">
                <div className="w-11 h-11 rounded-2xl bg-[#3B5BDB] flex items-center justify-center shrink-0">
                  <FaPenToSquare className="text-white text-lg" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-neutral-900">Edit Project</h1>
                  <p className="text-sm text-neutral-500 mt-0.5">Update project details and shoot information</p>
                </div>
              </div>

              {loadingProject && (
                <div className="rounded-2xl bg-white border border-neutral-200 p-8 text-center text-sm text-neutral-500">
                  Loading project…
                </div>
              )}

              {!loadingProject && (
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
                        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Summer Commercial Campaign 2025" disabled={loading} className="rounded-xl w-full px-4 py-2.5 border border-neutral-300 bg-[#F3F4F6] text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-[#3B5BDB] focus:bg-white text-sm transition-all disabled:opacity-50" />
                      </div>
                      <div>
                        <label className="block text-neutral-700 text-xs mb-1.5 font-semibold">Production House Name</label>
                        <input type="text" value={productionHouseName} onChange={(e) => setProductionHouseName(e.target.value)} placeholder="e.g., Yash Raj Films" disabled={loading} className="rounded-xl w-full px-4 py-2.5 border border-neutral-300 bg-[#F3F4F6] text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-[#3B5BDB] focus:bg-white text-sm transition-all disabled:opacity-50" />
                      </div>
                      <div>
                        <label className="block text-neutral-700 text-xs mb-1.5 font-semibold">Project Description</label>
                        <textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief description of the project, genre, and requirements..." disabled={loading} className="rounded-xl w-full px-4 py-2.5 border border-neutral-300 bg-[#F3F4F6] text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-[#3B5BDB] focus:bg-white text-sm transition-all resize-none disabled:opacity-50" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-neutral-700 text-xs mb-1.5 font-semibold">Start Date <span className="text-neutral-400 font-normal">(optional)</span></label>
                          <div className="relative">
                            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} disabled={loading} className="date-input-no-native-icon rounded-xl w-full px-4 py-2.5 border border-neutral-300 bg-[#F3F4F6] text-neutral-900 focus:outline-none focus:border-[#3B5BDB] focus:bg-white text-sm transition-all disabled:opacity-50" />
                            <FaCalendar className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 text-xs pointer-events-none" />
                          </div>
                        </div>
                        <div>
                          <label className="block text-neutral-700 text-xs mb-1.5 font-semibold">End Date <span className="text-neutral-400 font-normal">(optional)</span></label>
                          <div className="relative">
                            <input type="date" value={endDate} min={startDate} onChange={(e) => setEndDate(e.target.value)} disabled={loading} className="date-input-no-native-icon rounded-xl w-full px-4 py-2.5 border border-neutral-300 bg-[#F3F4F6] text-neutral-900 focus:outline-none focus:border-[#3B5BDB] focus:bg-white text-sm transition-all disabled:opacity-50" />
                            <FaCalendar className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 text-xs pointer-events-none" />
                          </div>
                        </div>
                      </div>
                      <div>
                        <label className="block text-neutral-700 text-xs mb-1.5 font-semibold">Delivery Date <span className="text-neutral-400 font-normal">(optional)</span></label>
                        <div className="relative">
                          <input type="date" value={deliveryDate} min={endDate} onChange={(e) => setDeliveryDate(e.target.value)} disabled={loading} className="date-input-no-native-icon rounded-xl w-full px-4 py-2.5 border border-neutral-300 bg-[#F3F4F6] text-neutral-900 focus:outline-none focus:border-[#3B5BDB] focus:bg-white text-sm transition-all disabled:opacity-50" />
                          <FaCalendar className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 text-xs pointer-events-none" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-neutral-700 text-xs mb-1.5 font-semibold">Primary Location (City)</label>
                        <input type="text" value={locationCity} onChange={(e) => setLocationCity(e.target.value)} placeholder="e.g., Mumbai" disabled={loading} className="rounded-xl w-full px-4 py-2.5 border border-neutral-300 bg-[#F3F4F6] text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-[#3B5BDB] focus:bg-white text-sm transition-all disabled:opacity-50" />
                      </div>
                      <div>
                        <label className="block text-neutral-700 text-xs mb-1.5 font-semibold">Total Budget (₹) <span className="text-neutral-400 font-normal">(optional)</span></label>
                        <input type="number" min="0" value={budget} onChange={(e) => setBudget(e.target.value)} placeholder="e.g., 500000" disabled={loading} className="rounded-xl w-full px-4 py-2.5 border border-neutral-300 bg-[#F3F4F6] text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-[#3B5BDB] focus:bg-white text-sm transition-all disabled:opacity-50" />
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-neutral-700 text-xs font-semibold">Shoot Dates <span className="text-[#F40F02]">*</span></label>
                          <button type="button" onClick={addShootDate} className="text-xs text-[#3B5BDB] hover:underline flex items-center gap-1">
                            <FaPlus className="w-2.5 h-2.5" /> Add Date
                          </button>
                        </div>
                        <div className="space-y-2">
                          {shootDates.map((d, i) => (
                            <div key={i} className="flex items-center gap-2">
                              <div className="relative flex-1">
                                <input type="date" value={d} onChange={(e) => updateShootDate(i, e.target.value)} disabled={loading} min={startDate} max={endDate} className="date-input-no-native-icon rounded-xl w-full px-4 py-2.5 border border-neutral-300 bg-[#F3F4F6] text-neutral-900 focus:outline-none focus:border-[#3B5BDB] focus:bg-white text-sm transition-all disabled:opacity-50" />
                                <FaCalendar className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 text-xs pointer-events-none" />
                              </div>
                              {shootDates.length > 1 && (
                                <button type="button" onClick={() => removeShootDate(i)} className="w-8 h-8 rounded-lg bg-[#F3F4F6] flex items-center justify-center text-neutral-400 hover:bg-red-50 hover:text-red-500 transition-colors">
                                  <FaXmark className="text-xs" />
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-neutral-700 text-xs font-semibold">Shoot Locations</label>
                          <button type="button" onClick={addLocation} className="text-xs text-[#3B5BDB] hover:underline flex items-center gap-1">
                            <FaPlus className="w-2.5 h-2.5" /> Add Location
                          </button>
                        </div>
                        <div className="space-y-2">
                          {shootLocations.map((loc, i) => (
                            <div key={i} className="flex items-center gap-2">
                              <div className="relative flex-1">
                                <FaLocationDot className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 text-xs pointer-events-none" />
                                <input type="text" value={loc} onChange={(e) => updateLocation(i, e.target.value)} placeholder={`Location ${i + 1} e.g., Ladakh`} disabled={loading} className="rounded-xl w-full pl-9 pr-4 py-2.5 border border-neutral-300 bg-[#F3F4F6] text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-[#3B5BDB] focus:bg-white text-sm transition-all disabled:opacity-50" />
                              </div>
                              {shootLocations.length > 1 && (
                                <button type="button" onClick={() => removeLocation(i)} className="w-8 h-8 rounded-lg bg-[#F3F4F6] flex items-center justify-center text-neutral-400 hover:bg-red-50 hover:text-red-500 transition-colors">
                                  <FaXmark className="text-xs" />
                                </button>
                              )}
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
                        { label: 'Production House',  value: productionHouseName.trim() || 'Not set' },
                        { label: 'Duration',          value: duration },
                        { label: 'Budget',            value: budget ? `₹${budget}` : 'Not set' },
                        { label: 'Shoot dates',       value: shootDates.filter(d => d.trim()).length ? shootDates.filter(d => d.trim()).map(d => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })).join(', ') : 'Not set' },
                        { label: 'Locations',         value: shootLocations.filter(s => s.trim()).join(', ') || 'Not set' },
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
                      onClick={() => handleSave()}
                      disabled={loading}
                      className="rounded-xl w-full py-3 bg-[#3B5BDB] text-white font-semibold text-sm hover:bg-[#2f4ac2] mb-2 flex items-center justify-center gap-2 transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {loading ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Saving…</> : <><FaClipboardCheck /> Save changes</>}
                    </button>
                  </div>
                </div>
              </div>
              )}
            </div>
          </div>
          <AppFooter />
        </main>
      </div>
    </div>
  );
}
