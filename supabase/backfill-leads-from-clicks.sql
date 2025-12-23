-- Backfill leads from existing clicks (for clicks that happened before automatic lead creation)
-- This creates leads for clicks that don't have corresponding leads yet

-- WARNING: Run this carefully! It will create leads for ALL clicks that don't have leads yet.
-- Make sure you understand what this does before running.

-- Step 1: Check how many clicks don't have leads
SELECT 
  tl.collaboration_id,
  COUNT(DISTINCT le.id) as clicks_without_leads,
  COUNT(DISTINCT l.id) as existing_leads
FROM link_events le
JOIN tracked_links tl ON tl.id = le.tracked_link_id
LEFT JOIN leads l ON l.tracked_link_id = le.tracked_link_id 
  AND l.creator_id = (
    SELECT a.creator_id 
    FROM collaborations c
    JOIN applications a ON a.id = c.application_id
    WHERE c.id = tl.collaboration_id
  )
WHERE le.event_type = 'click'
GROUP BY tl.collaboration_id;

-- Step 2: Create leads for clicks that don't have leads yet
-- This uses a DO block to iterate through clicks and create leads
DO $$
DECLARE
  v_click RECORD;
  v_collab RECORD;
  v_creator_id UUID;
  v_saas_id UUID;
  v_lead_id UUID;
  v_count INTEGER := 0;
BEGIN
  -- Loop through all clicks that don't have corresponding leads
  FOR v_click IN 
    SELECT DISTINCT
      le.tracked_link_id,
      le.session_id,
      tl.collaboration_id
    FROM link_events le
    JOIN tracked_links tl ON tl.id = le.tracked_link_id
    WHERE le.event_type = 'click'
      AND NOT EXISTS (
        SELECT 1 
        FROM leads l 
        WHERE l.tracked_link_id = le.tracked_link_id
          AND l.status = 'validated'
      )
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
    END IF;
  END LOOP;
  
  RAISE NOTICE 'Backfill complete! Created % leads total.', v_count;
END $$;

