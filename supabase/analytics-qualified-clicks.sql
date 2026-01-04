-- =====================================================
-- ANALYTICS: QUALIFIED CLICKS FUNCTION
-- =====================================================
-- Implements filtering for qualified clicks:
-- 1. Anti-Bot: Filters known bot user agents
-- 2. IP Deduplication: Filters duplicate IPs within 1 hour
-- 3. Geo-targeting: (Future - requires IP geolocation)
-- 4. 3-second rule: (Future - requires SaaS-side integration)
-- =====================================================

-- Function to check if user agent is a bot
CREATE OR REPLACE FUNCTION is_bot_user_agent(user_agent_text TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  IF user_agent_text IS NULL OR user_agent_text = 'unknown' THEN
    RETURN false; -- Don't filter unknown, might be real users
  END IF;
  
  -- Common bot patterns (case-insensitive)
  RETURN (
    user_agent_text ILIKE '%bot%' OR
    user_agent_text ILIKE '%crawler%' OR
    user_agent_text ILIKE '%spider%' OR
    user_agent_text ILIKE '%scraper%' OR
    user_agent_text ILIKE '%headless%' OR
    user_agent_text ILIKE '%phantom%' OR
    user_agent_text ILIKE '%selenium%' OR
    user_agent_text ILIKE '%webdriver%' OR
    user_agent_text ILIKE '%curl%' OR
    user_agent_text ILIKE '%wget%' OR
    user_agent_text ILIKE '%python-requests%' OR
    user_agent_text ILIKE '%go-http-client%' OR
    user_agent_text ILIKE '%java/%' OR
    user_agent_text ILIKE '%http%' AND user_agent_text NOT ILIKE '%mozilla%' OR
    -- Known bot user agents
    user_agent_text ILIKE '%Googlebot%' OR
    user_agent_text ILIKE '%Bingbot%' OR
    user_agent_text ILIKE '%Slurp%' OR
    user_agent_text ILIKE '%DuckDuckBot%' OR
    user_agent_text ILIKE '%Baiduspider%' OR
    user_agent_text ILIKE '%YandexBot%' OR
    user_agent_text ILIKE '%Sogou%' OR
    user_agent_text ILIKE '%Exabot%' OR
    user_agent_text ILIKE '%facebot%' OR
    user_agent_text ILIKE '%ia_archiver%'
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to get qualified clicks count for a collaboration
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
      le.tracked_link_id
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
  deduplicated AS (
    SELECT DISTINCT ON (ip_address, DATE_TRUNC('hour', occurred_at))
      id,
      ip_address,
      occurred_at
    FROM filtered_bots
    ORDER BY ip_address, DATE_TRUNC('hour', occurred_at), occurred_at DESC
  )
  SELECT COUNT(*) INTO qualified_count
  FROM deduplicated;
  
  RETURN COALESCE(qualified_count, 0);
END;
$$ LANGUAGE plpgsql;

-- Function to get comprehensive analytics for a collaboration
CREATE OR REPLACE FUNCTION get_collaboration_analytics(collab_id UUID)
RETURNS TABLE(
  total_impressions BIGINT,
  total_clicks BIGINT,
  qualified_clicks BIGINT,
  leads_count BIGINT,
  total_lead_cost DECIMAL,
  savings_vs_linkedin DECIMAL
) AS $$
DECLARE
  v_impressions BIGINT;
  v_total_clicks BIGINT;
  v_qualified_clicks BIGINT;
  v_leads_count BIGINT;
  v_total_lead_cost DECIMAL;
  v_savings DECIMAL;
  linkedin_cost_per_click DECIMAL := 8.00; -- €8 per click on LinkedIn Ads
BEGIN
  -- Get impressions
  SELECT COUNT(*) INTO v_impressions
  FROM link_events le
  JOIN tracked_links tl ON tl.id = le.tracked_link_id
  WHERE tl.collaboration_id = collab_id
    AND le.event_type = 'impression';
  
  -- Get total clicks
  SELECT COUNT(*) INTO v_total_clicks
  FROM link_events le
  JOIN tracked_links tl ON tl.id = le.tracked_link_id
  WHERE tl.collaboration_id = collab_id
    AND le.event_type = 'click';
  
  -- Get qualified clicks (using the function above)
  SELECT get_qualified_clicks(collab_id) INTO v_qualified_clicks;
  
  -- Get leads count and total cost
  SELECT 
    COUNT(*),
    COALESCE(SUM(lead_value), 0)
  INTO v_leads_count, v_total_lead_cost
  FROM leads l
  JOIN tracked_links tl ON tl.id = l.tracked_link_id
  WHERE tl.collaboration_id = collab_id
    AND l.status IN ('validated', 'billed');
  
  -- Calculate savings: (Qualified Clicks × €8) - Total Lead Cost
  v_savings := (v_qualified_clicks * linkedin_cost_per_click) - COALESCE(v_total_lead_cost, 0);
  
  RETURN QUERY SELECT 
    COALESCE(v_impressions, 0),
    COALESCE(v_total_clicks, 0),
    COALESCE(v_qualified_clicks, 0),
    COALESCE(v_leads_count, 0),
    COALESCE(v_total_lead_cost, 0),
    COALESCE(v_savings, 0);
END;
$$ LANGUAGE plpgsql;

