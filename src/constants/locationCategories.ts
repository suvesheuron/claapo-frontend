// Mirrors the backend location-type.constants.ts. Both the
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

const BUNGALOW_LIST = [
  'Luxury Villa',
  'Modern Villa',
  'Colonial Bungalow',
  'Vintage Bungalow',
  'Heritage Villa',
  'Palace',
  'Old Traditional House',
  'Row House',
  'Parsi Bungalow',
  'Sea-Facing Bungalow',
  'Haveli',
  'Flat Apartment',
  'High Rise Building',
];

const STUDIO_LIST = [
  'Penthouse',
  'Empty Floor',
  'Green Screen Studio',
  'Podcast Studio',
  'Virtual Studio',
  'Rehearsal Studio',
  'Post Production Studio',
  'Office Setup',
  'Cafe Setup',
  'Restaurant Setup',
  'Street Side / Road Side',
  'Market Setup',
  'Metro / Train Setup',
  'Police / Court / Jail Setup',
  'Hospital Setup',
  'Roadside Area',
  'Temple',
];

const LOCATION_MANAGER_LIST = [
  'Market / Street',
  'Roadside',
  'Grocery Shops / Bakery / Cafe',
  'Office / Corporate Building',
  'School / College / Hostel',
  'Park / Garden',
  'Mall / Gym',
  'Temple / Mosque / Church',
  'Factories / Warehouse / Mill',
  'Airport',
  'Dockyard / Pge',
  'Fort / Heritage Building',
  'Government Buildings',
  'Hotels',
  'Riverside',
  'Village Side',
  'Fields / Open Land',
  'Waterfalls',
  'Jungle Area',
  'Mountains',
  'River',
  'Village',
  'WaterFall',
  'Desert',
];

export const LOCATION_SUBTYPES_BY_TYPE: Record<string, string[]> = {
  bungalow_villa_apartment: [...BUNGALOW_LIST],
  studio_setup: [...STUDIO_LIST, ...BUNGALOW_LIST],
  location_manager: [...LOCATION_MANAGER_LIST, ...BUNGALOW_LIST],
};

/** Sub-type suggestions for a given type, or all of them flattened as fallback. */
export function subTypesForLocationType(locationType: string | null | undefined): string[] {
  if (locationType && LOCATION_SUBTYPES_BY_TYPE[locationType]) return LOCATION_SUBTYPES_BY_TYPE[locationType];
  return Object.values(LOCATION_SUBTYPES_BY_TYPE).flat();
}
