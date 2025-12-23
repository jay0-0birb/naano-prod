-- Diagnostic script to see what's actually in the database
-- Run this to understand the current state

-- 1. Count clicks vs leads for a specific collaboration
-- Replace 'YOUR_COLLAB_ID' with the actual collaboration ID
SELECT 
  'Clicks in link_events' as metric,
  COUNT(*) as count
FROM link_events le
JOIN tracked_links tl ON tl.id = le.tracked_link_id
WHERE tl.collaboration_id = 'YOUR_COLLAB_ID'  -- Replace with actual ID
  AND le.event_type = 'click'

UNION ALL

SELECT 
  'Leads in leads table' as metric,
  COUNT(*) as count
FROM leads l
JOIN tracked_links tl ON tl.id = l.tracked_link_id
WHERE tl.collaboration_id = 'YOUR_COLLAB_ID'  -- Replace with actual ID
  AND l.status = 'validated'

UNION ALL

SELECT 
  'Total creator earnings (from leads)' as metric,
  COALESCE(SUM(creator_earnings), 0) as count
FROM leads l
JOIN tracked_links tl ON tl.id = l.tracked_link_id
WHERE tl.collaboration_id = 'YOUR_COLLAB_ID'  -- Replace with actual ID
  AND l.status = 'validated';

-- 2. Check what the function returns
-- Replace 'YOUR_COLLAB_ID' with the actual collaboration ID
SELECT * FROM get_collaboration_metrics('YOUR_COLLAB_ID');  -- Replace with actual ID

-- 3. List all collaborations with their click/lead counts
SELECT 
  c.id as collaboration_id,
  COUNT(DISTINCT le.id) FILTER (WHERE le.event_type = 'click') as clicks,
  COUNT(DISTINCT l.id) FILTER (WHERE l.status = 'validated') as leads,
  COALESCE(SUM(l.creator_earnings) FILTER (WHERE l.status = 'validated'), 0) as total_earnings
FROM collaborations c
LEFT JOIN tracked_links tl ON tl.collaboration_id = c.id
LEFT JOIN link_events le ON le.tracked_link_id = tl.id
LEFT JOIN leads l ON l.tracked_link_id = tl.id
GROUP BY c.id
ORDER BY clicks DESC;

