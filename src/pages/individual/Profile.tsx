import { useEffect, useState } from 'react';
import { FaHouse, FaCalendar, FaFolder, FaUser, FaTriangleExclamation, FaCircleCheck } from 'react-icons/fa6';
import DashboardHeader from '../../components/DashboardHeader';
import DashboardSidebar from '../../components/DashboardSidebar';
import AppFooter from '../../components/AppFooter';
import Avatar from '../../components/Avatar';
import { api, ApiException } from '../../services/api';
import { useApiQuery } from '../../hooks/useApiQuery';
import { paiseToRupees, rupeesToPaise } from '../../utils/currency';

const navLinks = [
  { icon: FaHouse,     label: 'Dashboard',    to: '/dashboard' },
  { icon: FaCalendar,  label: 'Availability', to: '/dashboard/availability' },
  { icon: FaFolder,    label: 'Past Projects', to: '/dashboard/past-projects' },
  { icon: FaUser,      label: 'Profile',       to: '/dashboard/profile' },
];

interface ProfileData {
  displayName: string;
  bio: string | null;
  skills: string[];
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
  const [locationCity,   setLocationCity]   = useState('');
  const [locationState,  setLocationState]  = useState('');
  const [dailyRateMin,   setDailyRateMin]   = useState('');
  const [dailyRateMax,   setDailyRateMax]   = useState('');
  const [imdbUrl,        setImdbUrl]        = useState('');
  const [instagramUrl,   setInstagramUrl]   = useState('');

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
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                  {/* Left card */}
                  <div className="lg:col-span-1">
                    <div className="rounded-2xl bg-white border border-neutral-200 p-6 text-center">
                      <div className="flex justify-center mb-4">
                        <Avatar name={nameForAvatar} size="lg" />
                      </div>
                      <h2 className="text-xl font-bold text-neutral-900 mb-1">{displayName || '—'}</h2>
                      <p className="text-sm text-neutral-600 mb-1">{skills || 'No skills added'}</p>
                      {me?.email && <p className="text-xs text-neutral-400 mb-4">{me.email}</p>}

                      {/* Save feedback */}
                      {saved && (
                        <div className="flex items-center gap-2 justify-center mb-3 text-[#15803D] text-sm font-semibold">
                          <FaCircleCheck /> Saved!
                        </div>
                      )}
                      {error && (
                        <div className="flex items-start gap-2 mb-3 rounded-xl bg-red-50 border border-red-200 px-3 py-2 text-left">
                          <FaTriangleExclamation className="text-red-500 text-xs shrink-0 mt-0.5" />
                          <p className="text-xs text-red-700">{error}</p>
                        </div>
                      )}

                      <button
                        onClick={handleSave}
                        disabled={saving}
                        className="w-full px-4 py-2.5 bg-[#3678F1] text-white rounded-xl hover:bg-[#2c65d4] text-sm font-semibold transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                      >
                        {saving ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Saving…</> : 'Save Profile'}
                      </button>
                    </div>
                  </div>

                  {/* Right: forms */}
                  <div className="lg:col-span-2 space-y-4 sm:space-y-6">
                    {/* Personal Information */}
                    <div className="rounded-2xl bg-white border border-neutral-200 p-4 sm:p-6">
                      <h3 className="text-base font-bold text-neutral-900 mb-4">Personal Information</h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-neutral-700 mb-1">Display Name</label>
                          <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Your full name" disabled={saving} className="w-full px-3 py-2 border border-neutral-300 rounded-xl focus:outline-none focus:border-[#3678F1] focus:ring-1 focus:ring-[#3678F1]/20 text-sm disabled:bg-neutral-50" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-neutral-700 mb-1">Email</label>
                          <input type="email" value={me?.email ?? ''} readOnly className="w-full px-3 py-2 border border-neutral-200 rounded-xl bg-neutral-50 text-neutral-500 text-sm cursor-not-allowed" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-neutral-700 mb-1">Phone</label>
                          <input type="tel" value={me?.phone ?? ''} readOnly className="w-full px-3 py-2 border border-neutral-200 rounded-xl bg-neutral-50 text-neutral-500 text-sm cursor-not-allowed" />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-1">City</label>
                            <input type="text" value={locationCity} onChange={(e) => setLocationCity(e.target.value)} placeholder="e.g., Mumbai" disabled={saving} className="w-full px-3 py-2 border border-neutral-300 rounded-xl focus:outline-none focus:border-[#3678F1] text-sm disabled:bg-neutral-50" />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-1">State</label>
                            <input type="text" value={locationState} onChange={(e) => setLocationState(e.target.value)} placeholder="e.g., Maharashtra" disabled={saving} className="w-full px-3 py-2 border border-neutral-300 rounded-xl focus:outline-none focus:border-[#3678F1] text-sm disabled:bg-neutral-50" />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Professional Details */}
                    <div className="rounded-2xl bg-white border border-neutral-200 p-4 sm:p-6">
                      <h3 className="text-base font-bold text-neutral-900 mb-4">Professional Details</h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-neutral-700 mb-1">Skills / Roles</label>
                          <input type="text" value={skills} onChange={(e) => setSkills(e.target.value)} placeholder="e.g., Director, DOP (comma-separated)" disabled={saving} className="w-full px-3 py-2 border border-neutral-300 rounded-xl focus:outline-none focus:border-[#3678F1] text-sm disabled:bg-neutral-50" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-neutral-700 mb-1">Bio</label>
                          <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} placeholder="Brief professional bio…" disabled={saving} className="w-full px-3 py-2 border border-neutral-300 rounded-xl focus:outline-none focus:border-[#3678F1] text-sm resize-none disabled:bg-neutral-50" />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-1">Daily Rate Min (₹)</label>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 text-sm">₹</span>
                              <input type="number" value={dailyRateMin} onChange={(e) => setDailyRateMin(e.target.value)} placeholder="e.g., 20000" disabled={saving} className="w-full pl-7 pr-3 py-2 border border-neutral-300 rounded-xl focus:outline-none focus:border-[#3678F1] text-sm disabled:bg-neutral-50" />
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-1">Daily Rate Max (₹)</label>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 text-sm">₹</span>
                              <input type="number" value={dailyRateMax} onChange={(e) => setDailyRateMax(e.target.value)} placeholder="e.g., 45000" disabled={saving} className="w-full pl-7 pr-3 py-2 border border-neutral-300 rounded-xl focus:outline-none focus:border-[#3678F1] text-sm disabled:bg-neutral-50" />
                            </div>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-1">IMDb URL</label>
                            <input type="url" value={imdbUrl} onChange={(e) => setImdbUrl(e.target.value)} placeholder="https://imdb.com/name/…" disabled={saving} className="w-full px-3 py-2 border border-neutral-300 rounded-xl focus:outline-none focus:border-[#3678F1] text-sm disabled:bg-neutral-50" />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-1">Instagram URL</label>
                            <input type="url" value={instagramUrl} onChange={(e) => setInstagramUrl(e.target.value)} placeholder="https://instagram.com/…" disabled={saving} className="w-full px-3 py-2 border border-neutral-300 rounded-xl focus:outline-none focus:border-[#3678F1] text-sm disabled:bg-neutral-50" />
                          </div>
                        </div>
                        <div className="pt-2">
                          <button
                            type="button"
                            onClick={handleSave}
                            disabled={saving}
                            className="px-5 py-2.5 bg-[#3678F1] text-white rounded-xl hover:bg-[#2c65d4] text-sm font-semibold transition-colors disabled:opacity-60 flex items-center gap-2"
                          >
                            {saving ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Saving…</> : 'Save Changes'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
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
