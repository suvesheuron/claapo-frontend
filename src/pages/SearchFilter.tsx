import { Link, useSearchParams } from 'react-router-dom';
import { useEffect, useState, useCallback } from 'react';
import { FaTruck, FaMagnifyingGlass, FaChevronLeft, FaChevronRight, FaPlus, FaSliders, FaHouse, FaFolder, FaCalendar, FaUser, FaTriangleExclamation } from 'react-icons/fa6';
import AppFooter from '../components/AppFooter';
import Avatar from '../components/Avatar';
import BookingRequestModal from '../components/BookingRequestModal';
import DashboardHeader from '../components/DashboardHeader';
import DashboardSidebar from '../components/DashboardSidebar';
import { api, ApiException } from '../services/api';
import { formatRateRange } from '../utils/currency';

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

interface VendorResult {
  userId: string;
  companyName: string;
  vendorType: string;
  locationCity?: string;
  isGstVerified: boolean;
}

interface PaginatedResponse<T> {
  data: T[];
  meta: { page: number; limit: number; total: number };
}

interface SelectedUser {
  userId: string;
  name: string;
  role: string;
  rate: string;
}

const navLinks = [
  { icon: FaHouse,           label: 'Dashboard',    to: '/dashboard' },
  { icon: FaCalendar,        label: 'Availability', to: '/dashboard/company-availability' },
  { icon: FaFolder,          label: 'Projects',     to: '/dashboard/projects' },
  { icon: FaFolder,          label: 'Past Projects', to: '/dashboard/company-past-projects' },
  { icon: FaMagnifyingGlass, label: 'Search',       to: '/dashboard/search' },
  { icon: FaUser,            label: 'Profile',      to: '/dashboard/company-profile' },
];

const PAGE_SIZE = 12;

export default function SearchFilter() {
  const [searchParams] = useSearchParams();
  const [selectedUser, setSelectedUser] = useState<SelectedUser | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const initType = (searchParams.get('type') as SearchType) === 'vendors' ? 'vendors' : 'crew';
  const [searchType, setSearchType] = useState<SearchType>(initType);

  // Filter state
  const [query,      setQuery]      = useState('');
  const [location,   setLocation]   = useState('');
  const [page,       setPage]       = useState(1);

  // Results state
  const [crewResults,   setCrewResults]   = useState<CrewResult[]>([]);
  const [vendorResults, setVendorResults] = useState<VendorResult[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);

  useEffect(() => {
    document.title = 'Find Crew & Vendors – Claapo';
  }, []);

  const doSearch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams({
        page: String(page),
        limit: String(PAGE_SIZE),
        ...(query    ? { skill: query }    : {}),
        ...(location ? { city: location }  : {}),
      });

      if (searchType === 'crew') {
        const res = await api.get<PaginatedResponse<CrewResult>>(`/search/crew?${qs}`);
        setCrewResults(res.data);
        setTotalPages(Math.max(1, Math.ceil(res.meta.total / PAGE_SIZE)));
      } else {
        const res = await api.get<PaginatedResponse<VendorResult>>(`/search/vendors?${qs}`);
        setVendorResults(res.data);
        setTotalPages(Math.max(1, Math.ceil(res.meta.total / PAGE_SIZE)));
      }
    } catch (err) {
      const msg = err instanceof ApiException ? err.payload.message : 'Search failed. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [searchType, query, location, page]);

  // Run search whenever tab or page changes
  useEffect(() => { doSearch(); }, [doSearch]);

  const handleSendRequest = (user: SelectedUser) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-[#F3F4F6] w-full">
      <DashboardHeader />

      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Sidebar */}
        <DashboardSidebar links={navLinks} />

        <main className="flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden">
          <div className="flex-1 min-h-0 overflow-auto">
            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-6 xl:px-8 py-5">

              {/* Page title + Create Project */}
              <div className="flex items-center justify-between gap-4 mb-5">
                <div>
                  <h1 className="text-xl font-bold text-neutral-900">Find Crew & Vendors</h1>
                  <p className="text-sm text-neutral-500 mt-0.5">Search and hire the best talent for your productions</p>
                </div>
                <Link
                  to="/dashboard/projects/new"
                  className="rounded-xl px-4 py-2.5 bg-[#3678F1] text-white text-sm font-semibold hover:bg-[#2563d4] inline-flex items-center gap-2 transition-colors shrink-0"
                >
                  <FaPlus className="w-3 h-3" />
                  <span className="hidden sm:inline">Create Project</span>
                </Link>
              </div>

              {/* Crew / Vendor toggle */}
              <div className="flex items-center gap-1 mb-5 bg-white rounded-xl p-1 border border-neutral-200 w-fit">
                {(['crew', 'vendors'] as SearchType[]).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => { setSearchType(type); setPage(1); }}
                    className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors capitalize ${
                      searchType === type
                        ? 'bg-[#3678F1] text-white shadow-sm'
                        : 'text-neutral-600 hover:bg-[#F3F4F6]'
                    }`}
                  >
                    {type === 'crew' ? 'Crew' : 'Vendors'}
                  </button>
                ))}
              </div>

              <div className="flex flex-col lg:flex-row gap-5">
                {/* Filters sidebar */}
                <aside className={`lg:block rounded-2xl w-full lg:w-64 bg-white border border-neutral-200 p-5 h-fit shrink-0 ${filtersOpen ? 'block' : 'hidden lg:block'}`}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-neutral-900">Filters</h3>
                    <button type="button" className="text-xs text-[#3678F1] hover:underline">Reset</button>
                  </div>

                  <div className="space-y-4">
                    <div className="relative">
                      <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder={searchType === 'crew' ? 'Skill or name…' : 'Vendor name…'}
                        className="rounded-xl w-full px-4 pr-9 py-2.5 border border-neutral-300 bg-[#F3F4F6] text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-[#3678F1] focus:bg-white text-sm transition-all"
                      />
                      <FaMagnifyingGlass className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 text-xs pointer-events-none" />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-neutral-700 mb-2">City</label>
                      <input
                        type="text"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder="e.g., Mumbai"
                        className="rounded-xl w-full px-3 py-2.5 border border-neutral-300 bg-[#F3F4F6] text-neutral-800 text-sm focus:outline-none focus:border-[#3678F1] transition-all"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => { setPage(1); doSearch(); }}
                      disabled={loading}
                      className="rounded-xl w-full py-2.5 bg-[#3678F1] text-white text-sm font-semibold hover:bg-[#2563d4] transition-colors disabled:opacity-60"
                    >
                      {loading ? 'Searching…' : 'Apply Filters'}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setQuery(''); setLocation(''); setPage(1); }}
                      className="text-xs text-[#3678F1] hover:underline w-full text-center"
                    >
                      Reset
                    </button>
                  </div>
                </aside>

                {/* Results */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setFiltersOpen(!filtersOpen)}
                        className="lg:hidden rounded-xl px-3 py-2 border border-neutral-300 bg-white text-neutral-700 text-sm flex items-center gap-1.5"
                      >
                        <FaSliders className="w-3 h-3" /> Filters
                      </button>
                      <p className="text-sm text-neutral-500">
                        {loading ? 'Searching…' : (
                          <span className="font-semibold text-neutral-900">
                            {searchType === 'crew' ? crewResults.length : vendorResults.length}
                          </span>
                        )} results
                      </p>
                    </div>
                  </div>

                  {/* Error */}
                  {error && (
                    <div className="flex items-center gap-3 rounded-2xl bg-red-50 border border-red-200 p-4 mb-4">
                      <FaTriangleExclamation className="text-red-500 shrink-0" />
                      <p className="text-sm text-red-700">{error}</p>
                    </div>
                  )}

                  {/* Loading skeleton */}
                  {loading && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                      {[1,2,3,4,5,6].map((i) => (
                        <div key={i} className="rounded-2xl bg-white border border-neutral-200 p-5 animate-pulse">
                          <div className="flex gap-3 mb-4">
                            <div className="w-12 h-12 rounded-xl bg-neutral-200 shrink-0" />
                            <div className="flex-1 space-y-2">
                              <div className="h-3.5 bg-neutral-200 rounded w-3/4" />
                              <div className="h-3 bg-neutral-100 rounded w-1/2" />
                            </div>
                          </div>
                          <div className="h-3 bg-neutral-100 rounded w-full mb-2" />
                          <div className="h-3 bg-neutral-100 rounded w-5/6" />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Crew results */}
                  {!loading && searchType === 'crew' && (
                    crewResults.length === 0 ? (
                      <div className="rounded-2xl bg-white border border-neutral-200 p-12 text-center">
                        <FaMagnifyingGlass className="text-neutral-300 text-3xl mx-auto mb-3" />
                        <p className="text-sm font-semibold text-neutral-700 mb-1">No crew found</p>
                        <p className="text-xs text-neutral-400">Try adjusting your filters</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                        {crewResults.map((r) => (
                          <div key={r.userId} className="rounded-2xl bg-white border border-neutral-200 p-5 hover:shadow-md hover:border-neutral-300 transition-all flex flex-col">
                            <div className="flex items-start gap-3 mb-3">
                              <Avatar name={r.displayName} size="lg" />
                              <div className="min-w-0 flex-1">
                                <div className="flex items-start justify-between gap-1">
                                  <h3 className="text-sm font-bold text-neutral-900 truncate">{r.displayName}</h3>
                                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 bg-[#EEF4FF] text-[#3678F1]">Crew</span>
                                </div>
                                <p className="text-xs text-neutral-500 truncate">{r.skills?.join(', ') || '—'}</p>
                                <span className={`mt-1 inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full ${r.isAvailable ? 'bg-[#DCFCE7] text-[#15803D]' : 'bg-[#F3F4F6] text-neutral-500'}`}>
                                  {r.isAvailable ? 'Available' : 'Unavailable'}
                                </span>
                              </div>
                            </div>
                            {r.locationCity && (
                              <p className="text-xs text-neutral-500 mb-2">{r.locationCity}{r.locationState ? `, ${r.locationState}` : ''}</p>
                            )}
                            {r.bio && <p className="text-xs text-neutral-600 mb-3 line-clamp-2 leading-relaxed flex-1">{r.bio}</p>}
                            <p className="text-sm font-bold text-neutral-900 mb-3">{formatRateRange(r.dailyRateMin, r.dailyRateMax)}</p>
                            <div className="flex gap-2">
                              <Link to={`/dashboard/chat/${r.userId}`} className="rounded-xl flex-1 py-2 border border-neutral-200 text-neutral-700 text-xs font-medium hover:bg-neutral-50 text-center transition-colors">
                                Message
                              </Link>
                              <button
                                type="button"
                                onClick={() => handleSendRequest({ userId: r.userId, name: r.displayName, role: r.skills?.[0] ?? 'Crew', rate: formatRateRange(r.dailyRateMin, r.dailyRateMax) })}
                                className="rounded-xl flex-1 py-2 bg-[#F4C430] text-neutral-900 text-xs font-bold hover:bg-[#e6b820] text-center transition-colors"
                              >
                                Book
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )
                  )}

                  {/* Vendor results */}
                  {!loading && searchType === 'vendors' && (
                    vendorResults.length === 0 ? (
                      <div className="rounded-2xl bg-white border border-neutral-200 p-12 text-center">
                        <FaMagnifyingGlass className="text-neutral-300 text-3xl mx-auto mb-3" />
                        <p className="text-sm font-semibold text-neutral-700 mb-1">No vendors found</p>
                        <p className="text-xs text-neutral-400">Try adjusting your filters</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                        {vendorResults.map((r) => (
                          <div key={r.userId} className="rounded-2xl bg-white border border-neutral-200 p-5 hover:shadow-md hover:border-neutral-300 transition-all flex flex-col">
                            <div className="flex items-start gap-3 mb-3">
                              <div className="w-12 h-12 rounded-xl bg-[#FEF9E6] flex items-center justify-center shrink-0">
                                <FaTruck className="text-[#F4C430] text-lg" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-start justify-between gap-1">
                                  <h3 className="text-sm font-bold text-neutral-900 truncate">{r.companyName}</h3>
                                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 bg-[#FEF9E6] text-[#92400E]">Vendor</span>
                                </div>
                                <p className="text-xs text-neutral-500 truncate capitalize">{r.vendorType?.replace(/_/g, ' ')}</p>
                                {r.isGstVerified && (
                                  <span className="mt-1 inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#DCFCE7] text-[#15803D]">GST Verified</span>
                                )}
                              </div>
                            </div>
                            {r.locationCity && <p className="text-xs text-neutral-500 mb-3">{r.locationCity}</p>}
                            <div className="flex gap-2 mt-auto">
                              <Link to={`/dashboard/chat/${r.userId}`} className="rounded-xl flex-1 py-2 border border-neutral-200 text-neutral-700 text-xs font-medium hover:bg-neutral-50 text-center transition-colors">
                                Message
                              </Link>
                              <button
                                type="button"
                                onClick={() => handleSendRequest({ userId: r.userId, name: r.companyName, role: r.vendorType?.replace(/_/g, ' ') ?? 'Vendor', rate: '—' })}
                                className="rounded-xl flex-1 py-2 bg-[#F4C430] text-neutral-900 text-xs font-bold hover:bg-[#e6b820] text-center transition-colors"
                              >
                                Book
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )
                  )}

                  {/* Pagination */}
                  {!loading && totalPages > 1 && (
                    <div className="flex items-center justify-center mt-8 gap-1.5">
                      <button type="button" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="rounded-xl w-9 h-9 border border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50 flex items-center justify-center transition-colors disabled:opacity-40">
                        <FaChevronLeft className="text-xs" />
                      </button>
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + 1).map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setPage(p)}
                          className={`rounded-xl w-9 h-9 text-sm font-medium transition-colors ${p === page ? 'bg-[#3678F1] text-white' : 'border border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50'}`}
                        >
                          {p}
                        </button>
                      ))}
                      <button type="button" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="rounded-xl w-9 h-9 border border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50 flex items-center justify-center transition-colors disabled:opacity-40">
                        <FaChevronRight className="text-xs" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <AppFooter />
        </main>
      </div>

      {selectedUser && (
        <BookingRequestModal
          isOpen={isModalOpen}
          onClose={() => { setIsModalOpen(false); setSelectedUser(null); }}
          userName={selectedUser.name}
          userRole={selectedUser.role}
          userRate={selectedUser.rate}
          targetUserId={selectedUser.userId}
          onSuccess={() => { setIsModalOpen(false); setSelectedUser(null); }}
        />
      )}
    </div>
  );
}
