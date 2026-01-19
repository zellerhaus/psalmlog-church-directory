import { SITE_URL, US_STATES, getDenominationSlugs, getWorshipStyleSlugs, getProgramSlugs } from '@/lib/constants';
import { getAllCitiesForSitemap } from '@/lib/data';

// Generate XML sitemap for states, cities, denominations, and worship styles
export async function GET() {
  const urls: string[] = [];
  const lastmod = new Date().toISOString();

  // Main churches directory page
  urls.push(`  <url>
    <loc>${SITE_URL}/churches</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>`);

  // Denominations index page
  urls.push(`  <url>
    <loc>${SITE_URL}/churches/denominations</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>`);

  // All denomination pages
  for (const denominationSlug of getDenominationSlugs()) {
    urls.push(`  <url>
    <loc>${SITE_URL}/churches/denominations/${denominationSlug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`);
  }

  // Worship styles index page
  urls.push(`  <url>
    <loc>${SITE_URL}/churches/worship</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>`);

  // All worship style pages
  for (const styleSlug of getWorshipStyleSlugs()) {
    urls.push(`  <url>
    <loc>${SITE_URL}/churches/worship/${styleSlug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`);
  }

  // Programs index page
  urls.push(`  <url>
    <loc>${SITE_URL}/churches/programs</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>`);

  // All program pages
  for (const programSlug of getProgramSlugs()) {
    urls.push(`  <url>
    <loc>${SITE_URL}/churches/programs/${programSlug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`);
  }

  // All state pages
  for (const state of US_STATES) {
    urls.push(`  <url>
    <loc>${SITE_URL}/churches/${state.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>`);
  }

  // All city pages - fetch all cities in a single query
  try {
    const allCities = await getAllCitiesForSitemap();

    // Create a map of state_abbr to slug for quick lookup
    const stateSlugMap = new Map<string, string>(US_STATES.map(s => [s.abbr, s.slug]));

    for (const city of allCities) {
      const stateSlug = stateSlugMap.get(city.state_abbr);
      if (stateSlug) {
        urls.push(`  <url>
    <loc>${SITE_URL}/churches/${stateSlug}/${city.slug}</loc>
    <lastmod>${lastmod}</lastmod>
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
