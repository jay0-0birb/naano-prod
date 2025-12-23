-- =====================================================
-- BP1 SETUP VERIFICATION SCRIPT
-- =====================================================
-- Run this to check if all tables and functions exist
-- =====================================================

-- Check tables (run this first to see what tables exist)
SELECT 
  'Tables' as type,
  table_name as name,
  '✅ EXISTS' as status
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'leads',
    'creator_wallets',
    'saas_billing_debt',
    'billing_invoices',
    'invoice_line_items',
    'creator_payouts',
    'creator_invoices'
  )
ORDER BY table_name;

-- Check which tables are MISSING
SELECT 
  'Missing Tables' as type,
  expected_table as name,
  '❌ MISSING' as status
FROM (VALUES 
  ('leads'),
  ('creator_wallets'),
  ('saas_billing_debt'),
  ('billing_invoices'),
  ('invoice_line_items'),
  ('creator_payouts'),
  ('creator_invoices')
) AS expected(expected_table)
WHERE expected_table NOT IN (
  SELECT table_name 
  FROM information_schema.tables
  WHERE table_schema = 'public'
);

-- Check functions
SELECT 
  'Functions' as type,
  routine_name as name,
  CASE WHEN routine_name IS NOT NULL THEN '✅ EXISTS' ELSE '❌ MISSING' END as status
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
    'get_lead_price_by_plan',
    'get_creator_earnings',
    'calculate_naano_margin_brut',
    'calculate_stripe_fees',
    'create_lead',
    'should_bill_saas',
    'bill_saas',
    'create_creator_payout',
    'move_wallet_pending_to_available',
    'get_next_billing_date',
    'generate_invoice_number',
    'generate_creator_invoice_number',
    'can_creator_payout',
    'get_saas_to_bill',
    'get_creators_ready_for_payout'
  )
ORDER BY routine_name;

-- Check if columns exist on saas_companies
SELECT 
  'Columns (saas_companies)' as type,
  column_name as name,
  CASE WHEN column_name IS NOT NULL THEN '✅ EXISTS' ELSE '❌ MISSING' END as status
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'saas_companies'
  AND column_name IN (
    'card_on_file',
    'card_last4',
    'card_brand',
    'stripe_setup_intent_id'
  )
ORDER BY column_name;

-- Check if columns exist on creator_profiles
SELECT 
  'Columns (creator_profiles)' as type,
  column_name as name,
  CASE WHEN column_name IS NOT NULL THEN '✅ EXISTS' ELSE '❌ MISSING' END as status
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'creator_profiles'
  AND column_name IN (
    'siret',
    'tva_assujetti'
  )
ORDER BY column_name;

-- Check if link_events has 'lead' event type
SELECT 
  'link_events event_type' as type,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'link_events' 
      AND column_name = 'event_type'
    ) THEN '✅ EXISTS'
    ELSE '❌ MISSING'
  END as status;

-- Summary
SELECT 
  'SUMMARY' as type,
  'Total tables found' as name,
  COUNT(*)::text as status
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'leads',
    'creator_wallets',
    'saas_billing_debt',
    'billing_invoices',
    'invoice_line_items',
    'creator_payouts',
    'creator_invoices'
  );

SELECT 
  'SUMMARY' as type,
  'Total functions found' as name,
  COUNT(*)::text as status
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
    'get_lead_price_by_plan',
    'get_creator_earnings',
    'calculate_naano_margin_brut',
    'calculate_stripe_fees',
    'create_lead',
    'should_bill_saas',
    'bill_saas',
    'create_creator_payout',
    'move_wallet_pending_to_available',
    'get_next_billing_date',
    'generate_invoice_number',
    'generate_creator_invoice_number',
    'can_creator_payout',
    'get_saas_to_bill',
    'get_creators_ready_for_payout'
  );

