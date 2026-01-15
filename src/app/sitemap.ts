import { MetadataRoute } from 'next';
import { SITE_URL, US_STATES } from '@/lib/constants';
import { getCitiesWithChurchCounts, getChurchesByCity } from '@/lib/data';

// Maximum URLs per sitemap chunk (Google recommends max 50,000)
const MAX_URLS_PER_SITEMAP = 5000;

// Generate sitemap index entries for chunked sitemaps
// Next.js will create /sitemap.xml as an index pointing to /sitemap/0.xml, /sitemap/1.xml, etc.
export async function generateSitemaps() {
  // Index 0 = static pages, states, cities
  // Index 1+ = churches by state (one per state)
  return [
    { id: 0 },
    ...US_STATES.map((_, index) => ({ id: index + 1 })),
  ];
}

export default async function sitemap({
  id,
}: {
  id: number;
}): Promise<MetadataRoute.Sitemap> {
  // Sitemap 0: Static pages, states, and cities
  if (id === 0) {
    return generateStaticAndLocationSitemap();
  }

  // Sitemaps 1-51: Churches by state
  const stateIndex = id - 1;
  if (stateIndex >= 0 && stateIndex < US_STATES.length) {
    return generateChurchSitemapByState(US_STATES[stateIndex]);
  }

  return [];
}

// Generate sitemap for static pages, all states, and all cities
async function generateStaticAndLocationSitemap(): Promise<MetadataRoute.Sitemap> {
  const urls: MetadataRoute.Sitemap = [];

  // Homepage
  urls.push({
    url: SITE_URL,
    lastModified: new Date(),
    changeFrequency: 'daily',
    priority: 1,
  });

  // Main churches directory page
  urls.push({
    url: `${SITE_URL}/churches`,
    lastModified: new Date(),
    changeFrequency: 'daily',
    priority: 0.95,
  });

  // All state pages
  for (const state of US_STATES) {
    urls.push({
      url: `${SITE_URL}/churches/${state.slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    });
  }

  // All city pages (from database)
  try {
    for (const state of US_STATES) {
      const cities = await getCitiesWithChurchCounts(state.abbr);
      for (const city of cities) {
        urls.push({
          url: `${SITE_URL}/churches/${state.slug}/${city.slug}`,
          lastModified: new Date(),
          changeFrequency: 'weekly',
          priority: 0.8,
        });
      }
    }
  } catch {
    // Database not available, just return state pages
  }

  return urls;
}

// Generate sitemap for all churches in a specific state
async function generateChurchSitemapByState(
  state: (typeof US_STATES)[number]
): Promise<MetadataRoute.Sitemap> {
  const urls: MetadataRoute.Sitemap = [];

  try {
    const cities = await getCitiesWithChurchCounts(state.abbr);

    for (const city of cities) {
      // Fetch churches in batches
      let page = 1;
      let hasMore = true;

      while (hasMore && urls.length < MAX_URLS_PER_SITEMAP) {
        const result = await getChurchesByCity(state.abbr, city.name, {}, page, 100);

        for (const church of result.data) {
          if (urls.length >= MAX_URLS_PER_SITEMAP) break;

          urls.push({
            url: `${SITE_URL}/churches/${state.slug}/${city.slug}/${church.slug}`,
            lastModified: church.updated_at ? new Date(church.updated_at) : new Date(),
            changeFrequency: 'monthly',
            priority: 0.7,
          });
        }

        hasMore = page < result.totalPages;
        page++;
      }
    }
  } catch {
    // Database not available, return empty sitemap for this state
  }

  return urls;
}
