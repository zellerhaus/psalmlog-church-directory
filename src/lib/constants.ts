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

// Worship style options
export const WORSHIP_STYLES = [
  'Contemporary',
  'Traditional',
  'Blended',
  'Liturgical',
  'Gospel',
  'Charismatic',
] as const;

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

// UTM parameters for Psalmlog attribution
export const UTM_SOURCE = 'church_finder';
export const UTM_MEDIUM = 'directory';

export function getPsalmlogUrl(campaign: string, content: string): string {
  const appStoreUrl = process.env.NEXT_PUBLIC_APP_STORE_URL || 'https://apps.apple.com/app/psalmlog';
  return `${appStoreUrl}?utm_source=${UTM_SOURCE}&utm_medium=${UTM_MEDIUM}&utm_campaign=${campaign}&utm_content=${content}`;
}

// Site metadata
export const SITE_NAME = 'Psalmlog Church Finder';
export const SITE_DESCRIPTION = 'Find the right church for your life stage, worship style, and spiritual needs—with visitor-friendly information most directories don\'t provide.';
export const SITE_URL = 'https://psalmlog.com';

// Pre-built Psalmlog URLs for common CTAs (usable in client components)
export const PSALMLOG_URLS = {
  header: getPsalmlogUrl('header', 'nav_cta'),
  mobileMenu: getPsalmlogUrl('mobile_menu', 'nav_cta'),
  footer: getPsalmlogUrl('footer', 'app_link'),
} as const;
