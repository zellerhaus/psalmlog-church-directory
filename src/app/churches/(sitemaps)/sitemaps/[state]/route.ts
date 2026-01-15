import { NextRequest } from 'next/server';
import { SITE_URL, US_STATES } from '@/lib/constants';
import { getCitiesWithChurchCounts, getChurchesByCity } from '@/lib/data';

// Maximum URLs per sitemap (Google recommends max 50,000)
const MAX_URLS_PER_SITEMAP = 5000;

// Generate XML sitemap for all churches in a specific state
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

  const urls: string[] = [];

  try {
    const cities = await getCitiesWithChurchCounts(stateInfo.abbr);

    for (const city of cities) {
      if (urls.length >= MAX_URLS_PER_SITEMAP) break;

      // Fetch churches in batches
      let page = 1;
      let hasMore = true;

      while (hasMore && urls.length < MAX_URLS_PER_SITEMAP) {
        const result = await getChurchesByCity(stateInfo.abbr, city.name, {}, page, 100);

        for (const church of result.data) {
          if (urls.length >= MAX_URLS_PER_SITEMAP) break;

          const lastmod = church.updated_at
            ? new Date(church.updated_at).toISOString()
            : new Date().toISOString();

          urls.push(`  <url>
    <loc>${SITE_URL}/churches/${stateInfo.slug}/${city.slug}/${church.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`);
        }

        hasMore = page < result.totalPages;
        page++;
      }
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
