#!/usr/bin/env npx tsx

/**
 * Location Content Generation CLI Script
 *
 * Generates pre-computed content for state and city pages including:
 * - Aggregated statistics from church data
 * - AI-enhanced overview and visitor guide content
 * - FAQ content for Google rich snippets
 *
 * Usage:
 *   npx tsx scripts/generate-location-content.ts --states
 *   npx tsx scripts/generate-location-content.ts --cities
 *   npx tsx scripts/generate-location-content.ts --all
 *   npx tsx scripts/generate-location-content.ts --stats-only
 *   npx tsx scripts/generate-location-content.ts --state TX
 *   npx tsx scripts/generate-location-content.ts --help
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });

import { createClient } from '@supabase/supabase-js';
import { US_STATES } from '../src/lib/constants';
import {
  LocationContentService,
  AnthropicLocationProvider,
  OpenAILocationProvider,
  type AIProvider,
} from '../src/lib/services/location-content-service';

// ============================================================================
// CLI PARSING
// ============================================================================

interface CLIOptions {
  states: boolean;
  cities: boolean;
  all: boolean;
  state: string | null;
  statsOnly: boolean;
  batchSize: number;
  dryRun: boolean;
  verbose: boolean;
}

function parseArgs(): CLIOptions {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Location Content Generation CLI

Usage:
  npx tsx scripts/generate-location-content.ts [options]

Options:
  --states           Generate content for all states
  --cities           Generate content for all cities
  --all              Generate content for states and cities
  --state <abbr>     Generate for specific state (e.g., TX, CA)
  --stats-only       Only update statistics (no AI generation)
  --batch <number>   Limit cities processed (default: unlimited)
  --dry-run          Don't save to database
  --verbose          Show detailed progress
  --help             Show this help message

Examples:
  npx tsx scripts/generate-location-content.ts --states
  npx tsx scripts/generate-location-content.ts --cities --state TX
  npx tsx scripts/generate-location-content.ts --all --stats-only
  npx tsx scripts/generate-location-content.ts --state CA --verbose

NPM Scripts (package.json):
  npm run content:states     # Generate all state content
  npm run content:cities     # Generate all city content
  npm run content:all        # Generate everything
  npm run content:stats      # Stats-only refresh (free)
`);
    process.exit(0);
  }

  const getArg = (flag: string): string | undefined => {
    const idx = args.indexOf(flag);
    return idx !== -1 && idx + 1 < args.length ? args[idx + 1] : undefined;
  };

  return {
    states: args.includes('--states'),
    cities: args.includes('--cities'),
    all: args.includes('--all'),
    state: getArg('--state') ?? null,
    statsOnly: args.includes('--stats-only'),
    batchSize: parseInt(getArg('--batch') ?? '0', 10),
    dryRun: args.includes('--dry-run'),
    verbose: args.includes('--verbose'),
  };
}

// ============================================================================
// MAIN SCRIPT
// ============================================================================

async function main() {
  const options = parseArgs();

  // If no mode specified, show help
  if (!options.states && !options.cities && !options.all && !options.state) {
    console.log('\n⚠️  No mode specified. Use --help for usage.\n');
    process.exit(1);
  }

  console.log('\n📄 Location Content Generation\n');
  console.log('   Mode:          ' + getModeDescription(options));
  console.log('   Stats only:    ' + options.statsOnly);
  console.log('   Dry run:       ' + options.dryRun);
  if (options.state) {
    console.log('   Target state:  ' + options.state);
  }
  console.log('');

  // Validate environment
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Error: Supabase credentials required');
    console.error('   Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY\n');
    process.exit(1);
  }

  // Initialize Supabase
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Initialize AI provider (only if not stats-only)
  let aiProvider: AIProvider | null = null;
  if (!options.statsOnly) {
    if (anthropicKey) {
      aiProvider = new AnthropicLocationProvider(
        anthropicKey,
        process.env.ANTHROPIC_MODEL || 'claude-3-haiku-20240307'
      );
      console.log('   AI Provider:   Anthropic (Claude 3 Haiku)\n');
    } else if (openaiKey) {
      aiProvider = new OpenAILocationProvider(
        openaiKey,
        process.env.OPENAI_MODEL || 'gpt-4o-mini'
      );
      console.log('   AI Provider:   OpenAI (GPT-4o-mini)\n');
    } else {
      console.log('   AI Provider:   None (using templates only)\n');
    }
  } else {
    console.log('   AI Provider:   Skipped (stats-only mode)\n');
  }

  // Create content service
  const contentService = new LocationContentService(supabase, aiProvider);

  // Process states
  if (options.states || options.all || options.state) {
    await processStates(contentService, options);
  }

  // Process cities
  if (options.cities || options.all || options.state) {
    await processCities(contentService, options);
  }

  console.log('\n✅ Done!\n');
}

async function processStates(
  service: LocationContentService,
  options: CLIOptions
): Promise<void> {
  console.log('📊 Processing States\n');

  const stateFilter = options.state;
  const statesToProcess = stateFilter
    ? US_STATES.filter((s) => s.abbr === stateFilter.toUpperCase())
    : US_STATES;

  if (options.state && statesToProcess.length === 0) {
    console.log(`   ⚠️  State "${options.state}" not found\n`);
    return;
  }

  let successCount = 0;
  let errorCount = 0;

  for (const state of statesToProcess) {
    process.stdout.write(`   ${state.name.padEnd(25)}`);

    try {
      const content = await service.generateStateContent(
        state.abbr,
        state.name,
        { skipAI: options.statsOnly }
      );

      if (options.verbose) {
        console.log(`\n      Churches: ${content.stats.church_count}`);
        console.log(`      Cities: ${content.stats.city_count}`);
        console.log(`      FAQs: ${content.faqs.length}`);
        if (content.overview) {
          console.log(`      Overview: ${content.overview.slice(0, 80)}...`);
        }
      }

      if (!options.dryRun) {
        await service.saveStateContent(content);
      }

      console.log(`✅ ${content.stats.church_count} churches`);
      successCount++;

      // Rate limiting for AI calls
      if (!options.statsOnly) {
        await sleep(1500);
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.log(`❌ ${msg.slice(0, 50)}`);
      errorCount++;
    }
  }

  console.log(`\n   States: ${successCount} success, ${errorCount} errors\n`);
}

async function processCities(
  service: LocationContentService,
  options: CLIOptions
): Promise<void> {
  console.log('🏙️  Processing Cities\n');

  // Determine which states to process cities for
  const stateFilter = options.state;
  const targetStates = stateFilter
    ? US_STATES.filter((s) => s.abbr === stateFilter.toUpperCase())
    : US_STATES;

  let totalProcessed = 0;
  let totalSuccess = 0;
  let totalErrors = 0;

  for (const state of targetStates) {
    // Get all cities for this state
    const cities = await service.getCitiesForState(state.abbr);

    if (cities.length === 0) {
      continue;
    }

    console.log(`   ${state.name} (${cities.length} cities)`);

    let processed = 0;
    for (const city of cities) {
      // Check batch limit
      if (options.batchSize > 0 && totalProcessed >= options.batchSize) {
        console.log(`\n   Batch limit reached (${options.batchSize})\n`);
        break;
      }

      process.stdout.write(`      ${city.city.padEnd(30)}`);

      try {
        const content = await service.generateCityContent(
          city.slug,
          city.city,
          state.abbr,
          state.name,
          { skipAI: options.statsOnly }
        );

        if (options.verbose) {
          console.log(`\n         Churches: ${content.stats.church_count}`);
          console.log(`         FAQs: ${content.faqs.length}`);
        }

        if (!options.dryRun) {
          await service.saveCityContent(content);
        }

        console.log(`✅ ${content.stats.church_count}`);
        totalSuccess++;

        // Rate limiting for AI calls (only for cities with enough data)
        if (!options.statsOnly && content.stats.church_count >= 5) {
          await sleep(1500);
        } else if (!options.statsOnly) {
          await sleep(200); // Short delay for template-only
        }
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        console.log(`❌ ${msg.slice(0, 40)}`);
        totalErrors++;
      }

      processed++;
      totalProcessed++;
    }

    // Break out of state loop if batch limit reached
    if (options.batchSize > 0 && totalProcessed >= options.batchSize) {
      break;
    }
  }

  console.log(`\n   Cities: ${totalSuccess} success, ${totalErrors} errors\n`);
}

function getModeDescription(options: CLIOptions): string {
  if (options.all) return 'All (states + cities)';
  if (options.state) return `Single state (${options.state.toUpperCase()})`;
  if (options.states && options.cities) return 'States + Cities';
  if (options.states) return 'States only';
  if (options.cities) return 'Cities only';
  return 'Unknown';
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Run
main().catch((error) => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});
