/**
 * OpenStreetMap (Overpass API) Provider
 *
 * Uses the Overpass API to query OpenStreetMap data for churches.
 * Free and open-licensed, but rate-limited.
 *
 * Documentation: https://wiki.openstreetmap.org/wiki/Overpass_API
 */

import type {
  ChurchDataProvider,
  ChurchSearchParams,
  ChurchSearchResult,
  RawChurchData,
  OpenStreetMapConfig,
} from './types';

// OSM element types
interface OSMElement {
  type: 'node' | 'way' | 'relation';
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

interface OverpassResponse {
  elements: OSMElement[];
}

// US State name to abbreviation mapping
const STATE_ABBR_MAP: Record<string, string> = {
  'alabama': 'AL', 'alaska': 'AK', 'arizona': 'AZ', 'arkansas': 'AR',
  'california': 'CA', 'colorado': 'CO', 'connecticut': 'CT', 'delaware': 'DE',
  'florida': 'FL', 'georgia': 'GA', 'hawaii': 'HI', 'idaho': 'ID',
  'illinois': 'IL', 'indiana': 'IN', 'iowa': 'IA', 'kansas': 'KS',
  'kentucky': 'KY', 'louisiana': 'LA', 'maine': 'ME', 'maryland': 'MD',
  'massachusetts': 'MA', 'michigan': 'MI', 'minnesota': 'MN', 'mississippi': 'MS',
  'missouri': 'MO', 'montana': 'MT', 'nebraska': 'NE', 'nevada': 'NV',
  'new hampshire': 'NH', 'new jersey': 'NJ', 'new mexico': 'NM', 'new york': 'NY',
  'north carolina': 'NC', 'north dakota': 'ND', 'ohio': 'OH', 'oklahoma': 'OK',
  'oregon': 'OR', 'pennsylvania': 'PA', 'rhode island': 'RI', 'south carolina': 'SC',
  'south dakota': 'SD', 'tennessee': 'TN', 'texas': 'TX', 'utah': 'UT',
  'vermont': 'VT', 'virginia': 'VA', 'washington': 'WA', 'west virginia': 'WV',
  'wisconsin': 'WI', 'wyoming': 'WY',
};

export class OpenStreetMapProvider implements ChurchDataProvider {
  readonly name = 'openstreetmap';
  private userAgent: string;
  private overpassUrl = 'https://overpass-api.de/api/interpreter';

  constructor(config: OpenStreetMapConfig) {
    this.userAgent = config.userAgent;
  }

  isConfigured(): boolean {
    return Boolean(this.userAgent && this.userAgent.length > 0);
  }

  async searchChurches(params: ChurchSearchParams): Promise<ChurchSearchResult> {
    if (!this.isConfigured()) {
      throw new Error('OpenStreetMap user agent not configured');
    }

    const radiusMeters = (params.radiusMiles ?? 25) * 1609.34;
    const limit = params.limit ?? 100;

    let query: string;

    if (params.lat && params.lng) {
      // Search by coordinates
      query = this.buildRadiusQuery(params.lat, params.lng, radiusMeters, limit);
    } else if (params.city && params.state) {
      // Search by city/state using area lookup
      query = this.buildAreaQuery(params.city, params.state, limit);
    } else {
      throw new Error('Must provide either lat/lng or city/state for OSM search');
    }

    const response = await fetch(this.overpassUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': this.userAgent,
      },
      body: `data=${encodeURIComponent(query)}`,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Overpass API error: ${response.status} - ${error}`);
    }

    const data: OverpassResponse = await response.json();

    const churches = data.elements
      .map((element) => this.transformElement(element, params))
      .filter((church): church is RawChurchData => church !== null);

    return {
      churches,
      // OSM doesn't have pagination in the traditional sense
      totalEstimate: churches.length,
    };
  }

  // OSM doesn't support getting details by ID in a simple way
  // You'd need to query by element type and ID
  async getChurchDetails(sourceId: string): Promise<RawChurchData | null> {
    // sourceId format: "node/123456" or "way/123456"
    const [type, id] = sourceId.split('/');

    if (!type || !id) {
      return null;
    }

    const query = `
      [out:json][timeout:10];
      ${type}(${id});
      out center;
    `;

    const response = await fetch(this.overpassUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': this.userAgent,
      },
      body: `data=${encodeURIComponent(query)}`,
    });

    if (!response.ok) {
      return null;
    }

    const data: OverpassResponse = await response.json();

    if (data.elements.length === 0) {
      return null;
    }

    return this.transformElement(data.elements[0], {});
  }

  private buildRadiusQuery(lat: number, lng: number, radiusMeters: number, limit: number): string {
    return `
      [out:json][timeout:30];
      (
        node["amenity"="place_of_worship"]["religion"="christian"](around:${radiusMeters},${lat},${lng});
        way["amenity"="place_of_worship"]["religion"="christian"](around:${radiusMeters},${lat},${lng});
        relation["amenity"="place_of_worship"]["religion"="christian"](around:${radiusMeters},${lat},${lng});
      );
      out center ${limit};
    `;
  }

  private buildAreaQuery(city: string, state: string, limit: number): string {
    // OSM area search requires specific formatting
    const areaName = `${city}, ${state}, United States`;

    return `
      [out:json][timeout:60];
      area["name"="${city}"]["admin_level"~"[78]"]->.city;
      (
        node["amenity"="place_of_worship"]["religion"="christian"](area.city);
        way["amenity"="place_of_worship"]["religion"="christian"](area.city);
        relation["amenity"="place_of_worship"]["religion"="christian"](area.city);
      );
      out center ${limit};
    `;
  }

  private transformElement(
    element: OSMElement,
    params: ChurchSearchParams
  ): RawChurchData | null {
    const tags = element.tags ?? {};

    // Get coordinates (nodes have lat/lon, ways/relations have center)
    const lat = element.lat ?? element.center?.lat;
    const lng = element.lon ?? element.center?.lon;

    if (!lat || !lng) {
      return null;
    }

    // Must have a name
    const name = tags.name;
    if (!name) {
      return null;
    }

    // Parse address from tags
    const address = this.parseAddress(tags);
    const city = tags['addr:city'] ?? params.city ?? '';
    const state = tags['addr:state'] ?? params.state ?? '';
    const stateAbbr = STATE_ABBR_MAP[state.toLowerCase()] ?? state;
    const zip = tags['addr:postcode'] ?? '';

    return {
      name,
      address,
      city,
      state,
      stateAbbr,
      zip,
      lat,
      lng,
      phone: tags.phone ?? tags['contact:phone'],
      email: tags.email ?? tags['contact:email'],
      website: tags.website ?? tags['contact:website'],
      denomination: tags.denomination,
      sourceId: `${element.type}/${element.id}`,
      source: this.name,
      rawData: element,
    };
  }

  private parseAddress(tags: Record<string, string>): string {
    const parts: string[] = [];

    if (tags['addr:housenumber']) {
      parts.push(tags['addr:housenumber']);
    }

    if (tags['addr:street']) {
      parts.push(tags['addr:street']);
    }

    if (parts.length === 0 && tags['addr:full']) {
      return tags['addr:full'];
    }

    return parts.join(' ');
  }
}

// Factory function
export function createOpenStreetMapProvider(config: OpenStreetMapConfig): ChurchDataProvider {
  return new OpenStreetMapProvider(config);
}
