-- =====================================================
-- REMOVE PRICING PLANS - Everyone gets same features
-- =====================================================
-- Run this in Supabase SQL Editor after deploying code changes.
-- 
-- Changes:
-- - Unlimited creators for all SaaS (no tier limits)
-- - 1% platform fee for all (was 5%/3%/1% by tier)
-- - Multi-brand and Lead Feed available to everyone (code change)
-- =====================================================

-- Update get_saas_max_creators: unlimited for all tiers
CREATE OR REPLACE FUNCTION get_saas_max_creators(tier TEXT)
RETURNS INTEGER AS $$
BEGIN
  RETURN 999999;  -- Unlimited for everyone
END;
$$ LANGUAGE plpgsql;

-- Update get_saas_platform_fee: 1% for all tiers
CREATE OR REPLACE FUNCTION get_saas_platform_fee(tier TEXT)
RETURNS DECIMAL AS $$
BEGIN
  RETURN 1.00;  -- 1% for everyone
END;
$$ LANGUAGE plpgsql;

-- Update get_saas_platform_fee_rate (used by commissions)
CREATE OR REPLACE FUNCTION public.get_saas_platform_fee_rate(p_saas_id UUID)
RETURNS DECIMAL AS $$
BEGIN
  RETURN 1.00;  -- 1% for everyone
END;
$$ LANGUAGE plpgsql;

-- Update get_creator_max_saas: unlimited for all creators
CREATE OR REPLACE FUNCTION get_creator_max_saas(tier TEXT)
RETURNS INTEGER AS $$
BEGIN
  RETURN 999999;  -- Unlimited for everyone
END;
$$ LANGUAGE plpgsql;
