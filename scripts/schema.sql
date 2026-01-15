-- Psalmlog Church Finder Database Schema
-- Run this in Supabase SQL Editor to set up the database

-- Enable PostGIS for geographic queries
CREATE EXTENSION IF NOT EXISTS postgis;

-- States table
CREATE TABLE IF NOT EXISTS states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  abbr TEXT NOT NULL,
  church_count INTEGER DEFAULT 0,
  city_count INTEGER DEFAULT 0
);

-- Cities table
CREATE TABLE IF NOT EXISTS cities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  state TEXT NOT NULL,
  state_abbr TEXT NOT NULL,
  lat DECIMAL(10, 8),
  lng DECIMAL(11, 8),
  church_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Churches table
CREATE TABLE IF NOT EXISTS churches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,

  -- Basic info
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  state_abbr TEXT NOT NULL,
  zip TEXT NOT NULL,
  lat DECIMAL(10, 8) NOT NULL,
  lng DECIMAL(11, 8) NOT NULL,
  location GEOGRAPHY(POINT, 4326),

  -- Contact
  phone TEXT,
  email TEXT,
  website TEXT,

  -- Classification
  denomination TEXT,
  worship_style TEXT[],

  -- Service info
  service_times JSONB,

  -- Programs
  has_kids_ministry BOOLEAN DEFAULT FALSE,
  has_youth_group BOOLEAN DEFAULT FALSE,
  has_small_groups BOOLEAN DEFAULT FALSE,

  -- AI content
  ai_description TEXT,
  ai_what_to_expect TEXT,
  ai_generated_at TIMESTAMP WITH TIME ZONE,

  -- Data source
  source TEXT,
  source_id TEXT,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_churches_city_state ON churches(city, state_abbr);
CREATE INDEX IF NOT EXISTS idx_churches_denomination ON churches(denomination);
CREATE INDEX IF NOT EXISTS idx_churches_slug ON churches(slug);
CREATE INDEX IF NOT EXISTS idx_churches_location ON churches USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_cities_state ON cities(state_abbr);
CREATE INDEX IF NOT EXISTS idx_cities_slug ON cities(slug);
CREATE INDEX IF NOT EXISTS idx_states_slug ON states(slug);

-- Trigger to auto-update location geography from lat/lng
CREATE OR REPLACE FUNCTION update_church_location()
RETURNS TRIGGER AS $$
BEGIN
  NEW.location = ST_SetSRID(ST_MakePoint(NEW.lng, NEW.lat), 4326);
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS church_location_trigger ON churches;
CREATE TRIGGER church_location_trigger
BEFORE INSERT OR UPDATE ON churches
FOR EACH ROW EXECUTE FUNCTION update_church_location();

-- Function to get nearby churches
CREATE OR REPLACE FUNCTION get_nearby_churches(
  search_lat DECIMAL,
  search_lng DECIMAL,
  radius_miles DECIMAL DEFAULT 10,
  result_limit INTEGER DEFAULT 20
)
RETURNS SETOF churches AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM churches
  WHERE ST_DWithin(
    location,
    ST_SetSRID(ST_MakePoint(search_lng, search_lat), 4326)::geography,
    radius_miles * 1609.34  -- Convert miles to meters
  )
  ORDER BY ST_Distance(
    location,
    ST_SetSRID(ST_MakePoint(search_lng, search_lat), 4326)::geography
  )
  LIMIT result_limit;
END;
$$ LANGUAGE plpgsql;

-- Row Level Security (RLS) policies
ALTER TABLE states ENABLE ROW LEVEL SECURITY;
ALTER TABLE cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE churches ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public read access on states"
  ON states FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public read access on cities"
  ON cities FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public read access on churches"
  ON churches FOR SELECT
  TO public
  USING (true);

-- Grant permissions
GRANT SELECT ON states TO anon, authenticated;
GRANT SELECT ON cities TO anon, authenticated;
GRANT SELECT ON churches TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_nearby_churches TO anon, authenticated;
