#!/usr/bin/env npx tsx

/**
 * Church Enrichment CLI Script
 *
 * Processes churches that need AI enrichment (description, what to expect, etc.)
 *
 * Usage:
 *   npx tsx scripts/enrich-churches.ts --batch 10
 *   npx tsx scripts/enrich-churches.ts --all
 *   npx tsx scripts/enrich-churches.ts --help
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });

import { createClient } from '@supabase/supabase-js';
import type { Church } from '../src/types/database';
import {
  AnthropicProvider,
  OpenAIProvider,
  type AIProvider,
  type ChurchContext,
  type CombinedEnrichment,
} from '../src/lib/services/church-enrichment';

// ============================================================================
// CLI PARSING
// ============================================================================

interface CLIOptions {
  batchSize: number;
  all: boolean;
  verbose: boolean;
  dryRun: boolean;
  skipWebsite: boolean;
}

function parseArgs(): CLIOptions {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Church Enrichment CLI

Usage:
  npx tsx scripts/enrich-churches.ts [options]

Options:
  --batch <number>    Number of churches to process (default: 10)
  --all               Process all churches without AI content
  --verbose           Show detailed progress
  --dry-run           Don't save to database, just show what would be generated
  --skip-website      Skip fetching website content (faster, less accurate)
  --help              Show this help message

Examples:
  npx tsx scripts/enrich-churches.ts --batch 10
  npx tsx scripts/enrich-churches.ts --batch 50 --verbose
  npx tsx scripts/enrich-churches.ts --all --skip-website
`);
    process.exit(0);
  }

  const getArg = (flag: string): string | undefined => {
    const idx = args.indexOf(flag);
    return idx !== -1 && idx + 1 < args.length ? args[idx + 1] : undefined;
  };

  return {
    batchSize: parseInt(getArg('--batch') ?? '10', 10),
    all: args.includes('--all'),
    verbose: args.includes('--verbose'),
    dryRun: args.includes('--dry-run'),
    skipWebsite: args.includes('--skip-website'),
  };
}

// ============================================================================
// WEBSITE FETCHING
// ============================================================================

async function fetchWebsiteContent(url: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'ChurchDirectory/1.0 (enrichment bot)',
      },
    });

    clearTimeout(timeout);

    if (!response.ok) {
      return null;
    }

    const html = await response.text();

    // Basic HTML to text conversion
    return html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 15000); // Limit to ~15k chars for AI context
  } catch {
    return null;
  }
}

// ============================================================================
// MAIN SCRIPT
// ============================================================================

async function main() {
  const options = parseArgs();

  console.log('\n✨ Church Enrichment Script\n');
  console.log(`   Batch size:    ${options.all ? 'ALL' : options.batchSize}`);
  console.log(`   Dry run:       ${options.dryRun}`);
  console.log(`   Skip website:  ${options.skipWebsite}`);
  console.log('');

  // Validate environment
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Error: Supabase credentials required');
    process.exit(1);
  }

  if (!anthropicKey && !openaiKey) {
    console.error('❌ Error: ANTHROPIC_API_KEY or OPENAI_API_KEY required');
    process.exit(1);
  }

  // Initialize Supabase (use any to avoid complex Supabase typing issues in scripts)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createClient(supabaseUrl, supabaseServiceKey) as any;

  // Initialize AI provider
  let aiProvider: AIProvider;
  if (anthropicKey) {
    aiProvider = new AnthropicProvider(anthropicKey, 'claude-3-haiku-20240307');
    console.log('   AI Provider:   Anthropic (Claude 3 Haiku)\n');
  } else {
    aiProvider = new OpenAIProvider(openaiKey!, 'gpt-4o-mini');
    console.log('   AI Provider:   OpenAI (GPT-4o-mini)\n');
  }

  // Get churches that need enrichment (no AI description)
  const baseQuery = supabase
    .from('churches')
    .select('*')
    .is('ai_description', null)
    .order('created_at', { ascending: true });

  const query = options.all ? baseQuery : baseQuery.limit(options.batchSize);

  const { data: churches, error } = await query;

  if (error) {
    console.error('❌ Error fetching churches:', error.message);
    process.exit(1);
  }

  if (!churches || churches.length === 0) {
    console.log('✅ All churches already have AI content!\n');
    process.exit(0);
  }

  console.log(`📋 Found ${churches.length} churches to enrich\n`);

  // Process each church
  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < churches.length; i++) {
    const church = churches[i];
    const progress = `[${i + 1}/${churches.length}]`;

    process.stdout.write(`${progress} ${church.name.slice(0, 40).padEnd(42)}`);

    try {
      // Fetch website content if available and not skipped
      let websiteContent: string | null = null;
      if (!options.skipWebsite && church.website) {
        websiteContent = await fetchWebsiteContent(church.website);
        if (options.verbose && websiteContent) {
          console.log(`\n        📄 Fetched ${websiteContent.length} chars from website`);
        }
      }

      // Build context for AI
      const context: ChurchContext = {
        name: church.name,
        city: church.city,
        state: church.state,
        denomination: church.denomination ?? undefined,
        website: church.website ?? undefined,
        websiteContent: websiteContent ?? undefined,
      };

      // Generate AI content with single API call
      const enrichment = await aiProvider.generateCombinedEnrichment(context);

      if (options.verbose) {
        console.log(`\n        📝 Description: ${enrichment.description.slice(0, 100)}...`);
        console.log(`        📝 What to expect: ${enrichment.whatToExpect.slice(0, 100)}...`);
      }

      if (!options.dryRun && enrichment.description && enrichment.whatToExpect) {
        // Update database
        const { error: updateError } = await supabase
          .from('churches')
          .update({
            ai_description: enrichment.description,
            ai_what_to_expect: enrichment.whatToExpect,
            ai_generated_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', church.id);

        if (updateError) {
          throw new Error(updateError.message);
        }
      }

      console.log('✅');
      successCount++;

      // Rate limit - 50 requests/minute limit, now using 1 API call per church
      // So we can do ~50 churches/minute = 1.2 seconds between churches
      await sleep(1300);
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      console.log(`❌ ${errMsg.slice(0, 50)}`);
      errorCount++;

      // Longer delay on error (rate limit may have kicked in)
      await sleep(3000);
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 Summary\n');
  console.log(`   Processed:  ${churches.length}`);
  console.log(`   Success:    ${successCount}`);
  console.log(`   Errors:     ${errorCount}`);

  if (options.dryRun) {
    console.log('\n🔍 Dry run - no data was saved\n');
  } else {
    console.log(`\n✅ Done! ${successCount} churches enriched\n`);
  }

  // Check remaining
  const { count } = await supabase
    .from('churches')
    .select('*', { count: 'exact', head: true })
    .is('ai_description', null);

  if (count && count > 0) {
    console.log(`💡 ${count} churches still need enrichment. Run again to continue.\n`);
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
