-- =====================================================
-- ADD NET REVENUE TRACKING (After Stripe Fees)
-- =====================================================
-- This migration adds support for tracking net revenue
-- (revenue after Stripe fees) in addition to gross revenue
-- =====================================================

-- Add columns to link_events for net revenue and Stripe fees
ALTER TABLE public.link_events
  ADD COLUMN IF NOT EXISTS net_revenue_amount DECIMAL(10, 2),
  ADD COLUMN IF NOT EXISTS stripe_fee_amount DECIMAL(10, 2);

-- Update constraint to allow net_revenue for conversions
ALTER TABLE public.link_events
  DROP CONSTRAINT IF EXISTS valid_revenue;

ALTER TABLE public.link_events
  ADD CONSTRAINT valid_revenue CHECK (
    (event_type = 'conversion' AND revenue_amount IS NOT NULL) OR 
    (event_type != 'conversion' AND revenue_amount IS NULL)
  );

-- Add comment explaining the columns
COMMENT ON COLUMN public.link_events.revenue_amount IS 'Gross revenue (what customer paid)';
COMMENT ON COLUMN public.link_events.net_revenue_amount IS 'Net revenue (after Stripe fees) - what SaaS actually receives';
COMMENT ON COLUMN public.link_events.stripe_fee_amount IS 'Stripe fees deducted from gross revenue';

-- Update existing records: assume net = gross for now (no fee data available)
-- In production, you may want to backfill with actual Stripe fee data if available
UPDATE public.link_events
SET 
  net_revenue_amount = revenue_amount,
  stripe_fee_amount = 0
WHERE event_type = 'conversion' 
  AND net_revenue_amount IS NULL;

-- =====================================================
-- UPDATE COMMISSIONS TABLE TO TRACK GROSS VS NET
-- =====================================================

-- Add columns to commissions table
ALTER TABLE public.commissions
  ADD COLUMN IF NOT EXISTS gross_revenue_generated DECIMAL(10, 2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS total_stripe_fees DECIMAL(10, 2) DEFAULT 0.00;

-- Update existing commissions: set gross = total_revenue_generated (backward compatible)
UPDATE public.commissions
SET gross_revenue_generated = total_revenue_generated
WHERE gross_revenue_generated = 0.00 OR gross_revenue_generated IS NULL;

-- Add comments
COMMENT ON COLUMN public.commissions.gross_revenue_generated IS 'Gross revenue (before Stripe fees) - for reference';
COMMENT ON COLUMN public.commissions.total_revenue_generated IS 'Net revenue (after Stripe fees) - used for commission calculations';
COMMENT ON COLUMN public.commissions.total_stripe_fees IS 'Total Stripe fees deducted from gross revenue';

-- =====================================================
-- UPDATE COMMISSION CALCULATION FUNCTION
-- =====================================================

-- The calculate_commission_for_period function will now use net_revenue_amount
-- instead of revenue_amount. This is updated in the main commissions-system-fixed.sql file.

-- =====================================================
-- HELPER FUNCTION: Calculate Stripe Fees
-- =====================================================

-- Function to calculate Stripe fees based on payment amount
-- EU cards: 3.2% + €0.25
-- Non-EU cards: 3.9% + €0.25
-- This is a simplified calculation - actual fees may vary
CREATE OR REPLACE FUNCTION public.calculate_stripe_fee(
  p_gross_amount DECIMAL,
  p_is_eu BOOLEAN DEFAULT true
)
RETURNS DECIMAL AS $$
DECLARE
  v_fee_rate DECIMAL := 0.032; -- 3.2% for EU
  v_fixed_fee DECIMAL := 0.25; -- €0.25 fixed fee
BEGIN
  IF NOT p_is_eu THEN
    v_fee_rate := 0.039; -- 3.9% for non-EU
  END IF;
  
  RETURN ROUND((p_gross_amount * v_fee_rate + v_fixed_fee)::numeric, 2);
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- DONE! ✅
-- =====================================================
-- 
-- Changes:
-- 1. Added net_revenue_amount and stripe_fee_amount to link_events
-- 2. Added gross_revenue_generated and total_stripe_fees to commissions
-- 3. Created helper function to calculate Stripe fees
-- 
-- Next steps:
-- 1. Update webhook handler to calculate and store net revenue
-- 2. Update commission calculation to use net revenue
-- =====================================================

