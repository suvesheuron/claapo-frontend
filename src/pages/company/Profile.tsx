import { useEffect, useState, useRef } from 'react';
import {
  FaBuilding, FaLocationDot, FaIdCard, FaTriangleExclamation, FaCircleCheck,
  FaPen, FaEye, FaEyeSlash, FaGlobe, FaInstagram, FaFileContract, FaCamera,
} from 'react-icons/fa6';
import DashboardHeader from '../../components/DashboardHeader';
import DashboardSidebar from '../../components/DashboardSidebar';
import AppFooter from '../../components/AppFooter';
import Avatar from '../../components/Avatar';
import { api, ApiException } from '../../services/api';
import { useApiQuery } from '../../hooks/useApiQuery';
import { companyNavLinks } from '../../navigation/dashboardNav';
import LocationAutocomplete from '../../components/LocationAutocomplete';

interface CompanyProfileData {
  companyName: string;
  locationCity: string | null;
  locationState: string | null;
  bio: string | null;
  aboutUs: string | null;
  gstNumber: string | null;
  panNumber: string | null;
  companyType: string | null;
  website: string | null;
  instagramUrl: string | null;
  address: string | null;
  isGstVerified: boolean;
}

interface MeResponse {
  id: string;
  email: string;
  phone: string;
  role: string;
  isVerified: boolean;
  profile: CompanyProfileData | null;
}

export default function CompanyProfile() {
  useEffect(() => { document.title = 'Company Profile – Claapo'; }, []);

  const { data: me, loading: meLoading } = useApiQuery<MeResponse>('/profile/me');

  const [companyName,    setCompanyName]    = useState('');
  const [locationCity,   setLocationCity]   = useState('');
  const [locationState,  setLocationState]  = useState('');
  const [address,        setAddress]        = useState('');
  const [bio,            setBio]            = useState('');
  const [aboutUs,        setAboutUs]        = useState('');
  const [companyType,    setCompanyType]    = useState('');
  const [website,        setWebsite]        = useState('');
  const [instagramUrl,   setInstagramUrl]   = useState('');
  const [panNumber,      setPanNumber]      = useState('');

  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const [editing, setEditing] = useState(false);

  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Password change state
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
    const p = me.profile as CompanyProfileData & { avatarUrl?: string; logoUrl?: string };
    if (p.logoUrl || p.avatarUrl) setAvatarUrl(p.logoUrl ?? p.avatarUrl ?? null);
    setCompanyName(p.companyName ?? '');
    setLocationCity(p.locationCity ?? '');
    setLocationState(p.locationState ?? '');
    setAddress(p.address ?? '');
    setBio(p.bio ?? '');
    setAboutUs(p.aboutUs ?? '');
    setCompanyType(p.companyType ?? '');
    setWebsite(p.website ?? '');
    setInstagramUrl(p.instagramUrl ?? '');
    setPanNumber(p.panNumber ?? '');
  }, [me]);

  const handleSave = async () => {
    setError(null); setSaved(false); setSaving(true);
    try {
      await api.patch('/profile/company', {
        companyName: companyName.trim() || undefined,
        locationCity: locationCity.trim() || undefined,
        locationState: locationState.trim() || undefined,
        address: address.trim() || undefined,
        bio: bio.trim() || undefined,
        aboutUs: aboutUs.trim() || undefined,
        companyType: companyType.trim() || undefined,
        website: website.trim() || undefined,
        instagramUrl: instagramUrl.trim() || undefined,
        panNumber: panNumber.trim() || undefined,
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

  const inputClass = 'w-full px-3 py-2.5 border border-neutral-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#3B5BDB]/20 focus:border-[#3B5BDB] transition-all disabled:bg-neutral-50 disabled:text-neutral-400 placeholder:text-neutral-400';
  const inputWithIconClass = 'w-full pl-10 pr-3 py-2.5 border border-neutral-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#3B5BDB]/20 focus:border-[#3B5BDB] transition-all disabled:bg-neutral-50 disabled:text-neutral-400 placeholder:text-neutral-400';
  const readOnlyClass = 'w-full px-3 py-2.5 border border-neutral-100 rounded-xl text-sm bg-neutral-50/80 text-neutral-500 cursor-not-allowed';

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-[#F8F9FB] w-full">
      <DashboardHeader />
      <div className="flex-1 flex min-h-0 overflow-hidden">
        <DashboardSidebar links={companyNavLinks} />
        <main className="flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden">
          <div className="flex-1 min-h-0 overflow-auto">
            <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-6 xl:px-8 py-6">

              <div className="mb-6">
                <h1 className="text-xl font-bold text-neutral-900 tracking-tight">Company Profile</h1>
                <p className="text-sm text-neutral-500 mt-1">Manage your company details and settings</p>
              </div>

              {meLoading ? (
                <div className="animate-pulse space-y-5">
                  <div className="h-52 bg-neutral-200/60 rounded-2xl" />
                  <div className="h-72 bg-neutral-200/60 rounded-2xl" />
                </div>
              ) : (
                <div className="space-y-5 max-w-2xl">

                  {/* Profile card (top) */}
                  <div className="rounded-2xl bg-white border border-neutral-200/80 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                    {/* Gradient banner */}
                    <div className="h-24 bg-gradient-to-br from-[#3B5BDB] via-[#5B7CF7] to-[#8B9CF7] relative">
                      <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.3) 0%, transparent 50%), radial-gradient(circle at 80% 30%, rgba(255,255,255,0.2) 0%, transparent 50%)' }} />
                    </div>
                    <div className="px-6 pb-6">
                      {/* Avatar overlapping the banner */}
                      <div className="flex justify-center -mt-10 mb-4">
                        <div className="relative group cursor-pointer ring-4 ring-white rounded-full shadow-lg" onClick={() => fileInputRef.current?.click()}>
                          <Avatar src={avatarUrl ?? undefined} name={companyName || 'Co'} size="lg" />
                          <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            {avatarUploading
                              ? <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                              : <FaCamera className="text-white text-sm" />}
                          </div>
                          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                        </div>
                      </div>
                      <div className="text-center">
                        <h2 className="text-lg font-bold text-neutral-900 tracking-tight">{companyName || '—'}</h2>
                        <p className="text-xs text-neutral-500 mt-0.5">Production Company</p>
                        {me?.isVerified && (
                          <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold mt-2 border border-emerald-200/60">
                            <FaCircleCheck className="w-2.5 h-2.5" /> Verified
                          </span>
                        )}
                      </div>
                      <div className="mt-5 pt-5 border-t border-neutral-100 space-y-2.5">
                        {companyType && (
                          <div className="flex items-center gap-3 text-sm text-neutral-600">
                            <div className="w-7 h-7 rounded-lg bg-neutral-100 flex items-center justify-center shrink-0">
                              <FaBuilding className="w-3 h-3 text-neutral-500" />
                            </div>
                            <span>{companyType}</span>
                          </div>
                        )}
                        {locationCity && (
                          <div className="flex items-center gap-3 text-sm text-neutral-600">
                            <div className="w-7 h-7 rounded-lg bg-neutral-100 flex items-center justify-center shrink-0">
                              <FaLocationDot className="w-3 h-3 text-neutral-500" />
                            </div>
                            <span>{locationCity}{locationState ? `, ${locationState}` : ''}</span>
                          </div>
                        )}
                        {website && (
                          <div className="flex items-center gap-3 text-sm text-neutral-600">
                            <div className="w-7 h-7 rounded-lg bg-neutral-100 flex items-center justify-center shrink-0">
                              <FaGlobe className="w-3 h-3 text-neutral-500" />
                            </div>
                            <a href={website} target="_blank" rel="noopener noreferrer" className="text-[#3B5BDB] hover:underline truncate">{website.replace(/^https?:\/\//, '')}</a>
                          </div>
                        )}
                        {instagramUrl && (
                          <div className="flex items-center gap-3 text-sm text-neutral-600">
                            <div className="w-7 h-7 rounded-lg bg-neutral-100 flex items-center justify-center shrink-0">
                              <FaInstagram className="w-3 h-3 text-neutral-500" />
                            </div>
                            <a href={instagramUrl} target="_blank" rel="noopener noreferrer" className="text-[#3B5BDB] hover:underline truncate">{instagramUrl.replace(/^https?:\/\//, '')}</a>
                          </div>
                        )}
                        {profile?.gstNumber && (
                          <div className="flex items-center gap-3 text-sm text-neutral-600">
                            <div className="w-7 h-7 rounded-lg bg-neutral-100 flex items-center justify-center shrink-0">
                              <FaIdCard className="w-3 h-3 text-neutral-500" />
                            </div>
                            <span className="font-mono text-xs">GST: {profile.gstNumber}{profile.isGstVerified ? ' ✓' : ''}</span>
                          </div>
                        )}
                        {me?.email && (
                          <div className="flex items-center gap-3 text-sm text-neutral-600">
                            <div className="w-7 h-7 rounded-lg bg-neutral-100 flex items-center justify-center shrink-0">
                              <FaBuilding className="w-3 h-3 text-neutral-500" />
                            </div>
                            <span className="truncate">{me.email}</span>
                          </div>
                        )}
                        {(bio || aboutUs) && (
                          <div className="mt-3 p-3 rounded-xl bg-neutral-50/80 border border-neutral-100">
                            <span className="text-xs font-semibold text-neutral-700 block mb-1">About us</span>
                            <span className="text-sm text-neutral-600 leading-relaxed line-clamp-2">{aboutUs || bio}</span>
                          </div>
                        )}
                      </div>
                      {!editing && (
                        <button type="button" onClick={() => setEditing(true)} className="mt-5 w-full px-4 py-2.5 bg-[#3B5BDB] text-white rounded-xl text-sm font-semibold hover:bg-[#2f4ac2] active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-sm shadow-[#3B5BDB]/20">
                          <FaPen className="w-3.5 h-3.5" /> Edit Profile
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Profile Details (below profile card) — read-only, no Edit button */}
                  {!editing ? (
                    <div className="rounded-2xl bg-white border border-neutral-200/80 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                      <div className="px-6 py-4 border-b border-neutral-100">
                        <h3 className="text-sm font-bold text-neutral-900">Profile Details</h3>
                        <p className="text-xs text-neutral-400 mt-0.5">Your company information at a glance</p>
                      </div>
                      <dl className="divide-y divide-neutral-50">
                        {[
                          { label: 'Company Name', value: companyName || '—', bold: true },
                          { label: 'Company Type', value: companyType || '—' },
                          { label: 'Email', value: me?.email ?? '—' },
                          { label: 'Phone', value: me?.phone ?? '—' },
                          { label: 'City', value: locationCity || '—' },
                          { label: 'State', value: locationState || '—' },
                          { label: 'Address', value: address || '—', wrap: true },
                          { label: 'PAN Number', value: panNumber || '—', mono: true },
                        ].map(({ label, value, bold, wrap, mono }) => (
                          <div key={label} className="px-6 py-3 flex items-start gap-4 even:bg-neutral-50/40">
                            <dt className="text-xs font-medium text-neutral-500 w-32 shrink-0 pt-0.5">{label}</dt>
                            <dd className={`text-sm text-neutral-800 ${bold ? 'font-semibold' : ''} ${wrap ? 'whitespace-pre-wrap' : ''} ${mono ? 'font-mono' : ''}`}>{value}</dd>
                          </div>
                        ))}
                        <div className="px-6 py-3 flex items-start gap-4">
                          <dt className="text-xs font-medium text-neutral-500 w-32 shrink-0 pt-0.5">Website</dt>
                          <dd className="text-sm text-neutral-800">{website ? <a href={website} target="_blank" rel="noopener noreferrer" className="text-[#3B5BDB] hover:underline">{website}</a> : '—'}</dd>
                        </div>
                        <div className="px-6 py-3 flex items-start gap-4 even:bg-neutral-50/40">
                          <dt className="text-xs font-medium text-neutral-500 w-32 shrink-0 pt-0.5">Instagram</dt>
                          <dd className="text-sm text-neutral-800">{instagramUrl ? <a href={instagramUrl} target="_blank" rel="noopener noreferrer" className="text-[#3B5BDB] hover:underline">{instagramUrl}</a> : '—'}</dd>
                        </div>
                        <div className="px-6 py-3 flex items-start gap-4">
                          <dt className="text-xs font-medium text-neutral-500 w-32 shrink-0 pt-0.5">GST Number</dt>
                          <dd className="text-sm text-neutral-800 font-mono flex items-center gap-2">{profile?.gstNumber || '—'}{profile?.isGstVerified && <span className="text-[10px] px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full font-semibold border border-emerald-200/60">Verified</span>}</dd>
                        </div>
                        <div className="px-6 py-3 flex items-start gap-4 even:bg-neutral-50/40">
                          <dt className="text-xs font-medium text-neutral-500 w-32 shrink-0 pt-0.5">About</dt>
                          <dd className="text-sm text-neutral-800 whitespace-pre-wrap">{bio || '—'}</dd>
                        </div>
                        <div className="px-6 py-3 flex items-start gap-4">
                          <dt className="text-xs font-medium text-neutral-500 w-32 shrink-0 pt-0.5">About Us</dt>
                          <dd className="text-sm text-neutral-800 whitespace-pre-wrap">{aboutUs || '—'}</dd>
                        </div>
                      </dl>
                    </div>
                  ) : (
                      <>
                    {/* Company info — edit form */}
                    <div className="rounded-2xl bg-white border border-neutral-200/80 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                      <div className="px-6 py-4 border-b border-neutral-100 flex items-center justify-between">
                        <div>
                          <h3 className="text-sm font-bold text-neutral-900">Company Information</h3>
                          <p className="text-xs text-neutral-400 mt-0.5">Update your company details below</p>
                        </div>
                        <button type="button" onClick={() => setEditing(false)} className="text-xs text-neutral-500 hover:text-neutral-700 font-medium px-3 py-1.5 rounded-lg hover:bg-neutral-100 transition-colors">Cancel</button>
                      </div>
                      <div className="p-6 space-y-5">
                        {/* Basic Info Section */}
                        <div>
                          <h4 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-3">Basic Info</h4>
                          <div className="space-y-3">
                            <div>
                              <label className="block text-xs font-medium text-neutral-700 mb-1.5">Company Name</label>
                              <div className="relative">
                                <FaBuilding className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 w-3.5 h-3.5" />
                                <input type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} disabled={saving} placeholder="Your company name" className={inputWithIconClass} />
                              </div>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-neutral-700 mb-1.5">Email <span className="text-neutral-400">(read-only)</span></label>
                              <input type="email" value={me?.email ?? ''} readOnly className={readOnlyClass} />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-neutral-700 mb-1.5">Phone <span className="text-neutral-400">(read-only)</span></label>
                              <input type="tel" value={me?.phone ?? ''} readOnly className={readOnlyClass} />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-neutral-700 mb-1.5">Company Type</label>
                              <input type="text" value={companyType} onChange={(e) => setCompanyType(e.target.value)} disabled={saving} placeholder="e.g., Production House, Ad Agency, OTT" className={inputClass} />
                            </div>
                          </div>
                        </div>

                        {/* Divider */}
                        <div className="border-t border-neutral-100" />

                        {/* Location Section */}
                        <div>
                          <h4 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-3">Location</h4>
                          <div className="space-y-3">
                            <LocationAutocomplete
                              label="Location"
                              city={locationCity}
                              state={locationState}
                              disabled={saving}
                              onSelect={(loc) => { setLocationCity(loc.city); setLocationState(loc.state); }}
                              placeholder="Search city or pin code..."
                            />
                            <div className="grid grid-cols-2 gap-3" style={{ display: 'none' }}>
                              {/* Hidden — kept for form compatibility */}
                              <div></div>
                              <div></div>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-neutral-700 mb-1.5">Address</label>
                              <textarea value={address} onChange={(e) => setAddress(e.target.value)} rows={2} disabled={saving} placeholder="Office address..." className={`${inputClass} resize-none`} />
                            </div>
                          </div>
                        </div>

                        {/* Divider */}
                        <div className="border-t border-neutral-100" />

                        {/* About Section */}
                        <div>
                          <h4 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-3">About</h4>
                          <div className="space-y-3">
                            <div>
                              <label className="block text-xs font-medium text-neutral-700 mb-1.5">About / Description</label>
                              <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} disabled={saving} placeholder="Brief description of your company..." className={`${inputClass} resize-none`} />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-neutral-700 mb-1.5">About Us</label>
                              <textarea value={aboutUs} onChange={(e) => setAboutUs(e.target.value)} rows={4} disabled={saving} placeholder="Longer company story, values, team..." className={`${inputClass} resize-none`} />
                            </div>
                          </div>
                        </div>

                        {/* Divider */}
                        <div className="border-t border-neutral-100" />

                        {/* Links & Documents Section */}
                        <div>
                          <h4 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-3">Links & Documents</h4>
                          <div className="space-y-3">
                            <div>
                              <label className="block text-xs font-medium text-neutral-700 mb-1.5">Website</label>
                              <div className="relative">
                                <FaGlobe className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 w-3.5 h-3.5" />
                                <input type="url" value={website} onChange={(e) => setWebsite(e.target.value)} disabled={saving} placeholder="https://yourcompany.com" className={inputWithIconClass} />
                              </div>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-neutral-700 mb-1.5">Instagram URL</label>
                              <div className="relative">
                                <FaInstagram className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 w-3.5 h-3.5" />
                                <input type="url" value={instagramUrl} onChange={(e) => setInstagramUrl(e.target.value)} disabled={saving} placeholder="https://instagram.com/yourcompany" className={inputWithIconClass} />
                              </div>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-neutral-700 mb-1.5">PAN Number</label>
                              <div className="relative">
                                <FaFileContract className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 w-3.5 h-3.5" />
                                <input type="text" value={panNumber} onChange={(e) => setPanNumber(e.target.value.toUpperCase())} disabled={saving} placeholder="AAAAA1234A" maxLength={10} className={`${inputWithIconClass} font-mono`} />
                              </div>
                            </div>
                            {profile?.gstNumber && (
                              <div>
                                <label className="block text-xs font-medium text-neutral-700 mb-1.5">GST Number <span className="text-neutral-400">(read-only)</span></label>
                                <div className="relative">
                                  <FaIdCard className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 w-3.5 h-3.5" />
                                  <input type="text" value={profile.gstNumber} readOnly className={`${readOnlyClass} pl-10`} />
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Error / Success */}
                      {error && (
                        <div className="mx-6 mb-4 flex items-start gap-2.5 rounded-xl bg-red-50 border border-red-200/80 px-4 py-3">
                          <FaTriangleExclamation className="text-red-500 text-xs shrink-0 mt-0.5" />
                          <p className="text-sm text-red-700">{error}</p>
                        </div>
                      )}
                      {saved && (
                        <div className="mx-6 mb-4 flex items-center gap-2 text-emerald-700 bg-emerald-50 border border-emerald-200/60 rounded-xl px-4 py-3 text-sm font-semibold">
                          <FaCircleCheck /> Profile saved!
                        </div>
                      )}

                      {/* Action buttons */}
                      <div className="px-6 py-4 border-t border-neutral-100 bg-neutral-50/50 flex justify-end gap-3">
                        <button type="button" onClick={() => setEditing(false)} className="px-5 py-2.5 border border-neutral-200 text-neutral-700 rounded-xl text-sm font-medium hover:bg-neutral-100 transition-colors">Cancel</button>
                        <button type="button" onClick={() => { handleSave(); setEditing(false); }} disabled={saving} className="px-5 py-2.5 bg-[#3B5BDB] text-white rounded-xl text-sm font-semibold hover:bg-[#2f4ac2] active:scale-[0.98] transition-all disabled:opacity-60 flex items-center gap-2 shadow-sm shadow-[#3B5BDB]/20">
                          {saving ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Saving...</> : 'Save Changes'}
                        </button>
                      </div>
                    </div>

                    {/* Change password */}
                    <div className="rounded-2xl bg-white border border-neutral-200/80 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                      <div className="px-6 py-4 border-b border-neutral-100">
                        <h3 className="text-sm font-bold text-neutral-900">Change Password</h3>
                        <p className="text-xs text-neutral-400 mt-0.5">Update your account password</p>
                      </div>
                      <div className="p-6 space-y-3">
                        {[
                          { label: 'Current Password', val: curPass, set: setCurPass, key: 'cur' as const },
                          { label: 'New Password',     val: newPass, set: setNewPass, key: 'new' as const },
                          { label: 'Confirm Password', val: confPass, set: setConfPass, key: 'conf' as const },
                        ].map(({ label, val, set, key }) => (
                          <div key={label}>
                            <label className="block text-xs font-medium text-neutral-700 mb-1.5">{label}</label>
                            <div className="relative">
                              <input type={showPw[key] ? 'text' : 'password'} value={val} onChange={(e) => set(e.target.value)} placeholder="••••••••" disabled={pwSaving} className={`${inputClass} pr-11`} />
                              <button type="button" onClick={() => setShowPw((p) => ({ ...p, [key]: !p[key] }))} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 p-1 rounded-md hover:bg-neutral-100 transition-colors" aria-label={showPw[key] ? 'Hide password' : 'Show password'}>
                                {showPw[key] ? <FaEyeSlash className="w-4 h-4" /> : <FaEye className="w-4 h-4" />}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                      {pwError && (
                        <div className="mx-6 mb-4 flex items-start gap-2.5 rounded-xl bg-red-50 border border-red-200/80 px-4 py-3">
                          <FaTriangleExclamation className="text-red-500 text-xs shrink-0 mt-0.5" />
                          <p className="text-sm text-red-700">{pwError}</p>
                        </div>
                      )}
                      {pwSaved && (
                        <div className="mx-6 mb-4 flex items-center gap-2 text-emerald-700 bg-emerald-50 border border-emerald-200/60 rounded-xl px-4 py-3 text-sm font-semibold">
                          <FaCircleCheck /> Password updated!
                        </div>
                      )}
                      <div className="px-6 py-4 border-t border-neutral-100 bg-neutral-50/50 flex justify-end">
                        <button type="button" onClick={handlePasswordChange} disabled={pwSaving} className="px-5 py-2.5 bg-[#3B5BDB] text-white rounded-xl text-sm font-semibold hover:bg-[#2f4ac2] active:scale-[0.98] transition-all disabled:opacity-60 flex items-center gap-2 shadow-sm shadow-[#3B5BDB]/20">
                          {pwSaving ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Saving...</> : 'Update Password'}
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
