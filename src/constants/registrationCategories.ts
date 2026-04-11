/** Filmmaking department / category lists (Claapo PRD). Used on registration and profile. */

/** Genre tags (separate from primary role / department). */
export const REGISTRATION_GENRES = [
  'Action',
  'Comedy',
  'Drama',
  'Romance',
  'Science Fiction',
  'Adventure',
  'Horror',
  'Fantasy',
  'Historical',
  'Fashion',
  'Beauty',
  'Noir',
] as const;

export const REGISTRATION_COMPANY_TYPES = [
  // 'Agency',
  'Production House',
  // 'Agency & Production House',
  'Line Production',
] as const;

export const REGISTRATION_INDIVIDUAL_DEPARTMENTS = [
  'Executive Producer',
  'Producer',
  'Director',
  'Director of Photography',
  "Director's Assistant",
  'First AD',
  'Second AD',
  'Second Second AD',
  'Script Supervisor',
  'Camera Operator',
  'First AC',
  'Second AC',
  'Gaffer',
  'Best Boy Electric',
  'Electrician',
  'Key Grip',
  'Jimy Jib',
  'Steadycam',
  'Grip',
  'Dolly Grip',
  'Line Producer',
  'Production Manager',
  'Production Assistant',
  'Production Designer',
  'Art Director',
  'Assistant Art Director',
  'Set Dresser',
  'Prop Master',
  'Casting Director',
  'Casting Assistant',
  'Costume Designer',
  'Costume Stylist',
  'Costume Stylist Assistant',
  'Dressman',
  'Tailor',
  'Shopper',
  'Make-up Artist',
  'Hair Stylist',
  'Special Effects Make Up Assistant',
  'Sound Mixer',
  'Boom Operator',
  'Sound Assistant',
  'Screenplay Writer',
  'Storyboard Artist',
  'Editor',
  'Assistant Editor',
  'Post Production Supervisor',
  'Still Photographer',
  'VFX Supervisor',
  'VFX Artist',
  'SFX Supervisor',
  'Colorist',
  'Sound Designer',
  'Music Supervisor',
  'Composer',
  'Photographer',
  'DIT',
  'Food Stylist',
  'Food Stylist Assistant',
  'Generator Operator',
  'Head Spot Boy',
  'Spot Boy',
  'Walkie Attendant',
  'Vanity Van Attendant',
  'AC Attendant',
  'Stunt Coordinator',
  'Stunt Performer',
  'Production Accountant',
  'Location Manager',
  'Office PA',
] as const;

export const REGISTRATION_VENDOR_CATEGORIES = [
  'Location',
  'Camera',
  'Lights',
  'Catering',
  'Vanity',
  'Rental Vehicles',
  'Generator',
  'Grips',
  'Drive',
  'Tarafa',
  'Set Facility',
  'Art Props Rental',
  'Costume Rental',
  'Transport',
] as const;

export type RegistrationVendorCategory = (typeof REGISTRATION_VENDOR_CATEGORIES)[number];

/** Maps onboarding category label → Prisma VendorType for search filters. */
export function vendorCategoryToVendorType(category: string): 'all' | 'equipment' | 'lighting' | 'transport' | 'catering' {
  const c = category.trim().toLowerCase();
  if (c.includes('catering')) return 'catering';
  if (c === 'lights' || c.includes('lighting')) return 'lighting';
  if (c.includes('transport') || c.includes('rental vehicles') || c === 'drive') return 'transport';
  if (
    c.includes('camera') ||
    c.includes('grip') ||
    c.includes('generator') ||
    c.includes('location') ||
    c.includes('vanity') ||
    c.includes('tarafa') ||
    c.includes('facility') ||
    c.includes('props') ||
    c.includes('costume') ||
    c.includes('art ')
  ) {
    return 'equipment';
  }
  return 'all';
}
