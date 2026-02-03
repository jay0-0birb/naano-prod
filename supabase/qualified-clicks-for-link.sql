-- =====================================================
-- Qualified clicks for a specific tracked link
-- =====================================================
-- Replace 'YOUR_LINK_HASH' with the hash from your tracking URL.
-- Example: URL is /c/clark-kent-brand1-6zjv5p  →  hash is 'clark-kent-brand1-6zjv5p'
-- Run in Supabase SQL Editor.

SELECT
  tl.hash,
  tl.destination_url,
  (SELECT COUNT(*) FROM link_events le WHERE le.tracked_link_id = tl.id AND le.event_type = 'click') AS raw_clicks,
  (SELECT COUNT(*) FROM leads l WHERE l.tracked_link_id = tl.id AND l.status IN ('validated', 'billed')) AS qualified_clicks,
  (SELECT COALESCE(SUM(COALESCE(l.creator_payout_amount, l.creator_earnings)), 0) FROM leads l WHERE l.tracked_link_id = tl.id AND l.status IN ('validated', 'billed')) AS revenue_eur
FROM tracked_links tl
WHERE tl.hash = 'YOUR_LINK_HASH';

-- =====================================================
-- By tracked_link ID (replace the UUID)
-- =====================================================
-- SELECT
--   tl.hash,
--   tl.destination_url,
--   (SELECT COUNT(*) FROM link_events le WHERE le.tracked_link_id = tl.id AND le.event_type = 'click') AS raw_clicks,
--   (SELECT COUNT(*) FROM leads l WHERE l.tracked_link_id = tl.id AND l.status IN ('validated', 'billed')) AS qualified_clicks,
--   (SELECT COALESCE(SUM(COALESCE(l.creator_payout_amount, l.creator_earnings)), 0) FROM leads l WHERE l.tracked_link_id = tl.id AND l.status IN ('validated', 'billed')) AS revenue_eur
-- FROM tracked_links tl
-- WHERE tl.id = 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx';

-- =====================================================
-- All links with qualified click counts
-- =====================================================
-- SELECT
--   tl.hash,
--   tl.destination_url,
--   (SELECT COUNT(*) FROM link_events le WHERE le.tracked_link_id = tl.id AND le.event_type = 'click') AS raw_clicks,
--   (SELECT COUNT(*) FROM leads l WHERE l.tracked_link_id = tl.id AND l.status IN ('validated', 'billed')) AS qualified_clicks,
--   (SELECT COALESCE(SUM(COALESCE(l.creator_payout_amount, l.creator_earnings)), 0) FROM leads l WHERE l.tracked_link_id = tl.id AND l.status IN ('validated', 'billed')) AS revenue_eur
-- FROM tracked_links tl
-- ORDER BY qualified_clicks DESC;
