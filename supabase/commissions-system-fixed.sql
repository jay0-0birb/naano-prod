-- =====================================================
-- COMMISSION SYSTEM (FIXED VERSION)
-- =====================================================
-- Run this entire script in Supabase SQL Editor
-- =====================================================

-- =====================================================
-- STEP 1: CREATE TABLES (in correct order)
-- =====================================================

-- First, create commission_payouts (no dependencies)
CREATE TABLE IF NOT EXISTS public.commission_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES public.creator_profiles(id) ON DELETE CASCADE,
  
  -- Amount
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'eur',
  
  -- Stripe
  stripe_account_id TEXT NOT NULL, -- Creator's Stripe Connect account
  stripe_transfer_id TEXT, -- Stripe transfer ID
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'succeeded', 'failed')),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  
  -- Metadata
  commission_count INTEGER DEFAULT 0, -- Number of commissions included
  error_message TEXT
);

-- Then, create commissions (can now reference commission_payouts)
CREATE TABLE IF NOT EXISTS public.commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collaboration_id UUID NOT NULL REFERENCES public.collaborations(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES public.creator_profiles(id) ON DELETE CASCADE,
  saas_id UUID NOT NULL REFERENCES public.saas_companies(id) ON DELETE CASCADE,
  
  -- Period
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  
  -- Revenue
  total_revenue_generated DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  
  -- Commission rates (stored for historical accuracy)
  creator_commission_rate DECIMAL(5, 2) NOT NULL DEFAULT 15.00, -- 15% of revenue
  platform_creator_fee_rate DECIMAL(5, 2) NOT NULL DEFAULT 15.00, -- 15% of creator commission
  saas_platform_fee_rate DECIMAL(5, 2) NOT NULL DEFAULT 0.00, -- 1-5% based on SaaS tier
  
  -- Calculated amounts
  creator_gross_earnings DECIMAL(10, 2) NOT NULL DEFAULT 0.00, -- 15% of revenue
  platform_creator_fee DECIMAL(10, 2) NOT NULL DEFAULT 0.00, -- 15% of creator gross
  creator_net_earnings DECIMAL(10, 2) NOT NULL DEFAULT 0.00, -- Creator gross - platform fee
  platform_saas_fee DECIMAL(10, 2) NOT NULL DEFAULT 0.00, -- 1-5% of revenue
  platform_total_revenue DECIMAL(10, 2) NOT NULL DEFAULT 0.00, -- Sum of both platform fees
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled')),
  
  -- Payout tracking (references commission_payouts which now exists)
  payout_id UUID REFERENCES public.commission_payouts(id) ON DELETE SET NULL,
  paid_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure one commission per collaboration per period
  UNIQUE (collaboration_id, period_start, period_end)
);

-- =====================================================
-- STEP 2: ENABLE ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE public.commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commission_payouts ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- STEP 3: CREATE RLS POLICIES
-- =====================================================

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view commissions for their collaborations" ON public.commissions;
DROP POLICY IF EXISTS "Creators can view their own payouts" ON public.commission_payouts;

-- Commissions RLS
CREATE POLICY "Users can view commissions for their collaborations"
  ON public.commissions FOR SELECT
  USING (
    creator_id IN (SELECT id FROM public.creator_profiles WHERE profile_id = auth.uid())
    OR
    saas_id IN (SELECT id FROM public.saas_companies WHERE profile_id = auth.uid())
  );

-- Payouts RLS
CREATE POLICY "Creators can view their own payouts"
  ON public.commission_payouts FOR SELECT
  USING (creator_id IN (SELECT id FROM public.creator_profiles WHERE profile_id = auth.uid()));

-- =====================================================
-- STEP 4: CREATE HELPER FUNCTIONS
-- =====================================================

-- Get SaaS platform fee rate based on subscription tier
CREATE OR REPLACE FUNCTION public.get_saas_platform_fee_rate(p_saas_id UUID)
RETURNS DECIMAL AS $$
DECLARE
  v_tier TEXT;
BEGIN
  SELECT COALESCE(subscription_tier, 'starter') INTO v_tier
  FROM public.saas_companies WHERE id = p_saas_id;
  
  RETURN CASE v_tier
    WHEN 'starter' THEN 5.00
    WHEN 'growth' THEN 3.00
    WHEN 'scale' THEN 1.00
    ELSE 5.00
  END;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- STEP 5: CREATE CALCULATION FUNCTIONS
-- =====================================================

-- Calculate commission for a collaboration period
CREATE OR REPLACE FUNCTION public.calculate_commission_for_period(
  p_collaboration_id UUID,
  p_period_start TIMESTAMPTZ,
  p_period_end TIMESTAMPTZ
)
RETURNS UUID AS $$
DECLARE
  v_creator_id UUID;
  v_saas_id UUID;
  v_gross_revenue DECIMAL(10, 2);
  v_net_revenue DECIMAL(10, 2);
  v_total_stripe_fees DECIMAL(10, 2);
  v_creator_commission_rate DECIMAL(5, 2) := 15.00;
  v_platform_creator_fee_rate DECIMAL(5, 2) := 15.00;
  v_saas_platform_fee_rate DECIMAL(5, 2);
  v_creator_gross DECIMAL(10, 2);
  v_platform_creator_fee DECIMAL(10, 2);
  v_creator_net DECIMAL(10, 2);
  v_platform_saas_fee DECIMAL(10, 2);
  v_platform_total DECIMAL(10, 2);
  v_commission_id UUID;
BEGIN
  -- Get collaboration details
  SELECT 
    a.creator_id,
    a.saas_id
  INTO
    v_creator_id,
    v_saas_id
  FROM public.collaborations c
  JOIN public.applications a ON c.application_id = a.id
  WHERE c.id = p_collaboration_id;

  IF v_creator_id IS NULL OR v_saas_id IS NULL THEN
    RAISE EXCEPTION 'Collaboration % not found', p_collaboration_id;
  END IF;

  -- Get total revenue from link_events for this period
  -- Use net_revenue_amount if available (after Stripe fees), otherwise fallback to revenue_amount
  SELECT 
    COALESCE(SUM(le.revenue_amount), 0) as gross,
    COALESCE(SUM(COALESCE(le.net_revenue_amount, le.revenue_amount)), 0) as net,
    COALESCE(SUM(COALESCE(le.stripe_fee_amount, 0)), 0) as fees
  INTO 
    v_gross_revenue,
    v_net_revenue,
    v_total_stripe_fees
  FROM public.link_events le
  JOIN public.tracked_links tl ON le.tracked_link_id = tl.id
  WHERE tl.collaboration_id = p_collaboration_id
    AND le.event_type = 'conversion'
    AND le.occurred_at >= p_period_start
    AND le.occurred_at < p_period_end;

  -- If no revenue, return NULL (no commission to create)
  IF v_net_revenue = 0 THEN
    RETURN NULL;
  END IF;

  -- Get SaaS platform fee rate
  v_saas_platform_fee_rate := public.get_saas_platform_fee_rate(v_saas_id);

  -- Calculate amounts based on NET revenue (after Stripe fees)
  v_creator_gross := v_net_revenue * (v_creator_commission_rate / 100);
  v_platform_creator_fee := v_creator_gross * (v_platform_creator_fee_rate / 100);
  v_creator_net := v_creator_gross - v_platform_creator_fee;
  v_platform_saas_fee := v_net_revenue * (v_saas_platform_fee_rate / 100);
  v_platform_total := v_platform_creator_fee + v_platform_saas_fee;

  -- Insert or update commission
  INSERT INTO public.commissions (
    collaboration_id,
    creator_id,
    saas_id,
    period_start,
    period_end,
    gross_revenue_generated,
    total_revenue_generated, -- Net revenue (after Stripe fees)
    total_stripe_fees,
    creator_commission_rate,
    platform_creator_fee_rate,
    saas_platform_fee_rate,
    creator_gross_earnings,
    platform_creator_fee,
    creator_net_earnings,
    platform_saas_fee,
    platform_total_revenue,
    status
  ) VALUES (
    p_collaboration_id,
    v_creator_id,
    v_saas_id,
    p_period_start,
    p_period_end,
    v_gross_revenue,
    v_net_revenue, -- Net revenue used for calculations
    v_total_stripe_fees,
    v_creator_commission_rate,
    v_platform_creator_fee_rate,
    v_saas_platform_fee_rate,
    v_creator_gross,
    v_platform_creator_fee,
    v_creator_net,
    v_platform_saas_fee,
    v_platform_total,
    'pending' -- Auto-approved
  )
  ON CONFLICT (collaboration_id, period_start, period_end) 
  DO UPDATE SET
    gross_revenue_generated = EXCLUDED.gross_revenue_generated,
    total_revenue_generated = EXCLUDED.total_revenue_generated,
    total_stripe_fees = EXCLUDED.total_stripe_fees,
    creator_gross_earnings = EXCLUDED.creator_gross_earnings,
    platform_creator_fee = EXCLUDED.platform_creator_fee,
    creator_net_earnings = EXCLUDED.creator_net_earnings,
    platform_saas_fee = EXCLUDED.platform_saas_fee,
    platform_total_revenue = EXCLUDED.platform_total_revenue,
    saas_platform_fee_rate = EXCLUDED.saas_platform_fee_rate,
    updated_at = NOW()
  RETURNING id INTO v_commission_id;

  RETURN v_commission_id;
END;
$$ LANGUAGE plpgsql;

-- Calculate all commissions for a month
CREATE OR REPLACE FUNCTION public.calculate_monthly_commissions(
  p_year INTEGER,
  p_month INTEGER
)
RETURNS INTEGER AS $$
DECLARE
  v_period_start TIMESTAMPTZ;
  v_period_end TIMESTAMPTZ;
  v_collaboration RECORD;
  v_count INTEGER := 0;
BEGIN
  -- Calculate period boundaries (calendar month)
  v_period_start := make_timestamp(p_year, p_month, 1, 0, 0, 0);
  v_period_end := (v_period_start + interval '1 month');

  -- Loop through all active collaborations
  FOR v_collaboration IN
    SELECT id FROM public.collaborations WHERE status = 'active'
  LOOP
    -- Calculate commission for this collaboration
    PERFORM public.calculate_commission_for_period(
      v_collaboration.id,
      v_period_start,
      v_period_end
    );
    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- STEP 6: CREATE SUMMARY FUNCTIONS
-- =====================================================

-- Get creator earnings summary
CREATE OR REPLACE FUNCTION public.get_creator_earnings_summary(p_creator_profile_id UUID)
RETURNS TABLE (
  pending_earnings DECIMAL,
  paid_earnings DECIMAL,
  total_earnings DECIMAL,
  pending_count BIGINT,
  paid_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(SUM(CASE WHEN c.status = 'pending' THEN c.creator_net_earnings ELSE 0 END), 0)::DECIMAL as pending_earnings,
    COALESCE(SUM(CASE WHEN c.status = 'paid' THEN c.creator_net_earnings ELSE 0 END), 0)::DECIMAL as paid_earnings,
    COALESCE(SUM(c.creator_net_earnings), 0)::DECIMAL as total_earnings,
    COUNT(CASE WHEN c.status = 'pending' THEN 1 END)::BIGINT as pending_count,
    COUNT(CASE WHEN c.status = 'paid' THEN 1 END)::BIGINT as paid_count
  FROM public.commissions c
  JOIN public.creator_profiles cp ON c.creator_id = cp.id
  WHERE cp.profile_id = p_creator_profile_id;
END;
$$ LANGUAGE plpgsql;

-- Get SaaS commission summary
CREATE OR REPLACE FUNCTION public.get_saas_commission_summary(p_saas_id UUID)
RETURNS TABLE (
  total_commissions_due DECIMAL,
  total_revenue_generated DECIMAL,
  active_collaborations_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(SUM(CASE WHEN c.status = 'pending' THEN c.creator_net_earnings ELSE 0 END), 0)::DECIMAL as total_commissions_due,
    COALESCE(SUM(c.total_revenue_generated), 0)::DECIMAL as total_revenue_generated,
    COUNT(DISTINCT c.collaboration_id)::BIGINT as active_collaborations_count
  FROM public.commissions c
  WHERE c.saas_id = p_saas_id
    AND c.status = 'pending';
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- STEP 7: CREATE INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_commissions_creator_id ON public.commissions(creator_id);
CREATE INDEX IF NOT EXISTS idx_commissions_saas_id ON public.commissions(saas_id);
CREATE INDEX IF NOT EXISTS idx_commissions_collaboration_id ON public.commissions(collaboration_id);
CREATE INDEX IF NOT EXISTS idx_commissions_status ON public.commissions(status);
CREATE INDEX IF NOT EXISTS idx_commissions_period ON public.commissions(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_commission_payouts_creator_id ON public.commission_payouts(creator_id);
CREATE INDEX IF NOT EXISTS idx_commission_payouts_status ON public.commission_payouts(status);

-- =====================================================
-- DONE! ✅
-- =====================================================
-- 
-- Verify tables were created:
-- SELECT table_name FROM information_schema.tables 
-- WHERE table_schema = 'public' 
-- AND table_name IN ('commissions', 'commission_payouts');
--
-- To calculate commissions for last month:
-- SELECT calculate_monthly_commissions(2024, 11); -- November 2024
--
-- To calculate for current month (so far):
-- SELECT calculate_commission_for_period(
--   'collaboration-uuid',
--   '2024-12-01'::timestamptz,
--   NOW()
-- );

