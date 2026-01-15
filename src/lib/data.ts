import { supabase, isSupabaseConfigured } from './supabase';
import type { Church, City, State, ChurchFilters, PaginatedResult } from '@/types/database';
import type { StateContent, CityContent } from '@/types/content';
import { DEFAULT_PAGE_SIZE } from './constants';

// Get all states with church counts
export async function getStates(): Promise<State[]> {
  if (!isSupabaseConfigured() || !supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from('states')
    .select('*')
    .order('name');

  if (error) throw error;
  return data || [];
}

// Get a single state by slug
export async function getStateBySlug(slug: string): Promise<State | null> {
  if (!isSupabaseConfigured() || !supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from('states')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

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

  if (error) throw error;
  return data || [];
}

// Get a single city by slug and state
export async function getCityBySlug(stateAbbr: string, citySlug: string): Promise<City | null> {
  if (!isSupabaseConfigured() || !supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from('cities')
    .select('*')
    .eq('state_abbr', stateAbbr)
    .eq('slug', citySlug)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

// Get churches for a city with filters and pagination
export async function getChurchesByCity(
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

  if (error) throw error;

  return {
    data: data || [],
    total: count || 0,
    page,
    pageSize,
    totalPages: Math.ceil((count || 0) / pageSize),
  };
}

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

  if (error && error.code !== 'PGRST116') throw error;
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

  if (error) throw error;

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

  if (error) throw error;
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

  if (error) throw error;
  return data || [];
}

// Get featured cities with real-time church counts (aggregated from churches table)
export async function getFeaturedCitiesWithRealCounts(limit: number = 12): Promise<{ name: string; state_abbr: string; slug: string; state: string; church_count: number }[]> {
  if (!isSupabaseConfigured() || !supabase) {
    return [];
  }

  // Get all churches and aggregate by city+state
  const { data, error } = await supabase
    .from('churches')
    .select('city, state_abbr');

  if (error) throw error;
  if (!data || data.length === 0) return [];

  // Build a lookup for state abbreviation to state name
  const stateMap = new Map<string, string>();
  const { US_STATES } = await import('./constants');
  for (const state of US_STATES) {
    stateMap.set(state.abbr, state.name);
  }

  // Count churches per city+state combination
  const cityCounts = new Map<string, { name: string; state_abbr: string; count: number }>();
  for (const church of data as { city: string; state_abbr: string }[]) {
    const key = `${church.city}|${church.state_abbr}`;
    const existing = cityCounts.get(key);
    if (existing) {
      existing.count++;
    } else {
      cityCounts.set(key, { name: church.city, state_abbr: church.state_abbr, count: 1 });
    }
  }

  // Convert to array, sort by count descending, and limit
  const result = Array.from(cityCounts.values())
    .map((city) => ({
      name: city.name,
      state_abbr: city.state_abbr,
      slug: city.name.toLowerCase().replace(/\s+/g, '-'),
      state: stateMap.get(city.state_abbr) || city.state_abbr,
      church_count: city.count,
    }))
    .sort((a, b) => {
      if (b.church_count !== a.church_count) {
        return b.church_count - a.church_count;
      }
      return a.name.localeCompare(b.name);
    })
    .slice(0, limit);

  return result;
}

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

  if (error) throw error;
  return data || [];
}

// Get total church count for a state (real-time from churches table)
export async function getChurchCountByState(stateAbbr: string): Promise<number> {
  if (!isSupabaseConfigured() || !supabase) {
    return 0;
  }

  const { count, error } = await supabase
    .from('churches')
    .select('*', { count: 'exact', head: true })
    .eq('state_abbr', stateAbbr);

  if (error) throw error;
  return count || 0;
}

// Get cities with real church counts (aggregated from churches table)
export async function getCitiesWithChurchCounts(stateAbbr: string): Promise<{ name: string; slug: string; church_count: number }[]> {
  if (!isSupabaseConfigured() || !supabase) {
    return [];
  }

  // Get all churches for this state and aggregate by city
  const { data, error } = await supabase
    .from('churches')
    .select('city')
    .eq('state_abbr', stateAbbr);

  if (error) throw error;
  if (!data || data.length === 0) return [];

  // Count churches per city
  const cityCounts = new Map<string, number>();
  for (const church of data as { city: string }[]) {
    const city = church.city;
    cityCounts.set(city, (cityCounts.get(city) || 0) + 1);
  }

  // Convert to array with slugs and sort by count descending
  const result = Array.from(cityCounts.entries()).map(([name, count]) => ({
    name,
    slug: name.toLowerCase().replace(/\s+/g, '-'),
    church_count: count,
  }));

  // Sort by church count descending, then by name
  result.sort((a, b) => {
    if (b.church_count !== a.church_count) {
      return b.church_count - a.church_count;
    }
    return a.name.localeCompare(b.name);
  });

  return result;
}

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

  if (error) throw error;
  return (data as Church[]) || [];
}

// ============================================================================
// LOCATION CONTENT (Pre-generated state/city page content)
// ============================================================================

// Get pre-generated content for a state page
export async function getStateContent(stateAbbr: string): Promise<StateContent | null> {
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
    console.error('Error fetching state content:', error);
    return null;
  }

  return data as StateContent | null;
}

// Get pre-generated content for a city page
export async function getCityContent(
  stateAbbr: string,
  citySlug: string
): Promise<CityContent | null> {
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
    console.error('Error fetching city content:', error);
    return null;
  }

  return data as CityContent | null;
}
