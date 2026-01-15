/**
 * Types for pre-generated location content (state and city pages)
 */

// Aggregated statistics for a location
export interface LocationStats {
  church_count: number;
  city_count?: number; // Only for states
  denominations: Record<string, number>;
  worship_styles: Record<string, number>;
  programs: {
    kids_ministry: number;
    youth_group: number;
    small_groups: number;
  };
}

// FAQ categories for organizing questions
export type FAQCategory = 'finding-church' | 'denominations' | 'programs' | 'visiting';

// Individual FAQ item
export interface FAQ {
  question: string;
  answer: string;
  category: FAQCategory;
}

// Pre-generated content for a state page
export interface StateContent {
  id: string;
  state_abbr: string;
  stats: LocationStats;
  overview: string | null;
  visitor_guide: string | null;
  historical_context: string | null;
  faqs: FAQ[];
  content_version: number;
  template_variant: number;
  ai_generated_at: string | null;
  stats_computed_at: string | null;
  created_at: string;
  updated_at: string;
}

// Pre-generated content for a city page
export interface CityContent {
  id: string;
  city_slug: string;
  state_abbr: string;
  city_name: string;
  stats: LocationStats;
  overview: string | null;
  visitor_guide: string | null;
  community_insights: string | null;
  faqs: FAQ[];
  content_version: number;
  template_variant: number;
  ai_generated_at: string | null;
  stats_computed_at: string | null;
  created_at: string;
  updated_at: string;
}

// Context used for template interpolation
export interface TemplateContext {
  // Location info
  locationName: string;
  locationType: 'state' | 'city';
  stateName?: string;
  stateAbbr?: string;

  // Statistics
  churchCount: number;
  cityCount?: number;
  topDenomination: string;
  topDenominationCount: number;
  topWorshipStyle: string;
  denominationList: string[];

  // Program stats
  kidsMinistryCount: number;
  kidsMinistryPercent: number;
  youthGroupCount: number;
  youthGroupPercent: number;
  smallGroupsCount: number;
  smallGroupsPercent: number;
}

// Database table types
export interface StateContentRow {
  id: string;
  state_abbr: string;
  stats: LocationStats;
  overview: string | null;
  visitor_guide: string | null;
  historical_context: string | null;
  faqs: FAQ[];
  content_version: number;
  template_variant: number;
  ai_generated_at: string | null;
  stats_computed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CityContentRow {
  id: string;
  city_slug: string;
  state_abbr: string;
  city_name: string;
  stats: LocationStats;
  overview: string | null;
  visitor_guide: string | null;
  community_insights: string | null;
  faqs: FAQ[];
  content_version: number;
  template_variant: number;
  ai_generated_at: string | null;
  stats_computed_at: string | null;
  created_at: string;
  updated_at: string;
}
