import { NextRequest } from 'next/server';
import { SITE_URL, US_STATES } from '@/lib/constants';
import { getChurchesByCity } from '@/lib/data';

// Generate XML sitemap for all churches in a specific city
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ state: string; city: string }> }
) {
  const { state: stateSlug, city: citySlug } = await params;

  // Find state info
  const stateInfo = US_STATES.find((s) => s.slug === stateSlug);
  if (!stateInfo) {
    return new Response('State not found', { status: 404 });
  }

  // Convert slug back to city name for query (replace dashes with spaces)
  const cityName = citySlug.replace(/-/g, ' ');

  const urls: string[] = [];

  try {
    // Get all churches in this city (use large page size to get all)
    const result = await getChurchesByCity(stateInfo.abbr, cityName, {}, 1, 10000);

    for (const church of result.data) {
      const lastmod = church.updated_at
        ? new Date(church.updated_at).toISOString()
        : new Date().toISOString();

      urls.push(`  <url>
    <loc>${SITE_URL}/churches/${stateInfo.slug}/${citySlug}/${church.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`);
    }
  } catch {
    // Database not available, return empty sitemap
  }

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`;

  return new Response(sitemap, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=86400, stale-while-revalidate=43200',
    },
  });
}
