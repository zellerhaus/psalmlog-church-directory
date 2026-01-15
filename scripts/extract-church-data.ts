#!/usr/bin/env npx tsx

/**
 * Church Data Extraction CLI Script
 *
 * Extracts structured data from church websites:
 * - Denomination
 * - Service times
 * - Worship style
 * - Ministry programs (kids, youth, small groups)
 *
 * Usage:
 *   npx tsx scripts/extract-church-data.ts --batch 20
 *   npx tsx scripts/extract-church-data.ts --all
 */

import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

import { createClient } from '@supabase/supabase-js';
import type { Church, ServiceTime } from '../src/types/database';

// ============================================================================
// CLI PARSING
// ============================================================================

interface CLIOptions {
  batchSize: number;
  all: boolean;
  verbose: boolean;
  dryRun: boolean;
  force: boolean; // Re-extract even if data exists
}

function parseArgs(): CLIOptions {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Church Data Extraction CLI

Extracts structured data from church websites using AI.

Usage:
  npx tsx scripts/extract-church-data.ts [options]

Options:
  --batch <number>    Number of churches to process (default: 20)
  --all               Process all churches with websites
  --force             Re-extract even if data already exists
  --verbose           Show detailed progress
  --dry-run           Don't save to database
  --help              Show this help message

Examples:
  npx tsx scripts/extract-church-data.ts --batch 20
  npx tsx scripts/extract-church-data.ts --all --force
`);
    process.exit(0);
  }

  const getArg = (flag: string): string | undefined => {
    const idx = args.indexOf(flag);
    return idx !== -1 && idx + 1 < args.length ? args[idx + 1] : undefined;
  };

  return {
    batchSize: parseInt(getArg('--batch') ?? '20', 10),
    all: args.includes('--all'),
    verbose: args.includes('--verbose'),
    dryRun: args.includes('--dry-run'),
    force: args.includes('--force'),
  };
}

// ============================================================================
// WEBSITE FETCHING
// ============================================================================

async function fetchWebsiteContent(url: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'ChurchDirectory/1.0 (data extraction bot)',
        'Accept': 'text/html',
      },
    });

    clearTimeout(timeout);

    if (!response.ok) return null;

    const html = await response.text();

    // Convert HTML to readable text
    return html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
      .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 20000);
  } catch {
    return null;
  }
}

// ============================================================================
// AI EXTRACTION
// ============================================================================

interface ExtractedData {
  denomination?: string;
  worshipStyle?: string[];
  serviceTimes?: ServiceTime[];
  hasKidsMinistry?: boolean;
  hasYouthGroup?: boolean;
  hasSmallGroups?: boolean;
}

async function extractChurchData(
  churchName: string,
  websiteContent: string,
  apiKey: string
): Promise<ExtractedData> {
  const prompt = `Analyze this church website content and extract structured information. Be conservative - only include data you're confident about.

Church: ${churchName}

Website content:
${websiteContent.slice(0, 12000)}

Extract and return ONLY valid JSON (no explanation, no markdown):
{
  "denomination": "string or null - e.g., 'Baptist', 'Methodist', 'Non-denominational', 'Catholic', 'Lutheran', 'Presbyterian', 'Assemblies of God', 'Church of Christ', 'Evangelical Free', etc. Only include if clearly stated.",
  "worshipStyle": ["array of strings or null - e.g., 'Contemporary', 'Traditional', 'Blended', 'Modern', 'Liturgical'. Only include if worship style is mentioned."],
  "serviceTimes": [{"day": "Sunday", "time": "9:00 AM", "name": "Service name or null"}] or null - Extract actual service times if listed. Use 12-hour format with AM/PM.",
  "hasKidsMinistry": true/false/null - true if children's ministry, kids church, nursery, or Sunday school is mentioned,
  "hasYouthGroup": true/false/null - true if youth ministry, student ministry, teens, or middle/high school programs mentioned,
  "hasSmallGroups": true/false/null - true if small groups, life groups, community groups, Bible studies, or home groups mentioned
}

Rules:
- Return null for any field where information is not clearly stated
- For serviceTimes, only include times that are clearly worship service times (not office hours)
- For denomination, infer from church name if obvious (e.g., "First Baptist" = Baptist)
- Be accurate - don't guess`;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-3-haiku-20240307',
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Anthropic API error: ${response.status} - ${error.slice(0, 100)}`);
  }

  const data = await response.json();
  const content = data.content[0]?.text ?? '{}';

  // Extract JSON from response
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    return {};
  }

  try {
    const parsed = JSON.parse(jsonMatch[0]);
    return {
      denomination: parsed.denomination || undefined,
      worshipStyle: Array.isArray(parsed.worshipStyle) && parsed.worshipStyle.length > 0
        ? parsed.worshipStyle
        : undefined,
      serviceTimes: Array.isArray(parsed.serviceTimes) && parsed.serviceTimes.length > 0
        ? parsed.serviceTimes
        : undefined,
      hasKidsMinistry: typeof parsed.hasKidsMinistry === 'boolean' ? parsed.hasKidsMinistry : undefined,
      hasYouthGroup: typeof parsed.hasYouthGroup === 'boolean' ? parsed.hasYouthGroup : undefined,
      hasSmallGroups: typeof parsed.hasSmallGroups === 'boolean' ? parsed.hasSmallGroups : undefined,
    };
  } catch {
    return {};
  }
}

// ============================================================================
// DENOMINATION INFERENCE FROM NAME
// ============================================================================

function inferDenominationFromName(name: string): string | null {
  const nameLower = name.toLowerCase();

  const patterns: [RegExp | string, string][] = [
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
    [/\bnazarene\b/, 'Church of the Nazarene'],
    [/\bfree\s*(will)?\s*baptist\b/, 'Free Will Baptist'],
    [/\bsouthern baptist\b/, 'Southern Baptist'],
    [/\bfoursquare\b/, 'Foursquare'],
    [/\bvineyard\b/, 'Vineyard'],
    [/\bmennonite\b/, 'Mennonite'],
    [/\borthodox\b/, 'Orthodox'],
    [/\bgreek orthodox\b/, 'Greek Orthodox'],
    [/\bcongregational\b/, 'Congregational'],
    [/\bevangelical free\b/, 'Evangelical Free'],
    [/\bseventh.?day adventist\b|sda\b/, 'Seventh-day Adventist'],
    [/\bapostolic\b/, 'Apostolic'],
  ];

  for (const [pattern, denomination] of patterns) {
    if (typeof pattern === 'string' ? nameLower.includes(pattern) : pattern.test(nameLower)) {
      return denomination;
    }
  }

  return null;
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  const options = parseArgs();

  console.log('\n🔍 Church Data Extraction\n');
  console.log(`   Batch size:  ${options.all ? 'ALL' : options.batchSize}`);
  console.log(`   Force:       ${options.force}`);
  console.log(`   Dry run:     ${options.dryRun}`);
  console.log('');

  // Validate environment
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Error: Supabase credentials required');
    process.exit(1);
  }

  if (!anthropicKey) {
    console.error('❌ Error: ANTHROPIC_API_KEY required');
    process.exit(1);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createClient(supabaseUrl, supabaseServiceKey) as any;

  // Build query - get churches that need extraction
  let query = supabase
    .from('churches')
    .select('*')
    .not('website', 'is', null)
    .order('created_at', { ascending: true });

  // If not forcing, only get churches without service_times
  if (!options.force) {
    query = query.is('service_times', null);
  }

  if (!options.all) {
    query = query.limit(options.batchSize);
  }

  const { data: churches, error } = await query;

  if (error) {
    console.error('❌ Error fetching churches:', error.message);
    process.exit(1);
  }

  if (!churches || churches.length === 0) {
    console.log('✅ No churches need data extraction!\n');
    process.exit(0);
  }

  console.log(`📋 Found ${churches.length} churches to process\n`);

  let successCount = 0;
  let errorCount = 0;
  let skippedCount = 0;
  let updatedFields = {
    denomination: 0,
    serviceTimes: 0,
    worshipStyle: 0,
    hasKidsMinistry: 0,
    hasYouthGroup: 0,
    hasSmallGroups: 0,
  };

  for (let i = 0; i < churches.length; i++) {
    const church = churches[i];
    const progress = `[${i + 1}/${churches.length}]`;

    process.stdout.write(`${progress} ${church.name.slice(0, 40).padEnd(42)}`);

    try {
      // Try to infer denomination from name first
      let inferredDenom = inferDenominationFromName(church.name);

      // Fetch website
      if (!church.website) {
        console.log('⏭️  no website');
        skippedCount++;
        continue;
      }

      const websiteContent = await fetchWebsiteContent(church.website);

      if (!websiteContent || websiteContent.length < 200) {
        // Still update with inferred denomination if we have it
        if (inferredDenom && !church.denomination && !options.dryRun) {
          await supabase
            .from('churches')
            .update({ denomination: inferredDenom, updated_at: new Date().toISOString() })
            .eq('id', church.id);
          updatedFields.denomination++;
          console.log(`⚡ inferred: ${inferredDenom}`);
        } else {
          console.log('⏭️  website fetch failed');
        }
        skippedCount++;
        continue;
      }

      // Extract data using AI
      const extracted = await extractChurchData(church.name, websiteContent, anthropicKey);

      if (options.verbose) {
        console.log('\n        Extracted:', JSON.stringify(extracted, null, 2).slice(0, 200));
      }

      // Build update object
      const updates: Partial<Church> = {
        updated_at: new Date().toISOString(),
      };

      // Denomination: use extracted, fall back to inferred, keep existing
      if (extracted.denomination && !church.denomination) {
        updates.denomination = extracted.denomination;
        updatedFields.denomination++;
      } else if (inferredDenom && !church.denomination) {
        updates.denomination = inferredDenom;
        updatedFields.denomination++;
      }

      // Service times
      if (extracted.serviceTimes && extracted.serviceTimes.length > 0) {
        updates.service_times = extracted.serviceTimes;
        updatedFields.serviceTimes++;
      }

      // Worship style
      if (extracted.worshipStyle && extracted.worshipStyle.length > 0) {
        updates.worship_style = extracted.worshipStyle;
        updatedFields.worshipStyle++;
      }

      // Ministries
      if (extracted.hasKidsMinistry !== undefined) {
        updates.has_kids_ministry = extracted.hasKidsMinistry;
        updatedFields.hasKidsMinistry++;
      }

      if (extracted.hasYouthGroup !== undefined) {
        updates.has_youth_group = extracted.hasYouthGroup;
        updatedFields.hasYouthGroup++;
      }

      if (extracted.hasSmallGroups !== undefined) {
        updates.has_small_groups = extracted.hasSmallGroups;
        updatedFields.hasSmallGroups++;
      }

      // Save to database
      if (!options.dryRun && Object.keys(updates).length > 1) {
        const { error: updateError } = await supabase
          .from('churches')
          .update(updates)
          .eq('id', church.id);

        if (updateError) throw new Error(updateError.message);
      }

      // Summary of what was found
      const found: string[] = [];
      if (updates.denomination) found.push('denom');
      if (updates.service_times) found.push(`${updates.service_times.length} times`);
      if (updates.worship_style) found.push('style');
      if (updates.has_kids_ministry) found.push('kids');
      if (updates.has_youth_group) found.push('youth');
      if (updates.has_small_groups) found.push('groups');

      console.log(`✅ ${found.length > 0 ? found.join(', ') : 'no new data'}`);
      successCount++;

      // Rate limit
      await sleep(600);
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      console.log(`❌ ${errMsg.slice(0, 50)}`);
      errorCount++;
      await sleep(1000);
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 Summary\n');
  console.log(`   Processed:     ${churches.length}`);
  console.log(`   Success:       ${successCount}`);
  console.log(`   Skipped:       ${skippedCount}`);
  console.log(`   Errors:        ${errorCount}`);
  console.log('');
  console.log('   Fields updated:');
  console.log(`     Denomination:    ${updatedFields.denomination}`);
  console.log(`     Service times:   ${updatedFields.serviceTimes}`);
  console.log(`     Worship style:   ${updatedFields.worshipStyle}`);
  console.log(`     Kids ministry:   ${updatedFields.hasKidsMinistry}`);
  console.log(`     Youth group:     ${updatedFields.hasYouthGroup}`);
  console.log(`     Small groups:    ${updatedFields.hasSmallGroups}`);

  if (options.dryRun) {
    console.log('\n🔍 Dry run - no data was saved\n');
  } else {
    console.log(`\n✅ Done!\n`);
  }

  // Check remaining
  const { count } = await supabase
    .from('churches')
    .select('*', { count: 'exact', head: true })
    .not('website', 'is', null)
    .is('service_times', null);

  if (count && count > 0) {
    console.log(`💡 ${count} churches with websites still need extraction. Run again to continue.\n`);
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

main().catch((error) => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});
