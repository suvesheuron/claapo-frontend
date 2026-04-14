import { useEffect, useState, useRef } from 'react';
import {
  FaEye, FaEyeSlash, FaPen, FaBuilding, FaIdCard, FaLocationDot,
  FaTriangleExclamation, FaCircleCheck, FaGlobe, FaCamera,
  FaUser, FaEnvelope, FaPhone,
  FaBox,
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
import { 
  ProfileSection, InfoRow, EditableField, SocialLinks,
  ProfileCompletionBadge,
} from '../../components/profile/ProfileComponents';
import { 
  calculateVendorCompletion, getProfileImprovementTips 
} from '../../utils/profileCompletion';

interface VendorProfileData {
  companyName: string;
  vendorType: string;
  vendorServiceCategory?: string | null;
  locationCity: string | null;
  locationState: string | null;
  bio: string | null;
  aboutUs: string | null;
  website: string | null;
  imdbUrl?: string | null;
  instagramUrl: string | null;
  youtubeUrl: string | null;
  vimeoUrl?: string | null;
  address?: string | null;
  panNumber?: string | null;
  upiId?: string | null;
  bankAccountName?: string | null;
  bankAccountNumber?: string | null;
  ifscCode?: string | null;
  bankName?: string | null;
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

  const [companyName, setCompanyName] = useState('');
  const [vendorServiceCategory, setVendorServiceCategory] = useState('');
  const [locationCity, setLocationCity] = useState('');
  const [locationState, setLocationState] = useState('');
  const [bio, setBio] = useState('');
  const [aboutUs, setAboutUs] = useState('');
  const [website, setWebsite] = useState('');
  const [imdbUrl, setImdbUrl] = useState('');
  const [instagramUrl, setInstagramUrl] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [vimeoUrl, setVimeoUrl] = useState('');
  const [address, setAddress] = useState('');
  const [panNumber, setPanNumber] = useState('');
  const [upiId, setUpiId] = useState('');
  const [bankAccountName, setBankAccountName] = useState('');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [bankName, setBankName] = useState('');

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [curPass, setCurPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confPass, setConfPass] = useState('');
  const [showPw, setShowPw] = useState<{ cur: boolean; new: boolean; conf: boolean }>({ cur: false, new: false, conf: false });
  const [pwSaving, setPwSaving] = useState(false);
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwSaved, setPwSaved] = useState(false);

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
    setImdbUrl(p.imdbUrl ?? '');
    setInstagramUrl(p.instagramUrl ?? '');
    setYoutubeUrl(p.youtubeUrl ?? '');
    setVimeoUrl(p.vimeoUrl ?? '');
    setAddress(p.address ?? '');
    setPanNumber(p.panNumber ?? '');
    setUpiId(p.upiId ?? '');
    setBankAccountName(p.bankAccountName ?? '');
    setBankAccountNumber(p.bankAccountNumber ?? '');
    setIfscCode(p.ifscCode ?? '');
    setBankName(p.bankName ?? '');
  }, [me]);

  const handleSave = async () => {
    setError(null); setSaved(false);
    if (!address.trim()) {
      setError('Address is required for invoices.');
      return;
    }
    setSaving(true);
    try {
      await api.patch('/profile/vendor', {
        companyName: companyName.trim() || undefined,
        vendorType: vendorCategoryToVendorType(vendorServiceCategory || 'all'),
        vendorServiceCategory: vendorServiceCategory.trim() || undefined,
        locationCity: locationCity.trim() || undefined,
        locationState: locationState.trim() || undefined,
        bio: bio.trim() || undefined,
        aboutUs: aboutUs.trim() || undefined,
        website: website.trim() || undefined,
        imdbUrl: imdbUrl.trim() || undefined,
        instagramUrl: instagramUrl.trim() || undefined,
        youtubeUrl: youtubeUrl.trim() || undefined,
        vimeoUrl: vimeoUrl.trim() || undefined,
        address: address.trim() || undefined,
        panNumber: panNumber.trim() || undefined,
        upiId: upiId.trim() || undefined,
        bankAccountName: bankAccountName.trim() || undefined,
        bankAccountNumber: bankAccountNumber.trim() || undefined,
        ifscCode: ifscCode.trim() || undefined,
        bankName: bankName.trim() || undefined,
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

  // Calculate profile completion
  const profileCompletion = me?.profile ? calculateVendorCompletion({
    ...me.profile,
    avatarUrl,
    vendorServiceCategory: me.profile.vendorServiceCategory ?? null,
  }) : 0;
  
  const improvementTips = me?.profile ? getProfileImprovementTips('vendor', { 
    ...me.profile, 
    avatarUrl,
    vendorServiceCategory: me.profile.vendorServiceCategory ?? null,
  }) : [];

  const profile = me?.profile;

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-[#F3F4F6] w-full">
      <DashboardHeader />
      <div className="flex-1 flex min-h-0 overflow-hidden">
        <DashboardSidebar links={vendorNavLinks} />
        <main className="flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden">
          <div className="flex-1 min-h-0 overflow-auto">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-6 xl:px-8 py-6">

              <div className="mb-6">
                <h1 className="text-2xl font-bold text-neutral-900">Vendor Profile</h1>
                <p className="text-sm text-neutral-600 mt-1">Manage your business profile, equipment, and settings</p>
              </div>

              {meLoading ? (
                <div className="animate-pulse space-y-6">
                  <div className="h-64 bg-neutral-200 rounded-2xl" />
                  <div className="h-96 bg-neutral-200 rounded-2xl" />
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* Left Sidebar - Profile Card & Completion */}
                  <div className="lg:col-span-1 space-y-6">
                    {/* Profile Card */}
                    <div className="rounded-2xl bg-white border border-neutral-200 shadow-sm overflow-hidden">
                      {/* Gradient Banner */}
                      <div className="h-32 bg-gradient-to-br from-brand-primary via-brand-primary/90 to-brand-primary/80 relative overflow-hidden">
                        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.3) 0%, transparent 50%), radial-gradient(circle at 80% 30%, rgba(255,255,255,0.2) 0%, transparent 50%)' }} />
                      </div>
                      
                      {/* Avatar */}
                      <div className="flex justify-center -mt-14 mb-4">
                        <div className="relative group cursor-pointer ring-4 ring-white rounded-full shadow-lg" onClick={() => fileInputRef.current?.click()}>
                          <Avatar src={avatarUrl ?? undefined} name={companyName || 'Vendor'} size="lg" />
                          <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            {avatarUploading
                              ? <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                              : <FaCamera className="text-white text-sm" />}
                          </div>
                          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                        </div>
                      </div>

                      {/* Info */}
                      <div className="px-6 pb-6 text-center">
                        <h2 className="text-xl font-bold text-neutral-900">{companyName || '—'}</h2>
                        <p className="text-sm text-neutral-500 mt-1">{vendorServiceCategory || 'Vendor'}</p>
                        {me?.isVerified && (
                          <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 font-semibold mt-2 border border-emerald-200/60">
                            <FaCircleCheck className="w-3 h-3" /> Verified Vendor
                          </span>
                        )}
                        {profile?.isGstVerified && (
                          <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1 rounded-full bg-blue-50 text-blue-700 font-semibold mt-2 border border-blue-200/60">
                            <FaIdCard className="w-3 h-3" /> GST Verified
                          </span>
                        )}
                        
                        {/* Location */}
                        {locationCity && (
                          <div className="flex items-center justify-center gap-1.5 text-xs text-neutral-500 mt-3">
                            <FaLocationDot className="w-3.5 h-3.5" />
                            <span>{locationCity}{locationState ? `, ${locationState}` : ''}</span>
                          </div>
                        )}

                        {/* Edit Button */}
                        {!editing && (
                          <button 
                            type="button" 
                            onClick={() => setEditing(true)} 
                            className="mt-5 w-full px-4 py-2.5 bg-brand-primary text-white rounded-xl text-sm font-semibold hover:bg-brand-primary/90 transition-colors flex items-center justify-center gap-2 shadow-sm"
                          >
                            <FaPen className="w-3.5 h-3.5" /> Edit Profile
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Profile Completion */}
                    <div className="rounded-2xl bg-white border border-neutral-200 shadow-sm p-5">
                      <ProfileCompletionBadge percentage={profileCompletion} size="lg" />
                      {improvementTips.length > 0 && editing && (
                        <div className="mt-4 space-y-2">
                          <p className="text-xs font-semibold text-neutral-700">Quick Tips:</p>
                          <ul className="space-y-1.5">
                            {improvementTips.slice(0, 3).map((tip, idx) => (
                              <li key={idx} className="flex items-start gap-2 text-xs text-neutral-600">
                                <span className="text-brand-primary mt-0.5">•</span>
                                {tip}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    {/* Quick Stats */}
                    <div className="rounded-2xl bg-white border border-neutral-200 shadow-sm p-5 space-y-3">
                      <div className="flex items-center gap-3 text-sm text-neutral-600">
                        <div className="w-8 h-8 rounded-lg bg-brand-primary/10 flex items-center justify-center shrink-0">
                          <FaBox className="w-4 h-4 text-brand-primary" />
                        </div>
                        <div>
                          <p className="text-xs text-neutral-500">Equipment</p>
                          <p className="font-semibold text-neutral-900">Manage in Equipment</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-neutral-600">
                        <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
                          <FaCircleCheck className="w-4 h-4 text-emerald-600" />
                        </div>
                        <div>
                          <p className="text-xs text-neutral-500">GST Status</p>
                          <p className="font-semibold text-neutral-900">{profile?.isGstVerified ? 'Verified' : 'Not Verified'}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Main Content */}
                  <div className="lg:col-span-2 space-y-6">
                    
                    {!editing ? (
                      <>
                        {/* Business Information */}
                        <ProfileSection 
                          title="Business Information" 
                          icon={<FaBuilding />}
                        >
                          <div className="space-y-1">
                            <InfoRow label="Business Name" value={companyName || '—'} icon={<FaBuilding />} />
                            <InfoRow label="Service Category" value={vendorServiceCategory || '—'} icon={<FaBox />} />
                            <InfoRow label="Email" value={me?.email ?? '—'} icon={<FaEnvelope />} />
                            <InfoRow label="Phone" value={me?.phone ?? '—'} icon={<FaPhone />} />
                            <InfoRow label="Location" value={locationCity ? `${locationCity}${locationState ? `, ${locationState}` : ''}` : '—'} icon={<FaLocationDot />} />
                            <InfoRow label="Address" value={address || '—'} />
                          </div>
                        </ProfileSection>

                        {/* About Business */}
                        <ProfileSection 
                          title="About Business" 
                          icon={<FaUser />}
                        >
                          <div className="space-y-4">
                            <div>
                              <dt className="text-xs font-medium text-neutral-500 mb-1">Bio / Description</dt>
                              <dd className="text-sm text-neutral-700 whitespace-pre-wrap">{bio || '—'}</dd>
                            </div>
                            <div>
                              <dt className="text-xs font-medium text-neutral-500 mb-1">About Us</dt>
                              <dd className="text-sm text-neutral-700 whitespace-pre-wrap">{aboutUs || '—'}</dd>
                            </div>
                          </div>
                        </ProfileSection>

                        {/* Social Links */}
                        <ProfileSection 
                          title="Online Presence" 
                          icon={<FaGlobe />}
                        >
                          <SocialLinks links={{
                            website: website || null,
                            instagramUrl: instagramUrl || null,
                            youtubeUrl: youtubeUrl || null,
                            vimeoUrl: vimeoUrl || null,
                            imdbUrl: imdbUrl || null,
                          }} />
                        </ProfileSection>

                        {/* Verification & Tax */}
                        <ProfileSection 
                          title="Verification & Tax Details" 
                          icon={<FaIdCard />}
                        >
                          <div className="space-y-1">
                            <InfoRow 
                              label="GST Number" 
                              value={
                                <div className="flex items-center gap-2">
                                  <span className="font-mono">{profile?.gstNumber || '—'}</span>
                                  {profile?.isGstVerified && (
                                    <span className="text-[10px] px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full font-semibold border border-emerald-200/60">
                                      Verified
                                    </span>
                                  )}
                                </div>
                              } 
                              icon={<FaIdCard />}
                              copyable
                            />
                            <InfoRow label="PAN" value={panNumber || '—'} copyable />
                            <InfoRow label="UPI ID" value={profile?.upiId || '—'} copyable />
                            <InfoRow label="Bank" value={bankName || '—'} />
                            <InfoRow label="Account" value={bankAccountNumber || '—'} copyable />
                            <InfoRow label="IFSC" value={ifscCode || '—'} copyable />
                          </div>
                        </ProfileSection>

                        {/* Change Password */}
                        <ProfileSection 
                          title="Security" 
                          icon={<FaEye />}
                        >
                          <button
                            type="button"
                            onClick={() => setShowPasswordSection(!showPasswordSection)}
                            className="text-sm text-brand-primary font-medium hover:text-brand-primary/80 flex items-center gap-2"
                          >
                            {showPasswordSection ? 'Hide' : 'Change'} Password
                            <FaPen className="w-3.5 h-3.5" />
                          </button>
                          
                          {showPasswordSection && (
                            <div className="mt-4 space-y-3">
                              {[
                                { label: 'Current Password', val: curPass, set: setCurPass, key: 'cur' as const },
                                { label: 'New Password', val: newPass, set: setNewPass, key: 'new' as const },
                                { label: 'Confirm Password', val: confPass, set: setConfPass, key: 'conf' as const },
                              ].map(({ label, val, set, key }) => (
                                <div key={label}>
                                  <label className="block text-xs font-medium text-neutral-700 mb-1.5">{label}</label>
                                  <div className="relative">
                                    <input 
                                      type={showPw[key] ? 'text' : 'password'} 
                                      value={val} 
                                      onChange={(e) => set(e.target.value)} 
                                      placeholder="••••••••" 
                                      disabled={pwSaving}
                                      className="w-full px-3 py-2.5 pr-11 border border-neutral-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary disabled:bg-neutral-50"
                                    />
                                    <button 
                                      type="button" 
                                      onClick={() => setShowPw((p) => ({ ...p, [key]: !p[key] }))} 
                                      className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 p-1"
                                    >
                                      {showPw[key] ? <FaEyeSlash className="w-4 h-4" /> : <FaEye className="w-4 h-4" />}
                                    </button>
                                  </div>
                                </div>
                              ))}
                              {pwError && (
                                <div className="flex items-start gap-2 rounded-xl bg-red-50 border border-red-200 px-3 py-2.5">
                                  <FaTriangleExclamation className="text-red-500 text-xs shrink-0 mt-0.5" />
                                  <p className="text-xs text-red-700">{pwError}</p>
                                </div>
                              )}
                              {pwSaved && (
                                <div className="flex items-center gap-2 text-emerald-700 text-sm font-semibold">
                                  <FaCircleCheck /> Password updated!
                                </div>
                              )}
                              <div className="flex justify-end">
                                <button 
                                  type="button" 
                                  onClick={handlePasswordChange} 
                                  disabled={pwSaving}
                                  className="px-5 py-2.5 bg-brand-primary text-white rounded-xl text-sm font-semibold hover:bg-brand-primary/90 transition-colors disabled:opacity-60"
                                >
                                  {pwSaving ? 'Updating…' : 'Update Password'}
                                </button>
                              </div>
                            </div>
                          )}
                        </ProfileSection>
                      </>
                    ) : (
                      <>
                        {/* Edit Mode */}
                        {error && (
                          <div className="flex items-start gap-2 rounded-xl bg-red-50 border border-red-200 px-4 py-3">
                            <FaTriangleExclamation className="text-red-500 text-sm shrink-0 mt-0.5" />
                            <p className="text-sm text-red-700">{error}</p>
                          </div>
                        )}
                        {saved && (
                          <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-emerald-700 text-sm font-semibold">
                            <FaCircleCheck /> Profile saved successfully!
                          </div>
                        )}

                        {/* Business Information */}
                        <ProfileSection 
                          title="Business Information" 
                          icon={<FaBuilding />}
                        >
                          <div className="space-y-4">
                            <EditableField
                              label="Business Name"
                              value={companyName}
                              onChange={setCompanyName}
                              placeholder="Your business name"
                              disabled={saving}
                              icon={<FaBuilding />}
                              required
                            />
                            <div>
                              <label className="block text-xs font-medium text-neutral-700 mb-1.5">
                                Service Category
                                <span className="text-neutral-400 font-normal ml-2">(This determines how you appear in search)</span>
                              </label>
                              <select 
                                value={vendorServiceCategory} 
                                onChange={(e) => setVendorServiceCategory(e.target.value)} 
                                disabled={saving}
                                className="w-full px-3 py-2.5 border border-neutral-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary disabled:bg-neutral-50 bg-white"
                              >
                                <option value="">Select category…</option>
                                {REGISTRATION_VENDOR_CATEGORIES.map((c) => (
                                  <option key={c} value={c}>{c}</option>
                                ))}
                              </select>
                            </div>
                            <EditableField
                              label="Email"
                              value={me?.email ?? ''}
                              onChange={() => {}}
                              readOnly
                              readOnlyReason="read-only"
                              type="email"
                              disabled={saving}
                              icon={<FaEnvelope />}
                            />
                            <EditableField
                              label="Phone"
                              value={me?.phone ?? ''}
                              onChange={() => {}}
                              readOnly
                              readOnlyReason="read-only"
                              type="tel"
                              disabled={saving}
                              icon={<FaPhone />}
                            />
                            <LocationAutocomplete
                              label="Location"
                              city={locationCity}
                              state={locationState}
                              disabled={saving}
                              onSelect={(loc) => { setLocationCity(loc.city); setLocationState(loc.state); }}
                              placeholder="Search city or pin code..."
                            />
                            <EditableField
                              label="Address (required for invoices)"
                              type="textarea"
                              rows={2}
                              value={address}
                              onChange={setAddress}
                              placeholder="Full business address"
                              disabled={saving}
                              icon={<FaLocationDot />}
                            />
                          </div>
                        </ProfileSection>

                        {/* About Business */}
                        <ProfileSection 
                          title="About Business" 
                          icon={<FaUser />}
                        >
                          <div className="space-y-4">
                            <EditableField
                              label="Bio / Short Description"
                              type="textarea"
                              rows={3}
                              value={bio}
                              onChange={setBio}
                              placeholder="Brief description of your business, specialties, and services..."
                              disabled={saving}
                              helpText="Describe what makes your business unique"
                            />
                            <EditableField
                              label="About Us"
                              type="textarea"
                              rows={4}
                              value={aboutUs}
                              onChange={setAboutUs}
                              placeholder="Tell your business story, experience, values, and what clients can expect..."
                              disabled={saving}
                            />
                          </div>
                        </ProfileSection>

                        {/* Social Links */}
                        <ProfileSection 
                          title="Online Presence" 
                          icon={<FaGlobe />}
                        >
                          <SocialLinks 
                            links={{
                              website,
                              instagramUrl,
                              youtubeUrl,
                              vimeoUrl,
                              imdbUrl,
                            }}
                            editable
                            onChange={(field, value) => {
                              if (field === 'website') setWebsite(value);
                              if (field === 'instagramUrl') setInstagramUrl(value);
                              if (field === 'youtubeUrl') setYoutubeUrl(value);
                              if (field === 'vimeoUrl') setVimeoUrl(value);
                              if (field === 'imdbUrl') setImdbUrl(value);
                            }}
                            disabled={saving}
                          />
                        </ProfileSection>

                        {/* Verification & Tax */}
                        <ProfileSection 
                          title="Verification & Tax Details" 
                          icon={<FaIdCard />}
                        >
                          <div className="space-y-4">
                            <div>
                              <label className="block text-xs font-medium text-neutral-700 mb-1.5">
                                GST Number
                                {profile?.isGstVerified && (
                                  <span className="ml-2 text-xs px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full font-semibold border border-emerald-200/60">
                                    Verified
                                  </span>
                                )}
                              </label>
                              <div className="relative">
                                <FaIdCard className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 w-4 h-4" />
                                <input 
                                  type="text" 
                                  value={profile?.gstNumber ?? ''} 
                                  readOnly 
                                  className="w-full pl-10 pr-3 py-2.5 border border-neutral-200 rounded-xl text-sm bg-neutral-50 text-neutral-500 cursor-not-allowed font-mono"
                                />
                              </div>
                              <p className="text-[10px] text-neutral-400 mt-1.5">GST number verification is done by admin</p>
                            </div>
                            <EditableField label="PAN Number" value={panNumber} onChange={setPanNumber} placeholder="e.g. ABCDE1234F" disabled={saving} />
                            <EditableField label="UPI ID (Optional)" value={upiId} onChange={setUpiId} placeholder="e.g. name@upi" disabled={saving} helpText="Your UPI ID / VPA for receiving payments" />
                            <EditableField label="Bank name" value={bankName} onChange={setBankName} disabled={saving} icon={<FaBuilding />} />
                            <EditableField label="Account holder name" value={bankAccountName} onChange={setBankAccountName} disabled={saving} />
                            <EditableField label="Account number" value={bankAccountNumber} onChange={setBankAccountNumber} disabled={saving} />
                            <EditableField label="IFSC" value={ifscCode} onChange={setIfscCode} disabled={saving} />
                          </div>
                        </ProfileSection>

                        {/* Action Buttons */}
                        <div className="flex justify-end gap-3">
                          <button 
                            type="button" 
                            onClick={() => setEditing(false)} 
                            className="px-6 py-2.5 border border-neutral-300 text-neutral-700 rounded-xl text-sm font-medium hover:bg-neutral-50 transition-colors"
                          >
                            Cancel
                          </button>
                          <button 
                            type="button" 
                            onClick={() => { handleSave(); setEditing(false); }} 
                            disabled={saving}
                            className="px-6 py-2.5 bg-brand-primary text-white rounded-xl text-sm font-semibold hover:bg-brand-primary/90 disabled:opacity-60 transition-colors flex items-center gap-2"
                          >
                            {saving ? (
                              <>
                                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                                Saving…
                              </>
                            ) : (
                              <>
                                <FaCircleCheck className="w-4 h-4" />
                                Save Changes
                              </>
                            )}
                          </button>
                        </div>
                      </>
                    )}
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
