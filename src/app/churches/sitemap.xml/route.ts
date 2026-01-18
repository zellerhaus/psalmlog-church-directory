import { SITE_URL, US_STATES } from '@/lib/constants';
import { getAllCitiesForSitemap } from '@/lib/data';

// Map state abbreviation to state slug
const stateAbbrToSlug = new Map(US_STATES.map((s) => [s.abbr, s.slug]));

// Generate XML sitemap index that references city-specific sitemaps
export async function GET() {
  const sitemaps: string[] = [];
  const lastmod = new Date().toISOString();

  // Add the locations sitemap first
  sitemaps.push(`  <sitemap>
    <loc>${SITE_URL}/churches/sitemap-locations.xml</loc>
    <lastmod>${lastmod}</lastmod>
  </sitemap>`);

  try {
    // Get all cities across all states
    const cities = await getAllCitiesForSitemap();

    for (const city of cities) {
      const stateSlug = stateAbbrToSlug.get(city.state_abbr);
      if (stateSlug) {
        sitemaps.push(`  <sitemap>
    <loc>${SITE_URL}/churches/sitemaps/${stateSlug}/${city.slug}.xml</loc>
    <lastmod>${lastmod}</lastmod>
  </sitemap>`);
      }
    }
  } catch {
    // Database not available, return minimal sitemap
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
