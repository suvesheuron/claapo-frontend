import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaLock, FaUser, FaChevronDown, FaXmark } from 'react-icons/fa6';
import LocationAutocomplete from '../components/LocationAutocomplete';
import DashboardHeader from '../components/DashboardHeader';
import DashboardSidebar from '../components/DashboardSidebar';
import AppFooter from '../components/AppFooter';
import Avatar from '../components/Avatar';
import { api, ApiException } from '../services/api';
import { companyNavLinks } from '../navigation/dashboardNav';
import { ROLE_TYPES, LANGUAGES, LOOK_TYPES, BODY_TYPES, HAIR_TYPES, GENDERS, cmToFeetInches } from '../constants/castOptions';
import { paiseToRupees, rupeesToPaise } from '../utils/currency';

interface CastResultItem {
  userId: string;
  displayName: string;
  roleType: string | null;
  age: number | null;
  gender: string | null;
  heightCm: number | null;
  bodyType: string | null;
  lookType: string | null;
  hairType: string | null;
  languages: string[];
  locationCity: string | null;
  locationState: string | null;
  dailyBudget: number | null;
  isAvailable: boolean;
  aboutMe: string | null;
  email: string;
  avatarUrl: string | null;
}

interface CastSearchResponse {
  items: CastResultItem[];
  meta: { total: number; page: number; limit: number; pages: number };
}

export default function SearchCast() {
  useEffect(() => { document.title = 'Cast Search – Claapo'; }, []);
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [roleType, setRoleType] = useState('');
  const [languages, setLanguages] = useState<string[]>([]);
  const [lookType, setLookType] = useState('');
  const [bodyType, setBodyType] = useState('');
  const [hairType, setHairType] = useState('');
  const [gender, setGender] = useState('');
  const [city, setCity] = useState('');
  const [budgetMin, setBudgetMin] = useState('');
  const [budgetMax, setBudgetMax] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [results, setResults] = useState<CastResultItem[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [locked, setLocked] = useState(false);

  const query = useMemo(() => {
    const params = new URLSearchParams();
    if (name.trim()) params.set('name', name.trim());
    if (roleType) params.set('roleType', roleType);
    // Backend accepts comma-separated languages and matches with hasSome
    // (see search.service.ts language filter). Empty array → no param.
    if (languages.length > 0) params.set('language', languages.join(','));
    if (lookType) params.set('lookType', lookType);
    if (bodyType) params.set('bodyType', bodyType);
    if (hairType) params.set('hairType', hairType);
    if (gender) params.set('gender', gender);
    if (city.trim()) params.set('city', city.trim());
    // Budgets are entered in rupees; the API expects paise.
    const minRupees = Number(budgetMin);
    const maxRupees = Number(budgetMax);
    if (budgetMin && !Number.isNaN(minRupees) && minRupees >= 0) {
      params.set('rateMin', String(rupeesToPaise(minRupees)));
    }
    if (budgetMax && !Number.isNaN(maxRupees) && maxRupees >= 0) {
      params.set('rateMax', String(rupeesToPaise(maxRupees)));
    }
    // Date filters only take effect when both ends are set — partial date
    // ranges have ambiguous semantics for availability matching.
    if (startDate && endDate) {
      params.set('startDate', startDate);
      params.set('endDate', endDate);
    }
    return params.toString();
  }, [name, roleType, languages, lookType, bodyType, hairType, gender, city, budgetMin, budgetMax, startDate, endDate]);

  const resetFilters = () => {
    setName(''); setRoleType(''); setLanguages([]); setLookType('');
    setBodyType(''); setHairType(''); setGender(''); setCity('');
    setBudgetMin(''); setBudgetMax(''); setStartDate(''); setEndDate('');
  };

  const runSearch = async () => {
    setLoading(true); setError(null); setLocked(false);
    try {
      const res = await api.get<CastSearchResponse>(`/search/cast${query ? '?' + query : ''}`);
      setResults(res.items);
    } catch (err) {
      if (err instanceof ApiException) {
        const code = (err.payload as { error?: { code?: string } })?.error?.code;
        if (err.status === 403 && code === 'CAST_SEARCH_LOCKED') {
          setLocked(true);
          setResults(null);
        } else {
          setError(err.payload.message ?? 'Search failed');
        }
      } else {
        setError('Search failed');
      }
    } finally {
      setLoading(false);
    }
  };

  // Auto-apply filters: any filter change re-fires the search after a short
  // debounce. Matches the crew/vendor Search page UX where results update
  // live without the user clicking a Search button. The explicit Search
  // button remains for users who prefer a manual trigger and as a retry
  // affordance after an error.
  useEffect(() => {
    // Don't re-run while a previous request is still in flight — let it
    // settle, then react to whatever the final filter state is.
    if (loading) return;
    const handle = setTimeout(() => {
      runSearch();
    }, 350);
    return () => clearTimeout(handle);
    // We intentionally depend on `query` (the URLSearchParams string) so
    // any filter mutation re-fires; runSearch is recreated each render
    // and listing it here would re-fire infinitely.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  return (
    <div className="min-h-screen bg-[#F3F4F6] flex">
      <DashboardSidebar links={companyNavLinks} />
      <div className="flex-1 flex flex-col min-w-0">
        <DashboardHeader />

        <main className="flex-1 px-6 py-8 max-w-6xl w-full mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-neutral-900">Cast Search</h1>
              <p className="text-sm text-neutral-500 mt-1">Find actors and models for your project.</p>
            </div>
            <Link to="/dashboard" className="text-sm text-neutral-500 hover:text-neutral-700">← Back to dashboard</Link>
          </div>

          {locked ? (
            <LockedCard />
          ) : (
            <>
              {/* Filters */}
              <div className="rounded-2xl bg-white border border-neutral-200 p-5 mb-6 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <FieldWrap label="Name">
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Search by name"
                      className="w-full px-3 py-2.5 border border-neutral-300 rounded-xl text-sm bg-white"
                    />
                  </FieldWrap>
                  <FieldWrap label="Role type">
                    <SelectField label="Any role" value={roleType} onChange={setRoleType}>
                      {ROLE_TYPES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                    </SelectField>
                  </FieldWrap>
                  <FieldWrap label="Gender">
                    <SelectField label="Any gender" value={gender} onChange={setGender}>
                      {GENDERS.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}
                    </SelectField>
                  </FieldWrap>
                  <FieldWrap label="Language">
                    <LanguageMultiSelect
                      selected={languages}
                      onToggle={(lang) =>
                        setLanguages((prev) =>
                          prev.includes(lang) ? prev.filter((l) => l !== lang) : [...prev, lang],
                        )
                      }
                      onClear={() => setLanguages([])}
                    />
                  </FieldWrap>
                  <FieldWrap label="Look type">
                    <SelectField label="Any look" value={lookType} onChange={setLookType}>
                      {LOOK_TYPES.map((l) => <option key={l} value={l}>{l}</option>)}
                    </SelectField>
                  </FieldWrap>
                  <FieldWrap label="Body type">
                    <SelectField label="Any body type" value={bodyType} onChange={setBodyType}>
                      {BODY_TYPES.map((b) => <option key={b} value={b}>{b}</option>)}
                    </SelectField>
                  </FieldWrap>
                  <FieldWrap label="Hair type">
                    <SelectField label="Any hair type" value={hairType} onChange={setHairType}>
                      {HAIR_TYPES.map((h) => <option key={h} value={h}>{h}</option>)}
                    </SelectField>
                  </FieldWrap>
                  <FieldWrap label="City">
                    <LocationAutocomplete
                      compact
                      city={city}
                      onSelect={(loc) => setCity(loc.city ?? '')}
                      placeholder="Search by city…"
                    />
                  </FieldWrap>
                </div>

                {/* Budget + availability dates */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <FieldWrap label="Budget min (₹/day)">
                    <input
                      type="number" min={0}
                      value={budgetMin}
                      onChange={(e) => setBudgetMin(e.target.value)}
                      placeholder="e.g. 15000"
                      className="w-full px-3 py-2.5 border border-neutral-300 rounded-xl text-sm bg-white"
                    />
                  </FieldWrap>
                  <FieldWrap label="Budget max (₹/day)">
                    <input
                      type="number" min={0}
                      value={budgetMax}
                      onChange={(e) => setBudgetMax(e.target.value)}
                      placeholder="e.g. 80000"
                      className="w-full px-3 py-2.5 border border-neutral-300 rounded-xl text-sm bg-white"
                    />
                  </FieldWrap>
                  <FieldWrap label="Available from">
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full px-3 py-2.5 border border-neutral-300 rounded-xl text-sm bg-white"
                    />
                  </FieldWrap>
                  <FieldWrap label="Available to">
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full px-3 py-2.5 border border-neutral-300 rounded-xl text-sm bg-white"
                    />
                  </FieldWrap>
                </div>

                <div className="flex items-center justify-between gap-2 pt-1">
                  <p className="text-[11px] text-neutral-400">
                    {loading ? 'Searching…' : 'Filters apply automatically.'}
                  </p>
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="px-4 py-2.5 rounded-xl border border-neutral-300 text-sm font-semibold text-neutral-700 hover:bg-neutral-50"
                  >
                    Reset
                  </button>
                </div>
                {startDate && endDate && new Date(startDate) > new Date(endDate) && (
                  <p className="text-xs text-[#F40F02]">"Available from" must be before "Available to".</p>
                )}
              </div>

              {error && (
                <div className="rounded-xl bg-[#F40F02]/5 border border-[#F40F02]/30 px-4 py-3 mb-6 text-sm text-[#F40F02]">
                  {error}
                </div>
              )}

              {/* Results */}
              {loading ? (
                <p className="text-sm text-neutral-500">Loading…</p>
              ) : results === null ? null : results.length === 0 ? (
                <div className="rounded-2xl bg-white border border-dashed border-neutral-300 p-10 text-center text-sm text-neutral-500">
                  No cast match these filters.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {results.map((r) => (
                    <button
                      key={r.userId}
                      onClick={() => navigate(`/profile/${r.userId}`)}
                      className="rounded-2xl bg-white border border-neutral-200 p-5 text-left hover:border-[#3678F1] hover:shadow-md transition-all"
                    >
                      <div className="flex items-start gap-3 mb-3">
                        <Avatar src={r.avatarUrl ?? undefined} name={r.displayName} size="lg" />
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-bold text-neutral-900 truncate">{r.displayName}</h3>
                          <p className="text-xs text-neutral-500 mt-0.5 truncate">
                            {r.roleType?.charAt(0).toUpperCase()}{r.roleType?.slice(1)}
                            {r.age != null && ` · ${r.age}y`}
                            {r.heightCm != null && ` · ${cmToFeetInches(r.heightCm)}`}
                          </p>
                          {r.locationCity && (
                            <p className="text-[11px] text-neutral-400 mt-0.5 truncate">{r.locationCity}{r.locationState && `, ${r.locationState}`}</p>
                          )}
                        </div>
                      </div>
                      {r.aboutMe && (
                        <p className="text-xs text-neutral-600 line-clamp-2 mb-3">{r.aboutMe}</p>
                      )}
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {r.lookType && (
                          <span className="px-2 py-0.5 rounded-full bg-[#F3E8FF] text-[#9333EA] text-[10px] font-semibold">{r.lookType}</span>
                        )}
                        {r.bodyType && (
                          <span className="px-2 py-0.5 rounded-full bg-[#E8F0FE] text-[#3678F1] text-[10px] font-semibold">{r.bodyType}</span>
                        )}
                        {r.languages?.slice(0, 2).map((l) => (
                          <span key={l} className="px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-700 text-[10px] font-medium">{l}</span>
                        ))}
                      </div>
                      {r.dailyBudget != null && (
                        <p className="text-xs font-semibold text-neutral-700">
                          ₹ {paiseToRupees(r.dailyBudget).toLocaleString('en-IN')} / day
                        </p>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </main>

        <AppFooter />
      </div>
    </div>
  );
}

function SelectField({
  label, value, onChange, children,
}: { label: string; value: string; onChange: (v: string) => void; children: React.ReactNode }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-3 py-2.5 border border-neutral-300 rounded-xl text-sm bg-white"
    >
      <option value="">{label}</option>
      {children}
    </select>
  );
}

function FieldWrap({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[11px] font-semibold text-neutral-500 uppercase tracking-wide mb-1.5">{label}</label>
      {children}
    </div>
  );
}

/**
 * LanguageMultiSelect — compact dropdown that mirrors the single-select trigger
 * style of SelectField but lets the user pick multiple languages. Selected
 * languages show as removable chips inside the trigger; clicking the trigger
 * opens a panel with toggle-able items.
 */
function LanguageMultiSelect({
  selected,
  onToggle,
  onClear,
}: {
  selected: string[];
  onToggle: (lang: string) => void;
  onClear: () => void;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [open]);

  const label = selected.length === 0
    ? 'Any language'
    : selected.length === 1
      ? selected[0]
      : `${selected.length} languages`;

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2.5 border border-neutral-300 rounded-xl text-sm bg-white text-left hover:border-[#3678F1]/40"
      >
        <span className={`truncate ${selected.length === 0 ? 'text-neutral-500' : 'text-neutral-900 font-medium'}`}>
          {label}
        </span>
        <span className="flex items-center gap-1 shrink-0">
          {selected.length > 0 && (
            <span
              role="button"
              tabIndex={0}
              aria-label="Clear languages"
              onClick={(e) => { e.stopPropagation(); onClear(); }}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); onClear(); } }}
              className="text-neutral-400 hover:text-neutral-700"
            >
              <FaXmark className="w-3 h-3" />
            </span>
          )}
          <FaChevronDown className={`w-2.5 h-2.5 text-neutral-400 transition-transform ${open ? 'rotate-180' : ''}`} />
        </span>
      </button>

      {open && (
        <div className="absolute z-30 mt-1 w-full max-h-72 overflow-y-auto rounded-xl border border-neutral-200 bg-white shadow-lg">
          <ul className="py-1">
            {LANGUAGES.map((l) => {
              const active = selected.includes(l);
              return (
                <li key={l}>
                  <button
                    type="button"
                    onClick={() => onToggle(l)}
                    className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 ${
                      active ? 'bg-[#E8F0FE] text-[#1D4ED8] font-semibold' : 'hover:bg-neutral-50'
                    }`}
                  >
                    <span
                      className={`w-4 h-4 rounded border flex items-center justify-center ${
                        active
                          ? 'bg-[#3678F1] border-[#3678F1] text-white'
                          : 'border-neutral-300 bg-white'
                      }`}
                    >
                      {active && <span className="text-[10px] leading-none">✓</span>}
                    </span>
                    {l}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {selected.length > 1 && (
        <div className="flex flex-wrap gap-1 mt-1.5">
          {selected.map((l) => (
            <span key={l} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#E8F0FE] text-[#1D4ED8] text-[10px] font-semibold">
              {l}
              <button
                type="button"
                onClick={() => onToggle(l)}
                aria-label={`Remove ${l}`}
                className="hover:text-[#0F3FBF]"
              >
                <FaXmark className="w-2.5 h-2.5" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function LockedCard() {
  return (
    <div className="rounded-2xl bg-white border border-neutral-200 p-10 text-center">
      <div className="w-16 h-16 rounded-2xl bg-[#FEF3C7] flex items-center justify-center mx-auto mb-4">
        <FaLock className="text-[#946A00] text-2xl" />
      </div>
      <h2 className="text-xl font-bold text-neutral-900 mb-2">Cast Search is locked</h2>
      <p className="text-sm text-neutral-500 max-w-md mx-auto mb-6">
        Cast Search is available only for Casting Director / Agency . Update your
        Company Type in Profile to unlock actor and model discovery.
      </p>
      <div className="flex items-center justify-center gap-3">
        <Link
          to="/company-profile"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#3678F1] text-white text-sm font-semibold hover:bg-[#2563EB]"
        >
          <FaUser /> Go to Company Profile
        </Link>
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-neutral-300 text-sm font-semibold text-neutral-700 hover:bg-neutral-50"
        >
          Back
        </Link>
      </div>
    </div>
  );
}
