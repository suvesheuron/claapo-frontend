/**
 * Option lists for the Cast profile form. Values are stored in the database
 * as plain strings — these arrays are the canonical UI sources.
 */

export const ROLE_TYPES = [
  { value: 'actor', label: 'Actor' },
  { value: 'model', label: 'Model' },
  { value: 'dancer', label: 'Dancer'},
  { value: 'influencer' , label: 'Influencer'}
] as const;

export const GENDERS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
] as const;

export const BODY_TYPES = [
  'Slim', 'Athletic', 'Muscular', 'Average', 'Curvy', 'Heavy',
  'Plus Size', 'Lean', 'Tall', 'Short',
] as const;

export const SKIN_TONES = [
  'Dusky', 'Brown', 'Dark', 'Wheatish', 'Fair', 'Very Fair',
] as const;

export const EYE_COLORS = [
  'Black', 'Dark Brown', 'Brown', 'Hazel', 'Amber', 'Green', 'Blue', 'Grey',
] as const;

export const LOOK_TYPES = [
  'Natural Look', 'Rich Look', 'Rural Look', 'Urban Look', 'Corporate Look',
  'Traditional Look', 'Modern Look', 'Comic Look', 'Rugged Look',
  'Intense Look', 'Villain Look', 'Desi Look',
] as const;

export const HAIR_TYPES = [
  'Straight', 'Wavy', 'Curly', 'Bald', 'Buzz Cut', 'Long Hair',
  'Colored Hair', 'Afro', 'Dreadlocks',
] as const;

export const LANGUAGES = [
  'Hindi', 'Bengali', 'Marathi', 'Telugu', 'Tamil', 'Gujarati', 'Urdu',
  'Kannada', 'Odia', 'Malayalam', 'Punjabi', 'Bhojpuri', 'Haryanvi', 'Assamese',
  'Maithili', 'Santali', 'Kashmiri', 'Nepali', 'Konkani', 'Sindhi', 'Dogri',
  'Manipuri (Meitei)', 'Bodo', 'Rajasthani',
  'English', 'French', 'Spanish', 'German', 'Japanese', 'Korean',
] as const;

/** Build the height-dropdown options (4'0" through 7'0", every inch). */
export function buildHeightOptions(): Array<{ value: number; label: string }> {
  const out: Array<{ value: number; label: string }> = [];
  for (let feet = 4; feet <= 7; feet++) {
    const inchMax = feet === 7 ? 0 : 11;
    for (let inch = 0; inch <= inchMax; inch++) {
      const totalInches = feet * 12 + inch;
      const cm = Math.round(totalInches * 2.54);
      out.push({ value: cm, label: `${feet}'${inch}"` });
    }
  }
  return out;
}

/** Convert centimetres back to a feet/inches display string. */
export function cmToFeetInches(cm: number | null | undefined): string | null {
  if (cm == null) return null;
  const totalInches = Math.round(cm / 2.54);
  const feet = Math.floor(totalInches / 12);
  const inches = totalInches % 12;
  return `${feet}'${inches}"`;
}
