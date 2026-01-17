import { SITE_URL, US_STATES } from '@/lib/constants';

// Generate XML sitemap index that references state-specific sitemaps
export async function GET() {
  const sitemapIndex = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${SITE_URL}/churches/sitemap-locations.xml</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
  </sitemap>
${US_STATES.map(
  (state) => `  <sitemap>
    <loc>${SITE_URL}/churches/sitemaps/${state.slug}.xml</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
  </sitemap>`
).join('\n')}
</sitemapindex>`;

  return new Response(sitemapIndex, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=86400, stale-while-revalidate=43200',
    },
  });
}
