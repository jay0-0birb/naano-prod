-- =====================================================
-- REMOVE OLD BP1 PAYMENT SYSTEM
-- =====================================================
-- Drops obsolete lead-based billing (BP1) in favor of
-- credit-based system (PlanP + PlanC).
--
-- KEEPS: creator_wallets, creator_payouts, creator_invoices,
--        create_creator_payout, can_creator_payout,
--        increment_creator_wallet_pending, move_wallet_pending_to_available
-- =====================================================

-- Drop BP1 functions (order matters - dependencies first)
DROP FUNCTION IF EXISTS public.create_lead(UUID, UUID, UUID);
DROP FUNCTION IF EXISTS public.bill_saas(UUID);
DROP FUNCTION IF EXISTS public.get_saas_to_bill();
DROP FUNCTION IF EXISTS public.should_bill_saas(UUID);
DROP FUNCTION IF EXISTS public.increment_saas_debt(UUID, DECIMAL);
DROP FUNCTION IF EXISTS public.get_lead_price_by_plan(TEXT);
DROP FUNCTION IF EXISTS public.get_creator_earnings();
DROP FUNCTION IF EXISTS public.calculate_naano_margin_brut(DECIMAL);

-- Drop saas_billing_debt table (BP1 debt tracking)
DROP TABLE IF EXISTS public.saas_billing_debt CASCADE;
