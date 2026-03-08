import { useEffect, useState } from 'react';
import { FaHouse, FaCalendar, FaFolder, FaUser, FaTriangleExclamation, FaCircleCheck, FaMessage, FaPen } from 'react-icons/fa6';
import DashboardHeader from '../../components/DashboardHeader';
import DashboardSidebar from '../../components/DashboardSidebar';
import AppFooter from '../../components/AppFooter';
import Avatar from '../../components/Avatar';
import { api, ApiException } from '../../services/api';
import { useApiQuery } from '../../hooks/useApiQuery';
import { paiseToRupees, rupeesToPaise } from '../../utils/currency';

const GENRES = ['Action', 'Comedy', 'Drama', 'Romance', 'Science Fiction', 'Fantasy', 'Horror', 'Beauty', 'Noir', 'Fashion', 'Documentary', 'Thriller'];

const navLinks = [
  { icon: FaHouse,     label: 'Dashboard',    to: '/dashboard' },
  { icon: FaCalendar,  label: 'Availability', to: '/dashboard/availability' },
  { icon: FaMessage,   label: 'Chat',         to: '/dashboard/conversations' },
  { icon: FaFolder,    label: 'Past Projects', to: '/dashboard/past-projects' },
  { icon: FaUser,      label: 'Profile',       to: '/dashboard/profile' },
];

interface ProfileData {
  displayName: string;
  bio: string | null;
  skills: string[];
  genre: string | null;
  locationCity: string | null;
  locationState: string | null;
  dailyRateMin: number | null;
  dailyRateMax: number | null;
  imdbUrl: string | null;
  instagramUrl: string | null;
  isAvailable: boolean;
}

interface MeResponse {
  id: string;
  email: string;
  phone: string;
  role: string;
  isVerified: boolean;
  profile: ProfileData | null;
}

export default function IndividualProfile() {
  useEffect(() => {
    document.title = 'Profile – Claapo';
  }, []);

  const { data: me, loading: meLoading } = useApiQuery<MeResponse>('/profile/me');

  // Form state — synced from API once loaded
  const [displayName,    setDisplayName]    = useState('');
  const [bio,            setBio]            = useState('');
  const [skills,         setSkills]         = useState('');
  const [genre,          setGenre]          = useState('');
  const [locationCity,   setLocationCity]   = useState('');
  const [locationState,  setLocationState]  = useState('');
  const [dailyRateMin,   setDailyRateMin]   = useState('');
  const [dailyRateMax,   setDailyRateMax]   = useState('');
  const [imdbUrl,        setImdbUrl]        = useState('');
  const [instagramUrl,   setInstagramUrl]   = useState('');

  const [editing, setEditing] = useState(false);
  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  // Hydrate form when API data arrives
  useEffect(() => {
    if (!me?.profile) return;
    const p = me.profile;
    setDisplayName(p.displayName ?? '');
    setBio(p.bio ?? '');
    setSkills(p.skills?.join(', ') ?? '');
    setGenre(p.genre ?? '');
    setLocationCity(p.locationCity ?? '');
    setLocationState(p.locationState ?? '');
    setDailyRateMin(p.dailyRateMin ? String(paiseToRupees(p.dailyRateMin)) : '');
    setDailyRateMax(p.dailyRateMax ? String(paiseToRupees(p.dailyRateMax)) : '');
    setImdbUrl(p.imdbUrl ?? '');
    setInstagramUrl(p.instagramUrl ?? '');
  }, [me]);

  const handleSave = async () => {
    setError(null);
    setSaved(false);
    setSaving(true);
    try {
      await api.patch('/profile/individual', {
        displayName: displayName.trim() || undefined,
        bio: bio.trim() || undefined,
        skills: skills.split(',').map((s) => s.trim()).filter(Boolean),
        genre: genre || undefined,
        locationCity:  locationCity.trim()  || undefined,
        locationState: locationState.trim() || undefined,
        dailyRateMin: dailyRateMin ? rupeesToPaise(dailyRateMin) : undefined,
        dailyRateMax: dailyRateMax ? rupeesToPaise(dailyRateMax) : undefined,
        imdbUrl:      imdbUrl.trim()      || undefined,
        instagramUrl: instagramUrl.trim() || undefined,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      const msg = err instanceof ApiException ? err.payload.message : 'Failed to save profile.';
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const nameForAvatar = displayName || me?.email?.split('@')[0] || 'User';

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-neutral-50 min-w-0 w-full">
      <DashboardHeader />

      <div className="flex-1 flex min-h-0 overflow-hidden">
        <DashboardSidebar links={navLinks} />

        <main className="flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden">
          <div className="flex-1 min-h-0 overflow-auto">
            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 md:px-8 lg:px-6 xl:px-8 py-4 sm:py-5">
              <div className="mb-4 sm:mb-5">
                <h1 className="text-xl sm:text-2xl font-bold text-neutral-900">My Profile</h1>
                <p className="text-xs sm:text-sm text-neutral-600 mt-1">Manage your profile information and settings</p>
              </div>

              {meLoading ? (
                <div className="animate-pulse space-y-4">
                  <div className="h-40 bg-neutral-200 rounded-2xl" />
                  <div className="h-64 bg-neutral-200 rounded-2xl" />
                </div>
              ) : (
                <div className="space-y-5 max-w-2xl">
                  {/* Profile card (top) */}
                  <div className="rounded-2xl bg-white border border-neutral-200 p-6 text-center">
                    <div className="flex justify-center mb-4">
                      <Avatar name={nameForAvatar} size="lg" />
                    </div>
                    <h2 className="text-xl font-bold text-neutral-900 mb-1">{displayName || '—'}</h2>
                    <p className="text-sm text-neutral-600 mb-1">{skills || 'No skills added'}</p>
                    {me?.email && <p className="text-xs text-neutral-400 mb-4">{me.email}</p>}
                    {!editing && (
                      <button type="button" onClick={() => setEditing(true)} className="w-full px-4 py-2.5 bg-[#3678F1] text-white rounded-xl text-sm font-semibold hover:bg-[#2c65d4] transition-colors flex items-center justify-center gap-2">
                        <FaPen className="w-3.5 h-3.5" /> Edit Profile
                      </button>
                    )}
                  </div>

                  {/* Profile Details (below card) — read-only, no Edit button */}
                  {!editing ? (
                    <div className="rounded-2xl bg-white border border-neutral-200 p-5">
                      <h3 className="text-sm font-bold text-neutral-900 mb-4">Profile Details</h3>
                      <dl className="space-y-3">
                        <div><dt className="text-xs text-neutral-500 mb-0.5">Display Name</dt><dd className="text-sm font-medium text-neutral-900">{displayName || '—'}</dd></div>
                        <div><dt className="text-xs text-neutral-500 mb-0.5">Email</dt><dd className="text-sm text-neutral-700">{me?.email ?? '—'}</dd></div>
                        <div><dt className="text-xs text-neutral-500 mb-0.5">Phone</dt><dd className="text-sm text-neutral-700">{me?.phone ?? '—'}</dd></div>
                        <div><dt className="text-xs text-neutral-500 mb-0.5">City</dt><dd className="text-sm text-neutral-700">{locationCity || '—'}</dd></div>
                        <div><dt className="text-xs text-neutral-500 mb-0.5">State</dt><dd className="text-sm text-neutral-700">{locationState || '—'}</dd></div>
                        <div><dt className="text-xs text-neutral-500 mb-0.5">Skills</dt><dd className="text-sm text-neutral-700">{skills || '—'}</dd></div>
                        <div><dt className="text-xs text-neutral-500 mb-0.5">Genre</dt><dd className="text-sm text-neutral-700">{genre || '—'}</dd></div>
                        <div><dt className="text-xs text-neutral-500 mb-0.5">Bio</dt><dd className="text-sm text-neutral-700 whitespace-pre-wrap">{bio || '—'}</dd></div>
                        <div><dt className="text-xs text-neutral-500 mb-0.5">Daily rate (min–max)</dt><dd className="text-sm text-neutral-700">{(dailyRateMin || dailyRateMax) ? `₹${dailyRateMin || '—'} – ₹${dailyRateMax || '—'}` : '—'}</dd></div>
                        <div><dt className="text-xs text-neutral-500 mb-0.5">IMDb</dt><dd className="text-sm text-neutral-700">{imdbUrl ? <a href={imdbUrl} target="_blank" rel="noreferrer" className="text-[#3678F1] hover:underline">{imdbUrl}</a> : '—'}</dd></div>
                        <div><dt className="text-xs text-neutral-500 mb-0.5">Instagram</dt><dd className="text-sm text-neutral-700">{instagramUrl ? <a href={instagramUrl} target="_blank" rel="noreferrer" className="text-[#3678F1] hover:underline">{instagramUrl}</a> : '—'}</dd></div>
                      </dl>
                    </div>
                  ) : (
                    <>
                      {error && (
                        <div className="flex items-start gap-2 rounded-xl bg-red-50 border border-red-200 px-3 py-2.5">
                          <FaTriangleExclamation className="text-red-500 text-xs shrink-0 mt-0.5" />
                          <p className="text-xs text-red-700">{error}</p>
                        </div>
                      )}
                      {saved && (
                        <div className="flex items-center gap-2 text-[#15803D] text-sm font-semibold">
                          <FaCircleCheck /> Profile saved!
                        </div>
                      )}
                      <div className="rounded-2xl bg-white border border-neutral-200 p-5">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-sm font-bold text-neutral-900">Personal Information</h3>
                          <button type="button" onClick={() => setEditing(false)} className="text-xs text-neutral-500 hover:text-neutral-700 font-medium">Cancel</button>
                        </div>
                        <div className="space-y-3">
                          <div>
                            <label className="block text-xs font-medium text-neutral-600 mb-1">Display Name</label>
                            <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Your full name" disabled={saving} className="w-full px-3 py-2.5 border border-neutral-300 rounded-xl text-sm focus:outline-none focus:border-[#3678F1] disabled:bg-neutral-50" />
                          </div>
                          <div><label className="block text-xs font-medium text-neutral-600 mb-1">Email (read-only)</label><input type="email" value={me?.email ?? ''} readOnly className="w-full px-3 py-2.5 border border-neutral-200 rounded-xl bg-neutral-50 text-neutral-500 text-sm cursor-not-allowed" /></div>
                          <div><label className="block text-xs font-medium text-neutral-600 mb-1">Phone (read-only)</label><input type="tel" value={me?.phone ?? ''} readOnly className="w-full px-3 py-2.5 border border-neutral-200 rounded-xl bg-neutral-50 text-neutral-500 text-sm cursor-not-allowed" /></div>
                          <div className="grid grid-cols-2 gap-3">
                            <div><label className="block text-xs font-medium text-neutral-600 mb-1">City</label><input type="text" value={locationCity} onChange={(e) => setLocationCity(e.target.value)} disabled={saving} className="w-full px-3 py-2.5 border border-neutral-300 rounded-xl text-sm disabled:bg-neutral-50" /></div>
                            <div><label className="block text-xs font-medium text-neutral-600 mb-1">State</label><input type="text" value={locationState} onChange={(e) => setLocationState(e.target.value)} disabled={saving} className="w-full px-3 py-2.5 border border-neutral-300 rounded-xl text-sm disabled:bg-neutral-50" /></div>
                          </div>
                        </div>
                      </div>
                      <div className="rounded-2xl bg-white border border-neutral-200 p-5">
                        <h3 className="text-sm font-bold text-neutral-900 mb-4">Professional Details</h3>
                        <div className="space-y-3">
                          <div><label className="block text-xs font-medium text-neutral-600 mb-1">Skills (comma-separated)</label><input type="text" value={skills} onChange={(e) => setSkills(e.target.value)} disabled={saving} className="w-full px-3 py-2.5 border border-neutral-300 rounded-xl text-sm disabled:bg-neutral-50" /></div>
                          <div><label className="block text-xs font-medium text-neutral-600 mb-1">Genre</label><select value={genre} onChange={(e) => setGenre(e.target.value)} disabled={saving} className="w-full px-3 py-2.5 border border-neutral-300 rounded-xl text-sm disabled:bg-neutral-50 bg-white"><option value="">Select…</option>{GENRES.map(g => <option key={g} value={g}>{g}</option>)}</select></div>
                          <div><label className="block text-xs font-medium text-neutral-600 mb-1">Bio</label><textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} disabled={saving} className="w-full px-3 py-2.5 border border-neutral-300 rounded-xl text-sm resize-none disabled:bg-neutral-50" /></div>
                          <div className="grid grid-cols-2 gap-3">
                            <div><label className="block text-xs font-medium text-neutral-600 mb-1">Daily rate min (₹)</label><input type="number" value={dailyRateMin} onChange={(e) => setDailyRateMin(e.target.value)} disabled={saving} className="w-full px-3 py-2.5 border border-neutral-300 rounded-xl text-sm disabled:bg-neutral-50" /></div>
                            <div><label className="block text-xs font-medium text-neutral-600 mb-1">Daily rate max (₹)</label><input type="number" value={dailyRateMax} onChange={(e) => setDailyRateMax(e.target.value)} disabled={saving} className="w-full px-3 py-2.5 border border-neutral-300 rounded-xl text-sm disabled:bg-neutral-50" /></div>
                          </div>
                          <div><label className="block text-xs font-medium text-neutral-600 mb-1">IMDb URL</label><input type="url" value={imdbUrl} onChange={(e) => setImdbUrl(e.target.value)} disabled={saving} className="w-full px-3 py-2.5 border border-neutral-300 rounded-xl text-sm disabled:bg-neutral-50" /></div>
                          <div><label className="block text-xs font-medium text-neutral-600 mb-1">Instagram URL</label><input type="url" value={instagramUrl} onChange={(e) => setInstagramUrl(e.target.value)} disabled={saving} className="w-full px-3 py-2.5 border border-neutral-300 rounded-xl text-sm disabled:bg-neutral-50" /></div>
                        </div>
                        <div className="mt-4 flex justify-end gap-2">
                          <button type="button" onClick={() => setEditing(false)} className="px-5 py-2.5 border border-neutral-300 text-neutral-700 rounded-xl text-sm font-medium hover:bg-neutral-50">Cancel</button>
                          <button type="button" onClick={() => { handleSave(); setEditing(false); }} disabled={saving} className="px-5 py-2.5 bg-[#3678F1] text-white rounded-xl text-sm font-semibold hover:bg-[#2c65d4] disabled:opacity-60 flex items-center gap-2">{saving ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Saving…</> : 'Save Changes'}</button>
                        </div>
                      </div>
                    </>
                  )}
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
