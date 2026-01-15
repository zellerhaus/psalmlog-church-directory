import { SITE_URL, US_STATES } from '@/lib/constants';
import { getCitiesWithChurchCounts } from '@/lib/data';

// Generate XML sitemap for states and cities
export async function GET() {
  const urls: string[] = [];

  // Main churches directory page
  urls.push(`  <url>
    <loc>${SITE_URL}/churches</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>`);

  // All state pages
  for (const state of US_STATES) {
    urls.push(`  <url>
    <loc>${SITE_URL}/churches/${state.slug}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>`);
  }

  // All city pages (from database)
  try {
    for (const state of US_STATES) {
      const cities = await getCitiesWithChurchCounts(state.abbr);
      for (const city of cities) {
        urls.push(`  <url>
    <loc>${SITE_URL}/churches/${state.slug}/${city.slug}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`);
      }
    }
  } catch {
    // Database not available, just return state pages
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
