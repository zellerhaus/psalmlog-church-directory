#!/usr/bin/env npx tsx

/**
 * Seed All States Script
 *
 * Runs seed-churches-v2.ts for every US state, starting from states with lowest church counts.
 * Automatically restarts if a state fails.
 *
 * Usage:
 *   npx tsx scripts/seed-all-states.ts
 *   npx tsx scripts/seed-all-states.ts --skip-to "California"
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { spawn } from 'child_process';

config({ path: resolve(process.cwd(), '.env.local') });

// All 50 US states ordered by typical church coverage (least to most based on population)
const ALL_STATES_BY_PRIORITY = [
  // Tier 1: Smallest states (likely least coverage)
  'Wyoming', 'Vermont', 'Alaska', 'North Dakota', 'South Dakota',
  'Delaware', 'Montana', 'Rhode Island', 'Maine', 'New Hampshire',
  'Hawaii', 'West Virginia', 'Idaho', 'Nebraska', 'New Mexico',
  'Nevada', 'Kansas', 'Utah', 'Arkansas', 'Mississippi',

  // Tier 2: Medium-small states
  'Iowa', 'Connecticut', 'Oklahoma', 'Oregon', 'Kentucky',
  'Louisiana', 'South Carolina', 'Alabama', 'Colorado', 'Minnesota',
  'Wisconsin', 'Maryland', 'Missouri', 'Tennessee', 'Arizona',
  'Indiana', 'Massachusetts', 'Washington', 'Virginia',

  // Tier 3: Large states (likely have more coverage already)
  'New Jersey', 'Michigan', 'North Carolina', 'Georgia', 'Ohio',
  'Pennsylvania', 'Illinois', 'New York', 'Florida', 'California', 'Texas',
];

// States that need city lists added to seed-churches-v2.ts
const STATES_WITH_EXPANDED_CITIES = [
  'California', 'Texas', 'Florida', 'New York', 'Pennsylvania',
  'Illinois', 'Ohio', 'Georgia', 'North Carolina', 'Michigan', 'New Jersey',
];

// Default city lists for states not in the expanded list
const DEFAULT_STATE_CITIES: Record<string, string[]> = {
  'Wyoming': ['Cheyenne', 'Casper', 'Laramie', 'Gillette', 'Rock Springs', 'Sheridan', 'Green River', 'Evanston', 'Riverton', 'Cody', 'Jackson', 'Rawlins', 'Lander', 'Torrington', 'Powell', 'Douglas', 'Worland', 'Buffalo', 'Wheatland', 'Newcastle'],
  'Vermont': ['Burlington', 'South Burlington', 'Rutland', 'Barre', 'Montpelier', 'Winooski', 'St. Albans', 'Newport', 'Vergennes', 'Middlebury', 'Bennington', 'Brattleboro', 'Essex Junction', 'Milton', 'Hartford', 'Williston', 'Colchester', 'Springfield', 'Morristown', 'St. Johnsbury'],
  'Alaska': ['Anchorage', 'Fairbanks', 'Juneau', 'Sitka', 'Ketchikan', 'Wasilla', 'Kenai', 'Kodiak', 'Bethel', 'Palmer', 'Homer', 'Soldotna', 'Valdez', 'Nome', 'Barrow', 'Kotzebue', 'Seward', 'Cordova', 'Dillingham', 'Wrangell'],
  'North Dakota': ['Fargo', 'Bismarck', 'Grand Forks', 'Minot', 'West Fargo', 'Williston', 'Dickinson', 'Mandan', 'Jamestown', 'Wahpeton', 'Devils Lake', 'Valley City', 'Grafton', 'Beulah', 'Rugby', 'Bottineau', 'Carrington', 'Oakes', 'Lisbon', 'Mayville'],
  'South Dakota': ['Sioux Falls', 'Rapid City', 'Aberdeen', 'Brookings', 'Watertown', 'Mitchell', 'Yankton', 'Pierre', 'Huron', 'Vermillion', 'Spearfish', 'Brandon', 'Box Elder', 'Madison', 'Sturgis', 'Belle Fourche', 'Harrisburg', 'Tea', 'Dell Rapids', 'Mobridge'],
  'Delaware': ['Wilmington', 'Dover', 'Newark', 'Middletown', 'Smyrna', 'Milford', 'Seaford', 'Georgetown', 'Elsmere', 'New Castle', 'Millsboro', 'Laurel', 'Harrington', 'Camden', 'Clayton', 'Lewes', 'Milton', 'Bridgeville', 'Selbyville', 'Rehoboth Beach'],
  'Montana': ['Billings', 'Missoula', 'Great Falls', 'Bozeman', 'Butte', 'Helena', 'Kalispell', 'Havre', 'Anaconda', 'Miles City', 'Belgrade', 'Livingston', 'Laurel', 'Whitefish', 'Lewistown', 'Sidney', 'Glendive', 'Columbia Falls', 'Polson', 'Dillon'],
  'Rhode Island': ['Providence', 'Warwick', 'Cranston', 'Pawtucket', 'East Providence', 'Woonsocket', 'Newport', 'Central Falls', 'Westerly', 'North Providence', 'West Warwick', 'Coventry', 'Cumberland', 'North Kingstown', 'South Kingstown', 'Bristol', 'Barrington', 'Middletown', 'Portsmouth', 'Narragansett'],
  'Maine': ['Portland', 'Lewiston', 'Bangor', 'South Portland', 'Auburn', 'Biddeford', 'Sanford', 'Brunswick', 'Saco', 'Westbrook', 'Augusta', 'Waterville', 'Presque Isle', 'Caribou', 'Bath', 'Ellsworth', 'Rockland', 'Belfast', 'Calais', 'Gardiner'],
  'New Hampshire': ['Manchester', 'Nashua', 'Concord', 'Derry', 'Dover', 'Rochester', 'Salem', 'Merrimack', 'Hudson', 'Londonderry', 'Keene', 'Bedford', 'Portsmouth', 'Goffstown', 'Laconia', 'Hampton', 'Milford', 'Durham', 'Exeter', 'Windham'],
  'Hawaii': ['Honolulu', 'Pearl City', 'Hilo', 'Kailua', 'Waipahu', 'Kaneohe', 'Mililani Town', 'Kahului', 'Ewa Gentry', 'Mililani Mauka', 'Kihei', 'Makakilo', 'Wahiawa', 'Schofield Barracks', 'Wailuku', 'Kapolei', 'Ewa Beach', 'Royal Kunia', 'Halawa', 'Waimalu'],
  'West Virginia': ['Charleston', 'Huntington', 'Morgantown', 'Parkersburg', 'Wheeling', 'Weirton', 'Fairmont', 'Martinsburg', 'Beckley', 'Clarksburg', 'South Charleston', 'St. Albans', 'Vienna', 'Bluefield', 'Moundsville', 'Bridgeport', 'Oak Hill', 'Dunbar', 'Elkins', 'Nitro'],
  'Idaho': ['Boise', 'Meridian', 'Nampa', 'Idaho Falls', 'Caldwell', 'Pocatello', 'Coeur d\'Alene', 'Twin Falls', 'Lewiston', 'Post Falls', 'Rexburg', 'Moscow', 'Eagle', 'Kuna', 'Ammon', 'Chubbuck', 'Mountain Home', 'Jerome', 'Blackfoot', 'Garden City'],
  'Nebraska': ['Omaha', 'Lincoln', 'Bellevue', 'Grand Island', 'Kearney', 'Fremont', 'Hastings', 'Norfolk', 'North Platte', 'Columbus', 'Papillion', 'La Vista', 'Scottsbluff', 'South Sioux City', 'Beatrice', 'Lexington', 'Alliance', 'Gering', 'Blair', 'York'],
  'New Mexico': ['Albuquerque', 'Las Cruces', 'Rio Rancho', 'Santa Fe', 'Roswell', 'Farmington', 'Clovis', 'Hobbs', 'Alamogordo', 'Carlsbad', 'Gallup', 'Deming', 'Los Lunas', 'Chaparral', 'Sunland Park', 'Las Vegas', 'Portales', 'Artesia', 'Lovington', 'Silver City'],
  'Nevada': ['Las Vegas', 'Henderson', 'Reno', 'North Las Vegas', 'Sparks', 'Carson City', 'Fernley', 'Elko', 'Mesquite', 'Boulder City', 'Fallon', 'Winnemucca', 'West Wendover', 'Ely', 'Yerington', 'Carlin', 'Lovelock', 'Wells', 'Caliente', 'Tonopah'],
  'Kansas': ['Wichita', 'Overland Park', 'Kansas City', 'Olathe', 'Topeka', 'Lawrence', 'Shawnee', 'Manhattan', 'Lenexa', 'Salina', 'Hutchinson', 'Leavenworth', 'Leawood', 'Dodge City', 'Garden City', 'Emporia', 'Derby', 'Prairie Village', 'Junction City', 'Hays'],
  'Utah': ['Salt Lake City', 'West Valley City', 'Provo', 'West Jordan', 'Orem', 'Sandy', 'St. George', 'Ogden', 'Layton', 'South Jordan', 'Lehi', 'Millcreek', 'Taylorsville', 'Logan', 'Murray', 'Draper', 'Bountiful', 'Riverton', 'Herriman', 'Spanish Fork'],
  'Arkansas': ['Little Rock', 'Fort Smith', 'Fayetteville', 'Springdale', 'Jonesboro', 'North Little Rock', 'Conway', 'Rogers', 'Pine Bluff', 'Bentonville', 'Hot Springs', 'Benton', 'Texarkana', 'Sherwood', 'Jacksonville', 'Russellville', 'Bella Vista', 'West Memphis', 'Paragould', 'Cabot'],
  'Mississippi': ['Jackson', 'Gulfport', 'Southaven', 'Hattiesburg', 'Biloxi', 'Meridian', 'Tupelo', 'Olive Branch', 'Greenville', 'Horn Lake', 'Clinton', 'Pearl', 'Madison', 'Starkville', 'Ridgeland', 'Columbus', 'Vicksburg', 'Pascagoula', 'Brandon', 'Oxford'],
  'Iowa': ['Des Moines', 'Cedar Rapids', 'Davenport', 'Sioux City', 'Iowa City', 'Waterloo', 'Ames', 'West Des Moines', 'Council Bluffs', 'Ankeny', 'Dubuque', 'Urbandale', 'Cedar Falls', 'Marion', 'Bettendorf', 'Marshalltown', 'Mason City', 'Clinton', 'Burlington', 'Fort Dodge'],
  'Connecticut': ['Bridgeport', 'New Haven', 'Hartford', 'Stamford', 'Waterbury', 'Norwalk', 'Danbury', 'New Britain', 'Bristol', 'Meriden', 'West Haven', 'Milford', 'Middletown', 'Norwich', 'Shelton', 'Torrington', 'New London', 'Ansonia', 'Derby', 'Groton'],
  'Oklahoma': ['Oklahoma City', 'Tulsa', 'Norman', 'Broken Arrow', 'Edmond', 'Lawton', 'Moore', 'Midwest City', 'Enid', 'Stillwater', 'Muskogee', 'Bartlesville', 'Owasso', 'Shawnee', 'Ponca City', 'Ardmore', 'Duncan', 'Del City', 'Bixby', 'Yukon'],
  'Oregon': ['Portland', 'Salem', 'Eugene', 'Gresham', 'Hillsboro', 'Beaverton', 'Bend', 'Medford', 'Springfield', 'Corvallis', 'Albany', 'Tigard', 'Lake Oswego', 'Keizer', 'Grants Pass', 'Oregon City', 'McMinnville', 'Redmond', 'Tualatin', 'West Linn'],
  'Kentucky': ['Louisville', 'Lexington', 'Bowling Green', 'Owensboro', 'Covington', 'Richmond', 'Georgetown', 'Florence', 'Hopkinsville', 'Nicholasville', 'Elizabethtown', 'Henderson', 'Frankfort', 'Independence', 'Jeffersontown', 'Paducah', 'Radcliff', 'Ashland', 'Madisonville', 'Winchester'],
  'Louisiana': ['New Orleans', 'Baton Rouge', 'Shreveport', 'Lafayette', 'Lake Charles', 'Kenner', 'Bossier City', 'Monroe', 'Alexandria', 'Houma', 'Marrero', 'New Iberia', 'Laplace', 'Slidell', 'Central', 'Prairieville', 'Ruston', 'Sulphur', 'Hammond', 'Harvey'],
  'South Carolina': ['Charleston', 'Columbia', 'North Charleston', 'Mount Pleasant', 'Rock Hill', 'Greenville', 'Summerville', 'Sumter', 'Goose Creek', 'Hilton Head Island', 'Florence', 'Spartanburg', 'Myrtle Beach', 'Aiken', 'Anderson', 'Mauldin', 'North Augusta', 'Easley', 'Simpsonville', 'Greer'],
  'Alabama': ['Birmingham', 'Montgomery', 'Huntsville', 'Mobile', 'Tuscaloosa', 'Hoover', 'Dothan', 'Auburn', 'Decatur', 'Madison', 'Florence', 'Gadsden', 'Vestavia Hills', 'Prattville', 'Phenix City', 'Alabaster', 'Bessemer', 'Enterprise', 'Opelika', 'Homewood'],
  'Colorado': ['Denver', 'Colorado Springs', 'Aurora', 'Fort Collins', 'Lakewood', 'Thornton', 'Arvada', 'Westminster', 'Pueblo', 'Centennial', 'Boulder', 'Greeley', 'Longmont', 'Loveland', 'Grand Junction', 'Broomfield', 'Castle Rock', 'Commerce City', 'Parker', 'Littleton'],
  'Minnesota': ['Minneapolis', 'St. Paul', 'Rochester', 'Duluth', 'Bloomington', 'Brooklyn Park', 'Plymouth', 'St. Cloud', 'Woodbury', 'Eagan', 'Maple Grove', 'Eden Prairie', 'Coon Rapids', 'Burnsville', 'Blaine', 'Lakeville', 'Minnetonka', 'Apple Valley', 'Edina', 'St. Louis Park'],
  'Wisconsin': ['Milwaukee', 'Madison', 'Green Bay', 'Kenosha', 'Racine', 'Appleton', 'Waukesha', 'Eau Claire', 'Oshkosh', 'Janesville', 'West Allis', 'La Crosse', 'Sheboygan', 'Wauwatosa', 'Fond du Lac', 'New Berlin', 'Wausau', 'Brookfield', 'Greenfield', 'Beloit'],
  'Maryland': ['Baltimore', 'Frederick', 'Rockville', 'Gaithersburg', 'Bowie', 'Hagerstown', 'Annapolis', 'College Park', 'Salisbury', 'Laurel', 'Greenbelt', 'Cumberland', 'Westminster', 'Hyattsville', 'Takoma Park', 'Easton', 'Elkton', 'Glen Burnie', 'Bethesda', 'Silver Spring'],
  'Missouri': ['Kansas City', 'St. Louis', 'Springfield', 'Columbia', 'Independence', 'Lee\'s Summit', 'O\'Fallon', 'St. Joseph', 'St. Charles', 'St. Peters', 'Blue Springs', 'Florissant', 'Joplin', 'Chesterfield', 'Jefferson City', 'Cape Girardeau', 'Wildwood', 'University City', 'Ballwin', 'Raytown'],
  'Tennessee': ['Nashville', 'Memphis', 'Knoxville', 'Chattanooga', 'Clarksville', 'Murfreesboro', 'Franklin', 'Jackson', 'Johnson City', 'Bartlett', 'Hendersonville', 'Kingsport', 'Collierville', 'Cleveland', 'Smyrna', 'Germantown', 'Brentwood', 'Columbia', 'Spring Hill', 'La Vergne'],
  'Arizona': ['Phoenix', 'Tucson', 'Mesa', 'Chandler', 'Gilbert', 'Glendale', 'Scottsdale', 'Peoria', 'Tempe', 'Surprise', 'Yuma', 'Avondale', 'Goodyear', 'Flagstaff', 'Buckeye', 'Lake Havasu City', 'Casa Grande', 'Sierra Vista', 'Maricopa', 'Oro Valley'],
  'Indiana': ['Indianapolis', 'Fort Wayne', 'Evansville', 'South Bend', 'Carmel', 'Fishers', 'Bloomington', 'Hammond', 'Gary', 'Lafayette', 'Muncie', 'Terre Haute', 'Noblesville', 'Kokomo', 'Anderson', 'Greenwood', 'Elkhart', 'Mishawaka', 'Lawrence', 'Jeffersonville'],
  'Massachusetts': ['Boston', 'Worcester', 'Springfield', 'Cambridge', 'Lowell', 'Brockton', 'New Bedford', 'Quincy', 'Lynn', 'Fall River', 'Newton', 'Lawrence', 'Somerville', 'Framingham', 'Haverhill', 'Waltham', 'Malden', 'Brookline', 'Plymouth', 'Medford'],
  'Washington': ['Seattle', 'Spokane', 'Tacoma', 'Vancouver', 'Bellevue', 'Kent', 'Everett', 'Renton', 'Federal Way', 'Spokane Valley', 'Kirkland', 'Bellingham', 'Auburn', 'Kennewick', 'Pasco', 'Marysville', 'Redmond', 'Sammamish', 'Lakewood', 'Richland'],
  'Virginia': ['Virginia Beach', 'Norfolk', 'Chesapeake', 'Richmond', 'Newport News', 'Alexandria', 'Hampton', 'Roanoke', 'Portsmouth', 'Suffolk', 'Lynchburg', 'Harrisonburg', 'Leesburg', 'Charlottesville', 'Danville', 'Manassas', 'Blacksburg', 'Fredericksburg', 'Winchester', 'Salem'],
};

async function runSeedScript(state: string, cities?: string[]): Promise<boolean> {
  return new Promise((resolve) => {
    const args = ['tsx', 'scripts/seed-churches-v2.ts', '--state', state, '--verbose'];

    if (cities) {
      args.push('--cities', cities.join(','));
    }

    console.log(`\n${'='.repeat(70)}`);
    console.log(`🏛️  Seeding: ${state}`);
    console.log(`${'='.repeat(70)}\n`);

    const child = spawn('npx', args, {
      cwd: process.cwd(),
      stdio: 'inherit',
      env: process.env,
    });

    child.on('close', (code) => {
      if (code === 0) {
        console.log(`\n✅ ${state} completed successfully\n`);
        resolve(true);
      } else {
        console.log(`\n❌ ${state} failed with code ${code}\n`);
        resolve(false);
      }
    });

    child.on('error', (err) => {
      console.error(`\n❌ Error running seed for ${state}:`, err.message);
      resolve(false);
    });
  });
}

async function main() {
  const args = process.argv.slice(2);
  const skipToIdx = args.indexOf('--skip-to');
  const skipToState = skipToIdx !== -1 ? args[skipToIdx + 1] : null;

  console.log('\n🌎 Church Directory - Seed All States\n');
  console.log(`   Total states to process: ${ALL_STATES_BY_PRIORITY.length}`);
  if (skipToState) {
    console.log(`   Skipping to: ${skipToState}`);
  }
  console.log('');

  let startIdx = 0;
  if (skipToState) {
    startIdx = ALL_STATES_BY_PRIORITY.findIndex(
      s => s.toLowerCase() === skipToState.toLowerCase()
    );
    if (startIdx === -1) {
      console.error(`State not found: ${skipToState}`);
      process.exit(1);
    }
  }

  const results: { state: string; success: boolean }[] = [];

  for (let i = startIdx; i < ALL_STATES_BY_PRIORITY.length; i++) {
    const state = ALL_STATES_BY_PRIORITY[i];
    const cities = STATES_WITH_EXPANDED_CITIES.includes(state)
      ? undefined  // Use built-in expanded list
      : DEFAULT_STATE_CITIES[state];

    const success = await runSeedScript(state, cities);
    results.push({ state, success });

    // Small delay between states to avoid rate limiting
    await new Promise(r => setTimeout(r, 2000));
  }

  // Summary
  console.log('\n' + '='.repeat(70));
  console.log('📊 FINAL SUMMARY\n');

  const succeeded = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);

  console.log(`   Succeeded: ${succeeded.length}`);
  console.log(`   Failed:    ${failed.length}`);

  if (failed.length > 0) {
    console.log('\n   Failed states:');
    for (const { state } of failed) {
      console.log(`      - ${state}`);
    }
  }

  console.log('\n✅ All states processed!\n');
}

main().catch(err => {
  console.error('\n❌ Fatal error:', err);
  process.exit(1);
});
