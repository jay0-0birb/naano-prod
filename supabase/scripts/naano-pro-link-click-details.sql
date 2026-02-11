-- =====================================================
-- Naano Pro link: who clicked (IP, device, time)
-- Use this to investigate a click: e.g. compare IP to creator's
-- or ask the creator "did you click from this IP at this time?"
-- We do NOT store referrer or where the link was posted (no LinkedIn/post proof).
-- =====================================================

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
  e.user_agent,
  CASE WHEN e.time_on_site >= 3 THEN 'qualified' ELSE 'under_3s' END AS status
FROM public.naano_promo_events e
JOIN creator c ON c.creator_id = e.creator_id
ORDER BY e.occurred_at DESC;
