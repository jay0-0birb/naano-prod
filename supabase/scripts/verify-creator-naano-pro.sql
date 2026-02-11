-- =====================================================
-- Verify if a creator has Naano Pro + Naano promo click stats
-- Usage: Run in Supabase SQL editor. Change the name below if needed.
-- Run query 1 first to see Pro status + click counts in one row.
-- =====================================================

-- 1) One-row summary: Naano Pro + how many clicks the Naano pro link got
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

-- 2) Last 20 promo events (date, IP, time on site in seconds)
WITH creator AS (
  SELECT cp.id AS creator_id
  FROM public.creator_profiles cp
  JOIN public.profiles p ON p.id = cp.profile_id
  WHERE p.full_name ILIKE '%Fred%Jérémie%'
     OR p.full_name ILIKE '%Fred Jeremie%'
     OR (cp.first_name ILIKE '%Fred%' AND cp.last_name ILIKE '%Jérémie%')
     OR (cp.first_name ILIKE '%Fred%' AND cp.last_name ILIKE '%Jeremie%')
  LIMIT 1
)
SELECT
  e.occurred_at,
  e.ip_address,
  e.time_on_site AS time_on_site_seconds,
  CASE WHEN e.time_on_site >= 3 THEN 'qualified' ELSE 'under_3s' END AS status
FROM public.naano_promo_events e
JOIN creator c ON c.creator_id = e.creator_id
ORDER BY e.occurred_at DESC
LIMIT 20;
