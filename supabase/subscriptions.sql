-- =====================================================
-- SUBSCRIPTION SYSTEM - Clean Implementation
-- =====================================================
-- Based on Business Model:
-- 
-- SaaS Plans:
--   - Starter (FREE): 3 creators, 5% platform fee
--   - Growth (€59/mo): 10 creators, 3% platform fee
--   - Scale (€89/mo): Unlimited creators, 1% platform fee
--
-- Creator Plans:
--   - Free: 5 SaaS max (only plan for now)
-- =====================================================

-- =====================================================
-- 1. ADD SUBSCRIPTION FIELDS TO SAAS_COMPANIES
-- =====================================================

-- Add subscription_tier if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'saas_companies' AND column_name = 'subscription_tier'
  ) THEN
    ALTER TABLE saas_companies 
    ADD COLUMN subscription_tier TEXT DEFAULT 'starter'
    CHECK (subscription_tier IN ('starter', 'growth', 'scale'));
  END IF;
END $$;

-- Add Stripe subscription ID for paid plans
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'saas_companies' AND column_name = 'stripe_subscription_id'
  ) THEN
    ALTER TABLE saas_companies 
    ADD COLUMN stripe_subscription_id TEXT;
  END IF;
END $$;

-- Add subscription status
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'saas_companies' AND column_name = 'subscription_status'
  ) THEN
    ALTER TABLE saas_companies 
    ADD COLUMN subscription_status TEXT DEFAULT 'active'
    CHECK (subscription_status IN ('active', 'past_due', 'cancelled', 'trialing'));
  END IF;
END $$;

-- =====================================================
-- 2. ADD SUBSCRIPTION FIELDS TO CREATOR_PROFILES
-- =====================================================

-- Creators are free for now, but add field for future
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'creator_profiles' AND column_name = 'subscription_tier'
  ) THEN
    ALTER TABLE creator_profiles 
    ADD COLUMN subscription_tier TEXT DEFAULT 'free'
    CHECK (subscription_tier IN ('free'));
  END IF;
END $$;

-- =====================================================
-- 3. HELPER FUNCTIONS
-- =====================================================

-- Get max creators allowed for a SaaS tier
CREATE OR REPLACE FUNCTION get_saas_max_creators(tier TEXT)
RETURNS INTEGER AS $$
BEGIN
  RETURN CASE tier
    WHEN 'starter' THEN 3
    WHEN 'growth' THEN 10
    WHEN 'scale' THEN 999999  -- Unlimited
    ELSE 3
  END;
END;
$$ LANGUAGE plpgsql;

-- Get platform fee rate for a SaaS tier
CREATE OR REPLACE FUNCTION get_saas_platform_fee(tier TEXT)
RETURNS DECIMAL AS $$
BEGIN
  RETURN CASE tier
    WHEN 'starter' THEN 5.00
    WHEN 'growth' THEN 3.00
    WHEN 'scale' THEN 1.00
    ELSE 5.00
  END;
END;
$$ LANGUAGE plpgsql;

-- Get max SaaS allowed for a creator tier
CREATE OR REPLACE FUNCTION get_creator_max_saas(tier TEXT)
RETURNS INTEGER AS $$
BEGIN
  RETURN CASE tier
    WHEN 'free' THEN 5
    ELSE 5
  END;
END;
$$ LANGUAGE plpgsql;

-- Count active creators for a SaaS
CREATE OR REPLACE FUNCTION count_saas_active_creators(p_saas_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(DISTINCT a.creator_id)
    FROM applications a
    JOIN collaborations c ON c.application_id = a.id
    WHERE a.saas_id = p_saas_id
      AND c.status = 'active'
  );
END;
$$ LANGUAGE plpgsql;

-- Count active SaaS for a creator
CREATE OR REPLACE FUNCTION count_creator_active_saas(p_creator_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(DISTINCT a.saas_id)
    FROM applications a
    JOIN collaborations c ON c.application_id = a.id
    WHERE a.creator_id = p_creator_id
      AND c.status = 'active'
  );
END;
$$ LANGUAGE plpgsql;

-- Check if SaaS can accept more creators
CREATE OR REPLACE FUNCTION can_saas_accept_creator(p_saas_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_tier TEXT;
  v_max INTEGER;
  v_current INTEGER;
BEGIN
  -- Get SaaS tier
  SELECT COALESCE(subscription_tier, 'starter') INTO v_tier
  FROM saas_companies WHERE id = p_saas_id;
  
  -- Get limits
  v_max := get_saas_max_creators(v_tier);
  v_current := count_saas_active_creators(p_saas_id);
  
  RETURN v_current < v_max;
END;
$$ LANGUAGE plpgsql;

-- Check if creator can apply to more SaaS
CREATE OR REPLACE FUNCTION can_creator_apply(p_creator_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_tier TEXT;
  v_max INTEGER;
  v_current INTEGER;
BEGIN
  -- Get creator tier
  SELECT COALESCE(subscription_tier, 'free') INTO v_tier
  FROM creator_profiles WHERE id = p_creator_id;
  
  -- Get limits
  v_max := get_creator_max_saas(v_tier);
  v_current := count_creator_active_saas(p_creator_id);
  
  RETURN v_current < v_max;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 4. UPDATE EXISTING DATA
-- =====================================================

-- Set default tier for existing SaaS companies
UPDATE saas_companies 
SET subscription_tier = 'starter',
    subscription_status = 'active'
WHERE subscription_tier IS NULL;

-- Set default tier for existing creators
UPDATE creator_profiles 
SET subscription_tier = 'free'
WHERE subscription_tier IS NULL;

-- =====================================================
-- DONE! 🎉
-- =====================================================
-- 
-- SaaS Tiers:
--   starter: FREE, 3 creators, 5% fee
--   growth: €59/mo, 10 creators, 3% fee  
--   scale: €89/mo, unlimited creators, 1% fee
--
-- Creator Tiers:
--   free: 5 SaaS max
--
-- Functions:
--   get_saas_max_creators(tier) - Returns creator limit
--   get_saas_platform_fee(tier) - Returns fee %
--   get_creator_max_saas(tier) - Returns SaaS limit
--   count_saas_active_creators(id) - Count current creators
--   count_creator_active_saas(id) - Count current SaaS
--   can_saas_accept_creator(id) - Check if under limit
--   can_creator_apply(id) - Check if under limit

