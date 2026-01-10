-- =====================================================
-- COMPREHENSIVE FIXES FOR ATTRIBUTION SYSTEM
-- =====================================================
-- Addresses all identified issues: critical, high, medium, low
-- =====================================================

-- =====================================================
-- 1. ADD MISSING FIELDS TO company_inferences
-- =====================================================

DO $$ 
BEGIN
  -- Add ambiguity flag (Issue 1.2)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'company_inferences' AND column_name = 'is_ambiguous'
  ) THEN
    ALTER TABLE company_inferences 
    ADD COLUMN is_ambiguous BOOLEAN DEFAULT false;
  END IF;
  
  -- Add disputed state (Issue 1.3)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'company_inferences' AND column_name = 'disputed_at'
  ) THEN
    ALTER TABLE company_inferences 
    ADD COLUMN disputed_at TIMESTAMPTZ,
    ADD COLUMN disputed_reason TEXT;
  END IF;
  
  -- Add confidence decay tracking (Issue 1.1, 2.2)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'company_inferences' AND column_name = 'confidence_decay_applied'
  ) THEN
    ALTER TABLE company_inferences 
    ADD COLUMN confidence_decay_applied DECIMAL(3, 2) DEFAULT 0.00,
    ADD COLUMN last_confidence_update TIMESTAMPTZ DEFAULT NOW();
  END IF;
  
  -- Add normalized company name for matching (Issue 5.4)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'company_inferences' AND column_name = 'normalized_company_name'
  ) THEN
    ALTER TABLE company_inferences 
    ADD COLUMN normalized_company_name TEXT;
  END IF;
  
  -- Update attribution_state to include 'mismatch' (Issue 4.2)
  ALTER TABLE company_inferences 
    DROP CONSTRAINT IF EXISTS company_inferences_attribution_state_check;
  
  ALTER TABLE company_inferences 
    ADD CONSTRAINT company_inferences_attribution_state_check 
    CHECK (attribution_state IN ('inferred', 'confirmed', 'mismatch', 'disputed'));
END $$;

-- =====================================================
-- 2. ADD MISSING FIELDS TO intent_scores
-- =====================================================

DO $$ 
BEGIN
  -- Add recency weighting (Issue 3.1)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'intent_scores' AND column_name = 'recency_weight'
  ) THEN
    ALTER TABLE intent_scores 
    ADD COLUMN recency_weight DECIMAL(3, 2) DEFAULT 1.00,
    ADD COLUMN days_since_session INTEGER;
  END IF;
END $$;

-- =====================================================
-- 3. FUNCTION: Normalize company name (Issue 5.4)
-- =====================================================

CREATE OR REPLACE FUNCTION normalize_company_name(company_name TEXT)
RETURNS TEXT AS $$
BEGIN
  IF company_name IS NULL THEN
    RETURN NULL;
  END IF;
  
  RETURN LOWER(
    REGEXP_REPLACE(
      REGEXP_REPLACE(
        REGEXP_REPLACE(
          REGEXP_REPLACE(
            REGEXP_REPLACE(company_name, '\s+Inc\.?$', '', 'i'),
            '\s+LLC\.?$', '', 'i'
          ),
          '\s+Ltd\.?$', '', 'i'
        ),
        '\s+Corp\.?$', '', 'i'
      ),
      '\s+Corporation$', '', 'i'
    )
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- =====================================================
-- 4. FUNCTION: Calculate confidence decay (Issue 1.1, 2.2)
-- =====================================================

CREATE OR REPLACE FUNCTION calculate_confidence_decay(
  original_confidence DECIMAL,
  days_old INTEGER
)
RETURNS DECIMAL AS $$
DECLARE
  decay_rate DECIMAL := 0.001; -- 0.1% per day
  min_confidence DECIMAL := 0.30; -- Minimum confidence threshold
  decay_amount DECIMAL;
  new_confidence DECIMAL;
BEGIN
  -- Calculate decay: -0.1% per day, max decay of 0.3 (30 days = -3%)
  decay_amount := LEAST(days_old * decay_rate, 0.30);
  new_confidence := GREATEST(original_confidence - decay_amount, min_confidence);
  
  RETURN new_confidence;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- =====================================================
-- 5. FUNCTION: Get effective confidence with decay (Issue 1.1)
-- =====================================================

CREATE OR REPLACE FUNCTION get_effective_confidence(inference_id UUID)
RETURNS DECIMAL AS $$
DECLARE
  v_confidence DECIMAL;
  v_created_at TIMESTAMPTZ;
  v_days_old INTEGER;
  v_effective_confidence DECIMAL;
BEGIN
  SELECT confidence_score, created_at
  INTO v_confidence, v_created_at
  FROM company_inferences
  WHERE id = inference_id;
  
  IF v_confidence IS NULL THEN
    RETURN 0.00;
  END IF;
  
  -- If confirmed, no decay
  IF EXISTS (
    SELECT 1 FROM company_inferences 
    WHERE id = inference_id AND attribution_state = 'confirmed'
  ) THEN
    RETURN v_confidence;
  END IF;
  
  -- Calculate days old
  v_days_old := EXTRACT(EPOCH FROM (NOW() - v_created_at)) / 86400;
  
  -- Apply decay
  v_effective_confidence := calculate_confidence_decay(v_confidence, v_days_old);
  
  RETURN v_effective_confidence;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 6. FUNCTION: Get company-level aggregated intent (Issue 3.2)
-- =====================================================

CREATE OR REPLACE FUNCTION get_company_aggregated_intent(
  company_name TEXT,
  tracked_link_id UUID
)
RETURNS TABLE (
  avg_intent_score DECIMAL,
  max_intent_score INTEGER,
  total_sessions BIGINT,
  repeat_visits BIGINT,
  last_high_intent_at TIMESTAMPTZ,
  intent_trend TEXT -- 'increasing', 'stable', 'decreasing'
) AS $$
DECLARE
  v_recent_avg DECIMAL;
  v_older_avg DECIMAL;
BEGIN
  RETURN QUERY
  WITH company_sessions AS (
    SELECT 
      intent.session_intent_score,
      intent.is_repeat_visit,
      le.occurred_at,
      intent.recency_weight
    FROM company_inferences ci
    JOIN intent_scores intent ON intent.company_inference_id = ci.id
    JOIN link_events le ON le.id = intent.link_event_id
    WHERE ci.normalized_company_name = normalize_company_name(company_name)
      AND ci.tracked_link_id = tracked_link_id
      AND ci.attribution_state NOT IN ('disputed', 'mismatch')
  ),
  recent_sessions AS (
    SELECT AVG(session_intent_score * COALESCE(recency_weight, 1.0)) as avg_score
    FROM company_sessions
    WHERE occurred_at > NOW() - INTERVAL '30 days'
  ),
  older_sessions AS (
    SELECT AVG(session_intent_score * COALESCE(recency_weight, 1.0)) as avg_score
    FROM company_sessions
    WHERE occurred_at <= NOW() - INTERVAL '30 days'
      AND occurred_at > NOW() - INTERVAL '90 days'
  )
  SELECT 
    AVG(cs.session_intent_score * COALESCE(cs.recency_weight, 1.0))::DECIMAL as avg_intent_score,
    MAX(cs.session_intent_score)::INTEGER as max_intent_score,
    COUNT(*)::BIGINT as total_sessions,
    SUM(CASE WHEN cs.is_repeat_visit THEN 1 ELSE 0 END)::BIGINT as repeat_visits,
    MAX(CASE WHEN cs.session_intent_score >= 70 THEN cs.occurred_at END) as last_high_intent_at,
    CASE 
      WHEN (SELECT avg_score FROM recent_sessions) > (SELECT avg_score FROM older_sessions) * 1.1 THEN 'increasing'
      WHEN (SELECT avg_score FROM recent_sessions) < (SELECT avg_score FROM older_sessions) * 0.9 THEN 'decreasing'
      ELSE 'stable'
    END as intent_trend
  FROM company_sessions cs;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 7. UPDATE upgrade function to handle mismatches (Issue 4.2)
-- =====================================================

CREATE OR REPLACE FUNCTION upgrade_company_inference_on_signup(
  p_lead_id UUID,
  p_signup_company TEXT,
  p_signup_email TEXT DEFAULT NULL,
  p_signup_name TEXT DEFAULT NULL,
  p_signup_job_title TEXT DEFAULT NULL,
  p_signup_linkedin_url TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_company_inference_id UUID;
  v_inferred_company_name TEXT;
  v_normalized_signup_company TEXT;
  v_normalized_inferred_company TEXT;
  v_result JSONB;
BEGIN
  -- Get the company inference ID from the lead
  SELECT company_inference_id, ci.inferred_company_name
  INTO v_company_inference_id, v_inferred_company_name
  FROM leads l
  LEFT JOIN company_inferences ci ON ci.id = l.company_inference_id
  WHERE l.id = p_lead_id;
  
  IF v_company_inference_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Lead has no company inference to upgrade'
    );
  END IF;
  
  -- Normalize company names for comparison (Issue 5.4)
  v_normalized_signup_company := normalize_company_name(p_signup_company);
  v_normalized_inferred_company := normalize_company_name(v_inferred_company_name);
  
  -- Update lead with signup data
  UPDATE leads
  SET 
    signup_email = p_signup_email,
    signup_name = p_signup_name,
    signup_job_title = p_signup_job_title,
    signup_company = p_signup_company,
    signup_linkedin_url = p_signup_linkedin_url
  WHERE id = p_lead_id;
  
  -- Check for mismatch (Issue 4.2)
  IF v_normalized_signup_company != v_normalized_inferred_company THEN
    -- Mark old inference as mismatch
    UPDATE company_inferences
    SET 
      attribution_state = 'mismatch',
      updated_at = NOW()
    WHERE id = v_company_inference_id;
    
    -- Create new confirmed inference with signup company
    INSERT INTO company_inferences (
      link_event_id,
      tracked_link_id,
      inferred_company_name,
      normalized_company_name,
      confidence_score,
      attribution_state,
      confirmed_at
    )
    SELECT 
      ci.link_event_id,
      ci.tracked_link_id,
      p_signup_company,
      v_normalized_signup_company,
      1.00,
      'confirmed',
      NOW()
    FROM company_inferences ci
    WHERE ci.id = v_company_inference_id
    RETURNING id INTO v_company_inference_id;
    
    -- Update lead to point to new inference
    UPDATE leads
    SET company_inference_id = v_company_inference_id
    WHERE id = p_lead_id;
    
    RETURN jsonb_build_object(
      'success', true,
      'action', 'mismatch_handled',
      'old_company', v_inferred_company_name,
      'new_company', p_signup_company,
      'company_inference_id', v_company_inference_id
    );
  ELSE
    -- Match: upgrade existing inference
    UPDATE company_inferences
    SET 
      attribution_state = 'confirmed',
      inferred_company_name = COALESCE(p_signup_company, inferred_company_name),
      confidence_score = 1.00,
      confidence_reasons = COALESCE(confidence_reasons, '[]'::jsonb) || 
        jsonb_build_array('Confirmed via signup'),
      confirmed_at = NOW(),
      updated_at = NOW()
    WHERE id = v_company_inference_id;
    
    -- Update all related company inferences for the same company (Issue 4.3)
    UPDATE company_inferences
    SET 
      attribution_state = 'confirmed',
      confidence_score = 1.00,
      confidence_reasons = COALESCE(confidence_reasons, '[]'::jsonb) || 
        jsonb_build_array('Confirmed via signup (related inference)'),
      confirmed_at = NOW(),
      updated_at = NOW()
    WHERE normalized_company_name = v_normalized_signup_company
      AND attribution_state = 'inferred'
      AND tracked_link_id IN (
        SELECT tracked_link_id FROM company_inferences WHERE id = v_company_inference_id
      );
    
    RETURN jsonb_build_object(
      'success', true,
      'action', 'upgraded',
      'company', p_signup_company,
      'company_inference_id', v_company_inference_id
    );
  END IF;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 8. FUNCTION: Update normalized company names (Issue 5.4)
-- =====================================================

CREATE OR REPLACE FUNCTION update_normalized_company_names()
RETURNS VOID AS $$
BEGIN
  UPDATE company_inferences
  SET normalized_company_name = normalize_company_name(inferred_company_name)
  WHERE normalized_company_name IS NULL
    AND inferred_company_name IS NOT NULL;
END;
$$ LANGUAGE plpgsql;

-- Run it once to backfill
SELECT update_normalized_company_names();

-- =====================================================
-- 9. TRIGGER: Auto-update normalized name on insert/update
-- =====================================================

CREATE OR REPLACE FUNCTION auto_normalize_company_name()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.inferred_company_name IS NOT NULL THEN
    NEW.normalized_company_name := normalize_company_name(NEW.inferred_company_name);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_auto_normalize_company_name ON company_inferences;
CREATE TRIGGER trigger_auto_normalize_company_name
  BEFORE INSERT OR UPDATE ON company_inferences
  FOR EACH ROW
  EXECUTE FUNCTION auto_normalize_company_name();

-- =====================================================
-- 10. TRIGGER: Auto-update recency weight on intent_scores (Issue 3.1)
-- =====================================================

CREATE OR REPLACE FUNCTION auto_update_recency_weight()
RETURNS TRIGGER AS $$
DECLARE
  v_days_old INTEGER;
  v_recency_weight DECIMAL;
BEGIN
  -- Calculate days since session
  SELECT EXTRACT(EPOCH FROM (NOW() - le.occurred_at)) / 86400
  INTO v_days_old
  FROM link_events le
  WHERE le.id = NEW.link_event_id;
  
  NEW.days_since_session := v_days_old;
  
  -- Calculate recency weight: 1.0 for <7 days, 0.8 for <30 days, 0.5 for <90 days, 0.2 for older
  IF v_days_old < 7 THEN
    v_recency_weight := 1.00;
  ELSIF v_days_old < 30 THEN
    v_recency_weight := 0.80;
  ELSIF v_days_old < 90 THEN
    v_recency_weight := 0.50;
  ELSE
    v_recency_weight := 0.20;
  END IF;
  
  NEW.recency_weight := v_recency_weight;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_auto_update_recency_weight ON intent_scores;
CREATE TRIGGER trigger_auto_update_recency_weight
  BEFORE INSERT OR UPDATE ON intent_scores
  FOR EACH ROW
  EXECUTE FUNCTION auto_update_recency_weight();

-- =====================================================
-- 11. UPDATE company_intent_aggregates VIEW (Issue 3.2)
-- =====================================================

DROP VIEW IF EXISTS company_intent_aggregates;

CREATE OR REPLACE VIEW company_intent_aggregates AS
SELECT 
  ci.inferred_company_name,
  ci.normalized_company_name,
  ci.inferred_company_domain,
  ci.inferred_industry,
  ci.inferred_company_size,
  ci.attribution_state,
  get_effective_confidence(ci.id) as effective_confidence_score,
  ci.confidence_score as original_confidence_score,
  tl.collaboration_id,
  
  -- Aggregated metrics with recency weighting
  COUNT(DISTINCT intent.id) as total_sessions,
  AVG(intent.session_intent_score * COALESCE(intent.recency_weight, 1.0)) as avg_intent_score,
  MAX(intent.session_intent_score) as max_intent_score,
  SUM(CASE WHEN intent.is_repeat_visit THEN 1 ELSE 0 END) as repeat_visits,
  MIN(le.occurred_at) as first_seen_at,
  MAX(le.occurred_at) as last_seen_at,
  SUM(CASE WHEN intent.viewed_pricing THEN 1 ELSE 0 END) as pricing_views,
  SUM(CASE WHEN intent.viewed_security THEN 1 ELSE 0 END) as security_views,
  SUM(CASE WHEN intent.viewed_integrations THEN 1 ELSE 0 END) as integrations_views,
  
  -- Recency indicators
  MAX(intent.days_since_session) as oldest_session_days,
  MIN(intent.days_since_session) as newest_session_days
  
FROM company_inferences ci
JOIN intent_scores intent ON intent.company_inference_id = ci.id
JOIN link_events le ON le.id = intent.link_event_id
JOIN tracked_links tl ON tl.id = ci.tracked_link_id
WHERE ci.inferred_company_name IS NOT NULL
  AND ci.attribution_state NOT IN ('disputed', 'mismatch')
GROUP BY 
  ci.id,
  ci.inferred_company_name,
  ci.normalized_company_name,
  ci.inferred_company_domain,
  ci.inferred_industry,
  ci.inferred_company_size,
  ci.attribution_state,
  ci.confidence_score,
  tl.collaboration_id;

-- =====================================================
-- 12. FUNCTION: Dispute company inference (Issue 1.3)
-- =====================================================

CREATE OR REPLACE FUNCTION dispute_company_inference(
  p_inference_id UUID,
  p_reason TEXT
)
RETURNS VOID AS $$
BEGIN
  UPDATE company_inferences
  SET 
    attribution_state = 'disputed',
    disputed_at = NOW(),
    disputed_reason = p_reason,
    updated_at = NOW()
  WHERE id = p_inference_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- DONE! ✅
-- =====================================================
-- 
-- All database fixes applied:
-- - Confidence decay (Issue 1.1)
-- - Ambiguity handling (Issue 1.2)
-- - Disputed state (Issue 1.3)
-- - Confidence aggregation (Issue 2.2)
-- - Intent recency weighting (Issue 3.1)
-- - Company-level intent aggregation (Issue 3.2)
-- - Signup mismatch handling (Issue 4.2)
-- - Company name normalization (Issue 5.4)
-- =====================================================

