-- =====================================================
-- TRACKING SYSTEM V2 - Complete Implementation
-- =====================================================
-- Supports: Impressions, Clicks, Revenue Attribution (30-day cookie)
-- Format: naano.com/c/[CREATOR_ID]-[SAAS_ID]-[UNIQUE_HASH]

-- =====================================================
-- 1. DROP OLD TABLES (if they exist)
-- =====================================================
DROP POLICY IF EXISTS "Users can view their collaboration tracking links" ON tracked_links;
DROP POLICY IF EXISTS "System can create tracking links" ON tracked_links;
DROP POLICY IF EXISTS "Users can view clicks for their links" ON link_clicks;
DROP POLICY IF EXISTS "Anyone can log clicks" ON link_clicks;

DROP TABLE IF EXISTS link_clicks CASCADE;
DROP TABLE IF EXISTS tracked_links CASCADE;

-- =====================================================
-- 2. CREATE NEW TABLES
-- =====================================================

-- Table: tracked_links
-- Stores unique tracking URLs for each collaboration
CREATE TABLE tracked_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collaboration_id UUID NOT NULL REFERENCES collaborations(id) ON DELETE CASCADE,
  hash TEXT NOT NULL UNIQUE, -- Format: creator-id-saas-id-randomhash
  destination_url TEXT NOT NULL, -- SaaS website URL
  
  -- Configurable tracking options (set by SaaS)
  track_impressions BOOLEAN DEFAULT true,
  track_clicks BOOLEAN DEFAULT true,
  track_revenue BOOLEAN DEFAULT false, -- Requires cookie integration
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: link_events
-- Logs ALL interactions (impressions, clicks, conversions)
CREATE TABLE link_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tracked_link_id UUID NOT NULL REFERENCES tracked_links(id) ON DELETE CASCADE,
  
  -- Event type
  event_type TEXT NOT NULL CHECK (event_type IN ('impression', 'click', 'conversion')),
  
  -- Metadata
  occurred_at TIMESTAMPTZ DEFAULT NOW(),
  ip_address TEXT,
  user_agent TEXT,
  referrer TEXT,
  
  -- Geo data (optional)
  country TEXT,
  city TEXT,
  
  -- Revenue tracking (for conversions only)
  revenue_amount DECIMAL(10, 2), -- Amount in EUR
  
  -- Cookie tracking
  session_id TEXT, -- 30-day cookie ID for attribution
  
  -- Indexes
  CONSTRAINT valid_revenue CHECK (
    (event_type = 'conversion' AND revenue_amount IS NOT NULL) OR 
    (event_type != 'conversion' AND revenue_amount IS NULL)
  )
);

-- Table: saas_tracking_config
-- Allows each SaaS to configure which metrics they want to track
CREATE TABLE saas_tracking_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  saas_id UUID NOT NULL REFERENCES saas_companies(id) ON DELETE CASCADE UNIQUE,
  
  -- Tracking preferences
  track_impressions BOOLEAN DEFAULT true,
  track_clicks BOOLEAN DEFAULT true,
  track_revenue BOOLEAN DEFAULT false,
  
  -- Revenue attribution settings
  cookie_lifetime_days INTEGER DEFAULT 30,
  
  -- Commission settings (for future use)
  price_per_click DECIMAL(10, 2) DEFAULT 0.50,
  price_per_impression DECIMAL(10, 4) DEFAULT 0.01,
  revenue_commission_percent DECIMAL(5, 2) DEFAULT 15.00,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 3. ENABLE ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE tracked_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE link_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE saas_tracking_config ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tracked_links
CREATE POLICY "Users can view their collaboration tracking links"
  ON tracked_links FOR SELECT
  USING (
    collaboration_id IN (
      SELECT c.id FROM collaborations c
      JOIN applications a ON a.id = c.application_id
      JOIN creator_profiles cp ON cp.id = a.creator_id
      WHERE cp.profile_id = auth.uid()
    )
    OR
    collaboration_id IN (
      SELECT c.id FROM collaborations c
      JOIN applications a ON a.id = c.application_id
      JOIN saas_companies sc ON sc.id = a.saas_id
      WHERE sc.profile_id = auth.uid()
    )
  );

CREATE POLICY "System can create tracking links"
  ON tracked_links FOR INSERT
  WITH CHECK (true);

CREATE POLICY "System can update tracking links"
  ON tracked_links FOR UPDATE
  USING (true);

-- RLS Policies for link_events
CREATE POLICY "Users can view events for their links"
  ON link_events FOR SELECT
  USING (
    tracked_link_id IN (
      SELECT tl.id FROM tracked_links tl
      JOIN collaborations c ON c.id = tl.collaboration_id
      JOIN applications a ON a.id = c.application_id
      JOIN creator_profiles cp ON cp.id = a.creator_id
      WHERE cp.profile_id = auth.uid()
    )
    OR
    tracked_link_id IN (
      SELECT tl.id FROM tracked_links tl
      JOIN collaborations c ON c.id = tl.collaboration_id
      JOIN applications a ON a.id = c.application_id
      JOIN saas_companies sc ON sc.id = a.saas_id
      WHERE sc.profile_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can log events"
  ON link_events FOR INSERT
  WITH CHECK (true);

-- RLS Policies for saas_tracking_config
CREATE POLICY "SaaS can view their own config"
  ON saas_tracking_config FOR SELECT
  USING (
    saas_id IN (
      SELECT id FROM saas_companies WHERE profile_id = auth.uid()
    )
  );

CREATE POLICY "SaaS can update their own config"
  ON saas_tracking_config FOR UPDATE
  USING (
    saas_id IN (
      SELECT id FROM saas_companies WHERE profile_id = auth.uid()
    )
  );

CREATE POLICY "System can create config"
  ON saas_tracking_config FOR INSERT
  WITH CHECK (true);

-- =====================================================
-- 4. CREATE INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX idx_tracked_links_hash ON tracked_links(hash);
CREATE INDEX idx_tracked_links_collaboration ON tracked_links(collaboration_id);
CREATE INDEX idx_link_events_tracked_link ON link_events(tracked_link_id);
CREATE INDEX idx_link_events_occurred_at ON link_events(occurred_at);
CREATE INDEX idx_link_events_event_type ON link_events(event_type);
CREATE INDEX idx_link_events_session_id ON link_events(session_id);
CREATE INDEX idx_saas_tracking_config_saas ON saas_tracking_config(saas_id);

-- =====================================================
-- 5. CREATE HELPER FUNCTIONS
-- =====================================================

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tracked_links_updated_at
  BEFORE UPDATE ON tracked_links
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER saas_tracking_config_updated_at
  BEFORE UPDATE ON saas_tracking_config
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Function to get impression count for a tracking link
CREATE OR REPLACE FUNCTION get_impression_count(link_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*) 
    FROM link_events 
    WHERE tracked_link_id = link_id AND event_type = 'impression'
  );
END;
$$ LANGUAGE plpgsql;

-- Function to get click count for a tracking link
CREATE OR REPLACE FUNCTION get_click_count(link_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*) 
    FROM link_events 
    WHERE tracked_link_id = link_id AND event_type = 'click'
  );
END;
$$ LANGUAGE plpgsql;

-- Function to get total revenue for a tracking link
CREATE OR REPLACE FUNCTION get_revenue_total(link_id UUID)
RETURNS DECIMAL AS $$
BEGIN
  RETURN (
    SELECT COALESCE(SUM(revenue_amount), 0) 
    FROM link_events 
    WHERE tracked_link_id = link_id AND event_type = 'conversion'
  );
END;
$$ LANGUAGE plpgsql;

-- Function to get all metrics for a collaboration
CREATE OR REPLACE FUNCTION get_collaboration_metrics(collab_id UUID)
RETURNS TABLE(
  impressions BIGINT,
  clicks BIGINT,
  revenue DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  WITH link_metrics AS (
    SELECT 
      COUNT(*) FILTER (WHERE le.event_type = 'impression') as impressions,
      COUNT(*) FILTER (WHERE le.event_type = 'click') as clicks
    FROM link_events le
    JOIN tracked_links tl ON tl.id = le.tracked_link_id
    WHERE tl.collaboration_id = collab_id
  ),
  lead_revenue AS (
    -- BP1 model: CA généré on collaboration page = lifetime creator earnings for this collab
    -- We include both 'validated' (not yet billed) and 'billed' (already paid by SaaS)
    -- so influencers always see the TOTAL CA generated, even after invoicing.
    SELECT COALESCE(SUM(creator_earnings), 0) as revenue
    FROM leads l
    JOIN tracked_links tl ON tl.id = l.tracked_link_id
    WHERE tl.collaboration_id = collab_id
      AND l.status IN ('validated', 'billed')
  )
  SELECT 
    lm.impressions,
    lm.clicks,
    lr.revenue
  FROM link_metrics lm
  CROSS JOIN lead_revenue lr;
END;
$$ LANGUAGE plpgsql;

-- Function to check if a session already converted (prevent double-counting)
CREATE OR REPLACE FUNCTION has_session_converted(link_id UUID, sess_id TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS(
    SELECT 1 
    FROM link_events 
    WHERE tracked_link_id = link_id 
      AND session_id = sess_id 
      AND event_type = 'conversion'
  );
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 6. CREATE DEFAULT CONFIGS FOR EXISTING SAAS
-- =====================================================

-- Insert default tracking config for all existing SaaS companies
INSERT INTO saas_tracking_config (saas_id, track_impressions, track_clicks, track_revenue)
SELECT id, true, true, false
FROM saas_companies
ON CONFLICT (saas_id) DO NOTHING;

-- =====================================================
-- DONE! 🎉
-- =====================================================
-- Tables created:
-- - tracked_links (stores tracking URLs)
-- - link_events (logs impressions, clicks, conversions)
-- - saas_tracking_config (per-SaaS tracking preferences)
--
-- Ready to use!

