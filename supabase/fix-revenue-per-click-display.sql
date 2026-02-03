-- Fix: Dashboard revenue for collaborations was showing €1.20 per click (old default)
-- instead of €0.90 (standard) or €1.10 (Pro). Use creator_payout_amount when set.
-- Revenue = sum over leads (one lead per qualified click), so it accumulates with qualified clicks.
-- Run this in Supabase SQL Editor to update the function.
-- (Drop first because we're changing the return type: adding qualified_clicks.)

DROP FUNCTION IF EXISTS get_collaboration_metrics(uuid);

CREATE OR REPLACE FUNCTION get_collaboration_metrics(collab_id UUID)
RETURNS TABLE(
  impressions BIGINT,
  clicks BIGINT,
  qualified_clicks BIGINT,
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
  lead_metrics AS (
    -- Qualified clicks = count of leads (validated/billed). Revenue = sum of creator payout per lead.
    -- Each lead = 1 qualified click; revenue accumulates with qualified clicks (€0.90 or €1.10 each).
    SELECT 
      COUNT(*)::BIGINT as qualified_clicks,
      COALESCE(SUM(COALESCE(l.creator_payout_amount, l.creator_earnings)), 0)::DECIMAL as revenue
    FROM leads l
    JOIN tracked_links tl ON tl.id = l.tracked_link_id
    WHERE tl.collaboration_id = collab_id
      AND l.status IN ('validated', 'billed')
  )
  SELECT 
    lm.impressions,
    lm.clicks,
    COALESCE(llead.qualified_clicks, 0),
    COALESCE(llead.revenue, 0)
  FROM link_metrics lm
  CROSS JOIN lead_metrics llead;
END;
$$ LANGUAGE plpgsql;
