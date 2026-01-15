/**
 * Provider Manager
 *
 * Manages multiple data providers and allows easy switching between them.
 * Use this in your application code to abstract away provider-specific logic.
 */

import type { ChurchDataProvider, ChurchSearchParams, ChurchSearchResult, RawChurchData } from './types';
import { GooglePlacesProvider } from './google-places';
import { OpenStreetMapProvider } from './openstreetmap';

export type ProviderType = 'google_places' | 'openstreetmap' | 'brightdata';

interface ProviderManagerConfig {
  defaultProvider?: ProviderType;

  // Provider-specific configs
  googlePlaces?: {
    apiKey: string;
    defaultRadiusMiles?: number;
  };
  openStreetMap?: {
    userAgent: string;
  };
  brightData?: {
    apiKey: string;
  };
}

export class ProviderManager {
  private providers: Map<ProviderType, ChurchDataProvider> = new Map();
  private defaultProvider: ProviderType;

  constructor(config: ProviderManagerConfig) {
    this.defaultProvider = config.defaultProvider ?? 'google_places';

    // Initialize Google Places if configured
    if (config.googlePlaces?.apiKey) {
      this.providers.set(
        'google_places',
        new GooglePlacesProvider({
          apiKey: config.googlePlaces.apiKey,
          defaultRadiusMiles: config.googlePlaces.defaultRadiusMiles,
        })
      );
    }

    // Initialize OpenStreetMap if configured
    if (config.openStreetMap?.userAgent) {
      this.providers.set(
        'openstreetmap',
        new OpenStreetMapProvider({
          userAgent: config.openStreetMap.userAgent,
        })
      );
    }

    // Bright Data would be initialized here when implemented
    // if (config.brightData?.apiKey) {
    //   this.providers.set('brightdata', new BrightDataProvider(config.brightData));
    // }
  }

  /**
   * Get a specific provider by name
   */
  getProvider(type: ProviderType): ChurchDataProvider | undefined {
    return this.providers.get(type);
  }

  /**
   * Get the default provider
   */
  getDefaultProvider(): ChurchDataProvider | undefined {
    return this.providers.get(this.defaultProvider);
  }

  /**
   * List all available (configured) providers
   */
  getAvailableProviders(): ProviderType[] {
    return Array.from(this.providers.keys());
  }

  /**
   * Search for churches using the specified provider (or default)
   */
  async searchChurches(
    params: ChurchSearchParams,
    providerType?: ProviderType
  ): Promise<ChurchSearchResult> {
    const provider = providerType
      ? this.providers.get(providerType)
      : this.getDefaultProvider();

    if (!provider) {
      throw new Error(
        `Provider ${providerType ?? this.defaultProvider} is not configured`
      );
    }

    return provider.searchChurches(params);
  }

  /**
   * Get church details using the specified provider (or default)
   */
  async getChurchDetails(
    sourceId: string,
    providerType?: ProviderType
  ): Promise<RawChurchData | null> {
    const provider = providerType
      ? this.providers.get(providerType)
      : this.getDefaultProvider();

    if (!provider) {
      throw new Error(
        `Provider ${providerType ?? this.defaultProvider} is not configured`
      );
    }

    if (!provider.getChurchDetails) {
      throw new Error(`Provider ${provider.name} does not support getChurchDetails`);
    }

    return provider.getChurchDetails(sourceId);
  }

  /**
   * Search across multiple providers and merge results
   * Useful for getting the most complete data
   */
  async searchAllProviders(
    params: ChurchSearchParams
  ): Promise<{ provider: ProviderType; result: ChurchSearchResult }[]> {
    const results: { provider: ProviderType; result: ChurchSearchResult }[] = [];

    for (const [type, provider] of this.providers) {
      try {
        const result = await provider.searchChurches(params);
        results.push({ provider: type, result });
      } catch (error) {
        console.error(`Error searching ${type}:`, error);
        // Continue with other providers
      }
    }

    return results;
  }

  /**
   * Set the default provider
   */
  setDefaultProvider(type: ProviderType): void {
    if (!this.providers.has(type)) {
      throw new Error(`Provider ${type} is not configured`);
    }
    this.defaultProvider = type;
  }
}

/**
 * Create a provider manager from environment variables
 */
export function createProviderManagerFromEnv(): ProviderManager {
  return new ProviderManager({
    defaultProvider: (process.env.DEFAULT_CHURCH_PROVIDER as ProviderType) ?? 'google_places',
    googlePlaces: process.env.GOOGLE_PLACES_API_KEY
      ? {
          apiKey: process.env.GOOGLE_PLACES_API_KEY,
          defaultRadiusMiles: process.env.DEFAULT_SEARCH_RADIUS_MILES
            ? parseInt(process.env.DEFAULT_SEARCH_RADIUS_MILES, 10)
            : undefined,
        }
      : undefined,
    openStreetMap: {
      // Always configure OSM since it doesn't require an API key
      userAgent: process.env.OSM_USER_AGENT ?? 'ChurchDirectory/1.0',
    },
    brightData: process.env.BRIGHTDATA_API_KEY
      ? {
          apiKey: process.env.BRIGHTDATA_API_KEY,
        }
      : undefined,
  });
}
