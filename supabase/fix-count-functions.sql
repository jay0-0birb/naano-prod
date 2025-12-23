-- Fix ambiguous column reference errors in count functions
-- Drop old functions first, then recreate with p_ prefix for parameters

-- Drop old functions
DROP FUNCTION IF EXISTS count_saas_active_creators(UUID);
DROP FUNCTION IF EXISTS count_creator_active_saas(UUID);
DROP FUNCTION IF EXISTS can_saas_accept_creator(UUID);
DROP FUNCTION IF EXISTS can_creator_apply(UUID);

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

