import { NextRequest } from 'next/server';
import { SITE_URL, US_STATES } from '@/lib/constants';
import { getCitiesWithChurchCounts } from '@/lib/data';

// Generate XML sitemap index for a state - lists city sitemaps
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ state: string }> }
) {
  const { state: stateSlug } = await params;

  // Find state info
  const stateInfo = US_STATES.find((s) => s.slug === stateSlug);
  if (!stateInfo) {
    return new Response('State not found', { status: 404 });
  }

  const sitemaps: string[] = [];

  try {
    // Get all cities in this state
    const cities = await getCitiesWithChurchCounts(stateInfo.abbr);

    for (const city of cities) {
      sitemaps.push(`  <sitemap>
    <loc>${SITE_URL}/churches/sitemaps/${stateInfo.slug}/${city.slug}.xml</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
  </sitemap>`);
    }
  } catch {
    // Database not available, return empty sitemap index
  }

  const sitemapIndex = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemaps.join('\n')}
</sitemapindex>`;

  return new Response(sitemapIndex, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=86400, stale-while-revalidate=43200',
    },
  });
}
