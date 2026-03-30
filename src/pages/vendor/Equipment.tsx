import { useEffect, useState } from 'react';
import { FaTruck, FaPlus, FaPencil, FaTrash, FaXmark } from 'react-icons/fa6';
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

              <div className="flex items-center justify-between mb-5">
                <div>
                  <h1 className="text-xl font-bold text-neutral-900">Equipment</h1>
                  <p className="text-sm text-neutral-500 mt-0.5">Manage your inventory, rates, and availability</p>
                </div>
                <button
                  onClick={openAdd}
                  className="rounded-xl px-4 py-2.5 bg-[#3B5BDB] text-white text-sm font-semibold hover:bg-[#2f4ac2] flex items-center gap-2 transition-colors"
                >
                  <FaPlus className="w-3 h-3" /> Add Equipment
                </button>
              </div>

              {error && (
                <div className="rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm p-4 mb-5">
                  {error}
                </div>
              )}

              {/* Summary */}
              <div className="grid grid-cols-3 gap-3 mb-5">
                <div className="rounded-2xl bg-white border border-neutral-200 p-4">
                  <p className="text-xs text-neutral-500">Total Items</p>
                  <p className="text-xl font-bold mt-1 text-neutral-900">{equipment.length}</p>
                </div>
                <div className="rounded-2xl bg-white border border-neutral-200 p-4">
                  <p className="text-xs text-neutral-500">With availability set</p>
                  <p className="text-xl font-bold mt-1 text-[#22C55E]">{availableCount}</p>
                </div>
                <div className="rounded-2xl bg-white border border-neutral-200 p-4">
                  <p className="text-xs text-neutral-500">Currently booked</p>
                  <p className="text-xl font-bold mt-1 text-[#1D4ED8]">{bookedCount}</p>
                </div>
              </div>

              {loading ? (
                <div className="text-sm text-neutral-500 py-8">Loading equipment…</div>
              ) : equipment.length === 0 ? (
                <div className="rounded-2xl bg-white border border-neutral-200 p-10 text-center">
                  <div className="w-14 h-14 rounded-full bg-[#EEF4FF] flex items-center justify-center mx-auto mb-4">
                    <FaTruck className="text-[#3B5BDB] text-2xl" />
                  </div>
                  <p className="text-base font-semibold text-neutral-900 mb-1">No equipment yet</p>
                  <p className="text-sm text-neutral-500 mb-5">Add your first item so companies can find and book you.</p>
                  <button onClick={openAdd} className="rounded-xl px-5 py-2.5 bg-[#3B5BDB] text-white text-sm font-semibold hover:bg-[#2f4ac2] inline-flex items-center gap-2">
                    <FaPlus className="w-3 h-3" /> Add Equipment
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {equipment.map((item) => (
                    <div key={item.id} className="rounded-2xl bg-white border border-neutral-200 overflow-hidden hover:shadow-sm hover:border-neutral-300 transition-all">
                      {/* Equipment image */}
                      {item.imageUrl ? (
                        <div className="w-full h-40 bg-neutral-100">
                          <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="w-full h-40 bg-gradient-to-br from-[#EEF4FF] to-[#DBEAFE] flex items-center justify-center">
                          <FaTruck className="text-4xl text-[#3B5BDB]/30" />
                        </div>
                      )}
                      <div className="p-4">
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="w-10 h-10 rounded-xl bg-[#EEF4FF] flex items-center justify-center shrink-0">
                          <FaTruck className="text-sm text-[#3B5BDB]" />
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {(item.bookingRequests?.length ?? 0) > 0 && (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#DBEAFE] text-[#1D4ED8]">
                              Booked
                            </span>
                          )}
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#F3F4F6] text-neutral-600">
                            {(item.availabilities?.length ?? 0) > 0 ? 'Has dates' : 'No dates'}
                          </span>
                        </div>
                      </div>
                      <h3 className="text-sm font-bold text-neutral-900 mb-1 truncate">{item.name}</h3>
                      {item.effectiveLocation && (
                        <p className="text-[10px] font-semibold text-amber-800 bg-amber-50 border border-amber-200/60 rounded-lg px-2 py-1 mb-1 leading-snug">
                          On location: {item.effectiveLocation}
                          {item.effectiveLocationUntil && (
                            <span className="font-normal text-amber-700 block sm:inline sm:ml-1">
                              (until{' '}
                              {new Date(item.effectiveLocationUntil).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })}
                              , incl. 5-day wrap buffer)
                            </span>
                          )}
                        </p>
                      )}
                      {!item.effectiveLocation && item.currentCity && (
                        <p className="text-[10px] text-neutral-400 mb-1">{item.currentCity}</p>
                      )}
                      {item.effectiveLocation && item.currentCity && (
                        <p className="text-[10px] text-neutral-400 mb-1">Base hub: {item.currentCity}</p>
                      )}
                      <p className="text-sm font-semibold text-[#3B5BDB] mb-2">{formatRate(item)}</p>
                      {(item.bookingRequests?.length ?? 0) > 0 && (
                        <p className="text-[10px] text-[#1D4ED8] font-medium mb-2">
                          Given to: {(item.bookingRequests ?? []).map((br) => `${br.project.title} (${formatBookingDate(br.project.startDate, br.project.endDate)})`).join(' · ')}
                        </p>
                      )}
                      {(item.availabilities?.length ?? 0) > 0 && (
                        <p className="text-[10px] text-neutral-500 mb-2">
                          {(item.availabilities ?? []).slice(0, 2).map((a) => `${a.locationCity} ${a.availableFrom.slice(0, 10)}–${a.availableTo.slice(0, 10)}`).join(' · ')}
                          {(item.availabilities?.length ?? 0) > 2 && ' …'}
                        </p>
                      )}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openAddAvailability(item)}
                          className="text-[11px] py-1.5 rounded-xl font-semibold bg-[#DCFCE7] text-[#15803D] hover:bg-[#BBF7D0] transition-colors"
                        >
                          Set dates
                        </button>
                        <button
                          onClick={() => openEdit(item)}
                          className="text-[11px] py-1.5 rounded-xl font-semibold bg-[#EEF4FF] text-[#3B5BDB] hover:bg-[#DBEAFE] transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => openEdit(item)}
                          className="w-8 h-8 rounded-xl bg-[#F3F4F6] flex items-center justify-center text-neutral-500 hover:bg-[#EEF4FF] hover:text-[#3B5BDB] transition-colors shrink-0"
                        >
                          <FaPencil className="text-xs" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(item.id)}
                          className="w-8 h-8 rounded-xl bg-[#F3F4F6] flex items-center justify-center text-neutral-500 hover:bg-[#FEE2E2] hover:text-[#F40F02] transition-colors shrink-0"
                        >
                          <FaTrash className="text-xs" />
                        </button>
                      </div>
                      </div>{/* close p-4 wrapper */}
                    </div>
                  ))}
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
          <div className="fixed inset-0 bg-black/30 z-40" onClick={closeModal} />
          <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-2xl shadow-xl z-50 p-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-neutral-900">{modal === 'add' ? 'Add Equipment' : 'Edit Equipment'}</h2>
              <button type="button" onClick={closeModal} className="w-8 h-8 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-500 hover:bg-neutral-200">
                <FaXmark className="text-sm" />
              </button>
            </div>
            {saveError && <p className="text-sm text-red-600 mb-3">{saveError}</p>}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-neutral-600 mb-1">Name *</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. RED Camera Package" className="w-full px-3 py-2.5 border border-neutral-300 rounded-xl text-sm focus:outline-none focus:border-[#3B5BDB]" />
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-600 mb-1">Description</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="Brief description" className="w-full px-3 py-2.5 border border-neutral-300 rounded-xl text-sm focus:outline-none focus:border-[#3B5BDB] resize-none" />
              </div>
              <LocationAutocomplete
                label="Current city"
                city={currentCity}
                compact
                onSelect={(loc) => setCurrentCity(loc.city)}
                placeholder="e.g. Mumbai"
              />
              <div>
                <label className="block text-xs font-medium text-neutral-600 mb-1">Daily Budget (₹)</label>
                <input type="number" min={0} step={100} value={dailyBudget} onChange={(e) => setDailyBudget(e.target.value)} placeholder="0" className="w-full px-3 py-2.5 border border-neutral-300 rounded-xl text-sm focus:outline-none focus:border-[#3B5BDB]" />
                <p className="text-[10px] text-neutral-400 mt-1">Your daily rental rate</p>
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button type="button" onClick={closeModal} className="flex-1 py-2.5 border border-neutral-300 rounded-xl text-sm font-medium text-neutral-700 hover:bg-neutral-50">Cancel</button>
              <button type="button" onClick={handleSave} disabled={saving} className="flex-1 py-2.5 bg-[#3B5BDB] text-white rounded-xl text-sm font-semibold hover:bg-[#2f4ac2] disabled:opacity-60">
                {saving ? 'Saving…' : (modal === 'add' ? 'Add' : 'Save')}
              </button>
            </div>
          </div>
        </>
      )}

      {/* Add availability modal */}
      {availabilityFor && (
        <>
          <div className="fixed inset-0 bg-black/30 z-40" onClick={() => setAvailabilityFor(null)} />
          <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-2xl shadow-xl z-50 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-neutral-900">Set availability – {availabilityFor.name}</h2>
              <button type="button" onClick={() => setAvailabilityFor(null)} className="w-8 h-8 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-500 hover:bg-neutral-200">
                <FaXmark className="text-sm" />
              </button>
            </div>
            {saveError && <p className="text-sm text-red-600 mb-3">{saveError}</p>}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-neutral-600 mb-1">Location (city) *</label>
                <input type="text" value={availLocation} onChange={(e) => setAvailLocation(e.target.value)} placeholder="e.g. Mumbai" className="w-full px-3 py-2.5 border border-neutral-300 rounded-xl text-sm focus:outline-none focus:border-[#3B5BDB]" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-600 mb-1">From (date) *</label>
                  <input type="date" value={availFrom} onChange={(e) => setAvailFrom(e.target.value)} className="w-full px-3 py-2.5 border border-neutral-300 rounded-xl text-sm focus:outline-none focus:border-[#3B5BDB]" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-600 mb-1">To (date) *</label>
                  <input type="date" value={availTo} onChange={(e) => setAvailTo(e.target.value)} className="w-full px-3 py-2.5 border border-neutral-300 rounded-xl text-sm focus:outline-none focus:border-[#3B5BDB]" />
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button type="button" onClick={() => setAvailabilityFor(null)} className="flex-1 py-2.5 border border-neutral-300 rounded-xl text-sm font-medium text-neutral-700 hover:bg-neutral-50">Cancel</button>
              <button type="button" onClick={handleAddAvailability} disabled={saving} className="flex-1 py-2.5 bg-[#3B5BDB] text-white rounded-xl text-sm font-semibold hover:bg-[#2f4ac2] disabled:opacity-60">
                {saving ? 'Saving…' : 'Add dates'}
              </button>
            </div>
          </div>
        </>
      )}

      {/* Delete confirm */}
      {deleteConfirm && (
        <>
          <div className="fixed inset-0 bg-black/30 z-40" onClick={() => setDeleteConfirm(null)} />
          <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm bg-white rounded-2xl shadow-xl z-50 p-5">
            <p className="text-sm font-semibold text-neutral-900 mb-4">Delete this equipment item? This cannot be undone.</p>
            {saveError && <p className="text-sm text-red-600 mb-3">{saveError}</p>}
            <div className="flex gap-2">
              <button type="button" onClick={() => setDeleteConfirm(null)} className="flex-1 py-2.5 border border-neutral-300 rounded-xl text-sm font-medium">Cancel</button>
              <button type="button" onClick={() => handleDelete(deleteConfirm)} disabled={saving} className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 disabled:opacity-60">
                {saving ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
