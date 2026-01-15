#!/usr/bin/env npx tsx

/**
 * Church Seeding CLI Script
 *
 * Usage:
 *   npx tsx scripts/seed-churches.ts --state "Arizona" --limit 500
 *   npx tsx scripts/seed-churches.ts --state "Arizona" --cities "Phoenix,Tucson,Mesa"
 *   npx tsx scripts/seed-churches.ts --help
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });

import {
  ProviderManager,
  type RawChurchData,
  type ChurchSearchParams,
} from '../src/lib/providers';
import {
  ChurchIngestionService,
} from '../src/lib/services/church-ingestion';

// ============================================================================
// EXCLUSION FILTERS
// ============================================================================

const EXCLUDED_TERMS = [
  // Non-Christian religions
  'scientology',
  'latter-day saints',
  'latter day saints',
  'jehovah\'s witness',
  'jehovahs witness',
  'jehova',
  'mormon',
  'lds church',
  'new age',
  'mystical',
  'satan',
  'satanic',
  'lucifer',
  'wicca',
  'pagan',
  'occult',
  'spiritualist',
  'unitarian universalist',
  'unity church',
  'christian science',
  'scientologist',
  'islam',
  'mosque',
  'buddhist',
  'buddhism',
  'hindu',
  'temple',
  'synagogue',
  'jewish',
  'sikh',
  'gurdwara',
  'baha\'i',
  'bahai',
  'hare krishna',
  'krishna',
  'transcendental',
  'theosophy',
  'rosicrucian',
];

function shouldExcludeChurch(church: RawChurchData): boolean {
  // Skip if missing required fields
  if (!church || !church.name) {
    return true;
  }

  const nameAndDenom = `${church.name} ${church.denomination ?? ''}`.toLowerCase();

  for (const term of EXCLUDED_TERMS) {
    if (nameAndDenom.includes(term)) {
      return true;
    }
  }

  return false;
}

// ============================================================================
// STATE CITY LISTS (top cities by population)
// ============================================================================

const STATE_CITIES: Record<string, string[]> = {
  Arizona: [
    'Phoenix', 'Tucson', 'Mesa', 'Chandler', 'Gilbert', 'Glendale', 'Scottsdale',
    'Peoria', 'Tempe', 'Surprise', 'Yuma', 'Avondale', 'Goodyear', 'Flagstaff',
    'Buckeye', 'Casa Grande', 'Lake Havasu City', 'Maricopa', 'Sierra Vista',
    'Prescott', 'Bullhead City', 'Apache Junction', 'Prescott Valley', 'Marana',
    'El Mirage', 'Kingman', 'Queen Creek', 'Florence', 'San Luis', 'Sahuarita',
  ],
  California: [
    'Los Angeles', 'San Diego', 'San Jose', 'San Francisco', 'Fresno', 'Sacramento',
    'Long Beach', 'Oakland', 'Bakersfield', 'Anaheim', 'Santa Ana', 'Riverside',
    'Stockton', 'Irvine', 'Chula Vista', 'Fremont', 'San Bernardino', 'Modesto',
    'Fontana', 'Moreno Valley', 'Glendale', 'Huntington Beach', 'Santa Clarita',
    'Garden Grove', 'Oceanside', 'Rancho Cucamonga', 'Ontario', 'Santa Rosa',
    'Elk Grove', 'Corona', 'Lancaster', 'Palmdale', 'Salinas', 'Pomona', 'Hayward',
  ],
  Texas: [
    'Houston', 'San Antonio', 'Dallas', 'Austin', 'Fort Worth', 'El Paso',
    'Arlington', 'Corpus Christi', 'Plano', 'Laredo', 'Lubbock', 'Garland',
    'Irving', 'Amarillo', 'Grand Prairie', 'Brownsville', 'McKinney', 'Frisco',
    'Pasadena', 'Mesquite', 'Killeen', 'McAllen', 'Midland', 'Denton', 'Waco',
    'Carrollton', 'Round Rock', 'Abilene', 'Odessa', 'Pearland', 'Richardson',
    'Sugar Land', 'Beaumont', 'College Station', 'League City', 'Tyler',
  ],
  Florida: [
    'Jacksonville', 'Miami', 'Tampa', 'Orlando', 'St. Petersburg', 'Hialeah',
    'Port St. Lucie', 'Cape Coral', 'Tallahassee', 'Fort Lauderdale', 'Pembroke Pines',
    'Hollywood', 'Miramar', 'Gainesville', 'Coral Springs', 'Clearwater', 'Palm Bay',
    'Lakeland', 'West Palm Beach', 'Pompano Beach', 'Davie', 'Miami Gardens',
    'Sunrise', 'Boca Raton', 'Deltona', 'Plantation', 'Fort Myers', 'Palm Coast',
    'Deerfield Beach', 'Melbourne', 'Boynton Beach', 'Lauderhill', 'Kissimmee',
  ],
  'New York': [
    'New York City', 'Buffalo', 'Rochester', 'Yonkers', 'Syracuse', 'Albany',
    'New Rochelle', 'Mount Vernon', 'Schenectady', 'Utica', 'White Plains',
    'Troy', 'Niagara Falls', 'Binghamton', 'Rome', 'Long Beach', 'Poughkeepsie',
    'North Tonawanda', 'Jamestown', 'Ithaca', 'Elmira', 'Newburgh', 'Middletown',
    'Auburn', 'Watertown', 'Glen Cove', 'Saratoga Springs', 'Kingston',
  ],
  Pennsylvania: [
    'Philadelphia', 'Pittsburgh', 'Allentown', 'Reading', 'Scranton', 'Bethlehem',
    'Lancaster', 'Harrisburg', 'Altoona', 'Erie', 'York', 'Wilkes-Barre',
    'Chester', 'Easton', 'Lebanon', 'Hazleton', 'New Castle', 'Johnstown',
    'McKeesport', 'Williamsport', 'State College', 'Norristown', 'Pottstown',
    'West Chester', 'Chambersburg', 'Carlisle', 'Hanover', 'Gettysburg',
  ],
  Illinois: [
    'Chicago', 'Aurora', 'Joliet', 'Naperville', 'Rockford', 'Springfield',
    'Elgin', 'Peoria', 'Champaign', 'Waukegan', 'Cicero', 'Bloomington',
    'Arlington Heights', 'Evanston', 'Decatur', 'Schaumburg', 'Bolingbrook',
    'Palatine', 'Skokie', 'Des Plaines', 'Orland Park', 'Tinley Park',
    'Oak Lawn', 'Berwyn', 'Mount Prospect', 'Normal', 'Wheaton', 'Hoffman Estates',
  ],
  Ohio: [
    'Columbus', 'Cleveland', 'Cincinnati', 'Toledo', 'Akron', 'Dayton',
    'Parma', 'Canton', 'Youngstown', 'Lorain', 'Hamilton', 'Springfield',
    'Kettering', 'Elyria', 'Lakewood', 'Cuyahoga Falls', 'Euclid', 'Middletown',
    'Mansfield', 'Newark', 'Mentor', 'Cleveland Heights', 'Strongsville',
    'Dublin', 'Fairfield', 'Findlay', 'Warren', 'Lancaster', 'Lima', 'Huber Heights',
  ],
  Georgia: [
    'Atlanta', 'Augusta', 'Columbus', 'Macon', 'Savannah', 'Athens', 'Sandy Springs',
    'Roswell', 'Johns Creek', 'Albany', 'Warner Robins', 'Alpharetta', 'Marietta',
    'Valdosta', 'Smyrna', 'Dunwoody', 'Rome', 'Peachtree City', 'Brookhaven',
    'Gainesville', 'Newnan', 'Milton', 'Woodstock', 'Douglasville', 'Kennesaw',
    'Lawrenceville', 'Duluth', 'Stonecrest', 'Statesboro', 'Carrollton',
  ],
  'North Carolina': [
    'Charlotte', 'Raleigh', 'Greensboro', 'Durham', 'Winston-Salem', 'Fayetteville',
    'Cary', 'Wilmington', 'High Point', 'Concord', 'Greenville', 'Asheville',
    'Gastonia', 'Jacksonville', 'Chapel Hill', 'Huntersville', 'Apex', 'Burlington',
    'Rocky Mount', 'Kannapolis', 'Matthews', 'Sanford', 'Wilson', 'New Bern',
    'Hickory', 'Goldsboro', 'Mooresville', 'Monroe', 'Salisbury', 'Holly Springs',
  ],
  Michigan: [
    'Detroit', 'Grand Rapids', 'Warren', 'Sterling Heights', 'Ann Arbor', 'Lansing',
    'Flint', 'Dearborn', 'Livonia', 'Troy', 'Westland', 'Farmington Hills',
    'Kalamazoo', 'Wyoming', 'Southfield', 'Rochester Hills', 'Taylor', 'Pontiac',
    'St. Clair Shores', 'Royal Oak', 'Novi', 'Dearborn Heights', 'Battle Creek',
    'Saginaw', 'Kentwood', 'East Lansing', 'Roseville', 'Portage', 'Midland', 'Muskegon',
  ],
  // States 11-20 by population
  'New Jersey': [
    'Newark', 'Jersey City', 'Paterson', 'Elizabeth', 'Edison', 'Woodbridge',
    'Lakewood', 'Toms River', 'Hamilton', 'Trenton', 'Clifton', 'Camden',
    'Brick', 'Cherry Hill', 'Passaic', 'Union City', 'Old Bridge', 'Middletown',
    'Bayonne', 'East Orange', 'Franklin', 'North Bergen', 'Vineland', 'Union',
    'Piscataway', 'New Brunswick', 'Jackson', 'Wayne', 'Irvington', 'Parsippany',
  ],
  Virginia: [
    'Virginia Beach', 'Norfolk', 'Chesapeake', 'Richmond', 'Newport News',
    'Alexandria', 'Hampton', 'Roanoke', 'Portsmouth', 'Suffolk', 'Lynchburg',
    'Harrisonburg', 'Leesburg', 'Charlottesville', 'Danville', 'Manassas',
    'Petersburg', 'Fredericksburg', 'Winchester', 'Salem', 'Staunton',
    'Waynesboro', 'Bristol', 'Radford', 'Colonial Heights', 'Hopewell',
  ],
  Washington: [
    'Seattle', 'Spokane', 'Tacoma', 'Vancouver', 'Bellevue', 'Kent', 'Everett',
    'Renton', 'Federal Way', 'Spokane Valley', 'Kirkland', 'Bellingham',
    'Auburn', 'Kennewick', 'Redmond', 'Marysville', 'Pasco', 'Lakewood',
    'Sammamish', 'Richland', 'Burien', 'Olympia', 'Lacey', 'Edmonds',
    'Bremerton', 'Puyallup', 'Longview', 'Shoreline', 'Yakima', 'Bothell',
  ],
  Massachusetts: [
    'Boston', 'Worcester', 'Springfield', 'Cambridge', 'Lowell', 'Brockton',
    'New Bedford', 'Quincy', 'Lynn', 'Fall River', 'Newton', 'Lawrence',
    'Somerville', 'Framingham', 'Haverhill', 'Waltham', 'Malden', 'Brookline',
    'Plymouth', 'Medford', 'Taunton', 'Chicopee', 'Weymouth', 'Revere',
    'Peabody', 'Methuen', 'Barnstable', 'Pittsfield', 'Attleboro', 'Salem',
  ],
  Tennessee: [
    'Nashville', 'Memphis', 'Knoxville', 'Chattanooga', 'Clarksville', 'Murfreesboro',
    'Franklin', 'Jackson', 'Johnson City', 'Bartlett', 'Hendersonville', 'Kingsport',
    'Collierville', 'Smyrna', 'Cleveland', 'Brentwood', 'Germantown', 'Columbia',
    'Spring Hill', 'La Vergne', 'Gallatin', 'Cookeville', 'Mount Juliet', 'Lebanon',
    'Morristown', 'Oak Ridge', 'Maryville', 'Bristol', 'Farragut', 'Shelbyville',
  ],
  Indiana: [
    'Indianapolis', 'Fort Wayne', 'Evansville', 'South Bend', 'Carmel', 'Fishers',
    'Bloomington', 'Hammond', 'Gary', 'Lafayette', 'Muncie', 'Terre Haute',
    'Noblesville', 'Greenwood', 'Kokomo', 'Anderson', 'Elkhart', 'Mishawaka',
    'Lawrence', 'Jeffersonville', 'Columbus', 'Portage', 'New Albany', 'Richmond',
    'Westfield', 'Valparaiso', 'Goshen', 'Michigan City', 'Marion', 'East Chicago',
  ],
  Missouri: [
    'Kansas City', 'St. Louis', 'Springfield', 'Columbia', 'Independence',
    "Lee's Summit", "O'Fallon", 'St. Joseph', 'St. Charles', 'St. Peters',
    'Blue Springs', 'Florissant', 'Joplin', 'Chesterfield', 'Jefferson City',
    'Cape Girardeau', 'Wildwood', 'University City', 'Ballwin', 'Raytown',
    'Liberty', 'Wentzville', 'Mehlville', 'Kirkwood', 'Maryland Heights',
    'Hazelwood', 'Gladstone', 'Grandview', 'Belton', 'Webster Groves',
  ],
  Maryland: [
    'Baltimore', 'Frederick', 'Rockville', 'Gaithersburg', 'Bowie', 'Hagerstown',
    'Annapolis', 'College Park', 'Salisbury', 'Laurel', 'Greenbelt', 'Cumberland',
    'Westminster', 'Hyattsville', 'Takoma Park', 'Easton', 'Elkton', 'Havre de Grace',
    'Cambridge', 'Aberdeen', 'New Carrollton', 'Bel Air', 'Cheverly', 'Bladensburg',
  ],
  Wisconsin: [
    'Milwaukee', 'Madison', 'Green Bay', 'Kenosha', 'Racine', 'Appleton',
    'Waukesha', 'Eau Claire', 'Oshkosh', 'Janesville', 'West Allis', 'La Crosse',
    'Sheboygan', 'Wauwatosa', 'Fond du Lac', 'New Berlin', 'Wausau', 'Brookfield',
    'Beloit', 'Greenfield', 'Franklin', 'Oak Creek', 'Manitowoc', 'West Bend',
    'Sun Prairie', 'Superior', 'Stevens Point', 'Neenah', 'Fitchburg', 'Muskego',
  ],
  Colorado: [
    'Denver', 'Colorado Springs', 'Aurora', 'Fort Collins', 'Lakewood', 'Thornton',
    'Arvada', 'Westminster', 'Pueblo', 'Centennial', 'Boulder', 'Greeley',
    'Longmont', 'Loveland', 'Grand Junction', 'Broomfield', 'Castle Rock', 'Commerce City',
    'Parker', 'Littleton', 'Northglenn', 'Brighton', 'Englewood', 'Wheat Ridge',
    'Fountain', 'Lafayette', 'Windsor', 'Erie', 'Evans', 'Golden',
  ],
  Minnesota: [
    'Minneapolis', 'St. Paul', 'Rochester', 'Bloomington', 'Duluth', 'Brooklyn Park',
    'Plymouth', 'Woodbury', 'Lakeville', 'Blaine', 'Maple Grove', 'St. Cloud',
    'Eagan', 'Burnsville', 'Eden Prairie', 'Coon Rapids', 'Minnetonka', 'Apple Valley',
    'Edina', 'St. Louis Park', 'Mankato', 'Moorhead', 'Shakopee', 'Maplewood',
    'Cottage Grove', 'Richfield', 'Roseville', 'Inver Grove Heights', 'Andover', 'Brooklyn Center',
  ],
  'South Carolina': [
    'Charleston', 'Columbia', 'North Charleston', 'Mount Pleasant', 'Rock Hill',
    'Greenville', 'Summerville', 'Goose Creek', 'Hilton Head Island', 'Sumter',
    'Florence', 'Spartanburg', 'Myrtle Beach', 'Aiken', 'Anderson', 'Greer',
    'Mauldin', 'Greenwood', 'North Augusta', 'Easley', 'Simpsonville', 'Hanahan',
    'Lexington', 'Conway', 'West Columbia', 'North Myrtle Beach', 'Clemson', 'Bluffton',
  ],
  Alabama: [
    'Birmingham', 'Montgomery', 'Huntsville', 'Mobile', 'Tuscaloosa', 'Hoover',
    'Dothan', 'Auburn', 'Decatur', 'Madison', 'Florence', 'Gadsden',
    'Vestavia Hills', 'Prattville', 'Phenix City', 'Alabaster', 'Bessemer', 'Enterprise',
    'Opelika', 'Homewood', 'Northport', 'Anniston', 'Prichard', 'Athens',
    'Daphne', 'Pelham', 'Albertville', 'Selma', 'Oxford', 'Mountain Brook',
  ],
  Louisiana: [
    'New Orleans', 'Baton Rouge', 'Shreveport', 'Lafayette', 'Lake Charles',
    'Kenner', 'Bossier City', 'Monroe', 'Alexandria', 'Houma', 'Marrero',
    'New Iberia', 'Laplace', 'Slidell', 'Central', 'Ruston', 'Sulphur',
    'Hammond', 'Natchitoches', 'Zachary', 'Pineville', 'Thibodaux', 'Crowley',
    'Morgan City', 'West Monroe', 'Bastrop', 'Opelousas', 'Minden', 'Bogalusa',
  ],
  Kentucky: [
    'Louisville', 'Lexington', 'Bowling Green', 'Owensboro', 'Covington',
    'Richmond', 'Georgetown', 'Florence', 'Hopkinsville', 'Nicholasville',
    'Elizabethtown', 'Henderson', 'Frankfort', 'Jeffersontown', 'Independence',
    'Paducah', 'Radcliff', 'Ashland', 'Madisonville', 'Winchester',
    'Erlanger', 'Murray', 'St. Matthews', 'Fort Thomas', 'Danville',
  ],
  Oregon: [
    'Portland', 'Salem', 'Eugene', 'Gresham', 'Hillsboro', 'Beaverton',
    'Bend', 'Medford', 'Springfield', 'Corvallis', 'Albany', 'Tigard',
    'Lake Oswego', 'Keizer', 'Grants Pass', 'Oregon City', 'McMinnville',
    'Redmond', 'Tualatin', 'West Linn', 'Woodburn', 'Forest Grove', 'Newberg',
    'Wilsonville', 'Roseburg', 'Klamath Falls', 'Ashland', 'Milwaukie', 'Coos Bay',
  ],
  Oklahoma: [
    'Oklahoma City', 'Tulsa', 'Norman', 'Broken Arrow', 'Edmond', 'Lawton',
    'Moore', 'Midwest City', 'Enid', 'Stillwater', 'Muskogee', 'Bartlesville',
    'Owasso', 'Shawnee', 'Ponca City', 'Ardmore', 'Duncan', 'Del City',
    'Bixby', 'Sapulpa', 'Yukon', 'Altus', 'Bethany', 'Sand Springs',
    'Claremore', 'McAlester', 'El Reno', 'Jenks', 'Mustang', 'Durant',
  ],
  Connecticut: [
    'Bridgeport', 'New Haven', 'Stamford', 'Hartford', 'Waterbury', 'Norwalk',
    'Danbury', 'New Britain', 'West Hartford', 'Greenwich', 'Fairfield', 'Hamden',
    'Bristol', 'Meriden', 'Manchester', 'West Haven', 'Milford', 'Stratford',
    'East Hartford', 'Middletown', 'Wallingford', 'Enfield', 'Southington', 'Shelton',
    'Norwich', 'Groton', 'Trumbull', 'Glastonbury', 'Naugatuck', 'Newington',
  ],
  // Remaining states to complete all 50
  Iowa: [
    'Des Moines', 'Cedar Rapids', 'Davenport', 'Sioux City', 'Iowa City', 'Waterloo',
    'Ames', 'West Des Moines', 'Council Bluffs', 'Ankeny', 'Dubuque', 'Urbandale',
    'Cedar Falls', 'Marion', 'Bettendorf', 'Mason City', 'Marshalltown', 'Clinton',
    'Burlington', 'Ottumwa', 'Fort Dodge', 'Muscatine', 'Coralville', 'Johnston',
  ],
  Nevada: [
    'Las Vegas', 'Henderson', 'Reno', 'North Las Vegas', 'Sparks', 'Carson City',
    'Fernley', 'Elko', 'Mesquite', 'Boulder City', 'Fallon', 'Winnemucca',
    'West Wendover', 'Ely', 'Yerington', 'Carlin', 'Lovelock', 'Wells',
  ],
  Arkansas: [
    'Little Rock', 'Fort Smith', 'Fayetteville', 'Springdale', 'Jonesboro', 'Rogers',
    'Conway', 'North Little Rock', 'Bentonville', 'Pine Bluff', 'Hot Springs',
    'Benton', 'Texarkana', 'Sherwood', 'Jacksonville', 'Russellville', 'Bella Vista',
    'West Memphis', 'Paragould', 'Cabot', 'Searcy', 'Van Buren', 'El Dorado', 'Maumelle',
  ],
  Mississippi: [
    'Jackson', 'Gulfport', 'Southaven', 'Hattiesburg', 'Biloxi', 'Meridian',
    'Tupelo', 'Olive Branch', 'Greenville', 'Horn Lake', 'Clinton', 'Pearl',
    'Madison', 'Starkville', 'Ridgeland', 'Columbus', 'Vicksburg', 'Pascagoula',
    'Brandon', 'Oxford', 'Gautier', 'Ocean Springs', 'Laurel', 'Hernando',
  ],
  Utah: [
    'Salt Lake City', 'West Valley City', 'Provo', 'West Jordan', 'Orem', 'Sandy',
    'Ogden', 'St. George', 'Layton', 'South Jordan', 'Lehi', 'Millcreek',
    'Taylorsville', 'Logan', 'Murray', 'Draper', 'Bountiful', 'Riverton',
    'Herriman', 'Spanish Fork', 'Roy', 'Pleasant Grove', 'Kearns', 'Tooele',
    'Cottonwood Heights', 'Springville', 'Cedar City', 'Midvale', 'Kaysville', 'Holladay',
  ],
  Kansas: [
    'Wichita', 'Overland Park', 'Kansas City', 'Olathe', 'Topeka', 'Lawrence',
    'Shawnee', 'Manhattan', 'Lenexa', 'Salina', 'Hutchinson', 'Leavenworth',
    'Leawood', 'Dodge City', 'Garden City', 'Emporia', 'Derby', 'Prairie Village',
    'Junction City', 'Hays', 'Liberal', 'Newton', 'Pittsburg', 'Gardner',
  ],
  'New Mexico': [
    'Albuquerque', 'Las Cruces', 'Rio Rancho', 'Santa Fe', 'Roswell', 'Farmington',
    'Clovis', 'Hobbs', 'Alamogordo', 'Carlsbad', 'Gallup', 'Deming', 'Los Lunas',
    'Chaparral', 'Sunland Park', 'Las Vegas', 'Portales', 'Artesia', 'Lovington',
    'Silver City', 'Espanola', 'Anthony', 'Grants', 'Socorro', 'Bernalillo',
  ],
  Nebraska: [
    'Omaha', 'Lincoln', 'Bellevue', 'Grand Island', 'Kearney', 'Fremont',
    'Hastings', 'Norfolk', 'North Platte', 'Columbus', 'Papillion', 'La Vista',
    'Scottsbluff', 'South Sioux City', 'Beatrice', 'Lexington', 'Chalco', 'Gering',
  ],
  'West Virginia': [
    'Charleston', 'Huntington', 'Morgantown', 'Parkersburg', 'Wheeling', 'Weirton',
    'Fairmont', 'Martinsburg', 'Beckley', 'Clarksburg', 'South Charleston', 'Teays Valley',
    'St. Albans', 'Vienna', 'Bluefield', 'Moundsville', 'Bridgeport', 'Oak Hill',
  ],
  Idaho: [
    'Boise', 'Meridian', 'Nampa', 'Idaho Falls', 'Caldwell', 'Pocatello',
    'Coeur d\'Alene', 'Twin Falls', 'Post Falls', 'Lewiston', 'Rexburg', 'Eagle',
    'Kuna', 'Moscow', 'Ammon', 'Chubbuck', 'Mountain Home', 'Blackfoot',
    'Garden City', 'Jerome', 'Burley', 'Sandpoint', 'Star', 'Hayden',
  ],
  Hawaii: [
    'Honolulu', 'Pearl City', 'Hilo', 'Kailua', 'Waipahu', 'Kaneohe',
    'Mililani Town', 'Kahului', 'Ewa Gentry', 'Mililani Mauka', 'Kihei', 'Makakilo',
    'Wahiawa', 'Schofield Barracks', 'Kapolei', 'Ewa Beach', 'Royal Kunia', 'Halawa',
  ],
  'New Hampshire': [
    'Manchester', 'Nashua', 'Concord', 'Derry', 'Dover', 'Rochester',
    'Salem', 'Merrimack', 'Hudson', 'Londonderry', 'Keene', 'Bedford',
    'Portsmouth', 'Goffstown', 'Laconia', 'Hampton', 'Milford', 'Durham',
  ],
  Maine: [
    'Portland', 'Lewiston', 'Bangor', 'South Portland', 'Auburn', 'Biddeford',
    'Sanford', 'Brunswick', 'Augusta', 'Saco', 'Westbrook', 'Waterville',
    'Presque Isle', 'Brewer', 'Bath', 'Ellsworth', 'Caribou', 'Old Town',
  ],
  Montana: [
    'Billings', 'Missoula', 'Great Falls', 'Bozeman', 'Butte', 'Helena',
    'Kalispell', 'Havre', 'Anaconda', 'Miles City', 'Belgrade', 'Livingston',
    'Laurel', 'Whitefish', 'Lewistown', 'Sidney', 'Glendive', 'Columbia Falls',
  ],
  'Rhode Island': [
    'Providence', 'Warwick', 'Cranston', 'Pawtucket', 'East Providence', 'Woonsocket',
    'Coventry', 'Cumberland', 'North Providence', 'South Kingstown', 'West Warwick',
    'Johnston', 'North Kingstown', 'Newport', 'Bristol', 'Westerly', 'Smithfield', 'Lincoln',
  ],
  Delaware: [
    'Wilmington', 'Dover', 'Newark', 'Middletown', 'Smyrna', 'Milford',
    'Seaford', 'Georgetown', 'Elsmere', 'New Castle', 'Millsboro', 'Laurel',
    'Harrington', 'Camden', 'Clayton', 'Lewes', 'Milton', 'Selbyville',
  ],
  'South Dakota': [
    'Sioux Falls', 'Rapid City', 'Aberdeen', 'Brookings', 'Watertown', 'Mitchell',
    'Yankton', 'Pierre', 'Huron', 'Vermillion', 'Spearfish', 'Box Elder',
    'Brandon', 'Sturgis', 'Madison', 'Belle Fourche', 'Harrisburg', 'Tea',
  ],
  'North Dakota': [
    'Fargo', 'Bismarck', 'Grand Forks', 'Minot', 'West Fargo', 'Williston',
    'Dickinson', 'Mandan', 'Jamestown', 'Wahpeton', 'Devils Lake', 'Watford City',
    'Valley City', 'Grafton', 'Beulah', 'Rugby', 'Bottineau', 'Hazen',
  ],
  Alaska: [
    'Anchorage', 'Fairbanks', 'Juneau', 'Sitka', 'Ketchikan', 'Wasilla',
    'Kenai', 'Kodiak', 'Bethel', 'Palmer', 'Homer', 'Soldotna',
    'Valdez', 'Nome', 'Kotzebue', 'Seward', 'Cordova', 'Dillingham',
  ],
  Vermont: [
    'Burlington', 'South Burlington', 'Rutland', 'Barre', 'Montpelier', 'Winooski',
    'St. Albans', 'Newport', 'Vergennes', 'Middlebury', 'St. Johnsbury', 'Brattleboro',
    'Bennington', 'Essex Junction', 'Hartford', 'Milton', 'Morristown', 'Colchester',
  ],
  Wyoming: [
    'Cheyenne', 'Casper', 'Laramie', 'Gillette', 'Rock Springs', 'Sheridan',
    'Green River', 'Evanston', 'Riverton', 'Cody', 'Jackson', 'Rawlins',
    'Lander', 'Torrington', 'Powell', 'Douglas', 'Worland', 'Buffalo',
  ],
};

// Backward compatibility
const ARIZONA_CITIES = STATE_CITIES.Arizona;

// ============================================================================
// CLI PARSING
// ============================================================================

interface CLIOptions {
  state: string;
  cities?: string[];
  limit: number;
  provider: 'google_places' | 'openstreetmap';
  dryRun: boolean;
  skipEnrichment: boolean;
  verbose: boolean;
}

function parseArgs(): CLIOptions {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Church Seeding CLI

Usage:
  npx tsx scripts/seed-churches.ts [options]

Options:
  --state <name>       State to seed (default: Arizona)
  --cities <list>      Comma-separated cities (default: top 30 by population)
  --limit <number>     Max churches to import (default: 500)
  --provider <name>    Data provider: google_places or openstreetmap (default: google_places)
  --dry-run            Don't actually insert, just show what would be imported
  --skip-enrichment    Don't queue for AI enrichment
  --verbose            Show detailed progress
  --help               Show this help message

Examples:
  npx tsx scripts/seed-churches.ts --state "Arizona" --limit 500
  npx tsx scripts/seed-churches.ts --cities "Phoenix,Tucson" --limit 100 --dry-run
  npx tsx scripts/seed-churches.ts --provider openstreetmap --verbose
`);
    process.exit(0);
  }

  const getArg = (flag: string): string | undefined => {
    const idx = args.indexOf(flag);
    return idx !== -1 && idx + 1 < args.length ? args[idx + 1] : undefined;
  };

  return {
    state: getArg('--state') ?? 'Arizona',
    cities: getArg('--cities')?.split(',').map((c) => c.trim()),
    limit: parseInt(getArg('--limit') ?? '500', 10),
    provider: (getArg('--provider') as 'google_places' | 'openstreetmap') ?? 'google_places',
    dryRun: args.includes('--dry-run'),
    skipEnrichment: args.includes('--skip-enrichment'),
    verbose: args.includes('--verbose'),
  };
}

// ============================================================================
// MAIN SCRIPT
// ============================================================================

async function main() {
  const options = parseArgs();

  console.log('\n🏛️  Church Directory Seeder\n');
  console.log(`   State:      ${options.state}`);
  console.log(`   Provider:   ${options.provider}`);
  console.log(`   Limit:      ${options.limit}`);
  console.log(`   Dry run:    ${options.dryRun}`);
  console.log('');

  // Validate environment
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const googleApiKey = process.env.GOOGLE_PLACES_API_KEY;

  if (!options.dryRun && (!supabaseUrl || !supabaseServiceKey)) {
    console.error('❌ Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required');
    console.error('   Set these in .env.local or use --dry-run to test');
    process.exit(1);
  }

  if (options.provider === 'google_places' && !googleApiKey) {
    console.error('❌ Error: GOOGLE_PLACES_API_KEY required for Google Places provider');
    process.exit(1);
  }

  // Initialize provider manager
  const providerManager = new ProviderManager({
    defaultProvider: options.provider,
    googlePlaces: googleApiKey ? { apiKey: googleApiKey } : undefined,
    openStreetMap: { userAgent: 'ChurchDirectory/1.0 (seeding script)' },
  });

  // Initialize ingestion service (only if not dry run)
  let ingestionService: ChurchIngestionService | null = null;
  if (!options.dryRun && supabaseUrl && supabaseServiceKey) {
    ingestionService = new ChurchIngestionService(
      supabaseUrl,
      supabaseServiceKey,
      providerManager
    );
  }

  // Determine cities to process
  const stateCities = STATE_CITIES[options.state];
  if (!options.cities && !stateCities) {
    console.error(`❌ Error: No city list found for state "${options.state}"`);
    console.error(`   Available states: ${Object.keys(STATE_CITIES).join(', ')}`);
    console.error('   Or provide cities with --cities "City1,City2,City3"');
    process.exit(1);
  }
  const cities = options.cities ?? stateCities;
  console.log(`📍 Processing ${cities.length} cities in ${options.state}\n`);

  // Track totals
  let totalFetched = 0;
  let totalFiltered = 0;
  let totalImported = 0;
  let totalSkipped = 0;
  let totalErrors = 0;
  const allChurches: RawChurchData[] = [];

  // Process each city
  for (const city of cities) {
    if (totalImported >= options.limit) {
      console.log(`\n✅ Reached limit of ${options.limit} churches`);
      break;
    }

    const remainingLimit = options.limit - totalImported;

    process.stdout.write(`   ${city.padEnd(20)}`);

    try {
      // Search for churches
      const searchParams: ChurchSearchParams = {
        city,
        state: options.state,
        limit: Math.min(50, remainingLimit), // API limit per request
      };

      const result = await providerManager.searchChurches(searchParams, options.provider);

      // Filter out any null/undefined entries from the result
      const validChurches = (result.churches || []).filter(c => c != null);
      totalFetched += validChurches.length;

      // Filter out excluded churches and invalid entries
      const filteredChurches = validChurches.filter((church) => {
        // Skip invalid entries
        if (!church || !church.name) {
          totalFiltered++;
          return false;
        }
        if (shouldExcludeChurch(church)) {
          totalFiltered++;
          if (options.verbose) {
            console.log(`\n      ⛔ Excluded: ${church.name}`);
          }
          return false;
        }
        return true;
      });

      if (options.dryRun) {
        // Just collect and count
        allChurches.push(...filteredChurches.slice(0, remainingLimit));
        totalImported += Math.min(filteredChurches.length, remainingLimit);
        console.log(`found ${validChurches.length}, kept ${Math.min(filteredChurches.length, remainingLimit)}`);
      } else if (ingestionService) {
        // Actually import
        const importResult = await ingestionService.importRawData(
          filteredChurches.slice(0, remainingLimit),
          {
            skipDuplicates: true,
            queueEnrichment: !options.skipEnrichment,
          }
        );

        totalImported += importResult.imported;
        totalSkipped += importResult.skipped;
        totalErrors += importResult.errors;

        console.log(
          `found ${validChurches.length}, imported ${importResult.imported}, skipped ${importResult.skipped}`
        );

        if (options.verbose && importResult.errorDetails.length > 0) {
          for (const err of importResult.errorDetails) {
            console.log(`      ❌ ${err.name}: ${err.error}`);
          }
        }
      }

      // Rate limit delay
      await sleep(1000);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : '';
      console.log(`error: ${errorMsg}`);
      if (options.verbose && errorStack) {
        console.log(`      Stack: ${errorStack.split('\n').slice(1, 3).join('\n      ')}`);
      }
      totalErrors++;
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 Summary\n');
  console.log(`   Churches fetched:    ${totalFetched}`);
  console.log(`   Churches filtered:   ${totalFiltered} (excluded denominations)`);
  console.log(`   Churches imported:   ${totalImported}`);
  if (!options.dryRun) {
    console.log(`   Churches skipped:    ${totalSkipped} (duplicates)`);
    console.log(`   Errors:              ${totalErrors}`);
  }
  console.log('');

  if (options.dryRun) {
    console.log('🔍 Dry run - no data was imported\n');

    if (options.verbose && allChurches.length > 0) {
      console.log('Sample churches that would be imported:\n');
      for (const church of allChurches.slice(0, 10)) {
        console.log(`   • ${church.name}`);
        console.log(`     ${church.address}, ${church.city}, ${church.stateAbbr}`);
        if (church.denomination) console.log(`     Denomination: ${church.denomination}`);
        if (church.website) console.log(`     Website: ${church.website}`);
        console.log('');
      }
    }
  } else {
    console.log(`✅ Done! ${totalImported} churches imported to database\n`);

    if (!options.skipEnrichment) {
      console.log('💡 Next step: Run AI enrichment with:');
      console.log('   curl -X POST http://localhost:3000/api/admin/enrich \\');
      console.log(`        -H "Authorization: Bearer $ADMIN_API_KEY" \\`);
      console.log('        -d \'{"batchSize": 10}\'\n');
    }
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Run
main().catch((error) => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});
