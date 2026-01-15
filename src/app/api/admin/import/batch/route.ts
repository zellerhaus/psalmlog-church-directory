/**
 * Batch Import API
 *
 * POST /api/admin/import/batch
 *
 * Import churches from multiple cities in one request.
 * Useful for seeding the database with initial data.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createProviderManagerFromEnv, type ProviderType } from '@/lib/providers';
import { createIngestionServiceFromEnv, type IngestionResult } from '@/lib/services/church-ingestion';

// Simple API key auth
function isAuthorized(request: NextRequest): boolean {
  const authHeader = request.headers.get('Authorization');
  const apiKey = process.env.ADMIN_API_KEY;
  if (!apiKey) return false;
  return authHeader === `Bearer ${apiKey}`;
}

interface BatchLocation {
  city: string;
  state: string;
  radiusMiles?: number;
}

interface BatchResult {
  location: string;
  success: boolean;
  result?: IngestionResult;
  error?: string;
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();

    const {
      locations,
      provider,
      limitPerLocation = 50,
      skipDuplicates = true,
      queueEnrichment = true,
      dryRun = false,
      delayBetweenMs = 1000, // Delay between API calls to avoid rate limits
    } = body as {
      locations: BatchLocation[];
      provider?: ProviderType;
      limitPerLocation?: number;
      skipDuplicates?: boolean;
      queueEnrichment?: boolean;
      dryRun?: boolean;
      delayBetweenMs?: number;
    };

    if (!locations || !Array.isArray(locations) || locations.length === 0) {
      return NextResponse.json(
        { error: 'Must provide locations array with city/state objects' },
        { status: 400 }
      );
    }

    // Limit batch size to prevent timeouts
    if (locations.length > 50) {
      return NextResponse.json(
        { error: 'Maximum 50 locations per batch request' },
        { status: 400 }
      );
    }

    const providerManager = createProviderManagerFromEnv();
    const ingestionService = createIngestionServiceFromEnv(providerManager);

    if (!ingestionService) {
      return NextResponse.json(
        { error: 'Ingestion service not configured' },
        { status: 500 }
      );
    }

    const results: BatchResult[] = [];
    let totalImported = 0;
    let totalSkipped = 0;
    let totalErrors = 0;

    for (let i = 0; i < locations.length; i++) {
      const loc = locations[i];

      try {
        const result = await ingestionService.importFromProvider(
          {
            city: loc.city,
            state: loc.state,
            radiusMiles: loc.radiusMiles,
            limit: limitPerLocation,
          },
          provider,
          {
            skipDuplicates,
            queueEnrichment,
            dryRun,
          }
        );

        results.push({
          location: `${loc.city}, ${loc.state}`,
          success: true,
          result,
        });

        totalImported += result.imported;
        totalSkipped += result.skipped;
        totalErrors += result.errors;

        // Delay between requests (except for last one)
        if (i < locations.length - 1 && delayBetweenMs > 0) {
          await new Promise((resolve) => setTimeout(resolve, delayBetweenMs));
        }
      } catch (error) {
        results.push({
          location: `${loc.city}, ${loc.state}`,
          success: false,
          error: error instanceof Error ? error.message : String(error),
        });
        totalErrors++;
      }
    }

    return NextResponse.json({
      success: true,
      dryRun,
      provider: provider ?? 'default',
      summary: {
        locationsProcessed: locations.length,
        totalImported,
        totalSkipped,
        totalErrors,
      },
      results,
    });
  } catch (error) {
    console.error('Batch import error:', error);
    return NextResponse.json(
      {
        error: 'Batch import failed',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
