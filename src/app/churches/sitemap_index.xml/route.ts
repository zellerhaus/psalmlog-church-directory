import { SITE_URL } from '@/lib/constants';
import { getTotalChurchCount, getAllCitiesForSitemap, SITEMAP_CHUNK_SIZE } from '@/lib/data';

// Generate XML sitemap index that references numbered chunk sitemaps
export async function GET() {
  const sitemaps: string[] = [];
  const lastmod = new Date().toISOString();

  try {
    // Calculate total URLs to determine how many sitemaps we need
    const totalChurches = await getTotalChurchCount();
    const allCities = await getAllCitiesForSitemap();

    // Static URLs: 1 (main) + 1 (denominations index) + 20 (denominations) +
    //              1 (worship index) + 6 (worship styles) + 1 (programs index) + 3 (programs) +
    //              51 (states) + cities count
    const staticUrlCount = 1 + 1 + 20 + 1 + 6 + 1 + 3 + 51 + allCities.length;
    const totalUrls = staticUrlCount + totalChurches;
    const totalSitemaps = Math.ceil(totalUrls / SITEMAP_CHUNK_SIZE);

    for (let i = 1; i <= totalSitemaps; i++) {
      sitemaps.push(`  <sitemap>
    <loc>${SITE_URL}/churches/sitemap${i}.xml</loc>
    <lastmod>${lastmod}</lastmod>
  </sitemap>`);
    }
  } catch {
    // Database not available, return single sitemap reference
    sitemaps.push(`  <sitemap>
    <loc>${SITE_URL}/churches/sitemap1.xml</loc>
    <lastmod>${lastmod}</lastmod>
  </sitemap>`);
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
