/**
 * LocationAutocomplete — Autocomplete location input using free OpenStreetMap Nominatim API.
 * Supports searching by city name, pin code, or partial address.
 * Displays results in a beautiful dropdown with city, state, and pin code.
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { FaLocationDot, FaXmark, FaSpinner } from 'react-icons/fa6';

interface LocationResult {
  displayName: string;
  city: string;
  state: string;
  pinCode?: string;
  lat: number;
  lng: number;
  country?: string;
}

interface LocationAutocompleteProps {
  /** Current city value */
  city?: string;
  /** Current state value */
  state?: string;
  /** Called when user selects a location */
  onSelect: (location: { city: string; state: string; pinCode?: string; lat?: number; lng?: number }) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Whether the input is disabled */
  disabled?: boolean;
  /** Additional CSS classes for the container */
  className?: string;
  /** Label text */
  label?: string;
  /** Show as compact single-line */
  compact?: boolean;
}

// Debounce helper
function useDebounce(value: string, delay: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

// Nominatim API (free, no API key needed)
const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';

async function searchLocations(query: string): Promise<LocationResult[]> {
  if (!query || query.length < 2) return [];

  try {
    const params = new URLSearchParams({
      q: query + ', India',
      format: 'json',
      addressdetails: '1',
      limit: '8',
      countrycodes: 'in',
    });

    const res = await fetch(`${NOMINATIM_URL}?${params}`, {
      headers: { 'Accept-Language': 'en' },
    });

    if (!res.ok) return [];
    const data = await res.json();

    return data
      .filter((item: Record<string, unknown>) => {
        const type = item.type as string;
        // Only show meaningful results (cities, towns, villages, suburbs)
        return ['city', 'town', 'village', 'suburb', 'county', 'state_district', 'postcode', 'administrative'].includes(type);
      })
      .map((item: Record<string, unknown>) => {
        const addr = item.address as Record<string, string> | undefined;
        const city = addr?.city || addr?.town || addr?.village || addr?.suburb || addr?.county || addr?.state_district || '';
        const state = addr?.state || '';
        const pinCode = addr?.postcode || '';

        return {
          displayName: item.display_name as string,
          city,
          state,
          pinCode,
          lat: parseFloat(item.lat as string),
          lng: parseFloat(item.lon as string),
          country: addr?.country || 'India',
        };
      })
      .filter((r: LocationResult) => r.city); // Only results with a city
  } catch {
    return [];
  }
}

export default function LocationAutocomplete({
  city = '',
  state = '',
  onSelect,
  placeholder = 'Search city, area, or pin code...',
  disabled = false,
  className = '',
  label,
  compact = false,
}: LocationAutocompleteProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<LocationResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [selectedDisplay, setSelectedDisplay] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const debouncedQuery = useDebounce(query, 350);

  // Sync display text with props
  useEffect(() => {
    if (city && !selectedDisplay) {
      setSelectedDisplay(state ? `${city}, ${state}` : city);
    }
  }, [city, state, selectedDisplay]);

  // Search when debounced query changes
  useEffect(() => {
    if (!debouncedQuery || debouncedQuery.length < 2) {
      setResults([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    searchLocations(debouncedQuery).then((res) => {
      if (!cancelled) {
        setResults(res);
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, [debouncedQuery]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSelect = useCallback((loc: LocationResult) => {
    setSelectedDisplay(`${loc.city}, ${loc.state}`);
    setQuery('');
    setOpen(false);
    setResults([]);
    onSelect({
      city: loc.city,
      state: loc.state,
      pinCode: loc.pinCode,
      lat: loc.lat,
      lng: loc.lng,
    });
  }, [onSelect]);

  const handleClear = () => {
    setSelectedDisplay('');
    setQuery('');
    setResults([]);
    onSelect({ city: '', state: '' });
    inputRef.current?.focus();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setSelectedDisplay('');
    setOpen(true);
  };

  const handleFocus = () => {
    if (results.length > 0 || query.length >= 2) {
      setOpen(true);
    }
  };

  const displayValue = selectedDisplay || query;

  if (compact) {
    return (
      <div ref={containerRef} className={`relative ${className}`}>
        <div className="relative">
          <FaLocationDot className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400 pointer-events-none" />
          <input
            ref={inputRef}
            type="text"
            value={displayValue}
            onChange={handleInputChange}
            onFocus={handleFocus}
            placeholder={placeholder}
            disabled={disabled}
            className="w-full pl-9 pr-8 py-2.5 border border-neutral-300 rounded-xl text-sm focus:outline-none focus:border-[#3B5BDB] focus:ring-2 focus:ring-[#3B5BDB]/10 disabled:bg-neutral-50 transition-all"
          />
          {displayValue && !disabled && (
            <button type="button" onClick={handleClear} className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-neutral-400 hover:text-neutral-600">
              <FaXmark className="w-3 h-3" />
            </button>
          )}
          {loading && (
            <FaSpinner className="absolute right-8 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400 animate-spin" />
          )}
        </div>

        {open && results.length > 0 && (
          <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-neutral-200 rounded-xl shadow-lg z-50 max-h-64 overflow-y-auto">
            {results.map((r, i) => (
              <button
                key={`${r.lat}-${r.lng}-${i}`}
                type="button"
                onClick={() => handleSelect(r)}
                className="w-full text-left px-3 py-2.5 hover:bg-[#F0F7FF] transition-colors flex items-start gap-2.5 border-b border-neutral-100 last:border-b-0"
              >
                <FaLocationDot className="w-3.5 h-3.5 text-[#3B5BDB] mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-neutral-900 truncate">{r.city}</p>
                  <p className="text-xs text-neutral-500 truncate">
                    {r.state}
                    {r.pinCode && ` · ${r.pinCode}`}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}

        {open && query.length >= 2 && !loading && results.length === 0 && (
          <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-neutral-200 rounded-xl shadow-lg z-50 px-3 py-4 text-center">
            <p className="text-sm text-neutral-500">No locations found</p>
            <p className="text-xs text-neutral-400 mt-0.5">Try a different city name or pin code</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {label && <label className="block text-xs font-medium text-neutral-600 mb-1">{label}</label>}

      <div className="relative">
        <FaLocationDot className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#3B5BDB] pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={displayValue}
          onChange={handleInputChange}
          onFocus={handleFocus}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full pl-9 pr-8 py-2.5 border border-neutral-300 rounded-xl text-sm focus:outline-none focus:border-[#3B5BDB] focus:ring-2 focus:ring-[#3B5BDB]/10 disabled:bg-neutral-50 transition-all"
        />
        {displayValue && !disabled && (
          <button type="button" onClick={handleClear} className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-neutral-400 hover:text-neutral-600">
            <FaXmark className="w-3 h-3" />
          </button>
        )}
        {loading && (
          <FaSpinner className="absolute right-8 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400 animate-spin" />
        )}
      </div>

      {/* Results dropdown */}
      {open && results.length > 0 && (
        <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-neutral-200 rounded-2xl shadow-xl z-50 max-h-72 overflow-y-auto">
          {results.map((r, i) => (
            <button
              key={`${r.lat}-${r.lng}-${i}`}
              type="button"
              onClick={() => handleSelect(r)}
              className="w-full text-left px-4 py-3 hover:bg-[#F0F7FF] transition-colors flex items-start gap-3 border-b border-neutral-100 last:border-b-0 last:rounded-b-2xl first:rounded-t-2xl"
            >
              <div className="w-8 h-8 rounded-lg bg-[#EEF4FF] flex items-center justify-center shrink-0 mt-0.5">
                <FaLocationDot className="w-3.5 h-3.5 text-[#3B5BDB]" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-neutral-900">{r.city}</p>
                <p className="text-xs text-neutral-500 mt-0.5">
                  {r.state}, India
                  {r.pinCode && (
                    <span className="ml-2 px-1.5 py-0.5 bg-neutral-100 rounded text-[10px] font-mono text-neutral-600">{r.pinCode}</span>
                  )}
                </p>
              </div>
            </button>
          ))}
          <div className="px-3 py-1.5 bg-neutral-50 rounded-b-2xl border-t border-neutral-100">
            <p className="text-[10px] text-neutral-400 text-center">Powered by OpenStreetMap</p>
          </div>
        </div>
      )}

      {open && query.length >= 2 && !loading && results.length === 0 && (
        <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-neutral-200 rounded-2xl shadow-xl z-50 px-4 py-5 text-center">
          <FaLocationDot className="w-6 h-6 text-neutral-300 mx-auto mb-2" />
          <p className="text-sm text-neutral-500">No locations found</p>
          <p className="text-xs text-neutral-400 mt-0.5">Try a different city name or pin code</p>
        </div>
      )}
    </div>
  );
}
