import { useEffect, useState } from 'react';
import {
  FaEye, FaEyeSlash, FaPen,
  FaBuilding, FaIdCard, FaLocationDot, FaTriangleExclamation, FaCircleCheck,
  FaGlobe, FaInstagram,
} from 'react-icons/fa6';
import DashboardHeader from '../../components/DashboardHeader';
import DashboardSidebar from '../../components/DashboardSidebar';
import AppFooter from '../../components/AppFooter';
import Avatar from '../../components/Avatar';
import { api, ApiException } from '../../services/api';
import { useApiQuery } from '../../hooks/useApiQuery';
import { vendorNavLinks } from '../../navigation/dashboardNav';

/** Matches search filter options so vendor type filter works correctly */
const VENDOR_TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: 'all',       label: 'All types' },
  { value: 'equipment', label: 'Equipment' },
  { value: 'lighting', label: 'Lighting' },
  { value: 'transport', label: 'Transport' },
  { value: 'catering', label: 'Catering' },
];

interface VendorProfileData {
  companyName: string;
  vendorType: string;
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
  const [vendorType,    setVendorType]    = useState('');
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

  const [curPass,  setCurPass]  = useState('');
  const [newPass,  setNewPass]  = useState('');
  const [confPass, setConfPass] = useState('');
  const [showPw, setShowPw] = useState<{ cur: boolean; new: boolean; conf: boolean }>({ cur: false, new: false, conf: false });
  const [pwSaving, setPwSaving] = useState(false);
  const [pwError,  setPwError]  = useState<string | null>(null);
  const [pwSaved,  setPwSaved]  = useState(false);

  useEffect(() => {
    if (!me?.profile) return;
    const p = me.profile;
    setCompanyName(p.companyName ?? '');
    setVendorType(p.vendorType ?? '');
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
        vendorType:    (vendorType && vendorType !== '') ? vendorType : 'all',
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
                      <Avatar name={companyName || 'Vendor'} size="lg" />
                    </div>
                    <h2 className="text-base font-bold text-neutral-900 mb-0.5">{companyName || '—'}</h2>
                    <p className="text-xs text-neutral-500 mb-1">
                      {VENDOR_TYPE_OPTIONS.find(o => o.value === vendorType)?.label ?? (vendorType ? String(vendorType) : 'Equipment Vendor')}
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
                          <a href={website} target="_blank" rel="noopener noreferrer" className="text-[#3678F1] hover:underline truncate">{website.replace(/^https?:\/\//, '')}</a>
                        </div>
                      )}
                      {instagramUrl && (
                        <div className="flex items-center gap-2 text-xs text-neutral-500">
                          <FaInstagram className="w-3 h-3 text-neutral-400 shrink-0" />
                          <a href={instagramUrl} target="_blank" rel="noopener noreferrer" className="text-[#3678F1] hover:underline truncate">{instagramUrl.replace(/^https?:\/\//, '')}</a>
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
                      <button type="button" onClick={() => setEditing(true)} className="mt-4 w-full px-4 py-2.5 bg-[#3678F1] text-white rounded-xl text-sm font-semibold hover:bg-[#2c65d4] transition-colors flex items-center justify-center gap-2">
                        <FaPen className="w-3.5 h-3.5" /> Edit Profile
                      </button>
                    )}
                  </div>

                  {!editing ? (
                    <div className="rounded-2xl bg-white border border-neutral-200 p-5">
                      <h3 className="text-sm font-bold text-neutral-900 mb-4">Profile Details</h3>
                      <dl className="space-y-3">
                        <div><dt className="text-xs text-neutral-500 mb-0.5">Business Name</dt><dd className="text-sm font-medium text-neutral-900">{companyName || '—'}</dd></div>
                        <div><dt className="text-xs text-neutral-500 mb-0.5">Equipment type</dt><dd className="text-sm text-neutral-700">{VENDOR_TYPE_OPTIONS.find(o => o.value === vendorType)?.label ?? vendorType ?? '—'}</dd></div>
                        <div><dt className="text-xs text-neutral-500 mb-0.5">Email</dt><dd className="text-sm text-neutral-700">{me?.email ?? '—'}</dd></div>
                        <div><dt className="text-xs text-neutral-500 mb-0.5">Phone</dt><dd className="text-sm text-neutral-700">{me?.phone ?? '—'}</dd></div>
                        <div><dt className="text-xs text-neutral-500 mb-0.5">City</dt><dd className="text-sm text-neutral-700">{locationCity || '—'}</dd></div>
                        <div><dt className="text-xs text-neutral-500 mb-0.5">State</dt><dd className="text-sm text-neutral-700">{locationState || '—'}</dd></div>
                        <div><dt className="text-xs text-neutral-500 mb-0.5">Website</dt><dd className="text-sm text-neutral-700">{website ? <a href={website} target="_blank" rel="noopener noreferrer" className="text-[#3678F1] hover:underline">{website}</a> : '—'}</dd></div>
                        <div><dt className="text-xs text-neutral-500 mb-0.5">Instagram</dt><dd className="text-sm text-neutral-700">{instagramUrl ? <a href={instagramUrl} target="_blank" rel="noopener noreferrer" className="text-[#3678F1] hover:underline">{instagramUrl}</a> : '—'}</dd></div>
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
                            <input type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} disabled={saving} placeholder="Your business name" className="w-full pl-9 pr-3 py-2.5 border border-neutral-300 rounded-xl text-sm focus:outline-none focus:border-[#3678F1] transition-all disabled:bg-neutral-50" />
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-neutral-600 mb-1">Equipment type</label>
                          <select value={vendorType || 'all'} onChange={(e) => setVendorType(e.target.value)} disabled={saving} className="w-full px-3 py-2.5 border border-neutral-300 rounded-xl text-sm focus:outline-none focus:border-[#3678F1] transition-all bg-white disabled:bg-neutral-50">
                            {VENDOR_TYPE_OPTIONS.map(({ value, label }) => (
                              <option key={value} value={value}>{label}</option>
                            ))}
                          </select>
                          <p className="text-[10px] text-neutral-400 mt-0.5">Used in search filters so companies can find you by type</p>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-neutral-600 mb-1">Email (read-only)</label>
                          <input type="email" value={me?.email ?? ''} readOnly className="w-full px-3 py-2.5 border border-neutral-200 rounded-xl text-sm bg-neutral-50 text-neutral-500 cursor-not-allowed" />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-neutral-600 mb-1">City</label>
                            <input type="text" value={locationCity} onChange={(e) => setLocationCity(e.target.value)} disabled={saving} placeholder="e.g., Mumbai" className="w-full px-3 py-2.5 border border-neutral-300 rounded-xl text-sm focus:outline-none focus:border-[#3678F1] transition-all disabled:bg-neutral-50" />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-neutral-600 mb-1">State</label>
                            <input type="text" value={locationState} onChange={(e) => setLocationState(e.target.value)} disabled={saving} placeholder="e.g., Maharashtra" className="w-full px-3 py-2.5 border border-neutral-300 rounded-xl text-sm focus:outline-none focus:border-[#3678F1] transition-all disabled:bg-neutral-50" />
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-neutral-600 mb-1">About / Description</label>
                          <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} disabled={saving} placeholder="Brief description of your business and specialties…" className="w-full px-3 py-2.5 border border-neutral-300 rounded-xl text-sm focus:outline-none focus:border-[#3678F1] transition-all resize-none disabled:bg-neutral-50" />
                          <div className="mt-3">
                            <label className="block text-xs font-medium text-neutral-600 mb-1">About Us</label>
                            <textarea value={aboutUs} onChange={(e) => setAboutUs(e.target.value)} rows={4} disabled={saving} placeholder="Longer company story, services, experience…" className="w-full px-3 py-2.5 border border-neutral-300 rounded-xl text-sm focus:outline-none focus:border-[#3678F1] transition-all resize-none disabled:bg-neutral-50" />
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-neutral-600 mb-1">Website</label>
                          <div className="relative">
                            <FaGlobe className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 w-3.5 h-3.5" />
                            <input type="url" value={website} onChange={(e) => setWebsite(e.target.value)} disabled={saving} placeholder="https://yourcompany.com" className="w-full pl-9 pr-3 py-2.5 border border-neutral-300 rounded-xl text-sm focus:outline-none focus:border-[#3678F1] transition-all disabled:bg-neutral-50" />
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-neutral-600 mb-1">Instagram URL</label>
                          <div className="relative">
                            <FaInstagram className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 w-3.5 h-3.5" />
                            <input type="url" value={instagramUrl} onChange={(e) => setInstagramUrl(e.target.value)} disabled={saving} placeholder="https://instagram.com/yourcompany" className="w-full pl-9 pr-3 py-2.5 border border-neutral-300 rounded-xl text-sm focus:outline-none focus:border-[#3678F1] transition-all disabled:bg-neutral-50" />
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
                        <button type="button" onClick={() => { handleSave(); setEditing(false); }} disabled={saving} className="px-5 py-2.5 bg-[#3678F1] text-white rounded-xl text-sm font-semibold hover:bg-[#2c65d4] disabled:opacity-60 flex items-center gap-2">
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
                              <input type={showPw[key] ? 'text' : 'password'} value={val} onChange={(e) => set(e.target.value)} placeholder="••••••••" disabled={pwSaving} className="w-full px-3 py-2.5 pr-11 border border-neutral-300 rounded-xl text-sm focus:outline-none focus:border-[#3678F1] transition-all disabled:bg-neutral-50" />
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
                        <button type="button" onClick={handlePasswordChange} disabled={pwSaving} className="px-5 py-2.5 bg-[#3678F1] text-white rounded-xl text-sm font-semibold hover:bg-[#2c65d4] transition-colors disabled:opacity-60 flex items-center gap-2">
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
