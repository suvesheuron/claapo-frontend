import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FaTriangleExclamation, FaCircleCheck, FaPen, FaUser,
  FaBriefcase, FaMoneyBillWave, FaIdCard, FaGlobe, FaCamera,
  FaFilm, FaPlus,
} from 'react-icons/fa6';
import DashboardHeader from '../../components/DashboardHeader';
import DashboardSidebar from '../../components/DashboardSidebar';
import AppFooter from '../../components/AppFooter';
import Avatar from '../../components/Avatar';
import { api, ApiException } from '../../services/api';
import { useApiQuery } from '../../hooks/useApiQuery';
import { paiseToRupees, rupeesToPaise } from '../../utils/currency';
import { castNavLinks } from '../../navigation/dashboardNav';
import {
  ProfileSection, InfoRow, EditableField, SkillTag, SocialLinks,
} from '../../components/profile/ProfileComponents';
import ContactVisibilityToggles from '../../components/profile/ContactVisibilityToggles';
import { FaLock } from 'react-icons/fa6';
import {
  ROLE_TYPES, GENDERS, BODY_TYPES, SKIN_TONES, EYE_COLORS,
  LOOK_TYPES, HAIR_TYPES, LANGUAGES, buildHeightOptions, cmToFeetInches,
} from '../../constants/castOptions';
import WorkShowcase, { type ShowcaseItem } from '../../components/profile/WorkShowcase';
import CoverMedia, { type CoverType } from '../../components/profile/CoverMedia';

// File types accepted by the Work Showcase upload (images, videos, documents —
// no audio). Kept in sync with the backend SHOWCASE_MIME_MAP.
const SHOWCASE_ACCEPT = [
  'image/jpeg', 'image/png', 'image/webp', 'image/gif',
  'video/mp4', 'video/quicktime', 'video/webm',
  'application/pdf', 'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
].join(',');

interface CastProfileData {
  displayName: string;
  roleType: 'actor' | 'model' | null;
  age: number | null;
  gender: string | null;
  heightCm: number | null;
  bodyType: string | null;
  skinTone: string | null;
  eyeColor: string | null;
  lookType: string | null;
  hairType: string | null;
  languages: string[];
  aboutMe: string | null;
  bio: string | null;
  extraSkills: string[];
  dailyBudget: number | null;
  address: string | null;
  locationCity: string | null;
  locationState: string | null;
  avatarUrl?: string | null;
  coverUrl?: string | null;
  coverType?: CoverType;
  showcaseItems?: ShowcaseItem[];
  // Social
  instagramUrl?: string | null;
  imdbUrl?: string | null;
  youtubeUrl?: string | null;
  vimeoUrl?: string | null;
  website?: string | null;
  // Billing
  panNumber?: string | null;
  billingName?: string | null;
  gstNumber?: string | null;
  sacCode?: string | null;
  upiId?: string | null;
  bankAccountName?: string | null;
  bankAccountNumber?: string | null;
  ifscCode?: string | null;
  bankName?: string | null;
}

interface MeResponse {
  id: string;
  email: string;
  phone: string;
  role: string;
  isEmailPublic?: boolean;
  isPhonePublic?: boolean;
  profile: CastProfileData | null;
}

const HEIGHT_OPTIONS = buildHeightOptions();

export default function CastProfile() {
  useEffect(() => { document.title = 'Cast Profile – Claapo'; }, []);

  const { data: me, loading, refetch } = useApiQuery<MeResponse>('/profile/me', { swr: true });

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  // Form state
  const [form, setForm] = useState<CastProfileData | null>(null);
  const [newSkillInput, setNewSkillInput] = useState('');

  // Avatar / cover photo / work showcase upload
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const showcaseInputRef = useRef<HTMLInputElement>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [coverUploading, setCoverUploading] = useState(false);
  const [showcaseUploading, setShowcaseUploading] = useState(false);
  const [showcaseDeletingId, setShowcaseDeletingId] = useState<string | null>(null);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { setError('Please upload an image file.'); return; }
    if (file.size > 5 * 1024 * 1024) { setError('Avatar must be under 5MB.'); return; }
    setError(null);
    setAvatarUploading(true);
    // Optimistic preview while the upload is in flight
    setForm((prev) => prev ? { ...prev, avatarUrl: URL.createObjectURL(file) } : prev);
    try {
      // S3 signs the PUT with the contentType we declare here. The browser PUT
      // below MUST send the same Content-Type header or S3 returns
      // SignatureDoesNotMatch (same gotcha as IndividualProfile).
      const contentType = file.type || 'image/jpeg';
      const { uploadUrl, key } = await api.post<{ uploadUrl: string; key: string }>('/profile/avatar', { contentType });
      await fetch(uploadUrl, { method: 'PUT', headers: { 'Content-Type': contentType }, body: file });
      await api.post('/profile/avatar/confirm', { key });
      await refetch();
    } catch (err) {
      setError(err instanceof ApiException ? err.payload.message : 'Failed to upload avatar.');
    } finally {
      setAvatarUploading(false);
      if (avatarInputRef.current) avatarInputRef.current.value = '';
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
    setForm((prev) => prev ? { ...prev, coverUrl: previewUrl, coverType: isVideo ? 'video' : 'image' } : prev);
    try {
      const contentType = file.type || 'image/jpeg';
      const { uploadUrl, key } = await api.post<{ uploadUrl: string; key: string }>('/profile/cover', { contentType });
      await fetch(uploadUrl, { method: 'PUT', headers: { 'Content-Type': contentType }, body: file });
      await api.post('/profile/cover/confirm', { key });
      await refetch();
    } catch (err) {
      setError(err instanceof ApiException ? err.payload.message : 'Failed to upload cover photo.');
    } finally {
      setCoverUploading(false);
      URL.revokeObjectURL(previewUrl);
      if (coverInputRef.current) coverInputRef.current.value = '';
    }
  };

  // Work Showcase upload. Two-step like avatar/cover: the backend signs the PUT
  // for the file's exact Content-Type (see getShowcaseUploadUrl), so the browser
  // PUT MUST send the same header or S3 returns SignatureDoesNotMatch. The
  // server tells us the resolved mediaType (image | video | document).
  const handleShowcaseChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const contentType = file.type;
    if (!contentType) { setError('Could not detect this file type. Try a different file.'); return; }
    const isVideo = contentType.startsWith('video/');
    const maxBytes = isVideo ? 100 * 1024 * 1024 : 25 * 1024 * 1024;
    if (file.size > maxBytes) {
      setError(isVideo ? 'Videos must be under 100MB.' : 'Files must be under 25MB.');
      return;
    }
    setError(null);
    setShowcaseUploading(true);
    try {
      const { uploadUrl, key, mediaType } = await api.post<{ uploadUrl: string; key: string; mediaType: ShowcaseItem['mediaType'] }>(
        '/profile/showcase/upload-url',
        { contentType },
      );
      await fetch(uploadUrl, { method: 'PUT', headers: { 'Content-Type': contentType }, body: file });
      await api.post('/profile/showcase', {
        key,
        mediaType,
        title: file.name.replace(/\.[^.]+$/, ''),
        fileName: file.name,
        mimeType: contentType,
      });
      await refetch();
    } catch (err) {
      setError(err instanceof ApiException ? err.payload.message : 'Failed to upload file.');
    } finally {
      setShowcaseUploading(false);
      if (showcaseInputRef.current) showcaseInputRef.current.value = '';
    }
  };

  const handleShowcaseDelete = async (id: string) => {
    setError(null);
    setShowcaseDeletingId(id);
    try {
      await api.delete(`/profile/showcase/${id}`);
      await refetch();
    } catch (err) {
      setError(err instanceof ApiException ? err.payload.message : 'Failed to remove item.');
    } finally {
      setShowcaseDeletingId(null);
    }
  };

  useEffect(() => {
    if (me?.profile) {
      setForm({
        ...me.profile,
        languages: me.profile.languages ?? [],
        extraSkills: me.profile.extraSkills ?? [],
      });
    } else if (me && !me.profile) {
      // First-time setup
      setForm({
        displayName: '',
        roleType: null, age: null, gender: null,
        heightCm: null, bodyType: null, skinTone: null, eyeColor: null,
        lookType: null, hairType: null, languages: [],
        aboutMe: null, bio: null, extraSkills: [],
        dailyBudget: null, address: null, locationCity: null, locationState: null,
      });
    }
  }, [me]);

  const heightLabel = useMemo(() => cmToFeetInches(form?.heightCm), [form?.heightCm]);

  const setField = useCallback(<K extends keyof CastProfileData>(k: K, v: CastProfileData[K]) => {
    setForm((prev) => prev ? { ...prev, [k]: v } : prev);
  }, []);

  const toggleLanguage = useCallback((lang: string) => {
    setForm((prev) => {
      if (!prev) return prev;
      const current = prev.languages ?? [];
      const next = current.includes(lang)
        ? current.filter((l) => l !== lang)
        : [...current, lang];
      return { ...prev, languages: next };
    });
  }, []);

  const addSkill = useCallback(() => {
    const trimmed = newSkillInput.trim();
    if (!trimmed) return;
    setForm((prev) => {
      if (!prev) return prev;
      if ((prev.extraSkills ?? []).includes(trimmed)) return prev;
      return { ...prev, extraSkills: [...(prev.extraSkills ?? []), trimmed] };
    });
    setNewSkillInput('');
  }, [newSkillInput]);

  const removeSkill = useCallback((skill: string) => {
    setForm((prev) => prev ? { ...prev, extraSkills: prev.extraSkills.filter((s) => s !== skill) } : prev);
  }, []);

  const handleSave = useCallback(async () => {
    if (!form) return;
    setError(null);
    // Address is required for invoices — match the IndividualProfile rule so
    // cast members can't get into an "issued invoice, no billing address"
    // state when raising tax invoices.
    if (!form.address?.trim()) {
      setError('Address is required for invoices. Please add your mailing address.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        displayName: form.displayName?.trim() || undefined,
        roleType: form.roleType || undefined,
        age: form.age ?? undefined,
        gender: form.gender || undefined,
        heightCm: form.heightCm ?? undefined,
        bodyType: form.bodyType || undefined,
        skinTone: form.skinTone || undefined,
        eyeColor: form.eyeColor || undefined,
        lookType: form.lookType || undefined,
        hairType: form.hairType || undefined,
        languages: form.languages,
        aboutMe: form.aboutMe || undefined,
        bio: form.bio || undefined,
        extraSkills: form.extraSkills,
        dailyBudget: form.dailyBudget ?? undefined,
        address: form.address || undefined,
        locationCity: form.locationCity || undefined,
        locationState: form.locationState || undefined,
        instagramUrl: form.instagramUrl || undefined,
        imdbUrl: form.imdbUrl || undefined,
        youtubeUrl: form.youtubeUrl || undefined,
        vimeoUrl: form.vimeoUrl || undefined,
        website: form.website || undefined,
        panNumber: form.panNumber || undefined,
        billingName: form.billingName || undefined,
        gstNumber: form.gstNumber || undefined,
        sacCode: form.sacCode || undefined,
        upiId: form.upiId || undefined,
        bankAccountName: form.bankAccountName || undefined,
        bankAccountNumber: form.bankAccountNumber || undefined,
        ifscCode: form.ifscCode || undefined,
        bankName: form.bankName || undefined,
      };
      await api.patch('/profile/cast', payload);
      setSavedAt(Date.now());
      setEditing(false);
      await refetch();
    } catch (err) {
      const msg = err instanceof ApiException ? err.payload.message : 'Failed to save profile.';
      setError(msg);
    } finally {
      setSaving(false);
    }
  }, [form, refetch]);

  if (loading || !form) {
    return (
      <div className="min-h-screen bg-[#F3F4F6] flex">
        <DashboardSidebar links={castNavLinks} />
        <div className="flex-1 flex flex-col">
          <DashboardHeader />
          <div className="flex-1 flex items-center justify-center">
            <span className="w-10 h-10 border-[2.5px] border-[#3678F1]/15 border-t-[#3678F1] rounded-full animate-spin" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F3F4F6] flex">
      <DashboardSidebar links={castNavLinks} />
      <div className="flex-1 flex flex-col min-w-0">
        <DashboardHeader />

        <main className="flex-1 px-6 py-8 max-w-5xl w-full mx-auto">
          {/* Header card — cover banner + avatar + actions */}
          <div className="rounded-2xl bg-white border border-neutral-200 overflow-hidden mb-6">
            {/* Cover banner — image or motion (video) banner */}
            <div className="relative h-40 sm:h-48 overflow-hidden bg-gradient-to-br from-[#E8F0FE] to-[#DBEAFE] group">
              <CoverMedia url={form.coverUrl} type={form.coverType} />
              <button
                type="button"
                onClick={() => coverInputRef.current?.click()}
                disabled={coverUploading}
                className="absolute top-3 right-3 inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white/95 hover:bg-white text-neutral-800 text-xs font-semibold shadow-sm border border-white/60 disabled:opacity-60"
                title="Change cover photo"
              >
                {coverUploading ? (
                  <><span className="w-3.5 h-3.5 border-2 border-neutral-400 border-t-neutral-800 rounded-full animate-spin" /> Uploading…</>
                ) : (
                  <><FaCamera className="w-3 h-3" /> Change cover</>
                )}
              </button>
              <input
                ref={coverInputRef}
                type="file"
                accept="image/*,video/*"
                hidden
                onChange={handleCoverChange}
              />
            </div>

            {/* Avatar + identity + actions row */}
            <div className="px-6 pb-6 pt-0 flex items-start gap-5">
              {/* Avatar pulled up over the banner */}
              <div className="relative shrink-0 -mt-12">
                <div className="rounded-full ring-4 ring-white">
                  <Avatar src={form.avatarUrl ?? undefined} name={form.displayName || 'Cast'} size="xl" />
                </div>
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={avatarUploading}
                  className="absolute bottom-1 right-1 w-9 h-9 rounded-full bg-[#3678F1] text-white shadow-md ring-2 ring-white flex items-center justify-center hover:bg-[#2563EB] disabled:opacity-60"
                  title="Change profile photo"
                  aria-label="Change profile photo"
                >
                  {avatarUploading ? (
                    <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  ) : (
                    <FaCamera className="w-3.5 h-3.5" />
                  )}
                </button>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={handleAvatarChange}
                />
              </div>

              <div className="flex-1 min-w-0 pt-3">
                <h1 className="text-2xl font-bold text-neutral-900 truncate">{form.displayName || 'Set your name'}</h1>
                <p className="text-sm text-neutral-500 mt-1">
                  {form.roleType ? form.roleType.charAt(0).toUpperCase() + form.roleType.slice(1) : 'Cast'}
                  {form.locationCity ? ` · ${form.locationCity}` : ''}
                </p>
              </div>

              <div className="flex items-center gap-2 pt-3 shrink-0">
                <button
                  type="button"
                  onClick={() => editing ? handleSave() : setEditing(true)}
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#3678F1] text-white text-sm font-semibold hover:bg-[#2563EB] transition-colors disabled:opacity-50"
                >
                  {saving ? (
                    <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving…</>
                  ) : editing ? (
                    <><FaCircleCheck /> Save</>
                  ) : (
                    <><FaPen /> Edit</>
                  )}
                </button>
                {editing && !saving && (
                  <button
                    type="button"
                    onClick={() => { setEditing(false); refetch(); }}
                    className="px-4 py-2.5 rounded-xl border border-neutral-300 text-sm font-semibold text-neutral-700 hover:bg-neutral-50"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-6 rounded-xl bg-[#F40F02]/5 border border-[#F40F02]/30 px-4 py-3 flex items-start gap-2">
              <FaTriangleExclamation className="text-[#F40F02] mt-0.5 shrink-0" />
              <p className="text-sm text-[#F40F02]">{error}</p>
            </div>
          )}

          {savedAt && !editing && (
            <div className="mb-6 rounded-xl bg-emerald-50 border border-emerald-300 px-4 py-3 text-sm text-emerald-700">
              Profile saved.
            </div>
          )}

          {/* Personal Details */}
          <ProfileSection
            title="Personal Details"
            description="Physical attributes and languages — used by casting directors when filtering cast."
            icon={<FaUser />}
            className="mb-6"
          >
            {editing ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <EditableField label="Full name" value={form.displayName ?? ''} onChange={(v) => setField('displayName', v)} required />
                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1.5">Age</label>
                  <input
                    type="number" min={1} max={120}
                    value={form.age ?? ''}
                    onChange={(e) => setField('age', e.target.value ? parseInt(e.target.value, 10) : null)}
                    className="w-full px-3 py-2.5 border border-neutral-300 rounded-xl text-sm bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1.5">Gender</label>
                  <select
                    value={form.gender ?? ''}
                    onChange={(e) => setField('gender', e.target.value || null)}
                    className="w-full px-3 py-2.5 border border-neutral-300 rounded-xl text-sm bg-white"
                  >
                    <option value="">Select…</option>
                    {GENDERS.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1.5">Height</label>
                  <select
                    value={form.heightCm ?? ''}
                    onChange={(e) => setField('heightCm', e.target.value ? parseInt(e.target.value, 10) : null)}
                    className="w-full px-3 py-2.5 border border-neutral-300 rounded-xl text-sm bg-white"
                  >
                    <option value="">Select height</option>
                    {HEIGHT_OPTIONS.map((h) => <option key={h.value} value={h.value}>{h.label}</option>)}
                  </select>
                </div>
                <DropdownField label="Body type" value={form.bodyType} options={[...BODY_TYPES]} onChange={(v) => setField('bodyType', v)} />
                <DropdownField label="Skin tone" value={form.skinTone} options={[...SKIN_TONES]} onChange={(v) => setField('skinTone', v)} />
                <DropdownField label="Eye color" value={form.eyeColor} options={[...EYE_COLORS]} onChange={(v) => setField('eyeColor', v)} />
                <DropdownField label="Look type" value={form.lookType} options={[...LOOK_TYPES]} onChange={(v) => setField('lookType', v)} />
                <DropdownField label="Hair type" value={form.hairType} options={[...HAIR_TYPES]} onChange={(v) => setField('hairType', v)} />
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-neutral-700 mb-1.5">Languages</label>
                  <div className="flex flex-wrap gap-2">
                    {LANGUAGES.map((lang) => {
                      const active = form.languages?.includes(lang);
                      return (
                        <button
                          key={lang}
                          type="button"
                          onClick={() => toggleLanguage(lang)}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                            active
                              ? 'bg-[#3678F1] text-white border-[#3678F1]'
                              : 'bg-white text-neutral-700 border-neutral-300 hover:border-[#3678F1] hover:text-[#3678F1]'
                          }`}
                        >
                          {lang}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <dl>
                <InfoRow label="Age" value={form.age ?? '—'} />
                <InfoRow label="Gender" value={form.gender ?? '—'} />
                <InfoRow label="Height" value={heightLabel ?? '—'} />
                <InfoRow label="Body type" value={form.bodyType ?? '—'} />
                <InfoRow label="Skin tone" value={form.skinTone ?? '—'} />
                <InfoRow label="Eye color" value={form.eyeColor ?? '—'} />
                <InfoRow label="Look type" value={form.lookType ?? '—'} />
                <InfoRow label="Hair type" value={form.hairType ?? '—'} />
                <InfoRow
                  label="Languages"
                  value={form.languages?.length ? form.languages.join(', ') : '—'}
                />
              </dl>
            )}
          </ProfileSection>

          {/* Professional Section */}
          <ProfileSection
            title="Professional"
            description="What you're known for and how much you charge."
            icon={<FaBriefcase />}
            className="mb-6"
          >
            {editing ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <EditableField
                    label="About me"
                    type="textarea"
                    rows={4}
                    value={form.aboutMe ?? ''}
                    onChange={(v) => setField('aboutMe', v)}
                    placeholder="Trained at FTII. Featured in two indie films and a Tata campaign…"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1.5">Role type</label>
                  <select
                    value={form.roleType ?? ''}
                    onChange={(e) => setField('roleType', (e.target.value || null) as 'actor' | 'model' | null)}
                    className="w-full px-3 py-2.5 border border-neutral-300 rounded-xl text-sm bg-white"
                  >
                    <option value="">Select…</option>
                    {ROLE_TYPES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1.5">Daily budget (₹)</label>
                  <input
                    type="number" min={0}
                    value={form.dailyBudget != null ? paiseToRupees(form.dailyBudget) : ''}
                    onChange={(e) => setField('dailyBudget', e.target.value ? rupeesToPaise(Number(e.target.value)) : null)}
                    className="w-full px-3 py-2.5 border border-neutral-300 rounded-xl text-sm bg-white"
                    placeholder="50000"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-neutral-700 mb-1.5">Extra skills</label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {form.extraSkills.map((skill) => (
                      <SkillTag key={skill} skill={skill} onRemove={() => removeSkill(skill)} />
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newSkillInput}
                      onChange={(e) => setNewSkillInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSkill(); } }}
                      placeholder="e.g., Horse Riding, Swimming, Martial Arts"
                      className="flex-1 px-3 py-2.5 border border-neutral-300 rounded-xl text-sm bg-white"
                    />
                    <button
                      type="button"
                      onClick={addSkill}
                      className="px-4 py-2.5 rounded-xl bg-[#3678F1] text-white text-sm font-semibold hover:bg-[#2563EB]"
                    >
                      Add
                    </button>
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <EditableField
                    label="Address (required for invoices)"
                    type="textarea"
                    rows={2}
                    value={form.address ?? ''}
                    onChange={(v) => setField('address', v)}
                    placeholder="Full street address, city, PIN — used on invoices"
                    helpText="Required for tax-compliant invoices."
                    required
                  />
                </div>
                <EditableField label="City" value={form.locationCity ?? ''} onChange={(v) => setField('locationCity', v)} />
                <EditableField label="State" value={form.locationState ?? ''} onChange={(v) => setField('locationState', v)} />
              </div>
            ) : (
              <dl>
                <InfoRow label="About me" value={form.aboutMe ?? '—'} />
                <InfoRow label="Role type" value={form.roleType ?? '—'} />
                <InfoRow label="Daily budget" value={form.dailyBudget != null ? `₹ ${paiseToRupees(form.dailyBudget).toLocaleString('en-IN')}` : '—'} />
                <InfoRow
                  label="Extra skills"
                  value={form.extraSkills?.length ? form.extraSkills.join(', ') : '—'}
                />
                <InfoRow label="Address" value={form.address ?? '—'} />
                <InfoRow label="City" value={form.locationCity ?? '—'} />
                <InfoRow label="State" value={form.locationState ?? '—'} />
              </dl>
            )}
          </ProfileSection>

          {/* Work Showcase */}
          <ProfileSection
            title="Work Showcase"
            description="Show off your work — photos, videos and documents. Casting directors see this on your public profile."
            icon={<FaFilm />}
            className="mb-6"
          >
            <div className="space-y-4">
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => showcaseInputRef.current?.click()}
                  disabled={showcaseUploading}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#3678F1] text-white text-sm font-semibold hover:bg-[#2563EB] transition-colors disabled:opacity-60"
                >
                  {showcaseUploading ? (
                    <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Uploading…</>
                  ) : (
                    <><FaPlus className="w-3.5 h-3.5" /> Add media</>
                  )}
                </button>
                <p className="text-[11px] text-neutral-400">
                  Images & docs up to 25MB, videos up to 100MB. No audio.
                </p>
              </div>

              <WorkShowcase
                items={form.showcaseItems ?? []}
                editable
                onDelete={handleShowcaseDelete}
                deletingId={showcaseDeletingId}
                emptyMessage="No work showcased yet — add photos, videos or documents."
              />

              <input
                ref={showcaseInputRef}
                type="file"
                accept={SHOWCASE_ACCEPT}
                hidden
                onChange={handleShowcaseChange}
              />
            </div>
          </ProfileSection>

          {/* Social Links */}
          <ProfileSection
            title="Social Links"
            description="Show your reels and portfolio."
            icon={<FaGlobe />}
            className="mb-6"
          >
            <SocialLinks
              links={{
                instagramUrl: form.instagramUrl ?? '',
                imdbUrl: form.imdbUrl ?? '',
                youtubeUrl: form.youtubeUrl ?? '',
                vimeoUrl: form.vimeoUrl ?? '',
                website: form.website ?? '',
              }}
              editable={editing}
              onChange={(field, value) => {
                if (field === 'instagramUrl') setField('instagramUrl', value || null);
                else if (field === 'imdbUrl') setField('imdbUrl', value || null);
                else if (field === 'youtubeUrl') setField('youtubeUrl', value || null);
                else if (field === 'vimeoUrl') setField('vimeoUrl', value || null);
                else if (field === 'website') setField('website', value || null);
              }}
            />
          </ProfileSection>

          {/* Billing */}
          <ProfileSection
            title="Invoice & Billing"
            description="Used when you issue an invoice for a booking."
            icon={<FaMoneyBillWave />}
            className="mb-6"
          >
            {editing ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <EditableField label="Billing name" value={form.billingName ?? ''} onChange={(v) => setField('billingName', v)} />
                <EditableField label="PAN number" value={form.panNumber ?? ''} onChange={(v) => setField('panNumber', v)} icon={<FaIdCard />} />
                <EditableField label="GST number (optional)" value={form.gstNumber ?? ''} onChange={(v) => setField('gstNumber', v)} />
                <EditableField label="SAC code (required with GST)" value={form.sacCode ?? ''} onChange={(v) => setField('sacCode', v)} />
                <EditableField label="UPI ID" value={form.upiId ?? ''} onChange={(v) => setField('upiId', v)} />
                <EditableField label="Bank account name" value={form.bankAccountName ?? ''} onChange={(v) => setField('bankAccountName', v)} />
                <EditableField label="Bank account number" value={form.bankAccountNumber ?? ''} onChange={(v) => setField('bankAccountNumber', v)} />
                <EditableField label="IFSC code" value={form.ifscCode ?? ''} onChange={(v) => setField('ifscCode', v)} />
                <EditableField label="Bank name" value={form.bankName ?? ''} onChange={(v) => setField('bankName', v)} />
              </div>
            ) : (
              <dl>
                <InfoRow label="Billing name" value={form.billingName ?? '—'} />
                <InfoRow label="PAN" value={form.panNumber ?? '—'} />
                <InfoRow label="GST" value={form.gstNumber ?? '—'} />
                <InfoRow label="SAC code" value={form.sacCode ?? '—'} />
                <InfoRow label="UPI ID" value={form.upiId ?? '—'} />
                <InfoRow label="Bank account name" value={form.bankAccountName ?? '—'} />
                <InfoRow label="Bank account" value={form.bankAccountNumber ?? '—'} />
                <InfoRow label="IFSC" value={form.ifscCode ?? '—'} />
                <InfoRow label="Bank" value={form.bankName ?? '—'} />
              </dl>
            )}
          </ProfileSection>

          {editing && (
            <ProfileSection title="Contact Visibility" icon={<FaLock />}>
              <ContactVisibilityToggles
                email={me?.email}
                phone={me?.phone}
                initialEmailPublic={me?.isEmailPublic ?? true}
                initialPhonePublic={me?.isPhonePublic ?? true}
                disabled={saving}
              />
            </ProfileSection>
          )}
        </main>

        <AppFooter />
      </div>
    </div>
  );
}

/** Inline dropdown field — keeps the JSX above readable. */
function DropdownField({
  label, value, options, onChange,
}: { label: string; value: string | null; options: string[]; onChange: (v: string | null) => void }) {
  return (
    <div>
      <label className="block text-xs font-medium text-neutral-700 mb-1.5">{label}</label>
      <select
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value || null)}
        className="w-full px-3 py-2.5 border border-neutral-300 rounded-xl text-sm bg-white"
      >
        <option value="">Select…</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}
