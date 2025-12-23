-- =====================================================
-- SIMPLE FIX: Create leads for ALL clicks
-- =====================================================
-- This will create one lead for every click that doesn't have a lead yet
-- Run this in Supabase SQL Editor

-- STEP 1: See current state
SELECT 
  'Current State' as info,
  (SELECT COUNT(*) FROM link_events WHERE event_type = 'click') as total_clicks,
  (SELECT COUNT(*) FROM leads WHERE status = 'validated') as total_leads,
  (SELECT COALESCE(SUM(creator_earnings), 0) FROM leads WHERE status = 'validated') as total_earnings;

-- STEP 2: Create missing leads
-- This creates one lead per click, ensuring we don't create duplicates
DO $$
DECLARE
  v_click RECORD;
  v_creator_id UUID;
  v_saas_id UUID;
  v_lead_id UUID;
  v_created INTEGER := 0;
  v_skipped INTEGER := 0;
BEGIN
  FOR v_click IN 
    SELECT DISTINCT
      le.tracked_link_id,
      tl.collaboration_id,
      COUNT(*) OVER (PARTITION BY le.tracked_link_id) as click_count
    FROM link_events le
    JOIN tracked_links tl ON tl.id = le.tracked_link_id
    WHERE le.event_type = 'click'
    ORDER BY le.occurred_at
  LOOP
    -- Get creator and SaaS IDs
    SELECT 
      a.creator_id,
      a.saas_id
    INTO v_creator_id, v_saas_id
    FROM collaborations c
    JOIN applications a ON a.id = c.application_id
    WHERE c.id = v_click.collaboration_id;
    
    IF v_creator_id IS NULL OR v_saas_id IS NULL THEN
      v_skipped := v_skipped + 1;
      CONTINUE;
    END IF;
    
    -- Count existing leads for this tracked_link
    DECLARE
      v_existing_leads INTEGER;
      v_needed_leads INTEGER;
    BEGIN
      SELECT COUNT(*) INTO v_existing_leads
      FROM leads
      WHERE tracked_link_id = v_click.tracked_link_id
        AND status = 'validated';
      
      SELECT COUNT(*) INTO v_needed_leads
      FROM link_events
      WHERE tracked_link_id = v_click.tracked_link_id
        AND event_type = 'click';
      
      -- Create missing leads (one per click)
      WHILE v_existing_leads < v_needed_leads LOOP
        BEGIN
          SELECT create_lead(
            v_click.tracked_link_id,
            v_creator_id,
            v_saas_id
          ) INTO v_lead_id;
          
          v_created := v_created + 1;
          v_existing_leads := v_existing_leads + 1;
        EXCEPTION WHEN OTHERS THEN
          RAISE NOTICE 'Error: %', SQLERRM;
          EXIT; -- Exit this tracked_link loop
        END;
      END LOOP;
    END;
  END LOOP;
  
  RAISE NOTICE '✅ Created % leads, skipped % clicks', v_created, v_skipped;
END $$;

-- STEP 3: Verify fix
SELECT 
  'After Fix' as info,
  (SELECT COUNT(*) FROM link_events WHERE event_type = 'click') as total_clicks,
  (SELECT COUNT(*) FROM leads WHERE status = 'validated') as total_leads,
  (SELECT COALESCE(SUM(creator_earnings), 0) FROM leads WHERE status = 'validated') as total_earnings,
  CASE 
    WHEN (SELECT COUNT(*) FROM link_events WHERE event_type = 'click') = 
         (SELECT COUNT(*) FROM leads WHERE status = 'validated')
    THEN '✅ PERFECT MATCH!'
    ELSE '⚠️ Still have ' || 
         ((SELECT COUNT(*) FROM link_events WHERE event_type = 'click') - 
          (SELECT COUNT(*) FROM leads WHERE status = 'validated'))::text || 
         ' clicks without leads'
  END as status;

