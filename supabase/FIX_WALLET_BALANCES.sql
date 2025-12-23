-- =====================================================
-- COMPREHENSIVE FIX: Recalculate all wallet balances
-- =====================================================
-- This script will:
-- 1. Verify all leads exist for clicks
-- 2. Recalculate wallet balances based on actual lead status
-- 3. Fix pending/available balances based on which SaaS paid

-- STEP 1: Diagnostic - See current state
SELECT 
  '=== CURRENT STATE ===' as info;

-- Count clicks vs leads per collaboration
SELECT 
  c.id as collaboration_id,
  sc.company_name as saas_name,
  COUNT(DISTINCT le.id) FILTER (WHERE le.event_type = 'click') as clicks,
  COUNT(DISTINCT l.id) FILTER (WHERE l.status = 'validated') as validated_leads,
  COUNT(DISTINCT l.id) FILTER (WHERE l.status = 'billed') as billed_leads,
  COALESCE(SUM(l.creator_earnings) FILTER (WHERE l.status = 'validated'), 0) as validated_earnings,
  COALESCE(SUM(l.creator_earnings) FILTER (WHERE l.status = 'billed'), 0) as billed_earnings
FROM collaborations c
JOIN applications a ON a.id = c.application_id
JOIN saas_companies sc ON sc.id = a.saas_id
LEFT JOIN tracked_links tl ON tl.collaboration_id = c.id
LEFT JOIN link_events le ON le.tracked_link_id = tl.id AND le.event_type = 'click'
LEFT JOIN leads l ON l.tracked_link_id = tl.id
GROUP BY c.id, sc.company_name
ORDER BY clicks DESC;

-- Check wallet balances
SELECT 
  cp.id as creator_id,
  COALESCE(p.full_name, p.email, cp.id::text) as creator_name,
  cw.pending_balance,
  cw.available_balance,
  cw.total_earned,
  (SELECT COUNT(*) FROM leads l WHERE l.creator_id = cp.id AND l.status = 'validated') as validated_leads_count,
  (SELECT COUNT(*) FROM leads l WHERE l.creator_id = cp.id AND l.status = 'billed') as billed_leads_count,
  (SELECT COALESCE(SUM(creator_earnings), 0) FROM leads l WHERE l.creator_id = cp.id AND l.status = 'validated') as should_be_pending,
  (SELECT COALESCE(SUM(creator_earnings), 0) FROM leads l WHERE l.creator_id = cp.id AND l.status = 'billed') as should_be_available
FROM creator_profiles cp
JOIN profiles p ON p.id = cp.profile_id
LEFT JOIN creator_wallets cw ON cw.creator_id = cp.id
ORDER BY COALESCE(p.full_name, p.email, cp.id::text);

-- Check which SaaS paid (have paid invoices)
SELECT 
  sc.id as saas_id,
  sc.company_name,
  COUNT(DISTINCT bi.id) FILTER (WHERE bi.status = 'paid') as paid_invoices,
  COUNT(DISTINCT l.id) FILTER (WHERE l.status = 'billed') as billed_leads,
  COALESCE(SUM(l.creator_earnings) FILTER (WHERE l.status = 'billed'), 0) as total_creator_earnings_billed
FROM saas_companies sc
LEFT JOIN billing_invoices bi ON bi.saas_id = sc.id
LEFT JOIN leads l ON l.saas_id = sc.id
GROUP BY sc.id, sc.company_name
ORDER BY sc.company_name;

-- STEP 2: Fix wallet balances
-- Reset all wallets to 0 first
UPDATE creator_wallets
SET
  pending_balance = 0.00,
  available_balance = 0.00,
  total_earned = 0.00;

-- Recalculate pending balance (validated leads from SaaS that haven't paid)
UPDATE creator_wallets cw
SET
  pending_balance = COALESCE((
    SELECT SUM(l.creator_earnings)
    FROM leads l
    WHERE l.creator_id = cw.creator_id
      AND l.status = 'validated'
      AND NOT EXISTS (
        SELECT 1 
        FROM billing_invoices bi
        WHERE bi.id = l.billing_invoice_id
          AND bi.status = 'paid'
      )
  ), 0.00);

-- Recalculate available balance (billed leads from SaaS that paid)
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

-- Recalculate total_earned (all validated + billed leads)
UPDATE creator_wallets cw
SET
  total_earned = COALESCE((
    SELECT SUM(creator_earnings)
    FROM leads l
    WHERE l.creator_id = cw.creator_id
      AND l.status IN ('validated', 'billed')
  ), 0.00);

-- STEP 3: Verify the fix
SELECT 
  '=== AFTER FIX ===' as info;

SELECT 
  COALESCE(p.full_name, p.email, cp.id::text) as creator_name,
  cw.pending_balance as pending,
  cw.available_balance as available,
  cw.total_earned as total,
  (SELECT COUNT(*) FROM leads l WHERE l.creator_id = cp.id AND l.status = 'validated') as validated_leads,
  (SELECT COUNT(*) FROM leads l WHERE l.creator_id = cp.id AND l.status = 'billed') as billed_leads
FROM creator_profiles cp
JOIN profiles p ON p.id = cp.profile_id
JOIN creator_wallets cw ON cw.creator_id = cp.id
ORDER BY COALESCE(p.full_name, p.email, cp.id::text);

-- Show breakdown by SaaS
SELECT 
  sc.company_name as saas,
  COUNT(DISTINCT l.id) FILTER (WHERE l.status = 'validated') as validated_leads,
  COUNT(DISTINCT l.id) FILTER (WHERE l.status = 'billed') as billed_leads,
  COUNT(DISTINCT bi.id) FILTER (WHERE bi.status = 'paid') as paid_invoices,
  CASE 
    WHEN COUNT(DISTINCT bi.id) FILTER (WHERE bi.status = 'paid') > 0 THEN '✅ PAID'
    ELSE '⏳ NOT PAID'
  END as payment_status
FROM saas_companies sc
LEFT JOIN leads l ON l.saas_id = sc.id
LEFT JOIN billing_invoices bi ON bi.saas_id = sc.id
GROUP BY sc.id, sc.company_name
ORDER BY sc.company_name;

