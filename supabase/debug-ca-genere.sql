-- Debug script to check why CA généré is €0.00
-- Replace COLLAB_ID with the actual collaboration ID

-- 1. Check if leads exist for this collaboration
SELECT 
  l.id,
  l.tracked_link_id,
  l.creator_id,
  l.saas_id,
  l.status,
  l.creator_earnings,
  l.created_at,
  tl.collaboration_id
FROM leads l
JOIN tracked_links tl ON tl.id = l.tracked_link_id
WHERE tl.collaboration_id = 'COLLAB_ID'  -- Replace with actual collaboration ID
ORDER BY l.created_at DESC;

-- 2. Check tracked links for this collaboration
SELECT 
  tl.id,
  tl.hash,
  tl.collaboration_id,
  COUNT(le.id) as click_count
FROM tracked_links tl
LEFT JOIN link_events le ON le.tracked_link_id = tl.id AND le.event_type = 'click'
WHERE tl.collaboration_id = 'COLLAB_ID'  -- Replace with actual collaboration ID
GROUP BY tl.id, tl.hash, tl.collaboration_id;

-- 3. Test the metrics function directly
SELECT * FROM get_collaboration_metrics('COLLAB_ID');  -- Replace with actual collaboration ID

-- 4. Check if leads exist but aren't validated
SELECT 
  COUNT(*) as total_leads,
  COUNT(*) FILTER (WHERE status = 'validated') as validated_leads,
  SUM(creator_earnings) FILTER (WHERE status = 'validated') as total_revenue
FROM leads l
JOIN tracked_links tl ON tl.id = l.tracked_link_id
WHERE tl.collaboration_id = 'COLLAB_ID';  -- Replace with actual collaboration ID



