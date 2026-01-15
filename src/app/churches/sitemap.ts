import { MetadataRoute } from 'next';
import { getStates, getCitiesByState, getChurchesByCity } from '@/lib/data';
import { US_STATES, SITE_URL } from '@/lib/constants';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = SITE_URL;
  const urls: MetadataRoute.Sitemap = [];

  // Add the main churches page
  urls.push({
    url: `${baseUrl}/churches`,
    lastModified: new Date(),
    changeFrequency: 'daily',
    priority: 1,
  });

  try {
    // Try to get states from database
    const states = await getStates();

    if (states.length > 0) {
      // Add state pages
      for (const state of states) {
        urls.push({
          url: `${baseUrl}/churches/${state.slug}`,
          lastModified: new Date(),
          changeFrequency: 'weekly',
          priority: 0.9,
        });

        // Get cities for this state
        const cities = await getCitiesByState(state.abbr);

        for (const city of cities) {
          urls.push({
            url: `${baseUrl}/churches/${state.slug}/${city.slug}`,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 0.8,
          });

          // Get churches for this city (first page only for sitemap)
          const result = await getChurchesByCity(state.abbr, city.name, {}, 1, 100);

          for (const church of result.data) {
            urls.push({
              url: `${baseUrl}/churches/${state.slug}/${city.slug}/${church.slug}`,
              lastModified: church.updated_at ? new Date(church.updated_at) : new Date(),
              changeFrequency: 'monthly',
              priority: 0.7,
            });
          }
        }
      }
    } else {
      // Fallback: add all state pages from constants
      for (const state of US_STATES) {
        urls.push({
          url: `${baseUrl}/churches/${state.slug}`,
          lastModified: new Date(),
          changeFrequency: 'weekly',
          priority: 0.9,
        });
      }
    }
  } catch (error) {
    console.error('Sitemap generation error:', error);

    // Fallback: add all state pages from constants
    for (const state of US_STATES) {
      urls.push({
        url: `${baseUrl}/churches/${state.slug}`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.9,
      });
    }
  }

  return urls;
}
