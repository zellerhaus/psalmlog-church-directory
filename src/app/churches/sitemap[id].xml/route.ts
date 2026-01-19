import { NextRequest } from 'next/server';
import { SITE_URL, US_STATES, getDenominationSlugs, getWorshipStyleSlugs, getProgramSlugs } from '@/lib/constants';
import { getTotalChurchCount, getAllCitiesForSitemap, getChurchesForSitemapChunk, SITEMAP_CHUNK_SIZE } from '@/lib/data';

// Map state abbreviation to state slug
const stateAbbrToSlug = new Map<string, string>(US_STATES.map((s) => [s.abbr, s.slug]));

// Helper to create city slug from city name
function cityToSlug(city: string): string {
  return city.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

// Get all static URLs (states, cities, denominations, worship styles, programs)
async function getStaticUrls(): Promise<{ loc: string; priority: string; changefreq: string }[]> {
  const urls: { loc: string; priority: string; changefreq: string }[] = [];

  // Main churches directory page
  urls.push({
    loc: `${SITE_URL}/churches`,
    priority: '1.0',
    changefreq: 'daily',
  });

  // Denominations index page
  urls.push({
    loc: `${SITE_URL}/churches/denominations`,
    priority: '0.9',
    changefreq: 'weekly',
  });

  // All denomination pages
  for (const denominationSlug of getDenominationSlugs()) {
    urls.push({
      loc: `${SITE_URL}/churches/denominations/${denominationSlug}`,
      priority: '0.8',
      changefreq: 'weekly',
    });
  }

  // Worship styles index page
  urls.push({
    loc: `${SITE_URL}/churches/worship`,
    priority: '0.9',
    changefreq: 'weekly',
  });

  // All worship style pages
  for (const styleSlug of getWorshipStyleSlugs()) {
    urls.push({
      loc: `${SITE_URL}/churches/worship/${styleSlug}`,
      priority: '0.8',
      changefreq: 'weekly',
    });
  }

  // Programs index page
  urls.push({
    loc: `${SITE_URL}/churches/programs`,
    priority: '0.9',
    changefreq: 'weekly',
  });

  // All program pages
  for (const programSlug of getProgramSlugs()) {
    urls.push({
      loc: `${SITE_URL}/churches/programs/${programSlug}`,
      priority: '0.8',
      changefreq: 'weekly',
    });
  }

  // All state pages
  for (const state of US_STATES) {
    urls.push({
      loc: `${SITE_URL}/churches/${state.slug}`,
      priority: '0.9',
      changefreq: 'weekly',
    });
  }

  // All city pages
  try {
    const allCities = await getAllCitiesForSitemap();
    for (const city of allCities) {
      const stateSlug = stateAbbrToSlug.get(city.state_abbr);
      if (stateSlug) {
        urls.push({
          loc: `${SITE_URL}/churches/${stateSlug}/${city.slug}`,
          priority: '0.8',
          changefreq: 'weekly',
        });
      }
    }
  } catch {
    // Database not available
  }

  return urls;
}

// Generate XML sitemap for a specific chunk
// URL pattern: /churches/sitemap1.xml, /churches/sitemap2.xml, etc.
export async function GET(request: NextRequest) {
  // Extract the ID from the URL path (e.g., sitemap1.xml -> 1)
  const pathname = request.nextUrl.pathname;
  const match = pathname.match(/sitemap(\d+)\.xml$/);

  if (!match) {
    return new Response('Invalid sitemap URL', { status: 400 });
  }

  const sitemapId = parseInt(match[1], 10);

  if (isNaN(sitemapId) || sitemapId < 1) {
    return new Response('Invalid sitemap ID', { status: 400 });
  }

  const lastmod = new Date().toISOString();
  const urls: string[] = [];

  try {
    // Get total church count to calculate total sitemaps needed
    const totalChurches = await getTotalChurchCount();
    const staticUrls = await getStaticUrls();
    const staticUrlCount = staticUrls.length;

    // Total URLs = static URLs + all churches
    const totalUrls = staticUrlCount + totalChurches;
    const totalSitemaps = Math.ceil(totalUrls / SITEMAP_CHUNK_SIZE);

    if (sitemapId > totalSitemaps) {
      return new Response('Sitemap not found', { status: 404 });
    }

    // Sitemap 1 starts with static URLs, then churches
    if (sitemapId === 1) {
      // Add static URLs first
      for (const url of staticUrls) {
        urls.push(`  <url>
    <loc>${url.loc}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`);
      }

      // Fill remaining space with churches
      const churchesNeeded = SITEMAP_CHUNK_SIZE - staticUrlCount;
      if (churchesNeeded > 0) {
        const churches = await getChurchesForSitemapChunk(0, churchesNeeded);
        for (const church of churches) {
          const stateSlug = stateAbbrToSlug.get(church.state_abbr);
          if (stateSlug) {
            const churchLastmod = church.updated_at
              ? new Date(church.updated_at).toISOString()
              : lastmod;
            urls.push(`  <url>
    <loc>${SITE_URL}/churches/${stateSlug}/${cityToSlug(church.city)}/${church.slug}</loc>
    <lastmod>${churchLastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`);
          }
        }
      }
    } else {
      // Subsequent sitemaps contain only churches
      // Calculate church offset (accounting for static URLs in sitemap 1)
      const churchOffset = (sitemapId - 1) * SITEMAP_CHUNK_SIZE - staticUrlCount;
      const churches = await getChurchesForSitemapChunk(churchOffset, SITEMAP_CHUNK_SIZE);

      for (const church of churches) {
        const stateSlug = stateAbbrToSlug.get(church.state_abbr);
        if (stateSlug) {
          const churchLastmod = church.updated_at
            ? new Date(church.updated_at).toISOString()
            : lastmod;
          urls.push(`  <url>
    <loc>${SITE_URL}/churches/${stateSlug}/${cityToSlug(church.city)}/${church.slug}</loc>
    <lastmod>${churchLastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`);
        }
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
