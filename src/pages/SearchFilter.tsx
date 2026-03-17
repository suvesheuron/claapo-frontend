import { Link, useSearchParams } from 'react-router-dom';
import { useEffect, useState, useCallback, useRef } from 'react';
import { FaTruck, FaMagnifyingGlass, FaChevronLeft, FaChevronRight, FaPlus, FaTriangleExclamation, FaLocationDot, FaMessage } from 'react-icons/fa6';
import AppFooter from '../components/AppFooter';
import Avatar from '../components/Avatar';
import BookingRequestModal from '../components/BookingRequestModal';
import DashboardHeader from '../components/DashboardHeader';
import DashboardSidebar from '../components/DashboardSidebar';
import { api, ApiException } from '../services/api';
import { formatRateRange } from '../utils/currency';
import { companyNavLinks } from '../navigation/dashboardNav';

type SearchType = 'crew' | 'vendors';

interface CrewResult {
  userId: string;
  displayName: string;
  skills: string[];
  locationCity?: string;
  locationState?: string;
  dailyRateMin?: number;
  dailyRateMax?: number;
  isAvailable: boolean;
  bio?: string;
}

interface VendorEquipmentItem {
  id: string;
  name: string;
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

const PAGE_SIZE = 15;

const CREW_SKILLS = ['Director', 'DOP', 'Camera Operator', 'Sound Engineer', 'Gaffer', 'Makeup Artist', 'Production Designer', 'Editor', 'VFX Artist', 'Line Producer'];
const VENDOR_TYPES = ['equipment', 'lighting', 'transport', 'catering'];

export default function SearchFilter() {
  const [searchParams] = useSearchParams();
  const [selectedUser, setSelectedUser] = useState<SelectedUser | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const initType = (searchParams.get('type') as SearchType) === 'vendors' ? 'vendors' : 'crew';
  const [searchType, setSearchType] = useState<SearchType>(initType);

  const [query,      setQuery]      = useState('');
  const [location,   setLocation]   = useState('');
  const [skillFilter, setSkillFilter] = useState('');
  const [page,       setPage]       = useState(1);

  const [crewResults,   setCrewResults]   = useState<CrewResult[]>([]);
  const [vendorResults, setVendorResults] = useState<VendorResult[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { document.title = 'Find Crew & Vendors – Claapo'; }, []);

  const doSearch = useCallback(async (q: string, loc: string, skill: string, pg: number, type: SearchType) => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string> = {
        page: String(pg),
        limit: String(PAGE_SIZE),
      };

      if (type === 'crew') {
        if (loc) params.city = loc;
        if (skill.trim()) params.skill = skill.trim();
        if (q.trim()) params.name = q.trim();
      } else {
        if (loc) params.city = loc;
        if (skill) params.type = skill;
        if (q) params.equipmentName = q;
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
  const triggerSearch = useCallback((q: string, loc: string, skill: string, pg: number, type: SearchType) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(q, loc, skill, pg, type), 300);
  }, [doSearch]);

  useEffect(() => { triggerSearch(query, location, skillFilter, page, searchType); }, [query, location, skillFilter, page, searchType, triggerSearch]);

  const handleSendRequest = (user: SelectedUser) => { setSelectedUser(user); setIsModalOpen(true); };

  const switchType = (type: SearchType) => { setSearchType(type); setPage(1); setQuery(''); setLocation(''); setSkillFilter(''); };

  const results = searchType === 'crew' ? (crewResults ?? []) : (vendorResults ?? []);
  const resultCount = Array.isArray(results) ? results.length : 0;

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-[#F3F4F6] w-full">
      <DashboardHeader />
      <div className="flex-1 flex min-h-0 overflow-hidden">
        <DashboardSidebar links={companyNavLinks} />
        <main className="flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden">
          <div className="flex-1 min-h-0 overflow-auto">
            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-6 xl:px-8 py-5">

              <div className="flex items-center justify-between gap-4 mb-4">
                <div>
                  <h1 className="text-xl font-bold text-neutral-900">Find Crew & Vendors</h1>
                  <p className="text-sm text-neutral-500 mt-0.5">Search and hire the best talent for your productions</p>
                </div>
                <Link to="/dashboard/projects/new" className="rounded-xl px-4 py-2.5 bg-[#3678F1] text-white text-sm font-semibold hover:bg-[#2563d4] inline-flex items-center gap-2 transition-colors shrink-0">
                  <FaPlus className="w-3 h-3" />
                  <span className="hidden sm:inline">Create Project</span>
                </Link>
              </div>

              {/* Crew / Vendor toggle */}
              <div className="flex items-center gap-1 mb-4 bg-white rounded-xl p-1 border border-neutral-200 w-fit">
                {(['crew', 'vendors'] as SearchType[]).map((type) => (
                  <button key={type} type="button" onClick={() => switchType(type)}
                    className={`rounded-lg px-5 py-2 text-sm font-semibold transition-colors capitalize ${searchType === type ? 'bg-[#3678F1] text-white shadow-sm' : 'text-neutral-600 hover:bg-[#F3F4F6]'}`}>
                    {type === 'crew' ? 'Crew' : 'Vendors'}
                  </button>
                ))}
              </div>

              {/* Horizontal filter bar */}
              <div className="rounded-2xl bg-white border border-neutral-200 p-4 mb-4">
                <div className="flex flex-wrap gap-3 items-end">
                  {/* Search input */}
                  <div className="flex-1 min-w-[160px]">
                    <label className="block text-[11px] font-semibold text-neutral-500 mb-1.5 uppercase tracking-wide">
                      {searchType === 'crew' ? 'Skill / Name' : 'Vendor Name'}
                    </label>
                    <div className="relative">
                      <input type="text" value={query} onChange={(e) => { setQuery(e.target.value); setPage(1); }}
                        placeholder={searchType === 'crew' ? 'e.g. Director, DOP…' : 'e.g. Camera House…'}
                        className="w-full pl-9 pr-3 py-2.5 border border-neutral-300 rounded-xl text-sm bg-[#F3F4F6] focus:bg-white focus:outline-none focus:border-[#3678F1] transition-all" />
                      <FaMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 text-xs pointer-events-none" />
                    </div>
                  </div>

                  {/* Location */}
                  <div className="flex-1 min-w-[140px]">
                    <label className="block text-[11px] font-semibold text-neutral-500 mb-1.5 uppercase tracking-wide">City</label>
                    <div className="relative">
                      <input type="text" value={location} onChange={(e) => { setLocation(e.target.value); setPage(1); }}
                        placeholder="e.g. Mumbai"
                        className="w-full pl-9 pr-3 py-2.5 border border-neutral-300 rounded-xl text-sm bg-[#F3F4F6] focus:bg-white focus:outline-none focus:border-[#3678F1] transition-all" />
                      <FaLocationDot className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 text-xs pointer-events-none" />
                    </div>
                  </div>

                  {/* Skill filter for crew */}
                  {searchType === 'crew' && (
                    <div className="flex-1 min-w-[140px]">
                      <label className="block text-[11px] font-semibold text-neutral-500 mb-1.5 uppercase tracking-wide">Role</label>
                      <select value={skillFilter} onChange={(e) => { setSkillFilter(e.target.value); setPage(1); }}
                        className="w-full px-3 py-2.5 border border-neutral-300 rounded-xl text-sm bg-[#F3F4F6] focus:bg-white focus:outline-none focus:border-[#3678F1] transition-all">
                        <option value="">All roles</option>
                        {CREW_SKILLS.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  )}

                  {/* Vendor type filter */}
                  {searchType === 'vendors' && (
                    <div className="flex-1 min-w-[140px]">
                      <label className="block text-[11px] font-semibold text-neutral-500 mb-1.5 uppercase tracking-wide">Type</label>
                      <select value={skillFilter} onChange={(e) => { setSkillFilter(e.target.value); setPage(1); }}
                        className="w-full px-3 py-2.5 border border-neutral-300 rounded-xl text-sm bg-[#F3F4F6] focus:bg-white focus:outline-none focus:border-[#3678F1] transition-all">
                        <option value="">All types</option>
                        {VENDOR_TYPES.map(t => <option key={t} value={t} className="capitalize">{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                      </select>
                    </div>
                  )}

                  <button type="button" onClick={() => { setQuery(''); setLocation(''); setSkillFilter(''); setPage(1); }}
                    className="px-4 py-2.5 rounded-xl border border-neutral-300 text-sm text-neutral-600 hover:bg-neutral-100 transition-colors whitespace-nowrap">
                    Reset
                  </button>
                </div>
              </div>

              {/* Results count */}
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-neutral-500">
                  {loading ? 'Searching…' : <><span className="font-semibold text-neutral-900">{resultCount}</span> result{resultCount !== 1 ? 's' : ''}</>}
                </p>
                {totalPages > 1 && (
                  <div className="flex items-center gap-2">
                    <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="w-8 h-8 rounded-lg border border-neutral-200 flex items-center justify-center text-neutral-600 hover:bg-neutral-100 disabled:opacity-40 transition-colors">
                      <FaChevronLeft className="text-xs" />
                    </button>
                    <span className="text-xs text-neutral-600 min-w-[70px] text-center">Page {page} / {totalPages}</span>
                    <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="w-8 h-8 rounded-lg border border-neutral-200 flex items-center justify-center text-neutral-600 hover:bg-neutral-100 disabled:opacity-40 transition-colors">
                      <FaChevronRight className="text-xs" />
                    </button>
                  </div>
                )}
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-center gap-3 rounded-2xl bg-red-50 border border-red-200 p-4 mb-4">
                  <FaTriangleExclamation className="text-red-500 shrink-0" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              {/* Loading skeleton — vertical list */}
              {loading && (
                <div className="space-y-3">
                  {[1,2,3,4,5].map((i) => (
                    <div key={i} className="rounded-2xl bg-white border border-neutral-200 p-4 animate-pulse flex gap-4">
                      <div className="w-14 h-14 rounded-xl bg-neutral-200 shrink-0" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-neutral-200 rounded w-1/3" />
                        <div className="h-3 bg-neutral-100 rounded w-1/2" />
                        <div className="h-3 bg-neutral-100 rounded w-2/3" />
                      </div>
                      <div className="w-24 h-9 bg-neutral-200 rounded-xl shrink-0 self-center" />
                    </div>
                  ))}
                </div>
              )}

              {/* Vertical result list — Crew */}
              {!loading && searchType === 'crew' && (
                crewResults.length === 0 ? (
                  <div className="rounded-2xl bg-white border border-neutral-200 p-12 text-center">
                    <FaMagnifyingGlass className="text-neutral-300 text-3xl mx-auto mb-3" />
                    <p className="text-sm font-semibold text-neutral-700 mb-1">No crew found</p>
                    <p className="text-xs text-neutral-400">Try adjusting your filters or search in a different city</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {crewResults.map((r) => (
                      <div key={r.userId} className="rounded-2xl bg-white border border-neutral-200 p-4 hover:shadow-md hover:border-neutral-300 transition-all flex items-center gap-4">
                        <Avatar name={r.displayName} size="lg" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                            <h3 className="text-sm font-bold text-neutral-900 truncate">{r.displayName}</h3>
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${r.isAvailable ? 'bg-[#DCFCE7] text-[#15803D]' : 'bg-[#F3F4F6] text-neutral-500'}`}>
                              {r.isAvailable ? 'Available' : 'Unavailable'}
                            </span>
                          </div>
                          <p className="text-xs text-neutral-500 mb-1 truncate">{r.skills?.join(' · ') || '—'}</p>
                          <div className="flex items-center gap-3 flex-wrap">
                            {r.locationCity && (
                              <span className="text-xs text-neutral-400 flex items-center gap-1">
                                <FaLocationDot className="text-[10px]" /> {r.locationCity}{r.locationState ? `, ${r.locationState}` : ''}
                              </span>
                            )}
                            <span className="text-sm font-bold text-neutral-900">{formatRateRange(r.dailyRateMin, r.dailyRateMax)}</span>
                          </div>
                          {r.bio && <p className="text-xs text-neutral-500 mt-1.5 line-clamp-1">{r.bio}</p>}
                        </div>
                        <div className="flex flex-col gap-2 shrink-0">
                          <Link to={`/dashboard/profile/${r.userId}`} className="rounded-xl px-3 py-2 border border-neutral-200 text-neutral-700 text-xs font-medium hover:bg-neutral-50 text-center transition-colors">
                            View profile
                          </Link>
                          <button type="button" onClick={() => handleSendRequest({ userId: r.userId, name: r.displayName, role: r.skills?.[0] ?? 'Crew', rate: formatRateRange(r.dailyRateMin, r.dailyRateMax) })}
                            className="rounded-xl px-3 py-2 bg-[#3678F1] text-white text-xs font-bold hover:bg-[#2563d4] text-center transition-colors">
                            Book
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              )}

              {/* Vertical result list — Vendors */}
              {!loading && searchType === 'vendors' && (
                vendorResults.length === 0 ? (
                  <div className="rounded-2xl bg-white border border-neutral-200 p-12 text-center">
                    <FaMagnifyingGlass className="text-neutral-300 text-3xl mx-auto mb-3" />
                    <p className="text-sm font-semibold text-neutral-700 mb-1">No vendors found</p>
                    <p className="text-xs text-neutral-400">Try adjusting your filters</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {vendorResults.map((r) => (
                      <div key={r.userId} className="rounded-2xl bg-white border border-neutral-200 p-4 hover:shadow-md hover:border-neutral-300 transition-all flex items-center gap-4">
                        <div className="w-14 h-14 rounded-xl bg-[#FEF9E6] flex items-center justify-center shrink-0">
                          <FaTruck className="text-[#F4C430] text-xl" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                            <h3 className="text-sm font-bold text-neutral-900 truncate">{r.companyName}</h3>
                            {r.isGstVerified && <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#DCFCE7] text-[#15803D] shrink-0">GST Verified</span>}
                          </div>
                          <p className="text-xs text-neutral-500">{r.vendorType === 'all' ? 'All types' : (r.vendorType?.replace(/_/g, ' ') ?? 'Vendor')}</p>
                          {r.locationCity && (
                            <span className="text-xs text-neutral-400 flex items-center gap-1 mt-1">
                              <FaLocationDot className="text-[10px]" /> {r.locationCity}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-col gap-2 shrink-0">
                          <Link to={`/dashboard/chat/${r.userId}`} className="rounded-xl px-3 py-2 border border-neutral-200 text-neutral-700 text-xs font-medium hover:bg-neutral-50 text-center transition-colors flex items-center gap-1.5">
                            <FaMessage className="w-3 h-3" /> Message
                          </Link>
                          <button type="button" onClick={() => handleSendRequest({ userId: r.userId, name: r.companyName, role: r.vendorType === 'all' ? 'All types' : (r.vendorType?.replace(/_/g, ' ') ?? 'Vendor'), rate: '—', isVendor: true, initialVendorEquipmentId: r.equipment?.length === 1 ? r.equipment[0].id : undefined })}
                            className="rounded-xl px-3 py-2 bg-[#3678F1] text-white text-xs font-bold hover:bg-[#2563d4] text-center transition-colors">
                            Book
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              )}

              {/* Pagination at bottom */}
              {!loading && totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-6">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="w-9 h-9 rounded-xl border border-neutral-200 flex items-center justify-center text-neutral-600 hover:bg-neutral-100 disabled:opacity-40 transition-colors">
                    <FaChevronLeft className="text-xs" />
                  </button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pg = page <= 3 ? i + 1 : page + i - 2;
                    if (pg < 1 || pg > totalPages) return null;
                    return (
                      <button key={pg} onClick={() => setPage(pg)} className={`w-9 h-9 rounded-xl text-sm font-semibold transition-colors ${pg === page ? 'bg-[#3678F1] text-white' : 'border border-neutral-200 text-neutral-700 hover:bg-neutral-100'}`}>{pg}</button>
                    );
                  })}
                  <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="w-9 h-9 rounded-xl border border-neutral-200 flex items-center justify-center text-neutral-600 hover:bg-neutral-100 disabled:opacity-40 transition-colors">
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
    </div>
  );
}
