import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { FaMagnifyingGlass, FaLocationDot, FaTriangleExclamation, FaUser, FaBuilding, FaTruck } from 'react-icons/fa6';
import DashboardHeader from '../components/DashboardHeader';
import DashboardSidebar from '../components/DashboardSidebar';
import AppFooter from '../components/AppFooter';
import Avatar from '../components/Avatar';
import { useApiQuery } from '../hooks/useApiQuery';
import { useAuth } from '../contexts/AuthContext';
import { companyNavLinks, individualNavLinks, vendorNavLinks, castNavLinks } from '../navigation/dashboardNav';

type Category = 'all' | 'crew' | 'vendor' | 'company';

interface DirectoryItem {
  userId: string;
  role: 'individual' | 'vendor' | 'company' | 'cast';
  name: string;
  categoryLabel?: string | null;
  locationCity: string | null;
  locationState: string | null;
  avatarUrl: string | null;
}

interface DirectoryResponse {
  items: DirectoryItem[];
  meta: { total: number; page: number; limit: number; pages: number };
}

const CATEGORY_TABS: Array<{ id: Category; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'crew', label: 'Crew' },
  { id: 'vendor', label: 'Vendor' },
  { id: 'company', label: 'Company' },
];

const ROLE_BADGE: Record<string, { label: string; Icon: typeof FaUser; chipClass: string }> = {
  individual: { label: 'Crew',    Icon: FaUser,     chipClass: 'bg-[#E8F0FE] text-[#1D4ED8] border-[#3678F1]/20' },
  vendor:     { label: 'Vendor',  Icon: FaTruck,    chipClass: 'bg-[#FEF3C7] text-[#92400E] border-[#F59E0B]/30' },
  company:    { label: 'Company', Icon: FaBuilding, chipClass: 'bg-[#DCFCE7] text-[#15803D] border-[#86EFAC]' },
  cast:       { label: 'Cast',    Icon: FaUser,     chipClass: 'bg-[#F3E8FF] text-[#7C3AED] border-[#A855F7]/30' },
};
const BADGE_FALLBACK = { label: 'User', Icon: FaUser, chipClass: 'bg-neutral-100 text-neutral-600 border-neutral-200' };

export default function Discover() {
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [category, setCategory] = useState<Category>('all');

  // Only company viewers see the All/Crew/Vendor/Company tabs. Other roles get
  // a plain name-search experience without category filtering — the directory
  // is primarily a hiring tool, so other roles only browse names.
  const showCategoryTabs = user?.role === 'company' || user?.role === 'admin';

  // Pick the sidebar nav matching the viewer's role. Admin reuses company nav
  // (same pattern as Chat.tsx / OtherUserProfile.tsx).
  const navLinks = useMemo(() => {
    if (user?.role === 'vendor') return vendorNavLinks;
    if (user?.role === 'individual') return individualNavLinks;
    if (user?.role === 'cast') return castNavLinks;
    return companyNavLinks;
  }, [user?.role]);

  useEffect(() => {
    document.title = 'Discover – Claapo';
  }, []);

  // Debounce the input so we don't fire on every keystroke.
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query.trim()), 250);
    return () => clearTimeout(t);
  }, [query]);

  // Don't fetch (or show profiles) until the user has typed a query. The
  // landing state is intentionally empty so non-company viewers don't get a
  // pre-populated directory.
  const hasQuery = debouncedQuery.length > 0;

  // Path is computed from the debounced query + category. useApiQuery handles
  // cancellation on path change so toggling categories quickly doesn't race.
  const path = useMemo(() => {
    if (!hasQuery) return null;
    const params = new URLSearchParams();
    params.set('q', debouncedQuery);
    if (showCategoryTabs && category !== 'all') params.set('category', category);
    params.set('limit', '40');
    return `/search/people?${params.toString()}`;
  }, [hasQuery, debouncedQuery, category, showCategoryTabs]);

  const { data, loading, error } = useApiQuery<DirectoryResponse>(path);
  const items = hasQuery ? (data?.items ?? []) : [];

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-neutral-50 dark:bg-bg w-full">
      <DashboardHeader />
      <div className="flex-1 flex min-h-0 overflow-hidden">
        <DashboardSidebar links={navLinks} />
        <main className="flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden">
          <div className="flex-1 min-h-0 overflow-auto">
            <div className="max-w-[1100px] mx-auto px-4 sm:px-6 md:px-8 py-6">
              <div className="mb-5">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900">Discover</h1>
                <p className="text-sm text-neutral-500 mt-1">
                  Find crew, vendors and companies on Claapo by name.
                </p>
              </div>

              <div className="rounded-2xl bg-white shadow-soft border border-neutral-100 p-4 sm:p-5 mb-5">
                <div className="relative">
                  <FaMagnifyingGlass className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search by name…"
                    className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-[#3678F1]/30 focus:border-[#3678F1] text-sm"
                  />
                </div>
                {showCategoryTabs && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {CATEGORY_TABS.map((tab) => {
                      const active = category === tab.id;
                      return (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setCategory(tab.id)}
                          className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                            active
                              ? 'bg-[#3678F1] text-white border-[#3678F1]'
                              : 'bg-white text-neutral-700 border-neutral-200 hover:border-[#3678F1]/40 hover:text-[#3678F1]'
                          }`}
                        >
                          {tab.label}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {!hasQuery ? (
                <div className="rounded-2xl bg-white border border-neutral-100 p-10 text-center">
                  <p className="text-sm text-neutral-500">
                    Start typing to find {showCategoryTabs ? 'people, vendors or companies' : 'profiles'} by name.
                  </p>
                </div>
              ) : error ? (
                <div className="flex items-center gap-3 rounded-2xl bg-[#FEEBEA] border border-[#F40F02]/30 p-4">
                  <FaTriangleExclamation className="text-[#F40F02] shrink-0" />
                  <p className="text-sm text-[#991B1B]">{error}</p>
                </div>
              ) : loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="rounded-2xl bg-white border border-neutral-100 p-5 h-32 skeleton" />
                  ))}
                </div>
              ) : items.length === 0 ? (
                <div className="rounded-2xl bg-white border border-neutral-100 p-10 text-center">
                  <p className="text-sm text-neutral-500">
                    No {showCategoryTabs && category !== 'all' ? category + 's' : 'profiles'} match "{debouncedQuery}".
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {items.map((item) => {
                    const badge = ROLE_BADGE[item.role] ?? BADGE_FALLBACK;
                    const BadgeIcon = badge.Icon;
                    const location = [item.locationCity, item.locationState].filter(Boolean).join(', ');
                    return (
                      <Link
                        key={item.userId}
                        to={`/profile/${item.userId}`}
                        className="rounded-2xl bg-white border border-neutral-100 hover:border-[#3678F1] hover:shadow-soft transition-all p-5 flex items-start gap-4"
                      >
                        <Avatar src={item.avatarUrl ?? undefined} name={item.name || '—'} size="lg" />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${badge.chipClass}`}>
                              <BadgeIcon className="w-2.5 h-2.5" />
                              {badge.label}
                            </span>
                          </div>
                          <h3 className="text-sm font-bold text-neutral-900 truncate">
                            {item.name || 'Unnamed'}
                          </h3>
                          {item.categoryLabel && (
                            <p className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wide mt-0.5 truncate">
                              {item.categoryLabel}
                            </p>
                          )}
                          {location ? (
                            <p className="text-xs text-neutral-500 flex items-center gap-1 mt-1 truncate">
                              <FaLocationDot className="w-3 h-3 text-neutral-400 shrink-0" />
                              <span className="truncate">{location}</span>
                            </p>
                          ) : null}
                        </div>
                      </Link>
                    );
                  })}
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
