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
    <div className="min-h-screen bg-neutral-50 flex flex-col">
      <header className="border-b border-neutral-200 bg-white">
        <div className="max-w-[1920px] mx-auto px-4 sm:px-8 lg:px-16 py-6 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-neutral-800 flex items-center justify-center">
              <FaVideo className="text-white text-xl" />
            </div>
            <span className="text-xl sm:text-2xl text-neutral-900 font-semibold">CrewCall</span>
          </Link>
          <div className="flex items-center gap-4 sm:gap-6">
            <Link to="/dashboard" className="text-neutral-600 hover:text-neutral-900 text-sm hidden sm:inline">Dashboard</Link>
            <Link to="/dashboard/projects" className="text-neutral-600 hover:text-neutral-900 text-sm hidden sm:inline">Projects</Link>
            <img
              src="https://api.dicebear.com/7.x/notionists/svg?scale=200&seed=123"
              alt="Profile"
              className="w-10 h-10 rounded-full object-cover"
            />
          </div>
        </div>
      </header>

      <div className="flex-1 px-4 sm:px-8 lg:px-16 py-6 sm:py-8">
        <div className="max-w-[1920px] mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
            <div>
              <h1 className="text-3xl sm:text-4xl text-neutral-900 mb-2 font-bold">Find Crew & Vendors</h1>
              <p className="text-lg text-neutral-600">Search and hire the best talent for your projects</p>
            </div>
            <Link to="/dashboard/projects/new" className="px-6 py-3 bg-neutral-900 text-white hover:bg-neutral-800 inline-flex items-center justify-center gap-2 shrink-0">
              <span>Create Project</span>
            </Link>
          </div>

          <div className="flex flex-col lg:flex-row gap-6 sm:gap-8">
            <aside className="w-full lg:w-80 bg-white border border-neutral-200 p-6 h-fit shrink-0">
              <h3 className="text-lg text-neutral-900 mb-4 font-bold">Filters</h3>
              <div className="space-y-6">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search by name or skill..."
                    className="w-full px-4 py-3 border border-neutral-300 bg-white text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-neutral-900"
                  />
                  <FaMagnifyingGlass className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
                </div>
                <div>
                  <label className="block text-neutral-900 text-sm mb-3 font-medium">Role/Category</label>
                  <select className="w-full px-4 py-3 border border-neutral-300 bg-white text-neutral-900 focus:outline-none focus:border-neutral-900">
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
                  <select className="w-full px-4 py-3 border border-neutral-300 bg-white text-neutral-900 focus:outline-none focus:border-neutral-900">
                    <option>All Locations</option>
                    <option>Mumbai</option>
                    <option>Delhi</option>
                    <option>Bangalore</option>
                    <option>Chennai</option>
                    <option>Hyderabad</option>
                    <option>Pune</option>
                  </select>
                </div>
                <div>
                  <label className="block text-neutral-900 text-sm mb-3 font-medium">Availability</label>
                  <div className="flex gap-2 items-center">
                    <input type="date" className="flex-1 px-3 py-2 border border-neutral-300 bg-white text-neutral-900 text-sm focus:outline-none focus:border-neutral-900" />
                    <span className="text-neutral-500 text-sm">to</span>
                    <input type="date" className="flex-1 px-3 py-2 border border-neutral-300 bg-white text-neutral-900 text-sm focus:outline-none focus:border-neutral-900" />
                  </div>
                </div>
                <div>
                  <label className="block text-neutral-900 text-sm mb-3 font-medium">Budget Range (per day)</label>
                  <select className="w-full px-4 py-3 border border-neutral-300 bg-white text-neutral-900 focus:outline-none focus:border-neutral-900">
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
                <button type="button" className="w-full py-3 bg-neutral-900 text-white hover:bg-neutral-800 font-medium">
                  Apply Filters
                </button>
                <button type="button" className="w-full py-3 border border-neutral-300 text-neutral-900 hover:bg-neutral-50">
                  Clear All
                </button>
              </div>
            </aside>

            <div className="flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <p className="text-neutral-600">Showing {results.length} results</p>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-neutral-600">Sort by:</span>
                  <select className="px-3 py-2 border border-neutral-300 bg-white text-neutral-900 text-sm focus:outline-none focus:border-neutral-900">
                    <option>Relevance</option>
                    <option>Rating</option>
                    <option>Experience</option>
                    <option>Price (Low to High)</option>
                    <option>Price (High to Low)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
                {results.map((r) => (
                  <div key={r.name} className="bg-white border border-neutral-200 p-4 sm:p-6">
                    <div className="flex items-start gap-4 mb-4">
                      {r.vendor ? (
                        <div className="w-16 h-16 bg-neutral-300 flex items-center justify-center shrink-0">
                          <FaTruck className="text-neutral-600 text-xl" />
                        </div>
                      ) : (
                        <img
                          src={`https://api.dicebear.com/7.x/notionists/svg?scale=200&seed=${r.seed}`}
                          alt={r.name}
                          className="w-16 h-16 rounded-full object-cover shrink-0"
                        />
                      )}
                      <div className="min-w-0 flex-1">
                        <h3 className="text-lg text-neutral-900 font-bold truncate">{r.name}</h3>
                        <p className="text-sm text-neutral-600">{r.role}</p>
                        <div className="flex items-center gap-2 mb-2">
                          <Stars fullStars={r.fullStars} />
                          <span className="text-xs text-neutral-600">({r.rating})</span>
                        </div>
                        <p className="text-sm text-neutral-600">{r.location} • {r.exp}</p>
                      </div>
                    </div>
                    <p className="text-sm text-neutral-700 mb-4 line-clamp-2">{r.bio}</p>
                    <p className="text-lg text-neutral-900 font-bold mb-4">{r.price}</p>
                    <div className="flex gap-2">
                      <button type="button" className="flex-1 py-2 border border-neutral-300 text-neutral-900 text-sm hover:bg-neutral-50">
                        View Profile
                      </button>
                      <button type="button" className="flex-1 py-2 bg-neutral-900 text-white text-sm hover:bg-neutral-800">
                        Send Request
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-center mt-8 sm:mt-12 gap-2">
                <button type="button" className="px-3 py-2 border border-neutral-300 text-neutral-900 hover:bg-neutral-50">
                  <FaChevronLeft />
                </button>
                <button type="button" className="px-4 py-2 bg-neutral-900 text-white">1</button>
                <button type="button" className="px-4 py-2 border border-neutral-300 text-neutral-900 hover:bg-neutral-50">2</button>
                <button type="button" className="px-4 py-2 border border-neutral-300 text-neutral-900 hover:bg-neutral-50">3</button>
                <button type="button" className="px-3 py-2 border border-neutral-300 text-neutral-900 hover:bg-neutral-50">
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
