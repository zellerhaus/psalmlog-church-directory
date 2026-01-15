-- Enrichment Queue Table
-- Tracks churches that need AI enrichment processing

CREATE TABLE IF NOT EXISTS enrichment_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,

  -- Ensure one queue entry per church
  UNIQUE(church_id)
);

-- Index for efficient queue processing
CREATE INDEX IF NOT EXISTS idx_enrichment_queue_status ON enrichment_queue(status, created_at);

-- Index for church lookups
CREATE INDEX IF NOT EXISTS idx_enrichment_queue_church ON enrichment_queue(church_id);

-- Comments
COMMENT ON TABLE enrichment_queue IS 'Queue for AI enrichment processing of church records';
COMMENT ON COLUMN enrichment_queue.status IS 'pending: waiting, processing: in progress, completed: done, failed: error occurred';
