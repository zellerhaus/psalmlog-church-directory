/**
 * Google Places API Provider
 *
 * Uses the Google Places API (New) for searching and retrieving church data.
 * Documentation: https://developers.google.com/maps/documentation/places/web-service
 */

import type {
  ChurchDataProvider,
  ChurchSearchParams,
  ChurchSearchResult,
  RawChurchData,
  GooglePlacesConfig,
  OperatingHours,
} from './types';

// Google Places API response types
interface GooglePlaceResult {
  id: string;
  displayName?: { text: string };
  formattedAddress?: string;
  addressComponents?: GoogleAddressComponent[];
  location?: { latitude: number; longitude: number };
  nationalPhoneNumber?: string;
  internationalPhoneNumber?: string;
  websiteUri?: string;
  regularOpeningHours?: {
    weekdayDescriptions?: string[];
    periods?: GoogleOpeningPeriod[];
  };
  rating?: number;
  userRatingCount?: number;
  photos?: { name: string }[];
}

interface GoogleAddressComponent {
  longText: string;
  shortText: string;
  types: string[];
}

interface GoogleOpeningPeriod {
  open: { day: number; hour: number; minute: number };
  close?: { day: number; hour: number; minute: number };
}

interface GoogleTextSearchResponse {
  places?: GooglePlaceResult[];
  nextPageToken?: string;
}

// US State abbreviations for parsing
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

const ABBR_TO_STATE: Record<string, string> = Object.fromEntries(
  Object.entries(STATE_ABBR_MAP).map(([state, abbr]) => [abbr, state])
);

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export class GooglePlacesProvider implements ChurchDataProvider {
  readonly name = 'google_places';
  private apiKey: string;
  private defaultRadiusMiles: number;

  constructor(config: GooglePlacesConfig) {
    this.apiKey = config.apiKey;
    this.defaultRadiusMiles = config.defaultRadiusMiles ?? 25;
  }

  isConfigured(): boolean {
    return Boolean(this.apiKey && this.apiKey.length > 0);
  }

  async searchChurches(params: ChurchSearchParams): Promise<ChurchSearchResult> {
    if (!this.isConfigured()) {
      throw new Error('Google Places API key not configured');
    }

    const radiusMeters = (params.radiusMiles ?? this.defaultRadiusMiles) * 1609.34;
    const limit = params.limit ?? 20;

    // Build the search query
    let textQuery = 'churches';
    if (params.city && params.state) {
      textQuery = `churches in ${params.city}, ${params.state}`;
    } else if (params.city) {
      textQuery = `churches in ${params.city}`;
    }

    // Use Text Search (New) API
    const requestBody: Record<string, unknown> = {
      textQuery,
      maxResultCount: Math.min(limit, 20), // API max is 20 per request
      languageCode: 'en',
    };

    // Add location bias if coordinates provided
    if (params.lat && params.lng) {
      requestBody.locationBias = {
        circle: {
          center: { latitude: params.lat, longitude: params.lng },
          radius: radiusMeters,
        },
      };
    }

    // Add page token for pagination
    if (params.pageToken) {
      requestBody.pageToken = params.pageToken;
    }

    const response = await fetch(
      'https://places.googleapis.com/v1/places:searchText',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': this.apiKey,
          'X-Goog-FieldMask': [
            'places.id',
            'places.displayName',
            'places.formattedAddress',
            'places.addressComponents',
            'places.location',
            'places.nationalPhoneNumber',
            'places.websiteUri',
            'places.regularOpeningHours',
            'places.rating',
            'places.userRatingCount',
            'places.photos',
            'nextPageToken',
          ].join(','),
        },
        body: JSON.stringify(requestBody),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Google Places API error: ${response.status} - ${error}`);
    }

    const data: GoogleTextSearchResponse = await response.json();

    const churches = (data.places ?? [])
      .map((place) => this.transformPlace(place))
      .filter((church): church is RawChurchData => church !== null);

    return {
      churches,
      nextPageToken: data.nextPageToken,
    };
  }

  async getChurchDetails(sourceId: string): Promise<RawChurchData | null> {
    if (!this.isConfigured()) {
      throw new Error('Google Places API key not configured');
    }

    const response = await fetch(
      `https://places.googleapis.com/v1/places/${sourceId}`,
      {
        method: 'GET',
        headers: {
          'X-Goog-Api-Key': this.apiKey,
          'X-Goog-FieldMask': [
            'id',
            'displayName',
            'formattedAddress',
            'addressComponents',
            'location',
            'nationalPhoneNumber',
            'internationalPhoneNumber',
            'websiteUri',
            'regularOpeningHours',
            'rating',
            'userRatingCount',
            'photos',
          ].join(','),
        },
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      const error = await response.text();
      throw new Error(`Google Places API error: ${response.status} - ${error}`);
    }

    const place: GooglePlaceResult = await response.json();
    return this.transformPlace(place);
  }

  private transformPlace(place: GooglePlaceResult): RawChurchData | null {
    // Extract address components
    const addressParts = this.parseAddressComponents(place.addressComponents ?? []);

    // Must have minimum required fields
    if (!place.displayName?.text || !place.location) {
      return null;
    }

    // Parse street address from formatted address
    const streetAddress = this.extractStreetAddress(
      place.formattedAddress ?? '',
      addressParts.city,
      addressParts.state
    );

    return {
      name: place.displayName.text,
      address: streetAddress,
      city: addressParts.city,
      state: addressParts.state,
      stateAbbr: addressParts.stateAbbr,
      zip: addressParts.zip,
      lat: place.location.latitude,
      lng: place.location.longitude,
      phone: place.nationalPhoneNumber ?? place.internationalPhoneNumber,
      website: place.websiteUri,
      hours: this.parseOpeningHours(place.regularOpeningHours?.periods),
      rating: place.rating,
      reviewCount: place.userRatingCount,
      photoUrls: place.photos?.slice(0, 5).map((p) =>
        `https://places.googleapis.com/v1/${p.name}/media?key=${this.apiKey}&maxWidthPx=800`
      ),
      sourceId: place.id,
      source: this.name,
      rawData: place,
    };
  }

  private parseAddressComponents(components: GoogleAddressComponent[]): {
    city: string;
    state: string;
    stateAbbr: string;
    zip: string;
  } {
    let city = '';
    let state = '';
    let stateAbbr = '';
    let zip = '';

    for (const component of components) {
      // Skip components without types array
      if (!component || !component.types || !Array.isArray(component.types)) {
        continue;
      }
      if (component.types.includes('locality')) {
        city = component.longText ?? '';
      } else if (component.types.includes('administrative_area_level_1')) {
        state = component.longText ?? '';
        stateAbbr = component.shortText ?? '';
      } else if (component.types.includes('postal_code')) {
        zip = component.longText ?? '';
      }
    }

    // Fallback: if we have state name but no abbr, look it up
    if (state && !stateAbbr) {
      stateAbbr = STATE_ABBR_MAP[state.toLowerCase()] ?? '';
    }

    // Fallback: if we have abbr but no state name, look it up
    if (stateAbbr && !state) {
      const stateLower = ABBR_TO_STATE[stateAbbr];
      if (stateLower) {
        state = stateLower.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      }
    }

    return { city, state, stateAbbr, zip };
  }

  private extractStreetAddress(formattedAddress: string, city: string, state: string): string {
    // Try to extract just the street address portion
    // Formatted address is typically: "123 Main St, City, State ZIP, USA"
    const parts = formattedAddress.split(',').map((p) => p.trim());

    if (parts.length >= 1) {
      // First part is usually the street address
      return parts[0];
    }

    return formattedAddress;
  }

  private parseOpeningHours(periods?: GoogleOpeningPeriod[]): OperatingHours[] | undefined {
    if (!periods || periods.length === 0) {
      return undefined;
    }

    return periods
      .filter((period) => period.close) // Only include periods with close times
      .map((period) => ({
        day: DAY_NAMES[period.open.day] ?? 'Unknown',
        openTime: this.formatTime(period.open.hour, period.open.minute),
        closeTime: period.close
          ? this.formatTime(period.close.hour, period.close.minute)
          : '23:59',
      }));
  }

  private formatTime(hour: number, minute: number): string {
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  }
}

// Factory function
export function createGooglePlacesProvider(config: GooglePlacesConfig): ChurchDataProvider {
  return new GooglePlacesProvider(config);
}
