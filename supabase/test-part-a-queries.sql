-- =====================================================
-- PART A TESTING QUERIES
-- Click Logging and Session Intelligence (Layer 1)
-- =====================================================
-- Run these after clicking your tracking link
-- =====================================================

-- =====================================================
-- QUERY 1: Basic Click Recording
-- =====================================================
-- Verifies: Click logged, IP, user agent, referrer, device info, geo
SELECT 
  id,
  event_type,
  occurred_at,
  ip_address,
  user_agent,
  referrer,
  device_type,
  os,
  browser,
  network_type,
  country,
  city,
  time_on_site,
  session_id
FROM link_events
WHERE event_type = 'click'
ORDER BY occurred_at DESC
LIMIT 5;

-- =====================================================
-- QUERY 2: Check if Company was Enriched (Layer 2)
-- =====================================================
-- Verifies: Enrichment triggered, company inference created
SELECT 
  le.id as click_id,
  le.occurred_at as click_time,
  le.ip_address,
  le.network_type,
  le.country,
  le.city,
  ci.id as inference_id,
  ci.created_at as enrichment_time,
  ci.inferred_company_name,
  ci.confidence_score,
  ci.confidence_reasons,
  ci.is_ambiguous,
  ci.attribution_state,
  EXTRACT(EPOCH FROM (ci.created_at - le.occurred_at)) as enrichment_delay_seconds
FROM link_events le
LEFT JOIN company_inferences ci ON ci.link_event_id = le.id
WHERE le.event_type = 'click'
ORDER BY le.occurred_at DESC
LIMIT 5;

-- =====================================================
-- QUERY 3: Check if Intent Score was Calculated (Layer 3)
-- =====================================================
-- Verifies: Intent scoring works, repeat visits detected
SELECT 
  le.id as click_id,
  le.occurred_at,
  le.ip_address,
  le.referrer,
  le.time_on_site,
  intent.id as intent_score_id,
  intent.session_intent_score,
  intent.is_repeat_visit,
  intent.visit_count,
  intent.viewed_pricing,
  intent.viewed_security,
  intent.viewed_integrations,
  intent.intent_signals,
  intent.recency_weight,
  intent.days_since_session
FROM link_events le
LEFT JOIN intent_scores intent ON intent.link_event_id = le.id
WHERE le.event_type = 'click'
ORDER BY le.occurred_at DESC
LIMIT 5;

-- =====================================================
-- QUERY 4: Complete View (All 3 Layers Together)
-- =====================================================
-- Verifies: Everything works together - Layer 1, 2, and 3
SELECT 
  le.id as click_id,
  le.occurred_at,
  le.ip_address,
  le.country,
  le.city,
  le.device_type,
  le.os,
  le.browser,
  le.network_type,
  le.referrer,
  le.time_on_site,
  le.session_id,
  -- Layer 2: Company Inference
  ci.inferred_company_name,
  ci.confidence_score,
  ci.is_ambiguous,
  ci.attribution_state,
  ci.confidence_reasons,
  -- Layer 3: Intent Score
  intent.session_intent_score,
  intent.is_repeat_visit,
  intent.visit_count,
  intent.viewed_pricing,
  intent.viewed_security,
  intent.viewed_integrations
FROM link_events le
LEFT JOIN company_inferences ci ON ci.link_event_id = le.id
LEFT JOIN intent_scores intent ON intent.link_event_id = le.id
WHERE le.event_type = 'click'
ORDER BY le.occurred_at DESC
LIMIT 5;

-- =====================================================
-- BONUS: Quick Health Check
-- =====================================================
SELECT 
  'Total Clicks (Last Hour)' as metric,
  COUNT(*)::text as value
FROM link_events
WHERE event_type = 'click' AND occurred_at > NOW() - INTERVAL '1 hour'

UNION ALL

SELECT 
  'Clicks with Device Info',
  COUNT(*)::text
FROM link_events
WHERE event_type = 'click' 
  AND device_type IS NOT NULL
  AND occurred_at > NOW() - INTERVAL '1 hour'

UNION ALL

SELECT 
  'Clicks with Geo Data',
  COUNT(*)::text
FROM link_events
WHERE event_type = 'click' 
  AND country IS NOT NULL
  AND occurred_at > NOW() - INTERVAL '1 hour'

UNION ALL

SELECT 
  'Clicks with 3-Second Rule',
  COUNT(*)::text
FROM link_events
WHERE event_type = 'click' 
  AND time_on_site >= 3
  AND occurred_at > NOW() - INTERVAL '1 hour'

UNION ALL

SELECT 
  'Enriched Clicks',
  COUNT(*)::text
FROM link_events le
JOIN company_inferences ci ON ci.link_event_id = le.id
WHERE le.event_type = 'click' 
  AND le.occurred_at > NOW() - INTERVAL '1 hour'

UNION ALL

SELECT 
  'Intent Scores Calculated',
  COUNT(*)::text
FROM intent_scores
WHERE created_at > NOW() - INTERVAL '1 hour';

