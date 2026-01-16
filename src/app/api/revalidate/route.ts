import { revalidateTag as nextRevalidateTag, revalidatePath as nextRevalidatePath } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

// Secret token for cache revalidation - set this in your environment variables
const REVALIDATE_SECRET = process.env.REVALIDATE_SECRET;

// Wrapper for revalidateTag that handles Next.js 16+ API
// The second argument is a cache profile (string or { expire?: number })
function revalidateTag(tag: string) {
  return nextRevalidateTag(tag, { expire: 0 });
}

// Wrapper for revalidatePath that handles Next.js 16+ API
function revalidatePath(path: string) {
  return nextRevalidatePath(path, 'page');
}

/**
 * Cache Revalidation API
 *
 * Usage examples:
 *
 * Revalidate all state pages:
 *   POST /api/revalidate?secret=YOUR_SECRET
 *   Body: { "tag": "states" }
 *
 * Revalidate a specific state:
 *   POST /api/revalidate?secret=YOUR_SECRET
 *   Body: { "tag": "state-arizona" }
 *
 * Revalidate all city data:
 *   POST /api/revalidate?secret=YOUR_SECRET
 *   Body: { "tag": "cities" }
 *
 * Revalidate a specific city:
 *   POST /api/revalidate?secret=YOUR_SECRET
 *   Body: { "tag": "city-AZ-phoenix" }
 *
 * Revalidate all content:
 *   POST /api/revalidate?secret=YOUR_SECRET
 *   Body: { "tag": "state-content" } or { "tag": "city-content" }
 *
 * Revalidate a specific path:
 *   POST /api/revalidate?secret=YOUR_SECRET
 *   Body: { "path": "/churches/arizona" }
 *
 * Available cache tags:
 * - states, state-{slug}
 * - cities, city-{stateAbbr}-{citySlug}
 * - cities-with-counts, cities-{stateAbbr}
 * - churches, churches-{stateAbbr}-{cityName} (for city page church listings)
 * - church-counts, church-count-{stateAbbr}
 * - state-content, state-content-{stateAbbr}
 * - city-content, city-content-{stateAbbr}-{citySlug}
 * - featured-cities
 * - denomination-stats
 */
export async function POST(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get('secret');

  // Validate secret
  if (!REVALIDATE_SECRET) {
    return NextResponse.json(
      { error: 'REVALIDATE_SECRET not configured' },
      { status: 500 }
    );
  }

  if (secret !== REVALIDATE_SECRET) {
    return NextResponse.json(
      { error: 'Invalid secret' },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const { tag, path } = body;

    if (!tag && !path) {
      return NextResponse.json(
        { error: 'Must provide either "tag" or "path" in request body' },
        { status: 400 }
      );
    }

    if (tag) {
      revalidateTag(tag);
      return NextResponse.json({
        revalidated: true,
        type: 'tag',
        tag,
        timestamp: new Date().toISOString(),
      });
    }

    if (path) {
      revalidatePath(path);
      return NextResponse.json({
        revalidated: true,
        type: 'path',
        path,
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid request body', details: String(error) },
      { status: 400 }
    );
  }
}

// Also support GET for simple revalidations (useful for webhooks)
export async function GET(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get('secret');
  const tag = request.nextUrl.searchParams.get('tag');
  const path = request.nextUrl.searchParams.get('path');

  if (!REVALIDATE_SECRET) {
    return NextResponse.json(
      { error: 'REVALIDATE_SECRET not configured' },
      { status: 500 }
    );
  }

  if (secret !== REVALIDATE_SECRET) {
    return NextResponse.json(
      { error: 'Invalid secret' },
      { status: 401 }
    );
  }

  if (!tag && !path) {
    return NextResponse.json(
      { error: 'Must provide either "tag" or "path" query parameter' },
      { status: 400 }
    );
  }

  if (tag) {
    revalidateTag(tag);
    return NextResponse.json({
      revalidated: true,
      type: 'tag',
      tag,
      timestamp: new Date().toISOString(),
    });
  }

  if (path) {
    revalidatePath(path);
    return NextResponse.json({
      revalidated: true,
      type: 'path',
      path,
      timestamp: new Date().toISOString(),
    });
  }
}
