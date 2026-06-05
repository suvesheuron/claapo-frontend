import { useEffect, useState } from 'react';
import {
  FaBuilding, FaPlus, FaPencil, FaTrash, FaXmark,
  FaCalendarCheck, FaLocationDot, FaIndianRupeeSign,
  FaCalendarPlus, FaTriangleExclamation, FaFilePdf, FaImage,
} from 'react-icons/fa6';
import DashboardHeader from '../../components/DashboardHeader';
import DashboardSidebar from '../../components/DashboardSidebar';
import AppFooter from '../../components/AppFooter';
import DateInput from '../../components/DateInput';
import { useApiQuery } from '../../hooks/useApiQuery';
import { api, ApiException } from '../../services/api';
import { formatPaise } from '../../utils/currency';
import { locationNavLinks } from '../../navigation/dashboardNav';

interface PropertyAvailability {
  id: string;
  locationCity: string;
  availableFrom: string;
  availableTo: string;
  notes?: string | null;
}

interface ActiveBooking {
  id: string;
  status?: string;
  shootDates?: string[] | null;
}

interface PropertyItem {
  id: string;
  name: string;
  description?: string | null;
  subTypes?: string[];
  city?: string | null;
  address?: string | null;
  addressLat?: number | null;
  addressLng?: number | null;
  dailyBudget?: number | null;
  photoKeys?: string[];
  photoUrls?: string[];
  pdfKey?: string | null;
  pdfUrl?: string | null;
  pdfName?: string | null;
  availabilities?: PropertyAvailability[];
  bookingRequests?: ActiveBooking[];
}

interface UploadedPhoto { key: string; url: string }

export default function Properties() {
  useEffect(() => { document.title = 'Properties – Claapo'; }, []);

  const { data: list, loading, error, refetch } = useApiQuery<PropertyItem[]>('/properties/me');
  const properties = list ?? [];

  const [modal, setModal] = useState<'add' | 'edit' | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [availabilityFor, setAvailabilityFor] = useState<{ id: string; name: string } | null>(null);
  const [availLocation, setAvailLocation] = useState('');
  const [availFrom, setAvailFrom] = useState('');
  const [availTo, setAvailTo] = useState('');

  const [name, setName] = useState('');
  const [subTypesText, setSubTypesText] = useState('');
  const [dailyBudget, setDailyBudget] = useState('');
  const [photos, setPhotos] = useState<UploadedPhoto[]>([]);
  const [pdf, setPdf] = useState<{ key: string; name: string } | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingPdf, setUploadingPdf] = useState(false);

  const openAdd = () => {
    setSaveError(null);
    setName(''); setSubTypesText(''); setDailyBudget(''); setPhotos([]); setPdf(null);
    setModal('add');
  };

  const openEdit = (item: PropertyItem) => {
    setSaveError(null);
    setEditingId(item.id);
    setName(item.name);
    setSubTypesText((item.subTypes ?? []).join(', '));
    setDailyBudget(item.dailyBudget != null ? String(Math.round(item.dailyBudget / 100)) : '');
    // Seed existing photos (parallel key/url arrays) so the owner can keep/append.
    const keys = item.photoKeys ?? [];
    const urls = item.photoUrls ?? [];
    setPhotos(keys.map((key, i) => ({ key, url: urls[i] ?? '' })));
    setPdf(item.pdfKey ? { key: item.pdfKey, name: item.pdfName ?? 'Document.pdf' } : null);
    setModal('edit');
  };

  const closeModal = () => { setModal(null); setEditingId(null); setSaveError(null); };

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setSaveError(null);
    setUploadingPhoto(true);
    try {
      for (const file of files) {
        if (!file.type.startsWith('image/')) { setSaveError('Photos must be image files.'); continue; }
        if (file.size > 8 * 1024 * 1024) { setSaveError('Each photo must be under 8MB.'); continue; }
        const contentType = file.type || 'image/jpeg';
        const { uploadUrl, key } = await api.post<{ uploadUrl: string; key: string }>('/properties/upload-url', { kind: 'photo', contentType });
        await fetch(uploadUrl, { method: 'PUT', headers: { 'Content-Type': contentType }, body: file });
        setPhotos((prev) => [...prev, { key, url: URL.createObjectURL(file) }]);
      }
    } catch (err) {
      setSaveError(err instanceof ApiException ? err.payload.message : 'Failed to upload photo.');
    } finally {
      setUploadingPhoto(false);
      e.target.value = '';
    }
  };

  const handlePdfSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== 'application/pdf') { setSaveError('Please upload a PDF file.'); return; }
    if (file.size > 25 * 1024 * 1024) { setSaveError('PDF must be under 25MB.'); return; }
    setSaveError(null);
    setUploadingPdf(true);
    try {
      const { uploadUrl, key } = await api.post<{ uploadUrl: string; key: string }>('/properties/upload-url', { kind: 'pdf', contentType: 'application/pdf' });
      await fetch(uploadUrl, { method: 'PUT', headers: { 'Content-Type': 'application/pdf' }, body: file });
      setPdf({ key, name: file.name });
    } catch (err) {
      setSaveError(err instanceof ApiException ? err.payload.message : 'Failed to upload PDF.');
    } finally {
      setUploadingPdf(false);
      e.target.value = '';
    }
  };

  const handleSave = async () => {
    setSaveError(null);
    const nameTrim = name.trim();
    if (!nameTrim) { setSaveError('Name is required.'); return; }
    const budgetPaise = dailyBudget.trim() ? Math.round(parseFloat(dailyBudget) * 100) : undefined;
    if (budgetPaise !== undefined && (Number.isNaN(budgetPaise) || budgetPaise < 0)) { setSaveError('Daily price must be a valid number.'); return; }
    const subTypes = subTypesText.split(',').map((s) => s.trim()).filter(Boolean);
    const body = {
      name: nameTrim,
      subTypes,
      dailyBudget: budgetPaise,
      photoKeys: photos.map((p) => p.key),
      pdfKey: pdf?.key ?? null,
      pdfName: pdf?.name ?? null,
    };
    setSaving(true);
    try {
      if (modal === 'add') {
        await api.post('/properties', body);
      } else if (editingId) {
        await api.patch(`/properties/${editingId}`, body);
      }
      refetch();
      closeModal();
    } catch (err) {
      setSaveError(err instanceof ApiException ? err.payload.message : 'Failed to save.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setSaveError(null);
    setSaving(true);
    try {
      await api.delete(`/properties/${id}`);
      refetch();
      setDeleteConfirm(null);
    } catch (err) {
      setSaveError(err instanceof ApiException ? err.payload.message : 'Failed to delete.');
    } finally {
      setSaving(false);
    }
  };

  const openAddAvailability = (item: PropertyItem) => {
    setAvailabilityFor({ id: item.id, name: item.name });
    setAvailLocation(item.city ?? '');
    setAvailFrom('');
    setAvailTo('');
    setSaveError(null);
  };

  const handleAddAvailability = async () => {
    if (!availabilityFor) return;
    const loc = availLocation.trim();
    if (!loc) { setSaveError('Location is required.'); return; }
    if (!availFrom || !availTo) { setSaveError('From and To dates are required.'); return; }
    const from = new Date(availFrom);
    const to = new Date(availTo);
    if (from > to) { setSaveError('From date must be before To date.'); return; }
    setSaveError(null);
    setSaving(true);
    try {
      await api.post(`/properties/${availabilityFor.id}/availability`, {
        locationCity: loc,
        availableFrom: from.toISOString().slice(0, 10),
        availableTo: to.toISOString().slice(0, 10),
      });
      refetch();
      setAvailabilityFor(null);
    } catch (err) {
      setSaveError(err instanceof ApiException ? err.payload.message : 'Failed to add availability.');
    } finally {
      setSaving(false);
    }
  };

  const formatRate = (item: PropertyItem) => (item.dailyBudget != null ? `₹${formatPaise(item.dailyBudget)}/day` : '—');

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-[#F3F4F6] w-full">
      <DashboardHeader />
      <div className="flex-1 flex min-h-0 overflow-hidden">
        <DashboardSidebar links={locationNavLinks} />
        <main className="flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden">
          <div className="flex-1 min-h-0 overflow-auto">
            <div className="max-w-[1000px] mx-auto px-4 sm:px-6 lg:px-8 py-5">

              <div className="relative rounded-2xl bg-white border border-neutral-200/70 px-6 sm:px-8 py-6 mb-5 overflow-hidden shadow-soft">
                <div className="absolute inset-y-0 right-0 w-1/2 bg-gradient-to-l from-[#E0F2F1]/60 to-transparent pointer-events-none" />
                <span aria-hidden className="absolute left-0 top-6 bottom-6 w-1 rounded-r-full bg-gradient-to-b from-[#0F766E] to-[#14B8A6]" />
                <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pl-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#0F766E]">Listings</p>
                    <h1 className="text-[26px] sm:text-[28px] font-extrabold text-neutral-900 tracking-tight leading-tight mt-1">Properties</h1>
                    <p className="text-sm text-neutral-500 mt-1.5">List your properties and set-ups, with photos, PDF, price &amp; available dates</p>
                  </div>
                  <button onClick={openAdd} className="rounded-xl px-5 py-3 bg-gradient-to-br from-[#0F766E] to-[#0D9488] text-white text-sm font-bold hover:from-[#0D9488] hover:to-[#0F766E] shadow inline-flex items-center gap-2 transition-colors duration-200 shrink-0">
                    <FaPlus className="w-3.5 h-3.5" /> Add Property
                  </button>
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-3 rounded-xl bg-[#FEEBEA] border border-[#F40F02]/30 text-[#991B1B] text-sm p-4 mb-5">
                  <FaTriangleExclamation className="text-[#F40F02] shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" aria-busy="true">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="rounded-2xl bg-white border border-neutral-200/70 overflow-hidden shadow-soft">
                      <div className="skeleton h-40 w-full" />
                      <div className="p-4 space-y-2.5"><div className="skeleton h-4 w-3/5 rounded-md" /><div className="skeleton h-5 w-24 rounded-md" /></div>
                    </div>
                  ))}
                </div>
              ) : properties.length === 0 ? (
                <div className="rounded-2xl bg-white border border-neutral-200/70 shadow-soft p-12 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#E0F2F1] to-[#CCFBF1] ring-1 ring-[#0F766E]/15 flex items-center justify-center mx-auto mb-4 shadow-sm">
                    <FaBuilding className="text-[#0F766E] text-2xl" />
                  </div>
                  <p className="text-base font-bold text-neutral-900 mb-1.5">No properties yet</p>
                  <p className="text-sm text-neutral-500 mb-6 max-w-sm mx-auto leading-relaxed">Add your first property or set-up so production companies can discover and book it.</p>
                  <button onClick={openAdd} className="rounded-xl px-5 py-3 bg-gradient-to-br from-[#0F766E] to-[#0D9488] text-white text-sm font-bold hover:from-[#0D9488] hover:to-[#0F766E] shadow inline-flex items-center gap-2 transition-colors duration-200">
                    <FaPlus className="w-3.5 h-3.5" /> Add Property
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {properties.map((item) => {
                    const isOngoing = (item.bookingRequests?.length ?? 0) > 0;
                    const hasDates = (item.availabilities?.length ?? 0) > 0;
                    const photo = item.photoUrls?.[0];
                    return (
                      <div key={item.id} className="group rounded-2xl bg-white border border-neutral-200/70 shadow-soft overflow-hidden hover:border-[#0F766E] transition-colors duration-200 flex flex-col">
                        <div className="relative">
                          {photo ? (
                            <div className="w-full h-40 bg-neutral-100 overflow-hidden"><img src={photo} alt={item.name} className="w-full h-full object-cover" /></div>
                          ) : (
                            <div className="w-full h-40 bg-gradient-to-br from-[#E0F2F1] to-[#CCFBF1] flex items-center justify-center"><FaBuilding className="text-5xl text-[#0F766E]/35" /></div>
                          )}
                          <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5">
                            {isOngoing && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FEF3C7]/95 text-[#946A00] border border-[#F4C430] backdrop-blur-sm">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#F4C430] animate-pulse" /> Booked
                              </span>
                            )}
                            <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full backdrop-blur-sm ${hasDates ? 'bg-[#DCFCE7]/95 text-[#15803D] border border-[#86EFAC]' : 'bg-white/95 text-neutral-500 border border-neutral-200'}`}>
                              <FaCalendarCheck className="w-2.5 h-2.5" /> {hasDates ? 'Has dates' : 'No dates'}
                            </span>
                          </div>
                          {(item.photoUrls?.length ?? 0) > 1 && (
                            <span className="absolute bottom-2.5 left-2.5 inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-black/55 text-white backdrop-blur-sm">
                              <FaImage className="w-2.5 h-2.5" /> {item.photoUrls!.length}
                            </span>
                          )}
                        </div>

                        <div className="p-4 flex flex-col flex-1">
                          <h3 className="text-base font-bold text-neutral-900 truncate leading-tight mb-1.5">{item.name}</h3>
                          {(item.subTypes?.length ?? 0) > 0 && (
                            <div className="flex flex-wrap gap-1 mb-2">
                              {item.subTypes!.slice(0, 3).map((s) => (
                                <span key={s} className="px-2 py-0.5 bg-[#E0F2F1] text-[#0F766E] text-[10px] font-semibold rounded border border-[#0F766E]/20">{s}</span>
                              ))}
                            </div>
                          )}
                          <div className="inline-flex items-center gap-1.5 mb-2">
                            <FaIndianRupeeSign className="w-3 h-3 text-[#0F766E]" />
                            <span className="text-sm font-bold text-[#0F766E] tabular-nums">{formatRate(item)}</span>
                          </div>
                          {item.city && (
                            <div className="inline-flex items-center gap-1.5 text-[11px] text-neutral-500 mb-2">
                              <FaLocationDot className="w-3 h-3 text-neutral-400 shrink-0" /><span className="truncate">{item.city}</span>
                            </div>
                          )}
                          {item.pdfUrl && (
                            <a href={item.pdfUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-[11px] text-[#0F766E] font-semibold hover:underline mb-2">
                              <FaFilePdf className="w-3 h-3 text-[#DC2626]" /> {item.pdfName || 'View PDF'}
                            </a>
                          )}
                          {hasDates && (
                            <div className="rounded-xl bg-[#F3F4F6] border border-neutral-200 px-3 py-2 mb-3">
                              <p className="text-neutral-700 text-[11px] truncate">
                                {(item.availabilities ?? []).slice(0, 2).map((a) => `${a.locationCity} · ${a.availableFrom.slice(0, 10)}–${a.availableTo.slice(0, 10)}`).join('  ·  ')}
                                {(item.availabilities?.length ?? 0) > 2 && ` · +${item.availabilities!.length - 2} more`}
                              </p>
                            </div>
                          )}
                          <div className="flex items-center gap-2 mt-auto pt-1">
                            <button type="button" onClick={() => openAddAvailability(item)} className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold bg-[#DCFCE7] text-[#15803D] hover:bg-[#BBF7D0] transition-colors">
                              <FaCalendarPlus className="w-3 h-3" /> Set dates
                            </button>
                            <button type="button" onClick={() => openEdit(item)} className="w-10 h-10 rounded-xl bg-[#E0F2F1] ring-1 ring-[#0F766E]/15 flex items-center justify-center text-[#0F766E] hover:bg-[#CCFBF1] transition-colors shrink-0" aria-label="Edit property" title="Edit property">
                              <FaPencil className="text-xs" />
                            </button>
                            <button type="button" onClick={() => setDeleteConfirm(item.id)} className="w-10 h-10 rounded-xl bg-[#F3F4F6] flex items-center justify-center text-neutral-500 hover:bg-[#FEEBEA] hover:text-[#F40F02] transition-colors shrink-0" aria-label="Delete property" title="Delete property">
                              <FaTrash className="text-xs" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
          <AppFooter />
        </main>
      </div>

      {/* Add / Edit modal */}
      {modal && (
        <>
          <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-40" onClick={closeModal} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl border border-neutral-200/60 w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col">
              <div className="px-6 py-4 border-b border-neutral-100 flex items-center justify-between shrink-0">
                <div>
                  <h2 className="text-base font-bold text-neutral-900">{modal === 'add' ? 'Add Property' : 'Edit Property'}</h2>
                  <p className="text-xs text-neutral-400 mt-0.5">{modal === 'add' ? 'List a new property or set-up' : 'Update this listing'}</p>
                </div>
                <button type="button" onClick={closeModal} className="w-8 h-8 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-500 hover:bg-neutral-200 transition-colors" aria-label="Close"><FaXmark className="text-sm" /></button>
              </div>
              <div className="p-6 space-y-4 overflow-y-auto">
                {saveError && (
                  <div className="flex items-center gap-2.5 p-3 bg-[#FEEBEA] border border-[#F40F02]/30 rounded-xl">
                    <FaTriangleExclamation className="text-[#F40F02] text-xs shrink-0" /><p className="text-sm text-[#991B1B]">{saveError}</p>
                  </div>
                )}
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1.5">Name <span className="text-[#F40F02]">*</span></label>
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Sea-facing Heritage Villa" className="w-full px-4 py-2.5 border border-neutral-300 rounded-xl text-sm bg-[#F3F4F6] focus:bg-white focus:outline-none focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/15 transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1.5">Sub-types <span className="text-neutral-400 font-normal">(comma-separated)</span></label>
                  <input type="text" value={subTypesText} onChange={(e) => setSubTypesText(e.target.value)} placeholder="e.g. Heritage Villa, Sea-facing" className="w-full px-4 py-2.5 border border-neutral-300 rounded-xl text-sm bg-[#F3F4F6] focus:bg-white focus:outline-none focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/15 transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1.5">Daily price</label>
                  <div className="relative">
                    <FaIndianRupeeSign className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400 pointer-events-none" />
                    <input type="number" min={0} step={100} value={dailyBudget} onChange={(e) => setDailyBudget(e.target.value)} placeholder="0" className="w-full pl-9 pr-4 py-2.5 border border-neutral-300 rounded-xl text-sm bg-[#F3F4F6] focus:bg-white focus:outline-none focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/15 transition-all" />
                  </div>
                </div>
                {/* Photos */}
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1.5">Photos</label>
                  <div className="flex flex-wrap gap-2">
                    {photos.map((p, i) => (
                      <div key={p.key} className="relative w-20 h-20 rounded-lg overflow-hidden border border-neutral-200">
                        {p.url ? <img src={p.url} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-neutral-100 flex items-center justify-center"><FaImage className="text-neutral-300" /></div>}
                        <button type="button" onClick={() => setPhotos((prev) => prev.filter((_, idx) => idx !== i))} className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80" aria-label="Remove photo"><FaXmark className="text-[10px]" /></button>
                      </div>
                    ))}
                    <label className="w-20 h-20 rounded-lg border-2 border-dashed border-neutral-300 flex flex-col items-center justify-center cursor-pointer hover:border-[#0F766E] text-neutral-400 hover:text-[#0F766E] transition-colors">
                      {uploadingPhoto ? <span className="w-4 h-4 border-2 border-neutral-300 border-t-[#0F766E] rounded-full animate-spin" /> : <><FaPlus className="text-sm" /><span className="text-[10px] mt-0.5">Add</span></>}
                      <input type="file" accept="image/*" multiple className="hidden" onChange={handlePhotoSelect} disabled={uploadingPhoto} />
                    </label>
                  </div>
                </div>
                {/* PDF */}
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1.5">Detailed PDF</label>
                  {pdf ? (
                    <div className="flex items-center gap-2 text-sm">
                      <FaFilePdf className="w-4 h-4 text-[#DC2626]" />
                      <span className="truncate flex-1 text-neutral-700">{pdf.name}</span>
                      <button type="button" onClick={() => setPdf(null)} className="text-neutral-400 hover:text-[#F40F02]" aria-label="Remove PDF"><FaXmark /></button>
                    </div>
                  ) : (
                    <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-neutral-300 bg-white text-sm font-semibold text-neutral-700 hover:border-[#0F766E] hover:text-[#0F766E] transition-colors cursor-pointer">
                      {uploadingPdf ? <><span className="w-3.5 h-3.5 border-2 border-neutral-300 border-t-[#0F766E] rounded-full animate-spin" /> Uploading…</> : <><FaFilePdf className="w-3.5 h-3.5" /> Upload PDF</>}
                      <input type="file" accept="application/pdf" className="hidden" onChange={handlePdfSelect} disabled={uploadingPdf} />
                    </label>
                  )}
                </div>
              </div>
              <div className="px-6 py-4 border-t border-neutral-100 bg-neutral-50/50 flex gap-3 shrink-0">
                <button type="button" onClick={closeModal} disabled={saving} className="flex-1 rounded-xl py-2.5 border border-neutral-200 text-neutral-700 text-sm font-medium hover:bg-neutral-100 transition-colors disabled:opacity-50">Cancel</button>
                <button type="button" onClick={handleSave} disabled={saving || uploadingPhoto || uploadingPdf} className="flex-1 rounded-xl py-2.5 bg-gradient-to-br from-[#0F766E] to-[#0D9488] text-white text-sm font-bold hover:from-[#0D9488] hover:to-[#0F766E] shadow disabled:opacity-60 flex items-center justify-center gap-2 transition-colors">
                  {saving ? (<><span className="w-4 h-4 border-[2px] border-white/30 border-t-white border-r-white rounded-full animate-spin" />Saving…</>) : (modal === 'add' ? 'Add property' : 'Save changes')}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Set availability modal */}
      {availabilityFor && (
        <>
          <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-40" onClick={() => setAvailabilityFor(null)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl border border-neutral-200/60 w-full max-w-md overflow-hidden">
              <div className="px-6 py-4 border-b border-neutral-100 flex items-center justify-between">
                <div className="min-w-0">
                  <h2 className="text-base font-bold text-neutral-900">Set availability</h2>
                  <p className="text-xs text-neutral-400 mt-0.5 truncate">For <span className="font-semibold text-neutral-600">{availabilityFor.name}</span></p>
                </div>
                <button type="button" onClick={() => setAvailabilityFor(null)} className="w-8 h-8 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-500 hover:bg-neutral-200 transition-colors shrink-0" aria-label="Close"><FaXmark className="text-sm" /></button>
              </div>
              <div className="p-6 space-y-4">
                {saveError && (
                  <div className="flex items-center gap-2.5 p-3 bg-[#FEEBEA] border border-[#F40F02]/30 rounded-xl">
                    <FaTriangleExclamation className="text-[#F40F02] text-xs shrink-0" /><p className="text-sm text-[#991B1B]">{saveError}</p>
                  </div>
                )}
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1.5">Location (city) <span className="text-[#F40F02]">*</span></label>
                  <div className="relative">
                    <FaLocationDot className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400 pointer-events-none" />
                    <input type="text" value={availLocation} onChange={(e) => setAvailLocation(e.target.value)} placeholder="e.g. Mumbai" className="w-full pl-9 pr-4 py-2.5 border border-neutral-300 rounded-xl text-sm bg-[#F3F4F6] focus:bg-white focus:outline-none focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/15 transition-all" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1.5">From <span className="text-[#F40F02]">*</span></label>
                    <DateInput value={availFrom} onChange={(e) => setAvailFrom(e.target.value)} className="w-full px-4 py-2.5 border border-neutral-300 rounded-xl text-sm bg-[#F3F4F6] focus:bg-white focus:outline-none focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/15 transition-all" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1.5">To <span className="text-[#F40F02]">*</span></label>
                    <DateInput min={availFrom || undefined} value={availTo} onChange={(e) => setAvailTo(e.target.value)} className="w-full px-4 py-2.5 border border-neutral-300 rounded-xl text-sm bg-[#F3F4F6] focus:bg-white focus:outline-none focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/15 transition-all" />
                  </div>
                </div>
              </div>
              <div className="px-6 py-4 border-t border-neutral-100 bg-neutral-50/50 flex gap-3">
                <button type="button" onClick={() => setAvailabilityFor(null)} disabled={saving} className="flex-1 rounded-xl py-2.5 border border-neutral-200 text-neutral-700 text-sm font-medium hover:bg-neutral-100 transition-colors disabled:opacity-50">Cancel</button>
                <button type="button" onClick={handleAddAvailability} disabled={saving} className="flex-1 rounded-xl py-2.5 bg-gradient-to-br from-[#0F766E] to-[#0D9488] text-white text-sm font-bold hover:from-[#0D9488] hover:to-[#0F766E] shadow disabled:opacity-60 flex items-center justify-center gap-2 transition-colors">
                  {saving ? (<><span className="w-4 h-4 border-[2px] border-white/30 border-t-white border-r-white rounded-full animate-spin" />Saving…</>) : (<><FaCalendarPlus className="w-3 h-3" />Add dates</>)}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Delete confirm */}
      {deleteConfirm && (
        <>
          <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-40" onClick={() => setDeleteConfirm(null)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl border border-neutral-200/60 w-full max-w-sm overflow-hidden">
              <div className="p-6">
                <div className="w-11 h-11 rounded-xl bg-[#FEEBEA] ring-1 ring-[#F40F02]/20 flex items-center justify-center mb-3"><FaTrash className="text-[#F40F02] text-sm" /></div>
                <h2 className="text-base font-bold text-neutral-900 mb-1">Delete property?</h2>
                <p className="text-sm text-neutral-500 leading-relaxed">This listing will be removed. This action cannot be undone.</p>
                {saveError && (
                  <div className="mt-3 flex items-center gap-2.5 p-3 bg-[#FEEBEA] border border-[#F40F02]/30 rounded-xl">
                    <FaTriangleExclamation className="text-[#F40F02] text-xs shrink-0" /><p className="text-sm text-[#991B1B]">{saveError}</p>
                  </div>
                )}
              </div>
              <div className="px-6 py-4 border-t border-neutral-100 bg-neutral-50/50 flex gap-3">
                <button type="button" onClick={() => setDeleteConfirm(null)} disabled={saving} className="flex-1 rounded-xl py-2.5 border border-neutral-200 text-neutral-700 text-sm font-medium hover:bg-neutral-100 transition-colors disabled:opacity-50">Cancel</button>
                <button type="button" onClick={() => handleDelete(deleteConfirm)} disabled={saving} className="flex-1 rounded-xl py-2.5 bg-[#F40F02] text-white text-sm font-bold hover:bg-[#C20D02] disabled:opacity-60 flex items-center justify-center gap-2 transition-colors shadow-sm shadow-[#F40F02]/15">
                  {saving ? (<><span className="w-4 h-4 border-[2px] border-white/30 border-t-white border-r-white rounded-full animate-spin" />Deleting…</>) : (<><FaTrash className="w-3 h-3" />Delete</>)}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
