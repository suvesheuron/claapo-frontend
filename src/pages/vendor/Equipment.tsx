import { useEffect, useState } from 'react';
import {
  FaTruck, FaPlus, FaPencil, FaTrash, FaXmark,
  FaBoxesStacked, FaCalendarCheck, FaBriefcase,
  FaLocationDot, FaIndianRupeeSign, FaCalendarPlus,
  FaCircleInfo, FaTriangleExclamation,
} from 'react-icons/fa6';
import DashboardHeader from '../../components/DashboardHeader';
import DashboardSidebar from '../../components/DashboardSidebar';
import AppFooter from '../../components/AppFooter';
import { useApiQuery } from '../../hooks/useApiQuery';
import { api, ApiException } from '../../services/api';
import { formatPaise } from '../../utils/currency';
import { vendorNavLinks } from '../../navigation/dashboardNav';
import LocationAutocomplete from '../../components/LocationAutocomplete';

interface EquipmentAvailability {
  id: string;
  locationCity: string;
  availableFrom: string;
  availableTo: string;
  notes?: string | null;
}

interface ActiveBooking {
  id: string;
  project: {
    title: string;
    startDate: string;
    endDate: string;
    locationCity?: string | null;
    shootLocations?: string[];
  };
}

interface EquipmentItem {
  id: string;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  currentCity?: string | null;
  dailyBudget?: number | null;
  availabilities?: EquipmentAvailability[];
  bookingRequests?: ActiveBooking[];
  /** From API: project shoot location while booked + short return buffer */
  effectiveLocation?: string | null;
  effectiveLocationUntil?: string | null;
}

export default function Equipment() {
  useEffect(() => { document.title = 'Equipment – Claapo'; }, []);

  const { data: equipmentList, loading, error, refetch } = useApiQuery<EquipmentItem[]>('/equipment/me');
  const equipment = equipmentList ?? [];

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
  const [description, setDescription] = useState('');
  const [currentCity, setCurrentCity] = useState('');
  const [dailyBudget, setDailyBudget] = useState('');

  const openAdd = () => {
    setSaveError(null);
    setName('');
    setDescription('');
    setCurrentCity('');
    setDailyBudget('');
    setModal('add');
  };

  const openEdit = (item: EquipmentItem) => {
    setSaveError(null);
    setEditingId(item.id);
    setName(item.name);
    setDescription(item.description ?? '');
    setCurrentCity(item.currentCity ?? '');
    setDailyBudget(item.dailyBudget != null ? String(Math.round(item.dailyBudget / 100)) : '');
    setModal('edit');
  };

  const closeModal = () => {
    setModal(null);
    setEditingId(null);
    setSaveError(null);
  };

  const handleSave = async () => {
    setSaveError(null);
    const nameTrim = name.trim();
    if (!nameTrim) {
      setSaveError('Name is required.');
      return;
    }
    const budgetPaise = dailyBudget.trim() ? Math.round(parseFloat(dailyBudget) * 100) : undefined;
    if (budgetPaise !== undefined && (Number.isNaN(budgetPaise) || budgetPaise < 0)) {
      setSaveError('Daily budget must be a valid number.');
      return;
    }
    setSaving(true);
    try {
      if (modal === 'add') {
        await api.post('/equipment', {
          name: nameTrim,
          description: description.trim() || undefined,
          currentCity: currentCity.trim() || undefined,
          dailyBudget: budgetPaise,
        });
      } else if (editingId) {
        await api.patch(`/equipment/${editingId}`, {
          name: nameTrim,
          description: description.trim() || undefined,
          currentCity: currentCity.trim() || undefined,
          dailyBudget: budgetPaise,
        });
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
      await api.delete(`/equipment/${id}`);
      refetch();
      setDeleteConfirm(null);
    } catch (err) {
      setSaveError(err instanceof ApiException ? err.payload.message : 'Failed to delete.');
    } finally {
      setSaving(false);
    }
  };

  const openAddAvailability = (item: EquipmentItem) => {
    setAvailabilityFor({ id: item.id, name: item.name });
    setAvailLocation(item.currentCity ?? '');
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
      await api.post(`/equipment/${availabilityFor.id}/availability`, {
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

  const formatRate = (item: EquipmentItem) => {
    if (item.dailyBudget != null) {
      return `₹${formatPaise(item.dailyBudget)}/day`;
    }
    return '—';
  };

  const formatBookingDate = (start: string, end: string) => {
    const d = (s: string) => new Date(s).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    return start === end ? d(start) : `${d(start)} – ${d(end)}`;
  };

  const availableCount = equipment.filter((e) => (e.availabilities?.length ?? 0) > 0).length;
  const bookedCount = equipment.filter((e) => (e.bookingRequests?.length ?? 0) > 0).length;

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-[#F3F4F6] w-full">
      <DashboardHeader />

      <div className="flex-1 flex min-h-0 overflow-hidden">
        <DashboardSidebar links={vendorNavLinks} />

        <main className="flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden">
          <div className="flex-1 min-h-0 overflow-auto">
            <div className="max-w-[1000px] mx-auto px-4 sm:px-6 lg:px-8 py-5">

              <div className="relative rounded-2xl bg-white border border-neutral-200/70 px-6 sm:px-8 py-6 mb-5 overflow-hidden shadow-soft">
                <div className="absolute inset-y-0 right-0 w-1/2 bg-gradient-to-l from-[#E8F0FE]/60 to-transparent pointer-events-none" />
                <span aria-hidden className="absolute left-0 top-6 bottom-6 w-1 rounded-r-full bg-gradient-to-b from-[#3678F1] to-[#5B9DF9]" />
                <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pl-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#3678F1]">Inventory</p>
                    <h1 className="text-[26px] sm:text-[28px] font-extrabold text-neutral-900 tracking-tight leading-tight mt-1">Equipment</h1>
                    <p className="text-sm text-neutral-500 mt-1.5">Manage your inventory, rates, and availability</p>
                  </div>
                  <button
                    onClick={openAdd}
                    className="rounded-xl px-5 py-3 bg-gradient-to-br from-[#3678F1] to-[#2563EB] text-white text-sm font-bold hover:from-[#2563EB] hover:to-[#1D4ED8] shadow-brand inline-flex items-center gap-2 transition-colors duration-200 shrink-0"
                  >
                    <FaPlus className="w-3.5 h-3.5" /> Add Equipment
                  </button>
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-3 rounded-xl bg-[#FEEBEA] border border-[#F40F02]/30 text-[#991B1B] text-sm p-4 mb-5">
                  <FaTriangleExclamation className="text-[#F40F02] shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
                {[
                  { label: 'Total items',          value: equipment.length,  Icon: FaBoxesStacked,  tint: 'bg-[#E8F0FE]', iconColor: 'text-[#3678F1]', ring: 'ring-[#3678F1]/15', valueColor: 'text-neutral-900' },
                  { label: 'With availability set',value: availableCount,    Icon: FaCalendarCheck, tint: 'bg-[#DCFCE7]', iconColor: 'text-[#15803D]', ring: 'ring-[#22C55E]/20', valueColor: 'text-[#15803D]' },
                  { label: 'Currently booked',     value: bookedCount,       Icon: FaBriefcase,     tint: 'bg-[#FEF7E0]', iconColor: 'text-[#8A6508]', ring: 'ring-[#F4C430]/30', valueColor: 'text-[#8A6508]' },
                ].map(({ label, value, Icon, tint, iconColor, ring, valueColor }) => (
                  <div key={label} className="rounded-2xl bg-white border border-neutral-200/70 shadow-soft p-4 hover:border-[#3678F1] transition-colors duration-200 flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl ${tint} ring-1 ${ring} flex items-center justify-center shrink-0`}>
                      <Icon className={`${iconColor} text-sm`} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] font-medium text-neutral-500 truncate">{label}</p>
                      {loading ? (
                        <div className="skeleton h-6 w-10 rounded-md mt-1" />
                      ) : (
                        <p className={`text-xl font-extrabold tabular-nums mt-0.5 ${valueColor}`}>{value}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" aria-busy="true" aria-label="Loading equipment">
                  {[1,2,3,4,5,6].map(i => (
                    <div key={i} className="rounded-2xl bg-white border border-neutral-200/70 overflow-hidden shadow-soft" style={{ animationDelay: `${i * 60}ms` }}>
                      <div className="skeleton h-40 w-full" />
                      <div className="p-4 space-y-2.5">
                        <div className="flex items-center justify-between gap-2">
                          <div className="skeleton h-4 w-3/5 rounded-md" />
                          <div className="skeleton h-5 w-16 rounded-full" />
                        </div>
                        <div className="skeleton h-3 w-2/5 rounded-md" />
                        <div className="skeleton h-5 w-24 rounded-md" />
                        <div className="flex gap-2 pt-2">
                          <div className="skeleton h-9 flex-1 rounded-xl" />
                          <div className="skeleton h-9 w-9 rounded-xl" />
                          <div className="skeleton h-9 w-9 rounded-xl" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : equipment.length === 0 ? (
                <div className="rounded-2xl bg-white border border-neutral-200/70 shadow-soft p-12 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#E8F0FE] to-[#DBEAFE] ring-1 ring-[#3678F1]/15 flex items-center justify-center mx-auto mb-4 shadow-sm">
                    <FaTruck className="text-[#3678F1] text-2xl" />
                  </div>
                  <p className="text-base font-bold text-neutral-900 mb-1.5">No equipment yet</p>
                  <p className="text-sm text-neutral-500 mb-6 max-w-sm mx-auto leading-relaxed">Add your first item so production companies can discover and book your gear.</p>
                  <button onClick={openAdd} className="rounded-xl px-5 py-3 bg-gradient-to-br from-[#3678F1] to-[#2563EB] text-white text-sm font-bold hover:from-[#2563EB] hover:to-[#1D4ED8] shadow-brand inline-flex items-center gap-2 transition-colors duration-200">
                    <FaPlus className="w-3.5 h-3.5" /> Add Equipment
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {equipment.map((item) => {
                    const isOngoing = (item.bookingRequests?.length ?? 0) > 0;
                    const hasDates  = (item.availabilities?.length ?? 0) > 0;
                    const upcomingAvails = item.availabilities ?? [];
                    return (
                      <div key={item.id} className="group rounded-2xl bg-white border border-neutral-200/70 shadow-soft overflow-hidden hover:border-[#3678F1] transition-colors duration-200 flex flex-col">
                        {/* Cover */}
                        <div className="relative">
                          {item.imageUrl ? (
                            <div className="w-full h-40 bg-neutral-100 overflow-hidden">
                              <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                            </div>
                          ) : (
                            <div className="w-full h-40 bg-gradient-to-br from-[#E8F0FE] to-[#DBEAFE] flex items-center justify-center">
                              <FaTruck className="text-5xl text-[#3678F1]/35" />
                            </div>
                          )}
                          {/* Status chips overlay */}
                          <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5">
                            {isOngoing && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FEF3C7]/95 text-[#946A00] border border-[#F4C430] backdrop-blur-sm">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#F4C430] animate-pulse" />
                                Ongoing
                              </span>
                            )}
                            <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full backdrop-blur-sm ${hasDates ? 'bg-[#DCFCE7]/95 text-[#15803D] border border-[#86EFAC]' : 'bg-white/95 text-neutral-500 border border-neutral-200'}`}>
                              <FaCalendarCheck className="w-2.5 h-2.5" />
                              {hasDates ? 'Has dates' : 'No dates'}
                            </span>
                          </div>
                        </div>

                        {/* Body */}
                        <div className="p-4 flex flex-col flex-1">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <h3 className="text-base font-bold text-neutral-900 truncate leading-tight">{item.name}</h3>
                          </div>

                          {/* Rate */}
                          <div className="inline-flex items-center gap-1.5 mb-3">
                            <FaIndianRupeeSign className="w-3 h-3 text-[#3678F1]" />
                            <span className="text-sm font-bold text-[#3678F1] tabular-nums">{formatRate(item)}</span>
                          </div>

                          {/* Location block */}
                          {item.effectiveLocation ? (
                            <div className="rounded-xl bg-[#DBEAFE] border border-[#3678F1]/25 px-3 py-2 mb-2">
                              <div className="flex items-start gap-2">
                                <FaLocationDot className="w-3 h-3 text-[#3678F1] mt-0.5 shrink-0" />
                                <div className="min-w-0 text-[11px] leading-snug">
                                  <p className="font-semibold text-[#1E3A8A] truncate">On location: {item.effectiveLocation}</p>
                                  {item.effectiveLocationUntil && (
                                    <p className="text-[#2563EB]/90 mt-0.5">
                                      until {new Date(item.effectiveLocationUntil).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} · 5-day wrap buffer
                                    </p>
                                  )}
                                  {item.currentCity && (
                                    <p className="text-[#2563EB]/80 mt-0.5">Base hub: {item.currentCity}</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          ) : item.currentCity ? (
                            <div className="inline-flex items-center gap-1.5 text-[11px] text-neutral-500 mb-2">
                              <FaLocationDot className="w-3 h-3 text-neutral-400 shrink-0" />
                              <span className="truncate">{item.currentCity}</span>
                            </div>
                          ) : null}

                          {/* Given to */}
                          {isOngoing && (
                            <div className="rounded-xl bg-[#FEF7E0] border border-[#F4C430]/40 px-3 py-2 mb-2">
                              <div className="flex items-start gap-2">
                                <FaBriefcase className="w-3 h-3 text-[#8A6508] mt-0.5 shrink-0" />
                                <div className="min-w-0 text-[11px] leading-snug">
                                  <p className="font-semibold text-[#8A6508] uppercase tracking-wider text-[9px]">Given to</p>
                                  <p className="text-[#8A6508] truncate mt-0.5">
                                    {(item.bookingRequests ?? []).map((br) => `${br.project.title} · ${formatBookingDate(br.project.startDate, br.project.endDate)}`).join('  ·  ')}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Availability summary */}
                          {hasDates && (
                            <div className="rounded-xl bg-[#F3F4F6] border border-neutral-200 px-3 py-2 mb-3">
                              <div className="flex items-start gap-2">
                                <FaCalendarCheck className="w-3 h-3 text-neutral-500 mt-0.5 shrink-0" />
                                <div className="min-w-0 text-[11px] leading-snug">
                                  <p className="font-semibold text-neutral-600 uppercase tracking-wider text-[9px]">Availability</p>
                                  <p className="text-neutral-700 truncate mt-0.5">
                                    {upcomingAvails.slice(0, 2).map((a) => `${a.locationCity} · ${a.availableFrom.slice(0, 10)}–${a.availableTo.slice(0, 10)}`).join('  ·  ')}
                                    {upcomingAvails.length > 2 && ` · +${upcomingAvails.length - 2} more`}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Actions — pushed to bottom */}
                          <div className="flex items-center gap-2 mt-auto pt-1">
                            <button
                              type="button"
                              onClick={() => openAddAvailability(item)}
                              className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold bg-[#DCFCE7] text-[#15803D] hover:bg-[#BBF7D0] transition-colors"
                            >
                              <FaCalendarPlus className="w-3 h-3" />
                              Set dates
                            </button>
                            <button
                              type="button"
                              onClick={() => openEdit(item)}
                              className="w-10 h-10 rounded-xl bg-[#E8F0FE] ring-1 ring-[#3678F1]/15 flex items-center justify-center text-[#3678F1] hover:bg-[#DBEAFE] hover:ring-[#3678F1]/25 transition-colors shrink-0"
                              aria-label="Edit equipment"
                              title="Edit equipment"
                            >
                              <FaPencil className="text-xs" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteConfirm(item.id)}
                              className="w-10 h-10 rounded-xl bg-[#F3F4F6] flex items-center justify-center text-neutral-500 hover:bg-[#FEEBEA] hover:text-[#F40F02] transition-colors shrink-0"
                              aria-label="Delete equipment"
                              title="Delete equipment"
                            >
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
            <div className="bg-white rounded-2xl shadow-2xl border border-neutral-200/60 w-full max-w-md overflow-hidden max-h-[90vh] flex flex-col">
              <div className="px-6 py-4 border-b border-neutral-100 flex items-center justify-between shrink-0">
                <div>
                  <h2 className="text-base font-bold text-neutral-900">{modal === 'add' ? 'Add Equipment' : 'Edit Equipment'}</h2>
                  <p className="text-xs text-neutral-400 mt-0.5">{modal === 'add' ? 'Create a new item in your inventory' : 'Update this item\'s details'}</p>
                </div>
                <button type="button" onClick={closeModal} className="w-8 h-8 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-500 hover:bg-neutral-200 transition-colors" aria-label="Close">
                  <FaXmark className="text-sm" />
                </button>
              </div>
              <div className="p-6 space-y-4 overflow-y-auto">
                {saveError && (
                  <div className="flex items-center gap-2.5 p-3 bg-[#FEEBEA] border border-[#F40F02]/30 rounded-xl">
                    <FaTriangleExclamation className="text-[#F40F02] text-xs shrink-0" />
                    <p className="text-sm text-[#991B1B]">{saveError}</p>
                  </div>
                )}
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1.5">Name <span className="text-[#F40F02]">*</span></label>
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. RED Camera Package" className="w-full px-4 py-2.5 border border-neutral-300 rounded-xl text-sm bg-[#F3F4F6] focus:bg-white focus:outline-none focus:border-[#3678F1] focus:ring-2 focus:ring-[#3678F1]/15 transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1.5">Description</label>
                  <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="Brief description (lenses, accessories, etc.)" className="w-full px-4 py-2.5 border border-neutral-300 rounded-xl text-sm bg-[#F3F4F6] focus:bg-white focus:outline-none focus:border-[#3678F1] focus:ring-2 focus:ring-[#3678F1]/15 resize-none transition-all" />
                </div>
                <LocationAutocomplete
                  label="Current city"
                  city={currentCity}
                  compact
                  onSelect={(loc) => setCurrentCity(loc.city)}
                  placeholder="e.g. Mumbai"
                />
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1.5">Daily rate</label>
                  <div className="relative">
                    <FaIndianRupeeSign className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400 pointer-events-none" />
                    <input type="number" min={0} step={100} value={dailyBudget} onChange={(e) => setDailyBudget(e.target.value)} placeholder="0" className="w-full pl-9 pr-4 py-2.5 border border-neutral-300 rounded-xl text-sm bg-[#F3F4F6] focus:bg-white focus:outline-none focus:border-[#3678F1] focus:ring-2 focus:ring-[#3678F1]/15 transition-all" />
                  </div>
                  <p className="inline-flex items-center gap-1 text-[11px] text-neutral-400 mt-1.5">
                    <FaCircleInfo className="w-2.5 h-2.5" /> Your daily rental rate in rupees
                  </p>
                </div>
              </div>
              <div className="px-6 py-4 border-t border-neutral-100 bg-neutral-50/50 flex gap-3 shrink-0">
                <button type="button" onClick={closeModal} disabled={saving} className="flex-1 rounded-xl py-2.5 border border-neutral-200 text-neutral-700 text-sm font-medium hover:bg-neutral-100 transition-colors disabled:opacity-50">
                  Cancel
                </button>
                <button type="button" onClick={handleSave} disabled={saving} className="flex-1 rounded-xl py-2.5 bg-gradient-to-br from-[#3678F1] to-[#2563EB] text-white text-sm font-bold hover:from-[#2563EB] hover:to-[#1D4ED8] shadow-brand disabled:opacity-60 flex items-center justify-center gap-2 transition-colors">
                  {saving ? (
                    <><span className="w-4 h-4 border-[2px] border-white/30 border-t-white border-r-white rounded-full animate-spin" />Saving…</>
                  ) : (modal === 'add' ? 'Add equipment' : 'Save changes')}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Add availability modal */}
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
                <button type="button" onClick={() => setAvailabilityFor(null)} className="w-8 h-8 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-500 hover:bg-neutral-200 transition-colors shrink-0" aria-label="Close">
                  <FaXmark className="text-sm" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                {saveError && (
                  <div className="flex items-center gap-2.5 p-3 bg-[#FEEBEA] border border-[#F40F02]/30 rounded-xl">
                    <FaTriangleExclamation className="text-[#F40F02] text-xs shrink-0" />
                    <p className="text-sm text-[#991B1B]">{saveError}</p>
                  </div>
                )}
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1.5">Location (city) <span className="text-[#F40F02]">*</span></label>
                  <div className="relative">
                    <FaLocationDot className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400 pointer-events-none" />
                    <input type="text" value={availLocation} onChange={(e) => setAvailLocation(e.target.value)} placeholder="e.g. Mumbai" className="w-full pl-9 pr-4 py-2.5 border border-neutral-300 rounded-xl text-sm bg-[#F3F4F6] focus:bg-white focus:outline-none focus:border-[#3678F1] focus:ring-2 focus:ring-[#3678F1]/15 transition-all" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1.5">From <span className="text-[#F40F02]">*</span></label>
                    <input type="date" value={availFrom} onChange={(e) => setAvailFrom(e.target.value)} className="w-full px-4 py-2.5 border border-neutral-300 rounded-xl text-sm bg-[#F3F4F6] focus:bg-white focus:outline-none focus:border-[#3678F1] focus:ring-2 focus:ring-[#3678F1]/15 transition-all" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1.5">To <span className="text-[#F40F02]">*</span></label>
                    <input type="date" min={availFrom || undefined} value={availTo} onChange={(e) => setAvailTo(e.target.value)} className="w-full px-4 py-2.5 border border-neutral-300 rounded-xl text-sm bg-[#F3F4F6] focus:bg-white focus:outline-none focus:border-[#3678F1] focus:ring-2 focus:ring-[#3678F1]/15 transition-all" />
                  </div>
                </div>
              </div>
              <div className="px-6 py-4 border-t border-neutral-100 bg-neutral-50/50 flex gap-3">
                <button type="button" onClick={() => setAvailabilityFor(null)} disabled={saving} className="flex-1 rounded-xl py-2.5 border border-neutral-200 text-neutral-700 text-sm font-medium hover:bg-neutral-100 transition-colors disabled:opacity-50">
                  Cancel
                </button>
                <button type="button" onClick={handleAddAvailability} disabled={saving} className="flex-1 rounded-xl py-2.5 bg-gradient-to-br from-[#3678F1] to-[#2563EB] text-white text-sm font-bold hover:from-[#2563EB] hover:to-[#1D4ED8] shadow-brand disabled:opacity-60 flex items-center justify-center gap-2 transition-colors">
                  {saving ? (
                    <><span className="w-4 h-4 border-[2px] border-white/30 border-t-white border-r-white rounded-full animate-spin" />Saving…</>
                  ) : (
                    <><FaCalendarPlus className="w-3 h-3" />Add dates</>
                  )}
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
                <div className="w-11 h-11 rounded-xl bg-[#FEEBEA] ring-1 ring-[#F40F02]/20 flex items-center justify-center mb-3">
                  <FaTrash className="text-[#F40F02] text-sm" />
                </div>
                <h2 className="text-base font-bold text-neutral-900 mb-1">Delete equipment?</h2>
                <p className="text-sm text-neutral-500 leading-relaxed">This item will be removed from your inventory. This action cannot be undone.</p>
                {saveError && (
                  <div className="mt-3 flex items-center gap-2.5 p-3 bg-[#FEEBEA] border border-[#F40F02]/30 rounded-xl">
                    <FaTriangleExclamation className="text-[#F40F02] text-xs shrink-0" />
                    <p className="text-sm text-[#991B1B]">{saveError}</p>
                  </div>
                )}
              </div>
              <div className="px-6 py-4 border-t border-neutral-100 bg-neutral-50/50 flex gap-3">
                <button type="button" onClick={() => setDeleteConfirm(null)} disabled={saving} className="flex-1 rounded-xl py-2.5 border border-neutral-200 text-neutral-700 text-sm font-medium hover:bg-neutral-100 transition-colors disabled:opacity-50">
                  Cancel
                </button>
                <button type="button" onClick={() => handleDelete(deleteConfirm)} disabled={saving} className="flex-1 rounded-xl py-2.5 bg-[#F40F02] text-white text-sm font-bold hover:bg-[#C20D02] disabled:opacity-60 flex items-center justify-center gap-2 transition-colors shadow-sm shadow-[#F40F02]/15">
                  {saving ? (
                    <><span className="w-4 h-4 border-[2px] border-white/30 border-t-white border-r-white rounded-full animate-spin" />Deleting…</>
                  ) : (
                    <><FaTrash className="w-3 h-3" />Delete</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
