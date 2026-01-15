#!/usr/bin/env npx tsx

/**
 * Church Seeding CLI Script v2 - Enhanced Coverage
 *
 * Improvements over v1:
 * - Paginates through ALL Google Places results (not just first 20)
 * - Zip code searches for large metro areas
 * - OpenStreetMap integration for cross-reference
 * - Expanded city lists (50+ cities per state)
 *
 * Usage:
 *   npx tsx scripts/seed-churches-v2.ts --state "California" --limit 2000
 *   npx tsx scripts/seed-churches-v2.ts --state "Texas" --zip-codes --verbose
 *   npx tsx scripts/seed-churches-v2.ts --state "New York" --provider osm
 *   npx tsx scripts/seed-churches-v2.ts --help
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });

import { createClient } from '@supabase/supabase-js';

// ============================================================================
// TYPES
// ============================================================================

interface RawChurchData {
  name: string;
  address: string;
  city: string;
  state: string;
  stateAbbr: string;
  zip: string;
  lat: number;
  lng: number;
  phone?: string;
  website?: string;
  denomination?: string;
  sourceId: string;
  source: string;
}

// ============================================================================
// EXCLUSION FILTERS
// ============================================================================

const EXCLUDED_TERMS = [
  'scientology', 'latter-day saints', 'latter day saints',
  'jehovah\'s witness', 'jehovahs witness', 'jehova',
  'mormon', 'lds church', 'new age', 'mystical',
  'satan', 'satanic', 'lucifer', 'wicca', 'pagan', 'occult',
  'spiritualist', 'unitarian universalist', 'unity church',
  'christian science', 'scientologist',
  'islam', 'mosque', 'buddhist', 'buddhism', 'hindu', 'temple',
  'synagogue', 'jewish', 'sikh', 'gurdwara',
  'baha\'i', 'bahai', 'hare krishna', 'krishna',
  'transcendental', 'theosophy', 'rosicrucian',
];

function shouldExcludeChurch(church: RawChurchData): boolean {
  if (!church || !church.name) return true;
  const nameAndDenom = `${church.name} ${church.denomination ?? ''}`.toLowerCase();
  return EXCLUDED_TERMS.some(term => nameAndDenom.includes(term));
}

// ============================================================================
// EXPANDED STATE DATA - 50+ cities per major state
// ============================================================================

const STATE_CITIES_EXPANDED: Record<string, string[]> = {
  California: [
    // Major metros
    'Los Angeles', 'San Diego', 'San Jose', 'San Francisco', 'Fresno', 'Sacramento',
    'Long Beach', 'Oakland', 'Bakersfield', 'Anaheim', 'Santa Ana', 'Riverside',
    'Stockton', 'Irvine', 'Chula Vista', 'Fremont', 'San Bernardino', 'Modesto',
    'Fontana', 'Moreno Valley', 'Glendale', 'Huntington Beach', 'Santa Clarita',
    'Garden Grove', 'Oceanside', 'Rancho Cucamonga', 'Ontario', 'Santa Rosa',
    'Elk Grove', 'Corona', 'Lancaster', 'Palmdale', 'Salinas', 'Pomona', 'Hayward',
    // Additional cities 35-70
    'Escondido', 'Sunnyvale', 'Torrance', 'Pasadena', 'Orange', 'Fullerton',
    'Thousand Oaks', 'Roseville', 'Concord', 'Simi Valley', 'Santa Clara',
    'Victorville', 'Vallejo', 'Berkeley', 'El Monte', 'Downey', 'Costa Mesa',
    'Inglewood', 'Carlsbad', 'San Buenaventura', 'Fairfield', 'West Covina',
    'Murrieta', 'Richmond', 'Norwalk', 'Antioch', 'Temecula', 'Burbank',
    'Daly City', 'Rialto', 'El Cajon', 'San Mateo', 'Clovis', 'Compton',
    'Jurupa Valley', 'Vista', 'South Gate', 'Mission Viejo', 'Vacaville',
  ],
  Texas: [
    // Major metros
    'Houston', 'San Antonio', 'Dallas', 'Austin', 'Fort Worth', 'El Paso',
    'Arlington', 'Corpus Christi', 'Plano', 'Laredo', 'Lubbock', 'Garland',
    'Irving', 'Amarillo', 'Grand Prairie', 'Brownsville', 'McKinney', 'Frisco',
    'Pasadena', 'Mesquite', 'Killeen', 'McAllen', 'Midland', 'Denton', 'Waco',
    'Carrollton', 'Round Rock', 'Abilene', 'Odessa', 'Pearland', 'Richardson',
    'Sugar Land', 'Beaumont', 'College Station', 'League City', 'Tyler',
    // Additional cities 35-70
    'Allen', 'San Angelo', 'Edinburg', 'Conroe', 'Bryan', 'Mission', 'Longview',
    'Pharr', 'Flower Mound', 'Temple', 'New Braunfels', 'Missouri City',
    'North Richland Hills', 'Georgetown', 'Mansfield', 'Cedar Park', 'Rowlett',
    'Pflugerville', 'Port Arthur', 'Euless', 'Spring', 'Lewisville', 'Harlingen',
    'Victoria', 'Baytown', 'San Marcos', 'DeSoto', 'Grapevine', 'Bedford',
    'Galveston', 'Cedar Hill', 'Keller', 'Rockwall', 'Wylie', 'Haltom City',
    'Burleson', 'The Colony', 'Huntsville', 'Lufkin', 'Coppell', 'Hurst',
  ],
  Florida: [
    // Major metros
    'Jacksonville', 'Miami', 'Tampa', 'Orlando', 'St. Petersburg', 'Hialeah',
    'Port St. Lucie', 'Cape Coral', 'Tallahassee', 'Fort Lauderdale', 'Pembroke Pines',
    'Hollywood', 'Miramar', 'Gainesville', 'Coral Springs', 'Clearwater', 'Palm Bay',
    'Lakeland', 'West Palm Beach', 'Pompano Beach', 'Davie', 'Miami Gardens',
    'Sunrise', 'Boca Raton', 'Deltona', 'Plantation', 'Fort Myers', 'Palm Coast',
    'Deerfield Beach', 'Melbourne', 'Boynton Beach', 'Lauderhill', 'Kissimmee',
    // Additional cities 35-70
    'Weston', 'Homestead', 'Delray Beach', 'Tamarac', 'Daytona Beach', 'Wellington',
    'North Miami', 'Jupiter', 'Ocala', 'Largo', 'Port Orange', 'Margate',
    'Coconut Creek', 'Palm Beach Gardens', 'Sanford', 'Sarasota', 'Bradenton',
    'Bonita Springs', 'Apopka', 'Pensacola', 'St. Cloud', 'Titusville',
    'North Miami Beach', 'Oakland Park', 'Fort Pierce', 'Altamonte Springs',
    'North Lauderdale', 'Cutler Bay', 'Ocoee', 'Winter Garden', 'Ormond Beach',
    'Winter Haven', 'Lake Worth Beach', 'Riviera Beach', 'Aventura', 'Clermont',
  ],
  'New York': [
    // Major metros
    'New York City', 'Buffalo', 'Rochester', 'Yonkers', 'Syracuse', 'Albany',
    'New Rochelle', 'Mount Vernon', 'Schenectady', 'Utica', 'White Plains',
    'Troy', 'Niagara Falls', 'Binghamton', 'Rome', 'Long Beach', 'Poughkeepsie',
    'North Tonawanda', 'Jamestown', 'Ithaca', 'Elmira', 'Newburgh', 'Middletown',
    'Auburn', 'Watertown', 'Glen Cove', 'Saratoga Springs', 'Kingston',
    // Additional cities for NYC boroughs/neighborhoods (searched separately)
    'Brooklyn', 'Queens', 'Bronx', 'Staten Island', 'Manhattan',
    'Flushing', 'Jamaica', 'Astoria', 'Forest Hills', 'Bay Ridge',
    'Harlem', 'East Harlem', 'Washington Heights', 'Inwood',
    // Westchester and Long Island
    'Hempstead', 'Huntington', 'Smithtown', 'Brookhaven', 'Islip',
    'Babylon', 'Oyster Bay', 'North Hempstead', 'Southampton', 'Riverhead',
  ],
  Pennsylvania: [
    'Philadelphia', 'Pittsburgh', 'Allentown', 'Reading', 'Scranton', 'Bethlehem',
    'Lancaster', 'Harrisburg', 'York', 'Wilkes-Barre', 'Chester', 'Erie',
    'Easton', 'Lebanon', 'Hazleton', 'Norristown', 'Pottstown', 'West Chester',
    'State College', 'Johnstown', 'McKeesport', 'Williamsport', 'New Castle',
    'Butler', 'Chambersburg', 'Carlisle', 'Hanover', 'Greensburg', 'Monroeville',
    'King of Prussia', 'Levittown', 'Abington', 'Bensalem', 'Upper Darby',
    'Drexel Hill', 'Cheltenham', 'Bristol', 'Doylestown', 'Media', 'Wayne',
  ],
  Illinois: [
    'Chicago', 'Aurora', 'Rockford', 'Joliet', 'Naperville', 'Springfield',
    'Peoria', 'Elgin', 'Waukegan', 'Cicero', 'Champaign', 'Bloomington',
    'Decatur', 'Arlington Heights', 'Evanston', 'Schaumburg', 'Bolingbrook',
    'Palatine', 'Skokie', 'Des Plaines', 'Orland Park', 'Tinley Park',
    'Oak Lawn', 'Berwyn', 'Mount Prospect', 'Normal', 'Oak Park', 'Wheaton',
    'Downers Grove', 'Hoffman Estates', 'Glenview', 'Lombard', 'Buffalo Grove',
    'Bartlett', 'Addison', 'Crystal Lake', 'Elmhurst', 'DeKalb', 'Moline',
    'Urbana', 'Quincy', 'Belleville', 'Highland Park', 'Northbrook',
  ],
  Ohio: [
    'Columbus', 'Cleveland', 'Cincinnati', 'Toledo', 'Akron', 'Dayton',
    'Parma', 'Canton', 'Youngstown', 'Lorain', 'Hamilton', 'Springfield',
    'Kettering', 'Elyria', 'Lakewood', 'Cuyahoga Falls', 'Euclid', 'Middletown',
    'Newark', 'Mansfield', 'Mentor', 'Beavercreek', 'Cleveland Heights',
    'Strongsville', 'Dublin', 'Fairfield', 'Findlay', 'Warren', 'Lancaster',
    'Lima', 'Huber Heights', 'Westerville', 'Marion', 'Grove City', 'Reynoldsburg',
    'Delaware', 'Brunswick', 'Upper Arlington', 'Gahanna', 'Hilliard', 'Mason',
    'Massillon', 'Stow', 'Kent', 'Sandusky', 'Zanesville', 'North Olmsted',
  ],
  Georgia: [
    'Atlanta', 'Augusta', 'Columbus', 'Macon', 'Savannah', 'Athens', 'Sandy Springs',
    'Roswell', 'Johns Creek', 'Albany', 'Warner Robins', 'Alpharetta', 'Marietta',
    'Valdosta', 'Smyrna', 'Dunwoody', 'Rome', 'East Point', 'Peachtree City',
    'Gainesville', 'Brookhaven', 'Newnan', 'Milton', 'Lawrenceville', 'Dalton',
    'Kennesaw', 'Woodstock', 'Stonecrest', 'Decatur', 'Duluth', 'Carrollton',
    'Griffin', 'McDonough', 'Douglasville', 'Acworth', 'LaGrange', 'Sugar Hill',
    'Canton', 'Snellville', 'Pooler', 'Tucker', 'Statesboro', 'Hinesville',
  ],
  'North Carolina': [
    'Charlotte', 'Raleigh', 'Greensboro', 'Durham', 'Winston-Salem', 'Fayetteville',
    'Cary', 'Wilmington', 'High Point', 'Greenville', 'Asheville', 'Concord',
    'Gastonia', 'Jacksonville', 'Chapel Hill', 'Rocky Mount', 'Burlington',
    'Huntersville', 'Wilson', 'Kannapolis', 'Apex', 'Hickory', 'Goldsboro',
    'Indian Trail', 'Mooresville', 'Wake Forest', 'Monroe', 'Salisbury',
    'New Bern', 'Holly Springs', 'Matthews', 'Sanford', 'Cornelius', 'Lumberton',
    'Asheboro', 'Statesville', 'Mint Hill', 'Fuquay-Varina', 'Kernersville',
    'Morrisville', 'Garner', 'Thomasville', 'Pinehurst', 'Southern Pines',
  ],
  Michigan: [
    'Detroit', 'Grand Rapids', 'Warren', 'Sterling Heights', 'Ann Arbor',
    'Lansing', 'Flint', 'Dearborn', 'Livonia', 'Troy', 'Westland', 'Farmington Hills',
    'Kalamazoo', 'Wyoming', 'Southfield', 'Rochester Hills', 'Taylor', 'Pontiac',
    'St. Clair Shores', 'Royal Oak', 'Novi', 'Dearborn Heights', 'Battle Creek',
    'Saginaw', 'Kentwood', 'East Lansing', 'Roseville', 'Portage', 'Midland',
    'Lincoln Park', 'Muskegon', 'Holland', 'Bay City', 'Jackson', 'Eastpointe',
    'Canton', 'Hamtramck', 'Redford', 'Ypsilanti', 'Ferndale', 'Mount Pleasant',
    'Southgate', 'Traverse City', 'Oak Park', 'Allen Park', 'Inkster',
  ],
  'New Jersey': [
    'Newark', 'Jersey City', 'Paterson', 'Elizabeth', 'Edison', 'Woodbridge',
    'Lakewood', 'Toms River', 'Hamilton', 'Trenton', 'Clifton', 'Camden',
    'Brick', 'Cherry Hill', 'Passaic', 'Middletown', 'Union City', 'Old Bridge',
    'Gloucester', 'East Orange', 'Bayonne', 'Franklin', 'North Bergen',
    'Vineland', 'Piscataway', 'New Brunswick', 'Perth Amboy', 'West New York',
    'Howell', 'Parsippany', 'Hoboken', 'Plainfield', 'Sayreville', 'Kearny',
    'Linden', 'Atlantic City', 'Hackensack', 'West Orange', 'South Brunswick',
    'Mount Laurel', 'Montclair', 'Bloomfield', 'Nutley', 'Irvington',
  ],
};

// Large metro zip codes for deep coverage
const METRO_ZIP_CODES: Record<string, string[]> = {
  'Los Angeles': [
    '90001', '90002', '90003', '90004', '90005', '90006', '90007', '90008',
    '90010', '90011', '90012', '90013', '90014', '90015', '90016', '90017',
    '90018', '90019', '90020', '90021', '90022', '90023', '90024', '90025',
    '90026', '90027', '90028', '90029', '90031', '90032', '90033', '90034',
    '90035', '90036', '90037', '90038', '90039', '90041', '90042', '90043',
    '90044', '90045', '90046', '90047', '90048', '90049', '90056', '90057',
    '90058', '90059', '90061', '90062', '90063', '90064', '90065', '90066',
    '90067', '90068', '90069', '90071', '90077', '90089', '90090', '90094',
  ],
  'Houston': [
    '77001', '77002', '77003', '77004', '77005', '77006', '77007', '77008',
    '77009', '77010', '77011', '77012', '77013', '77014', '77015', '77016',
    '77017', '77018', '77019', '77020', '77021', '77022', '77023', '77024',
    '77025', '77026', '77027', '77028', '77029', '77030', '77031', '77032',
    '77033', '77034', '77035', '77036', '77037', '77038', '77039', '77040',
    '77041', '77042', '77043', '77044', '77045', '77046', '77047', '77048',
    '77049', '77050', '77051', '77053', '77054', '77055', '77056', '77057',
    '77058', '77059', '77060', '77061', '77062', '77063', '77064', '77065',
  ],
  'Chicago': [
    '60601', '60602', '60603', '60604', '60605', '60606', '60607', '60608',
    '60609', '60610', '60611', '60612', '60613', '60614', '60615', '60616',
    '60617', '60618', '60619', '60620', '60621', '60622', '60623', '60624',
    '60625', '60626', '60628', '60629', '60630', '60631', '60632', '60633',
    '60634', '60636', '60637', '60638', '60639', '60640', '60641', '60642',
    '60643', '60644', '60645', '60646', '60647', '60649', '60651', '60652',
    '60653', '60654', '60655', '60656', '60657', '60659', '60660', '60661',
  ],
  'New York City': [
    '10001', '10002', '10003', '10004', '10005', '10006', '10007', '10009',
    '10010', '10011', '10012', '10013', '10014', '10016', '10017', '10018',
    '10019', '10020', '10021', '10022', '10023', '10024', '10025', '10026',
    '10027', '10028', '10029', '10030', '10031', '10032', '10033', '10034',
    '10035', '10036', '10037', '10038', '10039', '10040', '10044', '10065',
    '10069', '10075', '10128', '10280', '10282',
    // Brooklyn
    '11201', '11203', '11204', '11205', '11206', '11207', '11208', '11209',
    '11210', '11211', '11212', '11213', '11214', '11215', '11216', '11217',
    '11218', '11219', '11220', '11221', '11222', '11223', '11224', '11225',
    '11226', '11228', '11229', '11230', '11231', '11232', '11233', '11234',
    '11235', '11236', '11237', '11238', '11239',
    // Queens
    '11354', '11355', '11356', '11357', '11358', '11359', '11360', '11361',
    '11362', '11363', '11364', '11365', '11366', '11367', '11368', '11369',
    '11370', '11371', '11372', '11373', '11374', '11375', '11377', '11378',
    '11379', '11385', '11411', '11412', '11413', '11414', '11415', '11416',
    '11417', '11418', '11419', '11420', '11421', '11422', '11423', '11426',
    '11427', '11428', '11429', '11430', '11432', '11433', '11434', '11435',
    '11436',
  ],
  'Dallas': [
    '75201', '75202', '75203', '75204', '75205', '75206', '75207', '75208',
    '75209', '75210', '75211', '75212', '75214', '75215', '75216', '75217',
    '75218', '75219', '75220', '75223', '75224', '75225', '75226', '75227',
    '75228', '75229', '75230', '75231', '75232', '75233', '75234', '75235',
    '75236', '75237', '75238', '75240', '75241', '75243', '75244', '75246',
    '75247', '75248', '75249', '75250', '75251', '75252', '75253', '75254',
  ],
  'Phoenix': [
    '85003', '85004', '85006', '85007', '85008', '85009', '85012', '85013',
    '85014', '85015', '85016', '85017', '85018', '85019', '85020', '85021',
    '85022', '85023', '85024', '85027', '85028', '85029', '85031', '85032',
    '85033', '85034', '85035', '85037', '85040', '85041', '85042', '85043',
    '85044', '85045', '85048', '85050', '85051', '85053', '85054', '85083',
  ],
  'Philadelphia': [
    '19102', '19103', '19104', '19106', '19107', '19109', '19111', '19112',
    '19113', '19114', '19115', '19116', '19118', '19119', '19120', '19121',
    '19122', '19123', '19124', '19125', '19126', '19127', '19128', '19129',
    '19130', '19131', '19132', '19133', '19134', '19135', '19136', '19137',
    '19138', '19139', '19140', '19141', '19142', '19143', '19144', '19145',
    '19146', '19147', '19148', '19149', '19150', '19151', '19152', '19153',
    '19154',
  ],
  'San Antonio': [
    '78201', '78202', '78203', '78204', '78205', '78207', '78208', '78209',
    '78210', '78211', '78212', '78213', '78214', '78215', '78216', '78217',
    '78218', '78219', '78220', '78221', '78222', '78223', '78224', '78225',
    '78226', '78227', '78228', '78229', '78230', '78231', '78232', '78233',
    '78234', '78235', '78236', '78237', '78238', '78239', '78240', '78242',
    '78244', '78245', '78247', '78248', '78249', '78250', '78251', '78252',
    '78253', '78254', '78255', '78256', '78257', '78258', '78259', '78260',
    '78261', '78263', '78264', '78266',
  ],
  'San Diego': [
    '92101', '92102', '92103', '92104', '92105', '92106', '92107', '92108',
    '92109', '92110', '92111', '92113', '92114', '92115', '92116', '92117',
    '92118', '92119', '92120', '92121', '92122', '92123', '92124', '92126',
    '92127', '92128', '92129', '92130', '92131', '92132', '92134', '92135',
    '92136', '92137', '92138', '92139', '92140', '92145', '92147', '92154',
    '92173',
  ],
  'Miami': [
    '33125', '33126', '33127', '33128', '33129', '33130', '33131', '33132',
    '33133', '33134', '33135', '33136', '33137', '33138', '33139', '33140',
    '33141', '33142', '33143', '33144', '33145', '33146', '33147', '33149',
    '33150', '33154', '33155', '33156', '33157', '33158', '33160', '33161',
    '33162', '33165', '33166', '33167', '33168', '33169', '33170', '33172',
    '33173', '33174', '33175', '33176', '33177', '33178', '33179', '33180',
    '33181', '33182', '33183', '33184', '33185', '33186', '33187', '33189',
    '33190', '33193', '33194', '33196',
  ],
  'Atlanta': [
    '30301', '30302', '30303', '30304', '30305', '30306', '30307', '30308',
    '30309', '30310', '30311', '30312', '30313', '30314', '30315', '30316',
    '30317', '30318', '30319', '30324', '30326', '30327', '30328', '30329',
    '30331', '30332', '30334', '30336', '30337', '30338', '30339', '30340',
    '30341', '30342', '30344', '30345', '30346', '30349', '30350', '30354',
  ],
};

// ============================================================================
// GOOGLE PLACES PROVIDER WITH FULL PAGINATION
// ============================================================================

interface GooglePlaceResult {
  id: string;
  displayName?: { text: string };
  formattedAddress?: string;
  addressComponents?: { longText: string; shortText: string; types: string[] }[];
  location?: { latitude: number; longitude: number };
  nationalPhoneNumber?: string;
  websiteUri?: string;
}

interface GoogleTextSearchResponse {
  places?: GooglePlaceResult[];
  nextPageToken?: string;
}

async function searchGooglePlaces(
  query: string,
  apiKey: string,
  pageToken?: string
): Promise<{ churches: RawChurchData[]; nextPageToken?: string }> {
  const requestBody: Record<string, unknown> = {
    textQuery: query,
    maxResultCount: 20,
    languageCode: 'en',
  };

  if (pageToken) {
    requestBody.pageToken = pageToken;
  }

  const response = await fetch('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': [
        'places.id', 'places.displayName', 'places.formattedAddress',
        'places.addressComponents', 'places.location',
        'places.nationalPhoneNumber', 'places.websiteUri', 'nextPageToken',
      ].join(','),
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Google Places API error: ${response.status} - ${error}`);
  }

  const data: GoogleTextSearchResponse = await response.json();

  const churches = (data.places ?? [])
    .map(place => transformGooglePlace(place))
    .filter((c): c is RawChurchData => c !== null);

  return { churches, nextPageToken: data.nextPageToken };
}

function transformGooglePlace(place: GooglePlaceResult): RawChurchData | null {
  if (!place.displayName?.text || !place.location) return null;

  const components = place.addressComponents ?? [];
  let city = '', state = '', stateAbbr = '', zip = '';

  for (const comp of components) {
    if (!comp.types) continue;
    if (comp.types.includes('locality')) city = comp.longText;
    if (comp.types.includes('administrative_area_level_1')) {
      state = comp.longText;
      stateAbbr = comp.shortText;
    }
    if (comp.types.includes('postal_code')) zip = comp.longText;
  }

  const addressParts = (place.formattedAddress ?? '').split(',');
  const streetAddress = addressParts[0]?.trim() ?? '';

  return {
    name: place.displayName.text,
    address: streetAddress,
    city,
    state,
    stateAbbr,
    zip,
    lat: place.location.latitude,
    lng: place.location.longitude,
    phone: place.nationalPhoneNumber,
    website: place.websiteUri,
    sourceId: place.id,
    source: 'google_places',
  };
}

// Search with FULL pagination - no truncation!
async function searchAllGoogleResults(
  query: string,
  apiKey: string,
  verbose: boolean
): Promise<RawChurchData[]> {
  const allChurches: RawChurchData[] = [];
  let pageToken: string | undefined;
  let pageNum = 0;

  do {
    const result = await searchGooglePlaces(query, apiKey, pageToken);
    allChurches.push(...result.churches);
    pageToken = result.nextPageToken;
    pageNum++;

    if (verbose && result.churches.length > 0) {
      process.stdout.write(` (page ${pageNum}: ${result.churches.length})`);
    }

    // Small delay between pagination requests
    if (pageToken) await sleep(500);
  } while (pageToken);

  return allChurches;
}

// ============================================================================
// OPENSTREETMAP PROVIDER
// ============================================================================

interface OSMElement {
  type: 'node' | 'way' | 'relation';
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

async function searchOpenStreetMap(
  city: string,
  state: string,
  userAgent: string
): Promise<RawChurchData[]> {
  // OSM doesn't have hard limits like Google - we can get ALL results
  const query = `
    [out:json][timeout:120];
    area["name"="${city}"]["admin_level"~"[678]"]->.city;
    (
      node["amenity"="place_of_worship"]["religion"="christian"](area.city);
      way["amenity"="place_of_worship"]["religion"="christian"](area.city);
      relation["amenity"="place_of_worship"]["religion"="christian"](area.city);
    );
    out center;
  `;

  const response = await fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': userAgent,
    },
    body: `data=${encodeURIComponent(query)}`,
  });

  if (!response.ok) {
    throw new Error(`OSM error: ${response.status}`);
  }

  const data: { elements: OSMElement[] } = await response.json();

  const STATE_ABBR: Record<string, string> = {
    'alabama': 'AL', 'alaska': 'AK', 'arizona': 'AZ', 'arkansas': 'AR',
    'california': 'CA', 'colorado': 'CO', 'connecticut': 'CT', 'delaware': 'DE',
    'florida': 'FL', 'georgia': 'GA', 'hawaii': 'HI', 'idaho': 'ID',
    'illinois': 'IL', 'indiana': 'IN', 'iowa': 'IA', 'kansas': 'KS',
    'kentucky': 'KY', 'louisiana': 'LA', 'maine': 'ME', 'maryland': 'MD',
    'massachusetts': 'MA', 'michigan': 'MI', 'minnesota': 'MN', 'mississippi': 'MS',
    'missouri': 'MO', 'montana': 'MT', 'nebraska': 'NE', 'nevada': 'NV',
    'new hampshire': 'NH', 'new jersey': 'NJ', 'new mexico': 'NM', 'new york': 'NY',
    'north carolina': 'NC', 'north dakota': 'ND', 'ohio': 'OH', 'oklahoma': 'OK',
    'oregon': 'OR', 'pennsylvania': 'PA', 'rhode island': 'RI', 'south carolina': 'SC',
    'south dakota': 'SD', 'tennessee': 'TN', 'texas': 'TX', 'utah': 'UT',
    'vermont': 'VT', 'virginia': 'VA', 'washington': 'WA', 'west virginia': 'WV',
    'wisconsin': 'WI', 'wyoming': 'WY',
  };

  return data.elements
    .map(el => {
      const tags = el.tags ?? {};
      const lat = el.lat ?? el.center?.lat;
      const lng = el.lon ?? el.center?.lon;
      if (!lat || !lng || !tags.name) return null;

      const addressParts: string[] = [];
      if (tags['addr:housenumber']) addressParts.push(tags['addr:housenumber']);
      if (tags['addr:street']) addressParts.push(tags['addr:street']);

      return {
        name: tags.name,
        address: addressParts.join(' ') || tags['addr:full'] || '',
        city: tags['addr:city'] ?? city,
        state: tags['addr:state'] ?? state,
        stateAbbr: STATE_ABBR[state.toLowerCase()] ?? tags['addr:state'] ?? '',
        zip: tags['addr:postcode'] ?? '',
        lat,
        lng,
        phone: tags.phone ?? tags['contact:phone'],
        website: tags.website ?? tags['contact:website'],
        denomination: tags.denomination,
        sourceId: `osm:${el.type}/${el.id}`,
        source: 'openstreetmap',
      };
    })
    .filter((c): c is RawChurchData => c !== null);
}

// ============================================================================
// CLI PARSING
// ============================================================================

interface CLIOptions {
  state: string;
  cities?: string[];
  zipCodes: boolean;
  provider: 'google' | 'osm' | 'both';
  dryRun: boolean;
  verbose: boolean;
  limit: number;
}

function parseArgs(): CLIOptions {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Church Seeding CLI v2 - Enhanced Coverage

Usage:
  npx tsx scripts/seed-churches-v2.ts [options]

Options:
  --state <name>       State to seed (required)
  --cities <list>      Comma-separated cities (default: expanded list)
  --zip-codes          Also search by zip codes for major metros
  --provider <name>    google, osm, or both (default: google)
  --limit <number>     Max churches total (default: 5000)
  --dry-run            Don't actually insert to database
  --verbose            Show detailed progress
  --help               Show this help

Examples:
  npx tsx scripts/seed-churches-v2.ts --state "California" --zip-codes
  npx tsx scripts/seed-churches-v2.ts --state "Texas" --provider both --verbose
  npx tsx scripts/seed-churches-v2.ts --state "New York" --provider osm
`);
    process.exit(0);
  }

  const getArg = (flag: string): string | undefined => {
    const idx = args.indexOf(flag);
    return idx !== -1 && idx + 1 < args.length ? args[idx + 1] : undefined;
  };

  const stateArg = getArg('--state');
  if (!stateArg) {
    console.error('Error: --state is required');
    process.exit(1);
  }

  return {
    state: stateArg,
    cities: getArg('--cities')?.split(',').map(c => c.trim()),
    zipCodes: args.includes('--zip-codes'),
    provider: (getArg('--provider') as 'google' | 'osm' | 'both') ?? 'google',
    dryRun: args.includes('--dry-run'),
    verbose: args.includes('--verbose'),
    limit: parseInt(getArg('--limit') ?? '5000', 10),
  };
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  const options = parseArgs();

  console.log('\n🏛️  Church Directory Seeder v2 (Enhanced Coverage)\n');
  console.log(`   State:      ${options.state}`);
  console.log(`   Provider:   ${options.provider}`);
  console.log(`   Zip codes:  ${options.zipCodes}`);
  console.log(`   Limit:      ${options.limit}`);
  console.log(`   Dry run:    ${options.dryRun}`);
  console.log('');

  // Validate environment
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const googleApiKey = process.env.GOOGLE_PLACES_API_KEY;

  if (!options.dryRun && (!supabaseUrl || !supabaseServiceKey)) {
    console.error('Error: Supabase credentials required');
    process.exit(1);
  }

  if ((options.provider === 'google' || options.provider === 'both') && !googleApiKey) {
    console.error('Error: GOOGLE_PLACES_API_KEY required');
    process.exit(1);
  }

  // Initialize Supabase
  const supabase = !options.dryRun
    ? createClient(supabaseUrl!, supabaseServiceKey!)
    : null;

  // Determine cities
  const cities = options.cities ?? STATE_CITIES_EXPANDED[options.state] ?? [];
  if (cities.length === 0) {
    console.error(`No cities found for state "${options.state}"`);
    process.exit(1);
  }

  console.log(`📍 Processing ${cities.length} cities in ${options.state}\n`);

  // Track results
  const allChurches: Map<string, RawChurchData> = new Map(); // Dedupe by sourceId
  let totalFetched = 0;
  let totalFiltered = 0;

  // ========== PHASE 1: City searches ==========
  console.log('Phase 1: City searches\n');

  for (const city of cities) {
    if (allChurches.size >= options.limit) break;

    process.stdout.write(`   ${city.padEnd(25)}`);

    try {
      let cityChurches: RawChurchData[] = [];

      // Google search
      if (options.provider === 'google' || options.provider === 'both') {
        const query = `churches in ${city}, ${options.state}`;
        const googleResults = await searchAllGoogleResults(query, googleApiKey!, options.verbose);
        cityChurches.push(...googleResults);
      }

      // OSM search
      if (options.provider === 'osm' || options.provider === 'both') {
        const osmResults = await searchOpenStreetMap(city, options.state, 'ChurchDirectory/2.0');
        cityChurches.push(...osmResults);
      }

      totalFetched += cityChurches.length;

      // Filter and dedupe
      let added = 0;
      for (const church of cityChurches) {
        if (shouldExcludeChurch(church)) {
          totalFiltered++;
          continue;
        }
        if (!allChurches.has(church.sourceId)) {
          allChurches.set(church.sourceId, church);
          added++;
        }
      }

      console.log(` found ${cityChurches.length}, added ${added}`);
      await sleep(1000);
    } catch (error) {
      console.log(` error: ${error instanceof Error ? error.message : error}`);
    }
  }

  // ========== PHASE 2: Zip code searches (if enabled) ==========
  if (options.zipCodes) {
    console.log('\nPhase 2: Zip code searches (major metros)\n');

    // Find which metros are in this state
    const metrosInState: string[] = [];
    for (const metro of Object.keys(METRO_ZIP_CODES)) {
      // Check if city is in our state's city list
      if (cities.some(c => c.toLowerCase() === metro.toLowerCase())) {
        metrosInState.push(metro);
      }
    }

    for (const metro of metrosInState) {
      const zipCodes = METRO_ZIP_CODES[metro];
      if (!zipCodes) continue;

      console.log(`   ${metro} (${zipCodes.length} zip codes):`);

      for (const zip of zipCodes) {
        if (allChurches.size >= options.limit) break;

        process.stdout.write(`      ${zip}`);

        try {
          const query = `churches in ${zip}`;
          const results = await searchAllGoogleResults(query, googleApiKey!, options.verbose);
          totalFetched += results.length;

          let added = 0;
          for (const church of results) {
            if (shouldExcludeChurch(church)) {
              totalFiltered++;
              continue;
            }
            if (!allChurches.has(church.sourceId)) {
              allChurches.set(church.sourceId, church);
              added++;
            }
          }

          console.log(` found ${results.length}, added ${added}`);
          await sleep(800);
        } catch (error) {
          console.log(` error`);
        }
      }
    }
  }

  // ========== IMPORT TO DATABASE ==========
  console.log('\n' + '='.repeat(60));
  console.log('📊 Summary\n');
  console.log(`   Total fetched:    ${totalFetched}`);
  console.log(`   Filtered out:     ${totalFiltered}`);
  console.log(`   Unique churches:  ${allChurches.size}`);

  if (options.dryRun) {
    console.log('\n🔍 Dry run - no data imported\n');

    if (options.verbose) {
      console.log('Sample churches:\n');
      let count = 0;
      for (const church of allChurches.values()) {
        if (count++ >= 10) break;
        console.log(`   • ${church.name}`);
        console.log(`     ${church.address}, ${church.city}, ${church.stateAbbr} ${church.zip}`);
        console.log(`     Source: ${church.source}`);
        console.log('');
      }
    }
  } else if (supabase) {
    console.log('\n📥 Importing to database...\n');

    let imported = 0;
    let skipped = 0;
    let errors = 0;

    const churches = Array.from(allChurches.values());

    for (let i = 0; i < churches.length; i += 50) {
      const batch = churches.slice(i, i + 50);

      for (const church of batch) {
        try {
          // Check for duplicate by source_id
          const { data: existing } = await supabase
            .from('churches')
            .select('id')
            .eq('source_id', church.sourceId)
            .single();

          if (existing) {
            skipped++;
            continue;
          }

          // Generate slug from name and city
          const baseSlug = `${church.name}-${church.city}`
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '')
            .slice(0, 100);
          const slug = `${baseSlug}-${church.sourceId.slice(-8)}`;

          // Insert new church
          const { error } = await supabase.from('churches').insert({
            slug,
            name: church.name,
            address: church.address,
            city: church.city,
            state: church.state,
            state_abbr: church.stateAbbr,
            zip: church.zip,
            lat: church.lat,
            lng: church.lng,
            phone: church.phone,
            website: church.website,
            denomination: church.denomination,
            source: church.source,
            source_id: church.sourceId,
          });

          if (error) {
            if (error.code === '23505') { // Unique constraint violation
              skipped++;
            } else {
              errors++;
            }
          } else {
            imported++;
          }
        } catch {
          errors++;
        }
      }

      process.stdout.write(`\r   Progress: ${Math.min(i + 50, churches.length)}/${churches.length}`);
    }

    console.log(`\n\n   Imported: ${imported}`);
    console.log(`   Skipped:  ${skipped} (duplicates)`);
    console.log(`   Errors:   ${errors}`);
    console.log(`\n✅ Done!\n`);
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

main().catch(err => {
  console.error('\n❌ Fatal error:', err);
  process.exit(1);
});
