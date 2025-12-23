-- =====================================================
-- QUICK COMMISSION TEST SCRIPT
-- =====================================================
-- Run this entire script to test commissions
-- =====================================================

-- STEP 1: Get your collaboration and tracking link
-- (Replace this with your actual collaboration if you know it)
DO $$
DECLARE
  v_collab_id UUID;
  v_tracked_link_id UUID;
  v_commission_id UUID;
BEGIN
  -- Get first active collaboration
  SELECT c.id, tl.id
  INTO v_collab_id, v_tracked_link_id
  FROM collaborations c
  JOIN tracked_links tl ON tl.collaboration_id = c.id
  WHERE c.status = 'active'
  LIMIT 1;

  IF v_collab_id IS NULL THEN
    RAISE NOTICE '❌ No active collaboration found. Please create one first.';
    RETURN;
  END IF;

  RAISE NOTICE '✅ Found collaboration: %', v_collab_id;
  RAISE NOTICE '✅ Found tracked link: %', v_tracked_link_id;

  -- STEP 2: Insert test conversion
  INSERT INTO link_events (
    tracked_link_id,
    event_type,
    revenue_amount,
    occurred_at,
    session_id
  ) VALUES (
    v_tracked_link_id,
    'conversion',
    1000.00,  -- €1000 revenue
    NOW(),
    'test-session-' || gen_random_uuid()::text
  );

  RAISE NOTICE '✅ Test conversion inserted: €1000.00';

  -- STEP 3: Calculate commission
  SELECT calculate_commission_for_period(
    v_collab_id,
    date_trunc('month', NOW()),
    NOW()
  ) INTO v_commission_id;

  IF v_commission_id IS NULL THEN
    RAISE NOTICE '⚠️  No commission created (no revenue found or error occurred)';
  ELSE
    RAISE NOTICE '✅ Commission calculated: %', v_commission_id;
  END IF;

END $$;

-- STEP 4: Show the commission that was created
SELECT 
  '📊 COMMISSION RESULTS' as info,
  id,
  total_revenue_generated,
  creator_gross_earnings,
  platform_creator_fee,
  creator_net_earnings,
  platform_saas_fee,
  status,
  period_start,
  period_end
FROM commissions
ORDER BY created_at DESC
LIMIT 1;

-- STEP 5: Show creator earnings summary (if you're logged in as a creator)
-- Uncomment and run this if you want to see your earnings:
/*
SELECT * FROM get_creator_earnings_summary(auth.uid());
*/

-- =====================================================
-- NEXT STEPS:
-- =====================================================
-- 1. Check the commission results above
-- 2. Go to /dashboard/finances as Creator to see pending earnings
-- 3. Go to /dashboard/finances → Commissions tab as SaaS to see revenue
-- =====================================================

