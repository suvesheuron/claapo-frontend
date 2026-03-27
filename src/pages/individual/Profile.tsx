import { useEffect, useState, useRef } from 'react';
import { FaTriangleExclamation, FaCircleCheck, FaPen, FaCamera } from 'react-icons/fa6';
import DashboardHeader from '../../components/DashboardHeader';
import DashboardSidebar from '../../components/DashboardSidebar';
import AppFooter from '../../components/AppFooter';
import Avatar from '../../components/Avatar';
import { api, ApiException } from '../../services/api';
import { useApiQuery } from '../../hooks/useApiQuery';
import { paiseToRupees, rupeesToPaise } from '../../utils/currency';
import { individualNavLinks } from '../../navigation/dashboardNav';
import LocationAutocomplete from '../../components/LocationAutocomplete';

const GENRES = ['Action', 'Comedy', 'Drama', 'Romance', 'Science Fiction', 'Fantasy', 'Horror', 'Beauty', 'Noir', 'Fashion', 'Documentary', 'Thriller'];

interface ProfileData {
  displayName: string;
  bio: string | null;
  aboutMe: string | null;
  skills: string[];
  genre: string | null;
  locationCity: string | null;
  locationState: string | null;
  dailyBudget: number | null;
  imdbUrl: string | null;
  instagramUrl: string | null;
  isAvailable: boolean;
  panNumber: string | null;
  bankAccountName: string | null;
  bankAccountNumber: string | null;
  ifscCode: string | null;
  bankName: string | null;
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
  const [aboutMe,        setAboutMe]        = useState('');
  const [skills,         setSkills]         = useState('');
  const [genre,          setGenre]          = useState('');
  const [locationCity,   setLocationCity]   = useState('');
  const [locationState,  setLocationState]  = useState('');
  const [dailyBudget,    setDailyBudget]    = useState('');
  const [imdbUrl,        setImdbUrl]        = useState('');
  const [instagramUrl,   setInstagramUrl]   = useState('');
  const [panNumber,      setPanNumber]      = useState('');
  const [bankAccountName, setBankAccountName] = useState('');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [ifscCode,       setIfscCode]       = useState('');
  const [bankName,       setBankName]       = useState('');

  const [editing, setEditing] = useState(false);
  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarUploading(true);
    try {
      const { uploadUrl, key } = await api.post<{ uploadUrl: string; key: string }>('/profile/avatar', {});
      await fetch(uploadUrl, { method: 'PUT', headers: { 'Content-Type': file.type || 'image/jpeg' }, body: file });
      await api.post('/profile/avatar/confirm', { key });
      setAvatarUrl(URL.createObjectURL(file));
    } catch {
      setError('Failed to upload avatar.');
    } finally {
      setAvatarUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Hydrate form when API data arrives
  useEffect(() => {
    if (!me?.profile) return;
    const p = me.profile as ProfileData & { avatarUrl?: string };
    if (p.avatarUrl) setAvatarUrl(p.avatarUrl);
    setDisplayName(p.displayName ?? '');
    setBio(p.bio ?? '');
    setAboutMe(p.aboutMe ?? '');
    setSkills(p.skills?.join(', ') ?? '');
    setGenre(p.genre ?? '');
    setLocationCity(p.locationCity ?? '');
    setLocationState(p.locationState ?? '');
    setDailyBudget(p.dailyBudget ? String(paiseToRupees(p.dailyBudget)) : '');
    setImdbUrl(p.imdbUrl ?? '');
    setInstagramUrl(p.instagramUrl ?? '');
    setPanNumber((p as ProfileData).panNumber ?? '');
    setBankAccountName((p as ProfileData).bankAccountName ?? '');
    setBankAccountNumber((p as ProfileData).bankAccountNumber ?? '');
    setIfscCode((p as ProfileData).ifscCode ?? '');
    setBankName((p as ProfileData).bankName ?? '');
  }, [me]);

  const handleSave = async () => {
    setError(null);
    setSaved(false);
    setSaving(true);
    try {
      await api.patch('/profile/individual', {
        displayName: displayName.trim() || undefined,
        bio: bio.trim() || undefined,
        aboutMe: aboutMe.trim() || undefined,
        skills: skills.split(',').map((s) => s.trim()).filter(Boolean),
        genre: genre || undefined,
        locationCity:  locationCity.trim()  || undefined,
        locationState: locationState.trim() || undefined,
        dailyBudget: dailyBudget ? rupeesToPaise(dailyBudget) : undefined,
        imdbUrl:      imdbUrl.trim()      || undefined,
        instagramUrl: instagramUrl.trim() || undefined,
        panNumber:    panNumber.trim()    || undefined,
        bankAccountName: bankAccountName.trim() || undefined,
        bankAccountNumber: bankAccountNumber.trim() || undefined,
        ifscCode:     ifscCode.trim()     || undefined,
        bankName:     bankName.trim()     || undefined,
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
        <DashboardSidebar links={individualNavLinks} />

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
                      <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                        <Avatar src={avatarUrl ?? undefined} name={nameForAvatar} size="lg" />
                        <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          {avatarUploading
                            ? <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                            : <FaCamera className="text-white text-sm" />}
                        </div>
                        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                      </div>
                    </div>
                    <h2 className="text-xl font-bold text-neutral-900 mb-1">{displayName || '—'}</h2>
                    <p className="text-sm text-neutral-600 mb-1">{skills || 'No skills added'}</p>
                    {me?.email && <p className="text-xs text-neutral-400 mb-4">{me.email}</p>}
                    {!editing && (
                      <button type="button" onClick={() => setEditing(true)} className="w-full px-4 py-2.5 bg-[#3B5BDB] text-white rounded-xl text-sm font-semibold hover:bg-[#2f4ac2] transition-colors flex items-center justify-center gap-2">
                        <FaPen className="w-3.5 h-3.5" /> Edit Profile
                      </button>
                    )}
                  </div>

                  {/* Profile Details (below card) — read-only, no Edit button */}
                  {!editing ? (
                    <>
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
                        <div><dt className="text-xs text-neutral-500 mb-0.5">About Me</dt><dd className="text-sm text-neutral-700 whitespace-pre-wrap">{aboutMe || '—'}</dd></div>
                        <div><dt className="text-xs text-neutral-500 mb-0.5">Daily Budget</dt><dd className="text-sm text-neutral-700">{dailyBudget ? `₹${dailyBudget}/day` : '—'}</dd></div>
                        <div><dt className="text-xs text-neutral-500 mb-0.5">Work Portfolio Link</dt><dd className="text-sm text-neutral-700">{imdbUrl ? <a href={imdbUrl} target="_blank" rel="noreferrer" className="text-[#3B5BDB] hover:underline">{imdbUrl}</a> : '—'}</dd></div>
                        <div><dt className="text-xs text-neutral-500 mb-0.5">Instagram</dt><dd className="text-sm text-neutral-700">{instagramUrl ? <a href={instagramUrl} target="_blank" rel="noreferrer" className="text-[#3B5BDB] hover:underline">{instagramUrl}</a> : '—'}</dd></div>
                      </dl>
                    </div>
                    <div className="rounded-2xl bg-white border border-neutral-200 p-5">
                      <h3 className="text-sm font-bold text-neutral-900 mb-4">Invoice details</h3>
                      <p className="text-xs text-neutral-500 mb-3">PAN and bank details appear on invoices when you are issuer or recipient.</p>
                      <dl className="space-y-3">
                        <div><dt className="text-xs text-neutral-500 mb-0.5">PAN Number</dt><dd className="text-sm font-medium text-neutral-900">{panNumber || '—'}</dd></div>
                        <div><dt className="text-xs text-neutral-500 mb-0.5">Bank name</dt><dd className="text-sm text-neutral-700">{bankName || '—'}</dd></div>
                        <div><dt className="text-xs text-neutral-500 mb-0.5">Account name</dt><dd className="text-sm text-neutral-700">{bankAccountName || '—'}</dd></div>
                        <div><dt className="text-xs text-neutral-500 mb-0.5">Account number</dt><dd className="text-sm text-neutral-700">{bankAccountNumber || '—'}</dd></div>
                        <div><dt className="text-xs text-neutral-500 mb-0.5">IFSC</dt><dd className="text-sm text-neutral-700">{ifscCode || '—'}</dd></div>
                      </dl>
                    </div>
                    </>
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
                            <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Your full name" disabled={saving} className="w-full px-3 py-2.5 border border-neutral-300 rounded-xl text-sm focus:outline-none focus:border-[#3B5BDB] disabled:bg-neutral-50" />
                          </div>
                          <div><label className="block text-xs font-medium text-neutral-600 mb-1">Email (read-only)</label><input type="email" value={me?.email ?? ''} readOnly className="w-full px-3 py-2.5 border border-neutral-200 rounded-xl bg-neutral-50 text-neutral-500 text-sm cursor-not-allowed" /></div>
                          <div><label className="block text-xs font-medium text-neutral-600 mb-1">Phone (read-only)</label><input type="tel" value={me?.phone ?? ''} readOnly className="w-full px-3 py-2.5 border border-neutral-200 rounded-xl bg-neutral-50 text-neutral-500 text-sm cursor-not-allowed" /></div>
                          <LocationAutocomplete
                            label="Location"
                            city={locationCity}
                            state={locationState}
                            disabled={saving}
                            onSelect={(loc) => { setLocationCity(loc.city); setLocationState(loc.state); }}
                            placeholder="Search city or pin code..."
                          />
                        </div>
                      </div>
                      <div className="rounded-2xl bg-white border border-neutral-200 p-5">
                        <h3 className="text-sm font-bold text-neutral-900 mb-4">Professional Details</h3>
                        <div className="space-y-3">
                          <div><label className="block text-xs font-medium text-neutral-600 mb-1">Skills (comma-separated)</label><input type="text" value={skills} onChange={(e) => setSkills(e.target.value)} disabled={saving} className="w-full px-3 py-2.5 border border-neutral-300 rounded-xl text-sm disabled:bg-neutral-50" /></div>
                          <div><label className="block text-xs font-medium text-neutral-600 mb-1">Genre</label><select value={genre} onChange={(e) => setGenre(e.target.value)} disabled={saving} className="w-full px-3 py-2.5 border border-neutral-300 rounded-xl text-sm disabled:bg-neutral-50 bg-white"><option value="">Select…</option>{GENRES.map(g => <option key={g} value={g}>{g}</option>)}</select></div>
                          <div><label className="block text-xs font-medium text-neutral-600 mb-1">Bio</label><textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} disabled={saving} className="w-full px-3 py-2.5 border border-neutral-300 rounded-xl text-sm resize-none disabled:bg-neutral-50" /></div>
                          <div><label className="block text-xs font-medium text-neutral-600 mb-1">About Me</label><textarea value={aboutMe} onChange={(e) => setAboutMe(e.target.value)} rows={4} placeholder="Longer description, experience, approach" disabled={saving} className="w-full px-3 py-2.5 border border-neutral-300 rounded-xl text-sm resize-none disabled:bg-neutral-50" /></div>
                          <div><label className="block text-xs font-medium text-neutral-600 mb-1">Daily Budget (₹/day)</label><input type="number" value={dailyBudget} onChange={(e) => setDailyBudget(e.target.value)} disabled={saving} placeholder="e.g. 5000" className="w-full px-3 py-2.5 border border-neutral-300 rounded-xl text-sm disabled:bg-neutral-50" /></div>
                          <div><label className="block text-xs font-medium text-neutral-600 mb-1">Work Portfolio Link (IMDb / Behance / etc.)</label><input type="url" value={imdbUrl} onChange={(e) => setImdbUrl(e.target.value)} disabled={saving} className="w-full px-3 py-2.5 border border-neutral-300 rounded-xl text-sm disabled:bg-neutral-50" /></div>
                          <div><label className="block text-xs font-medium text-neutral-600 mb-1">Instagram URL</label><input type="url" value={instagramUrl} onChange={(e) => setInstagramUrl(e.target.value)} disabled={saving} className="w-full px-3 py-2.5 border border-neutral-300 rounded-xl text-sm disabled:bg-neutral-50" /></div>
                        </div>
                      </div>
                      <div className="rounded-2xl bg-white border border-neutral-200 p-5">
                        <h3 className="text-sm font-bold text-neutral-900 mb-4">Invoice details</h3>
                        <p className="text-xs text-neutral-500 mb-3">PAN and bank details appear on invoices when you are issuer or recipient.</p>
                        <div className="space-y-3">
                          <div><label className="block text-xs font-medium text-neutral-600 mb-1">PAN Number</label><input type="text" value={panNumber} onChange={(e) => setPanNumber(e.target.value)} placeholder="e.g. ABCDE1234F" disabled={saving} className="w-full px-3 py-2.5 border border-neutral-300 rounded-xl text-sm disabled:bg-neutral-50" /></div>
                          <div><label className="block text-xs font-medium text-neutral-600 mb-1">Bank name</label><input type="text" value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder="e.g. HDFC Bank" disabled={saving} className="w-full px-3 py-2.5 border border-neutral-300 rounded-xl text-sm disabled:bg-neutral-50" /></div>
                          <div><label className="block text-xs font-medium text-neutral-600 mb-1">Account name</label><input type="text" value={bankAccountName} onChange={(e) => setBankAccountName(e.target.value)} placeholder="Account holder name" disabled={saving} className="w-full px-3 py-2.5 border border-neutral-300 rounded-xl text-sm disabled:bg-neutral-50" /></div>
                          <div><label className="block text-xs font-medium text-neutral-600 mb-1">Account number</label><input type="text" value={bankAccountNumber} onChange={(e) => setBankAccountNumber(e.target.value)} placeholder="Bank account number" disabled={saving} className="w-full px-3 py-2.5 border border-neutral-300 rounded-xl text-sm disabled:bg-neutral-50" /></div>
                          <div><label className="block text-xs font-medium text-neutral-600 mb-1">IFSC code</label><input type="text" value={ifscCode} onChange={(e) => setIfscCode(e.target.value)} placeholder="e.g. HDFC0001234" disabled={saving} className="w-full px-3 py-2.5 border border-neutral-300 rounded-xl text-sm disabled:bg-neutral-50" /></div>
                        </div>
                        <div className="mt-4 flex justify-end gap-2">
                          <button type="button" onClick={() => setEditing(false)} className="px-5 py-2.5 border border-neutral-300 text-neutral-700 rounded-xl text-sm font-medium hover:bg-neutral-50">Cancel</button>
                          <button type="button" onClick={() => { handleSave(); setEditing(false); }} disabled={saving} className="px-5 py-2.5 bg-[#3B5BDB] text-white rounded-xl text-sm font-semibold hover:bg-[#2f4ac2] disabled:opacity-60 flex items-center gap-2">{saving ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Saving…</> : 'Save Changes'}</button>
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
