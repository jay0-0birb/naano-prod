-- =====================================================
-- FINAL FIX: Create ALL missing leads
-- =====================================================
-- This creates one lead for every click that doesn't have a lead
-- Run this ONCE in Supabase SQL Editor

DO $$
DECLARE
  v_tracked_link RECORD;
  v_creator_id UUID;
  v_saas_id UUID;
  v_lead_id UUID;
  v_created INTEGER := 0;
  v_errors INTEGER := 0;
  v_clicks_count INTEGER;
  v_leads_count INTEGER;
  v_needed INTEGER;
BEGIN
  -- Process each tracked_link
  FOR v_tracked_link IN 
    SELECT DISTINCT
      tl.id as tracked_link_id,
      tl.collaboration_id
    FROM tracked_links tl
    WHERE EXISTS (
      SELECT 1 FROM link_events le 
      WHERE le.tracked_link_id = tl.id 
      AND le.event_type = 'click'
    )
  LOOP
    -- Count clicks for this tracked_link
    SELECT COUNT(*) INTO v_clicks_count
    FROM link_events
    WHERE tracked_link_id = v_tracked_link.tracked_link_id
      AND event_type = 'click';
    
    -- Count existing leads for this tracked_link
    SELECT COUNT(*) INTO v_leads_count
    FROM leads
    WHERE tracked_link_id = v_tracked_link.tracked_link_id
      AND status = 'validated';
    
    -- Calculate how many leads we need to create
    v_needed := v_clicks_count - v_leads_count;
    
    IF v_needed <= 0 THEN
      CONTINUE; -- Already have enough leads
    END IF;
    
    -- Get creator and SaaS IDs
    SELECT 
      a.creator_id,
      a.saas_id
    INTO v_creator_id, v_saas_id
    FROM collaborations c
    JOIN applications a ON a.id = c.application_id
    WHERE c.id = v_tracked_link.collaboration_id;
    
    IF v_creator_id IS NULL OR v_saas_id IS NULL THEN
      RAISE NOTICE '⚠️ Skipping tracked_link %: Missing creator_id or saas_id', v_tracked_link.tracked_link_id;
      CONTINUE;
    END IF;
    
    -- Create missing leads
    FOR i IN 1..v_needed LOOP
      BEGIN
        SELECT create_lead(
          v_tracked_link.tracked_link_id,
          v_creator_id,
          v_saas_id
        ) INTO v_lead_id;
        
        v_created := v_created + 1;
        
        IF v_created % 10 = 0 THEN
          RAISE NOTICE 'Created % leads so far...', v_created;
        END IF;
      EXCEPTION WHEN OTHERS THEN
        v_errors := v_errors + 1;
        RAISE NOTICE '❌ Error creating lead: %', SQLERRM;
      END;
    END LOOP;
  END LOOP;
  
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ BACKFILL COMPLETE!';
  RAISE NOTICE 'Created: % leads', v_created;
  RAISE NOTICE 'Errors: %', v_errors;
  RAISE NOTICE '========================================';
END $$;

-- Verify the fix
SELECT 
  'Verification' as check_type,
  (SELECT COUNT(*) FROM link_events WHERE event_type = 'click') as total_clicks,
  (SELECT COUNT(*) FROM leads WHERE status = 'validated') as total_leads,
  (SELECT COALESCE(SUM(creator_earnings), 0) FROM leads WHERE status = 'validated') as total_earnings,
  CASE 
    WHEN (SELECT COUNT(*) FROM link_events WHERE event_type = 'click') = 
         (SELECT COUNT(*) FROM leads WHERE status = 'validated')
    THEN '✅ PERFECT! All clicks have leads'
    ELSE '⚠️ Mismatch: ' || 
         ((SELECT COUNT(*) FROM link_events WHERE event_type = 'click') - 
          (SELECT COUNT(*) FROM leads WHERE status = 'validated'))::text || 
         ' clicks still without leads'
  END as status;

