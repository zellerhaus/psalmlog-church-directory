/**
 * Church Import API
 *
 * POST /api/admin/import
 *
 * Import churches from configured data providers.
 * Protected by API key authentication.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createProviderManagerFromEnv, type ProviderType } from '@/lib/providers';
import { createIngestionServiceFromEnv } from '@/lib/services/church-ingestion';

// Simple API key auth for admin routes
function isAuthorized(request: NextRequest): boolean {
  const authHeader = request.headers.get('Authorization');
  const apiKey = process.env.ADMIN_API_KEY;

  if (!apiKey) {
    console.warn('ADMIN_API_KEY not set - admin routes disabled');
    return false;
  }

  return authHeader === `Bearer ${apiKey}`;
}

export async function POST(request: NextRequest) {
  // Auth check
  if (!isAuthorized(request)) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();

    const {
      city,
      state,
      lat,
      lng,
      radiusMiles,
      provider,
      limit,
      skipDuplicates = true,
      updateExisting = false,
      queueEnrichment = true,
      dryRun = false,
    } = body as {
      city?: string;
      state?: string;
      lat?: number;
      lng?: number;
      radiusMiles?: number;
      provider?: ProviderType;
      limit?: number;
      skipDuplicates?: boolean;
      updateExisting?: boolean;
      queueEnrichment?: boolean;
      dryRun?: boolean;
    };

    // Validate required params
    if ((!city || !state) && (!lat || !lng)) {
      return NextResponse.json(
        { error: 'Must provide either city/state or lat/lng coordinates' },
        { status: 400 }
      );
    }

    // Initialize services
    const providerManager = createProviderManagerFromEnv();
    const ingestionService = createIngestionServiceFromEnv(providerManager);

    if (!ingestionService) {
      return NextResponse.json(
        { error: 'Ingestion service not configured (check Supabase env vars)' },
        { status: 500 }
      );
    }

    // Check if requested provider is available
    if (provider && !providerManager.getAvailableProviders().includes(provider)) {
      return NextResponse.json(
        {
          error: `Provider ${provider} not configured`,
          availableProviders: providerManager.getAvailableProviders(),
        },
        { status: 400 }
      );
    }

    // Run import
    const result = await ingestionService.importFromProvider(
      {
        city,
        state,
        lat,
        lng,
        radiusMiles,
        limit,
      },
      provider,
      {
        skipDuplicates,
        updateExisting,
        queueEnrichment,
        dryRun,
      }
    );

    return NextResponse.json({
      success: true,
      dryRun,
      provider: provider ?? 'default',
      location: city && state ? `${city}, ${state}` : `${lat}, ${lng}`,
      result,
    });
  } catch (error) {
    console.error('Import error:', error);
    return NextResponse.json(
      {
        error: 'Import failed',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/import
 *
 * Get import statistics and available providers
 */
export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const providerManager = createProviderManagerFromEnv();
    const ingestionService = createIngestionServiceFromEnv(providerManager);

    if (!ingestionService) {
      return NextResponse.json(
        { error: 'Ingestion service not configured' },
        { status: 500 }
      );
    }

    const stats = await ingestionService.getStats();
    const availableProviders = providerManager.getAvailableProviders();

    return NextResponse.json({
      availableProviders,
      stats,
    });
  } catch (error) {
    console.error('Stats error:', error);
    return NextResponse.json(
      { error: 'Failed to get stats' },
      { status: 500 }
    );
  }
}
