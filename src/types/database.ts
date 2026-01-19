export interface Database {
  public: {
    Tables: {
      churches: {
        Row: Church;
        Insert: Omit<Church, 'id' | 'created_at' | 'updated_at' | 'location'>;
        Update: Partial<Omit<Church, 'id' | 'created_at' | 'location'>>;
      };
      cities: {
        Row: City;
        Insert: Omit<City, 'id' | 'created_at'>;
        Update: Partial<Omit<City, 'id' | 'created_at'>>;
      };
      states: {
        Row: State;
        Insert: Omit<State, 'id'>;
        Update: Partial<Omit<State, 'id'>>;
      };
      church_claims: {
        Row: ChurchClaim;
        Insert: Omit<ChurchClaim, 'id' | 'created_at'>;
        Update: Partial<Omit<ChurchClaim, 'id' | 'created_at'>>;
      };
    };
    Views: {};
    Functions: {
      get_nearby_churches: {
        Args: {
          search_lat: number;
          search_lng: number;
          radius_miles: number;
          result_limit: number;
        };
        Returns: Church[];
      };
    };
    Enums: {};
  };
}

export interface Church {
  id: string;
  slug: string;

  // Basic info
  name: string;
  address: string;
  city: string;
  state: string;
  state_abbr: string;
  zip: string;
  lat: number;
  lng: number;
  location?: unknown; // PostGIS geography type

  // Contact
  phone: string | null;
  email: string | null;
  website: string | null;

  // Classification
  denomination: string | null;
  worship_style: string[] | null;

  // Service info
  service_times: ServiceTime[] | null;

  // Programs
  has_kids_ministry: boolean;
  has_youth_group: boolean;
  has_small_groups: boolean;

  // AI content
  ai_description: string | null;
  ai_what_to_expect: string | null;
  ai_generated_at: string | null;

  // Data source
  source: string | null;
  source_id: string | null;

  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface ServiceTime {
  day: string;
  time: string;
  name?: string;
}

export interface City {
  id: string;
  slug: string;
  name: string;
  state: string;
  state_abbr: string;
  lat: number | null;
  lng: number | null;
  church_count: number;
  created_at: string;
}

export interface State {
  id: string;
  slug: string;
  name: string;
  abbr: string;
  church_count: number;
  city_count: number;
}

// Filter types for search
export interface ChurchFilters {
  denomination?: string;
  worship_style?: string;
  has_kids_ministry?: boolean;
  has_youth_group?: boolean;
  has_small_groups?: boolean;
}

// Pagination
export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Church claim types
export const CHURCH_ROLES = [
  'Pastor',
  'Associate Pastor',
  'Administrator',
  'Staff Member',
  'Volunteer Leader',
  'Board Member',
  'Other',
] as const;

export type ChurchRole = (typeof CHURCH_ROLES)[number];

export interface ChurchClaim {
  id: string;
  church_id: string;
  church_name: string;
  full_name: string;
  email: string;
  phone: string;
  role: ChurchRole;
  role_description: string | null;
  verification_info: string | null;
  message: string | null;
  page_url: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_term: string | null;
  utm_content: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'needs_info';
  admin_notes: string | null;
  created_at: string;
}
