/**
 * Data Provider Interface
 *
 * This abstraction allows swapping between different data sources:
 * - Google Places API
 * - Bright Data SERP
 * - OpenStreetMap/Overpass
 * - Foursquare
 * - Custom/Manual imports
 */

// Raw church data from any provider (normalized structure)
export interface RawChurchData {
  // Required fields
  name: string;
  address: string;
  city: string;
  state: string;
  stateAbbr: string;
  zip: string;
  lat: number;
  lng: number;

  // Optional fields (availability varies by provider)
  phone?: string;
  email?: string;
  website?: string;
  denomination?: string;
  hours?: OperatingHours[];
  rating?: number;
  reviewCount?: number;
  photoUrls?: string[];

  // Provider metadata
  sourceId: string;  // Unique ID from the provider
  source: string;    // Provider name (e.g., 'google_places', 'osm', 'brightdata')
  rawData?: unknown; // Original response for debugging
}

export interface OperatingHours {
  day: string;        // 'Monday', 'Tuesday', etc.
  openTime: string;   // '09:00'
  closeTime: string;  // '17:00'
}

// Search parameters for finding churches
export interface ChurchSearchParams {
  // Location-based search
  city?: string;
  state?: string;

  // Coordinate-based search
  lat?: number;
  lng?: number;
  radiusMiles?: number;

  // Pagination
  limit?: number;
  pageToken?: string; // For providers that use cursor pagination
}

// Search result with pagination info
export interface ChurchSearchResult {
  churches: RawChurchData[];
  nextPageToken?: string;
  totalEstimate?: number;
}

// The main provider interface - implement this for each data source
export interface ChurchDataProvider {
  readonly name: string;

  // Search for churches in an area
  searchChurches(params: ChurchSearchParams): Promise<ChurchSearchResult>;

  // Get detailed info for a specific place (if supported)
  getChurchDetails?(sourceId: string): Promise<RawChurchData | null>;

  // Check if provider is properly configured
  isConfigured(): boolean;
}

// Provider configuration types
export interface GooglePlacesConfig {
  apiKey: string;
  defaultRadiusMiles?: number;
}

export interface BrightDataConfig {
  apiKey: string;
  zone?: string;
}

export interface OpenStreetMapConfig {
  userAgent: string;  // Required by OSM policy
  maxRequestsPerSecond?: number;
}

// Factory function type for creating providers
export type ProviderFactory<T> = (config: T) => ChurchDataProvider;

// Enrichment status for tracking AI processing
export type EnrichmentStatus = 'pending' | 'processing' | 'completed' | 'failed';

// Church record with enrichment metadata
export interface ChurchWithEnrichment extends RawChurchData {
  enrichmentStatus: EnrichmentStatus;
  enrichmentError?: string;
  enrichedAt?: string;

  // Enriched fields (populated by AI)
  aiDescription?: string;
  aiWhatToExpect?: string;
  worshipStyle?: string[];
  serviceTimes?: ServiceTimeInfo[];
  hasKidsMinistry?: boolean;
  hasYouthGroup?: boolean;
  hasSmallGroups?: boolean;
}

export interface ServiceTimeInfo {
  day: string;
  time: string;
  name?: string;
}
