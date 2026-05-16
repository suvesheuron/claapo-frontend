import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useEffect, useState, useCallback, useRef } from 'react';
import { FaMagnifyingGlass, FaChevronLeft, FaChevronRight, FaPlus, FaTriangleExclamation, FaLocationDot, FaBuilding } from 'react-icons/fa6';
import toast from 'react-hot-toast';
import AppFooter from '../components/AppFooter';
import Avatar from '../components/Avatar';
import DateInput from '../components/DateInput';
import DashboardHeader from '../components/DashboardHeader';
import DashboardSidebar from '../components/DashboardSidebar';
import { useAuth } from '../contexts/AuthContext';
import { api, ApiException } from '../services/api';
import { formatPaise } from '../utils/currency';
import { companyNavLinks } from '../navigation/dashboardNav';
import { REGISTRATION_INDIVIDUAL_DEPARTMENTS, REGISTRATION_VENDOR_CATEGORIES, REGISTRATION_GENRES, vendorCategoryToVendorType } from '../constants/registrationCategories';

type SearchType = 'crew' | 'vendors' | 'companies';

interface CrewResult {
  userId: string;
  displayName: string;
  skills: string[];
  locationCity?: string;
  locationState?: string;
  dailyBudget?: number;
  isAvailable: boolean;
  bio?: string;
  avatarUrl?: string | null;
}

/**
 * Companies-tab result shape. Backed by /search/people?category=company —
 * the existing /search/crew + /search/vendors endpoints are filter-rich;
 * companies have no filter surface per spec 8, so we lean on the simpler
 * directory endpoint for this tab.
 */
interface CompanyResult {
  userId: string;
  name: string;
  locationCity?: string | null;
  locationState?: string | null;
  avatarUrl?: string | null;
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
  vendorServiceCategory?: string | null;
  locationCity?: string;
  isGstVerified: boolean;
  equipment?: VendorEquipmentItem[];
  avatarUrl?: string | null;
}

interface ProjectItem {
  id: string;
  title: string;
  status: string;
  startDate?: string;
  endDate?: string;
  shootDates?: string[];
  shootLocations?: string[];
  locationCity?: string;
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

  const initTypeRaw = searchParams.get('type');
  const initType: SearchType =
    initTypeRaw === 'vendors' ? 'vendors'
    : initTypeRaw === 'companies' ? 'companies'
    : 'crew';
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
  const [companyResults, setCompanyResults] = useState<CompanyResult[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedVendorIds, setSelectedVendorIds] = useState<string[]>([]);
  const [quotationFile, setQuotationFile] = useState<File | null>(null);
  const [sendingQuotation, setSendingQuotation] = useState(false);
  const [activeProjects, setActiveProjects] = useState<ProjectItem[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [selectedQuotationProjectId, setSelectedQuotationProjectId] = useState('');

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const quotationFileInputRef = useRef<HTMLInputElement>(null);

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

      // Companies tab uses the simple directory endpoint — name-only, no filters
      // (spec 8). Branching early keeps the existing crew/vendor logic untouched.
      if (type === 'companies') {
        if (q.trim()) params.q = q.trim();
        params.category = 'company';
        const qs = new URLSearchParams(params);
        type PeopleRow = { userId: string; name: string; locationCity?: string | null; locationState?: string | null; avatarUrl?: string | null };
        const raw = await api.get<{ items?: PeopleRow[]; meta?: { total?: number } }>(`/search/people?${qs.toString()}`);
        const list = Array.isArray(raw?.items) ? raw.items : [];
        const total = raw?.meta?.total ?? 0;
        setCompanyResults(list);
        setTotalPages(Math.max(1, Math.ceil(total / PAGE_SIZE)));
        return;
      }

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
      if (type === 'crew') {
        if (rateMinPaise != null) params.rateMin = String(rateMinPaise);
        if (rateMaxPaise != null) params.rateMax = String(rateMaxPaise);
      }

      if (sDate) params.startDate = new Date(sDate).toISOString();
      if (eDate) params.endDate = new Date(eDate).toISOString();

      if (type === 'crew') {
        if (loc) params.city = loc;
        if (skill.trim()) params.skill = skill.trim();
        if (genre.trim()) params.genre = genre.trim();
        if (q.trim()) params.name = q.trim();
      } else {
        if (loc) params.city = loc;
        if (skill) {
          params.vendorServiceCategory = skill;
          // Keep the old type param for backward compatibility with older vendor rows
          // that may not have serviceCategory populated yet.
          params.type = vendorCategoryToVendorType(skill);
        }
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

  useEffect(() => {
    if (searchType !== 'vendors') return;
    setProjectsLoading(true);
    api.get<{ items?: ProjectItem[]; data?: ProjectItem[] }>('/projects?limit=100')
      .then((res) => {
        const items = Array.isArray(res?.items) ? res.items : Array.isArray(res?.data) ? res.data : [];
        setActiveProjects(items.filter((p) => p.status === 'active' || p.status === 'open' || p.status === 'draft'));
      })
      .catch(() => setActiveProjects([]))
      .finally(() => setProjectsLoading(false));
  }, [searchType]);

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
    setSelectedVendorIds([]);
    setQuotationFile(null);
    setSelectedQuotationProjectId('');
  };

  const toggleVendorSelection = (userId: string) => {
    setSelectedVendorIds((prev) => prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]);
  };

  const isAllVendorsMarked = vendorResults.length > 0 && vendorResults.every((r) => selectedVendorIds.includes(r.userId));

  /**
   * Build the quotation template from the selected project. Prefer the
   * project's own shootDates/shootLocations (what the company actually
   * scheduled in CreateProject), then fall back to startDate..endDate or the
   * search filter values, then finally TBD. The previous version only read
   * from the search-filter inputs, so the message defaulted to "TBD" whenever
   * the user hadn't typed those filters in.
   */
  const getQuotationTemplate = (project: ProjectItem) => {
    const fmt = (iso: string) =>
      new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

    const sortedShootDates = (project.shootDates ?? [])
      .map((s) => s.slice(0, 10))
      .filter(Boolean)
      .sort();

    let dateLabel = 'TBD';
    if (sortedShootDates.length === 1) {
      dateLabel = fmt(sortedShootDates[0]);
    } else if (sortedShootDates.length > 1) {
      dateLabel = `${fmt(sortedShootDates[0])} to ${fmt(sortedShootDates[sortedShootDates.length - 1])}`;
    } else if (project.startDate && project.endDate) {
      dateLabel = `${fmt(project.startDate)} to ${fmt(project.endDate)}`;
    } else if (project.startDate) {
      dateLabel = fmt(project.startDate);
    } else if (project.endDate) {
      dateLabel = fmt(project.endDate);
    } else if (startDate && endDate) {
      dateLabel = `${fmt(startDate)} to ${fmt(endDate)}`;
    } else if (startDate) {
      dateLabel = fmt(startDate);
    } else if (endDate) {
      dateLabel = fmt(endDate);
    }

    const uniqueLocations = Array.from(
      new Set(
        (project.shootLocations ?? [])
          .map((l) => l?.trim())
          .filter((l): l is string => !!l),
      ),
    );

    let locationLabel = 'TBD';
    if (uniqueLocations.length > 0) {
      locationLabel = uniqueLocations.join(', ');
    } else if (project.locationCity?.trim()) {
      locationLabel = project.locationCity.trim();
    } else if (location.trim()) {
      locationLabel = location.trim();
    }

    return `Hi, hope you're doing well :)

We are looking for a quotation for project "${project.title}".

Project date: ${dateLabel}
Project location: ${locationLabel}

Please share your best quotation for this requirement.`;
  };

  const sendQuotationToSelectedVendors = async () => {
    if (selectedVendorIds.length === 0) {
      toast.error('Please mark at least one vendor.');
      return;
    }
    if (!quotationFile) {
      toast.error('Please attach a requirement file.');
      return;
    }
    const project = activeProjects.find((p) => p.id === selectedQuotationProjectId);
    if (!project) {
      toast.error('Please select a project for quotation request.');
      return;
    }

    setSendingQuotation(true);
    const toastId = toast.loading('Sending quotation requests...');
    try {
      // Mirrors the OfflineInvoiceModal pattern: the text message always goes
      // out so the vendor at least receives the inquiry. The file attachment
      // is best-effort — when storage isn't configured the chat-media endpoint
      // throws "Storage is not configured", but we don't want that to take the
      // whole quotation request down with it. Track per-vendor failure and
      // surface a single warning at the end instead.
      const selectedVendors = vendorResults.filter((r) => selectedVendorIds.includes(r.userId));
      let textSentCount = 0;
      let attachmentFailedCount = 0;

      await Promise.all(selectedVendors.map(async (vendor) => {
        const conv = await api.post<{ id: string }>('/conversations', {
          projectId: project.id,
          otherUserId: vendor.userId,
        });
        await api.post(`/conversations/${conv.id}/messages`, {
          type: 'text',
          content: getQuotationTemplate(project),
        });
        textSentCount += 1;

        try {
          const media = await api.post<{ uploadUrl: string; key: string }>(`/conversations/${conv.id}/media`, {
            contentType: quotationFile.type || 'application/octet-stream',
          });
          const putResp = await fetch(media.uploadUrl, {
            method: 'PUT',
            body: quotationFile,
            headers: { 'Content-Type': quotationFile.type || 'application/octet-stream' },
          });
          if (!putResp.ok) throw new Error(`Upload failed (${putResp.status})`);
          await api.post(`/conversations/${conv.id}/messages`, {
            type: 'file',
            mediaKey: media.key,
            content: `Requirement file: ${quotationFile.name}`,
          });
        } catch {
          attachmentFailedCount += 1;
          // Let the vendor know a file was meant to be attached. The company
          // can re-share it from the chat thread once storage is back.
          await api.post(`/conversations/${conv.id}/messages`, {
            type: 'text',
            content: `Note: a requirement file ("${quotationFile.name}") was meant to be attached here, but the upload failed. The team will resend it shortly.`,
          }).catch(() => {});
        }
      }));

      const vendorWord = textSentCount === 1 ? 'vendor' : 'vendors';
      if (attachmentFailedCount === 0) {
        toast.success(`Quotation request sent to ${textSentCount} ${vendorWord}.`, { id: toastId });
      } else if (attachmentFailedCount === textSentCount) {
        toast.success(
          `Sent to ${textSentCount} ${vendorWord} without the attachment — file storage isn't configured. Resend the file from chat once it's available.`,
          { id: toastId, duration: 6000 },
        );
      } else {
        toast.success(
          `Sent to ${textSentCount} ${vendorWord}. Attachment failed for ${attachmentFailedCount} of them — resend from chat.`,
          { id: toastId, duration: 6000 },
        );
      }
      setSelectedVendorIds([]);
      setQuotationFile(null);
    } catch (err) {
      const msg = err instanceof ApiException ? err.payload.message : 'Failed to send quotation requests.';
      toast.error(msg, { id: toastId });
    } finally {
      setSendingQuotation(false);
    }
  };

  const isCompaniesTab = searchType === 'companies';
  const results = searchType === 'crew'
    ? (crewResults ?? [])
    : searchType === 'vendors'
      ? (vendorResults ?? [])
      : (companyResults ?? []);
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
                  <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
                    {isCompaniesTab ? 'Find Companies' : 'Find Crew & Vendors'}
                  </h1>
                  <p className="text-sm text-neutral-500 mt-1">
                    {isCompaniesTab
                      ? 'Discover production houses on Claapo by name'
                      : 'Search and hire the best talent for your productions'}
                  </p>
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
                {(['crew', 'vendors', 'companies'] as SearchType[]).map((type) => (
                  <button key={type} type="button" onClick={() => switchType(type)}
                    className={`rounded-full px-6 py-2 text-sm font-semibold transition-colors duration-200 capitalize ${searchType === type ? 'bg-white text-[#3678F1] shadow-sm' : 'text-[#2563EB] hover:text-[#1D4ED8]'}`}>
                    {type === 'crew' ? 'Crew' : type === 'vendors' ? 'Vendors' : 'Companies'}
                  </button>
                ))}
              </div>

              {/* Companies tab: simple name-only search bar (no filters per spec 8). */}
              {isCompaniesTab && (
                <div className="rounded-2xl bg-white shadow-sm border border-neutral-200/70 hover:border-[#3678F1] transition-colors duration-200 p-5 sm:p-6 mb-6">
                  <label className="block text-[11px] font-bold text-neutral-500 mb-2 uppercase tracking-widest">
                    Company Name
                  </label>
                  <div className="relative group max-w-xl">
                    <input
                      type="text"
                      value={query}
                      onChange={(e) => { setQuery(e.target.value); setPage(1); }}
                      placeholder="Search by company name"
                      className="w-full pl-10 pr-4 py-3 border border-neutral-200 rounded-xl text-sm bg-neutral-50 placeholder-neutral-400 focus:bg-white focus:outline-none focus:border-[#3678F1] focus:ring-2 focus:ring-[#3678F1]/20 transition-colors duration-200"
                    />
                    <FaMagnifyingGlass className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 text-sm group-focus-within:text-[#3678F1] transition-colors" />
                  </div>
                </div>
              )}

              {/* Horizontal filter bar — crew/vendors only */}
              {!isCompaniesTab && (
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

                  {/* Budget filters for crew only */}
                  {searchType === 'crew' && (
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
                  )}

                  {searchType === 'crew' && (
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
                  )}

                  {/* Row 2 - Start Date, End Date, Reset */}
                  {/* Start Date */}
                  <div>
                    <label className="block text-[11px] font-bold text-neutral-500 mb-2 uppercase tracking-widest">Start Date</label>
                    <DateInput value={startDate} onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
                      className="w-full px-4 py-3 border border-neutral-200 rounded-xl text-sm bg-neutral-50 focus:bg-white focus:outline-none focus:border-[#3678F1] focus:ring-2 focus:ring-[#3678F1]/20 transition-colors duration-200" />
                  </div>

                  {/* End Date */}
                  <div>
                    <label className="block text-[11px] font-bold text-neutral-500 mb-2 uppercase tracking-widest">End Date</label>
                    <DateInput value={endDate} min={startDate || undefined} onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
                      className="w-full px-4 py-3 border border-neutral-200 rounded-xl text-sm bg-neutral-50 focus:bg-white focus:outline-none focus:border-[#3678F1] focus:ring-2 focus:ring-[#3678F1]/20 transition-colors duration-200" />
                  </div>

                  {/* Reset button */}
                  <div className="flex items-end">
                    <button type="button" onClick={() => { setQuery(''); setLocation(''); setSkillFilter(''); setGenreFilter(''); setStartDate(''); setEndDate(''); setBudgetMin(''); setBudgetMax(''); setSelectedVendorIds([]); setQuotationFile(null); setPage(1); }}
                      className="w-full h-[46px] rounded-xl border border-neutral-200 text-sm font-semibold text-neutral-600 hover:text-[#3678F1] hover:border-[#3678F1] transition-colors duration-200 whitespace-nowrap">
                      Reset
                    </button>
                  </div>
                </div>
              </div>
              )}

              {searchType === 'vendors' && (
                <div className="rounded-2xl bg-white shadow-sm border border-neutral-200/70 p-4 mb-6 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <select
                      value={selectedQuotationProjectId}
                      onChange={(e) => setSelectedQuotationProjectId(e.target.value)}
                      disabled={projectsLoading || activeProjects.length === 0}
                      className="h-10 min-w-[240px] px-3 rounded-xl border border-neutral-200 text-sm bg-white text-neutral-700 focus:outline-none focus:border-[#3678F1] disabled:opacity-50"
                    >
                      <option value="">
                        {projectsLoading ? 'Loading projects...' : 'Select project'}
                      </option>
                      {activeProjects.map((p) => (
                        <option key={p.id} value={p.id}>{p.title}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => quotationFileInputRef.current?.click()}
                      className="h-10 px-4 rounded-xl border border-neutral-200 text-sm font-semibold text-neutral-700 hover:border-[#3678F1] hover:text-[#3678F1] transition-colors"
                    >
                      {quotationFile ? `Attached: ${quotationFile.name}` : 'Attach File'}
                    </button>
                    <input
                      ref={quotationFileInputRef}
                      type="file"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0] ?? null;
                        setQuotationFile(file);
                        e.target.value = '';
                      }}
                    />
                    <button
                      type="button"
                      onClick={sendQuotationToSelectedVendors}
                      disabled={sendingQuotation || selectedVendorIds.length === 0 || !selectedQuotationProjectId}
                      className="h-10 px-5 rounded-xl bg-gradient-to-br from-[#3678F1] to-[#2563EB] text-white text-sm font-semibold hover:from-[#2563EB] hover:to-[#1D4ED8] disabled:opacity-50 transition-colors"
                    >
                      {sendingQuotation ? 'Sending...' : 'Get Quotation'}
                    </button>
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="inline-flex items-center gap-2 text-sm font-semibold text-neutral-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isAllVendorsMarked}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedVendorIds(vendorResults.map((v) => v.userId));
                          else setSelectedVendorIds([]);
                        }}
                        className="w-4 h-4 accent-[#3678F1]"
                      />
                      Mark All
                    </label>
                    <span className="text-xs text-neutral-500">
                      {selectedVendorIds.length} selected
                    </span>
                  </div>
                </div>
              )}

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
                          <Avatar src={r.avatarUrl ?? undefined} name={r.displayName} size="lg" />
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
                        {/* Top row: Mark checkbox + GST badge (kept here so the header below
                            has a single status pill on the right, matching the crew card height). */}
                        <div className="flex items-center justify-between mb-3 min-h-[24px]">
                          <label className="inline-flex items-center gap-2 text-xs font-semibold text-neutral-600 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={selectedVendorIds.includes(r.userId)}
                              onChange={() => toggleVendorSelection(r.userId)}
                              className="w-4 h-4 accent-[#3678F1]"
                            />
                            Mark
                          </label>
                          {r.isGstVerified && (
                            <span className="text-[9.5px] font-bold px-2 py-0.5 rounded-full bg-[#E8F0FE] text-[#2563EB]">
                              GST Verified
                            </span>
                          )}
                        </div>

                        {/* Header: avatar + availability pill (mirrors the crew layout). */}
                        <div className="flex items-start justify-between gap-3 mb-4">
                          <Avatar src={r.avatarUrl ?? undefined} name={r.companyName} size="lg" />
                          <span className="inline-flex items-center gap-1.5 h-6 px-2.5 rounded-full text-[10.5px] font-bold tracking-wide bg-[#DCFCE7] text-[#15803D] shrink-0">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E]" />
                            Available
                          </span>
                        </div>

                        {/* Name + type */}
                        <h3 className="text-[15px] font-bold text-neutral-900 truncate">{r.companyName}</h3>
                        <p className="text-[10.5px] uppercase tracking-widest text-[#3678F1] font-semibold mt-1 mb-4 truncate">
                          {r.vendorServiceCategory?.trim()
                            ? r.vendorServiceCategory
                            : r.vendorType === 'all'
                              ? 'All types'
                              : (r.vendorType?.replace(/_/g, ' ') ?? 'Vendor')}
                        </p>

                        {/* Meta row — always rendered (with a graceful fallback) so every
                            card in the grid has the same vertical rhythm and the CTA below
                            stays on the same baseline. */}
                        <div className="flex flex-col gap-2 pt-4 border-t border-neutral-100 mt-auto">
                          <span className="text-xs text-neutral-500 flex items-center gap-1.5">
                            <FaLocationDot className="text-neutral-300 text-[11px]" />
                            {r.locationCity || 'Location on request'}
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

              {/* Vertical result list — Companies (name-only directory) */}
              {!loading && searchType === 'companies' && (
                companyResults.length === 0 ? (
                  <div className="rounded-2xl bg-white border border-neutral-200/70 shadow-sm p-16 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-[#E8F0FE] flex items-center justify-center mx-auto mb-4">
                      <FaBuilding className="text-[#3678F1] text-xl" />
                    </div>
                    <p className="text-base font-semibold text-neutral-900 mb-1.5">No companies found</p>
                    <p className="text-sm text-neutral-500 max-w-xs mx-auto">
                      {query.trim() ? 'Try a different name' : 'Type a company name to start searching'}
                    </p>
                  </div>
                ) : (
                  <motion.div variants={containerVariants} initial="hidden" animate="visible" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {companyResults.map((r) => (
                      <motion.div
                        variants={itemVariants}
                        key={r.userId}
                        className="rounded-2xl bg-white shadow-sm border border-neutral-200/70 hover:border-[#3678F1] transition-colors duration-200 flex flex-col p-5"
                      >
                        <div className="flex items-start gap-3 mb-4">
                          <Avatar src={r.avatarUrl ?? undefined} name={r.name || '—'} size="lg" />
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border bg-[#DCFCE7] text-[#15803D] border-[#86EFAC]">
                            <FaBuilding className="w-2.5 h-2.5" />
                            Company
                          </span>
                        </div>
                        <h3 className="text-[15px] font-bold text-neutral-900 truncate">{r.name || 'Unnamed'}</h3>
                        {(r.locationCity || r.locationState) && (
                          <p className="text-xs text-neutral-500 flex items-center gap-1.5 mt-2">
                            <FaLocationDot className="text-neutral-300 text-[11px]" />
                            {[r.locationCity, r.locationState].filter(Boolean).join(', ')}
                          </p>
                        )}
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
