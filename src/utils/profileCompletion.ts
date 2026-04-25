/**
 * Calculate profile completion percentage for different user types
 */

interface IndividualProfileData {
  displayName: string | null;
  bio: string | null;
  aboutMe: string | null;
  skills: string[];
  genres?: string[] | null;
  /** @deprecated legacy single genre */
  genre?: string | null;
  address?: string | null;
  locationCity: string | null;
  locationState: string | null;
  dailyBudget: number | null;
  imdbUrl: string | null;
  instagramUrl: string | null;
  youtubeUrl: string | null;
  vimeoUrl?: string | null;
  panNumber: string | null;
  bankAccountName: string | null;
  bankAccountNumber: string | null;
  ifscCode: string | null;
  bankName: string | null;
  avatarUrl?: string | null;
}

interface CompanyProfileData {
  companyName: string | null;
  locationCity: string | null;
  locationState: string | null;
  bio: string | null;
  aboutUs: string | null;
  companyType: string | null;
  skills?: string[] | null;
  website: string | null;
  imdbUrl?: string | null;
  instagramUrl: string | null;
  youtubeUrl: string | null;
  vimeoUrl?: string | null;
  address: string | null;
  panNumber: string | null;
  gstNumber: string | null;
  isGstVerified?: boolean;
  avatarUrl?: string | null;
}

interface VendorProfileData {
  companyName: string | null;
  vendorServiceCategory: string | null;
  locationCity: string | null;
  locationState: string | null;
  aboutUs: string | null;
  website: string | null;
  imdbUrl?: string | null;
  instagramUrl: string | null;
  youtubeUrl: string | null;
  vimeoUrl?: string | null;
  address?: string | null;
  gstNumber: string | null;
  isGstVerified?: boolean;
  avatarUrl?: string | null;
}

/**
 * Calculate individual profile completion
 * Weighted fields based on importance
 */
export function calculateIndividualCompletion(profile: IndividualProfileData): number {
  const hasGenres =
    (profile.genres && profile.genres.length > 0) || (profile.genre && profile.genre.trim() !== '');
  const fields = [
    { value: profile.displayName, weight: 10, required: true },
    { value: profile.avatarUrl, weight: 8, required: false },
    { value: profile.bio, weight: 8, required: true },
    { value: profile.aboutMe, weight: 5, required: false },
    { value: profile.skills?.length > 0 ? 'yes' : null, weight: 10, required: true },
    { value: hasGenres ? 'yes' : null, weight: 5, required: false },
    { value: profile.address, weight: 6, required: false },
    { value: profile.locationCity, weight: 10, required: true },
    { value: profile.locationState, weight: 5, required: false },
    { value: profile.dailyBudget, weight: 8, required: false },
    { value: profile.instagramUrl, weight: 4, required: false },
    { value: profile.youtubeUrl, weight: 3, required: false },
    { value: profile.vimeoUrl, weight: 3, required: false },
    { value: profile.imdbUrl, weight: 4, required: false },
    { value: profile.panNumber, weight: 5, required: false },
    { value: profile.bankAccountName && profile.bankAccountNumber && profile.ifscCode ? 'yes' : null, weight: 8, required: false },
  ];

  let earned = 0;
  let total = 0;

  for (const field of fields) {
    total += field.weight;
    if (field.value && field.value !== '' && field.value !== null) {
      earned += field.weight;
    }
  }

  return Math.round((earned / total) * 100);
}

/**
 * Calculate company profile completion
 */
export function calculateCompanyCompletion(profile: CompanyProfileData): number {
  const fields = [
    { value: profile.companyName, weight: 12, required: true },
    { value: profile.avatarUrl, weight: 8, required: false },
    { value: profile.companyType, weight: 8, required: true },
    { value: profile.skills?.length ? 'yes' : null, weight: 6, required: false },
    { value: profile.locationCity, weight: 8, required: true },
    { value: profile.locationState, weight: 4, required: false },
    { value: profile.address, weight: 6, required: false },
    { value: profile.bio, weight: 8, required: true },
    { value: profile.aboutUs, weight: 5, required: false },
    { value: profile.website, weight: 5, required: false },
    { value: profile.instagramUrl, weight: 4, required: false },
    { value: profile.youtubeUrl, weight: 3, required: false },
    { value: profile.vimeoUrl, weight: 3, required: false },
    { value: profile.imdbUrl, weight: 3, required: false },
    { value: profile.panNumber, weight: 6, required: false },
    { value: profile.gstNumber, weight: 8, required: false },
    { value: profile.isGstVerified, weight: 10, required: false },
  ];

  let earned = 0;
  let total = 0;

  for (const field of fields) {
    total += field.weight;
    if (field.value && field.value !== '' && field.value !== null) {
      earned += field.weight;
    }
  }

  return Math.round((earned / total) * 100);
}

/**
 * Calculate vendor profile completion
 */
export function calculateVendorCompletion(profile: VendorProfileData): number {
  const fields = [
    { value: profile.companyName, weight: 12, required: true },
    { value: profile.avatarUrl, weight: 8, required: false },
    { value: profile.vendorServiceCategory, weight: 12, required: true },
    { value: profile.locationCity, weight: 8, required: true },
    { value: profile.locationState, weight: 4, required: false },
    { value: profile.address, weight: 6, required: false },
    { value: profile.aboutUs, weight: 5, required: false },
    { value: profile.website, weight: 5, required: false },
    { value: profile.instagramUrl, weight: 4, required: false },
    { value: profile.youtubeUrl, weight: 3, required: false },
    { value: profile.vimeoUrl, weight: 3, required: false },
    { value: profile.imdbUrl, weight: 3, required: false },
    { value: profile.gstNumber, weight: 8, required: false },
    { value: profile.isGstVerified, weight: 14, required: false },
  ];

  let earned = 0;
  let total = 0;

  for (const field of fields) {
    total += field.weight;
    if (field.value && field.value !== '' && field.value !== null) {
      earned += field.weight;
    }
  }

  return Math.round((earned / total) * 100);
}

/**
 * Get completion status label and color
 */
export function getCompletionStatus(percentage: number): {
  label: string;
  color: string;
  bgColor: string;
} {
  if (percentage >= 90) {
    return { label: 'Excellent', color: '#15803D', bgColor: '#DCFCE7' };
  } else if (percentage >= 70) {
    return { label: 'Good', color: '#166534', bgColor: '#D1FAE5' };
  } else if (percentage >= 50) {
    return { label: 'Fair', color: '#A16207', bgColor: '#FEF9C3' };
  } else {
    return { label: 'Incomplete', color: '#991B1B', bgColor: '#FEE2E2' };
  }
}

/**
 * Get tips for improving profile completion
 */
export function getProfileImprovementTips(
  type: 'individual' | 'company' | 'vendor',
  profile: IndividualProfileData | CompanyProfileData | VendorProfileData
): string[] {
  const tips: string[] = [];

  if (type === 'individual') {
    const p = profile as IndividualProfileData;
    if (!p.avatarUrl) tips.push('Add a professional profile photo');
    if (!p.bio) tips.push('Write a brief bio about yourself');
    if (!p.skills?.length) tips.push('Add your skills and expertise');
    const hasGenres =
      (p.genres && p.genres.length > 0) || (p.genre && p.genre.trim() !== '');
    if (!hasGenres) tips.push('Select one or more genres you work in');
    if (!p.address?.trim()) tips.push('Add your address for invoices');
    if (!p.locationCity) tips.push('Add your location city');
    if (!p.dailyBudget) tips.push('Set your daily budget');
    if (!p.imdbUrl && !p.instagramUrl) tips.push('Add portfolio links (IMDb, Instagram)');
    if (!p.panNumber) tips.push('Add your PAN number for invoices');
    if (!p.bankAccountName || !p.bankAccountNumber || !p.ifscCode) {
      tips.push('Add complete bank details for payments');
    }
  } else if (type === 'company') {
    const p = profile as CompanyProfileData;
    if (!p.avatarUrl) tips.push('Add your company logo');
    if (!p.companyType) tips.push('Specify your company type');
    if (!p.skills?.length) tips.push('Add skills or departments your company works with');
    if (!p.locationCity) tips.push('Add your office location');
    if (!p.address?.trim()) tips.push('Add your business address for invoices');
    if (!p.bio) tips.push('Write a company description');
    if (!p.aboutUs) tips.push('Tell your company story');
    if (!p.website) tips.push('Add your company website');
    if (!p.instagramUrl) tips.push('Add your Instagram profile');
    if (!p.panNumber) tips.push('Add your PAN number');
    if (!p.gstNumber) tips.push('Add your GST number for verification');
  } else if (type === 'vendor') {
    const p = profile as VendorProfileData;
    if (!p.avatarUrl) tips.push('Add your business logo');
    if (!p.vendorServiceCategory) tips.push('Select your service category');
    if (!p.locationCity) tips.push('Add your business location');
    if (!p.address?.trim()) tips.push('Add your business address for invoices');
    if (!p.aboutUs) tips.push('Tell your business story');
    if (!p.website) tips.push('Add your business website');
    if (!p.instagramUrl) tips.push('Add your Instagram profile');
    if (!p.gstNumber) tips.push('Add your GST number for verification');
  }

  return tips.slice(0, 5); // Return top 5 tips
}
