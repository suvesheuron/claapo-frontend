/**
 * BookingRequestModal — sends a booking request to a crew member or vendor.
 *
 * Requires:
 *  - targetUserId  — UUID of the person being booked (from search results)
 *  - Company selects a project from their list (loaded from API)
 *  - Optional message and rateOffered
 *
 * Calls POST /v1/bookings/request on submission.
 */

import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  FaXmark, FaCircleCheck, FaTriangleExclamation, FaChevronLeft, FaChevronRight,
  FaCalendarDay, FaBriefcase, FaIndianRupeeSign, FaRegMessage, FaUser, FaLocationDot, FaPlus,
} from 'react-icons/fa6';
import { api, ApiException } from '../services/api';
import { useApiQuery } from '../hooks/useApiQuery';

interface Project {
  id: string;
  title: string;
  status: string;
  startDate: string;
  endDate: string;
  shootLocations?: string[];
}

interface ProjectsResponse {
  items: Project[];
  meta?: { total: number; page: number; limit: number };
}

interface ShootDateLocation {
  date: string;
  location: string;
}

type BookingRequestModalProps = {
  isOpen: boolean;
  onClose: () => void;
  userName: string;
  /** Display label e.g. "equipment", "Director" */
  userRole: string;
  userRate: string;
  /** UUID of the user being booked — required for the API call */
  targetUserId: string;
  /** True when booking a vendor (so we fetch and show their equipment + rates) */
  isVendor?: boolean;
  /** When booking a vendor, pre-select this equipment (e.g. from search result) */
  initialVendorEquipmentId?: string;
  onSuccess?: () => void;
};

// ─── Helpers ────────────────────────────────────────────────────────────────

const toIso = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const parseIso = (iso: string) => new Date(iso + 'T12:00:00');

const formatDate = (iso: string) =>
  parseIso(iso).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });

const formatRange = (start: string, end: string) => {
  const s = parseIso(start).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  const e = parseIso(end).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  return `${s} – ${e}`;
};

// ─── Custom multi-date calendar ─────────────────────────────────────────────

interface MultiDatePickerProps {
  selected: string[];
  onChange: (next: string[]) => void;
  minDate?: string;
  maxDate?: string;
  disabled?: boolean;
}

function MultiDatePicker({ selected, onChange, minDate, maxDate, disabled }: MultiDatePickerProps) {
  const today = useMemo(() => {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    return t;
  }, []);

  const initialMonth = useMemo(() => {
    const ref = selected[0] ? parseIso(selected[0]) : minDate ? parseIso(minDate) : today;
    return new Date(ref.getFullYear(), ref.getMonth(), 1);
  }, [selected, minDate, today]);

  const [viewMonth, setViewMonth] = useState<Date>(initialMonth);

  // Reset view when min changes (e.g., project switched)
  useEffect(() => {
    if (minDate) setViewMonth(new Date(parseIso(minDate).getFullYear(), parseIso(minDate).getMonth(), 1));
  }, [minDate]);

  const year = viewMonth.getFullYear();
  const month = viewMonth.getMonth();
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const minD = minDate ? parseIso(minDate) : null;
  const maxD = maxDate ? parseIso(maxDate) : null;

  const canGoPrev = (() => {
    if (!minD) return true;
    const prevMonthLast = new Date(year, month, 0);
    return prevMonthLast >= minD;
  })();
  const canGoNext = (() => {
    if (!maxD) return true;
    const nextMonthFirst = new Date(year, month + 1, 1);
    return nextMonthFirst <= maxD;
  })();

  const cells: (Date | null)[] = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
  while (cells.length % 7 !== 0) cells.push(null);

  const isDisabled = (d: Date) => {
    if (d < today) return true;
    if (minD && d < minD) return true;
    if (maxD && d > maxD) return true;
    return false;
  };

  const toggle = (d: Date) => {
    if (disabled || isDisabled(d)) return;
    const iso = toIso(d);
    if (selected.includes(iso)) {
      onChange(selected.filter((x) => x !== iso));
    } else {
      onChange([...selected, iso].sort());
    }
  };

  const monthLabel = viewMonth.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

  return (
    <div className={`rounded-xl border border-neutral-200 bg-white p-3 ${disabled ? 'opacity-60 pointer-events-none' : ''}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <button
          type="button"
          onClick={() => canGoPrev && setViewMonth(new Date(year, month - 1, 1))}
          disabled={!canGoPrev}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-600 hover:bg-neutral-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          aria-label="Previous month"
        >
          <FaChevronLeft className="w-3 h-3" />
        </button>
        <span className="text-sm font-semibold text-neutral-900">{monthLabel}</span>
        <button
          type="button"
          onClick={() => canGoNext && setViewMonth(new Date(year, month + 1, 1))}
          disabled={!canGoNext}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-600 hover:bg-neutral-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          aria-label="Next month"
        >
          <FaChevronRight className="w-3 h-3" />
        </button>
      </div>

      {/* Weekday header */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
          <div key={i} className="text-center text-[10px] font-semibold text-neutral-400 uppercase py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-1">
        {cells.map((d, i) => {
          if (!d) return <div key={i} />;
          const iso = toIso(d);
          const isSel = selected.includes(iso);
          const isDis = isDisabled(d);
          const isToday = toIso(today) === iso;
          return (
            <button
              key={i}
              type="button"
              onClick={() => toggle(d)}
              disabled={isDis}
              className={`
                relative h-9 rounded-lg text-xs font-semibold transition-colors
                ${isSel
                  ? 'bg-[#3678F1] text-white shadow-sm hover:bg-[#2563EB]'
                  : isDis
                    ? 'text-neutral-300 cursor-not-allowed'
                    : 'text-neutral-700 hover:bg-[#E8F0FE] hover:text-[#3678F1]'
                }
                ${isToday && !isSel ? 'ring-1 ring-[#3678F1]/40' : ''}
              `}
            >
              {d.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Modal ──────────────────────────────────────────────────────────────────

export default function BookingRequestModal({
  isOpen,
  onClose,
  userName,
  userRole,
  userRate,
  targetUserId,
  isVendor = false,
  initialVendorEquipmentId,
  onSuccess,
}: BookingRequestModalProps) {
  const [projectId, setProjectId] = useState('');
  const [rateOffered, setRateOffered] = useState('');
  const [message, setMessage] = useState('');
  const [bookingDates, setBookingDates] = useState<string[]>([]);
  const [shootDateLocations, setShootDateLocations] = useState<ShootDateLocation[]>([]);
  const [selectedEquipmentId, setSelectedEquipmentId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [locationInputs, setLocationInputs] = useState<Record<string, string>>({});

  const { data: projectsData, loading: projectsLoading, error: projectsError, refetch: refetchProjects } = useApiQuery<ProjectsResponse>(
    isOpen ? '/projects?limit=50' : null
  );

  useEffect(() => {
    if (isOpen) refetchProjects();
  }, [isOpen, refetchProjects]);

  const { data: vendorEquipment, loading: equipmentLoading } = useApiQuery<{ id: string; name: string; dailyBudget?: number | null; daily_budget?: number | null }[] | { data?: unknown[]; items?: unknown[] }>(
    isOpen && targetUserId && isVendor ? `/equipment/vendor/${targetUserId}` : null
  );
  const rawList = Array.isArray(vendorEquipment) ? vendorEquipment : (vendorEquipment as { data?: unknown[]; items?: unknown[] })?.data ?? (vendorEquipment as { items?: unknown[] })?.items ?? [];
  const equipmentList = (Array.isArray(rawList) ? rawList : []) as Record<string, unknown>[];

  const getPaise = (eq: Record<string, unknown>): number[] => {
    const budget = (eq.dailyBudget ?? eq.daily_budget) as number | null | undefined;
    return [budget].filter((n): n is number => typeof n === 'number' && !Number.isNaN(n));
  };

  const vendorRateDisplay = (() => {
    if (!isVendor) return userRate;
    if (userRate && userRate !== '—') return userRate;
    if (equipmentLoading) return 'Loading…';
    if (equipmentList.length === 0) return 'Rates on request';
    const paiseList = equipmentList.flatMap((eq) => getPaise(eq));
    if (paiseList.length === 0) return 'Rates on request';
    const minPaise = Math.min(...paiseList);
    const maxPaise = Math.max(...paiseList);
    if (minPaise === maxPaise) return `₹${(minPaise / 100).toLocaleString('en-IN')}/day`;
    return `From ₹${(minPaise / 100).toLocaleString('en-IN')}/day`;
  })();

  const rawItems = Array.isArray(projectsData) ? projectsData : (projectsData as ProjectsResponse | undefined)?.items;
  const activeProjects = (rawItems ?? []).filter(
    (p) => p.status === 'active' || p.status === 'open' || p.status === 'draft'
  );

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      setProjectId('');
      setRateOffered('');
      setMessage('');
      setBookingDates([]);
      setShootDateLocations([]);
      setError(null);
      setSent(false);
      setSelectedEquipmentId('');
      setLocationInputs({});
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !isVendor) return;
    const list = (Array.isArray(rawList) ? rawList : []) as { id?: string }[];
    if (initialVendorEquipmentId && list.some((eq) => eq.id === initialVendorEquipmentId)) {
      setSelectedEquipmentId(initialVendorEquipmentId);
    } else if (list.length === 1 && list[0]?.id) {
      setSelectedEquipmentId(list[0].id);
    }
  }, [isOpen, isVendor, initialVendorEquipmentId, rawList]);

  // ESC closes modal
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const selectedProject = activeProjects.find((p) => p.id === projectId) ?? null;
  const projectStartIso = selectedProject?.startDate?.slice(0, 10) ?? '';
  const projectEndIso = selectedProject?.endDate?.slice(0, 10) ?? '';
  const projectShootLocations = selectedProject?.shootLocations ?? [];

  const initials = userName
    .split(' ')
    .map((s) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId) { setError('Please select a project.'); return; }
    if (bookingDates.length === 0) {
      setError('Please pick at least one date you want to hire this person for.');
      return;
    }

    // Validate that all dates have locations assigned
    const datesWithoutLocation = bookingDates.filter(
      (date) => !shootDateLocations.find((pair) => pair.date === date)
    );
    if (datesWithoutLocation.length > 0) {
      setError('Please specify a location for each selected date.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      await api.post('/bookings/request', {
        projectId,
        targetUserId,
        vendorEquipmentId: selectedEquipmentId || undefined,
        rateOffered: rateOffered ? Math.round(parseFloat(rateOffered.replace(/[^0-9.]/g, '')) * 100) : undefined,
        message: message.trim() || undefined,
        shootDates: bookingDates,
        shootDateLocations: shootDateLocations,
      });
      toast.success('Booking request sent!');
      setSent(true);
      onSuccess?.();
    } catch (err) {
      const msg =
        err instanceof ApiException ? err.payload.message : 'Failed to send request. Please try again.';
      toast.error(msg);
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/60 backdrop-blur-sm p-4 animate-in fade-in"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl max-w-xl w-full max-h-[92vh] overflow-hidden shadow-2xl flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 shrink-0">
          <div>
            <h2 className="text-base font-bold text-neutral-900 tracking-tight">Send Booking Request</h2>
            <p className="text-xs text-neutral-500 mt-0.5">Hire {userName.split(' ')[0] || 'this person'} for specific dates</p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-neutral-100 flex items-center justify-center text-neutral-500 hover:bg-neutral-200 hover:text-neutral-700 transition-colors"
            aria-label="Close"
          >
            <FaXmark className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        {sent ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 rounded-2xl bg-[#DCFCE7] border border-[#86EFAC] flex items-center justify-center mx-auto mb-4">
              <FaCircleCheck className="text-[#22C55E] text-3xl" />
            </div>
            <h3 className="text-lg font-bold text-neutral-900 mb-1">Request Sent!</h3>
            <p className="text-sm text-neutral-500 mb-6">
              Your booking request to <span className="font-semibold text-neutral-800">{userName}</span> has been sent.
              You'll be notified when they respond.
            </p>
            <button
              onClick={onClose}
              className="rounded-xl w-full py-2.5 bg-gradient-to-br from-[#3678F1] to-[#2563EB] text-white text-sm font-semibold hover:from-[#2563EB] hover:to-[#1D4ED8] shadow-brand transition-colors"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
            <div className="p-6 space-y-5">

              {/* Target user info */}
              <div className="rounded-2xl bg-[#F4F8FE] border border-[#3678F1]/15 p-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#3678F1] to-[#2563EB] text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-brand">
                    {initials || <FaUser className="w-5 h-5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-neutral-900 truncate">{userName}</h3>
                    <p className="text-xs text-neutral-500 capitalize truncate">{userRole}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[10px] uppercase tracking-wider text-neutral-400 font-semibold">Rate</p>
                    <p className="text-sm font-bold text-[#3678F1]">{vendorRateDisplay}</p>
                  </div>
                </div>

                {isVendor && (
                  <div className="mt-3 pt-3 border-t border-[#3678F1]/15">
                    <p className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider mb-2">Equipment & daily rate</p>
                    {equipmentLoading ? (
                      <p className="text-xs text-neutral-500">Loading equipment…</p>
                    ) : equipmentList.length === 0 ? (
                      <p className="text-xs text-neutral-500">No equipment listed yet.</p>
                    ) : (
                      <ul className="space-y-1.5">
                        {equipmentList.slice(0, 8).map((eq, idx) => {
                          const paise = getPaise(eq);
                          const ratePaise = paise.length ? Math.min(...paise) : null;
                          const rateStr = ratePaise != null ? `₹${(ratePaise / 100).toLocaleString('en-IN')}/day` : 'Rate on request';
                          return (
                            <li key={(eq.id as string) || idx} className="text-xs flex justify-between items-center gap-3">
                              <span className="truncate font-medium text-neutral-700">{String(eq.name ?? '')}</span>
                              <span className="shrink-0 font-semibold text-[#3678F1]">{rateStr}</span>
                            </li>
                          );
                        })}
                        {equipmentList.length > 8 && <li className="text-[10px] text-neutral-400">+{equipmentList.length - 8} more</li>}
                      </ul>
                    )}
                  </div>
                )}
              </div>

              {/* Equipment selector (vendor only) */}
              {isVendor && equipmentList.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1.5 uppercase tracking-wide">
                    Equipment for this request
                    <span className="ml-2 text-[9px] font-normal text-neutral-400 normal-case">(Optional)</span>
                  </label>
                  <select
                    value={selectedEquipmentId}
                    onChange={(e) => setSelectedEquipmentId(e.target.value)}
                    disabled={loading || equipmentLoading}
                    className="w-full px-3.5 py-2.5 border border-neutral-300 rounded-xl bg-white text-neutral-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#3678F1]/20 focus:border-[#3678F1] transition-colors disabled:opacity-50"
                  >
                    <option value="">— Any equipment —</option>
                    {equipmentList.map((eq, idx) => (
                      <option key={(eq.id as string) || idx} value={(eq.id as string) ?? ''}>{String(eq.name ?? '')}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Project selector */}
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1.5 uppercase tracking-wide flex items-center gap-1.5">
                  <FaBriefcase className="w-3 h-3 text-[#3678F1]" />
                  Project <span className="text-[#F40F02]">*</span>
                </label>
                <select
                  value={projectId}
                  onChange={(e) => {
                    setProjectId(e.target.value);
                    setBookingDates([]);
                    setError(null);
                  }}
                  required
                  disabled={loading || projectsLoading}
                  className="w-full px-3.5 py-2.5 border border-neutral-300 rounded-xl bg-white text-neutral-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#3678F1]/20 focus:border-[#3678F1] transition-colors disabled:opacity-50"
                >
                  <option value="">
                    {projectsLoading ? 'Loading projects…' : '— Select a project —'}
                  </option>
                  {activeProjects.map((p) => (
                    <option key={p.id} value={p.id}>{p.title}</option>
                  ))}
                </select>
                {projectsError && (
                  <p className="text-xs text-[#F40F02] mt-1.5">{projectsError}</p>
                )}
                {!projectsLoading && !projectsError && activeProjects.length === 0 && (projectsData !== undefined || rawItems !== undefined) && (
                  <p className="text-xs text-neutral-500 mt-1.5">
                    No active projects.{' '}
                    <Link to="/projects/new" className="text-[#3678F1] font-semibold hover:underline">Create one first.</Link>
                  </p>
                )}
                {selectedProject && (
                  <p className="text-[11px] text-neutral-500 mt-1.5">
                    Project window: <span className="font-semibold text-neutral-700">{formatRange(projectStartIso, projectEndIso)}</span>
                  </p>
                )}
              </div>

              {/* Calendar */}
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1.5 uppercase tracking-wide flex items-center gap-1.5">
                  <FaCalendarDay className="w-3 h-3 text-[#3678F1]" />
                  Dates needed <span className="text-[#F40F02]">*</span>
                </label>
                <p className="text-[11px] text-neutral-500 mb-2 leading-snug">
                  Click any day to add or remove it. After selecting dates, specify the location for each date.
                </p>

                {!projectId ? (
                  <div className="rounded-xl border border-dashed border-neutral-300 bg-neutral-50 px-4 py-6 text-center">
                    <FaCalendarDay className="w-5 h-5 text-neutral-300 mx-auto mb-2" />
                    <p className="text-xs text-neutral-500">Select a project first to enable date selection.</p>
                  </div>
                ) : (
                  <MultiDatePicker
                    selected={bookingDates}
                    onChange={(dates) => {
                      setBookingDates(dates);
                      // Remove location entries for dates that were deselected
                      setShootDateLocations((prev) => prev.filter((pair) => dates.includes(pair.date)));
                      
                      // Auto-populate locations for newly selected dates from project shootLocations
                      if (projectShootLocations.length > 0) {
                        const newDatesWithLocations: ShootDateLocation[] = [];
                        dates.forEach((date) => {
                          // Check if this date already has a location
                          const existingPair = shootDateLocations.find((pair) => pair.date === date);
                          if (!existingPair) {
                            // Assign location based on index in dates array
                            const locationIndex = dates.indexOf(date) % projectShootLocations.length;
                            newDatesWithLocations.push({
                              date,
                              location: projectShootLocations[locationIndex] ?? '',
                            });
                          }
                        });
                        
                        if (newDatesWithLocations.length > 0) {
                          setShootDateLocations((prev) => [...prev, ...newDatesWithLocations]);
                        }
                      }
                    }}
                    minDate={projectStartIso}
                    maxDate={projectEndIso}
                    disabled={loading}
                  />
                )}

                {bookingDates.length > 0 && (
                  <div className="mt-3 space-y-3">
                    <p className="text-[10px] font-bold text-[#3678F1] uppercase tracking-wider">
                      Selected Dates & Locations
                    </p>
                    <div className="space-y-2">
                      {bookingDates.map((date) => {
                        const existingPair = shootDateLocations.find((pair) => pair.date === date);
                        const hasLocation = !!existingPair;
                        const inputValue = locationInputs[date] || '';

                        return (
                          <div key={date} className="rounded-xl bg-white border border-neutral-200 p-3">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold text-neutral-900">{formatDate(date)}</span>
                                {hasLocation ? (
                                  <span className="text-[9px] bg-[#DCFCE7] text-[#15803D] px-2 py-0.5 rounded-full font-semibold border border-[#86EFAC]">✓ Location set</span>
                                ) : (
                                  <span className="text-[9px] bg-[#E8F0FE] text-[#3678F1] px-2 py-0.5 rounded-full font-semibold border border-[#3678F1]/30">⚠ Location needed</span>
                                )}
                              </div>
                              <button
                                type="button"
                                onClick={() => setBookingDates((prev) => prev.filter((x) => x !== date))}
                                className="text-neutral-400 hover:text-[#F40F02] transition-colors"
                                aria-label={`Remove ${date}`}
                              >
                                <FaXmark className="w-3 h-3" />
                              </button>
                            </div>

                            {hasLocation ? (
                              <div className="flex items-center gap-2">
                                <FaLocationDot className="w-3 h-3 text-[#3678F1] shrink-0" />
                                <span className="text-xs text-neutral-700 font-medium flex-1">{existingPair.location}</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setShootDateLocations((prev) => prev.filter((p) => p.date !== date));
                                  }}
                                  className="text-[10px] text-[#3678F1] font-semibold hover:underline"
                                >
                                  Change
                                </button>
                              </div>
                            ) : (
                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  value={inputValue}
                                  onChange={(e) => setLocationInputs((prev) => ({ ...prev, [date]: e.target.value }))}
                                  placeholder="e.g., Mumbai, Film City"
                                  className="flex-1 px-3 py-2 border border-neutral-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#3678F1]/20 focus:border-[#3678F1]"
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      if (inputValue.trim()) {
                                        setShootDateLocations((prev) => [
                                          ...prev,
                                          { date, location: inputValue.trim() },
                                        ]);
                                        setLocationInputs((prev) => ({ ...prev, [date]: '' }));
                                      }
                                    }
                                  }}
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (inputValue.trim()) {
                                      setShootDateLocations((prev) => [
                                        ...prev,
                                        { date, location: inputValue.trim() },
                                      ]);
                                      setLocationInputs((prev) => ({ ...prev, [date]: '' }));
                                    }
                                  }}
                                  disabled={!inputValue.trim()}
                                  className="px-3 py-2 bg-gradient-to-br from-[#3678F1] to-[#2563EB] text-white rounded-lg text-xs font-semibold hover:from-[#2563EB] hover:to-[#1D4ED8] shadow-brand disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 transition-colors"
                                >
                                  <FaPlus className="w-2.5 h-2.5" />
                                  Add
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Optional rate */}
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1.5 uppercase tracking-wide flex items-center gap-1.5">
                  <FaIndianRupeeSign className="w-3 h-3 text-[#3678F1]" />
                  Offered Rate (₹/day)
                  <span className="ml-1 text-[9px] font-normal text-neutral-400 normal-case">(Optional)</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 text-sm font-semibold">₹</span>
                  <input
                    type="number"
                    value={rateOffered}
                    onChange={(e) => setRateOffered(e.target.value)}
                    placeholder="e.g., 25000"
                    disabled={loading}
                    className="w-full pl-8 pr-3.5 py-2.5 border border-neutral-300 rounded-xl bg-white text-neutral-900 placeholder-neutral-400 text-sm focus:outline-none focus:ring-2 focus:ring-[#3678F1]/20 focus:border-[#3678F1] transition-colors disabled:opacity-50"
                  />
                </div>
              </div>

              {/* Message */}
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1.5 uppercase tracking-wide flex items-center gap-1.5">
                  <FaRegMessage className="w-3 h-3 text-[#3678F1]" />
                  Message
                  <span className="ml-1 text-[9px] font-normal text-neutral-400 normal-case">(Optional)</span>
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={3}
                  placeholder="Add any specific requirements or notes..."
                  disabled={loading}
                  className="w-full px-3.5 py-2.5 border border-neutral-300 rounded-xl bg-white text-neutral-900 placeholder-neutral-400 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all resize-none disabled:opacity-50"
                />
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-start gap-2.5 rounded-xl bg-[#FEEBEA] border border-[#F40F02]/30 px-3.5 py-3">
                  <FaTriangleExclamation className="text-[#F40F02] text-sm shrink-0 mt-0.5" />
                  <p className="text-xs text-[#991B1B] leading-snug">{error}</p>
                </div>
              )}
            </div>

            {/* Sticky footer */}
            <div className="flex gap-3 px-6 py-4 border-t border-neutral-100 bg-white shrink-0">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="flex-1 rounded-xl py-2.5 border border-neutral-300 text-neutral-700 text-sm font-semibold hover:bg-neutral-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !projectId || bookingDates.length === 0}
                className="flex-1 rounded-xl py-2.5 bg-gradient-to-br from-[#3678F1] to-[#2563EB] text-white text-sm font-semibold hover:from-[#2563EB] hover:to-[#1D4ED8] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-brand"
              >
                {loading ? (
                  <><span className="w-4 h-4 border-[2.5px] border-white/40 border-t-white border-r-white rounded-full animate-spin" />Sending…</>
                ) : 'Send Request'}
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
}
