#!/usr/bin/env npx ts-node

/**
 * Import churches from churchesusa.csv
 *
 * Usage:
 *   npx ts-node scripts/import-churchesusa.ts [options]
 *
 * Options:
 *   --dry-run     Preview without inserting
 *   --limit N     Process only first N records
 *   --state XX    Only process churches in state XX (e.g., TX, CA)
 *   --skip N      Skip first N records (for resuming)
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import { parse } from 'csv-parse';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

// ESM compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================================================
// CONFIGURATION
// ============================================================================

const CSV_PATH = path.join(__dirname, '../Reference Images/churchesusa.csv');
const BATCH_SIZE = 500;
const BATCH_DELAY_MS = 500;

// Categories to EXCLUDE
const EXCLUDED_CATEGORIES = [
  'Church of Jesus Christ of Latter-day Saints',
  'Church Supplies & Services',
  'Scientology Churches',
  'Mosques',
  'Unity Churches',        // New Thought, not traditional Christian
  'Eckankar Churches',     // Not Christian
  'Metaphysical Churches',
  'Metaphysical Christian Churches',
  'Religious Science Churches',
  'Spiritualist Churches',
  'Unitarian Universalist Churches',
];

// School indicators in AKA column
const SCHOOL_INDICATORS = [
  /\bschool\b/i,
  /\bacademy\b/i,
  /\belementary\b/i,
  /\bpreschool\b/i,
  /\bdaycare\b/i,
  /\bchild care\b/i,
  /\bchildcare\b/i,
  /\blearning center\b/i,
  /\bearly learning\b/i,
  /\bkindergarten\b/i,
];

// ============================================================================
// DENOMINATION NORMALIZATION
// ============================================================================

// Map CSV categories to normalized denomination names
const DENOMINATION_MAP: Record<string, string | null> = {
  // Baptist
  'Baptist Churches': 'Baptist',
  'General Baptist Churches': 'Baptist',
  'Baptist Full Gospel Churches': 'Baptist',
  'Southern Baptist Churches': 'Southern Baptist',
  'Southern Baptist Convention Churches': 'Southern Baptist',
  'American Baptist Churches': 'American Baptist',
  'American Baptist Association Churches': 'American Baptist',
  'Missionary American Baptist Association Churches': 'American Baptist',
  'National Baptist Churches': 'National Baptist',
  'National Baptist Convention Churches': 'National Baptist',
  'Free Will Baptist Churches': 'Free Will Baptist',
  'Primitive Baptist Churches': 'Primitive Baptist',
  'Missionary Baptist Churches': 'Missionary Baptist',
  'Independent Baptist Churches': 'Baptist',
  'Fundamental Baptist Churches': 'Baptist',
  'Independent Fundamental Baptist Churches': 'Baptist',
  'General Association of Regular Baptist Churches': 'Baptist',
  'Regular Baptist Churches': 'Baptist',
  'Baptist Bible Fellowship Churches': 'Baptist',
  'Reformed Baptist Churches': 'Reformed Baptist',
  'Sovereign Grace Baptist Churches': 'Sovereign Grace Baptist',
  'North American Baptist Churches': 'Baptist',
  'Cooperative Baptist Fellowship Churches': 'Cooperative Baptist',
  'Conservative Baptist Association Churches': 'Baptist',

  // Methodist
  'Methodist Churches': 'Methodist',
  'United Methodist Churches': 'United Methodist',
  'Free Methodist Churches': 'Free Methodist',
  'African Methodist Episcopal Churches': 'AME',
  'African Methodist Episcopal Zion Churches': 'AME Zion',
  'Christian Methodist Episcopal Churches': 'CME',
  'Evangelical Methodist Churches': 'Evangelical Methodist',
  'Wesleyan Churches': 'Wesleyan',

  // Lutheran
  'Lutheran Churches': 'Lutheran',
  'Lutheran Church Missouri Synod': 'LCMS',
  'Evangelical Lutheran Church in America': 'ELCA',
  'Evangelical Lutheran Church in America (ELCA)': 'ELCA',
  'Lutheran Evangelical Synod Churches': 'Lutheran',
  'Wisconsin Lutheran Synod Churches': 'WELS',
  'Church of the Lutheran Confession': 'CLC',

  // Presbyterian
  'Presbyterian Churches': 'Presbyterian',
  'Presbyterian Church (USA)': 'PCUSA',
  'Presbyterian Church (PCA)': 'PCA',
  'Presbyterian Church in America': 'PCA',
  'Orthodox Presbyterian Churches': 'OPC',
  'Evangelical Presbyterian Churches': 'EPC',
  'Associate Reformed Presbyterian Churches': 'ARP',
  'Reformed Presbyterian Churches': 'Reformed Presbyterian',
  'Bible Presbyterian Churches': 'Bible Presbyterian',

  // Catholic
  'Catholic Churches': 'Catholic',
  'Roman Catholic Churches': 'Catholic',
  'Traditional Catholic Churches': 'Catholic',
  'Old Catholic Churches': 'Old Catholic',
  'Byzantine Catholic Churches': 'Byzantine Catholic',
  'Ukrainian Catholic Churches': 'Ukrainian Catholic',
  'Evangelical Catholic Churches': 'Evangelical Catholic',
  'Catholic Church of God': 'Catholic',
  'Anglican Catholic Churches': 'Anglo-Catholic',

  // Orthodox
  'Orthodox Churches': 'Orthodox',
  'Eastern Orthodox Churches': 'Orthodox',
  'Greek Orthodox Churches': 'Greek Orthodox',
  'Christian Orthodox Churches': 'Orthodox',

  // Episcopal/Anglican
  'Episcopal Churches': 'Episcopal',
  'Anglican Churches': 'Anglican',
  'Anglican Episcopal Churches': 'Episcopal',

  // Pentecostal
  'Pentecostal Churches': 'Pentecostal',
  'Apostolic Pentecostal Churches': 'Apostolic Pentecostal',
  'United Pentecostal Churches': 'United Pentecostal',
  'Independent Pentecostal Churches': 'Pentecostal',
  'Holiness Pentecostal Churches': 'Pentecostal Holiness',
  'International Pentecostal Holiness Churches': 'Pentecostal Holiness',
  'Pentecostal Church of God': 'Pentecostal Church of God',

  // Assemblies of God
  'Assemblies of God Churches': 'Assemblies of God',
  'Independent Assemblies of God Churches': 'Assemblies of God',
  'Fellowship of Christian Assemblies Churches': 'Fellowship of Christian Assemblies',

  // Church of God
  'Church of God': 'Church of God',
  'Church of God in Christ': 'COGIC',
  'Church of God of Prophecy': 'Church of God of Prophecy',
  'Cleveland Church of God': 'Church of God (Cleveland)',
  'Anderson Church of God': 'Church of God (Anderson)',
  'Seventh Day Church of God': 'Seventh Day Church of God',

  // Church of Christ
  'Church of Christ': 'Church of Christ',
  'New Testament Church of Christ': 'Church of Christ',
  'International Community of Christ Churches': 'Community of Christ',
  'Community of Christ Churches': 'Community of Christ',

  // Nazarene
  'Church of the Nazarene': 'Nazarene',
  'Nazarene Churches': 'Nazarene',

  // Adventist
  'Seventh-day Adventist Churches': 'Seventh-day Adventist',
  'Advent Christian Churches': 'Advent Christian',
  'Seventh Day Churches': 'Seventh Day',

  // Other Denominations
  'Calvary Chapel Churches': 'Calvary Chapel',
  'Vineyard Churches': 'Vineyard',
  'Vineyard Christian Fellowship Churches': 'Vineyard',
  'Foursquare Gospel Churches': 'Foursquare',
  'Congregational Churches': 'Congregational',
  'United Church of Christ': 'UCC',
  'Disciples of Christ Churches': 'Disciples of Christ',
  'Christian Disciples Churches': 'Disciples of Christ',
  'Brethren Churches': 'Brethren',
  'Mennonite Churches': 'Mennonite',
  'Mennonite Brethren Churches': 'Mennonite Brethren',
  'Moravian Churches': 'Moravian',
  'Friends Churches': 'Quaker',
  'Salvation Army Churches': 'Salvation Army',
  'Reformed Churches': 'Reformed',
  'Reformed Church in America': 'RCA',
  'Reformed Christian Churches': 'Reformed',
  'Reformed Protestant Churches': 'Reformed',
  'Covenant Churches': 'Covenant',
  'Evangelical Covenant Churches': 'Evangelical Covenant',
  'Alliance Churches': 'Christian & Missionary Alliance',
  'Christian & Missionary Alliance Churches': 'Christian & Missionary Alliance',
  'Open Bible Churches': 'Open Bible',
  'Holiness Churches': 'Holiness',
  'Deliverance Churches': 'Deliverance',
  'Word Churches': 'Word of Faith',
  'Word of Faith Churches': 'Word of Faith',
  'Missionary Churches': 'Missionary',
  'Bible Way Worldwide Churches': 'Bible Way',

  // Non-Denominational / Interdenominational
  'Non-Denominational Churches': 'Non-Denominational',
  'Non-Denominational Full Gospel Churches': 'Non-Denominational',
  'Interdenominational Churches': 'Interdenominational',
  'Interdenominational Full Gospel Churches': 'Interdenominational',
  'Independent Churches': 'Independent',
  'Independent Bible Churches': 'Bible',
  'Independent Christian Churches': 'Christian',
  'Independent Fundamental Churches': 'Independent',
  'Community Churches': 'Community Church',
  'Bible Churches': 'Bible',
  'Christian Churches': 'Christian',
  'Evangelical Churches': 'Evangelical',
  'Evangelical Christian Churches': 'Evangelical',
  'Free Evangelical Churches': 'Evangelical Free',
  'Full Gospel Churches': 'Full Gospel',
  'Charismatic Churches': 'Charismatic',
  'Apostolic Churches': 'Apostolic',
  'Campus Ministry Churches': 'Campus Ministry',
  'Various Denomination Churches': null, // Can't determine
  'Churches & Places of Worship': null,  // Generic, infer from name
  'Christian Science Churches': 'Christian Science',
};

// State name lookup
const STATE_NAMES: Record<string, string> = {
  AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas', CA: 'California',
  CO: 'Colorado', CT: 'Connecticut', DE: 'Delaware', FL: 'Florida', GA: 'Georgia',
  HI: 'Hawaii', ID: 'Idaho', IL: 'Illinois', IN: 'Indiana', IA: 'Iowa',
  KS: 'Kansas', KY: 'Kentucky', LA: 'Louisiana', ME: 'Maine', MD: 'Maryland',
  MA: 'Massachusetts', MI: 'Michigan', MN: 'Minnesota', MS: 'Mississippi', MO: 'Missouri',
  MT: 'Montana', NE: 'Nebraska', NV: 'Nevada', NH: 'New Hampshire', NJ: 'New Jersey',
  NM: 'New Mexico', NY: 'New York', NC: 'North Carolina', ND: 'North Dakota', OH: 'Ohio',
  OK: 'Oklahoma', OR: 'Oregon', PA: 'Pennsylvania', RI: 'Rhode Island', SC: 'South Carolina',
  SD: 'South Dakota', TN: 'Tennessee', TX: 'Texas', UT: 'Utah', VT: 'Vermont',
  VA: 'Virginia', WA: 'Washington', WV: 'West Virginia', WI: 'Wisconsin', WY: 'Wyoming',
  DC: 'District of Columbia', PR: 'Puerto Rico', VI: 'Virgin Islands', GU: 'Guam',
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function normalizeAddress(address: string, city: string, state: string): string {
  return `${address}|${city}|${state}`
    .toLowerCase()
    .replace(/[.,#'"\-]/g, '')
    .replace(/\s+/g, ' ')
    .replace(/\b(street|st)\b/g, 'st')
    .replace(/\b(avenue|ave)\b/g, 'ave')
    .replace(/\b(boulevard|blvd)\b/g, 'blvd')
    .replace(/\b(drive|dr)\b/g, 'dr')
    .replace(/\b(road|rd)\b/g, 'rd')
    .replace(/\b(lane|ln)\b/g, 'ln')
    .replace(/\b(court|ct)\b/g, 'ct')
    .replace(/\b(place|pl)\b/g, 'pl')
    .replace(/\b(north|n)\b/g, 'n')
    .replace(/\b(south|s)\b/g, 's')
    .replace(/\b(east|e)\b/g, 'e')
    .replace(/\b(west|w)\b/g, 'w')
    .replace(/\b(suite|ste)\b/g, 'ste')
    .replace(/\b(apartment|apt)\b/g, 'apt')
    .trim();
}

function normalizePhone(phone: string | undefined): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) return digits;
  if (digits.length === 11 && digits.startsWith('1')) return digits.slice(1);
  return null;
}

function generateSlug(name: string, city: string, state: string): string {
  const base = `${name}-${city}-${state}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 100);

  // Add random suffix for uniqueness
  const suffix = Math.random().toString(36).slice(2, 8);
  return `${base}-${suffix}`;
}

function generateSourceId(name: string, address: string, city: string, state: string): string {
  const input = `${name}|${address}|${city}|${state}`.toLowerCase();
  // Simple hash
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return `churchesusa-${Math.abs(hash).toString(36)}`;
}

function parseGeoCoordinates(coords: string | undefined): { lat: number; lng: number } | null {
  if (!coords) return null;
  // Format: "lat,lng" e.g., "33.24148,-117.00784"
  const cleaned = coords.replace(/"/g, '').trim();
  const parts = cleaned.split(',');
  if (parts.length !== 2) return null;

  const lat = parseFloat(parts[0]);
  const lng = parseFloat(parts[1]);

  if (isNaN(lat) || isNaN(lng)) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;

  return { lat, lng };
}

function inferDenominationFromName(name: string): string | null {
  const nameLower = name.toLowerCase();

  const patterns: [RegExp, string][] = [
    [/\bbaptist\b/, 'Baptist'],
    [/\bmethodist\b/, 'Methodist'],
    [/\blutheran\b/, 'Lutheran'],
    [/\bpresbyterian\b/, 'Presbyterian'],
    [/\bcatholic\b/, 'Catholic'],
    [/\bepiscopal\b/, 'Episcopal'],
    [/\bpentecostal\b/, 'Pentecostal'],
    [/\bassembl(y|ies) of god\b/, 'Assemblies of God'],
    [/\bcalvary chapel\b/, 'Calvary Chapel'],
    [/\bchurch of christ\b/, 'Church of Christ'],
    [/\bchurch of god\b/, 'Church of God'],
    [/\bnazarene\b/, 'Nazarene'],
    [/\bfree\s*(will)?\s*baptist\b/, 'Free Will Baptist'],
    [/\bsouthern baptist\b/, 'Southern Baptist'],
    [/\bfoursquare\b/, 'Foursquare'],
    [/\bvineyard\b/, 'Vineyard'],
    [/\bmennonite\b/, 'Mennonite'],
    [/\borthodox\b/, 'Orthodox'],
    [/\bgreek orthodox\b/, 'Greek Orthodox'],
    [/\bcongregational\b/, 'Congregational'],
    [/\bevangelical free\b/, 'Evangelical Free'],
    [/\bseventh.?day adventist\b|\bsda\b/, 'Seventh-day Adventist'],
    [/\bapostolic\b/, 'Apostolic'],
    [/\bcogic\b/, 'COGIC'],
    [/\bame\s+zion\b/, 'AME Zion'],
    [/\bame\b/, 'AME'],
    [/\bcme\b/, 'CME'],
    [/\bucc\b/, 'UCC'],
    [/\belca\b/, 'ELCA'],
    [/\blcms\b/, 'LCMS'],
    [/\bpca\b/, 'PCA'],
    [/\bpcusa\b/, 'PCUSA'],
  ];

  for (const [pattern, denomination] of patterns) {
    if (pattern.test(nameLower)) {
      return denomination;
    }
  }

  return null;
}

function isSchool(aka: string | undefined): boolean {
  if (!aka) return false;
  return SCHOOL_INDICATORS.some(pattern => pattern.test(aka));
}

function isExcludedCategory(category: string): boolean {
  return EXCLUDED_CATEGORIES.some(excluded =>
    category.toLowerCase().includes(excluded.toLowerCase())
  );
}

function getDenomination(category: string, name: string): string | null {
  // First try to map from category
  const mapped = DENOMINATION_MAP[category];
  if (mapped) return mapped;

  // If category is generic or unmapped, try to infer from name
  return inferDenominationFromName(name);
}

// ============================================================================
// MAIN IMPORT LOGIC
// ============================================================================

interface CSVRow {
  'Business name': string;
  'Categories': string;
  'Phone': string;
  'Additional phones': string;
  'Emails': string;
  'Website': string;
  'Additional sites': string;
  'Address': string;
  'Suburb': string;
  'State': string;
  'Zipcode': string;
  'Geo coordinates': string;
  'Years in business': string;
  'Areas Serviced': string;
  'AKA': string;
  'BBB rating': string;
  'Facebook': string;
  'Twitter': string;
  'Linkedin': string;
  'Google+': string;
  'Youtube': string;
  'Instagram': string;
  'TripAdvisor': string;
}

interface ChurchRecord {
  slug: string;
  name: string;
  address: string;
  city: string;
  state: string;
  state_abbr: string;
  zip: string;
  lat: number | null;
  lng: number | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  denomination: string | null;
  source: string;
  source_id: string;
}

interface ExistingChurch {
  id: string;
  phone: string | null;
  address: string;
  city: string;
  state_abbr: string;
}

async function loadExistingChurches(
  supabase: ReturnType<typeof createClient>,
  stateFilter?: string
): Promise<{ phoneMap: Map<string, string>; addressMap: Map<string, string> }> {
  const phoneMap = new Map<string, string>();
  const addressMap = new Map<string, string>();

  console.log('📚 Loading existing churches for deduplication...');

  let query = supabase
    .from('churches')
    .select('id, phone, address, city, state_abbr');

  if (stateFilter) {
    query = query.eq('state_abbr', stateFilter);
  }

  const { data, error } = await query;

  if (error) {
    console.error('❌ Error loading existing churches:', error.message);
    return { phoneMap, addressMap };
  }

  const churches = data as ExistingChurch[] | null;

  if (churches) {
    for (const church of churches) {
      const normalizedPhone = normalizePhone(church.phone || undefined);
      if (normalizedPhone) {
        phoneMap.set(normalizedPhone, church.id);
      }
      const normalizedAddr = normalizeAddress(church.address, church.city, church.state_abbr);
      addressMap.set(normalizedAddr, church.id);
    }
  }

  console.log(`   Loaded ${phoneMap.size} phones and ${addressMap.size} addresses\n`);
  return { phoneMap, addressMap };
}

function parseArgs(): { dryRun: boolean; limit: number | null; state: string | null; skip: number } {
  const args = process.argv.slice(2);
  let dryRun = false;
  let limit: number | null = null;
  let state: string | null = null;
  let skip = 0;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--dry-run') {
      dryRun = true;
    } else if (args[i] === '--limit' && args[i + 1]) {
      limit = parseInt(args[i + 1], 10);
      i++;
    } else if (args[i] === '--state' && args[i + 1]) {
      state = args[i + 1].toUpperCase();
      i++;
    } else if (args[i] === '--skip' && args[i + 1]) {
      skip = parseInt(args[i + 1], 10);
      i++;
    }
  }

  return { dryRun, limit, state, skip };
}

async function main() {
  const options = parseArgs();

  console.log('\n⛪ Church Import from churchesusa.csv\n');
  console.log(`   Dry run:  ${options.dryRun}`);
  console.log(`   Limit:    ${options.limit || 'none'}`);
  console.log(`   State:    ${options.state || 'all'}`);
  console.log(`   Skip:     ${options.skip}`);
  console.log('');

  // Validate environment
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Load existing churches for deduplication
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { phoneMap, addressMap } = await loadExistingChurches(supabase as any, options.state || undefined);

  // Track statistics
  const stats = {
    processed: 0,
    imported: 0,
    skippedDuplicate: 0,
    skippedExcluded: 0,
    skippedSchool: 0,
    skippedInvalidState: 0,
    skippedNoAddress: 0,
    errors: 0,
  };

  // Batch for inserts
  let batch: ChurchRecord[] = [];

  // Process CSV
  const parser = fs
    .createReadStream(CSV_PATH)
    .pipe(parse({
      columns: true,
      skip_empty_lines: true,
      relax_quotes: true,
      relax_column_count: true,
    }));

  let rowIndex = 0;

  for await (const row of parser as AsyncIterable<CSVRow>) {
    rowIndex++;

    // Skip header or initial rows
    if (rowIndex <= options.skip) continue;

    // Check limit
    if (options.limit && stats.processed >= options.limit) break;

    stats.processed++;

    // Progress update
    if (stats.processed % 10000 === 0) {
      console.log(`📊 Progress: ${stats.processed.toLocaleString()} processed, ${stats.imported.toLocaleString()} imported, ${stats.skippedDuplicate.toLocaleString()} duplicates`);
    }

    // Extract fields
    const name = row['Business name']?.trim();
    const category = row['Categories']?.trim();
    const phone = row['Phone']?.trim();
    const emails = row['Emails']?.trim();
    const website = row['Website']?.trim();
    const address = row['Address']?.trim();
    const city = row['Suburb']?.trim();
    const stateAbbr = row['State']?.trim()?.toUpperCase();
    const zip = row['Zipcode']?.trim();
    const geoCoords = row['Geo coordinates']?.trim();
    const aka = row['AKA']?.trim();

    // Validate required fields
    if (!name || !address || !city || !stateAbbr) {
      stats.skippedNoAddress++;
      continue;
    }

    // Validate state
    if (!STATE_NAMES[stateAbbr]) {
      stats.skippedInvalidState++;
      continue;
    }

    // Filter by state if specified
    if (options.state && stateAbbr !== options.state) {
      continue;
    }

    // Check if excluded category
    if (category && isExcludedCategory(category)) {
      stats.skippedExcluded++;
      continue;
    }

    // Check if school
    if (isSchool(aka) || isSchool(name)) {
      stats.skippedSchool++;
      continue;
    }

    // Check for duplicates
    const normalizedPhone = normalizePhone(phone);
    const normalizedAddr = normalizeAddress(address, city, stateAbbr);

    if ((normalizedPhone && phoneMap.has(normalizedPhone)) || addressMap.has(normalizedAddr)) {
      stats.skippedDuplicate++;
      continue;
    }

    // Parse coordinates
    const coords = parseGeoCoordinates(geoCoords);

    // Get denomination
    const denomination = getDenomination(category || '', name);

    // Get first email
    const email = emails?.split(',')[0]?.trim() || null;

    // Create record
    const record: ChurchRecord = {
      slug: generateSlug(name, city, stateAbbr),
      name,
      address,
      city,
      state: STATE_NAMES[stateAbbr],
      state_abbr: stateAbbr,
      zip: zip || '',
      lat: coords?.lat || null,
      lng: coords?.lng || null,
      phone: phone || null,
      email,
      website: website || null,
      denomination,
      source: 'churchesusa',
      source_id: generateSourceId(name, address, city, stateAbbr),
    };

    // Add to dedup maps to prevent duplicates within this import
    if (normalizedPhone) phoneMap.set(normalizedPhone, 'pending');
    addressMap.set(normalizedAddr, 'pending');

    batch.push(record);
    stats.imported++;

    // Insert batch
    if (batch.length >= BATCH_SIZE) {
      if (!options.dryRun) {
        const { error } = await supabase.from('churches').insert(batch);
        if (error) {
          console.error(`❌ Batch insert error: ${error.message}`);
          stats.errors += batch.length;
          stats.imported -= batch.length;
        }
        await new Promise(resolve => setTimeout(resolve, BATCH_DELAY_MS));
      }
      batch = [];
    }
  }

  // Insert remaining batch
  if (batch.length > 0 && !options.dryRun) {
    const { error } = await supabase.from('churches').insert(batch);
    if (error) {
      console.error(`❌ Final batch insert error: ${error.message}`);
      stats.errors += batch.length;
      stats.imported -= batch.length;
    }
  }

  // Print summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 IMPORT SUMMARY');
  console.log('='.repeat(50));
  console.log(`   Processed:          ${stats.processed.toLocaleString()}`);
  console.log(`   Imported:           ${stats.imported.toLocaleString()}`);
  console.log(`   Skipped (duplicate):${stats.skippedDuplicate.toLocaleString()}`);
  console.log(`   Skipped (excluded): ${stats.skippedExcluded.toLocaleString()}`);
  console.log(`   Skipped (school):   ${stats.skippedSchool.toLocaleString()}`);
  console.log(`   Skipped (no addr):  ${stats.skippedNoAddress.toLocaleString()}`);
  console.log(`   Skipped (bad state):${stats.skippedInvalidState.toLocaleString()}`);
  console.log(`   Errors:             ${stats.errors.toLocaleString()}`);
  console.log('='.repeat(50));

  if (options.dryRun) {
    console.log('\n⚠️  DRY RUN - No records were actually inserted\n');
  } else {
    console.log('\n✅ Import complete!\n');
    console.log('Next steps:');
    console.log('  1. Run city/state count aggregation');
    console.log('  2. Queue new churches for AI enrichment');
    console.log('  3. Geocode churches with missing coordinates\n');
  }
}

main().catch(console.error);
