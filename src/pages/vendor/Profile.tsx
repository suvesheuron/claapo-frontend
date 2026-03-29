import { useEffect, useState, useRef } from 'react';
import {
  FaEye, FaEyeSlash, FaPen,
  FaBuilding, FaIdCard, FaLocationDot, FaTriangleExclamation, FaCircleCheck,
  FaGlobe, FaInstagram, FaCamera,
} from 'react-icons/fa6';
import DashboardHeader from '../../components/DashboardHeader';
import DashboardSidebar from '../../components/DashboardSidebar';
import AppFooter from '../../components/AppFooter';
import Avatar from '../../components/Avatar';
import { api, ApiException } from '../../services/api';
import { useApiQuery } from '../../hooks/useApiQuery';
import { vendorNavLinks } from '../../navigation/dashboardNav';
import LocationAutocomplete from '../../components/LocationAutocomplete';
import { REGISTRATION_VENDOR_CATEGORIES, vendorCategoryToVendorType } from '../../constants/registrationCategories';

interface VendorProfileData {
  companyName: string;
  vendorType: string;
  vendorServiceCategory?: string | null;
  locationCity: string | null;
  locationState: string | null;
  bio: string | null;
  aboutUs: string | null;
  website: string | null;
  instagramUrl: string | null;
  gstNumber: string | null;
  isGstVerified: boolean;
}

interface MeResponse {
  id: string;
  email: string;
  phone: string;
  role: string;
  isVerified: boolean;
  profile: VendorProfileData | null;
}

export default function VendorProfile() {
  useEffect(() => { document.title = 'Vendor Profile – Claapo'; }, []);

  const { data: me, loading: meLoading } = useApiQuery<MeResponse>('/profile/me');

  const [companyName,   setCompanyName]   = useState('');
  const [vendorServiceCategory, setVendorServiceCategory] = useState('');
  const [locationCity,  setLocationCity]  = useState('');
  const [locationState, setLocationState] = useState('');
  const [bio,           setBio]           = useState('');
  const [aboutUs,       setAboutUs]       = useState('');
  const [website,       setWebsite]       = useState('');
  const [instagramUrl,  setInstagramUrl]  = useState('');

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);
  const [error,  setError]  = useState<string | null>(null);

  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [curPass,  setCurPass]  = useState('');
  const [newPass,  setNewPass]  = useState('');
  const [confPass, setConfPass] = useState('');
  const [showPw, setShowPw] = useState<{ cur: boolean; new: boolean; conf: boolean }>({ cur: false, new: false, conf: false });
  const [pwSaving, setPwSaving] = useState(false);
  const [pwError,  setPwError]  = useState<string | null>(null);
  const [pwSaved,  setPwSaved]  = useState(false);

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
      setError('Failed to upload logo.');
    } finally {
      setAvatarUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  useEffect(() => {
    if (!me?.profile) return;
    const p = me.profile as VendorProfileData & { avatarUrl?: string; logoUrl?: string };
    if (p.logoUrl || p.avatarUrl) setAvatarUrl(p.logoUrl ?? p.avatarUrl ?? null);
    setCompanyName(p.companyName ?? '');
    setVendorServiceCategory(p.vendorServiceCategory ?? '');
    setLocationCity(p.locationCity ?? '');
    setLocationState(p.locationState ?? '');
    setBio(p.bio ?? '');
    setAboutUs(p.aboutUs ?? '');
    setWebsite(p.website ?? '');
    setInstagramUrl(p.instagramUrl ?? '');
  }, [me]);

  const handleSave = async () => {
    setError(null); setSaved(false); setSaving(true);
    try {
      await api.patch('/profile/vendor', {
        companyName:   companyName.trim()   || undefined,
        vendorType:    vendorCategoryToVendorType(vendorServiceCategory || 'all'),
        vendorServiceCategory: vendorServiceCategory.trim() || undefined,
        locationCity:  locationCity.trim()  || undefined,
        locationState: locationState.trim() || undefined,
        bio:           bio.trim()           || undefined,
        aboutUs:       aboutUs.trim()       || undefined,
        website:       website.trim()       || undefined,
        instagramUrl:  instagramUrl.trim()  || undefined,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err instanceof ApiException ? err.payload.message : 'Failed to save profile.');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    setPwError(null); setPwSaved(false);
    if (!curPass || !newPass || !confPass) { setPwError('All password fields are required.'); return; }
    if (newPass !== confPass) { setPwError('New passwords do not match.'); return; }
    if (newPass.length < 8)  { setPwError('New password must be at least 8 characters.'); return; }
    setPwSaving(true);
    try {
      await api.post('/auth/change-password', { currentPassword: curPass, newPassword: newPass });
      setPwSaved(true);
      setCurPass(''); setNewPass(''); setConfPass('');
      setTimeout(() => setPwSaved(false), 3000);
    } catch (err) {
      setPwError(err instanceof ApiException ? err.payload.message : 'Failed to update password.');
    } finally {
      setPwSaving(false);
    }
  };

  const profile = me?.profile;

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-[#F3F4F6] w-full">
      <DashboardHeader />
      <div className="flex-1 flex min-h-0 overflow-hidden">
        <DashboardSidebar links={vendorNavLinks} />
        <main className="flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden">
          <div className="flex-1 min-h-0 overflow-auto">
            <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-6 xl:px-8 py-5">

              <div className="mb-5">
                <h1 className="text-xl font-bold text-neutral-900">Vendor Profile</h1>
                <p className="text-sm text-neutral-500 mt-0.5">Manage your vendor details, equipment listing, and settings</p>
              </div>

              {meLoading ? (
                <div className="animate-pulse space-y-4">
                  <div className="h-48 bg-neutral-200 rounded-2xl" />
                  <div className="h-64 bg-neutral-200 rounded-2xl" />
                </div>
              ) : (
                <div className="space-y-5 max-w-2xl">
                  {/* Profile card (top) */}
                  <div className="rounded-2xl bg-white border border-neutral-200 p-5 text-center">
                    <div className="flex justify-center mb-3">
                      <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                        <Avatar src={avatarUrl ?? undefined} name={companyName || 'Vendor'} size="lg" />
                        <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          {avatarUploading
                            ? <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                            : <FaCamera className="text-white text-sm" />}
                        </div>
                        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                      </div>
                    </div>
                    <h2 className="text-base font-bold text-neutral-900 mb-0.5">{companyName || '—'}</h2>
                    <p className="text-xs text-neutral-500 mb-1">
                      {vendorServiceCategory || 'Vendor'}
                    </p>
                    {me?.isVerified && (
                      <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-[#D1FAE5] text-[#065F46] font-semibold">
                        ✓ Verified Vendor
                      </span>
                    )}
                    <div className="mt-4 pt-4 border-t border-neutral-100 space-y-2 text-left">
                      {locationCity && (
                        <div className="flex items-center gap-2 text-xs text-neutral-500">
                          <FaLocationDot className="w-3 h-3 text-neutral-400 shrink-0" />
                          <span>{locationCity}{locationState ? `, ${locationState}` : ''}</span>
                        </div>
                      )}
                      {website && (
                        <div className="flex items-center gap-2 text-xs text-neutral-500">
                          <FaGlobe className="w-3 h-3 text-neutral-400 shrink-0" />
                          <a href={website} target="_blank" rel="noopener noreferrer" className="text-[#3B5BDB] hover:underline truncate">{website.replace(/^https?:\/\//, '')}</a>
                        </div>
                      )}
                      {instagramUrl && (
                        <div className="flex items-center gap-2 text-xs text-neutral-500">
                          <FaInstagram className="w-3 h-3 text-neutral-400 shrink-0" />
                          <a href={instagramUrl} target="_blank" rel="noopener noreferrer" className="text-[#3B5BDB] hover:underline truncate">{instagramUrl.replace(/^https?:\/\//, '')}</a>
                        </div>
                      )}
                      {profile?.gstNumber && (
                        <div className="flex items-center gap-2 text-xs text-neutral-500">
                          <FaIdCard className="w-3 h-3 text-neutral-400 shrink-0" />
                          <span>GST: {profile.gstNumber}</span>
                          {profile.isGstVerified && <span className="text-[10px] text-[#15803D] font-semibold">✓</span>}
                        </div>
                      )}
                      {(bio || aboutUs) && (
                        <div className="text-xs text-neutral-600 mt-1">
                          <span className="font-semibold text-neutral-800">About us: </span>
                          <span className="line-clamp-2">{aboutUs || bio}</span>
                        </div>
                      )}
                    </div>
                    {!editing && (
                      <button type="button" onClick={() => setEditing(true)} className="mt-4 w-full px-4 py-2.5 bg-[#3B5BDB] text-white rounded-xl text-sm font-semibold hover:bg-[#2f4ac2] transition-colors flex items-center justify-center gap-2">
                        <FaPen className="w-3.5 h-3.5" /> Edit Profile
                      </button>
                    )}
                  </div>

                  {!editing ? (
                    <div className="rounded-2xl bg-white border border-neutral-200 p-5">
                      <h3 className="text-sm font-bold text-neutral-900 mb-4">Profile Details</h3>
                      <dl className="space-y-3">
                        <div><dt className="text-xs text-neutral-500 mb-0.5">Business Name</dt><dd className="text-sm font-medium text-neutral-900">{companyName || '—'}</dd></div>
                        <div><dt className="text-xs text-neutral-500 mb-0.5">Service category</dt><dd className="text-sm text-neutral-700">{vendorServiceCategory || '—'}</dd></div>
                        <div><dt className="text-xs text-neutral-500 mb-0.5">Email</dt><dd className="text-sm text-neutral-700">{me?.email ?? '—'}</dd></div>
                        <div><dt className="text-xs text-neutral-500 mb-0.5">Phone</dt><dd className="text-sm text-neutral-700">{me?.phone ?? '—'}</dd></div>
                        <div><dt className="text-xs text-neutral-500 mb-0.5">City</dt><dd className="text-sm text-neutral-700">{locationCity || '—'}</dd></div>
                        <div><dt className="text-xs text-neutral-500 mb-0.5">State</dt><dd className="text-sm text-neutral-700">{locationState || '—'}</dd></div>
                        <div><dt className="text-xs text-neutral-500 mb-0.5">Website</dt><dd className="text-sm text-neutral-700">{website ? <a href={website} target="_blank" rel="noopener noreferrer" className="text-[#3B5BDB] hover:underline">{website}</a> : '—'}</dd></div>
                        <div><dt className="text-xs text-neutral-500 mb-0.5">Instagram</dt><dd className="text-sm text-neutral-700">{instagramUrl ? <a href={instagramUrl} target="_blank" rel="noopener noreferrer" className="text-[#3B5BDB] hover:underline">{instagramUrl}</a> : '—'}</dd></div>
                        <div><dt className="text-xs text-neutral-500 mb-0.5">About</dt><dd className="text-sm text-neutral-700 whitespace-pre-wrap">{bio || '—'}</dd></div>
                        <div><dt className="text-xs text-neutral-500 mb-0.5">About Us</dt><dd className="text-sm text-neutral-700 whitespace-pre-wrap">{aboutUs || '—'}</dd></div>
                      </dl>
                    </div>
                  ) : (
                    <>
                    <div className="rounded-2xl bg-white border border-neutral-200 p-5">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-bold text-neutral-900">Business Information</h3>
                        <button type="button" onClick={() => setEditing(false)} className="text-xs text-neutral-500 hover:text-neutral-700 font-medium">Cancel</button>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-medium text-neutral-600 mb-1">Business Name</label>
                          <div className="relative">
                            <FaBuilding className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 w-3.5 h-3.5" />
                            <input type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} disabled={saving} placeholder="Your business name" className="w-full pl-9 pr-3 py-2.5 border border-neutral-300 rounded-xl text-sm focus:outline-none focus:border-[#3B5BDB] transition-all disabled:bg-neutral-50" />
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-neutral-600 mb-1">Service category</label>
                          <select value={vendorServiceCategory} onChange={(e) => setVendorServiceCategory(e.target.value)} disabled={saving} className="w-full px-3 py-2.5 border border-neutral-300 rounded-xl text-sm focus:outline-none focus:border-[#3B5BDB] transition-all bg-white disabled:bg-neutral-50">
                            <option value="">Select category…</option>
                            {REGISTRATION_VENDOR_CATEGORIES.map((c) => (
                              <option key={c} value={c}>{c}</option>
                            ))}
                          </select>
                          <p className="text-[10px] text-neutral-400 mt-0.5">Listed on your profile and used with search filters</p>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-neutral-600 mb-1">Email (read-only)</label>
                          <input type="email" value={me?.email ?? ''} readOnly className="w-full px-3 py-2.5 border border-neutral-200 rounded-xl text-sm bg-neutral-50 text-neutral-500 cursor-not-allowed" />
                        </div>
                        <LocationAutocomplete
                          label="Location"
                          city={locationCity}
                          state={locationState}
                          disabled={saving}
                          onSelect={(loc) => { setLocationCity(loc.city); setLocationState(loc.state); }}
                          placeholder="Search city or pin code..."
                        />
                        <div>
                          <label className="block text-xs font-medium text-neutral-600 mb-1">About / Description</label>
                          <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} disabled={saving} placeholder="Brief description of your business and specialties…" className="w-full px-3 py-2.5 border border-neutral-300 rounded-xl text-sm focus:outline-none focus:border-[#3B5BDB] transition-all resize-none disabled:bg-neutral-50" />
                          <div className="mt-3">
                            <label className="block text-xs font-medium text-neutral-600 mb-1">About Us</label>
                            <textarea value={aboutUs} onChange={(e) => setAboutUs(e.target.value)} rows={4} disabled={saving} placeholder="Longer company story, services, experience…" className="w-full px-3 py-2.5 border border-neutral-300 rounded-xl text-sm focus:outline-none focus:border-[#3B5BDB] transition-all resize-none disabled:bg-neutral-50" />
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-neutral-600 mb-1">Website</label>
                          <div className="relative">
                            <FaGlobe className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 w-3.5 h-3.5" />
                            <input type="url" value={website} onChange={(e) => setWebsite(e.target.value)} disabled={saving} placeholder="https://yourcompany.com" className="w-full pl-9 pr-3 py-2.5 border border-neutral-300 rounded-xl text-sm focus:outline-none focus:border-[#3B5BDB] transition-all disabled:bg-neutral-50" />
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-neutral-600 mb-1">Instagram URL</label>
                          <div className="relative">
                            <FaInstagram className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 w-3.5 h-3.5" />
                            <input type="url" value={instagramUrl} onChange={(e) => setInstagramUrl(e.target.value)} disabled={saving} placeholder="https://instagram.com/yourcompany" className="w-full pl-9 pr-3 py-2.5 border border-neutral-300 rounded-xl text-sm focus:outline-none focus:border-[#3B5BDB] transition-all disabled:bg-neutral-50" />
                          </div>
                        </div>
                        {profile?.gstNumber && (
                          <div>
                            <label className="block text-xs font-medium text-neutral-600 mb-1">
                              GST Number (read-only)
                              {profile.isGstVerified && <span className="ml-1 text-[10px] text-[#15803D] font-semibold">✓ Verified</span>}
                            </label>
                            <div className="relative">
                              <FaIdCard className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 w-3.5 h-3.5" />
                              <input type="text" value={profile.gstNumber} readOnly className="w-full pl-9 pr-3 py-2.5 border border-neutral-200 rounded-xl text-sm bg-neutral-50 text-neutral-500 cursor-not-allowed" />
                            </div>
                          </div>
                        )}
                      </div>

                      {error && (
                        <div className="flex items-start gap-2 mt-3 rounded-xl bg-red-50 border border-red-200 px-3 py-2.5">
                          <FaTriangleExclamation className="text-red-500 text-xs shrink-0 mt-0.5" />
                          <p className="text-xs text-red-700">{error}</p>
                        </div>
                      )}
                      {saved && (
                        <div className="flex items-center gap-2 mt-3 text-[#15803D] text-sm font-semibold">
                          <FaCircleCheck /> Profile saved!
                        </div>
                      )}

                      <div className="mt-4 flex justify-end gap-2">
                        <button type="button" onClick={() => setEditing(false)} className="px-5 py-2.5 border border-neutral-300 text-neutral-700 rounded-xl text-sm font-medium hover:bg-neutral-50">Cancel</button>
                        <button type="button" onClick={() => { handleSave(); setEditing(false); }} disabled={saving} className="px-5 py-2.5 bg-[#3B5BDB] text-white rounded-xl text-sm font-semibold hover:bg-[#2f4ac2] disabled:opacity-60 flex items-center gap-2">
                          {saving ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Saving…</> : 'Save Changes'}
                        </button>
                      </div>
                    </div>

                    {/* Change password */}
                    <div className="rounded-2xl bg-white border border-neutral-200 p-5">
                      <h3 className="text-sm font-bold text-neutral-900 mb-4">Change Password</h3>
                      <div className="space-y-3">
                        {[
                          { label: 'Current Password', val: curPass, set: setCurPass, key: 'cur' as const },
                          { label: 'New Password',     val: newPass, set: setNewPass, key: 'new' as const },
                          { label: 'Confirm Password', val: confPass, set: setConfPass, key: 'conf' as const },
                        ].map(({ label, val, set, key }) => (
                          <div key={label}>
                            <label className="block text-xs font-medium text-neutral-600 mb-1">{label}</label>
                            <div className="relative">
                              <input type={showPw[key] ? 'text' : 'password'} value={val} onChange={(e) => set(e.target.value)} placeholder="••••••••" disabled={pwSaving} className="w-full px-3 py-2.5 pr-11 border border-neutral-300 rounded-xl text-sm focus:outline-none focus:border-[#3B5BDB] transition-all disabled:bg-neutral-50" />
                              <button type="button" onClick={() => setShowPw((p) => ({ ...p, [key]: !p[key] }))} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 p-1" aria-label={showPw[key] ? 'Hide password' : 'Show password'}>
                                {showPw[key] ? <FaEyeSlash className="w-4 h-4" /> : <FaEye className="w-4 h-4" />}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                      {pwError && (
                        <div className="flex items-start gap-2 mt-3 rounded-xl bg-red-50 border border-red-200 px-3 py-2.5">
                          <FaTriangleExclamation className="text-red-500 text-xs shrink-0 mt-0.5" />
                          <p className="text-xs text-red-700">{pwError}</p>
                        </div>
                      )}
                      {pwSaved && (
                        <div className="flex items-center gap-2 mt-3 text-[#15803D] text-sm font-semibold">
                          <FaCircleCheck /> Password updated!
                        </div>
                      )}
                      <div className="mt-4 flex justify-end">
                        <button type="button" onClick={handlePasswordChange} disabled={pwSaving} className="px-5 py-2.5 bg-[#3B5BDB] text-white rounded-xl text-sm font-semibold hover:bg-[#2f4ac2] transition-colors disabled:opacity-60 flex items-center gap-2">
                          {pwSaving ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Saving…</> : 'Update Password'}
                        </button>
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
