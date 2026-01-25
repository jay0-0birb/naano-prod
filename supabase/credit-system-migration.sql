-- =====================================================
-- CREDIT SYSTEM MIGRATION - PlanP + PlanC
-- =====================================================
-- Migration from BP1 (Lead-Based) to Credit-Based System
-- 
-- PlanP: SaaS buys prepaid credits (100-5000+, volume pricing)
-- PlanC: Creator Pro tier (€0.90 Standard, €1.10 Pro)
-- =====================================================

-- =====================================================
-- 1. ADD CREDIT FIELDS TO SAAS_COMPANIES
-- =====================================================

-- Add wallet_credits (current credit balance)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'saas_companies' AND column_name = 'wallet_credits'
  ) THEN
    ALTER TABLE public.saas_companies 
    ADD COLUMN wallet_credits INTEGER NOT NULL DEFAULT 0
    CHECK (wallet_credits >= 0);
  END IF;
END $$;

-- Add monthly_credit_subscription (monthly credit volume)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'saas_companies' AND column_name = 'monthly_credit_subscription'
  ) THEN
    ALTER TABLE public.saas_companies 
    ADD COLUMN monthly_credit_subscription INTEGER
    CHECK (monthly_credit_subscription IS NULL OR (monthly_credit_subscription >= 100 AND monthly_credit_subscription <= 10000));
  END IF;
END $$;

-- Add credit_renewal_date (next monthly renewal)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'saas_companies' AND column_name = 'credit_renewal_date'
  ) THEN
    ALTER TABLE public.saas_companies 
    ADD COLUMN credit_renewal_date DATE;
  END IF;
END $$;

-- Add stripe_subscription_id_credits (Stripe subscription for credit renewal)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'saas_companies' AND column_name = 'stripe_subscription_id_credits'
  ) THEN
    ALTER TABLE public.saas_companies 
    ADD COLUMN stripe_subscription_id_credits TEXT;
  END IF;
END $$;

-- Add index for credit queries
CREATE INDEX IF NOT EXISTS idx_saas_companies_wallet_credits 
  ON public.saas_companies(wallet_credits);

CREATE INDEX IF NOT EXISTS idx_saas_companies_credit_renewal_date 
  ON public.saas_companies(credit_renewal_date);

-- =====================================================
-- 2. ADD PRO FIELDS TO CREATOR_PROFILES
-- =====================================================

-- Add is_pro (Pro status flag)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'creator_profiles' AND column_name = 'is_pro'
  ) THEN
    ALTER TABLE public.creator_profiles 
    ADD COLUMN is_pro BOOLEAN NOT NULL DEFAULT false;
  END IF;
END $$;

-- Create enum type for pro_status_source if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'pro_status_source_enum') THEN
    CREATE TYPE pro_status_source_enum AS ENUM ('PAYMENT', 'PROMO');
  END IF;
END $$;

-- Add pro_status_source (how Pro was activated)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'creator_profiles' AND column_name = 'pro_status_source'
  ) THEN
    ALTER TABLE public.creator_profiles 
    ADD COLUMN pro_status_source pro_status_source_enum;
  END IF;
END $$;

-- Add pro_expiration_date (when Pro expires)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'creator_profiles' AND column_name = 'pro_expiration_date'
  ) THEN
    ALTER TABLE public.creator_profiles 
    ADD COLUMN pro_expiration_date TIMESTAMPTZ;
  END IF;
END $$;

-- Add stripe_subscription_id_pro (Stripe subscription for Pro)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'creator_profiles' AND column_name = 'stripe_subscription_id_pro'
  ) THEN
    ALTER TABLE public.creator_profiles 
    ADD COLUMN stripe_subscription_id_pro TEXT;
  END IF;
END $$;

-- Add index for Pro queries
CREATE INDEX IF NOT EXISTS idx_creator_profiles_is_pro 
  ON public.creator_profiles(is_pro);

CREATE INDEX IF NOT EXISTS idx_creator_profiles_pro_expiration_date 
  ON public.creator_profiles(pro_expiration_date);

-- =====================================================
-- 3. CREATE SAAS_CREDIT_TRANSACTIONS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.saas_credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  saas_id UUID NOT NULL REFERENCES public.saas_companies(id) ON DELETE CASCADE,
  
  -- Transaction details
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('purchase', 'deduction', 'rollover')),
  credits_amount INTEGER NOT NULL, -- Positive for purchase/rollover, negative for deduction
  balance_before INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,
  
  -- Related entities
  related_lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL, -- If deduction, link to lead
  stripe_subscription_id TEXT, -- If purchase via subscription
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes for credit transactions
CREATE INDEX IF NOT EXISTS idx_credit_transactions_saas_id 
  ON public.saas_credit_transactions(saas_id);

CREATE INDEX IF NOT EXISTS idx_credit_transactions_created_at 
  ON public.saas_credit_transactions(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_credit_transactions_related_lead_id 
  ON public.saas_credit_transactions(related_lead_id);

-- Enable RLS
ALTER TABLE public.saas_credit_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for credit transactions
CREATE POLICY "SaaS can view their own credit transactions"
  ON public.saas_credit_transactions FOR SELECT
  USING (
    saas_id IN (
      SELECT id FROM public.saas_companies WHERE profile_id = auth.uid()
    )
  );

-- Creators can view credit transactions for SaaS they collaborate with (to see budget)
CREATE POLICY "Creators can view credit transactions for their SaaS"
  ON public.saas_credit_transactions FOR SELECT
  USING (
    saas_id IN (
      SELECT DISTINCT sc.id
      FROM public.saas_companies sc
      JOIN public.applications a ON a.saas_id = sc.id
      JOIN public.collaborations c ON c.application_id = a.id
      JOIN public.creator_profiles cp ON cp.id = a.creator_id
      WHERE cp.profile_id = auth.uid()
        AND c.status = 'active'
    )
  );

-- =====================================================
-- 4. MODIFY LEADS TABLE
-- =====================================================

-- Add credits_deducted flag
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'leads' AND column_name = 'credits_deducted'
  ) THEN
    ALTER TABLE public.leads 
    ADD COLUMN credits_deducted BOOLEAN NOT NULL DEFAULT false;
  END IF;
END $$;

-- Add creator_payout_amount (€0.90 or €1.10 based on creator tier at time of click)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'leads' AND column_name = 'creator_payout_amount'
  ) THEN
    ALTER TABLE public.leads 
    ADD COLUMN creator_payout_amount DECIMAL(10, 2)
    CHECK (creator_payout_amount IS NULL OR creator_payout_amount IN (0.90, 1.10));
  END IF;
END $$;

-- Add index for credit-related queries
CREATE INDEX IF NOT EXISTS idx_leads_credits_deducted 
  ON public.leads(credits_deducted);

-- =====================================================
-- 5. HELPER FUNCTIONS
-- =====================================================

-- Function to get credit unit price based on volume (from planP.md)
CREATE OR REPLACE FUNCTION get_credit_unit_price(volume INTEGER)
RETURNS DECIMAL(10, 2) AS $$
BEGIN
  RETURN CASE
    WHEN volume >= 5000 THEN 1.60
    WHEN volume >= 4000 THEN 1.75
    WHEN volume >= 3000 THEN 1.85
    WHEN volume >= 2500 THEN 1.95
    WHEN volume >= 2000 THEN 2.05
    WHEN volume >= 1750 THEN 2.10
    WHEN volume >= 1500 THEN 2.15
    WHEN volume >= 1250 THEN 2.20
    WHEN volume >= 1000 THEN 2.25
    WHEN volume >= 750 THEN 2.35
    WHEN volume >= 500 THEN 2.45
    WHEN volume >= 250 THEN 2.55
    WHEN volume >= 100 THEN 2.60
    ELSE 2.60 -- Default for minimum
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to calculate total cost for credit volume
CREATE OR REPLACE FUNCTION calculate_credit_total_cost(volume INTEGER)
RETURNS DECIMAL(10, 2) AS $$
DECLARE
  unit_price DECIMAL(10, 2);
BEGIN
  unit_price := get_credit_unit_price(volume);
  RETURN volume * unit_price;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to check if creator is Pro (checks expiration)
CREATE OR REPLACE FUNCTION is_creator_pro(p_creator_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_is_pro BOOLEAN;
  v_expiration_date TIMESTAMPTZ;
BEGIN
  SELECT is_pro, pro_expiration_date
  INTO v_is_pro, v_expiration_date
  FROM public.creator_profiles
  WHERE id = p_creator_id;
  
  -- If not Pro, return false
  IF NOT v_is_pro THEN
    RETURN false;
  END IF;
  
  -- If Pro with no expiration (shouldn't happen for now, but handle it)
  IF v_expiration_date IS NULL THEN
    RETURN true;
  END IF;
  
  -- Check if expired
  IF v_expiration_date < NOW() THEN
    -- Auto-expire if past expiration date
    UPDATE public.creator_profiles
    SET is_pro = false, pro_status_source = NULL
    WHERE id = p_creator_id;
    RETURN false;
  END IF;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql;

-- Function to get creator payout amount (€0.90 or €1.10)
CREATE OR REPLACE FUNCTION get_creator_payout_amount(p_creator_id UUID)
RETURNS DECIMAL(10, 2) AS $$
BEGIN
  IF is_creator_pro(p_creator_id) THEN
    RETURN 1.10; -- Pro rate
  ELSE
    RETURN 0.90; -- Standard rate
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to deduct credit and create transaction
CREATE OR REPLACE FUNCTION deduct_saas_credit(
  p_saas_id UUID,
  p_lead_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_current_credits INTEGER;
  v_new_balance INTEGER;
  v_transaction_id UUID;
BEGIN
  -- Get current credit balance
  SELECT wallet_credits INTO v_current_credits
  FROM public.saas_companies
  WHERE id = p_saas_id;
  
  -- Check if credits available
  IF v_current_credits <= 0 THEN
    RETURN false;
  END IF;
  
  -- Calculate new balance
  v_new_balance := v_current_credits - 1;
  
  -- Update SaaS wallet
  UPDATE public.saas_companies
  SET wallet_credits = v_new_balance
  WHERE id = p_saas_id;
  
  -- Create transaction record
  INSERT INTO public.saas_credit_transactions (
    saas_id,
    transaction_type,
    credits_amount,
    balance_before,
    balance_after,
    related_lead_id
  ) VALUES (
    p_saas_id,
    'deduction',
    -1,
    v_current_credits,
    v_new_balance,
    p_lead_id
  ) RETURNING id INTO v_transaction_id;
  
  -- Mark lead as credits deducted
  UPDATE public.leads
  SET credits_deducted = true
  WHERE id = p_lead_id;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql;

-- Function to add credits (for subscription renewal)
CREATE OR REPLACE FUNCTION add_saas_credits(
  p_saas_id UUID,
  p_credits_to_add INTEGER,
  p_stripe_subscription_id TEXT DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
  v_current_credits INTEGER;
  v_new_balance INTEGER;
  v_transaction_id UUID;
BEGIN
  -- Get current credit balance (for roll-over)
  SELECT wallet_credits INTO v_current_credits
  FROM public.saas_companies
  WHERE id = p_saas_id;
  
  -- Calculate new balance (roll-over: current + new)
  v_new_balance := v_current_credits + p_credits_to_add;
  
  -- Update SaaS wallet
  UPDATE public.saas_companies
  SET wallet_credits = v_new_balance
  WHERE id = p_saas_id;
  
  -- Create transaction record
  INSERT INTO public.saas_credit_transactions (
    saas_id,
    transaction_type,
    credits_amount,
    balance_before,
    balance_after,
    stripe_subscription_id
  ) VALUES (
    p_saas_id,
    'rollover',
    p_credits_to_add,
    v_current_credits,
    v_new_balance,
    p_stripe_subscription_id
  ) RETURNING id INTO v_transaction_id;
  
  RETURN v_new_balance;
END;
$$ LANGUAGE plpgsql;

-- Function to get credit health status
CREATE OR REPLACE FUNCTION get_credit_health_status(p_credits INTEGER)
RETURNS TEXT AS $$
BEGIN
  RETURN CASE
    WHEN p_credits > 200 THEN 'safe'
    WHEN p_credits > 50 THEN 'risky'
    WHEN p_credits > 0 THEN 'low'
    ELSE 'empty'
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to create lead with credit system (replaces old create_lead)
CREATE OR REPLACE FUNCTION create_lead_with_credits(
  p_tracked_link_id UUID,
  p_creator_id UUID,
  p_saas_id UUID
)
RETURNS UUID AS $$
DECLARE
  v_current_credits INTEGER;
  v_creator_payout DECIMAL(10, 2);
  v_lead_id UUID;
  v_credit_deducted BOOLEAN;
BEGIN
  -- Check if SaaS has credits available
  SELECT wallet_credits INTO v_current_credits
  FROM public.saas_companies
  WHERE id = p_saas_id;
  
  IF v_current_credits IS NULL THEN
    RAISE EXCEPTION 'SaaS company not found: %', p_saas_id;
  END IF;
  
  -- HARD CAP: If credits = 0, block lead creation
  IF v_current_credits <= 0 THEN
    RAISE EXCEPTION 'Insufficient credits. SaaS has 0 credits remaining.';
  END IF;
  
  -- Get creator payout amount (€0.90 or €1.10 based on Pro status)
  v_creator_payout := get_creator_payout_amount(p_creator_id);
  
  -- Create lead record first (before deducting credits for transaction log)
  INSERT INTO public.leads (
    tracked_link_id,
    creator_id,
    saas_id,
    creator_payout_amount,
    status,
    validated_at,
    credits_deducted
  ) VALUES (
    p_tracked_link_id,
    p_creator_id,
    p_saas_id,
    v_creator_payout,
    'validated',
    NOW(),
    false -- Will be set to true after successful deduction
  ) RETURNING id INTO v_lead_id;
  
  -- Deduct credit (this also creates transaction and marks lead)
  v_credit_deducted := deduct_saas_credit(p_saas_id, v_lead_id);
  
  IF NOT v_credit_deducted THEN
    -- Rollback: delete lead if credit deduction failed
    DELETE FROM public.leads WHERE id = v_lead_id;
    RAISE EXCEPTION 'Failed to deduct credit. Lead creation cancelled.';
  END IF;
  
  -- Update creator wallet (pending balance)
  PERFORM public.increment_creator_wallet_pending(p_creator_id, v_creator_payout);
  
  RETURN v_lead_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 6. UPDATE EXISTING DATA (if any)
-- =====================================================

-- Set default values for existing SaaS companies
UPDATE public.saas_companies 
SET wallet_credits = 0
WHERE wallet_credits IS NULL;

-- Set default values for existing creators (all start as Standard)
UPDATE public.creator_profiles 
SET is_pro = false
WHERE is_pro IS NULL;

-- Mark existing leads as not using credit system
UPDATE public.leads
SET credits_deducted = false
WHERE credits_deducted IS NULL;

-- =====================================================
-- 7. COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON COLUMN public.saas_companies.wallet_credits IS 'Current credit balance (prepaid credits, never expire, unlimited roll-over)';
COMMENT ON COLUMN public.saas_companies.monthly_credit_subscription IS 'Monthly credit volume subscription (100-5000+)';
COMMENT ON COLUMN public.saas_companies.credit_renewal_date IS 'Next monthly renewal date for credit subscription';
COMMENT ON COLUMN public.saas_companies.stripe_subscription_id_credits IS 'Stripe subscription ID for credit renewal';

COMMENT ON COLUMN public.creator_profiles.is_pro IS 'Pro status flag (€1.10/click vs €0.90/click)';
COMMENT ON COLUMN public.creator_profiles.pro_status_source IS 'How Pro was activated: PAYMENT (Stripe subscription) or PROMO (admin granted)';
COMMENT ON COLUMN public.creator_profiles.pro_expiration_date IS 'When Pro expires (null = lifetime, but not used for now)';
COMMENT ON COLUMN public.creator_profiles.stripe_subscription_id_pro IS 'Stripe subscription ID for Pro (if paid)';

COMMENT ON TABLE public.saas_credit_transactions IS 'Tracks all credit purchases, deductions, and roll-overs';
COMMENT ON COLUMN public.leads.credits_deducted IS 'Whether credits were deducted for this lead (new credit system)';
COMMENT ON COLUMN public.leads.creator_payout_amount IS 'Creator payout amount at time of click (€0.90 Standard or €1.10 Pro)';

-- =====================================================
-- DONE! ✅
-- =====================================================
-- 
-- New Columns Added:
--   saas_companies: wallet_credits, monthly_credit_subscription, credit_renewal_date, stripe_subscription_id_credits
--   creator_profiles: is_pro, pro_status_source, pro_expiration_date, stripe_subscription_id_pro
--   leads: credits_deducted, creator_payout_amount
--
-- New Tables:
--   saas_credit_transactions
--
-- New Functions:
--   get_credit_unit_price(volume) - Returns unit price based on volume
--   calculate_credit_total_cost(volume) - Returns total cost
--   is_creator_pro(creator_id) - Checks Pro status with expiration
--   get_creator_payout_amount(creator_id) - Returns €0.90 or €1.10
--   deduct_saas_credit(saas_id, lead_id) - Deducts 1 credit, creates transaction
--   add_saas_credits(saas_id, credits, subscription_id) - Adds credits with roll-over
--   get_credit_health_status(credits) - Returns 'safe', 'risky', 'low', or 'empty'
--
-- Next Steps:
--   1. Test migration in development
--   2. Set up Stripe products for credit subscriptions
--   3. Implement credit deduction logic in lead creation
--   4. Build frontend components
-- =====================================================
