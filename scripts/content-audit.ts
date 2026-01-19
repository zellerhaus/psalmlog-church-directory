/**
 * Content Coverage Audit Script
 *
 * Analyzes the database to check what percentage of churches have AI-generated content.
 *
 * Run with: npx tsx scripts/content-audit.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials. Check your .env.local file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

interface AuditStats {
  total: number;
  withDescription: number;
  withWhatToExpect: number;
  withBoth: number;
  withNeither: number;
  topCitiesWithoutContent: { city: string; state: string; count: number }[];
}

async function auditContent(): Promise<void> {
  console.log('🔍 Running Content Coverage Audit...\n');

  // Get total church count
  const { count: totalCount } = await supabase
    .from('churches')
    .select('*', { count: 'exact', head: true });

  console.log(`📊 Total churches in database: ${totalCount?.toLocaleString() || 0}\n`);

  // Get counts for each content type
  const { count: withDescription } = await supabase
    .from('churches')
    .select('*', { count: 'exact', head: true })
    .not('ai_description', 'is', null)
    .neq('ai_description', '');

  const { count: withWhatToExpect } = await supabase
    .from('churches')
    .select('*', { count: 'exact', head: true })
    .not('ai_what_to_expect', 'is', null)
    .neq('ai_what_to_expect', '');

  const { count: withBoth } = await supabase
    .from('churches')
    .select('*', { count: 'exact', head: true })
    .not('ai_description', 'is', null)
    .neq('ai_description', '')
    .not('ai_what_to_expect', 'is', null)
    .neq('ai_what_to_expect', '');

  const { count: withNeither } = await supabase
    .from('churches')
    .select('*', { count: 'exact', head: true })
    .or('ai_description.is.null,ai_description.eq.');

  const total = totalCount || 0;
  const descPercent = total > 0 ? ((withDescription || 0) / total * 100).toFixed(1) : '0';
  const expectPercent = total > 0 ? ((withWhatToExpect || 0) / total * 100).toFixed(1) : '0';
  const bothPercent = total > 0 ? ((withBoth || 0) / total * 100).toFixed(1) : '0';

  console.log('📝 AI Content Coverage:');
  console.log('━'.repeat(50));
  console.log(`  With AI Description:      ${(withDescription || 0).toLocaleString().padStart(8)} (${descPercent}%)`);
  console.log(`  With What to Expect:      ${(withWhatToExpect || 0).toLocaleString().padStart(8)} (${expectPercent}%)`);
  console.log(`  With Both:                ${(withBoth || 0).toLocaleString().padStart(8)} (${bothPercent}%)`);
  console.log(`  Missing Content:          ${(withNeither || 0).toLocaleString().padStart(8)}`);
  console.log('');

  // Find top cities without content
  console.log('🏙️  Top Cities Missing Content (by church count):');
  console.log('━'.repeat(50));

  const { data: citiesWithoutContent } = await supabase
    .from('churches')
    .select('city, state_abbr')
    .or('ai_description.is.null,ai_description.eq.')
    .order('city');

  if (citiesWithoutContent) {
    // Aggregate by city
    const cityMap = new Map<string, number>();
    for (const church of citiesWithoutContent) {
      const key = `${church.city}, ${church.state_abbr}`;
      cityMap.set(key, (cityMap.get(key) || 0) + 1);
    }

    // Sort by count and take top 20
    const sortedCities = Array.from(cityMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20);

    for (const [city, count] of sortedCities) {
      console.log(`  ${count.toString().padStart(5)} churches - ${city}`);
    }
  }

  console.log('');

  // Check state content coverage
  console.log('📍 State Content Coverage:');
  console.log('━'.repeat(50));

  const { data: stateContent, count: stateContentCount } = await supabase
    .from('state_content')
    .select('state_abbr', { count: 'exact' });

  console.log(`  States with content: ${stateContentCount || 0} / 51`);

  // Check city content coverage
  const { count: cityContentCount } = await supabase
    .from('city_content')
    .select('*', { count: 'exact', head: true });

  const { count: totalCities } = await supabase
    .from('cities')
    .select('*', { count: 'exact', head: true });

  console.log(`  Cities with content: ${cityContentCount || 0} / ${totalCities || 0}`);
  console.log('');

  // Program coverage
  console.log('👥 Ministry Programs Coverage:');
  console.log('━'.repeat(50));

  const { count: kidsMinistry } = await supabase
    .from('churches')
    .select('*', { count: 'exact', head: true })
    .eq('has_kids_ministry', true);

  const { count: youthGroup } = await supabase
    .from('churches')
    .select('*', { count: 'exact', head: true })
    .eq('has_youth_group', true);

  const { count: smallGroups } = await supabase
    .from('churches')
    .select('*', { count: 'exact', head: true })
    .eq('has_small_groups', true);

  const kidsPercent = total > 0 ? ((kidsMinistry || 0) / total * 100).toFixed(1) : '0';
  const youthPercent = total > 0 ? ((youthGroup || 0) / total * 100).toFixed(1) : '0';
  const groupsPercent = total > 0 ? ((smallGroups || 0) / total * 100).toFixed(1) : '0';

  console.log(`  Kids Ministry:  ${(kidsMinistry || 0).toLocaleString().padStart(8)} (${kidsPercent}%)`);
  console.log(`  Youth Group:    ${(youthGroup || 0).toLocaleString().padStart(8)} (${youthPercent}%)`);
  console.log(`  Small Groups:   ${(smallGroups || 0).toLocaleString().padStart(8)} (${groupsPercent}%)`);
  console.log('');

  // Denomination coverage
  console.log('⛪ Denomination Coverage:');
  console.log('━'.repeat(50));

  const { count: withDenomination } = await supabase
    .from('churches')
    .select('*', { count: 'exact', head: true })
    .not('denomination', 'is', null)
    .neq('denomination', '');

  const denomPercent = total > 0 ? ((withDenomination || 0) / total * 100).toFixed(1) : '0';
  console.log(`  With denomination: ${(withDenomination || 0).toLocaleString().padStart(8)} (${denomPercent}%)`);

  // Worship style coverage
  const { count: withWorshipStyle } = await supabase
    .from('churches')
    .select('*', { count: 'exact', head: true })
    .not('worship_style', 'is', null);

  const worshipPercent = total > 0 ? ((withWorshipStyle || 0) / total * 100).toFixed(1) : '0';
  console.log(`  With worship style: ${(withWorshipStyle || 0).toLocaleString().padStart(8)} (${worshipPercent}%)`);
  console.log('');

  console.log('✅ Audit complete!');
}

auditContent().catch(console.error);
