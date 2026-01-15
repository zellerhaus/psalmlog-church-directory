/**
 * Church Data Providers
 *
 * Export all providers and types for easy importing.
 * To add a new provider:
 * 1. Create a new file implementing ChurchDataProvider
 * 2. Export it from this index file
 * 3. Add configuration to ProviderManager
 */

// Types
export type {
  RawChurchData,
  ChurchSearchParams,
  ChurchSearchResult,
  ChurchDataProvider,
  OperatingHours,
  EnrichmentStatus,
  ChurchWithEnrichment,
  ServiceTimeInfo,
  GooglePlacesConfig,
  BrightDataConfig,
  OpenStreetMapConfig,
} from './types';

// Providers
export { GooglePlacesProvider, createGooglePlacesProvider } from './google-places';
export { OpenStreetMapProvider, createOpenStreetMapProvider } from './openstreetmap';

// Provider manager for easy switching
export { ProviderManager, createProviderManagerFromEnv, type ProviderType } from './provider-manager';
