-- =====================================================
-- BP1 PAYMENT SYSTEM - Complete Implementation
-- =====================================================
-- Based on BP1.md - Lead-based pricing model
-- =====================================================

-- =====================================================
-- STEP 1: CREATE LEADS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tracked_link_id UUID NOT NULL REFERENCES public.tracked_links(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES public.creator_profiles(id) ON DELETE CASCADE,
  saas_id UUID NOT NULL REFERENCES public.saas_companies(id) ON DELETE CASCADE,
  
  -- CRITICAL: Plan and pricing at time of lead creation
  saas_plan TEXT NOT NULL CHECK (saas_plan IN ('starter', 'growth', 'scale')),
  lead_value DECIMAL(10, 2) NOT NULL, -- €2.50 / €2.00 / €1.60 (based on plan)
  creator_earnings DECIMAL(10, 2) NOT NULL DEFAULT 1.20, -- ALWAYS €1.20
  naano_margin_brut DECIMAL(10, 2) NOT NULL, -- lead_value - 1.20
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'validated', 'billed')),
  validated_at TIMESTAMPTZ,
  billed_at TIMESTAMPTZ,
  billing_invoice_id UUID, -- Links to billing_invoices when billed
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_leads_saas_id ON public.leads(saas_id);
CREATE INDEX IF NOT EXISTS idx_leads_creator_id ON public.leads(creator_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_tracked_link_id ON public.leads(tracked_link_id);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON public.leads(created_at);

-- =====================================================
-- STEP 2: CREATE CREATOR WALLETS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.creator_wallets (
  creator_id UUID PRIMARY KEY REFERENCES public.creator_profiles(id) ON DELETE CASCADE,
  
  -- Before SaaS pays
  pending_balance DECIMAL(10, 2) NOT NULL DEFAULT 0.00, -- Waiting for SaaS payment
  
  -- After SaaS pays
  available_balance DECIMAL(10, 2) NOT NULL DEFAULT 0.00, -- Ready for payout
  
  -- Lifetime
  total_earned DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- STEP 3: CREATE SAAS BILLING DEBT TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.saas_billing_debt (
  saas_id UUID PRIMARY KEY REFERENCES public.saas_companies(id) ON DELETE CASCADE,
  
  -- Current accumulated debt (sum of lead_values)
  current_debt DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  
  -- Billing threshold
  billing_threshold DECIMAL(10, 2) NOT NULL DEFAULT 100.00,
  
  -- Tracking
  last_billed_at TIMESTAMPTZ,
  next_billing_date DATE, -- End of current month
  
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- STEP 4: CREATE BILLING INVOICES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.billing_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  saas_id UUID NOT NULL REFERENCES public.saas_companies(id) ON DELETE CASCADE,
  
  -- Invoice number
  invoice_number TEXT NOT NULL UNIQUE,
  
  -- Amounts
  amount_ht DECIMAL(10, 2) NOT NULL, -- Total before tax (sum of lead_values)
  amount_ttc DECIMAL(10, 2) NOT NULL, -- Total with tax
  
  -- Stripe
  stripe_invoice_id TEXT,
  stripe_payment_intent_id TEXT,
  stripe_fee_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00, -- Stripe fees (~1.5% + €0.25)
  naano_received_amount DECIMAL(10, 2) NOT NULL, -- amount_ht - stripe_fee_amount
  
  -- Leads (may be mixed plans)
  leads_count INTEGER NOT NULL,
  period_start TIMESTAMPTZ,
  period_end TIMESTAMPTZ,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'failed')),
  paid_at TIMESTAMPTZ,
  
  -- Invoice PDF
  pdf_url TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_billing_invoices_saas_id ON public.billing_invoices(saas_id);
CREATE INDEX IF NOT EXISTS idx_billing_invoices_status ON public.billing_invoices(status);
CREATE INDEX IF NOT EXISTS idx_billing_invoices_invoice_number ON public.billing_invoices(invoice_number);

-- =====================================================
-- STEP 5: CREATE INVOICE LINE ITEMS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.invoice_line_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES public.billing_invoices(id) ON DELETE CASCADE,
  
  line_type TEXT NOT NULL CHECK (line_type IN ('talent', 'tech_fee')),
  description TEXT NOT NULL,
  
  -- Amounts
  amount_ht DECIMAL(10, 2) NOT NULL,
  tva_rate DECIMAL(5, 2) NOT NULL, -- 0% for talent, 20% for tech
  tva_amount DECIMAL(10, 2) NOT NULL,
  amount_ttc DECIMAL(10, 2) NOT NULL,
  
  -- Details
  quantity INTEGER NOT NULL, -- Number of leads
  unit_price DECIMAL(10, 2) NOT NULL -- €1.20 for talent, varies for tech
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_invoice_line_items_invoice_id ON public.invoice_line_items(invoice_id);

-- =====================================================
-- STEP 6: CREATE CREATOR PAYOUTS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.creator_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES public.creator_profiles(id) ON DELETE CASCADE,
  
  -- Amount Naano transfers to creator
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'eur',
  
  -- Stripe transfer
  stripe_account_id TEXT NOT NULL, -- Creator's Stripe Connect account
  stripe_transfer_id TEXT,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  error_message TEXT
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_creator_payouts_creator_id ON public.creator_payouts(creator_id);
CREATE INDEX IF NOT EXISTS idx_creator_payouts_status ON public.creator_payouts(status);

-- =====================================================
-- STEP 7: CREATE CREATOR INVOICES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.creator_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES public.creator_profiles(id) ON DELETE CASCADE,
  payout_id UUID REFERENCES public.creator_payouts(id) ON DELETE SET NULL,
  
  -- Invoice number
  invoice_number TEXT NOT NULL UNIQUE,
  
  -- Document type
  document_type TEXT NOT NULL CHECK (document_type IN ('facture', 'releve')), -- 'facture' if SIRET, 'releve' if particulier
  
  -- Amounts
  amount_ht DECIMAL(10, 2) NOT NULL,
  tva_rate DECIMAL(5, 2) NOT NULL DEFAULT 0.00, -- 0% for most, 20% if creator is assujetti
  tva_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  amount_ttc DECIMAL(10, 2) NOT NULL,
  
  -- Leads included
  leads_count INTEGER NOT NULL,
  
  -- PDF
  pdf_url TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_creator_invoices_creator_id ON public.creator_invoices(creator_id);
CREATE INDEX IF NOT EXISTS idx_creator_invoices_payout_id ON public.creator_invoices(payout_id);

-- =====================================================
-- STEP 8: UPDATE EXISTING TABLES
-- =====================================================

-- Add card fields to saas_companies
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'saas_companies' AND column_name = 'card_on_file'
  ) THEN
    ALTER TABLE public.saas_companies 
    ADD COLUMN card_on_file BOOLEAN DEFAULT false,
    ADD COLUMN card_last4 TEXT,
    ADD COLUMN card_brand TEXT,
    ADD COLUMN stripe_setup_intent_id TEXT;
  END IF;
END $$;

-- Add SIRET and TVA status to creator_profiles
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'creator_profiles' AND column_name = 'siret'
  ) THEN
    ALTER TABLE public.creator_profiles 
    ADD COLUMN siret TEXT,
    ADD COLUMN tva_assujetti BOOLEAN DEFAULT false; -- If true, add 20% TVA on creator earnings
  END IF;
END $$;

-- Update link_events to support 'lead' event type
DO $$ 
BEGIN
  -- Check if constraint exists and update it
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'link_events_event_type_check'
  ) THEN
    ALTER TABLE public.link_events 
    DROP CONSTRAINT IF EXISTS link_events_event_type_check;
  END IF;
  
  ALTER TABLE public.link_events 
  ADD CONSTRAINT link_events_event_type_check 
  CHECK (event_type IN ('impression', 'click', 'conversion', 'lead'));
END $$;

-- =====================================================
-- STEP 9: ENABLE ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saas_billing_debt ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_invoices ENABLE ROW LEVEL SECURITY;

-- RLS Policies for leads
CREATE POLICY "Users can view leads for their collaborations"
  ON public.leads FOR SELECT
  USING (
    creator_id IN (SELECT id FROM public.creator_profiles WHERE profile_id = auth.uid())
    OR
    saas_id IN (SELECT id FROM public.saas_companies WHERE profile_id = auth.uid())
  );

CREATE POLICY "System can create leads"
  ON public.leads FOR INSERT
  WITH CHECK (true);

-- RLS Policies for creator_wallets
CREATE POLICY "Creators can view their own wallet"
  ON public.creator_wallets FOR SELECT
  USING (creator_id IN (SELECT id FROM public.creator_profiles WHERE profile_id = auth.uid()));

-- RLS Policies for saas_billing_debt
CREATE POLICY "SaaS can view their own debt"
  ON public.saas_billing_debt FOR SELECT
  USING (saas_id IN (SELECT id FROM public.saas_companies WHERE profile_id = auth.uid()));

-- RLS Policies for billing_invoices
CREATE POLICY "SaaS can view their own invoices"
  ON public.billing_invoices FOR SELECT
  USING (saas_id IN (SELECT id FROM public.saas_companies WHERE profile_id = auth.uid()));

-- RLS Policies for creator_payouts
CREATE POLICY "Creators can view their own payouts"
  ON public.creator_payouts FOR SELECT
  USING (creator_id IN (SELECT id FROM public.creator_profiles WHERE profile_id = auth.uid()));

-- RLS Policies for creator_invoices
CREATE POLICY "Creators can view their own invoices"
  ON public.creator_invoices FOR SELECT
  USING (creator_id IN (SELECT id FROM public.creator_profiles WHERE profile_id = auth.uid()));

-- =====================================================
-- STEP 10: CREATE HELPER FUNCTIONS
-- =====================================================

-- Get lead price by plan (from BP1.md)
CREATE OR REPLACE FUNCTION public.get_lead_price_by_plan(plan TEXT)
RETURNS DECIMAL AS $$
BEGIN
  RETURN CASE plan
    WHEN 'starter' THEN 2.50
    WHEN 'growth' THEN 2.00
    WHEN 'scale' THEN 1.60
    ELSE 2.50 -- Default to starter
  END;
END;
$$ LANGUAGE plpgsql;

-- Get creator earnings (always fixed at €1.20)
CREATE OR REPLACE FUNCTION public.get_creator_earnings()
RETURNS DECIMAL AS $$
BEGIN
  RETURN 1.20; -- ALWAYS €1.20, never varies
END;
$$ LANGUAGE plpgsql;

-- Calculate Naano margin (brut)
CREATE OR REPLACE FUNCTION public.calculate_naano_margin_brut(lead_value DECIMAL)
RETURNS DECIMAL AS $$
BEGIN
  -- Creator always gets €1.20
  RETURN lead_value - 1.20;
END;
$$ LANGUAGE plpgsql;

-- Calculate Stripe fees (from BP1.md: ~1.5% + €0.25)
CREATE OR REPLACE FUNCTION public.calculate_stripe_fees(amount DECIMAL)
RETURNS DECIMAL AS $$
BEGIN
  -- From BP1.md: ~1.5% + €0.25 on €100 = €1.75
  RETURN ROUND((amount * 0.015 + 0.25)::numeric, 2);
END;
$$ LANGUAGE plpgsql;

-- Increment creator wallet pending balance
CREATE OR REPLACE FUNCTION public.increment_creator_wallet_pending(
  p_creator_id UUID,
  p_amount DECIMAL
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.creator_wallets (creator_id, pending_balance, total_earned, updated_at)
  VALUES (p_creator_id, p_amount, p_amount, NOW())
  ON CONFLICT (creator_id) 
  DO UPDATE SET
    pending_balance = creator_wallets.pending_balance + p_amount,
    total_earned = creator_wallets.total_earned + p_amount,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Increment SaaS debt
CREATE OR REPLACE FUNCTION public.increment_saas_debt(
  p_saas_id UUID,
  p_amount DECIMAL
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.saas_billing_debt (saas_id, current_debt, updated_at)
  VALUES (p_saas_id, p_amount, NOW())
  ON CONFLICT (saas_id) 
  DO UPDATE SET
    current_debt = saas_billing_debt.current_debt + p_amount,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Move creator wallet from pending to available
CREATE OR REPLACE FUNCTION public.move_wallet_pending_to_available(
  p_creator_id UUID,
  p_amount DECIMAL
)
RETURNS VOID AS $$
BEGIN
  UPDATE public.creator_wallets
  SET
    pending_balance = pending_balance - p_amount,
    available_balance = available_balance + p_amount,
    updated_at = NOW()
  WHERE creator_id = p_creator_id;
END;
$$ LANGUAGE plpgsql;

-- Get next billing date (end of current month)
CREATE OR REPLACE FUNCTION public.get_next_billing_date()
RETURNS DATE AS $$
BEGIN
  RETURN (date_trunc('month', NOW()) + interval '1 month')::date;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- STEP 11: CREATE LEAD VALIDATION FUNCTION
-- =====================================================

-- Create and validate a lead
CREATE OR REPLACE FUNCTION public.create_lead(
  p_tracked_link_id UUID,
  p_creator_id UUID,
  p_saas_id UUID
)
RETURNS UUID AS $$
DECLARE
  v_saas_plan TEXT;
  v_lead_value DECIMAL(10, 2);
  v_creator_earnings DECIMAL(10, 2) := 1.20;
  v_naano_margin DECIMAL(10, 2);
  v_lead_id UUID;
BEGIN
  -- Get SaaS's CURRENT plan
  SELECT COALESCE(subscription_tier, 'starter') INTO v_saas_plan
  FROM public.saas_companies
  WHERE id = p_saas_id;
  
  IF v_saas_plan IS NULL THEN
    RAISE EXCEPTION 'SaaS company not found: %', p_saas_id;
  END IF;
  
  -- Calculate lead_value based on plan
  v_lead_value := public.get_lead_price_by_plan(v_saas_plan);
  
  -- Calculate Naano margin
  v_naano_margin := public.calculate_naano_margin_brut(v_lead_value);
  
  -- Create lead record
  INSERT INTO public.leads (
    tracked_link_id,
    creator_id,
    saas_id,
    saas_plan,
    lead_value,
    creator_earnings,
    naano_margin_brut,
    status,
    validated_at
  ) VALUES (
    p_tracked_link_id,
    p_creator_id,
    p_saas_id,
    v_saas_plan,
    v_lead_value,
    v_creator_earnings,
    v_naano_margin,
    'validated',
    NOW()
  ) RETURNING id INTO v_lead_id;
  
  -- Update creator wallet (pending)
  PERFORM public.increment_creator_wallet_pending(p_creator_id, v_creator_earnings);
  
  -- Update SaaS debt
  PERFORM public.increment_saas_debt(p_saas_id, v_lead_value);
  
  RETURN v_lead_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- DONE! ✅
-- =====================================================
-- 
-- Tables created:
-- - leads (with plan-based pricing)
-- - creator_wallets (pending/available balance)
-- - saas_billing_debt (debt tracking)
-- - billing_invoices (SaaS invoices)
-- - invoice_line_items (TVA split)
-- - creator_payouts (payout tracking)
-- - creator_invoices (creator invoices/receipts)
--
-- Functions created:
-- - get_lead_price_by_plan()
-- - get_creator_earnings()
-- - calculate_naano_margin_brut()
-- - calculate_stripe_fees()
-- - create_lead()
-- - Wallet and debt management functions
--
-- Next: Implement billing and payout logic
-- =====================================================

