import { Link } from 'react-router-dom';
import { useEffect } from 'react';
import { FaVideo, FaTruck, FaMagnifyingGlass, FaStar, FaRegStar, FaChevronLeft, FaChevronRight } from 'react-icons/fa6';
import AppFooter from '../components/AppFooter';

const results = [
  { name: 'Rajesh Kumar', role: 'Cinematographer', location: 'Mumbai', exp: '8 years exp', rating: 4.9, fullStars: 5, bio: 'Specialized in commercial shoots and documentaries. RED camera certified.', price: '₹25,000/day', seed: '456' },
  { name: 'Priya Sharma', role: 'Sound Engineer', location: 'Delhi', exp: '5 years exp', rating: 4.6, fullStars: 4, bio: 'Expert in live recording and post-production mixing. Pro Tools certified.', price: '₹15,000/day', seed: '789' },
  { name: 'CineGear Rentals', role: 'Equipment Vendor', location: 'Bangalore', exp: 'Vendor', rating: 4.8, fullStars: 5, bio: 'Complete camera and lighting packages. ARRI, RED, Sony equipment available.', price: 'From ₹8,000/day', vendor: true },
  { name: 'Arjun Menon', role: 'Director', location: 'Chennai', exp: '12 years exp', rating: 4.7, fullStars: 4, bio: 'Award-winning director specializing in brand films and short documentaries.', price: '₹45,000/day', seed: '101' },
  { name: 'Kavya Patel', role: 'Editor', location: 'Hyderabad', exp: '6 years exp', rating: 4.9, fullStars: 5, bio: 'Expert in Avid, Premiere Pro, and DaVinci Resolve. Quick turnaround specialist.', price: '₹18,000/day', seed: '202' },
  { name: 'Mumbai Locations', role: 'Location Services', location: 'Mumbai', exp: 'Vendor', rating: 4.5, fullStars: 4, bio: 'Premium shooting locations across Mumbai. Permits and logistics included.', price: 'From ₹12,000/day', vendor: true },
];


function Stars({ fullStars }: { fullStars: number }) {
  return (
    <div className="flex text-neutral-500 gap-0.5">
      {[1, 2, 3, 4, 5].map((i) =>
        i <= fullStars ? <FaStar key={i} className="text-xs" /> : <FaRegStar key={i} className="text-xs" />
      )}
    </div>
  );
}

export default function SearchFilter() {
  useEffect(() => {
    document.title = 'Find Crew & Vendors – CrewCall';
  }, []);

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col min-w-0 w-full max-w-full overflow-x-hidden">
      <header className="border-b border-neutral-200 bg-white shrink-0 overflow-hidden">
        <div className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 md:px-8 lg:px-16 py-4 sm:py-6 flex items-center justify-between gap-2 min-w-0 overflow-hidden">
          <Link to="/" className="flex items-center gap-2 sm:gap-3 min-w-0 shrink-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-neutral-800 flex items-center justify-center shrink-0">
              <FaVideo className="text-white text-lg sm:text-xl" />
            </div>
            <span className="text-lg sm:text-xl md:text-2xl text-neutral-900 font-semibold truncate">CrewCall</span>
          </Link>
          <div className="flex items-center gap-2 sm:gap-4 md:gap-6 shrink-0">
            <Link to="/dashboard" className="text-neutral-600 hover:text-neutral-900 text-xs sm:text-sm hidden sm:inline">Dashboard</Link>
            <Link to="/dashboard/projects" className="text-neutral-600 hover:text-neutral-900 text-xs sm:text-sm hidden sm:inline">Projects</Link>
            <img
              src="https://api.dicebear.com/7.x/notionists/svg?scale=200&seed=123"
              alt="Profile"
              className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover shrink-0"
            />
          </div>
        </div>
      </header>

      <div className="flex-1 px-4 sm:px-6 md:px-8 lg:px-16 py-4 sm:py-6 md:py-8 min-w-0 w-full max-w-full overflow-x-hidden">
        <div className="w-full max-w-[1920px] mx-auto min-w-0 max-w-full">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-5 sm:mb-6 md:mb-8">
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl text-neutral-900 mb-1 sm:mb-2 font-bold break-words">Find Crew & Vendors</h1>
              <p className="text-sm sm:text-base md:text-lg text-neutral-600 break-words">Search and hire the best talent for your projects</p>
            </div>
            <Link to="/dashboard/projects/new" className="rounded-lg px-4 sm:px-5 md:px-6 py-2.5 sm:py-3 min-h-[44px] bg-neutral-900 text-white hover:bg-neutral-700 inline-flex items-center justify-center gap-2 shrink-0 text-sm sm:text-base w-full sm:w-auto">
              <span>Create Project</span>
            </Link>
          </div>

          <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 md:gap-8 min-w-0 flex-wrap lg:flex-nowrap">
            <aside className="rounded-lg w-full lg:w-80 lg:min-w-[280px] lg:max-w-[320px] bg-white border border-neutral-200 p-4 sm:p-4 md:p-6 h-fit shrink-0 order-2 lg:order-1 min-w-0">
              <h3 className="text-base sm:text-lg text-neutral-900 mb-3 sm:mb-4 font-bold">Filters</h3>
              <div className="space-y-6">
                <div className="relative min-w-0">
                  <input
                    type="text"
                    placeholder="Search by name or skill..."
                    className="rounded-lg w-full min-w-0 px-3 sm:px-4 py-2.5 sm:py-3 border border-neutral-300 bg-white text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-neutral-900 text-base"
                  />
                  <FaMagnifyingGlass className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
                </div>
                <div>
                  <label className="block text-neutral-900 text-sm mb-3 font-medium">Role/Category</label>
                  <select className="rounded-lg w-full px-4 py-3 min-h-[44px] border border-neutral-300 bg-white text-neutral-900 focus:outline-none focus:border-neutral-900">
                    <option>All Roles</option>
                    <option>Director</option>
                    <option>Cinematographer</option>
                    <option>Sound Engineer</option>
                    <option>Editor</option>
                    <option>Equipment Vendor</option>
                    <option>Location Services</option>
                  </select>
                </div>
                <div>
                  <label className="block text-neutral-900 text-sm mb-3 font-medium">Location</label>
                  <select className="rounded-lg w-full px-4 py-3 min-h-[44px] border border-neutral-300 bg-white text-neutral-900 focus:outline-none focus:border-neutral-900">
                    <option>All Locations</option>
                    <option>Mumbai</option>
                    <option>Delhi</option>
                    <option>Bangalore</option>
                    <option>Chennai</option>
                    <option>Hyderabad</option>
                    <option>Pune</option>
                  </select>
                </div>
                <div className="min-w-0">
                  <label className="block text-neutral-900 text-sm mb-2 sm:mb-3 font-medium">Availability</label>
                  <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
                    <input type="date" className="rounded-lg flex-1 min-w-0 px-3 py-2 border border-neutral-300 bg-white text-neutral-900 text-sm focus:outline-none focus:border-neutral-900 min-h-[40px]" />
                    <span className="text-neutral-500 text-xs sm:text-sm shrink-0">to</span>
                    <input type="date" className="rounded-lg flex-1 min-w-0 px-3 py-2 border border-neutral-300 bg-white text-neutral-900 text-sm focus:outline-none focus:border-neutral-900 min-h-[40px]" />
                  </div>
                </div>
                <div>
                  <label className="block text-neutral-900 text-sm mb-3 font-medium">Budget Range (per day)</label>
                  <select className="rounded-lg w-full px-4 py-3 min-h-[44px] border border-neutral-300 bg-white text-neutral-900 focus:outline-none focus:border-neutral-900">
                    <option>Any Budget</option>
                    <option>₹5,000 - ₹10,000</option>
                    <option>₹10,000 - ₹25,000</option>
                    <option>₹25,000 - ₹50,000</option>
                    <option>₹50,000+</option>
                  </select>
                </div>
                <div>
                  <label className="block text-neutral-900 text-sm mb-3 font-medium">Experience Level</label>
                  <div className="space-y-2">
                    {['Entry Level (0-2 years)', 'Mid Level (3-7 years)', 'Senior Level (8+ years)'].map((label) => (
                      <label key={label} className="flex items-center gap-2 text-neutral-700 cursor-pointer">
                        <input type="checkbox" className="w-4 h-4 border border-neutral-300 rounded" />
                        <span className="text-sm">{label}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <button type="button" className="rounded-lg w-full py-3 min-h-[44px] bg-neutral-900 text-white hover:bg-neutral-700 font-medium">
                  Apply Filters
                </button>
                <button type="button" className="rounded-lg w-full py-3 min-h-[44px] border border-neutral-300 text-neutral-900 hover:bg-neutral-100">
                  Clear All
                </button>
              </div>
            </aside>

            <div className="flex-1 min-w-0 order-1 lg:order-2 overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-3 sm:mb-4 md:mb-6">
                <p className="text-sm sm:text-base text-neutral-600">Showing {results.length} results</p>
                <div className="flex flex-wrap items-center gap-2 sm:gap-4 min-w-0">
                  <span className="text-xs sm:text-sm text-neutral-600 shrink-0">Sort by:</span>
                  <select className="rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 border border-neutral-300 bg-white text-neutral-900 text-xs sm:text-sm focus:outline-none focus:border-neutral-900 min-h-[36px] sm:min-h-[40px] w-full sm:w-auto min-w-0">
                    <option>Relevance</option>
                    <option>Rating</option>
                    <option>Experience</option>
                    <option>Price (Low to High)</option>
                    <option>Price (High to Low)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
                {results.map((r) => (
                  <div key={r.name} className="rounded-lg bg-white border border-neutral-200 p-3 sm:p-4 md:p-6 min-w-0 overflow-hidden">
                    <div className="flex items-start gap-3 sm:gap-4 mb-3 sm:mb-4 min-w-0">
                      {r.vendor ? (
                        <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-lg bg-neutral-300 flex items-center justify-center shrink-0">
                          <FaTruck className="text-neutral-600 text-lg sm:text-xl" />
                        </div>
                      ) : (
                        <img
                          src={`https://api.dicebear.com/7.x/notionists/svg?scale=200&seed=${r.seed}`}
                          alt={r.name}
                          className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full object-cover shrink-0"
                        />
                      )}
                      <div className="min-w-0 flex-1 overflow-hidden">
                        <h3 className="text-base sm:text-lg text-neutral-900 font-bold truncate">{r.name}</h3>
                        <p className="text-xs sm:text-sm text-neutral-600 truncate">{r.role}</p>
                        <div className="flex items-center gap-2 mb-2">
                          <Stars fullStars={r.fullStars} />
                          <span className="text-xs text-neutral-600">({r.rating})</span>
                        </div>
                        <p className="text-sm text-neutral-600">{r.location} • {r.exp}</p>
                      </div>
                    </div>
                    <p className="text-xs sm:text-sm text-neutral-700 mb-3 sm:mb-4 line-clamp-2 break-words">{r.bio}</p>
                    <p className="text-base sm:text-lg text-neutral-900 font-bold mb-3 sm:mb-4">{r.price}</p>
                    <div className="flex gap-2 flex-wrap">
                      <button type="button" className="rounded-lg flex-1 min-w-[100px] py-2.5 sm:py-2 min-h-[40px] border border-neutral-300 text-neutral-900 text-sm hover:bg-neutral-100">
                        View Profile
                      </button>
                      <button type="button" className="rounded-lg flex-1 min-w-[100px] py-2.5 sm:py-2 min-h-[40px] bg-neutral-900 text-white text-sm hover:bg-neutral-700">
                        Send Request
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap items-center justify-center mt-6 sm:mt-8 lg:mt-12 gap-2">
<button type="button" className="rounded-lg px-3 py-2 min-h-[40px] min-w-[40px] border border-neutral-300 text-neutral-900 hover:bg-neutral-100 inline-flex items-center justify-center">
                <FaChevronLeft />
              </button>
              <button type="button" className="rounded-lg px-4 py-2 min-h-[40px] bg-neutral-900 text-white">1</button>
              <button type="button" className="rounded-lg px-4 py-2 min-h-[40px] border border-neutral-300 text-neutral-900 hover:bg-neutral-100">2</button>
              <button type="button" className="rounded-lg px-4 py-2 min-h-[40px] border border-neutral-300 text-neutral-900 hover:bg-neutral-100">3</button>
              <button type="button" className="rounded-lg px-3 py-2 min-h-[40px] min-w-[40px] border border-neutral-300 text-neutral-900 hover:bg-neutral-100 inline-flex items-center justify-center">
                  <FaChevronRight />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <AppFooter />
    </div>
  );
}
