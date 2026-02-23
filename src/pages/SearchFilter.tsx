import { Link, useSearchParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { FaTruck, FaMagnifyingGlass, FaStar, FaRegStar, FaChevronLeft, FaChevronRight, FaPlus, FaSliders, FaHouse, FaFolder, FaCalendar, FaUser } from 'react-icons/fa6';
import AppFooter from '../components/AppFooter';
import Avatar from '../components/Avatar';
import BookingRequestModal from '../components/BookingRequestModal';
import DashboardHeader from '../components/DashboardHeader';
import DashboardSidebar from '../components/DashboardSidebar';

type SearchType = 'all' | 'crew' | 'vendors';

const allResults = [
  { id: 1, name: 'Rajesh Kumar', role: 'Cinematographer', location: 'Mumbai', exp: '8 yrs', rating: 4.9, fullStars: 5, bio: 'Specialized in commercial shoots and documentaries. RED camera certified.', price: '₹25,000/day', type: 'crew' as const },
  { id: 2, name: 'Priya Sharma', role: 'Sound Engineer', location: 'Delhi', exp: '5 yrs', rating: 4.6, fullStars: 4, bio: 'Expert in live recording and post-production mixing. Pro Tools certified.', price: '₹15,000/day', type: 'crew' as const },
  { id: 3, name: 'CineGear Rentals', role: 'Equipment Vendor', location: 'Bangalore', exp: 'Vendor', rating: 4.8, fullStars: 5, bio: 'Complete camera and lighting packages. ARRI, RED, Sony equipment available.', price: 'From ₹8,000/day', type: 'vendors' as const },
  { id: 4, name: 'Arjun Menon', role: 'Director', location: 'Chennai', exp: '12 yrs', rating: 4.7, fullStars: 4, bio: 'Award-winning director specializing in brand films and short documentaries.', price: '₹45,000/day', type: 'crew' as const },
  { id: 5, name: 'Kavya Patel', role: 'Editor', location: 'Hyderabad', exp: '6 yrs', rating: 4.9, fullStars: 5, bio: 'Expert in Avid, Premiere Pro, and DaVinci Resolve. Quick turnaround specialist.', price: '₹18,000/day', type: 'crew' as const },
  { id: 6, name: 'Mumbai Locations', role: 'Location Services', location: 'Mumbai', exp: 'Vendor', rating: 4.5, fullStars: 4, bio: 'Premium shooting locations across Mumbai. Permits and logistics included.', price: 'From ₹12,000/day', type: 'vendors' as const },
];

function Stars({ fullStars }: { fullStars: number }) {
  return (
    <div className="flex text-[#F4C430] gap-0.5">
      {[1, 2, 3, 4, 5].map((i) =>
        i <= fullStars
          ? <FaStar key={i} className="text-[11px]" />
          : <FaRegStar key={i} className="text-[11px] text-neutral-300" />
      )}
    </div>
  );
}

const navLinks = [
  { icon: FaHouse,           label: 'Dashboard',    to: '/dashboard' },
  { icon: FaCalendar,        label: 'Availability', to: '/dashboard/company-availability' },
  { icon: FaFolder,          label: 'Projects',     to: '/dashboard/projects' },
  { icon: FaFolder,          label: 'Past Projects', to: '/dashboard/company-past-projects' },
  { icon: FaMagnifyingGlass, label: 'Search',       to: '/dashboard/search' },
  { icon: FaUser,            label: 'Profile',      to: '/dashboard/company-profile' },
];

export default function SearchFilter() {
  const [searchParams] = useSearchParams();
  const [selectedUser, setSelectedUser] = useState<{ name: string; role: string; price: string } | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const initType = (searchParams.get('type') as SearchType) ?? 'all';
  const [searchType, setSearchType] = useState<SearchType>(initType);

  useEffect(() => {
    document.title = 'Find Crew & Vendors – CrewCall';
  }, []);

  const results = allResults.filter((r) => searchType === 'all' || r.type === searchType);

  const handleSendRequest = (user: { name: string; role: string; price: string }) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const handleSubmitRequest = (dates: { start: string; end: string }, _message: string) => {
    alert(`Booking request sent to ${selectedUser?.name} for ${dates.start} to ${dates.end}`);
    setIsModalOpen(false);
    setSelectedUser(null);
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
                {(['all', 'crew', 'vendors'] as SearchType[]).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setSearchType(type)}
                    className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors capitalize ${
                      searchType === type
                        ? 'bg-[#3678F1] text-white shadow-sm'
                        : 'text-neutral-600 hover:bg-[#F3F4F6]'
                    }`}
                  >
                    {type === 'all' ? 'All' : type === 'crew' ? 'Crew' : 'Vendors'}
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
                        placeholder="Search by name or skill..."
                        className="rounded-xl w-full px-4 pr-9 py-2.5 border border-neutral-300 bg-[#F3F4F6] text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-[#3678F1] focus:bg-white text-sm transition-all"
                      />
                      <FaMagnifyingGlass className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 text-xs pointer-events-none" />
                    </div>

                    {searchType !== 'vendors' && (
                      <div>
                        <label className="block text-xs font-semibold text-neutral-700 mb-2">Role</label>
                        <select className="rounded-xl w-full px-3 py-2.5 border border-neutral-300 bg-[#F3F4F6] text-neutral-800 text-sm focus:outline-none focus:border-[#3678F1] transition-all">
                          <option>All Roles</option>
                          <option>Director</option>
                          <option>Cinematographer</option>
                          <option>Sound Engineer</option>
                          <option>Editor</option>
                        </select>
                      </div>
                    )}

                    {searchType !== 'crew' && (
                      <div>
                        <label className="block text-xs font-semibold text-neutral-700 mb-2">Equipment Type</label>
                        <select className="rounded-xl w-full px-3 py-2.5 border border-neutral-300 bg-[#F3F4F6] text-neutral-800 text-sm focus:outline-none focus:border-[#3678F1] transition-all">
                          <option>All Equipment</option>
                          <option>Camera Packages</option>
                          <option>Lighting</option>
                          <option>Location Services</option>
                          <option>Transport</option>
                        </select>
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-semibold text-neutral-700 mb-2">Location</label>
                      <select className="rounded-xl w-full px-3 py-2.5 border border-neutral-300 bg-[#F3F4F6] text-neutral-800 text-sm focus:outline-none focus:border-[#3678F1] transition-all">
                        <option>All Locations</option>
                        <option>Mumbai</option>
                        <option>Delhi</option>
                        <option>Bangalore</option>
                        <option>Chennai</option>
                        <option>Hyderabad</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-neutral-700 mb-2">Availability</label>
                      <div className="flex gap-2 items-center">
                        <input type="date" className="rounded-xl flex-1 px-3 py-2 border border-neutral-300 bg-[#F3F4F6] text-neutral-800 text-xs focus:outline-none focus:border-[#3678F1] transition-all" />
                        <span className="text-neutral-400 text-xs shrink-0">→</span>
                        <input type="date" className="rounded-xl flex-1 px-3 py-2 border border-neutral-300 bg-[#F3F4F6] text-neutral-800 text-xs focus:outline-none focus:border-[#3678F1] transition-all" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-neutral-700 mb-2">Budget (per day)</label>
                      <select className="rounded-xl w-full px-3 py-2.5 border border-neutral-300 bg-[#F3F4F6] text-neutral-800 text-sm focus:outline-none focus:border-[#3678F1] transition-all">
                        <option>Any Budget</option>
                        <option>₹5,000–₹10,000</option>
                        <option>₹10,000–₹25,000</option>
                        <option>₹25,000–₹50,000</option>
                        <option>₹50,000+</option>
                      </select>
                    </div>

                    {searchType !== 'vendors' && (
                      <div>
                        <label className="block text-xs font-semibold text-neutral-700 mb-2">Experience</label>
                        <div className="space-y-1.5">
                          {['Entry (0–2 yrs)', 'Mid (3–7 yrs)', 'Senior (8+ yrs)'].map((label) => (
                            <label key={label} className="flex items-center gap-2 cursor-pointer">
                              <input type="checkbox" className="w-3.5 h-3.5 rounded border-neutral-300 accent-[#3678F1]" />
                              <span className="text-xs text-neutral-600">{label}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}

                    <button type="button" className="rounded-xl w-full py-2.5 bg-[#3678F1] text-white text-sm font-semibold hover:bg-[#2563d4] transition-colors">
                      Apply Filters
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
                        <span className="font-semibold text-neutral-900">{results.length}</span> results
                        {searchType !== 'all' && (
                          <span className="ml-1 text-neutral-400">in {searchType}</span>
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-neutral-500 shrink-0">Sort by</span>
                      <select className="rounded-xl px-3 py-2 border border-neutral-300 bg-white text-neutral-800 text-xs focus:outline-none focus:border-[#3678F1] transition-all">
                        <option>Relevance</option>
                        <option>Rating</option>
                        <option>Experience</option>
                        <option>Price (Low to High)</option>
                        <option>Price (High to Low)</option>
                      </select>
                    </div>
                  </div>

                  {results.length === 0 ? (
                    <div className="rounded-2xl bg-white border border-neutral-200 p-12 text-center">
                      <FaMagnifyingGlass className="text-neutral-300 text-3xl mx-auto mb-3" />
                      <p className="text-sm font-semibold text-neutral-700 mb-1">No results found</p>
                      <p className="text-xs text-neutral-400">Try adjusting your filters or search terms</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                      {results.map((r) => (
                        <div
                          key={r.id}
                          className="rounded-2xl bg-white border border-neutral-200 p-5 hover:shadow-md hover:border-neutral-300 transition-all flex flex-col"
                        >
                          <div className="flex items-start gap-3 mb-3">
                            {r.type === 'vendors' ? (
                              <div className="w-12 h-12 rounded-xl bg-[#FEF9E6] flex items-center justify-center shrink-0">
                                <FaTruck className="text-[#F4C430] text-lg" />
                              </div>
                            ) : (
                              <Avatar name={r.name} size="lg" />
                            )}
                            <div className="min-w-0 flex-1">
                              <div className="flex items-start justify-between gap-1">
                                <h3 className="text-sm font-bold text-neutral-900 truncate">{r.name}</h3>
                                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${
                                  r.type === 'crew'
                                    ? 'bg-[#EEF4FF] text-[#3678F1]'
                                    : 'bg-[#FEF9E6] text-[#92400E]'
                                }`}>
                                  {r.type === 'crew' ? 'Crew' : 'Vendor'}
                                </span>
                              </div>
                              <p className="text-xs text-neutral-500 truncate">{r.role}</p>
                              <div className="flex items-center gap-1.5 mt-1">
                                <Stars fullStars={r.fullStars} />
                                <span className="text-xs text-neutral-500">{r.rating}</span>
                              </div>
                            </div>
                          </div>

                          <p className="text-xs text-neutral-500 mb-2">{r.location} · {r.exp}</p>
                          <p className="text-xs text-neutral-600 mb-3 line-clamp-2 leading-relaxed flex-1">{r.bio}</p>

                          <p className="text-sm font-bold text-neutral-900 mb-3">{r.price}</p>

                          <div className="flex gap-2">
                            <Link
                              to={`/dashboard/chat/${r.name.toLowerCase().replace(/\s+/g, '-')}`}
                              className="rounded-xl flex-1 py-2 border border-neutral-200 text-neutral-700 text-xs font-medium hover:bg-neutral-50 text-center transition-colors"
                            >
                              View Profile
                            </Link>
                            <button
                              type="button"
                              onClick={() => handleSendRequest({ name: r.name, role: r.role, price: r.price })}
                              className="rounded-xl flex-1 py-2 bg-[#F4C430] text-neutral-900 text-xs font-bold hover:bg-[#e6b820] text-center transition-colors"
                            >
                              Send Request
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Pagination */}
                  {results.length > 0 && (
                    <div className="flex items-center justify-center mt-8 gap-1.5">
                      <button type="button" className="rounded-xl w-9 h-9 border border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50 flex items-center justify-center transition-colors">
                        <FaChevronLeft className="text-xs" />
                      </button>
                      {[1, 2, 3].map((p) => (
                        <button
                          key={p}
                          type="button"
                          className={`rounded-xl w-9 h-9 text-sm font-medium transition-colors ${
                            p === 1 ? 'bg-[#3678F1] text-white' : 'border border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50'
                          }`}
                        >
                          {p}
                        </button>
                      ))}
                      <button type="button" className="rounded-xl w-9 h-9 border border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50 flex items-center justify-center transition-colors">
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
          userRate={selectedUser.price}
          onSubmit={handleSubmitRequest}
        />
      )}
    </div>
  );
}
