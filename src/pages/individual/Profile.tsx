import { useCallback, useEffect, useState, useRef } from 'react';
import { 
  FaTriangleExclamation, FaCircleCheck, FaPen, FaCamera, FaUser, FaLocationDot,
  FaBriefcase, FaMoneyBillWave, FaIdCard, FaBuilding, FaFilm,
  FaGlobe,
} from 'react-icons/fa6';
import DashboardHeader from '../../components/DashboardHeader';
import DashboardSidebar from '../../components/DashboardSidebar';
import AppFooter from '../../components/AppFooter';
import Avatar from '../../components/Avatar';
import { api, ApiException } from '../../services/api';
import { useApiQuery } from '../../hooks/useApiQuery';
import { paiseToRupees, rupeesToPaise } from '../../utils/currency';
import { individualNavLinks } from '../../navigation/dashboardNav';
import LocationAutocomplete from '../../components/LocationAutocomplete';
import { 
  ProfileSection, InfoRow, EditableField, SkillTag, SocialLinks,
  ProfileCompletionBadge,
} from '../../components/profile/ProfileComponents';
import {
  calculateIndividualCompletion,
  getProfileImprovementTips
} from '../../utils/profileCompletion';
import { REGISTRATION_GENRES, REGISTRATION_INDIVIDUAL_DEPARTMENTS } from '../../constants/registrationCategories';

interface ProfileData {
  displayName: string;
  bio: string | null;
  aboutMe: string | null;
  skills: string[];
  genres?: string[] | null;
  genre?: string | null;
  address: string | null;
  locationCity: string | null;
  locationState: string | null;
  dailyBudget: number | null;
  website: string | null;
  imdbUrl: string | null;
  instagramUrl: string | null;
  youtubeUrl: string | null;
  vimeoUrl: string | null;
  linkedinUrl: string | null;
  twitterUrl: string | null;
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
    document.title = 'My Profile – Claapo';
  }, []);

  const { data: me, loading: meLoading, refetch: refetchMe } = useApiQuery<MeResponse>('/profile/me');

  // Form state
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [aboutMe, setAboutMe] = useState('');
  const [skills, setSkills] = useState('');
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [address, setAddress] = useState('');
  const [locationCity, setLocationCity] = useState('');
  const [locationState, setLocationState] = useState('');
  const [dailyBudget, setDailyBudget] = useState('');
  const [website, setWebsite] = useState('');
  const [imdbUrl, setImdbUrl] = useState('');
  const [instagramUrl, setInstagramUrl] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [vimeoUrl, setVimeoUrl] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [twitterUrl, setTwitterUrl] = useState('');
  const [panNumber, setPanNumber] = useState('');
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

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setAvatarUploading(true);
    setAvatarUrl(URL.createObjectURL(file));
    try {
      const { uploadUrl, key } = await api.post<{ uploadUrl: string; key: string }>('/profile/avatar', {});
      await fetch(uploadUrl, { method: 'PUT', headers: { 'Content-Type': file.type || 'image/jpeg' }, body: file });
      await api.post('/profile/avatar/confirm', { key });
      refetchMe();
    } catch {
      setError('Failed to upload avatar.');
    } finally {
      setAvatarUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const hydrateFromProfile = useCallback(() => {
    if (!me?.profile) return;
    const p = me.profile as ProfileData & { avatarUrl?: string };
    if (p.avatarUrl) setAvatarUrl(p.avatarUrl);
    setDisplayName(p.displayName ?? '');
    setBio(p.bio ?? '');
    setAboutMe(p.aboutMe ?? '');
    setSkills(p.skills?.join(', ') ?? '');
    const g = (p.genres?.length ? p.genres : p.genre ? [p.genre] : []) as string[];
    setSelectedGenres(g);
    setAddress(p.address ?? '');
    setLocationCity(p.locationCity ?? '');
    setLocationState(p.locationState ?? '');
    setDailyBudget(p.dailyBudget ? String(paiseToRupees(p.dailyBudget)) : '');
    setWebsite(p.website ?? '');
    setImdbUrl(p.imdbUrl ?? '');
    setInstagramUrl(p.instagramUrl ?? '');
    setYoutubeUrl(p.youtubeUrl ?? '');
    setVimeoUrl(p.vimeoUrl ?? '');
    setLinkedinUrl(p.linkedinUrl ?? '');
    setTwitterUrl(p.twitterUrl ?? '');
    setPanNumber(p.panNumber ?? '');
    setBankAccountName(p.bankAccountName ?? '');
    setBankAccountNumber(p.bankAccountNumber ?? '');
    setIfscCode(p.ifscCode ?? '');
    setBankName(p.bankName ?? '');
  }, [me]);

  useEffect(() => { hydrateFromProfile(); }, [hydrateFromProfile]);

  const handleCancel = () => {
    hydrateFromProfile();
    setError(null);
    setEditing(false);
  };

  const handleSave = async () => {
    setError(null);
    setSaved(false);
    if (!address.trim()) {
      setError('Address is required for invoices. Please add your mailing address.');
      return;
    }
    setSaving(true);
    try {
      await api.patch('/profile/individual', {
        displayName: displayName.trim() || undefined,
        aboutMe: aboutMe.trim() || undefined,
        skills: skills.split(',').map((s) => s.trim()).filter(Boolean),
        genres: selectedGenres.length ? selectedGenres : undefined,
        address: address.trim() || undefined,
        locationCity: locationCity.trim() || undefined,
        locationState: locationState.trim() || undefined,
        dailyBudget: dailyBudget ? rupeesToPaise(dailyBudget) : undefined,
        website: website.trim() || undefined,
        imdbUrl: imdbUrl.trim() || undefined,
        instagramUrl: instagramUrl.trim() || undefined,
        youtubeUrl: youtubeUrl.trim() || undefined,
        vimeoUrl: vimeoUrl.trim() || undefined,
        linkedinUrl: linkedinUrl.trim() || undefined,
        twitterUrl: twitterUrl.trim() || undefined,
        panNumber: panNumber.trim() || undefined,
        bankAccountName: bankAccountName.trim() || undefined,
        bankAccountNumber: bankAccountNumber.trim() || undefined,
        ifscCode: ifscCode.trim() || undefined,
        bankName: bankName.trim() || undefined,
      });
      setSaved(true);
      setEditing(false);
      refetchMe();
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      const msg = err instanceof ApiException ? err.payload.message : 'Failed to save profile.';
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  // Live profile completion — reflects form state while editing
  const liveSnapshot = {
    ...(me?.profile ?? {}),
    displayName,
    bio,
    aboutMe,
    skills: skills.split(',').map((s) => s.trim()).filter(Boolean),
    genres: selectedGenres,
    address,
    locationCity,
    locationState,
    dailyBudget: dailyBudget ? rupeesToPaise(dailyBudget) : null,
    website,
    imdbUrl,
    instagramUrl,
    youtubeUrl,
    vimeoUrl,
    linkedinUrl,
    twitterUrl,
    panNumber,
    bankAccountName,
    bankAccountNumber,
    ifscCode,
    bankName,
    avatarUrl,
  };
  const profileCompletion = me?.profile ? calculateIndividualCompletion(liveSnapshot as any) : 0;
  const improvementTips = me?.profile ? getProfileImprovementTips('individual', liveSnapshot as any) : [];

  const nameForAvatar = displayName || me?.email?.split('@')[0] || 'User';
  const skillsArray = skills.split(',').map(s => s.trim()).filter(Boolean);

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-[#F8F9FB] min-w-0 w-full">
      <DashboardHeader />

      <div className="flex-1 flex min-h-0 overflow-hidden">
        <DashboardSidebar links={individualNavLinks} />

        <main className="flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden">
          <div className="flex-1 min-h-0 overflow-auto">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-6 xl:px-8 py-6">

              {/* Header Section */}
              <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">My Profile</h1>
                  <p className="text-sm text-neutral-600 mt-1">Manage your professional profile and settings</p>
                </div>
                {!editing && !meLoading && (
                  <button
                    type="button"
                    onClick={() => setEditing(true)}
                    className="px-4 py-2.5 bg-brand-primary text-white rounded-xl text-sm font-semibold hover:bg-brand-primary/90 transition-colors flex items-center gap-2 shadow-sm"
                  >
                    <FaPen className="w-3.5 h-3.5" /> Edit Profile
                  </button>
                )}
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
                      <div className="h-28 bg-gradient-to-br from-brand-primary via-brand-primary/90 to-brand-primary/80 relative overflow-hidden">
                        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.3) 0%, transparent 50%), radial-gradient(circle at 80% 30%, rgba(255,255,255,0.2) 0%, transparent 50%)' }} />
                      </div>
                      
                      {/* Avatar */}
                      <div className="flex justify-center -mt-12 mb-4">
                        <div className="relative group cursor-pointer ring-4 ring-white rounded-full shadow-lg" onClick={() => fileInputRef.current?.click()}>
                          <Avatar src={avatarUrl ?? undefined} name={nameForAvatar} size="lg" />
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
                        <h2 className="text-xl font-bold text-neutral-900 tracking-tight truncate">
                          {displayName || '—'}
                        </h2>
                        {skillsArray[0] && (
                          <p className="text-sm text-neutral-500 mt-1 truncate">{skillsArray[0]}</p>
                        )}

                        <div className="flex flex-wrap items-center justify-center gap-2 mt-3">
                          {me?.isVerified && (
                            <span className="inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200/60">
                              <FaCircleCheck className="w-3 h-3" /> Verified
                            </span>
                          )}
                          {me?.profile?.isAvailable && (
                            <span className="inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 font-semibold border border-blue-200/60">
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" /> Available
                            </span>
                          )}
                        </div>

                        {locationCity && (
                          <div className="flex items-center justify-center gap-1.5 text-xs text-neutral-500 mt-3">
                            <FaLocationDot className="w-3 h-3" />
                            <span className="truncate">{locationCity}{locationState ? `, ${locationState}` : ''}</span>
                          </div>
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

                    {/* Quick Info */}
                    <div className="rounded-2xl bg-white border border-neutral-200 shadow-sm p-5 space-y-3">
                      <div className="flex items-center gap-3 text-sm text-neutral-600">
                        <div className="w-8 h-8 rounded-lg bg-brand-primary/10 flex items-center justify-center shrink-0">
                          <FaMoneyBillWave className="w-4 h-4 text-brand-primary" />
                        </div>
                        <div>
                          <p className="text-xs text-neutral-500">Budget</p>
                          <p className="font-semibold text-neutral-900">{dailyBudget ? `₹${dailyBudget}` : 'Not set'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-neutral-600">
                        <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
                          <FaCircleCheck className="w-4 h-4 text-emerald-600" />
                        </div>
                        <div>
                          <p className="text-xs text-neutral-500">Availability</p>
                          <p className="font-semibold text-neutral-900">{me?.profile?.isAvailable ? 'Available' : 'Not Available'}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Main Content */}
                  <div className="lg:col-span-2 space-y-6">
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

                    {!editing ? (
                      <>
                        {/* Personal Information */}
                        <ProfileSection 
                          title="Personal Information" 
                          icon={<FaUser />}
                        >
                          <div className="space-y-1">
                            <InfoRow label="Display Name" value={displayName || '—'} icon={<FaUser />} />
                            <InfoRow label="Email" value={me?.email ?? '—'} />
                            <InfoRow label="Phone" value={me?.phone ?? '—'} />
                            <InfoRow label="Location" value={locationCity ? `${locationCity}${locationState ? `, ${locationState}` : ''}` : '—'} icon={<FaLocationDot />} />
                            <InfoRow label="Address" value={address || '—'} icon={<FaBuilding />} />
                          </div>
                        </ProfileSection>

                        {/* Professional Details */}
                        <ProfileSection 
                          title="Professional Details" 
                          icon={<FaBriefcase />}
                        >
                          <div className="space-y-5">
                            {/* Role */}
                            <div>
                              <dt className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-2">Role</dt>
                              {skillsArray[0] ? (
                                <SkillTag skill={skillsArray[0]} />
                              ) : (
                                <p className="text-sm text-neutral-400 italic">No role selected</p>
                              )}
                            </div>

                            {/* Genres */}
                            <div>
                              <dt className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                                <FaFilm className="w-3.5 h-3.5" /> Genres
                              </dt>
                              {selectedGenres.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                  {selectedGenres.map((g) => (
                                    <SkillTag key={g} skill={g} />
                                  ))}
                                </div>
                              ) : (
                                <p className="text-sm text-neutral-400 italic">—</p>
                              )}
                            </div>

                            {/* About Me */}
                            <div>
                              <dt className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-2">About Me</dt>
                              <dd className="text-sm text-neutral-700 whitespace-pre-wrap leading-relaxed">
                                {aboutMe || <span className="text-neutral-400 italic">—</span>}
                              </dd>
                            </div>

                            <div>
                              <dt className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-2">Budget</dt>
                              <dd className="text-sm text-neutral-800 font-semibold">
                                {dailyBudget ? `₹${dailyBudget}/day` : <span className="text-neutral-400 italic font-normal">—</span>}
                              </dd>
                            </div>
                          </div>
                        </ProfileSection>

                        {/* Social Links */}
                        <ProfileSection 
                          title="Social Links" 
                          icon={<FaGlobe />}
                        >
                          <SocialLinks links={{
                            website: website || null,
                            instagramUrl: instagramUrl || null,
                            imdbUrl: imdbUrl || null,
                            youtubeUrl: youtubeUrl || null,
                            vimeoUrl: vimeoUrl || null,
                            linkedinUrl: linkedinUrl || null,
                            twitterUrl: twitterUrl || null,
                          }} />
                        </ProfileSection>

                        {/* Invoice Details */}
                        <ProfileSection 
                          title="Invoice & Payment Details" 
                          icon={<FaIdCard />}
                          description="PAN and bank details appear on invoices"
                        >
                          <div className="space-y-1 divide-y divide-neutral-50">
                            <InfoRow label="PAN Number" value={panNumber || '—'} icon={<FaIdCard />} copyable />
                            <InfoRow label="Bank Name" value={bankName || '—'} icon={<FaBuilding />} />
                            <InfoRow label="Account Name" value={bankAccountName || '—'} />
                            <InfoRow label="Account Number" value={bankAccountNumber || '—'} copyable />
                            <InfoRow label="IFSC Code" value={ifscCode || '—'} copyable />
                          </div>
                        </ProfileSection>
                      </>
                    ) : (
                      <>
                        {/* Personal Information */}
                        <ProfileSection 
                          title="Personal Information" 
                          icon={<FaUser />}
                        >
                          <div className="space-y-4">
                            <EditableField
                              label="Display Name"
                              value={displayName}
                              onChange={setDisplayName}
                              placeholder="Your full name"
                              disabled={saving}
                              icon={<FaUser />}
                            />
                            <EditableField
                              label="Email"
                              value={me?.email ?? ''}
                              onChange={() => {}}
                              readOnly
                              readOnlyReason="read-only"
                              type="email"
                              disabled={saving}
                            />
                            <EditableField
                              label="Phone"
                              value={me?.phone ?? ''}
                              onChange={() => {}}
                              readOnly
                              readOnlyReason="read-only"
                              type="tel"
                              disabled={saving}
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
                              placeholder="Full street address, city, PIN"
                              disabled={saving}
                              icon={<FaBuilding />}
                            />
                          </div>
                        </ProfileSection>

                        {/* Professional Details */}
                        <ProfileSection 
                          title="Professional Details" 
                          icon={<FaBriefcase />}
                        >
                          <div className="space-y-4">
                            <div>
                              <label className="block text-xs font-medium text-neutral-700 mb-1.5">
                                Role <span className="text-red-500">*</span>
                              </label>
                              <div className="relative">
                                <FaBriefcase className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 w-4 h-4 pointer-events-none" />
                                <select
                                  value={skillsArray[0] ?? ''}
                                  onChange={(e) => setSkills(e.target.value)}
                                  disabled={saving}
                                  className="w-full pl-10 pr-3 py-2.5 border border-neutral-300 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary disabled:bg-neutral-50 appearance-none"
                                >
                                  <option value="">Select your role…</option>
                                  {REGISTRATION_INDIVIDUAL_DEPARTMENTS.map((r) => (
                                    <option key={r} value={r}>{r}</option>
                                  ))}
                                </select>
                              </div>
                              <p className="text-[10px] text-neutral-400 mt-1.5">Your primary role on set</p>
                            </div>

                            <div>
                              <label className="block text-xs font-medium text-neutral-700 mb-2">Genres</label>
                              <div className="flex flex-wrap gap-2 p-3 rounded-xl border border-neutral-200 bg-neutral-50 max-h-36 overflow-y-auto">
                                {REGISTRATION_GENRES.map((g) => {
                                  const on = selectedGenres.includes(g);
                                  return (
                                    <button
                                      key={g}
                                      type="button"
                                      disabled={saving}
                                      onClick={() =>
                                        setSelectedGenres((prev) =>
                                          on ? prev.filter((x) => x !== g) : [...prev, g],
                                        )
                                      }
                                      className={`text-xs font-medium px-2.5 py-1 rounded-lg border transition-colors ${
                                        on
                                          ? 'bg-brand-primary text-white border-brand-primary'
                                          : 'bg-white text-neutral-600 border-neutral-200 hover:border-brand-primary/40'
                                      }`}
                                    >
                                      {g}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>

                            <EditableField
                              label="About Me"
                              type="textarea"
                              rows={4}
                              value={aboutMe}
                              onChange={setAboutMe}
                              placeholder="Tell more about your experience, approach, and what makes you unique..."
                              disabled={saving}
                            />

                            <EditableField
                              label="Budget (₹/day)"
                              type="number"
                              value={dailyBudget}
                              onChange={setDailyBudget}
                              placeholder="e.g. 5000"
                              disabled={saving}
                              icon={<FaMoneyBillWave />}
                              helpText="Your expected daily budget or rate"
                            />
                          </div>
                        </ProfileSection>

                        {/* Social Links */}
                        <ProfileSection 
                          title="Social Links" 
                          icon={<FaGlobe />}
                        >
                          <SocialLinks
                            links={{
                              website,
                              instagramUrl,
                              imdbUrl,
                              youtubeUrl,
                              vimeoUrl,
                              linkedinUrl,
                              twitterUrl,
                            }}
                            editable
                            onChange={(field, value) => {
                              if (field === 'website') setWebsite(value);
                              if (field === 'instagramUrl') setInstagramUrl(value);
                              if (field === 'imdbUrl') setImdbUrl(value);
                              if (field === 'youtubeUrl') setYoutubeUrl(value);
                              if (field === 'vimeoUrl') setVimeoUrl(value);
                              if (field === 'linkedinUrl') setLinkedinUrl(value);
                              if (field === 'twitterUrl') setTwitterUrl(value);
                            }}
                            disabled={saving}
                          />
                        </ProfileSection>

                        {/* Invoice Details */}
                        <ProfileSection 
                          title="Invoice & Payment Details" 
                          icon={<FaIdCard />}
                        >
                          <div className="space-y-4">
                            <EditableField
                              label="PAN Number"
                              value={panNumber}
                              onChange={setPanNumber}
                              placeholder="e.g. ABCDE1234F"
                              disabled={saving}
                              icon={<FaIdCard />}
                              helpText="10-character PAN"
                            />
                            <EditableField
                              label="Bank Name"
                              value={bankName}
                              onChange={setBankName}
                              placeholder="e.g. HDFC Bank"
                              disabled={saving}
                              icon={<FaBuilding />}
                            />
                            <EditableField
                              label="Account Name"
                              value={bankAccountName}
                              onChange={setBankAccountName}
                              placeholder="Account holder name"
                              disabled={saving}
                            />
                            <EditableField
                              label="Account Number"
                              value={bankAccountNumber}
                              onChange={setBankAccountNumber}
                              placeholder="Bank account number"
                              disabled={saving}
                            />
                            <EditableField
                              label="IFSC Code"
                              value={ifscCode}
                              onChange={setIfscCode}
                              placeholder="e.g. HDFC0001234"
                              disabled={saving}
                              helpText="11-character IFSC"
                            />
                          </div>
                        </ProfileSection>

                        {/* Action Buttons */}
                        <div className="flex justify-end gap-3">
                          <button
                            type="button"
                            onClick={handleCancel}
                            disabled={saving}
                            className="px-6 py-2.5 border border-neutral-300 text-neutral-700 rounded-xl text-sm font-medium hover:bg-neutral-50 transition-colors disabled:opacity-60"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={handleSave}
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
