// Denomination options for filtering
export const DENOMINATIONS = [
  'Non-denominational',
  'Baptist',
  'Southern Baptist',
  'Catholic',
  'Methodist',
  'United Methodist',
  'Lutheran',
  'Presbyterian',
  'Pentecostal',
  'Assemblies of God',
  'Church of Christ',
  'Episcopal',
  'Church of God',
  'Nazarene',
  'Seventh-day Adventist',
  'Orthodox',
  'Evangelical',
  'Charismatic',
  'Reformed',
  'Other',
] as const;

// Denomination slugs for URL routing
export const DENOMINATION_SLUGS: Record<string, string> = {
  'non-denominational': 'Non-denominational',
  'baptist': 'Baptist',
  'southern-baptist': 'Southern Baptist',
  'catholic': 'Catholic',
  'methodist': 'Methodist',
  'united-methodist': 'United Methodist',
  'lutheran': 'Lutheran',
  'presbyterian': 'Presbyterian',
  'pentecostal': 'Pentecostal',
  'assemblies-of-god': 'Assemblies of God',
  'church-of-christ': 'Church of Christ',
  'episcopal': 'Episcopal',
  'church-of-god': 'Church of God',
  'nazarene': 'Nazarene',
  'seventh-day-adventist': 'Seventh-day Adventist',
  'orthodox': 'Orthodox',
  'evangelical': 'Evangelical',
  'charismatic': 'Charismatic',
  'reformed': 'Reformed',
  'other': 'Other',
};

// Reverse mapping: denomination name to slug
export const DENOMINATION_TO_SLUG: Record<string, string> = Object.fromEntries(
  Object.entries(DENOMINATION_SLUGS).map(([slug, name]) => [name, slug])
);

// Get all denomination slugs for static generation
export function getDenominationSlugs(): string[] {
  return Object.keys(DENOMINATION_SLUGS);
}

// Worship style options
export const WORSHIP_STYLES = [
  'Contemporary',
  'Traditional',
  'Blended',
  'Liturgical',
  'Gospel',
  'Charismatic',
] as const;

// Worship style slugs for URL routing
export const WORSHIP_STYLE_SLUGS: Record<string, string> = {
  'contemporary': 'Contemporary',
  'traditional': 'Traditional',
  'blended': 'Blended',
  'liturgical': 'Liturgical',
  'gospel': 'Gospel',
  'charismatic': 'Charismatic',
};

// Reverse mapping: worship style name to slug
export const WORSHIP_STYLE_TO_SLUG: Record<string, string> = Object.fromEntries(
  Object.entries(WORSHIP_STYLE_SLUGS).map(([slug, name]) => [name, slug])
);

// Get all worship style slugs for static generation
export function getWorshipStyleSlugs(): string[] {
  return Object.keys(WORSHIP_STYLE_SLUGS);
}

// Church programs/ministries
export const CHURCH_PROGRAMS = [
  { slug: 'kids-ministry', name: 'Kids Ministry', field: 'has_kids_ministry' as const },
  { slug: 'youth-group', name: 'Youth Group', field: 'has_youth_group' as const },
  { slug: 'small-groups', name: 'Small Groups', field: 'has_small_groups' as const },
] as const;

export type ChurchProgramSlug = typeof CHURCH_PROGRAMS[number]['slug'];
export type ChurchProgramField = typeof CHURCH_PROGRAMS[number]['field'];

// Program slug to info mapping
export const PROGRAM_SLUGS: Record<string, { name: string; field: ChurchProgramField }> = Object.fromEntries(
  CHURCH_PROGRAMS.map((p) => [p.slug, { name: p.name, field: p.field }])
);

// Get all program slugs for static generation
export function getProgramSlugs(): string[] {
  return CHURCH_PROGRAMS.map((p) => p.slug);
}

// US States
export const US_STATES = [
  { name: 'Alabama', abbr: 'AL', slug: 'alabama' },
  { name: 'Alaska', abbr: 'AK', slug: 'alaska' },
  { name: 'Arizona', abbr: 'AZ', slug: 'arizona' },
  { name: 'Arkansas', abbr: 'AR', slug: 'arkansas' },
  { name: 'California', abbr: 'CA', slug: 'california' },
  { name: 'Colorado', abbr: 'CO', slug: 'colorado' },
  { name: 'Connecticut', abbr: 'CT', slug: 'connecticut' },
  { name: 'Delaware', abbr: 'DE', slug: 'delaware' },
  { name: 'Florida', abbr: 'FL', slug: 'florida' },
  { name: 'Georgia', abbr: 'GA', slug: 'georgia' },
  { name: 'Hawaii', abbr: 'HI', slug: 'hawaii' },
  { name: 'Idaho', abbr: 'ID', slug: 'idaho' },
  { name: 'Illinois', abbr: 'IL', slug: 'illinois' },
  { name: 'Indiana', abbr: 'IN', slug: 'indiana' },
  { name: 'Iowa', abbr: 'IA', slug: 'iowa' },
  { name: 'Kansas', abbr: 'KS', slug: 'kansas' },
  { name: 'Kentucky', abbr: 'KY', slug: 'kentucky' },
  { name: 'Louisiana', abbr: 'LA', slug: 'louisiana' },
  { name: 'Maine', abbr: 'ME', slug: 'maine' },
  { name: 'Maryland', abbr: 'MD', slug: 'maryland' },
  { name: 'Massachusetts', abbr: 'MA', slug: 'massachusetts' },
  { name: 'Michigan', abbr: 'MI', slug: 'michigan' },
  { name: 'Minnesota', abbr: 'MN', slug: 'minnesota' },
  { name: 'Mississippi', abbr: 'MS', slug: 'mississippi' },
  { name: 'Missouri', abbr: 'MO', slug: 'missouri' },
  { name: 'Montana', abbr: 'MT', slug: 'montana' },
  { name: 'Nebraska', abbr: 'NE', slug: 'nebraska' },
  { name: 'Nevada', abbr: 'NV', slug: 'nevada' },
  { name: 'New Hampshire', abbr: 'NH', slug: 'new-hampshire' },
  { name: 'New Jersey', abbr: 'NJ', slug: 'new-jersey' },
  { name: 'New Mexico', abbr: 'NM', slug: 'new-mexico' },
  { name: 'New York', abbr: 'NY', slug: 'new-york' },
  { name: 'North Carolina', abbr: 'NC', slug: 'north-carolina' },
  { name: 'North Dakota', abbr: 'ND', slug: 'north-dakota' },
  { name: 'Ohio', abbr: 'OH', slug: 'ohio' },
  { name: 'Oklahoma', abbr: 'OK', slug: 'oklahoma' },
  { name: 'Oregon', abbr: 'OR', slug: 'oregon' },
  { name: 'Pennsylvania', abbr: 'PA', slug: 'pennsylvania' },
  { name: 'Rhode Island', abbr: 'RI', slug: 'rhode-island' },
  { name: 'South Carolina', abbr: 'SC', slug: 'south-carolina' },
  { name: 'South Dakota', abbr: 'SD', slug: 'south-dakota' },
  { name: 'Tennessee', abbr: 'TN', slug: 'tennessee' },
  { name: 'Texas', abbr: 'TX', slug: 'texas' },
  { name: 'Utah', abbr: 'UT', slug: 'utah' },
  { name: 'Vermont', abbr: 'VT', slug: 'vermont' },
  { name: 'Virginia', abbr: 'VA', slug: 'virginia' },
  { name: 'Washington', abbr: 'WA', slug: 'washington' },
  { name: 'West Virginia', abbr: 'WV', slug: 'west-virginia' },
  { name: 'Wisconsin', abbr: 'WI', slug: 'wisconsin' },
  { name: 'Wyoming', abbr: 'WY', slug: 'wyoming' },
  { name: 'District of Columbia', abbr: 'DC', slug: 'district-of-columbia' },
] as const;

// Page size for pagination
export const DEFAULT_PAGE_SIZE = 20;

// Minimum word count for indexable pages (SEO thin content protection)
export const MIN_CONTENT_WORDS = 300;

// Helper to count words in content strings
export function countWords(...texts: (string | null | undefined)[]): number {
  return texts
    .filter((text): text is string => typeof text === 'string' && text.length > 0)
    .join(' ')
    .trim()
    .split(/\s+/)
    .filter(word => word.length > 0)
    .length;
}

// Check if content meets minimum threshold for indexing
// Currently disabled - all pages are indexed regardless of content length
export function hasEnoughContent(..._texts: (string | null | undefined)[]): boolean {
  return true;
}

// App store URLs
export const APP_STORE_URL = 'https://apps.apple.com/us/app/psalmlog-bible-guidance/id6743382929';
export const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.psalmlog';
export const PSALMLOG_LANDING_URL = 'https://psalmlog.com/get-started';

// Site metadata
export const SITE_NAME = 'Psalmlog Church Finder';
export const SITE_DESCRIPTION = 'Find the right church for your life stage and worship style. Browse by denomination with visitor-friendly info.';
export const SITE_URL = 'https://psalmlog.com';

// Pre-built Psalmlog URLs for common CTAs (usable in client components)
export const PSALMLOG_URLS = {
  appStore: APP_STORE_URL,
  playStore: PLAY_STORE_URL,
  landing: PSALMLOG_LANDING_URL,
} as const;

// Append UTM parameters to church website URLs for tracking referrals
export function addChurchUtmParams(url: string, content: string): string {
  if (!url) return url;
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}utm_source=psalmlog.com&utm_medium=referral&utm_campaign=psalmlog&utm_content=${content}`;
}
