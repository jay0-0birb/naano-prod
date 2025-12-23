-- Quick check: Do all BP1 tables exist?
-- Run this in Supabase SQL Editor

SELECT 
  table_name,
  CASE 
    WHEN table_name IN (
      SELECT table_name 
      FROM information_schema.tables
      WHERE table_schema = 'public'
    ) THEN '✅ EXISTS'
    ELSE '❌ MISSING'
  END as status
FROM (VALUES 
  ('leads'),
  ('creator_wallets'),
  ('saas_billing_debt'),
  ('billing_invoices'),
  ('invoice_line_items'),
  ('creator_payouts'),
  ('creator_invoices')
) AS required_tables(table_name)
ORDER BY table_name;

