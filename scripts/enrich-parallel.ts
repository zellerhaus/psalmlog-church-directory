#!/usr/bin/env npx tsx

/**
 * Parallel Church Enrichment Script (Combined)
 *
 * Runs multiple enrichment workers in parallel, each processing different states.
 * Generates BOTH:
 * - AI content (description, what to expect)
 * - Structured data (service times, ministries, denomination, worship style)
 *
 * Usage:
 *   npx tsx scripts/enrich-parallel.ts
 *   npx tsx scripts/enrich-parallel.ts --workers 8
 */

import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// ============================================================================
// CONFIGURATION
// ============================================================================

const DEFAULT_WORKERS = 5;
const BATCH_SIZE_PER_WORKER = 50;
const DELAY_BETWEEN_CHURCHES = 1000; // 1 second between API calls (5 workers, 100k input tokens/min)
const DELAY_ON_ERROR = 5000;

// All US states for distribution
const ALL_STATES = [
  'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado',
  'Connecticut', 'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho',
  'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana',
  'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi',
  'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey',
  'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma',
  'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota',
  'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington',
  'West Virginia', 'Wisconsin', 'Wyoming',
];

// ============================================================================
// TYPES
// ============================================================================

interface ServiceTime {
  day: string;
  time: string;
  name?: string;
}

interface CombinedEnrichment {
  description: string;
  whatToExpect: string;
  denomination?: string;
  worshipStyle?: string[];
  serviceTimes?: ServiceTime[];
  hasKidsMinistry?: boolean;
  hasYouthGroup?: boolean;
  hasSmallGroups?: boolean;
}

// ============================================================================
// WEBSITE FETCHING
// ============================================================================

interface WebsiteData {
  content: string | null;
  email: string | null;
}

function extractEmail(html: string): string | null {
  // Extract emails from HTML - prioritize general inbox emails
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const emails = html.match(emailRegex) || [];

  // Filter out common non-contact emails and duplicates
  const validEmails = [...new Set(emails)]
    .filter(email => {
      const lower = email.toLowerCase();
      // Skip common non-contact emails and placeholders
      if (lower.includes('example.com')) return false;
      if (lower.includes('domain.com')) return false;
      if (lower.includes('sentry')) return false;
      if (lower.includes('wixpress')) return false;
      if (lower.includes('wix.com')) return false;
      if (lower.includes('wordpress')) return false;
      if (lower.includes('schema.org')) return false;
      if (lower.includes('mailchimp')) return false;
      if (lower.includes('constantcontact')) return false;
      if (lower.includes('hubspot')) return false;
      if (lower.includes('google.com')) return false;
      if (lower.includes('facebook.com')) return false;
      if (lower.includes('twitter.com')) return false;
      if (lower.includes('.png')) return false;
      if (lower.includes('.jpg')) return false;
      if (lower.includes('.gif')) return false;
      if (lower.includes('.svg')) return false;
      if (lower.endsWith('.js')) return false;
      if (lower.endsWith('.css')) return false;
      if (lower.startsWith('user@')) return false;
      if (lower.startsWith('test@')) return false;
      if (lower.startsWith('noreply@')) return false;
      if (lower.startsWith('no-reply@')) return false;
      return true;
    });

  if (validEmails.length === 0) return null;

  // Prioritize general inbox emails
  const priorityPrefixes = ['info@', 'contact@', 'office@', 'admin@', 'hello@', 'church@', 'mail@', 'email@', 'general@'];
  for (const prefix of priorityPrefixes) {
    const match = validEmails.find(e => e.toLowerCase().startsWith(prefix));
    if (match) return match.toLowerCase();
  }

  // Return first valid email found
  return validEmails[0]?.toLowerCase() || null;
}

async function fetchWebsiteContent(url: string): Promise<WebsiteData> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'ChurchDirectory/1.0 (enrichment bot)',
      },
    });

    clearTimeout(timeout);

    if (!response.ok) return { content: null, email: null };

    const html = await response.text();

    // Extract email from raw HTML before cleaning
    const email = extractEmail(html);

    const content = html
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
      .slice(0, 15000);

    return { content, email };
  } catch {
    return { content: null, email: null };
  }
}

// ============================================================================
// DENOMINATION INFERENCE
// ============================================================================

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
    [/\bnazarene\b/, 'Church of the Nazarene'],
    [/\bfoursquare\b/, 'Foursquare'],
    [/\bvineyard\b/, 'Vineyard'],
    [/\bmennonite\b/, 'Mennonite'],
    [/\borthodox\b/, 'Orthodox'],
    [/\bcongregational\b/, 'Congregational'],
    [/\bevangelical free\b/, 'Evangelical Free'],
    [/\bseventh.?day adventist\b/, 'Seventh-day Adventist'],
    [/\bapostolic\b/, 'Apostolic'],
    [/\bcovenant\b/, 'Covenant'],
    [/\breformed\b/, 'Reformed'],
  ];

  for (const [pattern, denomination] of patterns) {
    if (pattern.test(nameLower)) {
      return denomination;
    }
  }

  return null;
}

// ============================================================================
// COMBINED AI ENRICHMENT
// ============================================================================

async function generateCombinedEnrichment(
  church: {
    name: string;
    city: string;
    state: string;
    denomination?: string;
    website?: string;
  },
  websiteContent: string | null,
  apiKey: string
): Promise<CombinedEnrichment> {
  const prompt = `You are helping create content for a church directory. Analyze this church and provide BOTH descriptive content AND structured data.

Church: ${church.name}
Location: ${church.city}, ${church.state}
${church.denomination ? `Denomination: ${church.denomination}` : ''}
${church.website ? `Website: ${church.website}` : ''}

${websiteContent ? `Website content:\n${websiteContent.slice(0, 12000)}` : 'No website content available.'}

Return ONLY valid JSON with this exact structure (no markdown, no explanation):
{
  "description": "2-3 sentences describing this church. Be factual, welcoming, and write in third person. Mention location, denomination if known, and any notable features.",
  "whatToExpect": "A visitor guide with sections separated by line breaks. Include:\\n- Dress code expectations\\n- Service format/structure\\n- Tips for first-time visitors (parking, where to go)\\nBe helpful and welcoming.",
  "denomination": "string or null - e.g., 'Baptist', 'Methodist', 'Non-denominational', 'Catholic'. Only if clearly known.",
  "worshipStyle": ["Contemporary", "Traditional", "Blended"] or null - array of applicable styles, or null if unknown,
  "serviceTimes": [{"day": "Sunday", "time": "9:00 AM", "name": "Morning Worship"}] or null - actual service times if found,
  "hasKidsMinistry": true/false/null - true if children's ministry, kids church, nursery mentioned,
  "hasYouthGroup": true/false/null - true if youth/student ministry mentioned,
  "hasSmallGroups": true/false/null - true if small groups, life groups, Bible studies mentioned
}

Rules:
- Description should be 2-3 sentences, factual and welcoming
- For whatToExpect, use \\n for line breaks between sections
- Return null for structured fields where information is not clearly available
- For serviceTimes, only include actual worship service times (not office hours)
- Be conservative - only include data you're confident about`;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Anthropic API error: ${response.status} - ${error.slice(0, 200)}`);
  }

  const data = await response.json();
  const content = data.content[0]?.text ?? '{}';

  // Extract JSON from response
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('No JSON found in response');
  }

  let parsed;
  try {
    parsed = JSON.parse(jsonMatch[0]);
  } catch (parseError) {
    console.error('JSON parse error:', parseError);
    console.error('Raw content:', content.slice(0, 500));
    throw new Error('Failed to parse JSON response');
  }

  return {
    description: parsed.description || '',
    whatToExpect: parsed.whatToExpect || '',
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
}

// ============================================================================
// WORKER CLASS
// ============================================================================

interface WorkerStats {
  workerId: number;
  processed: number;
  success: number;
  errors: number;
  currentState: string;
}

class EnrichmentWorker {
  private workerId: number;
  private states: string[];
  private supabase: SupabaseClient;
  private apiKey: string;
  private stats: WorkerStats;
  private running: boolean = true;

  constructor(
    workerId: number,
    states: string[],
    supabase: SupabaseClient,
    apiKey: string
  ) {
    this.workerId = workerId;
    this.states = states;
    this.supabase = supabase;
    this.apiKey = apiKey;
    this.stats = {
      workerId,
      processed: 0,
      success: 0,
      errors: 0,
      currentState: '',
    };
  }

  async run(): Promise<WorkerStats> {
    console.log(`[Worker ${this.workerId}] Starting with states: ${this.states.join(', ')}`);

    for (const state of this.states) {
      if (!this.running) break;

      this.stats.currentState = state;
      await this.processState(state);
    }

    console.log(`[Worker ${this.workerId}] ✅ Completed all assigned states`);
    return this.stats;
  }

  private async processState(state: string): Promise<void> {
    console.log(`[Worker ${this.workerId}] Processing ${state}...`);

    while (this.running) {
      // Get batch of unenriched churches for this state
      const { data: churches, error } = await this.supabase
        .from('churches')
        .select('*')
        .eq('state', state)
        .is('ai_description', null)
        .limit(BATCH_SIZE_PER_WORKER);

      if (error) {
        console.error(`[Worker ${this.workerId}] Error fetching churches:`, error.message);
        await sleep(DELAY_ON_ERROR);
        continue;
      }

      if (!churches || churches.length === 0) {
        console.log(`[Worker ${this.workerId}] ✓ ${state} complete`);
        break;
      }

      // Process each church
      for (const church of churches) {
        if (!this.running) break;

        try {
          // Fetch website content and extract email
          let websiteContent: string | null = null;
          let extractedEmail: string | null = null;
          if (church.website) {
            const websiteData = await fetchWebsiteContent(church.website);
            websiteContent = websiteData.content;
            extractedEmail = websiteData.email;
          }

          // Generate combined enrichment (description + structured data)
          const enrichment = await generateCombinedEnrichment(
            {
              name: church.name,
              city: church.city,
              state: church.state,
              denomination: church.denomination ?? undefined,
              website: church.website ?? undefined,
            },
            websiteContent,
            this.apiKey
          );

          if (!enrichment.description || !enrichment.whatToExpect) {
            // Check if name looks like a church
            const nameLower = church.name.toLowerCase();
            const looksLikeChurch = /church|chapel|ministry|ministries|worship|temple|fellowship|congregation|parish|cathedral|tabernacle|gospel|sanctuary|christian|baptist|methodist|lutheran|presbyterian|catholic|episcopal|pentecostal|nazarene|adventist|apostolic|assembly/i.test(nameLower);

            if (looksLikeChurch) {
              // Mark as needs review but keep it
              console.log(`[Worker ${this.workerId}] Empty enrichment for ${church.name} - marking for review`);
              const { error: updateError } = await this.supabase
                .from('churches')
                .update({
                  ai_description: 'NEEDS_REVIEW',
                  updated_at: new Date().toISOString(),
                })
                .eq('id', church.id);
              if (updateError) {
                console.error(`[Worker ${this.workerId}] Error marking ${church.name}:`, updateError.message);
              }
            } else {
              // Delete entries that don't look like churches and return no data
              console.log(`[Worker ${this.workerId}] Empty enrichment for ${church.name} - deleting as non-church`);
              const { error: deleteError } = await this.supabase
                .from('churches')
                .delete()
                .eq('id', church.id);
              if (deleteError) {
                console.error(`[Worker ${this.workerId}] Error deleting ${church.name}:`, deleteError.message);
              }
            }
            this.stats.processed++;
            await sleep(DELAY_BETWEEN_CHURCHES);
            continue;
          }

          if (enrichment.description && enrichment.whatToExpect) {
            // Determine denomination (from AI or inferred from name)
            const denomination = enrichment.denomination
              || church.denomination
              || inferDenominationFromName(church.name);

            // Build update object
            const updateData: Record<string, unknown> = {
              ai_description: enrichment.description,
              ai_what_to_expect: enrichment.whatToExpect,
              ai_generated_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            };

            // Add structured data if available
            if (denomination) {
              updateData.denomination = denomination;
            }
            if (enrichment.worshipStyle) {
              updateData.worship_style = enrichment.worshipStyle;
            }
            if (enrichment.serviceTimes) {
              updateData.service_times = enrichment.serviceTimes;
            }
            if (enrichment.hasKidsMinistry !== undefined) {
              updateData.has_kids_ministry = enrichment.hasKidsMinistry;
            }
            if (enrichment.hasYouthGroup !== undefined) {
              updateData.has_youth_group = enrichment.hasYouthGroup;
            }
            if (enrichment.hasSmallGroups !== undefined) {
              updateData.has_small_groups = enrichment.hasSmallGroups;
            }
            // Add email if extracted from website
            if (extractedEmail) {
              updateData.email = extractedEmail;
            }

            // Update database
            const { error: updateError } = await this.supabase
              .from('churches')
              .update(updateData)
              .eq('id', church.id);

            if (updateError) {
              throw new Error(updateError.message);
            }

            this.stats.success++;
          }

          this.stats.processed++;
          await sleep(DELAY_BETWEEN_CHURCHES);
        } catch (error) {
          this.stats.errors++;
          this.stats.processed++;
          console.error(
            `[Worker ${this.workerId}] Error enriching ${church.name}:`,
            error instanceof Error ? error.message : error
          );
          await sleep(DELAY_ON_ERROR);
        }
      }

      // Log progress
      console.log(
        `[Worker ${this.workerId}] ${state}: ${this.stats.success} enriched, ${this.stats.errors} errors`
      );
    }
  }

  stop(): void {
    this.running = false;
  }
}

// ============================================================================
// MAIN
// ============================================================================

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function distributeStates(states: string[], numWorkers: number): string[][] {
  const distribution: string[][] = Array.from({ length: numWorkers }, () => []);

  states.forEach((state, index) => {
    distribution[index % numWorkers].push(state);
  });

  return distribution;
}

async function main() {
  const args = process.argv.slice(2);
  const workersIdx = args.indexOf('--workers');
  const numWorkers = workersIdx !== -1 ? parseInt(args[workersIdx + 1], 10) : DEFAULT_WORKERS;

  console.log('\n🚀 Parallel Church Enrichment (Combined)\n');
  console.log(`   Workers:        ${numWorkers}`);
  console.log(`   States:         ${ALL_STATES.length}`);
  console.log(`   Batch size:     ${BATCH_SIZE_PER_WORKER} per worker`);
  console.log(`   Generates:      Description + What to Expect + Structured Data`);
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

  // Get initial counts
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const { count: totalUnenriched } = await supabase
    .from('churches')
    .select('*', { count: 'exact', head: true })
    .is('ai_description', null);

  console.log(`📋 Churches to enrich: ${totalUnenriched?.toLocaleString()}\n`);

  // Distribute states among workers
  const stateDistribution = distributeStates(ALL_STATES, numWorkers);

  // Create workers
  const workers: EnrichmentWorker[] = [];

  for (let i = 0; i < numWorkers; i++) {
    const workerSupabase = createClient(supabaseUrl, supabaseServiceKey);
    const worker = new EnrichmentWorker(i + 1, stateDistribution[i], workerSupabase, anthropicKey);
    workers.push(worker);

    console.log(`[Worker ${i + 1}] Assigned ${stateDistribution[i].length} states`);
  }

  console.log('\n' + '='.repeat(60) + '\n');

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n\n🛑 Shutting down workers...');
    workers.forEach((w) => w.stop());
  });

  // Run all workers in parallel
  const results = await Promise.all(workers.map((w) => w.run()));

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('\n📊 Final Results:\n');

  let totalProcessed = 0;
  let totalSuccess = 0;
  let totalErrors = 0;

  results.forEach((stats) => {
    console.log(`   Worker ${stats.workerId}: ${stats.success} enriched, ${stats.errors} errors`);
    totalProcessed += stats.processed;
    totalSuccess += stats.success;
    totalErrors += stats.errors;
  });

  console.log('');
  console.log(`   Total processed: ${totalProcessed}`);
  console.log(`   Total enriched:  ${totalSuccess}`);
  console.log(`   Total errors:    ${totalErrors}`);
  console.log('');

  // Final count
  const { count: remaining } = await supabase
    .from('churches')
    .select('*', { count: 'exact', head: true })
    .is('ai_description', null);

  console.log(`📋 Churches still needing enrichment: ${remaining?.toLocaleString()}\n`);
}

main().catch(console.error);
