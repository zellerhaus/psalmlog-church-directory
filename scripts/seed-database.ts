/**
 * Database Seed Script
 *
 * This script populates the Supabase database with sample church data for development.
 * Run with: npx ts-node --compiler-options '{"module":"commonjs"}' scripts/seed-database.ts
 *
 * Prerequisites:
 * 1. Create a Supabase project
 * 2. Run the SQL schema from the PRD
 * 3. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_KEY in .env.local
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Sample data for seeding
const sampleStates = [
  { slug: 'texas', name: 'Texas', abbr: 'TX', church_count: 0, city_count: 0 },
  { slug: 'california', name: 'California', abbr: 'CA', church_count: 0, city_count: 0 },
  { slug: 'florida', name: 'Florida', abbr: 'FL', church_count: 0, city_count: 0 },
  { slug: 'arizona', name: 'Arizona', abbr: 'AZ', church_count: 0, city_count: 0 },
  { slug: 'georgia', name: 'Georgia', abbr: 'GA', church_count: 0, city_count: 0 },
];

const sampleCities = [
  { slug: 'houston', name: 'Houston', state: 'Texas', state_abbr: 'TX', lat: 29.7604, lng: -95.3698, church_count: 0 },
  { slug: 'dallas', name: 'Dallas', state: 'Texas', state_abbr: 'TX', lat: 32.7767, lng: -96.7970, church_count: 0 },
  { slug: 'austin', name: 'Austin', state: 'Texas', state_abbr: 'TX', lat: 30.2672, lng: -97.7431, church_count: 0 },
  { slug: 'los-angeles', name: 'Los Angeles', state: 'California', state_abbr: 'CA', lat: 34.0522, lng: -118.2437, church_count: 0 },
  { slug: 'san-diego', name: 'San Diego', state: 'California', state_abbr: 'CA', lat: 32.7157, lng: -117.1611, church_count: 0 },
  { slug: 'phoenix', name: 'Phoenix', state: 'Arizona', state_abbr: 'AZ', lat: 33.4484, lng: -112.0740, church_count: 0 },
  { slug: 'scottsdale', name: 'Scottsdale', state: 'Arizona', state_abbr: 'AZ', lat: 33.4942, lng: -111.9261, church_count: 0 },
  { slug: 'miami', name: 'Miami', state: 'Florida', state_abbr: 'FL', lat: 25.7617, lng: -80.1918, church_count: 0 },
  { slug: 'atlanta', name: 'Atlanta', state: 'Georgia', state_abbr: 'GA', lat: 33.7490, lng: -84.3880, church_count: 0 },
];

const sampleChurches = [
  // Houston churches
  {
    slug: 'lakewood-church',
    name: 'Lakewood Church',
    address: '3700 Southwest Freeway',
    city: 'Houston',
    state: 'Texas',
    state_abbr: 'TX',
    zip: '77027',
    lat: 29.7264,
    lng: -95.4541,
    phone: '(713) 635-4154',
    website: 'https://www.lakewoodchurch.com',
    denomination: 'Non-denominational',
    worship_style: ['Contemporary'],
    service_times: [
      { day: 'Sunday', time: '8:30 AM' },
      { day: 'Sunday', time: '11:00 AM' },
    ],
    has_kids_ministry: true,
    has_youth_group: true,
    has_small_groups: true,
    ai_description: 'Lakewood Church is one of the largest non-denominational churches in the United States, located in Houston, Texas. Led by Pastor Joel Osteen, the church is known for its contemporary worship and messages of hope and encouragement.',
    ai_what_to_expect: 'Dress code: Casual to smart casual attire is typical at Lakewood Church. You\'ll see everything from jeans to dresses.\n\nService format: Services feature contemporary worship with a full band and choir, followed by a message from Pastor Joel Osteen or a guest speaker. Services typically last about 90 minutes.\n\nTips for visitors: Arrive early as parking can be competitive. The church has a large welcome center where you can get information about ministries and groups.',
    source: 'seed',
    source_id: 'seed-1',
  },
  {
    slug: 'second-baptist-church-houston',
    name: 'Second Baptist Church',
    address: '6400 Woodway Drive',
    city: 'Houston',
    state: 'Texas',
    state_abbr: 'TX',
    zip: '77057',
    lat: 29.7604,
    lng: -95.4890,
    phone: '(713) 465-3408',
    website: 'https://www.second.org',
    denomination: 'Southern Baptist',
    worship_style: ['Blended', 'Traditional'],
    service_times: [
      { day: 'Sunday', time: '9:30 AM' },
      { day: 'Sunday', time: '11:00 AM' },
    ],
    has_kids_ministry: true,
    has_youth_group: true,
    has_small_groups: true,
    ai_description: 'Second Baptist Church is a large Southern Baptist congregation in Houston, known for its Bible-centered teaching and extensive ministry programs. The church has multiple campuses across the Houston area.',
    ai_what_to_expect: 'Dress code: Business casual to dressy casual is common. Many attendees dress nicely but you\'ll be welcomed regardless of attire.\n\nService format: Services include a blend of traditional and contemporary worship music, followed by expository preaching. The service typically lasts about 75 minutes.\n\nTips for visitors: Greeters are available at all entrances. The church offers an excellent kids ministry program during all services.',
    source: 'seed',
    source_id: 'seed-2',
  },
  // Scottsdale churches
  {
    slug: 'grace-community-church-scottsdale',
    name: 'Grace Community Church',
    address: '7240 E Camelback Road',
    city: 'Scottsdale',
    state: 'Arizona',
    state_abbr: 'AZ',
    zip: '85251',
    lat: 33.5092,
    lng: -111.9300,
    phone: '(480) 947-5678',
    website: 'https://www.gracescottsdale.com',
    denomination: 'Non-denominational',
    worship_style: ['Contemporary'],
    service_times: [
      { day: 'Sunday', time: '9:00 AM' },
      { day: 'Sunday', time: '10:45 AM' },
    ],
    has_kids_ministry: true,
    has_youth_group: true,
    has_small_groups: true,
    ai_description: 'Grace Community Church is a welcoming non-denominational church in Scottsdale, Arizona. The church focuses on biblical teaching and building authentic community through small groups and ministry programs.',
    ai_what_to_expect: 'Dress code: Casual attire is the norm. Arizona casual means shorts and sandals are perfectly acceptable.\n\nService format: Contemporary worship with a full band leads into practical, Bible-based teaching. Services run about 70 minutes.\n\nTips for visitors: Check in kids at the welcome center upon arrival. Coffee and refreshments are available before and after services.',
    source: 'seed',
    source_id: 'seed-3',
  },
  {
    slug: 'scottsdale-bible-church',
    name: 'Scottsdale Bible Church',
    address: '7601 E Shea Boulevard',
    city: 'Scottsdale',
    state: 'Arizona',
    state_abbr: 'AZ',
    zip: '85260',
    lat: 33.5812,
    lng: -111.9250,
    phone: '(480) 824-7200',
    website: 'https://www.scottsdalebible.com',
    denomination: 'Non-denominational',
    worship_style: ['Contemporary', 'Blended'],
    service_times: [
      { day: 'Saturday', time: '5:00 PM' },
      { day: 'Sunday', time: '9:00 AM' },
      { day: 'Sunday', time: '11:00 AM' },
    ],
    has_kids_ministry: true,
    has_youth_group: true,
    has_small_groups: true,
    ai_description: 'Scottsdale Bible Church is a vibrant, multi-generational church committed to teaching the Bible and making disciples. The church offers multiple service times and extensive programs for all ages.',
    ai_what_to_expect: 'Dress code: Casual to smart casual is typical. Come comfortable and ready to worship.\n\nService format: Services feature contemporary worship with excellent production quality, followed by verse-by-verse Bible teaching. Expect about 75 minutes.\n\nTips for visitors: The church has a dedicated welcome area for first-time guests. Consider arriving 15 minutes early to get oriented.',
    source: 'seed',
    source_id: 'seed-4',
  },
  // Atlanta churches
  {
    slug: 'north-point-community-church',
    name: 'North Point Community Church',
    address: '4350 North Point Parkway',
    city: 'Atlanta',
    state: 'Georgia',
    state_abbr: 'GA',
    zip: '30022',
    lat: 34.0456,
    lng: -84.2715,
    phone: '(678) 892-5000',
    website: 'https://www.northpoint.org',
    denomination: 'Non-denominational',
    worship_style: ['Contemporary'],
    service_times: [
      { day: 'Sunday', time: '9:00 AM' },
      { day: 'Sunday', time: '11:00 AM' },
      { day: 'Sunday', time: '5:00 PM' },
    ],
    has_kids_ministry: true,
    has_youth_group: true,
    has_small_groups: true,
    ai_description: 'North Point Community Church, led by Andy Stanley, is one of the largest churches in America. Known for its excellent teaching and strategic approach to ministry, the church focuses on helping people take their next step in faith.',
    ai_what_to_expect: 'Dress code: Very casual. Jeans and t-shirts are the norm here.\n\nService format: High-energy contemporary worship followed by practical, engaging teaching from Andy Stanley or other communicators. Services last about 75 minutes.\n\nTips for visitors: Use the North Point app to check in kids ahead of time. Guest services teams are stationed throughout the campus to help.',
    source: 'seed',
    source_id: 'seed-5',
  },
];

async function seedDatabase() {
  console.log('Starting database seed...');

  try {
    // Insert states
    console.log('Inserting states...');
    const { error: statesError } = await supabase
      .from('states')
      .upsert(sampleStates, { onConflict: 'slug' });

    if (statesError) {
      console.error('Error inserting states:', statesError);
      return;
    }
    console.log(`Inserted ${sampleStates.length} states`);

    // Insert cities
    console.log('Inserting cities...');
    const { error: citiesError } = await supabase
      .from('cities')
      .upsert(sampleCities, { onConflict: 'slug' });

    if (citiesError) {
      console.error('Error inserting cities:', citiesError);
      return;
    }
    console.log(`Inserted ${sampleCities.length} cities`);

    // Insert churches
    console.log('Inserting churches...');
    const { error: churchesError } = await supabase
      .from('churches')
      .upsert(sampleChurches, { onConflict: 'slug' });

    if (churchesError) {
      console.error('Error inserting churches:', churchesError);
      return;
    }
    console.log(`Inserted ${sampleChurches.length} churches`);

    // Update counts
    console.log('Updating counts...');

    // Update city church counts
    for (const city of sampleCities) {
      const { count } = await supabase
        .from('churches')
        .select('*', { count: 'exact', head: true })
        .eq('city', city.name)
        .eq('state_abbr', city.state_abbr);

      await supabase
        .from('cities')
        .update({ church_count: count || 0 })
        .eq('slug', city.slug);
    }

    // Update state counts
    for (const state of sampleStates) {
      const { count: churchCount } = await supabase
        .from('churches')
        .select('*', { count: 'exact', head: true })
        .eq('state_abbr', state.abbr);

      const { count: cityCount } = await supabase
        .from('cities')
        .select('*', { count: 'exact', head: true })
        .eq('state_abbr', state.abbr);

      await supabase
        .from('states')
        .update({
          church_count: churchCount || 0,
          city_count: cityCount || 0,
        })
        .eq('slug', state.slug);
    }

    console.log('Database seeded successfully!');
  } catch (error) {
    console.error('Seed error:', error);
  }
}

seedDatabase();
