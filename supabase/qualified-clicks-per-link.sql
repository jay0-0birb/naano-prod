-- =====================================================
-- QUALIFIED CLICKS PER LINK
-- =====================================================
-- View how many qualified clicks each tracked link has.
-- Qualified = not bot, time_on_site >= 3s, dedup by IP/hour.
--
-- Requires: is_bot_user_agent() from analytics-qualified-clicks.sql
-- =====================================================

-- Function: get qualified click count for a single link (by tracked_link_id)
CREATE OR REPLACE FUNCTION get_qualified_clicks_for_link(p_tracked_link_id UUID)
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
      le.time_on_site
    FROM link_events le
    WHERE le.tracked_link_id = p_tracked_link_id
      AND le.event_type = 'click'
  ),
  filtered_bots AS (
    SELECT * FROM all_clicks
    WHERE NOT is_bot_user_agent(user_agent)
  ),
  filtered_3sec AS (
    SELECT * FROM filtered_bots
    WHERE time_on_site >= 3
       OR (time_on_site IS NULL AND occurred_at > NOW() - INTERVAL '5 minutes')
  ),
  deduplicated AS (
    SELECT DISTINCT ON (ip_address, DATE_TRUNC('hour', occurred_at))
      id
    FROM filtered_3sec
    ORDER BY ip_address, DATE_TRUNC('hour', occurred_at), occurred_at DESC
  )
  SELECT COUNT(*) INTO qualified_count FROM deduplicated;
  RETURN COALESCE(qualified_count, 0);
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- USAGE (run after applying this script)
-- =====================================================

-- One link by UUID:
--   SELECT get_qualified_clicks_for_link('YOUR_TRACKED_LINK_ID'::uuid) AS qualified_clicks;

-- One link by hash (e.g. from URL /c/abc123):
--   SELECT tl.hash, get_qualified_clicks_for_link(tl.id) AS qualified_clicks
--   FROM tracked_links tl WHERE tl.hash = 'YOUR_HASH';

-- All links with qualified click count:
--   SELECT tl.id, tl.hash, tl.collaboration_id, tl.destination_url,
--          get_qualified_clicks_for_link(tl.id) AS qualified_clicks
--   FROM tracked_links tl ORDER BY qualified_clicks DESC;
