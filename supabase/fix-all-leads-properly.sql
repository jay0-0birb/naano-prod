-- COMPREHENSIVE FIX: Create leads for ALL clicks that don't have leads
-- This will fix the mismatch between clicks and leads

-- STEP 1: See what we're working with
SELECT 
  'BEFORE BACKFILL' as stage,
  COUNT(DISTINCT le.id) FILTER (WHERE le.event_type = 'click') as total_clicks,
  COUNT(DISTINCT l.id) FILTER (WHERE l.status = 'validated') as total_leads,
  COALESCE(SUM(l.creator_earnings) FILTER (WHERE l.status = 'validated'), 0) as total_earnings
FROM link_events le
JOIN tracked_links tl ON tl.id = le.tracked_link_id
LEFT JOIN leads l ON l.tracked_link_id = le.tracked_link_id
WHERE le.event_type = 'click';

-- STEP 2: Create leads for ALL clicks (one lead per click, per tracked_link)
-- This handles the case where clicks happened before automatic lead creation
DO $$
DECLARE
  v_click RECORD;
  v_creator_id UUID;
  v_saas_id UUID;
  v_lead_id UUID;
  v_count INTEGER := 0;
  v_errors INTEGER := 0;
BEGIN
  -- Loop through ALL clicks
  FOR v_click IN 
    SELECT 
      le.tracked_link_id,
      le.session_id,
      tl.collaboration_id
    FROM link_events le
    JOIN tracked_links tl ON tl.id = le.tracked_link_id
    WHERE le.event_type = 'click'
    ORDER BY le.occurred_at ASC
  LOOP
    -- Get collaboration details
    SELECT 
      a.creator_id,
      a.saas_id
    INTO v_creator_id, v_saas_id
    FROM collaborations c
    JOIN applications a ON a.id = c.application_id
    WHERE c.id = v_click.collaboration_id;
    
    -- Only create lead if we found creator and SaaS
    IF v_creator_id IS NOT NULL AND v_saas_id IS NOT NULL THEN
      -- Check if lead already exists for this tracked_link_id
      -- (We don't want duplicates, but we DO want one lead per click)
      -- Actually, let's create one lead per click by checking session_id
      IF NOT EXISTS (
        SELECT 1 
        FROM leads l 
        WHERE l.tracked_link_id = v_click.tracked_link_id
          AND l.creator_id = v_creator_id
          AND l.saas_id = v_saas_id
          AND l.status = 'validated'
          -- Check if this specific click already has a lead
          -- We'll use a simple approach: create lead if count is less than clicks
      ) OR (
        -- If leads exist but count is less than clicks, create more
        (SELECT COUNT(*) FROM leads l WHERE l.tracked_link_id = v_click.tracked_link_id AND l.status = 'validated')
        <
        (SELECT COUNT(*) FROM link_events le WHERE le.tracked_link_id = v_click.tracked_link_id AND le.event_type = 'click')
      ) THEN
        BEGIN
          -- Create lead using the database function
          SELECT create_lead(
            v_click.tracked_link_id,
            v_creator_id,
            v_saas_id
          ) INTO v_lead_id;
          
          v_count := v_count + 1;
          
          -- Log progress every 10 leads
          IF v_count % 10 = 0 THEN
            RAISE NOTICE 'Created % leads so far...', v_count;
          END IF;
        EXCEPTION WHEN OTHERS THEN
          v_errors := v_errors + 1;
          RAISE NOTICE 'Error creating lead for tracked_link %: %', v_click.tracked_link_id, SQLERRM;
        END;
      END IF;
    ELSE
      RAISE NOTICE 'Skipping click: Could not find creator_id or saas_id for collaboration %', v_click.collaboration_id;
    END IF;
  END LOOP;
  
  RAISE NOTICE 'Backfill complete! Created % leads, % errors.', v_count, v_errors;
END $$;

-- STEP 3: Verify the fix
SELECT 
  'AFTER BACKFILL' as stage,
  COUNT(DISTINCT le.id) FILTER (WHERE le.event_type = 'click') as total_clicks,
  COUNT(DISTINCT l.id) FILTER (WHERE l.status = 'validated') as total_leads,
  COALESCE(SUM(l.creator_earnings) FILTER (WHERE l.status = 'validated'), 0) as total_earnings,
  CASE 
    WHEN COUNT(DISTINCT le.id) FILTER (WHERE le.event_type = 'click') = COUNT(DISTINCT l.id) FILTER (WHERE l.status = 'validated')
    THEN '✅ MATCH!'
    ELSE '⚠️ MISMATCH - ' || (COUNT(DISTINCT le.id) FILTER (WHERE le.event_type = 'click') - COUNT(DISTINCT l.id) FILTER (WHERE l.status = 'validated'))::text || ' clicks without leads'
  END as status
FROM link_events le
JOIN tracked_links tl ON tl.id = le.tracked_link_id
LEFT JOIN leads l ON l.tracked_link_id = le.tracked_link_id
WHERE le.event_type = 'click';

-- STEP 4: Check per collaboration
SELECT 
  c.id as collaboration_id,
  COUNT(DISTINCT le.id) FILTER (WHERE le.event_type = 'click') as clicks,
  COUNT(DISTINCT l.id) FILTER (WHERE l.status = 'validated') as leads,
  COALESCE(SUM(l.creator_earnings) FILTER (WHERE l.status = 'validated'), 0) as earnings,
  CASE 
    WHEN COUNT(DISTINCT le.id) FILTER (WHERE le.event_type = 'click') = COUNT(DISTINCT l.id) FILTER (WHERE l.status = 'validated')
    THEN '✅'
    ELSE '❌'
  END as match
FROM collaborations c
LEFT JOIN tracked_links tl ON tl.collaboration_id = c.id
LEFT JOIN link_events le ON le.tracked_link_id = tl.id AND le.event_type = 'click'
LEFT JOIN leads l ON l.tracked_link_id = tl.id AND l.status = 'validated'
GROUP BY c.id
ORDER BY clicks DESC;


