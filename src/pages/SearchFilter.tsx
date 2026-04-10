import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useEffect, useState, useCallback, useRef } from 'react';
import { FaTruck, FaMagnifyingGlass, FaChevronLeft, FaChevronRight, FaPlus, FaTriangleExclamation, FaLocationDot, FaMessage } from 'react-icons/fa6';
import AppFooter from '../components/AppFooter';
import Avatar from '../components/Avatar';
import BookingRequestModal from '../components/BookingRequestModal';
import ProjectChatStartModal from '../components/ProjectChatStartModal';
import DashboardHeader from '../components/DashboardHeader';
import DashboardSidebar from '../components/DashboardSidebar';
import { api, ApiException } from '../services/api';
import { formatPaise } from '../utils/currency';
import { companyNavLinks } from '../navigation/dashboardNav';
import { REGISTRATION_INDIVIDUAL_DEPARTMENTS, REGISTRATION_VENDOR_CATEGORIES, vendorCategoryToVendorType } from '../constants/registrationCategories';

type SearchType = 'crew' | 'vendors';

interface CrewResult {
  userId: string;
  displayName: string;
  skills: string[];
  locationCity?: string;
  locationState?: string;
  dailyBudget?: number;
  isAvailable: boolean;
  bio?: string;
}

interface VendorEquipmentItem {
  id: string;
  name: string;
  imageUrl?: string | null;
}
interface VendorResult {
  userId: string;
  companyName: string;
  vendorType: string;
  locationCity?: string;
  isGstVerified: boolean;
  equipment?: VendorEquipmentItem[];
}

interface SelectedUser { userId: string; name: string; role: string; rate: string; isVendor?: boolean; initialVendorEquipmentId?: string }
interface ChatTarget { userId: string; label: string }

const PAGE_SIZE = 15;

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } }
} satisfies Record<string, any>;

function parseBudgetToPaise(input: string): number | null {
  const normalized = input.trim();
  if (!normalized) return null;
  const value = Number(normalized);
  if (!Number.isFinite(value) || value < 0) return null;
  return Math.round(value * 100);
}

export default function SearchFilter() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [selectedUser, setSelectedUser] = useState<SelectedUser | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [chatTarget, setChatTarget] = useState<ChatTarget | null>(null);
  const [isChatProjectModalOpen, setIsChatProjectModalOpen] = useState(false);

  const initType = (searchParams.get('type') as SearchType) === 'vendors' ? 'vendors' : 'crew';
  const [searchType, setSearchType] = useState<SearchType>(initType);

  const [query,      setQuery]      = useState('');
  const [location,   setLocation]   = useState('');
  const [skillFilter, setSkillFilter] = useState('');
  const [startDate,  setStartDate]  = useState('');
  const [endDate,    setEndDate]    = useState('');
  const [budgetMin,  setBudgetMin]  = useState('');
  const [budgetMax,  setBudgetMax]  = useState('');
  const [page,       setPage]       = useState(1);

  const [crewResults,   setCrewResults]   = useState<CrewResult[]>([]);
  const [vendorResults, setVendorResults] = useState<VendorResult[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { document.title = 'Find Crew & Vendors – Claapo'; }, []);

  const doSearch = useCallback(async (
    q: string,
    loc: string,
    skill: string,
    sDate: string,
    eDate: string,
    minBudgetInr: string,
    maxBudgetInr: string,
    pg: number,
    type: SearchType,
  ) => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string> = {
        page: String(pg),
        limit: String(PAGE_SIZE),
      };

      const rateMinPaise = parseBudgetToPaise(minBudgetInr);
      const rateMaxPaise = parseBudgetToPaise(maxBudgetInr);
      if (rateMinPaise != null && rateMaxPaise != null && rateMinPaise > rateMaxPaise) {
        setCrewResults([]);
        setVendorResults([]);
        setTotalPages(1);
        setLoading(false);
        setError('Budget min cannot be greater than budget max.');
        return;
      }
      if (rateMinPaise != null) params.rateMin = String(rateMinPaise);
      if (rateMaxPaise != null) params.rateMax = String(rateMaxPaise);

      if (sDate) params.startDate = new Date(sDate).toISOString();
      if (eDate) params.endDate = new Date(eDate).toISOString();

      if (type === 'crew') {
        if (loc) params.city = loc;
        if (skill.trim()) params.skill = skill.trim();
        if (q.trim()) params.name = q.trim();
      } else {
        if (loc) params.city = loc;
        if (skill) params.type = vendorCategoryToVendorType(skill);
        if (q.trim()) params.companyName = q.trim();
      }

      const qs = new URLSearchParams(params);
      const raw = await api.get<{ items?: CrewResult[] | VendorResult[]; data?: CrewResult[] | VendorResult[]; meta?: { total?: number } }>(`/search/${type === 'crew' ? 'crew' : 'vendors'}?${qs.toString()}`);
      const list = Array.isArray(raw?.items) ? raw.items : Array.isArray(raw?.data) ? raw.data : [];
      const total = raw?.meta?.total ?? 0;
      if (type === 'crew') {
        setCrewResults(list as CrewResult[]);
      } else {
        setVendorResults(list as VendorResult[]);
      }
      setTotalPages(Math.max(1, Math.ceil(total / PAGE_SIZE)));
    } catch (err) {
      setError(err instanceof ApiException ? err.payload.message : 'Search failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounced search on input change
  const triggerSearch = useCallback((
    q: string,
    loc: string,
    skill: string,
    sDate: string,
    eDate: string,
    minBudgetInr: string,
    maxBudgetInr: string,
    pg: number,
    type: SearchType,
  ) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(
      () => doSearch(q, loc, skill, sDate, eDate, minBudgetInr, maxBudgetInr, pg, type),
      300,
    );
  }, [doSearch]);

  useEffect(() => {
    triggerSearch(query, location, skillFilter, startDate, endDate, budgetMin, budgetMax, page, searchType);
  }, [query, location, skillFilter, startDate, endDate, budgetMin, budgetMax, page, searchType, triggerSearch]);

  const handleSendRequest = (user: SelectedUser) => { setSelectedUser(user); setIsModalOpen(true); };
  const openChatProjectModal = (target: ChatTarget) => {
    setChatTarget(target);
    setIsChatProjectModalOpen(true);
  };
  const handleStartProjectChat = (projectId: string) => {
    if (!chatTarget) return;
    setIsChatProjectModalOpen(false);
    navigate(`/dashboard/chat/${chatTarget.userId}?projectId=${encodeURIComponent(projectId)}`);
    setChatTarget(null);
  };

  const switchType = (type: SearchType) => {
    setSearchType(type);
    setPage(1);
    setQuery('');
    setLocation('');
    setSkillFilter('');
    setStartDate('');
    setEndDate('');
    setBudgetMin('');
    setBudgetMax('');
  };

  const results = searchType === 'crew' ? (crewResults ?? []) : (vendorResults ?? []);
  const resultCount = Array.isArray(results) ? results.length : 0;

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-[#F8F9FB] w-full">
      <DashboardHeader />
      <div className="flex-1 flex min-h-0 overflow-hidden">
        <DashboardSidebar links={companyNavLinks} />
        <main className="flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden">
          <div className="flex-1 min-h-0 overflow-auto">
            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-6 xl:px-8 py-6">

              {/* Page header */}
              <div className="flex items-center justify-between gap-4 mb-6">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Find Crew & Vendors</h1>
                  <p className="text-sm text-neutral-500 mt-1">Search and hire the best talent for your productions</p>
                </div>
                <Link to="/dashboard/projects/new" className="rounded-xl px-5 py-2.5 bg-[#3B5BDB] text-white text-sm font-semibold hover:bg-[#2f4ac2] shadow-sm hover:shadow-md inline-flex items-center gap-2 transition-all duration-200 shrink-0">
                  <FaPlus className="w-3 h-3" />
                  <span className="hidden sm:inline">Create Project</span>
                </Link>
              </div>

              {/* Crew / Vendor toggle — pill-shaped tabs */}
              <div className="flex items-center gap-1 mb-5 bg-neutral-100 rounded-full p-1 w-fit">
                {(['crew', 'vendors'] as SearchType[]).map((type) => (
                  <button key={type} type="button" onClick={() => switchType(type)}
                    className={`rounded-full px-6 py-2 text-sm font-semibold transition-all duration-200 capitalize ${searchType === type ? 'bg-white text-[#3B5BDB] shadow-sm' : 'text-neutral-500 hover:text-neutral-700'}`}>
                    {type === 'crew' ? 'Crew' : 'Vendors'}
                  </button>
                ))}
              </div>

              {/* Horizontal filter bar */}
              <div className="rounded-3xl bg-white shadow-soft border border-neutral-100 p-6 mb-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-[#3B5BDB]/5 to-transparent rounded-full blur-3xl pointer-events-none" />
                <div className="flex flex-wrap gap-4 items-end relative z-10">
                  {/* Search input */}
                  <div className="flex-1 min-w-[180px]">
                    <label className="block text-[11px] font-bold text-neutral-500 mb-2 uppercase tracking-widest">
                      {searchType === 'crew' ? ' Name' : 'Vendor Name'}
                    </label>
                    <div className="relative group">
                      <input type="text" value={query} onChange={(e) => { setQuery(e.target.value); setPage(1); }}
                        placeholder={searchType === 'crew' ? 'Search by name' : 'Search by name'}
                        className="w-full pl-10 pr-4 py-3 border border-neutral-200 rounded-2xl text-sm bg-neutral-50 placeholder-neutral-400 focus:bg-white focus:outline-none focus:border-[#3B5BDB]/40 focus:ring-4 focus:ring-[#3B5BDB]/10 transition-all duration-300" />
                      <FaMagnifyingGlass className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 text-sm group-focus-within:text-[#3B5BDB] transition-colors" />
                    </div>
                  </div>

                  {/* Location */}
                  <div className="flex-1 min-w-[150px]">
                    <label className="block text-[11px] font-bold text-neutral-500 mb-2 uppercase tracking-widest">City</label>
                    <div className="relative group">
                      <input type="text" value={location} onChange={(e) => { setLocation(e.target.value); setPage(1); }}
                        placeholder="e.g. Mumbai"
                        className="w-full pl-10 pr-4 py-3 border border-neutral-200 rounded-2xl text-sm bg-neutral-50 placeholder-neutral-400 focus:bg-white focus:outline-none focus:border-[#3B5BDB]/40 focus:ring-4 focus:ring-[#3B5BDB]/10 transition-all duration-300" />
                      <FaLocationDot className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 text-sm group-focus-within:text-[#3B5BDB] transition-colors" />
                    </div>
                  </div>

                  {/* Skill filter for crew */}
                  {searchType === 'crew' && (
                    <div className="flex-1 min-w-[150px]">
                      <label className="block text-[11px] font-bold text-neutral-500 mb-2 uppercase tracking-widest">Role</label>
                      <select value={skillFilter} onChange={(e) => { setSkillFilter(e.target.value); setPage(1); }}
                        className="w-full px-4 py-3 border border-neutral-200 rounded-2xl text-sm bg-neutral-50 focus:bg-white focus:outline-none focus:border-[#3B5BDB]/40 focus:ring-4 focus:ring-[#3B5BDB]/10 transition-all duration-300 appearance-none">
                        <option value="">All roles</option>
                        {REGISTRATION_INDIVIDUAL_DEPARTMENTS.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  )}

                  {/* Vendor type filter */}
                  {searchType === 'vendors' && (
                    <div className="flex-1 min-w-[150px]">
                      <label className="block text-[11px] font-bold text-neutral-500 mb-2 uppercase tracking-widest">Type</label>
                      <select value={skillFilter} onChange={(e) => { setSkillFilter(e.target.value); setPage(1); }}
                        className="w-full px-4 py-3 border border-neutral-200 rounded-2xl text-sm bg-neutral-50 focus:bg-white focus:outline-none focus:border-[#3B5BDB]/40 focus:ring-4 focus:ring-[#3B5BDB]/10 transition-all duration-300 appearance-none">
                        <option value="">All types</option>
                        {REGISTRATION_VENDOR_CATEGORIES.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                  )}

                  {/* Budget Min */}
                  <div className="flex-1 min-w-[140px]">
                    <label className="block text-[11px] font-bold text-neutral-500 mb-2 uppercase tracking-widest">Budget Min</label>
                    <input
                      type="number"
                      min={0}
                      value={budgetMin}
                      onChange={(e) => { setBudgetMin(e.target.value); setPage(1); }}
                      placeholder="e.g. 15000"
                      className="w-full px-4 py-3 border border-neutral-200 rounded-2xl text-sm bg-neutral-50 focus:bg-white focus:outline-none focus:border-[#3B5BDB]/40 focus:ring-4 focus:ring-[#3B5BDB]/10 transition-all duration-300"
                    />
                  </div>

                  {/* Budget Max */}
                  <div className="flex-1 min-w-[140px]">
                    <label className="block text-[11px] font-bold text-neutral-500 mb-2 uppercase tracking-widest">Budget Max </label>
                    <input
                      type="number"
                      min={0}
                      value={budgetMax}
                      onChange={(e) => { setBudgetMax(e.target.value); setPage(1); }}
                      placeholder="e.g. 40000"
                      className="w-full px-4 py-3 border border-neutral-200 rounded-2xl text-sm bg-neutral-50 focus:bg-white focus:outline-none focus:border-[#3B5BDB]/40 focus:ring-4 focus:ring-[#3B5BDB]/10 transition-all duration-300"
                    />
                  </div>

                  {/* Start Date */}
                  <div className="flex-1 min-w-[140px]">
                    <label className="block text-[11px] font-bold text-neutral-500 mb-2 uppercase tracking-widest">Start Date</label>
                    <input type="date" value={startDate} onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
                      className="w-full px-4 py-3 border border-neutral-200 rounded-2xl text-sm bg-neutral-50 focus:bg-white focus:outline-none focus:border-[#3B5BDB]/40 focus:ring-4 focus:ring-[#3B5BDB]/10 transition-all duration-300" />
                  </div>

                  {/* End Date */}
                  <div className="flex-1 min-w-[140px]">
                    <label className="block text-[11px] font-bold text-neutral-500 mb-2 uppercase tracking-widest">End Date</label>
                    <input type="date" value={endDate} min={startDate || undefined} onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
                      className="w-full px-4 py-3 border border-neutral-200 rounded-2xl text-sm bg-neutral-50 focus:bg-white focus:outline-none focus:border-[#3B5BDB]/40 focus:ring-4 focus:ring-[#3B5BDB]/10 transition-all duration-300" />
                  </div>

                  <button type="button" onClick={() => { setQuery(''); setLocation(''); setSkillFilter(''); setStartDate(''); setEndDate(''); setBudgetMin(''); setBudgetMax(''); setPage(1); }}
                    className="px-6 py-3 rounded-2xl border border-neutral-200 text-sm font-semibold text-neutral-600 hover:text-neutral-900 hover:border-neutral-300 hover:bg-neutral-100 hover:shadow-sm transition-all duration-300 whitespace-nowrap">
                    Reset
                  </button>
                </div>
              </div>

              {/* Results count + top pagination */}
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-neutral-500">
                  {loading ? 'Searching…' : <><span className="font-semibold text-neutral-800">{resultCount}</span> result{resultCount !== 1 ? 's' : ''}</>}
                </p>
                {totalPages > 1 && (
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="w-8 h-8 rounded-lg border border-neutral-200 flex items-center justify-center text-neutral-500 hover:bg-white hover:shadow-sm disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:shadow-none transition-all duration-200">
                      <FaChevronLeft className="text-[10px]" />
                    </button>
                    <span className="text-xs text-neutral-500 font-medium min-w-[70px] text-center tabular-nums">Page {page} / {totalPages}</span>
                    <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="w-8 h-8 rounded-lg border border-neutral-200 flex items-center justify-center text-neutral-500 hover:bg-white hover:shadow-sm disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:shadow-none transition-all duration-200">
                      <FaChevronRight className="text-[10px]" />
                    </button>
                  </div>
                )}
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-center gap-3 rounded-2xl bg-red-50 border border-red-100 p-4 mb-5 shadow-sm">
                  <div className="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
                    <FaTriangleExclamation className="text-red-500" />
                  </div>
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              {/* Loading skeleton */}
              {loading && (
                <div className="space-y-3">
                  {[1,2,3,4,5].map((i) => (
                    <div key={i} className="rounded-2xl bg-white border border-neutral-200/80 shadow-sm p-5 animate-pulse flex gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-neutral-100 shrink-0" />
                      <div className="flex-1 space-y-3">
                        <div className="h-4 bg-neutral-100 rounded-lg w-1/3" />
                        <div className="h-3 bg-neutral-50 rounded-lg w-1/2" />
                        <div className="h-3 bg-neutral-50 rounded-lg w-2/3" />
                      </div>
                      <div className="w-24 h-9 bg-neutral-100 rounded-xl shrink-0 self-center" />
                    </div>
                  ))}
                </div>
              )}

              {/* Vertical result list — Crew */}
              {!loading && searchType === 'crew' && (
                crewResults.length === 0 ? (
                  <div className="rounded-2xl bg-white border border-neutral-200/80 shadow-sm p-16 text-center">
                    <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center mx-auto mb-4">
                      <FaMagnifyingGlass className="text-neutral-300 text-xl" />
                    </div>
                    <p className="text-base font-semibold text-neutral-700 mb-1.5">No crew found</p>
                    <p className="text-sm text-neutral-400 max-w-xs mx-auto">Try adjusting your filters or search in a different city</p>
                  </div>
                ) : (
                  <motion.div variants={containerVariants} initial="hidden" animate="visible" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {crewResults.map((r) => (
                      <motion.div variants={itemVariants} key={r.userId} className="group relative rounded-3xl bg-white shadow-soft hover:shadow-float border border-neutral-100 transition-all duration-300 flex flex-col overflow-hidden">
                        {/* Status accent top bar */}
                        <div className={`h-1.5 w-full transition-colors duration-300 ${r.isAvailable ? 'bg-emerald-400 group-hover:bg-emerald-500' : 'bg-neutral-200 group-hover:bg-neutral-300'}`} />
                        
                        <div className="p-6 flex-1 flex flex-col">
                          <div className="flex items-start justify-between gap-4 mb-4">
                            <div className="ring-4 ring-neutral-50 rounded-full shadow-sm">
                              <Avatar name={r.displayName} size="lg" />
                            </div>
                            <span className={`text-[10px] font-bold px-3 py-1 rounded-full border ${r.isAvailable ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-neutral-50 text-neutral-500 border-neutral-200'}`}>
                                {r.isAvailable ? 'Available' : 'Unavailable'}
                            </span>
                          </div>
                          
                          <h3 className="text-lg font-extrabold text-neutral-900 truncate group-hover:text-[#3B5BDB] transition-colors duration-200">{r.displayName}</h3>
                          <p className="text-xs uppercase tracking-widest text-neutral-400 font-semibold mb-3 truncate">{r.skills?.join(' · ') || '—'}</p>
                          
                          <div className="flex flex-col gap-2 mb-4 mt-auto pt-4 border-t border-neutral-100">
                            {r.locationCity && (
                              <span className="text-xs text-neutral-500 flex items-center gap-2">
                                <FaLocationDot className="text-neutral-400" /> {r.locationCity}{r.locationState ? `, ${r.locationState}` : ''}
                              </span>
                            )}
                            <span className="text-[13px] font-bold text-neutral-900 bg-neutral-50 p-2 rounded-lg inline-block w-fit mt-1">
                              {r.dailyBudget ? formatPaise(r.dailyBudget) + ' /day' : 'Rate on request'}
                            </span>
                          </div>
                          
                          <div className="flex flex-col gap-2 mt-2">
                            <button type="button" onClick={() => handleSendRequest({ userId: r.userId, name: r.displayName, role: r.skills?.[0] ?? 'Crew', rate: r.dailyBudget ? formatPaise(r.dailyBudget) + ' /day' : 'Rate on request' })}
                              className="w-full rounded-xl px-4 py-3 bg-[#3B5BDB] text-white text-sm font-bold hover:bg-[#2f4ac2] shadow-sm hover:shadow-md transition-all duration-200 transform hover:-translate-y-0.5">
                              Book Crew
                            </button>
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => openChatProjectModal({ userId: r.userId, label: r.displayName })}
                                className="flex-1 rounded-xl px-4 py-2 border border-neutral-200 text-neutral-600 text-xs font-semibold hover:bg-neutral-50 transition-all duration-200 flex items-center justify-center gap-1.5"
                              >
                                <FaMessage className="w-3 h-3" /> Chat
                              </button>
                              <Link to={`/dashboard/profile/${r.userId}`} className="flex-1 rounded-xl px-4 py-2 border border-neutral-200 text-neutral-600 text-xs font-semibold hover:bg-neutral-50 transition-all duration-200 text-center">
                                View Profile
                              </Link>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                )
              )}

              {/* Vertical result list — Vendors */}
              {!loading && searchType === 'vendors' && (
                vendorResults.length === 0 ? (
                  <div className="rounded-2xl bg-white border border-neutral-200/80 shadow-sm p-16 text-center">
                    <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center mx-auto mb-4">
                      <FaMagnifyingGlass className="text-neutral-300 text-xl" />
                    </div>
                    <p className="text-base font-semibold text-neutral-700 mb-1.5">No vendors found</p>
                    <p className="text-sm text-neutral-400 max-w-xs mx-auto">Try adjusting your filters</p>
                  </div>
                ) : (
                  <motion.div variants={containerVariants} initial="hidden" animate="visible" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {vendorResults.map((r) => (
                      <motion.div variants={itemVariants} key={r.userId} className="group relative rounded-3xl bg-white shadow-soft hover:shadow-float border border-neutral-100 transition-all duration-300 flex flex-col overflow-hidden">
                        {/* Vendor accent top bar */}
                        <div className="h-1.5 w-full bg-[#F4C430] transition-colors duration-300" />
                        
                        <div className="p-6 flex-1 flex flex-col">
                          <div className="flex items-start justify-between gap-4 mb-4">
                            <div className="w-14 h-14 rounded-2xl bg-amber-50 ring-1 ring-amber-200/50 flex items-center justify-center shrink-0 shadow-sm">
                              <FaTruck className="text-amber-500 text-xl group-hover:scale-110 transition-transform duration-300" />
                            </div>
                            <div className="flex flex-col gap-1 items-end">
                              <span className="text-[10px] font-bold px-3 py-1 rounded-full border bg-emerald-50 text-emerald-600 border-emerald-200">Available</span>
                              {r.isGstVerified && <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-200">GST Verified</span>}
                            </div>
                          </div>
                          
                          <h3 className="text-lg font-extrabold text-neutral-900 truncate group-hover:text-[#3B5BDB] transition-colors duration-200">{r.companyName}</h3>
                          <p className="text-xs uppercase tracking-widest text-[#3B5BDB] font-semibold mb-3 truncate">{r.vendorType === 'all' ? 'All types' : (r.vendorType?.replace(/_/g, ' ') ?? 'Vendor')}</p>
                          
                          <div className="flex flex-col gap-2 mb-4 mt-auto pt-4 border-t border-neutral-100">
                            {r.locationCity && (
                              <span className="text-xs text-neutral-500 flex items-center gap-2">
                                <FaLocationDot className="text-neutral-400" /> {r.locationCity}
                              </span>
                            )}
                          </div>
                          
                          <div className="flex flex-col gap-2 mt-2">
                            <button type="button" onClick={() => handleSendRequest({ userId: r.userId, name: r.companyName, role: r.vendorType === 'all' ? 'All types' : (r.vendorType?.replace(/_/g, ' ') ?? 'Vendor'), rate: '—', isVendor: true, initialVendorEquipmentId: r.equipment?.length === 1 ? r.equipment[0].id : undefined })}
                              className="w-full rounded-xl px-4 py-3 bg-[#3B5BDB] text-white text-sm font-bold hover:bg-[#2f4ac2] shadow-sm hover:shadow-md transition-all duration-200 transform hover:-translate-y-0.5">
                              Request Booking
                            </button>
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => openChatProjectModal({ userId: r.userId, label: r.companyName })}
                                className="flex-1 rounded-xl px-4 py-2 border border-neutral-200 text-neutral-600 text-xs font-semibold hover:bg-neutral-50 transition-all duration-200 flex items-center justify-center gap-1.5"
                              >
                                <FaMessage className="w-3 h-3" /> Chat
                              </button>
                              <Link to={`/dashboard/profile/${r.userId}`} className="flex-1 rounded-xl px-4 py-2 border border-neutral-200 text-neutral-600 text-xs font-semibold hover:bg-neutral-50 transition-all duration-200 text-center">
                                View Profile
                              </Link>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                )
              )}

              {/* Pagination at bottom */}
              {!loading && totalPages > 1 && (
                <div className="flex justify-center items-center gap-1.5 mt-8">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="w-10 h-10 rounded-xl border border-neutral-200 bg-white flex items-center justify-center text-neutral-500 hover:bg-neutral-50 hover:shadow-sm disabled:opacity-30 disabled:hover:bg-white disabled:hover:shadow-none transition-all duration-200">
                    <FaChevronLeft className="text-xs" />
                  </button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pg = page <= 3 ? i + 1 : page + i - 2;
                    if (pg < 1 || pg > totalPages) return null;
                    return (
                      <button key={pg} onClick={() => setPage(pg)} className={`w-10 h-10 rounded-xl text-sm font-semibold transition-all duration-200 ${pg === page ? 'bg-[#3B5BDB] text-white shadow-sm' : 'border border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50 hover:shadow-sm'}`}>{pg}</button>
                    );
                  })}
                  <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="w-10 h-10 rounded-xl border border-neutral-200 bg-white flex items-center justify-center text-neutral-500 hover:bg-neutral-50 hover:shadow-sm disabled:opacity-30 disabled:hover:bg-white disabled:hover:shadow-none transition-all duration-200">
                    <FaChevronRight className="text-xs" />
                  </button>
                </div>
              )}

            </div>
          </div>
          <AppFooter />
        </main>
      </div>

      <BookingRequestModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setSelectedUser(null); }}
        userName={selectedUser?.name ?? ''}
        userRole={selectedUser?.role ?? ''}
        userRate={selectedUser?.rate ?? ''}
        targetUserId={selectedUser?.userId ?? ''}
        isVendor={selectedUser?.isVendor ?? false}
        initialVendorEquipmentId={selectedUser?.initialVendorEquipmentId}
        onSuccess={() => { setIsModalOpen(false); setSelectedUser(null); }}
      />
      <ProjectChatStartModal
        isOpen={isChatProjectModalOpen}
        targetLabel={chatTarget?.label ?? 'this user'}
        onClose={() => {
          setIsChatProjectModalOpen(false);
          setChatTarget(null);
        }}
        onStartChat={handleStartProjectChat}
      />
    </div>
  );
}
