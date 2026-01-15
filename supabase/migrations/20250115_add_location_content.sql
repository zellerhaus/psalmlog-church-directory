-- Migration: Add location content tables for pre-generated state and city page content
-- Run this migration in your Supabase SQL Editor

-- State content table
CREATE TABLE IF NOT EXISTS state_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  state_abbr TEXT NOT NULL UNIQUE,

  -- Aggregated statistics (computed from churches)
  stats JSONB NOT NULL DEFAULT '{}',

  -- AI-generated content sections
  overview TEXT,
  visitor_guide TEXT,
  historical_context TEXT,

  -- FAQ content (JSON array for schema markup)
  faqs JSONB DEFAULT '[]',

  -- Metadata
  content_version INTEGER DEFAULT 1,
  template_variant INTEGER DEFAULT 1,
  ai_generated_at TIMESTAMP WITH TIME ZONE,
  stats_computed_at TIMESTAMP WITH TIME ZONE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast lookups by state
CREATE INDEX IF NOT EXISTS idx_state_content_abbr ON state_content(state_abbr);

-- City content table
CREATE TABLE IF NOT EXISTS city_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  city_slug TEXT NOT NULL,
  state_abbr TEXT NOT NULL,
  city_name TEXT NOT NULL,

  -- Aggregated statistics
  stats JSONB NOT NULL DEFAULT '{}',

  -- AI-generated content sections
  overview TEXT,
  visitor_guide TEXT,
  community_insights TEXT,

  -- FAQ content
  faqs JSONB DEFAULT '[]',

  -- Metadata
  content_version INTEGER DEFAULT 1,
  template_variant INTEGER DEFAULT 1,
  ai_generated_at TIMESTAMP WITH TIME ZONE,
  stats_computed_at TIMESTAMP WITH TIME ZONE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Composite unique constraint
  UNIQUE(city_slug, state_abbr)
);

-- Indexes for city content
CREATE INDEX IF NOT EXISTS idx_city_content_location ON city_content(city_slug, state_abbr);
CREATE INDEX IF NOT EXISTS idx_city_content_state ON city_content(state_abbr);

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for auto-updating timestamps
DROP TRIGGER IF EXISTS update_state_content_updated_at ON state_content;
CREATE TRIGGER update_state_content_updated_at
  BEFORE UPDATE ON state_content
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_city_content_updated_at ON city_content;
CREATE TRIGGER update_city_content_updated_at
  BEFORE UPDATE ON city_content
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (optional - adjust as needed)
ALTER TABLE state_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE city_content ENABLE ROW LEVEL SECURITY;

-- Public read access policies
CREATE POLICY "Allow public read access to state_content"
  ON state_content FOR SELECT
  USING (true);

CREATE POLICY "Allow public read access to city_content"
  ON city_content FOR SELECT
  USING (true);

-- Service role full access (for content generation scripts)
CREATE POLICY "Allow service role full access to state_content"
  ON state_content FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Allow service role full access to city_content"
  ON city_content FOR ALL
  USING (auth.role() = 'service_role');
