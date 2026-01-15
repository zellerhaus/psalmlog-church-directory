/**
 * Church Enrichment API
 *
 * POST /api/admin/enrich - Process enrichment queue
 * GET /api/admin/enrich - Get queue statistics
 */

import { NextRequest, NextResponse } from 'next/server';
import { createEnrichmentServiceFromEnv } from '@/lib/services/church-enrichment';

function isAuthorized(request: NextRequest): boolean {
  const authHeader = request.headers.get('Authorization');
  const apiKey = process.env.ADMIN_API_KEY;
  if (!apiKey) return false;
  return authHeader === `Bearer ${apiKey}`;
}

/**
 * POST /api/admin/enrich
 *
 * Process churches in the enrichment queue
 */
export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const { batchSize = 10, churchId } = body as {
      batchSize?: number;
      churchId?: string;  // Optional: enrich a specific church
    };

    const enrichmentService = createEnrichmentServiceFromEnv();

    if (!enrichmentService) {
      return NextResponse.json(
        { error: 'Enrichment service not configured (check Supabase and AI provider env vars)' },
        { status: 500 }
      );
    }

    // Enrich specific church or process queue
    if (churchId) {
      const result = await enrichmentService.enrichChurch(churchId);
      return NextResponse.json({
        success: result.success,
        result,
      });
    }

    // Process queue
    const results = await enrichmentService.processQueue(Math.min(batchSize, 50));

    const successful = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

    return NextResponse.json({
      success: true,
      processed: results.length,
      successful,
      failed,
      results,
    });
  } catch (error) {
    console.error('Enrichment error:', error);
    return NextResponse.json(
      {
        error: 'Enrichment failed',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/enrich
 *
 * Get enrichment queue statistics
 */
export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const enrichmentService = createEnrichmentServiceFromEnv();

    if (!enrichmentService) {
      return NextResponse.json(
        { error: 'Enrichment service not configured' },
        { status: 500 }
      );
    }

    const stats = await enrichmentService.getQueueStats();

    return NextResponse.json({
      queue: stats,
      aiProvider: process.env.ANTHROPIC_API_KEY ? 'anthropic' : process.env.OPENAI_API_KEY ? 'openai' : 'none',
    });
  } catch (error) {
    console.error('Stats error:', error);
    return NextResponse.json(
      { error: 'Failed to get stats' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/enrich
 *
 * Retry failed enrichments
 */
export async function PUT(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const { limit = 100 } = body as { limit?: number };

    const enrichmentService = createEnrichmentServiceFromEnv();

    if (!enrichmentService) {
      return NextResponse.json(
        { error: 'Enrichment service not configured' },
        { status: 500 }
      );
    }

    const retriedCount = await enrichmentService.retryFailed(limit);

    return NextResponse.json({
      success: true,
      retriedCount,
    });
  } catch (error) {
    console.error('Retry error:', error);
    return NextResponse.json(
      { error: 'Retry failed' },
      { status: 500 }
    );
  }
}
