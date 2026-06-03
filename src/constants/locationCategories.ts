// Mirrors the backend location-type.constants.ts. The sub-type lists are a
// STARTER set — the official catalog is to be finalized later. Both the
// location_profiles.sub_types and location_properties.sub_types columns are
// free-form, so expanding these arrays never requires a backend change.

export const LOCATION_TYPES = [
  { value: 'bungalow_villa_apartment', label: 'Bungalow / Villa / Apartments' },
  { value: 'studio_setup', label: 'Studio Set-Ups' },
  { value: 'location_manager', label: 'Location Manager' },
] as const;

export type LocationTypeValue = (typeof LOCATION_TYPES)[number]['value'];

export const LOCATION_TYPE_LABELS: Record<string, string> = Object.fromEntries(
  LOCATION_TYPES.map((t) => [t.value, t.label]),
);

export const LOCATION_SUBTYPES_BY_TYPE: Record<string, string[]> = {
  bungalow_villa_apartment: [
    'Modern Bungalow',
    'Parsi Bungalow',
    'Heritage Villa',
    'Sea-facing Villa',
    'Apartment',
    'Penthouse',
    'Farmhouse',
    'Cottage',
  ],
  studio_setup: [
    'Market Setup',
    'Hospital Set',
    'Court Set',
    'Office Set',
    'Police Station Set',
    'Chroma / Green Screen',
    'Cyclorama',
    'White Studio',
    'Black Studio',
  ],
  location_manager: [
    'City Coverage',
    'Outstation Coverage',
    'Permissions & Liaison',
    'Recce Services',
  ],
};

/** Sub-type suggestions for a given type, or all of them flattened as fallback. */
export function subTypesForLocationType(locationType: string | null | undefined): string[] {
  if (locationType && LOCATION_SUBTYPES_BY_TYPE[locationType]) return LOCATION_SUBTYPES_BY_TYPE[locationType];
  return Object.values(LOCATION_SUBTYPES_BY_TYPE).flat();
}
