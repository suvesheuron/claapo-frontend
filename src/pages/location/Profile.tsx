import { useEffect, useState, useRef } from 'react';
import {
  FaPen, FaBuilding, FaIdCard, FaLocationDot,
  FaTriangleExclamation, FaCircleCheck, FaGlobe, FaCamera,
  FaUser, FaEnvelope, FaPhone, FaFilePdf, FaMapPin,
} from 'react-icons/fa6';
import DashboardHeader from '../../components/DashboardHeader';
import DashboardSidebar from '../../components/DashboardSidebar';
import AppFooter from '../../components/AppFooter';
import Avatar from '../../components/Avatar';
import ImagePreviewModal from '../../components/ImagePreviewModal';
import CoverMedia, { type CoverType } from '../../components/profile/CoverMedia';
import { api, ApiException } from '../../services/api';
import { useApiQuery } from '../../hooks/useApiQuery';
import { locationNavLinks } from '../../navigation/dashboardNav';
import LocationAutocomplete from '../../components/LocationAutocomplete';
import {
  ProfileSection, InfoRow, EditableField, SocialLinks,
} from '../../components/profile/ProfileComponents';
import {
  LOCATION_TYPES, LOCATION_TYPE_LABELS, subTypesForLocationType,
} from '../../constants/locationCategories';

interface LocationProfileData {
  propertyName: string;
  locationType: string;
  subTypes?: string[];
  locationCity: string | null;
  locationState: string | null;
  address?: string | null;
  addressLat?: number | null;
  addressLng?: number | null;
  aboutUs: string | null;
  bio?: string | null;
  website: string | null;
  imdbUrl?: string | null;
  instagramUrl: string | null;
  youtubeUrl: string | null;
  vimeoUrl?: string | null;
  panNumber?: string | null;
  billingName?: string | null;
  upiId?: string | null;
  bankAccountName?: string | null;
  bankAccountNumber?: string | null;
  ifscCode?: string | null;
  bankName?: string | null;
  gstNumber: string | null;
  sacCode?: string | null;
  isGstVerified: boolean;
  coverUrl?: string | null;
  detailPdfUrl?: string | null;
  detailPdfName?: string | null;
}

interface MeResponse {
  id: string;
  email: string;
  phone: string;
  role: string;
  isVerified: boolean;
  profile: LocationProfileData | null;
}

export default function LocationProfile() {
  useEffect(() => { document.title = 'Location Profile – Claapo'; }, []);

  const { data: me, loading: meLoading, refetch: refetchMe } = useApiQuery<MeResponse>('/profile/me');

  const [propertyName, setPropertyName] = useState('');
  const [locationType, setLocationType] = useState('');
  const [subTypes, setSubTypes] = useState<string[]>([]);
  const [locationCity, setLocationCity] = useState('');
  const [locationState, setLocationState] = useState('');
  const [address, setAddress] = useState('');
  const [addressLat, setAddressLat] = useState('');
  const [addressLng, setAddressLng] = useState('');
  const [aboutUs, setAboutUs] = useState('');
  const [website, setWebsite] = useState('');
  const [imdbUrl, setImdbUrl] = useState('');
  const [instagramUrl, setInstagramUrl] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [vimeoUrl, setVimeoUrl] = useState('');
  const [panNumber, setPanNumber] = useState('');
  const [billingName, setBillingName] = useState('');
  const [upiId, setUpiId] = useState('');
  const [bankAccountName, setBankAccountName] = useState('');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [bankName, setBankName] = useState('');
  const [sacCode, setSacCode] = useState('');
  const [gstNumber, setGstNumber] = useState('');

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [coverUploading, setCoverUploading] = useState(false);
  const [coverType, setCoverType] = useState<CoverType>(null);
  const [pdfUploading, setPdfUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const [avatarPreviewOpen, setAvatarPreviewOpen] = useState(false);
  const [coverPreviewOpen, setCoverPreviewOpen] = useState(false);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { setError('Please upload an image file (JPEG, PNG, or WebP).'); return; }
    if (file.size > 8 * 1024 * 1024) { setError('Logo must be under 8MB.'); return; }
    setError(null);
    setAvatarUploading(true);
    const previewUrl = URL.createObjectURL(file);
    setAvatarUrl(previewUrl);
    try {
      const contentType = file.type || 'image/jpeg';
      const { uploadUrl, key } = await api.post<{ uploadUrl: string; key: string }>('/profile/avatar', { contentType });
      await fetch(uploadUrl, { method: 'PUT', headers: { 'Content-Type': contentType }, body: file });
      await api.post('/profile/avatar/confirm', { key });
      refetchMe();
    } catch {
      setError('Failed to upload logo.');
    } finally {
      setAvatarUploading(false);
      URL.revokeObjectURL(previewUrl);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleCoverChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const isVideo = file.type.startsWith('video/');
    if (!file.type.startsWith('image/') && !isVideo) { setError('Please upload an image or video file for the cover.'); return; }
    if (file.size > (isVideo ? 200 : 8) * 1024 * 1024) { setError(isVideo ? 'Cover video must be under 200MB.' : 'Cover photo must be under 8MB.'); return; }
    setError(null);
    setCoverUploading(true);
    const previewUrl = URL.createObjectURL(file);
    setCoverUrl(previewUrl);
    setCoverType(isVideo ? 'video' : 'image');
    try {
      const contentType = file.type || 'image/jpeg';
      const { uploadUrl, key } = await api.post<{ uploadUrl: string; key: string }>('/profile/cover', { contentType });
      await fetch(uploadUrl, { method: 'PUT', headers: { 'Content-Type': contentType }, body: file });
      await api.post('/profile/cover/confirm', { key });
      refetchMe();
    } catch {
      setError('Failed to upload cover photo.');
    } finally {
      setCoverUploading(false);
      URL.revokeObjectURL(previewUrl);
      if (coverInputRef.current) coverInputRef.current.value = '';
    }
  };

  const handlePdfChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== 'application/pdf') { setError('Please upload a PDF file.'); return; }
    if (file.size > 25 * 1024 * 1024) { setError('PDF must be under 25MB.'); return; }
    setError(null);
    setPdfUploading(true);
    try {
      const { uploadUrl, key } = await api.post<{ uploadUrl: string; key: string }>('/profile/location-pdf', {});
      await fetch(uploadUrl, { method: 'PUT', headers: { 'Content-Type': 'application/pdf' }, body: file });
      await api.post('/profile/location-pdf/confirm', { key, fileName: file.name });
      refetchMe();
    } catch {
      setError('Failed to upload PDF.');
    } finally {
      setPdfUploading(false);
      if (pdfInputRef.current) pdfInputRef.current.value = '';
    }
  };

  useEffect(() => {
    if (!me?.profile) return;
    const p = me.profile as LocationProfileData & { avatarUrl?: string; logoUrl?: string; coverUrl?: string };
    if (p.logoUrl || p.avatarUrl) setAvatarUrl(p.logoUrl ?? p.avatarUrl ?? null);
    if (p.coverUrl) { setCoverUrl(p.coverUrl); setCoverType((p as { coverType?: CoverType }).coverType ?? 'image'); }
    setPropertyName(p.propertyName ?? '');
    setLocationType(p.locationType ?? '');
    setSubTypes(p.subTypes ?? []);
    setLocationCity(p.locationCity ?? '');
    setLocationState(p.locationState ?? '');
    setAddress(p.address ?? '');
    setAddressLat(p.addressLat != null ? String(p.addressLat) : '');
    setAddressLng(p.addressLng != null ? String(p.addressLng) : '');
    setAboutUs(p.aboutUs ?? '');
    setWebsite(p.website ?? '');
    setImdbUrl(p.imdbUrl ?? '');
    setInstagramUrl(p.instagramUrl ?? '');
    setYoutubeUrl(p.youtubeUrl ?? '');
    setVimeoUrl(p.vimeoUrl ?? '');
    setPanNumber(p.panNumber ?? '');
    setBillingName(p.billingName ?? '');
    setUpiId(p.upiId ?? '');
    setBankAccountName(p.bankAccountName ?? '');
    setBankAccountNumber(p.bankAccountNumber ?? '');
    setIfscCode(p.ifscCode ?? '');
    setBankName(p.bankName ?? '');
    setSacCode(p.sacCode ?? '');
    setGstNumber(p.gstNumber ?? '');
  }, [me]);

  const toggleSubType = (s: string) => {
    setSubTypes((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));
  };

  const handleSave = async () => {
    setError(null); setSaved(false);
    if (gstNumber.trim() && !sacCode.trim()) {
      setError('SAC Code is required when GST Number is provided.');
      return;
    }
    setSaving(true);
    try {
      const lat = addressLat.trim() ? Number(addressLat) : undefined;
      const lng = addressLng.trim() ? Number(addressLng) : undefined;
      await api.patch('/profile/location', {
        propertyName: propertyName.trim() || undefined,
        locationType: locationType || undefined,
        subTypes,
        locationCity: locationCity.trim() || undefined,
        locationState: locationState.trim() || undefined,
        aboutUs: aboutUs.trim() || undefined,
        website: website.trim() || undefined,
        imdbUrl: imdbUrl.trim() || undefined,
        instagramUrl: instagramUrl.trim() || undefined,
        youtubeUrl: youtubeUrl.trim() || undefined,
        vimeoUrl: vimeoUrl.trim() || undefined,
        address: address.trim() || null,
        ...(lat != null && !Number.isNaN(lat) ? { addressLat: lat } : {}),
        ...(lng != null && !Number.isNaN(lng) ? { addressLng: lng } : {}),
        panNumber: panNumber.trim() || null,
        billingName: billingName.trim() || null,
        gstNumber: gstNumber.trim() || null,
        sacCode: sacCode.trim() || null,
        upiId: upiId.trim() || null,
        bankAccountName: bankAccountName.trim() || null,
        bankAccountNumber: bankAccountNumber.trim() || null,
        ifscCode: ifscCode.trim() || null,
        bankName: bankName.trim() || null,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      refetchMe();
    } catch (err) {
      setError(err instanceof ApiException ? err.payload.message : 'Failed to save profile.');
    } finally {
      setSaving(false);
    }
  };

  const profile = me?.profile;
  const typeLabel = locationType ? (LOCATION_TYPE_LABELS[locationType] ?? locationType) : 'Location';
  const subTypeSuggestions = subTypesForLocationType(locationType);

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-[#F3F4F6] w-full">
      <DashboardHeader />
      <div className="flex-1 flex min-h-0 overflow-hidden">
        <DashboardSidebar links={locationNavLinks} />
        <main className="flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden">
          <div className="flex-1 min-h-0 overflow-auto">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-6 xl:px-8 py-6">

              <div className="relative rounded-2xl bg-white border border-neutral-200/70 px-6 sm:px-8 py-6 mb-6 overflow-hidden shadow-soft">
                <div className="absolute inset-y-0 right-0 w-1/2 bg-gradient-to-l from-[#E0F2F1]/60 to-transparent pointer-events-none" />
                <span aria-hidden className="absolute left-0 top-6 bottom-6 w-1 rounded-r-full bg-gradient-to-b from-[#0F766E] to-[#14B8A6]" />
                <div className="relative pl-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#0F766E]">Location</p>
                  <h1 className="text-[26px] sm:text-[28px] font-extrabold text-neutral-900 tracking-tight leading-tight mt-1">Location Profile</h1>
                  <p className="text-sm text-neutral-500 mt-1.5">Manage your profile, properties, and settings</p>
                </div>
              </div>

              {meLoading ? (
                <div className="space-y-6">
                  <div className="skeleton h-64 rounded-2xl" />
                  <div className="skeleton h-96 rounded-2xl" />
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                  {/* Left card */}
                  <div className="lg:col-span-1 space-y-6">
                    <div className="rounded-2xl bg-white border border-neutral-200/70 shadow-soft overflow-hidden hover:border-[#0F766E] transition-colors duration-200">
                      <div
                        className="h-36 bg-gradient-to-br from-[#0F766E] via-[#0D9488] to-[#14B8A6] relative overflow-hidden cursor-zoom-in group"
                        onClick={() => { if (coverType !== 'video') setCoverPreviewOpen(true); }}
                        role="button" tabIndex={0} aria-label="Open cover preview"
                        onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && coverType !== 'video') { e.preventDefault(); setCoverPreviewOpen(true); } }}
                      >
                        <CoverMedia url={coverUrl} type={coverType} />
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); coverInputRef.current?.click(); }}
                          aria-label="Change cover photo"
                          className="absolute bottom-2.5 right-2.5 inline-flex items-center gap-1.5 text-white text-xs font-semibold bg-black/55 hover:bg-black/75 backdrop-blur px-2.5 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity shadow-md"
                        >
                          {coverUploading ? (<><span className="w-3 h-3 border-[2px] border-white/40 border-t-white rounded-full animate-spin" /> Uploading…</>) : (<><FaCamera className="w-3 h-3" /> Change cover</>)}
                        </button>
                        <input ref={coverInputRef} type="file" accept="image/*,video/*" className="hidden" onChange={handleCoverChange} />
                      </div>

                      <div className="flex justify-center -mt-16 mb-4">
                        <div className="relative group cursor-zoom-in" onClick={() => setAvatarPreviewOpen(true)} role="button" tabIndex={0} aria-label="Open logo preview"
                          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setAvatarPreviewOpen(true); } }}>
                          <div className="p-[3px] rounded-full bg-gradient-to-br from-[#0F766E] via-[#0D9488] to-[#14B8A6] shadow-xl">
                            <div className="p-[3px] rounded-full bg-white">
                              <Avatar src={avatarUrl ?? undefined} name={propertyName || 'Location'} size="xl" />
                            </div>
                          </div>
                          <button type="button" onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }} aria-label="Change logo"
                            className="absolute bottom-1 right-1 w-9 h-9 rounded-full bg-[#0F766E] hover:bg-[#0D9488] text-white flex items-center justify-center shadow-lg ring-2 ring-white transition-colors">
                            {avatarUploading ? (<span className="w-3.5 h-3.5 border-[2px] border-white/40 border-t-white rounded-full animate-spin" />) : (<FaCamera className="w-3.5 h-3.5" />)}
                          </button>
                          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                        </div>
                      </div>

                      <div className="px-6 pb-6 text-center">
                        <h2 className="text-xl font-bold text-neutral-900">{propertyName || '—'}</h2>
                        <p className="text-sm text-neutral-500 mt-1">{typeLabel}</p>
                        {me?.isVerified && (
                          <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1 rounded-full bg-[#DCFCE7] text-[#15803D] font-bold mt-2 border border-[#86EFAC]">
                            <FaCircleCheck className="w-3 h-3" /> Verified
                          </span>
                        )}
                        {locationCity && (
                          <div className="flex items-center justify-center gap-1.5 text-xs text-neutral-500 mt-3">
                            <FaLocationDot className="w-3.5 h-3.5" />
                            <span>{locationCity}{locationState ? `, ${locationState}` : ''}</span>
                          </div>
                        )}
                        {!editing && (
                          <button type="button" onClick={() => setEditing(true)}
                            className="mt-5 w-full px-4 py-2.5 bg-gradient-to-br from-[#0F766E] to-[#0D9488] text-white rounded-xl text-sm font-bold hover:from-[#0D9488] hover:to-[#0F766E] shadow transition-colors duration-200 flex items-center justify-center gap-2">
                            <FaPen className="w-3.5 h-3.5" /> Edit Profile
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Main content */}
                  <div className="lg:col-span-2 space-y-6">
                    {error && (
                      <div className="flex items-start gap-2 rounded-xl bg-[#FEEBEA] border border-[#F40F02]/30 px-4 py-3">
                        <FaTriangleExclamation className="text-[#F40F02] text-sm shrink-0 mt-0.5" />
                        <p className="text-sm text-[#991B1B]">{error}</p>
                      </div>
                    )}
                    {saved && (
                      <div className="flex items-center gap-2 rounded-xl bg-[#DCFCE7] border border-[#86EFAC] px-4 py-3 text-[#15803D] text-sm font-semibold">
                        <FaCircleCheck /> Profile saved successfully!
                      </div>
                    )}

                    {!editing ? (
                      <>
                        <ProfileSection title="Basic Description" icon={<FaBuilding />}>
                          <div className="space-y-1">
                            <InfoRow label="Property Name" value={propertyName || '—'} icon={<FaBuilding />} />
                            <InfoRow label="Email" value={me?.email ?? '—'} icon={<FaEnvelope />} />
                            <InfoRow label="Phone" value={me?.phone ?? '—'} icon={<FaPhone />} />
                            <InfoRow label="City" value={locationCity ? `${locationCity}${locationState ? `, ${locationState}` : ''}` : '—'} icon={<FaLocationDot />} />
                            <InfoRow label="Address" value={address || '—'} />
                            <InfoRow
                              label="Map Pin"
                              value={
                                addressLat && addressLng ? (
                                  <a href={`https://www.google.com/maps/search/?api=1&query=${addressLat},${addressLng}`} target="_blank" rel="noreferrer" className="text-[#0F766E] hover:underline inline-flex items-center gap-1.5">
                                    <FaMapPin className="w-3.5 h-3.5" /> Open in Google Maps
                                  </a>
                                ) : '—'
                              }
                            />
                          </div>
                        </ProfileSection>

                        <ProfileSection title="Location Details" icon={<FaMapPin />}>
                          <div className="space-y-3">
                            <InfoRow label="Location Type" value={typeLabel} />
                            <div>
                              <dt className="text-xs font-medium text-neutral-500 mb-1.5">Sub-Types</dt>
                              {subTypes.length > 0 ? (
                                <div className="flex flex-wrap gap-1.5">
                                  {subTypes.map((s) => (
                                    <span key={s} className="px-2.5 py-1 bg-[#E0F2F1] text-[#0F766E] text-xs font-semibold rounded-md border border-[#0F766E]/20">{s}</span>
                                  ))}
                                </div>
                              ) : <dd className="text-sm text-neutral-700">—</dd>}
                            </div>
                          </div>
                        </ProfileSection>

                        <ProfileSection title="About" icon={<FaUser />}>
                          <dd className="text-sm text-neutral-700 whitespace-pre-wrap">{aboutUs || '—'}</dd>
                        </ProfileSection>

                        <ProfileSection title="Detailed PDF" icon={<FaFilePdf />}>
                          {profile?.detailPdfUrl ? (
                            <a href={profile.detailPdfUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm text-[#0F766E] font-semibold hover:underline">
                              <FaFilePdf className="w-4 h-4 text-[#DC2626]" /> {profile.detailPdfName || 'View PDF'}
                            </a>
                          ) : <p className="text-sm text-neutral-500">No PDF uploaded yet.</p>}
                        </ProfileSection>

                        <ProfileSection title="Online Presence" icon={<FaGlobe />}>
                          <SocialLinks links={{ website: website || null, instagramUrl: instagramUrl || null, youtubeUrl: youtubeUrl || null, vimeoUrl: vimeoUrl || null, imdbUrl: imdbUrl || null }} />
                        </ProfileSection>

                        <ProfileSection title="Billing Details" icon={<FaIdCard />}>
                          <div className="space-y-1">
                            <InfoRow label="GST Number" value={profile?.gstNumber || '—'} icon={<FaIdCard />} copyable />
                            <InfoRow label="SAC Code" value={sacCode || '—'} copyable />
                            <InfoRow label="PAN" value={panNumber || '—'} copyable />
                            <InfoRow label="Billing Name" value={billingName || propertyName || '—'} icon={<FaUser />} />
                            <InfoRow label="UPI ID" value={upiId || '—'} copyable />
                            <InfoRow label="Bank" value={bankName || '—'} />
                            <InfoRow label="Account" value={bankAccountNumber || '—'} copyable />
                            <InfoRow label="IFSC" value={ifscCode || '—'} copyable />
                          </div>
                        </ProfileSection>
                      </>
                    ) : (
                      <>
                        <ProfileSection title="Basic Description" icon={<FaBuilding />}>
                          <div className="space-y-4">
                            <EditableField label="Property Name" value={propertyName} onChange={setPropertyName} placeholder="Your property / business name" disabled={saving} icon={<FaBuilding />} required />
                            <EditableField label="Email" value={me?.email ?? ''} onChange={() => {}} readOnly readOnlyReason="read-only" type="email" disabled={saving} icon={<FaEnvelope />} />
                            <EditableField label="Phone" value={me?.phone ?? ''} onChange={() => {}} readOnly readOnlyReason="read-only" type="tel" disabled={saving} icon={<FaPhone />} />
                            <LocationAutocomplete label="City" city={locationCity} state={locationState} disabled={saving}
                              onSelect={(loc) => { setLocationCity(loc.city); setLocationState(loc.state); }} placeholder="Search city or pin code..." />
                            <EditableField label="Address" type="textarea" rows={2} value={address} onChange={setAddress} placeholder="Full address of the property" disabled={saving} icon={<FaLocationDot />} />
                            <div className="grid grid-cols-2 gap-3">
                              <EditableField label="Map Pin — Latitude" value={addressLat} onChange={setAddressLat} placeholder="e.g. 19.0760" disabled={saving} helpText="For the Google Maps pin" />
                              <EditableField label="Map Pin — Longitude" value={addressLng} onChange={setAddressLng} placeholder="e.g. 72.8777" disabled={saving} />
                            </div>
                          </div>
                        </ProfileSection>

                        <ProfileSection title="Location Details" icon={<FaMapPin />}>
                          <div className="space-y-4">
                            <div>
                              <label className="block text-xs font-medium text-neutral-700 mb-1.5">Location Type <span className="text-[#F40F02]">*</span></label>
                              <select value={locationType} onChange={(e) => setLocationType(e.target.value)} disabled={saving}
                                className="w-full px-3 py-2.5 border border-neutral-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E] disabled:bg-neutral-50 bg-white">
                                <option value="">Select type…</option>
                                {LOCATION_TYPES.map((t) => (<option key={t.value} value={t.value}>{t.label}</option>))}
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-neutral-700 mb-1.5">Sub-Types <span className="text-neutral-400 font-normal">(select all that apply)</span></label>
                              <div className="flex flex-wrap gap-1.5">
                                {Array.from(new Set([...subTypeSuggestions, ...subTypes])).map((s) => {
                                  const active = subTypes.includes(s);
                                  return (
                                    <button key={s} type="button" onClick={() => toggleSubType(s)} disabled={saving}
                                      className={`px-2.5 py-1 text-xs font-semibold rounded-md border transition-colors ${active ? 'bg-[#0F766E] text-white border-[#0F766E]' : 'bg-white text-neutral-700 border-neutral-300 hover:border-[#0F766E]'}`}>
                                      {s}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        </ProfileSection>

                        <ProfileSection title="About" icon={<FaUser />}>
                          <EditableField label="About" type="textarea" rows={4} value={aboutUs} onChange={setAboutUs} placeholder="Describe the property/space, its highlights, capacity, and what productions can expect..." disabled={saving} />
                        </ProfileSection>

                        <ProfileSection title="Detailed PDF" icon={<FaFilePdf />}>
                          <div className="space-y-3">
                            {profile?.detailPdfUrl && (
                              <a href={profile.detailPdfUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm text-[#0F766E] font-semibold hover:underline">
                                <FaFilePdf className="w-4 h-4 text-[#DC2626]" /> {profile.detailPdfName || 'View current PDF'}
                              </a>
                            )}
                            <div>
                              <button type="button" onClick={() => pdfInputRef.current?.click()} disabled={pdfUploading || saving}
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-neutral-300 bg-white text-sm font-semibold text-neutral-800 hover:border-[#0F766E] hover:text-[#0F766E] transition-colors disabled:opacity-60">
                                {pdfUploading ? (<><span className="w-3.5 h-3.5 border-[2px] border-neutral-300 border-t-[#0F766E] rounded-full animate-spin" /> Uploading…</>) : (<><FaFilePdf className="w-3.5 h-3.5" /> {profile?.detailPdfUrl ? 'Replace PDF' : 'Upload PDF'}</>)}
                              </button>
                              <input ref={pdfInputRef} type="file" accept="application/pdf" className="hidden" onChange={handlePdfChange} />
                              <p className="text-[10px] text-neutral-400 mt-1.5">A detailed PDF of your location/property. Visible to companies searching for locations.</p>
                            </div>
                          </div>
                        </ProfileSection>

                        <ProfileSection title="Online Presence" icon={<FaGlobe />}>
                          <SocialLinks
                            links={{ website, instagramUrl, youtubeUrl, vimeoUrl, imdbUrl }}
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

                        <ProfileSection title="Billing Details" icon={<FaIdCard />}>
                          <div className="space-y-4">
                            <EditableField label="Billing Name" value={billingName} onChange={setBillingName} placeholder="Name to print on invoices" disabled={saving} icon={<FaUser />} />
                            <EditableField label="PAN Number" value={panNumber} onChange={setPanNumber} placeholder="e.g. ABCDE1234F" disabled={saving} />
                            <EditableField label="GST Number" value={gstNumber} onChange={(v) => setGstNumber(v.toUpperCase())} placeholder="e.g. 27AAAPL1234C1Z5" disabled={saving} icon={<FaIdCard />} helpText="Leave blank to remove. Verified by admin." />
                            <EditableField label={`SAC Code${gstNumber.trim() ? '' : ' (Optional)'}`} value={sacCode} onChange={setSacCode} placeholder="e.g. 997212" disabled={saving || !gstNumber.trim()} helpText={gstNumber.trim() ? 'Required once GST Number is provided' : 'GST Number is required before entering SAC Code'} required={Boolean(gstNumber.trim())} />
                            <EditableField label="UPI ID (Optional)" value={upiId} onChange={setUpiId} placeholder="e.g. name@upi" disabled={saving} />
                            <EditableField label="Bank name" value={bankName} onChange={setBankName} disabled={saving} icon={<FaBuilding />} />
                            <EditableField label="Account holder name" value={bankAccountName} onChange={setBankAccountName} disabled={saving} />
                            <EditableField label="Account number" value={bankAccountNumber} onChange={setBankAccountNumber} disabled={saving} />
                            <EditableField label="IFSC" value={ifscCode} onChange={setIfscCode} disabled={saving} />
                          </div>
                        </ProfileSection>

                        <div className="flex justify-end gap-3">
                          <button type="button" onClick={() => setEditing(false)} className="px-6 py-2.5 border border-neutral-300 text-neutral-700 rounded-xl text-sm font-medium hover:bg-neutral-50 transition-colors">Cancel</button>
                          <button type="button" onClick={() => { handleSave(); setEditing(false); }} disabled={saving}
                            className="px-6 py-2.5 bg-gradient-to-br from-[#0F766E] to-[#0D9488] text-white rounded-xl text-sm font-bold hover:from-[#0D9488] hover:to-[#0F766E] shadow disabled:opacity-60 transition-colors duration-200 flex items-center gap-2">
                            {saving ? (<><span className="w-6 h-6 border-[2.5px] border-white/30 border-t-white border-r-white rounded-full animate-spin" /> Saving…</>) : (<><FaCircleCheck className="w-4 h-4" /> Save Changes</>)}
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

      <ImagePreviewModal open={avatarPreviewOpen} onClose={() => setAvatarPreviewOpen(false)} imageUrl={avatarUrl} title="Logo" shape="circle" emptyState="No logo yet — upload one below." uploading={avatarUploading} uploadLabel="Change logo" onUploadNew={() => fileInputRef.current?.click()} />
      <ImagePreviewModal open={coverPreviewOpen} onClose={() => setCoverPreviewOpen(false)} imageUrl={coverUrl} title="Cover Photo" shape="rect" emptyState="No cover photo yet — upload one below." uploading={coverUploading} uploadLabel="Change cover photo" onUploadNew={() => coverInputRef.current?.click()} />
    </div>
  );
}
