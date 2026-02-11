-- =====================================================
-- Naano Pro link click count only (naano.xyz/?ref=CREATOR_ID)
-- This table (naano_promo_events) tracks that link only, not campaign links.
-- Run this whole script to get one row: has_naano_pro, total_clicks, qualified_clicks.
-- =====================================================

WITH creator AS (
  SELECT cp.id AS creator_id, cp.is_pro
  FROM public.creator_profiles cp
  JOIN public.profiles p ON p.id = cp.profile_id
  WHERE p.full_name ILIKE '%Fred%Jérémie%'
     OR p.full_name ILIKE '%Fred Jeremie%'
     OR (cp.first_name ILIKE '%Fred%' AND cp.last_name ILIKE '%Jérémie%')
     OR (cp.first_name ILIKE '%Fred%' AND cp.last_name ILIKE '%Jeremie%')
  LIMIT 1
)
SELECT
  COALESCE((SELECT is_pro FROM creator), false) AS has_naano_pro,
  COALESCE((SELECT COUNT(*) FROM public.naano_promo_events e JOIN creator c ON c.creator_id = e.creator_id), 0) AS total_clicks,
  COALESCE((
    SELECT COUNT(DISTINCT (e.creator_id, e.ip_address, date_trunc('hour', e.occurred_at)))
    FROM public.naano_promo_events e
    JOIN creator c ON c.creator_id = e.creator_id
    WHERE e.time_on_site >= 3
  ), 0) AS qualified_clicks,
  ROUND(COALESCE((
    SELECT COUNT(DISTINCT (e.creator_id, e.ip_address, date_trunc('hour', e.occurred_at)))
    FROM public.naano_promo_events e
    JOIN creator c ON c.creator_id = e.creator_id
    WHERE e.time_on_site >= 3
  ), 0) * 1.10, 2) AS estimated_payout_eur;
