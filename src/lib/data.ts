import { supabase, isSupabaseConfigured } from './supabase';
import type { Church, City, State, ChurchFilters, PaginatedResult } from '@/types/database';
import type { StateContent, CityContent } from '@/types/content';
import { DEFAULT_PAGE_SIZE, US_STATES } from './constants';
import { unstable_cache } from 'next/cache';

// Set of state names (lowercase) to filter out invalid "cities"
const STATE_NAMES_SET = new Set(
  US_STATES.map(s => s.name.toLowerCase())
);

// Cache configuration
const CACHE_REVALIDATE_SHORT = 1; // 1 second (temporarily reduced to force fresh data)
const CACHE_REVALIDATE_MEDIUM = 1; // 1 second (temporarily reduced to force fresh data)
const CACHE_REVALIDATE_LONG = 1; // 1 second (temporarily reduced to force fresh data)
const CACHE_REVALIDATE_WEEK = 1; // 1 second (temporarily reduced to force fresh data)

// Helper to safely handle Supabase errors during build
function handleError(error: unknown, context: string): void {
  // Log error but don't throw - allows graceful degradation during build
  console.error(`Database error in ${context}:`, error);
}

// Get all states with church counts
export async function getStates(): Promise<State[]> {
  if (!isSupabaseConfigured() || !supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from('states')
    .select('*')
    .order('name');

  if (error) {
    handleError(error, 'getStates');
    return [];
  }
  return data || [];
}

// Internal function to get state by slug
async function _getStateBySlug(slug: string): Promise<State | null> {
  if (!isSupabaseConfigured() || !supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from('states')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error && error.code !== 'PGRST116') {
    handleError(error, 'getStateBySlug');
    return null;
  }
  return data;
}

// Get a single state by slug (cached for 1 week)
export const getStateBySlug = (slug: string) =>
  unstable_cache(
    () => _getStateBySlug(slug),
    ['state-by-slug', slug],
    { revalidate: CACHE_REVALIDATE_WEEK, tags: ['states', `state-${slug}`] }
  )();

// Get cities for a state
export async function getCitiesByState(stateAbbr: string): Promise<City[]> {
  if (!isSupabaseConfigured() || !supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from('cities')
    .select('*')
    .eq('state_abbr', stateAbbr)
    .order('name');

  if (error) {
    handleError(error, 'getCitiesByState');
    return [];
  }
  return data || [];
}

// Internal function to get city by slug
async function _getCityBySlug(stateAbbr: string, citySlug: string): Promise<City | null> {
  if (!isSupabaseConfigured() || !supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from('cities')
    .select('*')
    .eq('state_abbr', stateAbbr)
    .eq('slug', citySlug)
    .single();

  if (error && error.code !== 'PGRST116') {
    handleError(error, 'getCityBySlug');
    return null;
  }
  return data;
}

// Get a single city by slug and state (cached for 1 week)
export const getCityBySlug = (stateAbbr: string, citySlug: string) =>
  unstable_cache(
    () => _getCityBySlug(stateAbbr, citySlug),
    ['city-by-slug', stateAbbr, citySlug],
    { revalidate: CACHE_REVALIDATE_WEEK, tags: ['cities', `city-${stateAbbr}-${citySlug}`] }
  )();

// Internal function to get churches for a city with filters and pagination
async function _getChurchesByCity(
  stateAbbr: string,
  city: string,
  filters: ChurchFilters = {},
  page: number = 1,
  pageSize: number = DEFAULT_PAGE_SIZE
): Promise<PaginatedResult<Church>> {
  if (!isSupabaseConfigured() || !supabase) {
    return { data: [], total: 0, page, pageSize, totalPages: 0 };
  }

  let query = supabase
    .from('churches')
    .select('*', { count: 'exact' })
    .eq('state_abbr', stateAbbr)
    .ilike('city', city);

  // Apply filters
  if (filters.denomination) {
    query = query.eq('denomination', filters.denomination);
  }
  if (filters.worship_style) {
    query = query.contains('worship_style', [filters.worship_style]);
  }
  if (filters.has_kids_ministry) {
    query = query.eq('has_kids_ministry', true);
  }
  if (filters.has_youth_group) {
    query = query.eq('has_youth_group', true);
  }
  if (filters.has_small_groups) {
    query = query.eq('has_small_groups', true);
  }

  // Apply pagination
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  query = query.range(from, to).order('name');

  const { data, error, count } = await query;

  if (error) {
    handleError(error, 'getChurchesByCity');
    return { data: [], total: 0, page, pageSize, totalPages: 0 };
  }

  return {
    data: data || [],
    total: count || 0,
    page,
    pageSize,
    totalPages: Math.ceil((count || 0) / pageSize),
  };
}

// Get churches for a city with filters and pagination (cached for 1 week)
// Cache key includes all parameters to ensure unique caching per filter/page combination
export const getChurchesByCity = (
  stateAbbr: string,
  city: string,
  filters: ChurchFilters = {},
  page: number = 1,
  pageSize: number = DEFAULT_PAGE_SIZE
) =>
  unstable_cache(
    () => _getChurchesByCity(stateAbbr, city, filters, page, pageSize),
    [
      'churches-by-city',
      stateAbbr,
      city.toLowerCase(),
      JSON.stringify(filters),
      String(page),
      String(pageSize),
    ],
    { revalidate: CACHE_REVALIDATE_WEEK, tags: ['churches', `churches-${stateAbbr}-${city.toLowerCase()}`] }
  )();

// Get a single church by slug
export async function getChurchBySlug(
  stateAbbr: string,
  citySlug: string,
  churchSlug: string
): Promise<Church | null> {
  if (!isSupabaseConfigured() || !supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from('churches')
    .select('*')
    .eq('state_abbr', stateAbbr)
    .eq('slug', churchSlug)
    .single();

  if (error && error.code !== 'PGRST116') {
    handleError(error, 'getChurchBySlug');
    return null;
  }
  return data;
}

// Search churches by location (zip code or city name)
export async function searchChurches(
  query: string,
  filters: ChurchFilters = {},
  page: number = 1,
  pageSize: number = DEFAULT_PAGE_SIZE
): Promise<PaginatedResult<Church>> {
  if (!isSupabaseConfigured() || !supabase) {
    return { data: [], total: 0, page, pageSize, totalPages: 0 };
  }

  // Check if query looks like a zip code
  const isZipCode = /^\d{5}$/.test(query.trim());

  let dbQuery = supabase
    .from('churches')
    .select('*', { count: 'exact' });

  if (isZipCode) {
    dbQuery = dbQuery.eq('zip', query.trim());
  } else {
    // Search by city name (case insensitive)
    dbQuery = dbQuery.ilike('city', `%${query}%`);
  }

  // Apply filters
  if (filters.denomination) {
    dbQuery = dbQuery.eq('denomination', filters.denomination);
  }
  if (filters.worship_style) {
    dbQuery = dbQuery.contains('worship_style', [filters.worship_style]);
  }
  if (filters.has_kids_ministry) {
    dbQuery = dbQuery.eq('has_kids_ministry', true);
  }
  if (filters.has_youth_group) {
    dbQuery = dbQuery.eq('has_youth_group', true);
  }
  if (filters.has_small_groups) {
    dbQuery = dbQuery.eq('has_small_groups', true);
  }

  // Apply pagination
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  dbQuery = dbQuery.range(from, to).order('name');

  const { data, error, count } = await dbQuery;

  if (error) {
    handleError(error, 'searchChurches');
    return { data: [], total: 0, page, pageSize, totalPages: 0 };
  }

  return {
    data: data || [],
    total: count || 0,
    page,
    pageSize,
    totalPages: Math.ceil((count || 0) / pageSize),
  };
}

// Get total church count
export async function getTotalChurchCount(): Promise<number> {
  if (!isSupabaseConfigured() || !supabase) {
    return 0;
  }

  const { count, error } = await supabase
    .from('churches')
    .select('*', { count: 'exact', head: true });

  if (error) {
    handleError(error, 'getTotalChurchCount');
    return 0;
  }
  return count || 0;
}

// Get featured cities (cities with most churches)
export async function getFeaturedCities(limit: number = 12): Promise<City[]> {
  if (!isSupabaseConfigured() || !supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from('cities')
    .select('*')
    .order('church_count', { ascending: false })
    .limit(limit);

  if (error) {
    handleError(error, 'getFeaturedCities');
    return [];
  }
  return data || [];
}

// Internal function to fetch featured cities (will be cached)
// Aggregates from churches table for accurate real-time counts
async function _getFeaturedCitiesWithRealCounts(limit: number): Promise<{ name: string; state_abbr: string; slug: string; state: string; church_count: number }[]> {
  if (!isSupabaseConfigured() || !supabase) {
    return [];
  }

  // Get all churches and aggregate by city/state for accurate counts
  // Note: Supabase default limit is 1000, so we fetch in batches
  const allData: { city: string; state_abbr: string; state: string }[] = [];
  let offset = 0;
  const batchSize = 1000;

  while (true) {
    const { data, error } = await supabase
      .from('churches')
      .select('city, state_abbr, state')
      .range(offset, offset + batchSize - 1);

    if (error) {
      handleError(error, 'getFeaturedCitiesWithRealCounts');
      return [];
    }

    if (!data || data.length === 0) {
      break;
    }

    allData.push(...(data as { city: string; state_abbr: string; state: string }[]));

    // If we got fewer than batchSize, we've reached the end
    if (data.length < batchSize) {
      break;
    }

    offset += batchSize;
  }

  if (allData.length === 0) {
    return [];
  }

  // Aggregate by city+state
  const cityCounts = new Map<string, { name: string; state_abbr: string; state: string; count: number }>();
  for (const church of allData) {
    // Skip entries with empty/missing city names
    if (!church.city || church.city.trim() === '') {
      continue;
    }
    // Skip entries where city name matches a state name (data quality issue)
    if (STATE_NAMES_SET.has(church.city.toLowerCase())) {
      continue;
    }
    const key = `${church.city}|${church.state_abbr}`;
    const existing = cityCounts.get(key);
    if (existing) {
      existing.count++;
    } else {
      cityCounts.set(key, {
        name: church.city,
        state_abbr: church.state_abbr,
        state: church.state || church.state_abbr,
        count: 1,
      });
    }
  }

  // Convert to array, sort by count, limit, and format
  return Array.from(cityCounts.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)
    .map((city) => ({
      name: city.name,
      state_abbr: city.state_abbr,
      slug: city.name.toLowerCase().replace(/\s+/g, '-'),
      state: city.state,
      church_count: city.count,
    }));
}

// Get featured cities with real-time church counts (cached)
export const getFeaturedCitiesWithRealCounts = unstable_cache(
  _getFeaturedCitiesWithRealCounts,
  ['featured-cities'],
  { revalidate: CACHE_REVALIDATE_MEDIUM, tags: ['featured-cities'] }
);

// Internal function to fetch denomination stats (will be cached)
async function _getDenominationStats(limit: number): Promise<{ denomination: string; count: number }[]> {
  if (!isSupabaseConfigured() || !supabase) {
    return [];
  }

  // Note: Supabase default limit is 1000, so we fetch in batches
  const allData: { denomination: string | null }[] = [];
  let offset = 0;
  const batchSize = 1000;

  while (true) {
    const { data, error } = await supabase
      .from('churches')
      .select('denomination')
      .not('denomination', 'is', null)
      .range(offset, offset + batchSize - 1);

    if (error) {
      handleError(error, 'getDenominationStats');
      return [];
    }

    if (!data || data.length === 0) {
      break;
    }

    allData.push(...(data as { denomination: string | null }[]));

    // If we got fewer than batchSize, we've reached the end
    if (data.length < batchSize) {
      break;
    }

    offset += batchSize;
  }

  if (allData.length === 0) return [];

  // Count churches per denomination
  const denomCounts = new Map<string, number>();
  for (const church of allData) {
    const denom = church.denomination || 'Other';
    denomCounts.set(denom, (denomCounts.get(denom) || 0) + 1);
  }

  // Convert to array, sort by count descending, and limit
  return Array.from(denomCounts.entries())
    .map(([denomination, count]) => ({ denomination, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

// Get denomination statistics (cached for 1 hour)
export const getDenominationStats = unstable_cache(
  _getDenominationStats,
  ['denomination-stats'],
  { revalidate: CACHE_REVALIDATE_MEDIUM, tags: ['denomination-stats'] }
);

// Get popular states (states with most churches)
export async function getPopularStates(limit: number = 4): Promise<State[]> {
  if (!isSupabaseConfigured() || !supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from('states')
    .select('*')
    .order('church_count', { ascending: false })
    .limit(limit);

  if (error) {
    handleError(error, 'getPopularStates');
    return [];
  }
  return data || [];
}

// Internal function to get church count by state
async function _getChurchCountByState(stateAbbr: string): Promise<number> {
  if (!isSupabaseConfigured() || !supabase) {
    return 0;
  }

  const { count, error } = await supabase
    .from('churches')
    .select('*', { count: 'exact', head: true })
    .eq('state_abbr', stateAbbr);

  if (error) {
    handleError(error, 'getChurchCountByState');
    return 0;
  }
  return count || 0;
}

// Get total church count for a state (cached for 1 week)
export const getChurchCountByState = (stateAbbr: string) =>
  unstable_cache(
    () => _getChurchCountByState(stateAbbr),
    ['church-count-by-state', stateAbbr],
    { revalidate: CACHE_REVALIDATE_WEEK, tags: ['church-counts', `church-count-${stateAbbr}`] }
  )();

// Internal function to get cities with church counts (will be cached)
// Aggregates from churches table for accurate real-time counts
async function _getCitiesWithChurchCounts(stateAbbr: string): Promise<{ name: string; slug: string; church_count: number }[]> {
  if (!isSupabaseConfigured() || !supabase) {
    return [];
  }

  // Get all churches in the state and aggregate by city
  // This ensures accurate counts even if cities table church_count isn't populated
  // Note: Supabase default limit is 1000, so we fetch in batches for large states
  const allData: { city: string }[] = [];
  let offset = 0;
  const batchSize = 1000;

  while (true) {
    const { data, error } = await supabase
      .from('churches')
      .select('city')
      .eq('state_abbr', stateAbbr)
      .range(offset, offset + batchSize - 1);

    if (error) {
      handleError(error, 'getCitiesWithChurchCounts');
      return [];
    }

    if (!data || data.length === 0) {
      break;
    }

    allData.push(...(data as { city: string }[]));

    // If we got fewer than batchSize, we've reached the end
    if (data.length < batchSize) {
      break;
    }

    offset += batchSize;
  }

  if (allData.length === 0) {
    return [];
  }

  // Aggregate by city
  const cityCounts = new Map<string, number>();
  for (const church of allData) {
    const cityName = church.city;
    if (cityName) {
      cityCounts.set(cityName, (cityCounts.get(cityName) || 0) + 1);
    }
  }

  // Convert to array with slugs, sorted by count descending
  return Array.from(cityCounts.entries())
    .map(([name, count]) => ({
      name,
      slug: name.toLowerCase().replace(/\s+/g, '-'),
      church_count: count,
    }))
    .sort((a, b) => b.church_count - a.church_count);
}

// Get cities with church counts (cached for 1 week)
// Note: unstable_cache automatically includes function arguments in the cache key
export const getCitiesWithChurchCounts = (stateAbbr: string) =>
  unstable_cache(
    () => _getCitiesWithChurchCounts(stateAbbr),
    ['cities-with-counts', stateAbbr],
    { revalidate: CACHE_REVALIDATE_WEEK, tags: ['cities-with-counts', `cities-${stateAbbr}`] }
  )();

// Internal function to get ALL cities for sitemap (single query instead of 51)
async function _getAllCitiesForSitemap(): Promise<{ slug: string; state_abbr: string }[]> {
  if (!isSupabaseConfigured() || !supabase) {
    return [];
  }

  // Fetch all cities in a single query - only the fields we need for sitemaps
  const { data, error } = await supabase
    .from('cities')
    .select('slug, state_abbr')
    .order('state_abbr')
    .order('name');

  if (error) {
    handleError(error, 'getAllCitiesForSitemap');
    return [];
  }

  return (data as { slug: string; state_abbr: string }[]) || [];
}

// Get all cities for sitemap (cached for 24 hours)
export const getAllCitiesForSitemap = unstable_cache(
  _getAllCitiesForSitemap,
  ['all-cities-sitemap'],
  { revalidate: CACHE_REVALIDATE_LONG, tags: ['all-cities-sitemap'] }
);

// Internal function to get all churches for a state sitemap (single query)
async function _getChurchesForStateSitemap(stateAbbr: string, limit: number): Promise<{ slug: string; city: string; updated_at: string }[]> {
  if (!isSupabaseConfigured() || !supabase) {
    return [];
  }

  // Single efficient query - only fetch fields needed for sitemap
  const { data, error } = await supabase
    .from('churches')
    .select('slug, city, updated_at')
    .eq('state_abbr', stateAbbr)
    .order('city')
    .order('name')
    .limit(limit);

  if (error) {
    handleError(error, 'getChurchesForStateSitemap');
    return [];
  }

  return (data as { slug: string; city: string; updated_at: string }[]) || [];
}

// Get all churches for a state sitemap (cached for 24 hours)
// Note: Cache key includes stateAbbr and limit to ensure per-state caching
export const getChurchesForStateSitemap = (stateAbbr: string, limit: number) =>
  unstable_cache(
    () => _getChurchesForStateSitemap(stateAbbr, limit),
    ['churches-state-sitemap', stateAbbr, String(limit)],
    { revalidate: CACHE_REVALIDATE_LONG, tags: ['churches-state-sitemap'] }
  )();

// Get nearby churches by coordinates
export async function getNearbyChurches(
  lat: number,
  lng: number,
  radiusMiles: number = 10,
  limit: number = 20
): Promise<Church[]> {
  if (!isSupabaseConfigured() || !supabase) {
    return [];
  }

  // PostGIS query for nearby churches
  // Using type assertion since the RPC function is defined in SQL
  const { data, error } = await supabase.rpc('get_nearby_churches' as never, {
    search_lat: lat,
    search_lng: lng,
    radius_miles: radiusMiles,
    result_limit: limit,
  } as never);

  if (error) {
    handleError(error, 'getNearbyChurches');
    return [];
  }
  return (data as Church[]) || [];
}

// Get related churches (same city, different church OR nearby cities)
export async function getRelatedChurches(
  stateAbbr: string,
  city: string,
  currentChurchId: string,
  limit: number = 4
): Promise<Church[]> {
  if (!isSupabaseConfigured() || !supabase) {
    return [];
  }

  // First try to get other churches in the same city
  const { data: sameCityChurches, error: sameCityError } = await supabase
    .from('churches')
    .select('*')
    .eq('state_abbr', stateAbbr)
    .ilike('city', city)
    .neq('id', currentChurchId)
    .limit(limit);

  if (sameCityError) {
    handleError(sameCityError, 'getRelatedChurches');
    return [];
  }

  // If we have enough from the same city, return those
  if (sameCityChurches && sameCityChurches.length >= limit) {
    return sameCityChurches;
  }

  // Otherwise, get more from the same state to fill the gap
  const remaining = limit - (sameCityChurches?.length || 0);
  const existingIds = sameCityChurches?.map((c: Church) => c.id) || [];
  const excludeIds = [currentChurchId, ...existingIds];

  const { data: stateChurches, error: stateError } = await supabase
    .from('churches')
    .select('*')
    .eq('state_abbr', stateAbbr)
    .not('id', 'in', `(${excludeIds.join(',')})`)
    .limit(remaining);

  if (stateError) {
    handleError(stateError, 'getRelatedChurches');
    return sameCityChurches || [];
  }

  return [...(sameCityChurches || []), ...(stateChurches || [])];
}

// ============================================================================
// LOCATION CONTENT (Pre-generated state/city page content)
// ============================================================================

// Internal function to get state content
async function _getStateContent(stateAbbr: string): Promise<StateContent | null> {
  if (!isSupabaseConfigured() || !supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from('state_content')
    .select('*')
    .eq('state_abbr', stateAbbr)
    .single();

  // PGRST116 = not found, which is not an error for us
  if (error && error.code !== 'PGRST116') {
    handleError(error, 'getStateContent');
    return null;
  }

  return data as StateContent | null;
}

// Get pre-generated content for a state page (cached for 1 week)
export const getStateContent = (stateAbbr: string) =>
  unstable_cache(
    () => _getStateContent(stateAbbr),
    ['state-content', stateAbbr],
    { revalidate: CACHE_REVALIDATE_WEEK, tags: ['state-content', `state-content-${stateAbbr}`] }
  )();

// Internal function to get city content
async function _getCityContent(stateAbbr: string, citySlug: string): Promise<CityContent | null> {
  if (!isSupabaseConfigured() || !supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from('city_content')
    .select('*')
    .eq('state_abbr', stateAbbr)
    .eq('city_slug', citySlug)
    .single();

  // PGRST116 = not found, which is not an error for us
  if (error && error.code !== 'PGRST116') {
    handleError(error, 'getCityContent');
    return null;
  }

  return data as CityContent | null;
}

// Get pre-generated content for a city page (cached for 1 week)
export const getCityContent = (stateAbbr: string, citySlug: string) =>
  unstable_cache(
    () => _getCityContent(stateAbbr, citySlug),
    ['city-content', stateAbbr, citySlug],
    { revalidate: CACHE_REVALIDATE_WEEK, tags: ['city-content', `city-content-${stateAbbr}-${citySlug}`] }
  )();
