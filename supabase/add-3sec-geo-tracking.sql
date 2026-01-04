-- =====================================================
-- ADD 3-SECOND RULE & GEO-TARGETING SUPPORT
-- =====================================================
-- Adds time_on_site tracking for 3-second rule
-- Geo-targeting already has country/city fields
-- =====================================================

-- Add time_on_site field to link_events (in seconds)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'link_events' AND column_name = 'time_on_site'
  ) THEN
    ALTER TABLE link_events 
    ADD COLUMN time_on_site INTEGER; -- Time in seconds
  END IF;
END $$;

-- Add index for faster qualified clicks queries
CREATE INDEX IF NOT EXISTS idx_link_events_time_on_site 
ON link_events(time_on_site) 
WHERE event_type = 'click' AND time_on_site IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_link_events_country 
ON link_events(country) 
WHERE event_type = 'click' AND country IS NOT NULL;

-- Note: Geo-targeting is now automatic data collection only
-- No configuration needed - we just collect country/city for analytics

-- Update qualified clicks function to include 3-second rule (automatic, no config needed)
-- Geo data is collected automatically but not used for filtering (just for analytics display)
CREATE OR REPLACE FUNCTION get_qualified_clicks(collab_id UUID)
RETURNS BIGINT AS $$
DECLARE
  qualified_count BIGINT;
BEGIN
  WITH all_clicks AS (
    SELECT 
      le.id,
      le.ip_address,
      le.user_agent,
      le.occurred_at,
      le.tracked_link_id,
      le.time_on_site,
      le.country
    FROM link_events le
    JOIN tracked_links tl ON tl.id = le.tracked_link_id
    WHERE tl.collaboration_id = collab_id
      AND le.event_type = 'click'
  ),
  filtered_bots AS (
    SELECT *
    FROM all_clicks
    WHERE NOT is_bot_user_agent(user_agent)
  ),
  filtered_3sec AS (
    -- 3-second rule: only include clicks where user stayed 3+ seconds
    -- OR time_on_site is NULL AND click is very recent (within last 5 minutes)
    -- This excludes old clicks from before 3-second rule was implemented
    SELECT *
    FROM filtered_bots
    WHERE time_on_site >= 3
       OR (time_on_site IS NULL AND occurred_at > NOW() - INTERVAL '5 minutes')
  ),
  deduplicated AS (
    SELECT DISTINCT ON (ip_address, DATE_TRUNC('hour', occurred_at))
      id,
      ip_address,
      occurred_at
    FROM filtered_3sec
    ORDER BY ip_address, DATE_TRUNC('hour', occurred_at), occurred_at DESC
  )
  SELECT COUNT(*) INTO qualified_count
  FROM deduplicated;
  
  RETURN COALESCE(qualified_count, 0);
END;
$$ LANGUAGE plpgsql;

