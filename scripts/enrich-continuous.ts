#!/usr/bin/env npx tsx

/**
 * Continuous Church Enrichment Script
 *
 * Runs enrichment in a loop until all churches have AI content.
 * Automatically restarts after each batch completes.
 *
 * Usage:
 *   npx tsx scripts/enrich-continuous.ts
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { spawn } from 'child_process';

config({ path: resolve(process.cwd(), '.env.local') });

import { createClient } from '@supabase/supabase-js';

async function getUnenrichedCount(): Promise<number> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { count } = await supabase
    .from('churches')
    .select('*', { count: 'exact', head: true })
    .is('ai_description', null);

  return count ?? 0;
}

async function runEnrichmentBatch(): Promise<{ success: boolean; processed: number }> {
  return new Promise((resolve) => {
    const child = spawn('npx', ['tsx', 'scripts/enrich-churches.ts', '--all'], {
      cwd: process.cwd(),
      stdio: 'inherit',
      env: process.env,
    });

    child.on('close', (code) => {
      resolve({
        success: code === 0,
        processed: 1000, // Default batch size
      });
    });

    child.on('error', () => {
      resolve({ success: false, processed: 0 });
    });
  });
}

async function main() {
  console.log('\n🔄 Continuous Church Enrichment\n');
  console.log('   This script will run until all churches have AI content.');
  console.log('   Press Ctrl+C to stop.\n');

  let totalProcessed = 0;
  let batchNum = 0;

  while (true) {
    // Check how many churches still need enrichment
    const remaining = await getUnenrichedCount();

    if (remaining === 0) {
      console.log('\n🎉 All churches have been enriched!\n');
      console.log(`   Total processed in this session: ${totalProcessed}`);
      break;
    }

    batchNum++;
    console.log(`\n${'='.repeat(60)}`);
    console.log(`📦 Batch ${batchNum} - ${remaining} churches remaining`);
    console.log(`${'='.repeat(60)}\n`);

    const result = await runEnrichmentBatch();

    if (result.success) {
      totalProcessed += result.processed;
      console.log(`\n✅ Batch ${batchNum} complete. Total processed: ${totalProcessed}`);
    } else {
      console.log(`\n⚠️ Batch ${batchNum} had errors. Retrying in 10 seconds...`);
      await new Promise(r => setTimeout(r, 10000));
    }

    // Small delay between batches
    await new Promise(r => setTimeout(r, 2000));
  }
}

main().catch(err => {
  console.error('\n❌ Fatal error:', err);
  process.exit(1);
});
