-- =====================================================
-- THREE-LAYER ATTRIBUTION & INTENT SYSTEM
-- =====================================================
-- Layer 1: Session Intelligence (Deterministic)
-- Layer 2: Company Inference (Probabilistic)
-- Layer 3: Behavioral Intent Scoring
-- =====================================================

-- =====================================================
-- 1. ENHANCE link_events WITH SESSION INTELLIGENCE
-- =====================================================

-- Add network classification
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'link_events' AND column_name = 'network_type'
  ) THEN
    ALTER TABLE link_events 
    ADD COLUMN network_type TEXT CHECK (network_type IN ('corporate', 'residential', 'mobile', 'hosting', 'vpn', 'proxy', 'unknown'));
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'link_events' AND column_name = 'device_type'
  ) THEN
    ALTER TABLE link_events 
    ADD COLUMN device_type TEXT CHECK (device_type IN ('desktop', 'mobile', 'tablet', 'unknown'));
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'link_events' AND column_name = 'os'
  ) THEN
    ALTER TABLE link_events 
    ADD COLUMN os TEXT; -- e.g., 'Windows', 'macOS', 'iOS', 'Android'
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'link_events' AND column_name = 'browser'
  ) THEN
    ALTER TABLE link_events 
    ADD COLUMN browser TEXT; -- e.g., 'Chrome', 'Safari', 'Firefox'
  END IF;
END $$;

-- =====================================================
-- 2. CREATE COMPANY INFERENCE TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS company_inferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  link_event_id UUID NOT NULL REFERENCES link_events(id) ON DELETE CASCADE,
  tracked_link_id UUID NOT NULL REFERENCES tracked_links(id) ON DELETE CASCADE,
  
  -- Inferred company data (probabilistic)
  inferred_company_name TEXT,
  inferred_company_domain TEXT,
  inferred_industry TEXT,
  inferred_company_size TEXT, -- e.g., '1-10', '11-50', '51-200', '201-500', '501-1000', '1000+'
  inferred_location TEXT, -- City, Country
  
  -- Confidence and reasoning
  confidence_score DECIMAL(3, 2) CHECK (confidence_score >= 0 AND confidence_score <= 1), -- 0.00 to 1.00
  confidence_reasons JSONB, -- Array of reasons: ["corporate ASN", "EU office IP range", "weekday working hours"]
  
  -- Network classification details
  asn_number TEXT,
  asn_organization TEXT,
  is_hosting BOOLEAN DEFAULT false,
  is_vpn BOOLEAN DEFAULT false,
  is_proxy BOOLEAN DEFAULT false,
  is_mobile_isp BOOLEAN DEFAULT false,
  
  -- Attribution state
  attribution_state TEXT NOT NULL DEFAULT 'inferred' CHECK (attribution_state IN ('inferred', 'confirmed')),
  confirmed_at TIMESTAMPTZ, -- When signup confirmed the company
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for company inference
CREATE INDEX IF NOT EXISTS idx_company_inferences_link_event_id ON company_inferences(link_event_id);
CREATE INDEX IF NOT EXISTS idx_company_inferences_tracked_link_id ON company_inferences(tracked_link_id);
CREATE INDEX IF NOT EXISTS idx_company_inferences_inferred_company_name ON company_inferences(inferred_company_name);
CREATE INDEX IF NOT EXISTS idx_company_inferences_confidence_score ON company_inferences(confidence_score);
CREATE INDEX IF NOT EXISTS idx_company_inferences_attribution_state ON company_inferences(attribution_state);

-- =====================================================
-- 3. CREATE BEHAVIORAL INTENT SCORING TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS intent_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  link_event_id UUID NOT NULL REFERENCES link_events(id) ON DELETE CASCADE,
  tracked_link_id UUID NOT NULL REFERENCES tracked_links(id) ON DELETE CASCADE,
  company_inference_id UUID REFERENCES company_inferences(id) ON DELETE SET NULL,
  
  -- Session-level intent score (0-100)
  session_intent_score INTEGER CHECK (session_intent_score >= 0 AND session_intent_score <= 100),
  
  -- Intent signals (deterministic)
  pages_viewed TEXT[], -- Array of page paths viewed
  time_on_site_seconds INTEGER,
  is_working_hours BOOLEAN, -- Based on time of day and timezone
  is_repeat_visit BOOLEAN DEFAULT false, -- Same company/IP visited before
  days_since_first_visit INTEGER, -- If repeat visit
  visit_count INTEGER DEFAULT 1, -- Number of visits from this company/IP
  
  -- Behavioral signals
  viewed_pricing BOOLEAN DEFAULT false,
  viewed_security BOOLEAN DEFAULT false,
  viewed_docs BOOLEAN DEFAULT false,
  viewed_integrations BOOLEAN DEFAULT false,
  viewed_blog BOOLEAN DEFAULT false,
  download_count INTEGER DEFAULT 0,
  scroll_depth_percent INTEGER, -- 0-100
  
  -- Intent calculation metadata
  intent_signals JSONB, -- Detailed breakdown of signals used
  calculated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for intent scoring
CREATE INDEX IF NOT EXISTS idx_intent_scores_link_event_id ON intent_scores(link_event_id);
CREATE INDEX IF NOT EXISTS idx_intent_scores_tracked_link_id ON intent_scores(tracked_link_id);
CREATE INDEX IF NOT EXISTS idx_intent_scores_company_inference_id ON intent_scores(company_inference_id);
CREATE INDEX IF NOT EXISTS idx_intent_scores_session_intent_score ON intent_scores(session_intent_score);
CREATE INDEX IF NOT EXISTS idx_intent_scores_is_repeat_visit ON intent_scores(is_repeat_visit);

-- =====================================================
-- 4. CREATE COMPANY-LEVEL AGGREGATION VIEW
-- =====================================================

-- Drop existing view if it exists (in case it was created with old alias)
-- Use CASCADE to handle any dependencies, and wrap in DO block to handle errors
DO $$ 
BEGIN
  -- Try to drop the view, ignore errors if it doesn't exist or has syntax issues
  BEGIN
    DROP VIEW IF EXISTS company_intent_aggregates CASCADE;
  EXCEPTION WHEN OTHERS THEN
    -- If drop fails (e.g., view has syntax errors), try to force drop
    NULL;
  END;
END $$;

-- View for company-level intent aggregation
CREATE VIEW company_intent_aggregates AS
SELECT 
  ci.inferred_company_name,
  ci.inferred_company_domain,
  ci.inferred_industry,
  ci.inferred_company_size,
  ci.attribution_state,
  ci.confidence_score,
  tl.collaboration_id,
  
  -- Aggregated metrics
  COUNT(DISTINCT intent.id) as total_sessions,
  AVG(intent.session_intent_score) as avg_intent_score,
  MAX(intent.session_intent_score) as max_intent_score,
  SUM(CASE WHEN intent.is_repeat_visit THEN 1 ELSE 0 END) as repeat_visits,
  MIN(le.occurred_at) as first_seen_at,
  MAX(le.occurred_at) as last_seen_at,
  SUM(CASE WHEN intent.viewed_pricing THEN 1 ELSE 0 END) as pricing_views,
  SUM(CASE WHEN intent.viewed_security THEN 1 ELSE 0 END) as security_views,
  SUM(CASE WHEN intent.viewed_integrations THEN 1 ELSE 0 END) as integrations_views
  
FROM company_inferences ci
JOIN intent_scores intent ON intent.company_inference_id = ci.id
JOIN link_events le ON le.id = intent.link_event_id
JOIN tracked_links tl ON tl.id = ci.tracked_link_id
WHERE ci.inferred_company_name IS NOT NULL
GROUP BY 
  ci.inferred_company_name,
  ci.inferred_company_domain,
  ci.inferred_industry,
  ci.inferred_company_size,
  ci.attribution_state,
  ci.confidence_score,
  tl.collaboration_id;

-- =====================================================
-- 5. ADD SIGNUP UPGRADE SUPPORT TO leads TABLE
-- =====================================================

-- Add fields to link signup to session/company inference
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'leads' AND column_name = 'link_event_id'
  ) THEN
    ALTER TABLE leads 
    ADD COLUMN link_event_id UUID REFERENCES link_events(id);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'leads' AND column_name = 'company_inference_id'
  ) THEN
    ALTER TABLE leads 
    ADD COLUMN company_inference_id UUID REFERENCES company_inferences(id);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'leads' AND column_name = 'signup_email'
  ) THEN
    ALTER TABLE leads 
    ADD COLUMN signup_email TEXT; -- Email from signup (confirms identity)
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'leads' AND column_name = 'signup_name'
  ) THEN
    ALTER TABLE leads 
    ADD COLUMN signup_name TEXT; -- Name from signup
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'leads' AND column_name = 'signup_job_title'
  ) THEN
    ALTER TABLE leads 
    ADD COLUMN signup_job_title TEXT; -- Job title from signup
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'leads' AND column_name = 'signup_company'
  ) THEN
    ALTER TABLE leads 
    ADD COLUMN signup_company TEXT; -- Company from signup (confirms company inference)
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'leads' AND column_name = 'signup_linkedin_url'
  ) THEN
    ALTER TABLE leads 
    ADD COLUMN signup_linkedin_url TEXT; -- LinkedIn URL if provided
  END IF;
END $$;

-- =====================================================
-- 6. FUNCTION: Upgrade company inference on signup
-- =====================================================

CREATE OR REPLACE FUNCTION upgrade_company_inference_on_signup(
  p_lead_id UUID,
  p_signup_company TEXT,
  p_signup_email TEXT DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
  v_company_inference_id UUID;
BEGIN
  -- Get the company inference ID from the lead
  SELECT company_inference_id INTO v_company_inference_id
  FROM leads
  WHERE id = p_lead_id;
  
  IF v_company_inference_id IS NULL THEN
    RAISE NOTICE 'Lead % has no company inference to upgrade', p_lead_id;
    RETURN;
  END IF;
  
  -- Update company inference to confirmed
  UPDATE company_inferences
  SET 
    attribution_state = 'confirmed',
    inferred_company_name = COALESCE(p_signup_company, inferred_company_name),
    confidence_score = 1.00, -- 100% confidence after signup
    confirmed_at = NOW(),
    updated_at = NOW()
  WHERE id = v_company_inference_id;
  
  -- Update all related company inferences for the same company (if same domain/IP)
  -- This upgrades historical inferences when we get confirmation
  UPDATE company_inferences
  SET 
    attribution_state = 'confirmed',
    confidence_score = 1.00,
    confirmed_at = NOW(),
    updated_at = NOW()
  WHERE inferred_company_name = p_signup_company
    AND attribution_state = 'inferred'
    AND tracked_link_id IN (
      SELECT tracked_link_id FROM company_inferences WHERE id = v_company_inference_id
    );
  
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 7. ENABLE ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE company_inferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE intent_scores ENABLE ROW LEVEL SECURITY;

-- RLS: Users can view company inferences for their collaborations
DROP POLICY IF EXISTS "Users can view company inferences for their collaborations" ON company_inferences;
CREATE POLICY "Users can view company inferences for their collaborations"
  ON company_inferences FOR SELECT
  USING (
    tracked_link_id IN (
      SELECT tl.id FROM tracked_links tl
      JOIN collaborations c ON c.id = tl.collaboration_id
      JOIN applications a ON a.id = c.application_id
      JOIN creator_profiles cp ON cp.id = a.creator_id
      WHERE cp.profile_id = auth.uid()
    )
    OR
    tracked_link_id IN (
      SELECT tl.id FROM tracked_links tl
      JOIN collaborations c ON c.id = tl.collaboration_id
      JOIN applications a ON a.id = c.application_id
      JOIN saas_companies sc ON sc.id = a.saas_id
      WHERE sc.profile_id = auth.uid()
    )
  );

-- RLS: System can create company inferences
DROP POLICY IF EXISTS "System can create company inferences" ON company_inferences;
CREATE POLICY "System can create company inferences"
  ON company_inferences FOR INSERT
  WITH CHECK (true);

-- RLS: Users can view intent scores for their collaborations
DROP POLICY IF EXISTS "Users can view intent scores for their collaborations" ON intent_scores;
CREATE POLICY "Users can view intent scores for their collaborations"
  ON intent_scores FOR SELECT
  USING (
    tracked_link_id IN (
      SELECT tl.id FROM tracked_links tl
      JOIN collaborations c ON c.id = tl.collaboration_id
      JOIN applications a ON a.id = c.application_id
      JOIN creator_profiles cp ON cp.id = a.creator_id
      WHERE cp.profile_id = auth.uid()
    )
    OR
    tracked_link_id IN (
      SELECT tl.id FROM tracked_links tl
      JOIN collaborations c ON c.id = tl.collaboration_id
      JOIN applications a ON a.id = c.application_id
      JOIN saas_companies sc ON sc.id = a.saas_id
      WHERE sc.profile_id = auth.uid()
    )
  );

-- RLS: System can create intent scores
DROP POLICY IF EXISTS "System can create intent scores" ON intent_scores;
CREATE POLICY "System can create intent scores"
  ON intent_scores FOR INSERT
  WITH CHECK (true);

-- =====================================================
-- DONE! ✅
-- =====================================================
-- 
-- Tables created:
-- - company_inferences (Layer 2: Probabilistic company identification)
-- - intent_scores (Layer 3: Behavioral intent scoring)
-- 
-- Views created:
-- - company_intent_aggregates (Company-level intent aggregation)
-- 
-- Functions created:
-- - upgrade_company_inference_on_signup() (Upgrade inferred → confirmed)
-- 
-- Next: Implement IP enrichment service and intent scoring logic
-- =====================================================

