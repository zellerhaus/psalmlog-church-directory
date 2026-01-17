#!/usr/bin/env npx ts-node

/**
 * Backfill missing church data from churchesusa.csv
 *
 * Updates existing churches with missing denomination and phone data
 * from the CSV file by matching on normalized address or phone.
 *
 * Usage:
 *   npx ts-node scripts/backfill-church-data.ts [options]
 *
 * Options:
 *   --dry-run     Preview without updating
 *   --limit N     Process only first N churches
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

const CSV_PATH = path.join(__dirname, '../Reference Images/churchesusa.csv');

// ============================================================================
// DENOMINATION NORMALIZATION (same as import script)
// ============================================================================

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
  'Various Denomination Churches': null,
  'Churches & Places of Worship': null,
  'Christian Science Churches': 'Christian Science',
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

function getDenomination(category: string): string | null {
  return DENOMINATION_MAP[category] || null;
}

// ============================================================================
// CSV ROW INTERFACE
// ============================================================================

interface CSVRow {
  'Business name': string;
  'Categories': string;
  'Phone': string;
  'Additional phones': string;
  'Emails': string;
  'Website': string;
  'Address': string;
  'Suburb': string;
  'State': string;
  'Zipcode': string;
  'Geo coordinates': string;
}

interface CSVData {
  phone: string | null;
  denomination: string | null;
  website: string | null;
  email: string | null;
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  let limit: number | null = null;

  const limitIdx = args.indexOf('--limit');
  if (limitIdx !== -1 && args[limitIdx + 1]) {
    limit = parseInt(args[limitIdx + 1], 10);
  }

  console.log('\n🔄 Backfill Church Data from CSV\n');
  console.log(`   Dry run:  ${dryRun}`);
  console.log(`   Limit:    ${limit || 'none'}`);
  console.log('');

  // Validate environment
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Step 1: Build lookup maps from CSV
  console.log('📖 Building lookup maps from CSV...');

  const addressToData = new Map<string, CSVData>();
  const phoneToData = new Map<string, CSVData>();

  const parser = fs
    .createReadStream(CSV_PATH)
    .pipe(parse({
      columns: true,
      skip_empty_lines: true,
      relax_quotes: true,
      relax_column_count: true,
    }));

  let csvCount = 0;
  for await (const row of parser as AsyncIterable<CSVRow>) {
    csvCount++;

    const address = row['Address']?.trim();
    const city = row['Suburb']?.trim();
    const stateAbbr = row['State']?.trim()?.toUpperCase();
    const phone = row['Phone']?.trim();
    const category = row['Categories']?.trim();
    const website = row['Website']?.trim();
    const emails = row['Emails']?.trim();

    if (!address || !city || !stateAbbr) continue;

    const data: CSVData = {
      phone: phone || null,
      denomination: getDenomination(category || ''),
      website: website || null,
      email: emails?.split(',')[0]?.trim() || null,
    };

    // Only add to maps if we have useful data
    if (data.phone || data.denomination) {
      const normalizedAddr = normalizeAddress(address, city, stateAbbr);
      if (!addressToData.has(normalizedAddr)) {
        addressToData.set(normalizedAddr, data);
      }

      const normalizedPhone = normalizePhone(phone);
      if (normalizedPhone && !phoneToData.has(normalizedPhone)) {
        phoneToData.set(normalizedPhone, data);
      }
    }
  }

  console.log(`   Processed ${csvCount.toLocaleString()} CSV rows`);
  console.log(`   Address lookup: ${addressToData.size.toLocaleString()} entries`);
  console.log(`   Phone lookup: ${phoneToData.size.toLocaleString()} entries\n`);

  // Step 2: Load churches that need backfill (with pagination)
  console.log('📚 Loading churches that need backfill...');

  interface ChurchToBackfill {
    id: string;
    name: string;
    address: string;
    city: string;
    state_abbr: string;
    phone: string | null;
    denomination: string | null;
    website: string | null;
    email: string | null;
  }

  const churches: ChurchToBackfill[] = [];
  const PAGE_SIZE = 1000; // Supabase default limit
  let offset = 0;
  let hasMore = true;

  while (hasMore) {
    let query = supabase
      .from('churches')
      .select('id, name, address, city, state_abbr, phone, denomination, website, email')
      .or('denomination.is.null,phone.is.null')
      .order('id', { ascending: true })
      .range(offset, offset + PAGE_SIZE - 1);

    if (limit && churches.length + PAGE_SIZE > limit) {
      query = query.limit(limit - churches.length);
    }

    const { data, error } = await query;

    if (error) {
      console.error('❌ Error loading churches:', error.message);
      process.exit(1);
    }

    if (data && data.length > 0) {
      churches.push(...(data as ChurchToBackfill[]));
      offset += PAGE_SIZE;
      process.stdout.write(`   Fetched ${churches.length.toLocaleString()} churches...\r`);
      if (data.length < PAGE_SIZE || (limit && churches.length >= limit)) {
        hasMore = false;
      }
    } else {
      hasMore = false;
    }
  }

  if (churches.length === 0) {
    console.log('✅ No churches need backfill!\n');
    process.exit(0);
  }

  console.log(`   Found ${churches.length.toLocaleString()} churches with missing data\n`);

  // Step 3: Match and update
  const stats = {
    matched: 0,
    updatedDenomination: 0,
    updatedPhone: 0,
    updatedWebsite: 0,
    updatedEmail: 0,
    noMatch: 0,
    errors: 0,
  };

  console.log('🔄 Processing churches...\n');

  for (let i = 0; i < churches.length; i++) {
    const church = churches[i];

    // Try to find match
    const normalizedAddr = normalizeAddress(church.address, church.city, church.state_abbr);
    const normalizedPhone = normalizePhone(church.phone || undefined);

    let csvData: CSVData | undefined;

    // Try address match first
    if (addressToData.has(normalizedAddr)) {
      csvData = addressToData.get(normalizedAddr);
    }
    // Try phone match
    else if (normalizedPhone && phoneToData.has(normalizedPhone)) {
      csvData = phoneToData.get(normalizedPhone);
    }

    if (!csvData) {
      stats.noMatch++;
      continue;
    }

    stats.matched++;

    // Build update object
    const updates: Record<string, string> = {};

    if (!church.denomination && csvData.denomination) {
      updates.denomination = csvData.denomination;
      stats.updatedDenomination++;
    }

    if (!church.phone && csvData.phone) {
      updates.phone = csvData.phone;
      stats.updatedPhone++;
    }

    if (!church.website && csvData.website) {
      updates.website = csvData.website;
      stats.updatedWebsite++;
    }

    if (!church.email && csvData.email) {
      updates.email = csvData.email;
      stats.updatedEmail++;
    }

    // Apply updates
    if (Object.keys(updates).length > 0 && !dryRun) {
      const { error: updateError } = await supabase
        .from('churches')
        .update(updates)
        .eq('id', church.id);

      if (updateError) {
        stats.errors++;
      }
    }

    // Progress
    if ((i + 1) % 1000 === 0) {
      console.log(`   Progress: ${(i + 1).toLocaleString()}/${churches.length.toLocaleString()} - ${stats.matched} matched`);
    }
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 BACKFILL SUMMARY');
  console.log('='.repeat(50));
  console.log(`   Churches processed: ${churches.length.toLocaleString()}`);
  console.log(`   Matched from CSV:   ${stats.matched.toLocaleString()}`);
  console.log(`   No match found:     ${stats.noMatch.toLocaleString()}`);
  console.log('');
  console.log(`   Denomination filled: ${stats.updatedDenomination.toLocaleString()}`);
  console.log(`   Phone filled:        ${stats.updatedPhone.toLocaleString()}`);
  console.log(`   Website filled:      ${stats.updatedWebsite.toLocaleString()}`);
  console.log(`   Email filled:        ${stats.updatedEmail.toLocaleString()}`);
  console.log(`   Errors:              ${stats.errors.toLocaleString()}`);
  console.log('='.repeat(50));

  if (dryRun) {
    console.log('\n⚠️  DRY RUN - No records were actually updated\n');
  } else {
    console.log('\n✅ Backfill complete!\n');
  }
}

main().catch(console.error);
