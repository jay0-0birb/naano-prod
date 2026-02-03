-- =====================================================
-- Details of each qualified click for a specific link
-- (Same fields as one row in the Lead Feed CSV export)
-- =====================================================
-- Replace 'YOUR_LINK_HASH' with the hash from your tracking URL.
-- Example: URL /c/clark-kent-brand1-6zjv5p  →  hash 'clark-kent-brand1-6zjv5p'
-- Run in Supabase SQL Editor.

-- One row per qualified click (lead), with session + company + intent columns
SELECT
  -- Basic info
  le.occurred_at::date AS date,
  to_char(le.occurred_at, 'HH24:MI:SS') AS time,
  p.full_name AS creator,
  -- Lead / payout
  l.id AS lead_id,
  l.creator_payout_amount,
  l.status AS lead_status,
  -- Layer 1: Session
  regexp_replace(le.ip_address, '\.\d+$', '.x') AS ip_masked,
  le.country,
  le.city,
  le.device_type,
  le.os,
  le.browser,
  le.network_type,
  CASE lower(COALESCE(le.network_type, ''))
    WHEN 'corporate' THEN 'Corporate'
    WHEN 'residential' THEN 'Individual'
    WHEN 'mobile' THEN 'Mobile'
    WHEN 'hosting' THEN 'Hosting'
    WHEN 'vpn' THEN 'VPN'
    WHEN 'proxy' THEN 'Proxy'
    ELSE 'Unknown'
  END AS lead_type,
  le.time_on_site AS time_on_site_sec,
  le.referrer,
  le.session_id,
  -- Layer 2: Company inference
  ci.inferred_company_name AS company_name,
  ci.inferred_company_domain AS company_domain,
  ci.inferred_industry AS industry,
  ci.inferred_company_size AS company_size,
  ci.inferred_location AS company_location,
  -- Confidence: from company_inferences (null if enrichment didn't create one). Lead Feed shows rows where confidence ≥ 30%.
  (SELECT round((c.confidence_score * 100)::numeric, 1) FROM company_inferences c WHERE c.link_event_id = le.id ORDER BY c.confidence_score DESC NULLS LAST LIMIT 1) AS confidence_pct,
  (SELECT (c.confidence_score >= 0.30 AND c.inferred_company_name IS NOT NULL) FROM company_inferences c WHERE c.link_event_id = le.id LIMIT 1) AS in_lead_feed,
  (SELECT c.confidence_score FROM company_inferences c WHERE c.link_event_id = le.id ORDER BY c.confidence_score DESC NULLS LAST LIMIT 1) AS confidence_score_raw,
  ci.attribution_state,
  ci.confidence_reasons,
  ci.asn_organization,
  COALESCE(ci.is_ambiguous, false) AS is_ambiguous,
  ci.created_at AS enrichment_date,
  ci.confirmed_at AS confirmation_date,
  -- Layer 3: Intent
  ins.session_intent_score,
  ins.is_repeat_visit,
  ins.visit_count,
  COALESCE(ins.recency_weight, 1) AS recency_weight,
  ins.days_since_session,
  COALESCE(ins.viewed_pricing, false) AS viewed_pricing,
  COALESCE(ins.viewed_security, false) AS viewed_security,
  COALESCE(ins.viewed_integrations, false) AS viewed_integrations,
  ins.intent_signals
FROM leads l
JOIN tracked_links tl ON tl.id = l.tracked_link_id
LEFT JOIN link_events le ON le.id = l.link_event_id
LEFT JOIN creator_profiles cp ON cp.id = l.creator_id
LEFT JOIN profiles p ON p.id = cp.profile_id
LEFT JOIN LATERAL (
  SELECT * FROM company_inferences
  WHERE link_event_id = le.id
  ORDER BY confidence_score DESC NULLS LAST
  LIMIT 1
) ci ON true
LEFT JOIN LATERAL (
  SELECT * FROM intent_scores
  WHERE link_event_id = le.id
  LIMIT 1
) ins ON true
WHERE tl.hash = 'YOUR_LINK_HASH'
  AND l.status IN ('validated', 'billed')
ORDER BY le.occurred_at DESC;

-- =====================================================
-- By tracked_link ID (replace the UUID)
-- =====================================================
-- Same SELECT as above, but replace the WHERE clause with:
-- WHERE tl.id = 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'
--   AND l.status IN ('validated', 'billed')
-- ORDER BY le.occurred_at DESC;
