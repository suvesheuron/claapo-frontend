import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useEffect, useState, useCallback, useRef } from 'react';
import { FaTruck, FaMagnifyingGlass, FaChevronLeft, FaChevronRight, FaPlus, FaTriangleExclamation, FaLocationDot } from 'react-icons/fa6';
import AppFooter from '../components/AppFooter';
import Avatar from '../components/Avatar';
import DashboardHeader from '../components/DashboardHeader';
import DashboardSidebar from '../components/DashboardSidebar';
import { useAuth } from '../contexts/AuthContext';
import { api, ApiException } from '../services/api';
import { formatPaise } from '../utils/currency';
import { companyNavLinks } from '../navigation/dashboardNav';
import { REGISTRATION_INDIVIDUAL_DEPARTMENTS, REGISTRATION_VENDOR_CATEGORIES, REGISTRATION_GENRES, vendorCategoryToVendorType } from '../constants/registrationCategories';

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
  const { user } = useAuth();
  const isSubuser = user?.mainUserId != null;

  const [searchParams] = useSearchParams();

  const initType = (searchParams.get('type') as SearchType) === 'vendors' ? 'vendors' : 'crew';
  const [searchType, setSearchType] = useState<SearchType>(initType);

  const [query, setQuery] = useState('');
  const [location, setLocation] = useState('');
  const [skillFilter, setSkillFilter] = useState('');
  const [genreFilter, setGenreFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [budgetMin, setBudgetMin] = useState('');
  const [budgetMax, setBudgetMax] = useState('');
  const [page, setPage] = useState(1);

  const [crewResults, setCrewResults] = useState<CrewResult[]>([]);
  const [vendorResults, setVendorResults] = useState<VendorResult[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { document.title = 'Find Crew & Vendors – Claapo'; }, []);

  const doSearch = useCallback(async (
    q: string,
    loc: string,
    skill: string,
    genre: string,
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
        if (genre.trim()) params.genre = genre.trim();
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
    genre: string,
    sDate: string,
    eDate: string,
    minBudgetInr: string,
    maxBudgetInr: string,
    pg: number,
    type: SearchType,
  ) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(
      () => doSearch(q, loc, skill, genre, sDate, eDate, minBudgetInr, maxBudgetInr, pg, type),
      300,
    );
  }, [doSearch]);

  useEffect(() => {
    triggerSearch(query, location, skillFilter, genreFilter, startDate, endDate, budgetMin, budgetMax, page, searchType);
  }, [query, location, skillFilter, genreFilter, startDate, endDate, budgetMin, budgetMax, page, searchType, triggerSearch]);

  const switchType = (type: SearchType) => {
    setSearchType(type);
    setPage(1);
    setQuery('');
    setLocation('');
    setSkillFilter('');
    setGenreFilter('');
    setStartDate('');
    setEndDate('');
    setBudgetMin('');
    setBudgetMax('');
  };

  const results = searchType === 'crew' ? (crewResults ?? []) : (vendorResults ?? []);
  const resultCount = Array.isArray(results) ? results.length : 0;

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-[#F3F4F6] w-full">
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
                {!isSubuser && (
                  <Link to="/projects/new" className="rounded-xl px-5 py-2.5 bg-gradient-to-br from-[#3678F1] to-[#2563EB] text-white text-sm font-semibold hover:from-[#2563EB] hover:to-[#1D4ED8] shadow-brand inline-flex items-center gap-2 transition-colors duration-200 shrink-0">
                    <FaPlus className="w-3 h-3" />
                    <span className="hidden sm:inline">Create Project</span>
                  </Link>
                )}
              </div>

              {/* Crew / Vendor toggle — pill-shaped tabs */}
              <div className="flex items-center gap-1 mb-5 bg-[#E8F0FE] rounded-full p-1 w-fit">
                {(['crew', 'vendors'] as SearchType[]).map((type) => (
                  <button key={type} type="button" onClick={() => switchType(type)}
                    className={`rounded-full px-6 py-2 text-sm font-semibold transition-colors duration-200 capitalize ${searchType === type ? 'bg-white text-[#3678F1] shadow-sm' : 'text-[#2563EB] hover:text-[#1D4ED8]'}`}>
                    {type === 'crew' ? 'Crew' : 'Vendors'}
                  </button>
                ))}
              </div>

              {/* Horizontal filter bar */}
              <div className="rounded-2xl bg-white shadow-sm border border-neutral-200/70 hover:border-[#3678F1] transition-colors duration-200 p-5 sm:p-6 mb-6">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  {/* Row 1 - First 6 fields */}
                  {/* Search input */}
                  <div>
                    <label className="block text-[11px] font-bold text-neutral-500 mb-2 uppercase tracking-widest">
                      {searchType === 'crew' ? ' Name' : 'Vendor Name'}
                    </label>
                    <div className="relative group">
                      <input type="text" value={query} onChange={(e) => { setQuery(e.target.value); setPage(1); }}
                        placeholder={searchType === 'crew' ? 'Search by name' : 'Search by name'}
                        className="w-full pl-10 pr-4 py-3 border border-neutral-200 rounded-xl text-sm bg-neutral-50 placeholder-neutral-400 focus:bg-white focus:outline-none focus:border-[#3678F1] focus:ring-2 focus:ring-[#3678F1]/20 transition-colors duration-200" />
                      <FaMagnifyingGlass className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 text-sm group-focus-within:text-[#3678F1] transition-colors" />
                    </div>
                  </div>

                  {/* Location */}
                  <div>
                    <label className="block text-[11px] font-bold text-neutral-500 mb-2 uppercase tracking-widest">City</label>
                    <div className="relative group">
                      <input type="text" value={location} onChange={(e) => { setLocation(e.target.value); setPage(1); }}
                        placeholder="e.g. Mumbai"
                        className="w-full pl-10 pr-4 py-3 border border-neutral-200 rounded-xl text-sm bg-neutral-50 placeholder-neutral-400 focus:bg-white focus:outline-none focus:border-[#3678F1] focus:ring-2 focus:ring-[#3678F1]/20 transition-colors duration-200" />
                      <FaLocationDot className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 text-sm group-focus-within:text-[#3678F1] transition-colors" />
                    </div>
                  </div>

                  {/* Skill filter for crew */}
                  {searchType === 'crew' && (
                    <div>
                      <label className="block text-[11px] font-bold text-neutral-500 mb-2 uppercase tracking-widest">Role</label>
                      <select value={skillFilter} onChange={(e) => { setSkillFilter(e.target.value); setPage(1); }}
                        className="w-full px-4 py-3 border border-neutral-200 rounded-xl text-sm bg-neutral-50 focus:bg-white focus:outline-none focus:border-[#3678F1] focus:ring-2 focus:ring-[#3678F1]/20 transition-colors duration-200 appearance-none">
                        <option value="">All roles</option>
                        {REGISTRATION_INDIVIDUAL_DEPARTMENTS.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  )}

                  {/* Genre filter for crew */}
                  {searchType === 'crew' && (
                    <div>
                      <label className="block text-[11px] font-bold text-neutral-500 mb-2 uppercase tracking-widest">Genre</label>
                      <select value={genreFilter} onChange={(e) => { setGenreFilter(e.target.value); setPage(1); }}
                        className="w-full px-4 py-3 border border-neutral-200 rounded-xl text-sm bg-neutral-50 focus:bg-white focus:outline-none focus:border-[#3678F1] focus:ring-2 focus:ring-[#3678F1]/20 transition-colors duration-200 appearance-none">
                        <option value="">All genres</option>
                        {REGISTRATION_GENRES.map(g => <option key={g} value={g}>{g}</option>)}
                      </select>
                    </div>
                  )}

                  {/* Vendor type filter */}
                  {searchType === 'vendors' && (
                    <div>
                      <label className="block text-[11px] font-bold text-neutral-500 mb-2 uppercase tracking-widest">Type</label>
                      <select value={skillFilter} onChange={(e) => { setSkillFilter(e.target.value); setPage(1); }}
                        className="w-full px-4 py-3 border border-neutral-200 rounded-xl text-sm bg-neutral-50 focus:bg-white focus:outline-none focus:border-[#3678F1] focus:ring-2 focus:ring-[#3678F1]/20 transition-colors duration-200 appearance-none">
                        <option value="">All types</option>
                        {REGISTRATION_VENDOR_CATEGORIES.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                  )}

                  {/* Budget Min */}
                  <div>
                    <label className="block text-[11px] font-bold text-neutral-500 mb-2 uppercase tracking-widest">Budget Min</label>
                    <input
                      type="number"
                      min={0}
                      value={budgetMin}
                      onChange={(e) => { setBudgetMin(e.target.value); setPage(1); }}
                      placeholder="e.g. 15000"
                      className="w-full px-4 py-3 border border-neutral-200 rounded-xl text-sm bg-neutral-50 focus:bg-white focus:outline-none focus:border-[#3678F1] focus:ring-2 focus:ring-[#3678F1]/20 transition-colors duration-200"
                    />
                  </div>

                  {/* Budget Max */}
                  <div>
                    <label className="block text-[11px] font-bold text-neutral-500 mb-2 uppercase tracking-widest">Budget Max </label>
                    <input
                      type="number"
                      min={0}
                      value={budgetMax}
                      onChange={(e) => { setBudgetMax(e.target.value); setPage(1); }}
                      placeholder="e.g. 40000"
                      className="w-full px-4 py-3 border border-neutral-200 rounded-xl text-sm bg-neutral-50 focus:bg-white focus:outline-none focus:border-[#3678F1] focus:ring-2 focus:ring-[#3678F1]/20 transition-colors duration-200"
                    />
                  </div>

                  {/* Row 2 - Start Date, End Date, Reset */}
                  {/* Start Date */}
                  <div>
                    <label className="block text-[11px] font-bold text-neutral-500 mb-2 uppercase tracking-widest">Start Date</label>
                    <input type="date" value={startDate} onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
                      className="w-full px-4 py-3 border border-neutral-200 rounded-xl text-sm bg-neutral-50 focus:bg-white focus:outline-none focus:border-[#3678F1] focus:ring-2 focus:ring-[#3678F1]/20 transition-colors duration-200" />
                  </div>

                  {/* End Date */}
                  <div>
                    <label className="block text-[11px] font-bold text-neutral-500 mb-2 uppercase tracking-widest">End Date</label>
                    <input type="date" value={endDate} min={startDate || undefined} onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
                      className="w-full px-4 py-3 border border-neutral-200 rounded-xl text-sm bg-neutral-50 focus:bg-white focus:outline-none focus:border-[#3678F1] focus:ring-2 focus:ring-[#3678F1]/20 transition-colors duration-200" />
                  </div>

                  {/* Reset button */}
                  <div className="flex items-end">
                    <button type="button" onClick={() => { setQuery(''); setLocation(''); setSkillFilter(''); setGenreFilter(''); setStartDate(''); setEndDate(''); setBudgetMin(''); setBudgetMax(''); setPage(1); }}
                      className="w-full h-[46px] rounded-xl border border-neutral-200 text-sm font-semibold text-neutral-600 hover:text-[#3678F1] hover:border-[#3678F1] transition-colors duration-200 whitespace-nowrap">
                      Reset
                    </button>
                  </div>
                </div>
              </div>

              {/* Results count + top pagination */}
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-neutral-500">
                  {loading ? 'Searching…' : <><span className="font-semibold text-neutral-800">{resultCount}</span> result{resultCount !== 1 ? 's' : ''}</>}
                </p>
                {totalPages > 1 && (
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="w-8 h-8 rounded-lg border border-neutral-200 flex items-center justify-center text-neutral-500 hover:border-[#3678F1] hover:text-[#3678F1] disabled:opacity-30 disabled:hover:border-neutral-200 disabled:hover:text-neutral-500 transition-colors duration-200">
                      <FaChevronLeft className="text-[10px]" />
                    </button>
                    <span className="text-xs text-neutral-500 font-medium min-w-[70px] text-center tabular-nums">Page {page} / {totalPages}</span>
                    <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="w-8 h-8 rounded-lg border border-neutral-200 flex items-center justify-center text-neutral-500 hover:border-[#3678F1] hover:text-[#3678F1] disabled:opacity-30 disabled:hover:border-neutral-200 disabled:hover:text-neutral-500 transition-colors duration-200">
                      <FaChevronRight className="text-[10px]" />
                    </button>
                  </div>
                )}
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-center gap-3 rounded-2xl bg-[#FEEBEA] border border-[#F40F02]/30 p-4 mb-5">
                  <div className="w-9 h-9 rounded-xl bg-white/60 flex items-center justify-center shrink-0">
                    <FaTriangleExclamation className="text-[#F40F02]" />
                  </div>
                  <p className="text-sm text-[#991B1B]">{error}</p>
                </div>
              )}

              {/* Loading skeleton */}
              {loading && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[1,2,3,4,5,6].map((i) => (
                    <div key={i} className="rounded-2xl bg-white border border-neutral-200/70 shadow-sm p-5">
                      <div className="flex items-start justify-between gap-3 mb-4">
                        <div className="skeleton w-12 h-12 rounded-xl" />
                        <div className="skeleton h-6 w-20 rounded-full" />
                      </div>
                      <div className="space-y-2 mb-4">
                        <div className="skeleton h-4 w-3/5 rounded-md" />
                        <div className="skeleton h-2.5 w-2/5 rounded-full" />
                      </div>
                      <div className="pt-4 border-t border-neutral-100 space-y-2">
                        <div className="skeleton h-3 w-1/2 rounded-full" />
                        <div className="skeleton h-7 w-28 rounded-lg" />
                      </div>
                      <div className="skeleton h-10 w-full rounded-xl mt-4" />
                    </div>
                  ))}
                </div>
              )}

              {/* Vertical result list — Crew */}
              {!loading && searchType === 'crew' && (
                crewResults.length === 0 ? (
                  <div className="rounded-2xl bg-white border border-neutral-200/70 shadow-sm p-16 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-[#E8F0FE] flex items-center justify-center mx-auto mb-4">
                      <FaMagnifyingGlass className="text-[#3678F1] text-xl" />
                    </div>
                    <p className="text-base font-semibold text-neutral-900 mb-1.5">No crew found</p>
                    <p className="text-sm text-neutral-500 max-w-xs mx-auto">Try adjusting your filters or search in a different city</p>
                  </div>
                ) : (
                  <motion.div variants={containerVariants} initial="hidden" animate="visible" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {crewResults.map((r) => (
                      <motion.div
                        variants={itemVariants}
                        key={r.userId}
                        className="rounded-2xl bg-white shadow-sm border border-neutral-200/70 hover:border-[#3678F1] transition-colors duration-200 flex flex-col p-5"
                      >
                        {/* Header: avatar + status pill */}
                        <div className="flex items-start justify-between gap-3 mb-4">
                          <Avatar name={r.displayName} size="lg" />
                          <span
                            className={`inline-flex items-center gap-1.5 h-6 px-2.5 rounded-full text-[10.5px] font-bold tracking-wide shrink-0 ${
                              r.isAvailable
                                ? 'bg-[#DCFCE7] text-[#15803D]'
                                : 'bg-[#F3F4F6] text-neutral-500'
                            }`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${r.isAvailable ? 'bg-[#22C55E]' : 'bg-neutral-400'}`} />
                            {r.isAvailable ? 'Available' : 'Unavailable'}
                          </span>
                        </div>

                        {/* Name + skills */}
                        <h3 className="text-[15px] font-bold text-neutral-900 truncate">{r.displayName}</h3>
                        <p className="text-[10.5px] uppercase tracking-widest text-neutral-400 font-semibold mt-1 mb-4 truncate">
                          {r.skills?.join(' · ') || '—'}
                        </p>

                        {/* Meta row */}
                        <div className="flex flex-col gap-2 pt-4 border-t border-neutral-100">
                          {r.locationCity && (
                            <span className="text-xs text-neutral-500 flex items-center gap-1.5">
                              <FaLocationDot className="text-neutral-300 text-[11px]" />
                              {r.locationCity}{r.locationState ? `, ${r.locationState}` : ''}
                            </span>
                          )}
                          <span className="inline-flex items-center text-[12px] font-bold text-[#2563EB] bg-[#E8F0FE] px-2.5 py-1.5 rounded-lg w-fit">
                            {r.dailyBudget ? formatPaise(r.dailyBudget) + ' /day' : 'Rate on request'}
                          </span>
                        </div>

                        {/* CTA */}
                        <Link
                          to={`/profile/${r.userId}`}
                          className="mt-4 w-full inline-flex items-center justify-center h-10 rounded-xl bg-gradient-to-br from-[#3678F1] to-[#2563EB] text-white text-[13px] font-semibold hover:from-[#2563EB] hover:to-[#1D4ED8] shadow-brand transition-colors duration-200"
                        >
                          View Profile
                        </Link>
                      </motion.div>
                    ))}
                  </motion.div>
                )
              )}

              {/* Vertical result list — Vendors */}
              {!loading && searchType === 'vendors' && (
                vendorResults.length === 0 ? (
                  <div className="rounded-2xl bg-white border border-neutral-200/70 shadow-sm p-16 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-[#E8F0FE] flex items-center justify-center mx-auto mb-4">
                      <FaMagnifyingGlass className="text-[#3678F1] text-xl" />
                    </div>
                    <p className="text-base font-semibold text-neutral-900 mb-1.5">No vendors found</p>
                    <p className="text-sm text-neutral-500 max-w-xs mx-auto">Try adjusting your filters</p>
                  </div>
                ) : (
                  <motion.div variants={containerVariants} initial="hidden" animate="visible" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {vendorResults.map((r) => (
                      <motion.div
                        variants={itemVariants}
                        key={r.userId}
                        className="rounded-2xl bg-white shadow-sm border border-neutral-200/70 hover:border-[#3678F1] transition-colors duration-200 flex flex-col p-5"
                      >
                        {/* Header: icon + status pill */}
                        <div className="flex items-start justify-between gap-3 mb-4">
                          <div className="w-12 h-12 rounded-xl bg-[#E8F0FE] ring-1 ring-[#3678F1]/15 flex items-center justify-center shrink-0">
                            <FaTruck className="text-[#3678F1] text-base" />
                          </div>
                          <div className="flex flex-col gap-1 items-end">
                            <span className="inline-flex items-center gap-1.5 h-6 px-2.5 rounded-full text-[10.5px] font-bold tracking-wide bg-[#DCFCE7] text-[#15803D]">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E]" />
                              Available
                            </span>
                            {r.isGstVerified && (
                              <span className="text-[9.5px] font-bold px-2 py-0.5 rounded-full bg-[#E8F0FE] text-[#2563EB]">
                                GST Verified
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Name + type */}
                        <h3 className="text-[15px] font-bold text-neutral-900 truncate">{r.companyName}</h3>
                        <p className="text-[10.5px] uppercase tracking-widest text-[#3678F1] font-semibold mt-1 mb-4 truncate">
                          {r.vendorType === 'all' ? 'All types' : (r.vendorType?.replace(/_/g, ' ') ?? 'Vendor')}
                        </p>

                        {/* Meta row */}
                        {r.locationCity && (
                          <div className="flex flex-col gap-2 pt-4 border-t border-neutral-100">
                            <span className="text-xs text-neutral-500 flex items-center gap-1.5">
                              <FaLocationDot className="text-neutral-300 text-[11px]" />
                              {r.locationCity}
                            </span>
                          </div>
                        )}

                        {/* CTA */}
                        <Link
                          to={`/profile/${r.userId}`}
                          className="mt-4 w-full inline-flex items-center justify-center h-10 rounded-xl bg-gradient-to-br from-[#3678F1] to-[#2563EB] text-white text-[13px] font-semibold hover:from-[#2563EB] hover:to-[#1D4ED8] shadow-brand transition-colors duration-200"
                        >
                          View Profile
                        </Link>
                      </motion.div>
                    ))}
                  </motion.div>
                )
              )}

              {/* Pagination at bottom */}
              {!loading && totalPages > 1 && (
                <div className="flex justify-center items-center gap-1.5 mt-8">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="w-10 h-10 rounded-xl border border-neutral-200 bg-white flex items-center justify-center text-neutral-500 hover:border-[#3678F1] hover:text-[#3678F1] disabled:opacity-30 disabled:hover:border-neutral-200 disabled:hover:text-neutral-500 transition-colors duration-200">
                    <FaChevronLeft className="text-xs" />
                  </button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pg = page <= 3 ? i + 1 : page + i - 2;
                    if (pg < 1 || pg > totalPages) return null;
                    return (
                      <button key={pg} onClick={() => setPage(pg)} className={`w-10 h-10 rounded-xl text-sm font-semibold transition-colors duration-200 ${pg === page ? 'bg-[#3678F1] text-white shadow-brand' : 'border border-neutral-200 bg-white text-neutral-600 hover:border-[#3678F1] hover:text-[#3678F1]'}`}>{pg}</button>
                    );
                  })}
                  <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="w-10 h-10 rounded-xl border border-neutral-200 bg-white flex items-center justify-center text-neutral-500 hover:border-[#3678F1] hover:text-[#3678F1] disabled:opacity-30 disabled:hover:border-neutral-200 disabled:hover:text-neutral-500 transition-colors duration-200">
                    <FaChevronRight className="text-xs" />
                  </button>
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
