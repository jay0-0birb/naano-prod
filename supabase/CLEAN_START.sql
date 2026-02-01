-- =====================================================
-- CLEAN START: Remove all test data
-- =====================================================
-- This will delete all leads, clicks, wallet balances, invoices, etc.
-- BUT keeps all tables, functions, and schema intact
-- Run this to start testing from scratch

-- WARNING: This deletes ALL data! Only run in development/test environment.

DO $$
BEGIN
  RAISE NOTICE '=== STARTING CLEANUP ===';
  
  -- 1. Delete all leads
  DELETE FROM public.leads;
  RAISE NOTICE '✅ Deleted all leads';
  
  -- 2. Delete all link_events (clicks, impressions)
  DELETE FROM public.link_events;
  RAISE NOTICE '✅ Deleted all link_events';
  
  -- 3. Reset all creator wallets
  UPDATE public.creator_wallets
  SET
    pending_balance = 0.00,
    available_balance = 0.00,
    total_earned = 0.00;
  RAISE NOTICE '✅ Reset all creator wallets';
  
  -- 4. Reset all SaaS billing debt
  UPDATE public.saas_billing_debt
  SET
    current_debt = 0.00,
    last_billed_at = NULL,
    next_billing_date = (date_trunc('month', NOW()) + interval '1 month')::date;
  RAISE NOTICE '✅ Reset all SaaS billing debt';
  
  -- 5. Delete all billing invoices and line items
  DELETE FROM public.invoice_line_items;
  DELETE FROM public.billing_invoices;
  RAISE NOTICE '✅ Deleted all billing invoices';
  
  -- 6. Delete all creator payouts and invoices
  DELETE FROM public.creator_invoices;
  DELETE FROM public.creator_payouts;
  RAISE NOTICE '✅ Deleted all creator payouts';
  
  -- 7. Reset tracked_links (optional - comment out if you want to keep links)
  -- DELETE FROM public.tracked_links;
  -- RAISE NOTICE '✅ Deleted all tracked_links';
  
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ CLEANUP COMPLETE!';
  RAISE NOTICE 'All test data has been removed.';
  RAISE NOTICE 'You can now start testing from scratch.';
  RAISE NOTICE '========================================';
END $$;

-- Verify cleanup
SELECT 
  '=== VERIFICATION ===' as info;

SELECT 
  'Total Clicks' as metric,
  COUNT(*)::text as count
FROM link_events
WHERE event_type = 'click'

UNION ALL

SELECT 
  'Total Leads' as metric,
  COUNT(*)::text as count
FROM leads

UNION ALL

SELECT 
  'Total Pending Balance' as metric,
  COALESCE(SUM(pending_balance), 0)::text || '€' as count
FROM creator_wallets

UNION ALL

SELECT 
  'Total Available Balance' as metric,
  COALESCE(SUM(available_balance), 0)::text || '€' as count
FROM creator_wallets

UNION ALL

SELECT 
  'Total SaaS Debt' as metric,
  COALESCE(SUM(current_debt), 0)::text || '€' as count
FROM saas_billing_debt

UNION ALL

SELECT 
  'Total Billing Invoices' as metric,
  COUNT(*)::text as count
FROM billing_invoices;

-- Show that tables still exist (structure is intact)
SELECT 
  '=== TABLES STILL EXIST ===' as info;

SELECT 
  table_name,
  '✅ EXISTS' as status
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'leads',
    'link_events',
    'creator_wallets',
    'saas_billing_debt',
    'billing_invoices',
    'invoice_line_items',
    'creator_payouts',
    'creator_invoices',
    'tracked_links'
  )
ORDER BY table_name;



