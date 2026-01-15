/**
 * Church Ingestion Service
 *
 * Handles importing churches from data providers into the database.
 * Includes deduplication, slug generation, and queueing for AI enrichment.
 */

import { createClient } from '@supabase/supabase-js';
import type { Database, Church } from '@/types/database';
import type { RawChurchData, ChurchSearchParams, ProviderType } from '../providers';
import { ProviderManager } from '../providers';

// Slug generation utilities
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-')     // Replace spaces with dashes
    .replace(/-+/g, '-')      // Replace multiple dashes with single dash
    .trim();
}

function generateChurchSlug(name: string, city: string): string {
  return `${slugify(name)}`;
}

// Deduplication key based on name and coordinates
function getDedupeKey(church: RawChurchData): string {
  // Round coordinates to ~111m precision for fuzzy matching
  const latRounded = Math.round(church.lat * 1000) / 1000;
  const lngRounded = Math.round(church.lng * 1000) / 1000;
  const nameNormalized = church.name.toLowerCase().replace(/[^\w]/g, '');
  return `${nameNormalized}_${latRounded}_${lngRounded}`;
}

export interface IngestionResult {
  imported: number;
  skipped: number;
  errors: number;
  churches: { id: string; name: string; slug: string }[];
  errorDetails: { name: string; error: string }[];
}

export interface IngestionOptions {
  skipDuplicates?: boolean;      // Skip if church already exists (default: true)
  updateExisting?: boolean;      // Update existing churches with new data (default: false)
  queueEnrichment?: boolean;     // Queue for AI enrichment (default: true)
  dryRun?: boolean;              // Don't actually insert, just return what would be inserted
}

export class ChurchIngestionService {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private supabase: any;
  private providerManager: ProviderManager;

  constructor(
    supabaseUrl: string,
    supabaseServiceKey: string,  // Use service role key for server-side operations
    providerManager: ProviderManager
  ) {
    this.supabase = createClient<Database>(supabaseUrl, supabaseServiceKey);
    this.providerManager = providerManager;
  }

  /**
   * Import churches from a provider into the database
   */
  async importFromProvider(
    params: ChurchSearchParams,
    provider?: ProviderType,
    options: IngestionOptions = {}
  ): Promise<IngestionResult> {
    const {
      skipDuplicates = true,
      updateExisting = false,
      queueEnrichment = true,
      dryRun = false,
    } = options;

    const result: IngestionResult = {
      imported: 0,
      skipped: 0,
      errors: 0,
      churches: [],
      errorDetails: [],
    };

    // Fetch churches from provider
    const searchResult = await this.providerManager.searchChurches(params, provider);
    let churches = searchResult.churches;

    // Handle pagination - fetch all pages
    let nextToken = searchResult.nextPageToken;
    while (nextToken) {
      const nextPage = await this.providerManager.searchChurches(
        { ...params, pageToken: nextToken },
        provider
      );
      churches = [...churches, ...nextPage.churches];
      nextToken = nextPage.nextPageToken;

      // Safety limit
      if (churches.length >= 500) break;
    }

    // Deduplicate within the batch
    const dedupeMap = new Map<string, RawChurchData>();
    for (const church of churches) {
      const key = getDedupeKey(church);
      if (!dedupeMap.has(key)) {
        dedupeMap.set(key, church);
      }
    }
    churches = Array.from(dedupeMap.values());

    // Check for existing churches if skipDuplicates is true
    let existingSourceIds: Set<string> = new Set();
    if (skipDuplicates) {
      const sourceIds = churches.map((c) => c.sourceId);
      const { data: existing } = await this.supabase
        .from('churches')
        .select('source_id')
        .in('source_id', sourceIds);

      existingSourceIds = new Set((existing ?? []).map((e: { source_id: string | null }) => e.source_id).filter(Boolean) as string[]);
    }

    // Process each church
    for (const rawChurch of churches) {
      try {
        // Skip if duplicate
        if (skipDuplicates && existingSourceIds.has(rawChurch.sourceId)) {
          result.skipped++;
          continue;
        }

        // Transform to database format
        const churchData = this.transformToDbFormat(rawChurch);

        if (dryRun) {
          result.imported++;
          result.churches.push({
            id: 'dry-run',
            name: churchData.name,
            slug: churchData.slug,
          });
          continue;
        }

        // Insert or update
        if (updateExisting && existingSourceIds.has(rawChurch.sourceId)) {
          const { data, error } = await this.supabase
            .from('churches')
            .update(churchData)
            .eq('source_id', rawChurch.sourceId)
            .select('id, name, slug')
            .single();

          if (error) throw error;

          result.imported++;
          result.churches.push(data);
        } else {
          const { data, error } = await this.supabase
            .from('churches')
            .insert(churchData)
            .select('id, name, slug')
            .single();

          if (error) throw error;

          result.imported++;
          result.churches.push(data);

          // Queue for enrichment
          if (queueEnrichment && data.id) {
            await this.queueForEnrichment(data.id);
          }
        }
      } catch (error) {
        result.errors++;
        result.errorDetails.push({
          name: rawChurch.name,
          error: error instanceof Error ? error.message : JSON.stringify(error),
        });
      }
    }

    return result;
  }

  /**
   * Import a single church by its source ID (for getting detailed data)
   */
  async importSingleChurch(
    sourceId: string,
    provider?: ProviderType,
    options: IngestionOptions = {}
  ): Promise<{ success: boolean; church?: Church; error?: string }> {
    try {
      const rawChurch = await this.providerManager.getChurchDetails(sourceId, provider);

      if (!rawChurch) {
        return { success: false, error: 'Church not found' };
      }

      const churchData = this.transformToDbFormat(rawChurch);

      if (options.dryRun) {
        return {
          success: true,
          church: { ...churchData, id: 'dry-run' } as Church,
        };
      }

      // Check if exists
      const { data: existing } = await this.supabase
        .from('churches')
        .select('id')
        .eq('source_id', rawChurch.sourceId)
        .maybeSingle();

      let data;
      if (existing) {
        // Update existing
        const { data: updated, error } = await this.supabase
          .from('churches')
          .update(churchData)
          .eq('id', existing.id)
          .select()
          .single();
        if (error) throw error;
        data = updated;
      } else {
        // Insert new
        const { data: inserted, error } = await this.supabase
          .from('churches')
          .insert(churchData)
          .select()
          .single();
        if (error) throw error;
        data = inserted;
      }

      if (options.queueEnrichment !== false && data.id) {
        await this.queueForEnrichment(data.id);
      }

      return { success: true, church: data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : JSON.stringify(error),
      };
    }
  }

  /**
   * Import churches from raw data (for manual imports or other sources)
   */
  async importRawData(
    churches: RawChurchData[],
    options: IngestionOptions = {}
  ): Promise<IngestionResult> {
    const result: IngestionResult = {
      imported: 0,
      skipped: 0,
      errors: 0,
      churches: [],
      errorDetails: [],
    };

    for (const rawChurch of churches) {
      try {
        const churchData = this.transformToDbFormat(rawChurch);

        if (options.dryRun) {
          result.imported++;
          result.churches.push({
            id: 'dry-run',
            name: churchData.name,
            slug: churchData.slug,
          });
          continue;
        }

        // Check if already exists by source_id
        const { data: existing } = await this.supabase
          .from('churches')
          .select('id')
          .eq('source_id', rawChurch.sourceId)
          .maybeSingle();

        if (existing) {
          result.skipped++;
          continue;
        }

        const { data, error } = await this.supabase
          .from('churches')
          .insert(churchData)
          .select('id, name, slug')
          .single();

        if (error) throw error;

        result.imported++;
        result.churches.push(data);

        if (options.queueEnrichment !== false && data.id) {
          await this.queueForEnrichment(data.id);
        }
      } catch (error) {
        result.errors++;
        result.errorDetails.push({
          name: rawChurch.name,
          error: error instanceof Error ? error.message : JSON.stringify(error),
        });
      }
    }

    return result;
  }

  /**
   * Transform raw provider data to database format
   */
  private transformToDbFormat(raw: RawChurchData): Omit<Church, 'id' | 'created_at' | 'updated_at' | 'location'> {
    return {
      slug: generateChurchSlug(raw.name, raw.city),
      name: raw.name,
      address: raw.address,
      city: raw.city,
      state: raw.state,
      state_abbr: raw.stateAbbr,
      zip: raw.zip,
      lat: raw.lat,
      lng: raw.lng,
      phone: raw.phone ?? null,
      email: raw.email ?? null,
      website: raw.website ?? null,
      denomination: raw.denomination ?? null,
      worship_style: null,  // To be filled by AI enrichment
      service_times: null,  // To be filled by AI enrichment
      has_kids_ministry: false,  // To be filled by AI enrichment
      has_youth_group: false,    // To be filled by AI enrichment
      has_small_groups: false,   // To be filled by AI enrichment
      ai_description: null,
      ai_what_to_expect: null,
      ai_generated_at: null,
      source: raw.source,
      source_id: raw.sourceId,
    };
  }

  /**
   * Queue a church for AI enrichment
   */
  private async queueForEnrichment(churchId: string): Promise<void> {
    // Insert into enrichment queue table (or use a simple flag)
    // For now, we'll use a separate table approach for better tracking
    await this.supabase
      .from('enrichment_queue')
      .upsert({
        church_id: churchId,
        status: 'pending',
        created_at: new Date().toISOString(),
      }, { onConflict: 'church_id' })
      .select();
  }

  /**
   * Get import statistics
   */
  async getStats(): Promise<{
    totalChurches: number;
    bySource: Record<string, number>;
    pendingEnrichment: number;
  }> {
    const { count: totalChurches } = await this.supabase
      .from('churches')
      .select('*', { count: 'exact', head: true });

    const { data: sourceCounts } = await this.supabase
      .from('churches')
      .select('source')
      .not('source', 'is', null);

    const bySource: Record<string, number> = {};
    for (const row of sourceCounts ?? []) {
      if (row.source) {
        bySource[row.source] = (bySource[row.source] ?? 0) + 1;
      }
    }

    const { count: pendingEnrichment } = await this.supabase
      .from('enrichment_queue')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    return {
      totalChurches: totalChurches ?? 0,
      bySource,
      pendingEnrichment: pendingEnrichment ?? 0,
    };
  }
}

/**
 * Create ingestion service from environment variables
 */
export function createIngestionServiceFromEnv(
  providerManager: ProviderManager
): ChurchIngestionService | null {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.warn('Supabase environment variables not set. Ingestion service disabled.');
    return null;
  }

  return new ChurchIngestionService(supabaseUrl, supabaseServiceKey, providerManager);
}
