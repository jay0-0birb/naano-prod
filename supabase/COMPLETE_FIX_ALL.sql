-- =====================================================
-- COMPLETE FIX: Leads + Wallet Balances
-- =====================================================
-- This script will:
-- 1. Create all missing leads for clicks
-- 2. Recalculate wallet balances correctly based on payment status
-- 3. Show clear breakdown

-- =====================================================
-- STEP 1: Create missing leads
-- =====================================================
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
  RAISE NOTICE '=== STEP 1: Creating missing leads ===';
  
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
    -- Count clicks
    SELECT COUNT(*) INTO v_clicks_count
    FROM link_events
    WHERE tracked_link_id = v_tracked_link.tracked_link_id
      AND event_type = 'click';
    
    -- Count existing leads
    SELECT COUNT(*) INTO v_leads_count
    FROM leads
    WHERE tracked_link_id = v_tracked_link.tracked_link_id
      AND status IN ('validated', 'billed');
    
    -- Calculate how many leads we need
    v_needed := v_clicks_count - v_leads_count;
    
    IF v_needed <= 0 THEN
      CONTINUE;
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
      EXCEPTION WHEN OTHERS THEN
        v_errors := v_errors + 1;
      END;
    END LOOP;
  END LOOP;
  
  RAISE NOTICE 'Created % leads, % errors', v_created, v_errors;
END $$;

-- =====================================================
-- STEP 2: Recalculate wallet balances
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE '=== STEP 2: Recalculating wallet balances ===';
  
  -- Reset all wallets
  UPDATE creator_wallets
  SET
    pending_balance = 0.00,
    available_balance = 0.00,
    total_earned = 0.00;
  
  -- Pending = validated leads from SaaS that haven't paid
  UPDATE creator_wallets cw
  SET
    pending_balance = COALESCE((
      SELECT SUM(l.creator_earnings)
      FROM leads l
      WHERE l.creator_id = cw.creator_id
        AND l.status = 'validated'
        AND (
          l.billing_invoice_id IS NULL
          OR NOT EXISTS (
            SELECT 1 
            FROM billing_invoices bi
            WHERE bi.id = l.billing_invoice_id
              AND bi.status = 'paid'
          )
        )
    ), 0.00);
  
  -- Available = billed leads from SaaS that paid
  UPDATE creator_wallets cw
  SET
    available_balance = COALESCE((
      SELECT SUM(l.creator_earnings)
      FROM leads l
      JOIN billing_invoices bi ON bi.id = l.billing_invoice_id
      WHERE l.creator_id = cw.creator_id
        AND l.status = 'billed'
        AND bi.status = 'paid'
    ), 0.00);
  
  -- Total = all validated + billed leads
  UPDATE creator_wallets cw
  SET
    total_earned = COALESCE((
      SELECT SUM(creator_earnings)
      FROM leads l
      WHERE l.creator_id = cw.creator_id
        AND l.status IN ('validated', 'billed')
    ), 0.00);
  
  RAISE NOTICE 'Wallet balances recalculated';
END $$;

-- =====================================================
-- STEP 3: Show results
-- =====================================================
SELECT 
  '=== FINAL RESULTS ===' as section;

-- Summary by creator
SELECT 
  COALESCE(p.full_name, p.email, cp.id::text) as creator,
  COUNT(DISTINCT l.id) FILTER (WHERE l.status = 'validated') as validated_leads,
  COUNT(DISTINCT l.id) FILTER (WHERE l.status = 'billed') as billed_leads,
  cw.pending_balance as pending,
  cw.available_balance as available,
  cw.total_earned as total,
  CASE 
    WHEN cw.pending_balance + cw.available_balance = cw.total_earned THEN '✅'
    ELSE '❌'
  END as check
FROM creator_profiles cp
JOIN profiles p ON p.id = cp.profile_id
JOIN creator_wallets cw ON cw.creator_id = cp.id
LEFT JOIN leads l ON l.creator_id = cp.id
GROUP BY cp.id, p.full_name, p.email, cw.pending_balance, cw.available_balance, cw.total_earned
ORDER BY COALESCE(p.full_name, p.email, cp.id::text);

-- Breakdown by SaaS
SELECT 
  sc.company_name as saas,
  COUNT(DISTINCT l.id) FILTER (WHERE l.status = 'validated') as validated_leads,
  COUNT(DISTINCT l.id) FILTER (WHERE l.status = 'billed') as billed_leads,
  COUNT(DISTINCT bi.id) FILTER (WHERE bi.status = 'paid') as paid_invoices,
  CASE 
    WHEN COUNT(DISTINCT bi.id) FILTER (WHERE bi.status = 'paid') > 0 THEN '✅ PAID'
    ELSE '⏳ NOT PAID'
  END as status
FROM saas_companies sc
LEFT JOIN leads l ON l.saas_id = sc.id
LEFT JOIN billing_invoices bi ON bi.saas_id = sc.id
GROUP BY sc.id, sc.company_name
ORDER BY sc.company_name;

-- Total clicks vs leads
SELECT 
  'Total Clicks' as metric,
  COUNT(*)::text as count
FROM link_events
WHERE event_type = 'click'

UNION ALL

SELECT 
  'Total Leads (validated + billed)' as metric,
  COUNT(*)::text as count
FROM leads
WHERE status IN ('validated', 'billed')

UNION ALL

SELECT 
  'Total Earnings' as metric,
  COALESCE(SUM(creator_earnings), 0)::text || '€' as count
FROM leads
WHERE status IN ('validated', 'billed');

