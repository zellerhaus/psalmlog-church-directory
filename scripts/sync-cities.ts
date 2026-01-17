#!/usr/bin/env npx tsx

/**
 * Sync Cities Script
 *
 * Populates the cities table from unique cities found in the churches table.
 *
 * Usage:
 *   npx tsx scripts/sync-cities.ts
 *   npx tsx scripts/sync-cities.ts --dry-run
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });

import { createClient } from '@supabase/supabase-js';

interface CityData {
  city: string;
  state: string;
  state_abbr: string;
  count: number;
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');

  console.log('\n🏙️  Sync Cities Script\n');
  console.log(`   Dry run: ${dryRun}\n`);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Supabase credentials required');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Get all churches with pagination
  console.log('📊 Fetching churches...');
  const churches: { city: string; state: string; state_abbr: string; lat: number | null; lng: number | null }[] = [];
  const PAGE_SIZE = 1000; // Supabase default limit
  let offset = 0;
  let hasMore = true;

  while (hasMore) {
    const { data, error } = await supabase
      .from('churches')
      .select('city, state, state_abbr, lat, lng')
      .order('id', { ascending: true })
      .range(offset, offset + PAGE_SIZE - 1);

    if (error) {
      console.error('❌ Error fetching churches:', error);
      process.exit(1);
    }

    if (data && data.length > 0) {
      churches.push(...data);
      offset += PAGE_SIZE;
      process.stdout.write(`   Fetched ${churches.length.toLocaleString()} churches...\r`);
      if (data.length < PAGE_SIZE) {
        hasMore = false;
      }
    } else {
      hasMore = false;
    }
  }

  console.log(`   Found ${churches.length.toLocaleString()} churches\n`);

  // Aggregate by city
  const cityMap = new Map<string, CityData & { lats: number[], lngs: number[] }>();

  for (const church of churches) {
    const key = `${church.city}|${church.state_abbr}`;

    if (!cityMap.has(key)) {
      cityMap.set(key, {
        city: church.city,
        state: church.state,
        state_abbr: church.state_abbr,
        count: 0,
        lats: [],
        lngs: [],
      });
    }

    const entry = cityMap.get(key)!;
    entry.count++;
    if (church.lat && church.lng) {
      entry.lats.push(church.lat);
      entry.lngs.push(church.lng);
    }
  }

  console.log(`📍 Found ${cityMap.size} unique cities\n`);

  // Prepare city records
  const cityRecords = Array.from(cityMap.values()).map((city) => {
    // Calculate average lat/lng for city center
    const avgLat = city.lats.length > 0
      ? city.lats.reduce((a, b) => a + b, 0) / city.lats.length
      : null;
    const avgLng = city.lngs.length > 0
      ? city.lngs.reduce((a, b) => a + b, 0) / city.lngs.length
      : null;

    // Create slug - just the city name (the table seems to expect unique slugs)
    const baseSlug = city.city.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

    return {
      name: city.city,
      slug: baseSlug,
      state: city.state,
      state_abbr: city.state_abbr,
      lat: avgLat,
      lng: avgLng,
      church_count: city.count,
    };
  });

  // Sort by church count descending
  cityRecords.sort((a, b) => b.church_count - a.church_count);

  // Show top 10
  console.log('📋 Top 10 cities by church count:');
  for (const city of cityRecords.slice(0, 10)) {
    console.log(`   ${city.name}, ${city.state_abbr}: ${city.church_count} churches`);
  }
  console.log('');

  if (dryRun) {
    console.log('🔍 Dry run - no data saved\n');
    console.log(`   Would insert/update ${cityRecords.length} cities\n`);
    return;
  }

  // Get existing cities
  console.log('💾 Fetching existing cities...');
  const { data: existingCities } = await supabase
    .from('cities')
    .select('slug, state_abbr');

  const existingKeys = new Set(
    (existingCities || []).map((c) => `${c.slug}|${c.state_abbr}`)
  );

  // Split into inserts and updates
  const toInsert = cityRecords.filter(
    (c) => !existingKeys.has(`${c.slug}|${c.state_abbr}`)
  );
  const toUpdate = cityRecords.filter(
    (c) => existingKeys.has(`${c.slug}|${c.state_abbr}`)
  );

  console.log(`   New cities to insert: ${toInsert.length}`);
  console.log(`   Existing cities to update: ${toUpdate.length}\n`);

  let inserted = 0;
  let updated = 0;
  let errors = 0;

  // Insert new cities one by one (to handle slug conflicts gracefully)
  if (toInsert.length > 0) {
    console.log('📥 Inserting new cities...');

    for (const city of toInsert) {
      const { error } = await supabase.from('cities').insert(city);

      if (error) {
        if (error.message.includes('duplicate key')) {
          // Slug conflict - skip this city (already exists with different state)
          // The app uses state_abbr in URLs anyway, so this is fine
        } else {
          console.error(`   ❌ Insert error for ${city.name}:`, error.message);
        }
        errors++;
      } else {
        inserted++;
        process.stdout.write(`   Inserted ${inserted} cities\r`);
      }
    }
    console.log('');
  }

  // Update existing cities
  if (toUpdate.length > 0) {
    console.log('📝 Updating existing cities...');

    for (const city of toUpdate) {
      const { error } = await supabase
        .from('cities')
        .update({
          name: city.name,
          state: city.state,
          lat: city.lat,
          lng: city.lng,
          church_count: city.church_count,
        })
        .eq('slug', city.slug)
        .eq('state_abbr', city.state_abbr);

      if (error) {
        errors++;
      } else {
        updated++;
        process.stdout.write(`   Updated ${updated}/${toUpdate.length}\r`);
      }
    }
    console.log('');
  }

  console.log(`\n✅ Done!`);
  console.log(`   Inserted: ${inserted}`);
  console.log(`   Updated: ${updated}`);
  console.log(`   Errors: ${errors}\n`);
}

main().catch((error) => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});
