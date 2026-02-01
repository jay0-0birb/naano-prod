-- =====================================================
-- QUALIFIED LEAD ONLY - Option A
-- =====================================================
-- Leads (credit deduction, creator payout) are created ONLY for qualified clicks:
-- 1. Not a bot (user_agent check)
-- 2. 3-second rule (time_on_site >= 3)
-- 3. Deduplication: only 1 lead per (tracked_link, IP, hour)
--
-- Run AFTER: analytics-qualified-clicks.sql (is_bot_user_agent, get_qualified_clicks)
-- =====================================================

-- 1. Add link_event_id to leads if not exists (links lead to specific click)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'leads' AND column_name = 'link_event_id'
  ) THEN
    ALTER TABLE public.leads 
    ADD COLUMN link_event_id UUID REFERENCES link_events(id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_leads_link_event_id ON public.leads(link_event_id) WHERE link_event_id IS NOT NULL;

-- 2. Create function: create lead ONLY when click is qualified
CREATE OR REPLACE FUNCTION create_qualified_lead_from_event(p_link_event_id UUID)
RETURNS UUID AS $$
DECLARE
  v_link_event RECORD;
  v_tracked_link RECORD;
  v_creator_id UUID;
  v_saas_id UUID;
  v_current_credits INTEGER;
  v_creator_payout DECIMAL(10, 2);
  v_lead_id UUID;
  v_credit_deducted BOOLEAN;
  v_hour_bucket TIMESTAMPTZ;
  v_existing_lead_id UUID;
BEGIN
  -- Get link_event with required fields
  SELECT le.id, le.tracked_link_id, le.ip_address, le.user_agent, le.time_on_site, le.occurred_at
  INTO v_link_event
  FROM link_events le
  WHERE le.id = p_link_event_id
    AND le.event_type = 'click';
  
  IF v_link_event.id IS NULL THEN
    RAISE EXCEPTION 'Link event not found or not a click: %', p_link_event_id;
  END IF;
  
  -- Qualification 1: Not a bot
  IF is_bot_user_agent(v_link_event.user_agent) THEN
    RETURN NULL;
  END IF;
  
  -- Qualification 2: 3-second rule
  IF v_link_event.time_on_site IS NULL OR v_link_event.time_on_site < 3 THEN
    RETURN NULL;
  END IF;
  
  -- Get collaboration (creator_id, saas_id)
  SELECT tl.id, tl.collaboration_id
  INTO v_tracked_link
  FROM tracked_links tl
  WHERE tl.id = v_link_event.tracked_link_id;
  
  SELECT a.creator_id, a.saas_id
  INTO v_creator_id, v_saas_id
  FROM collaborations c
  JOIN applications a ON a.id = c.application_id
  WHERE c.id = v_tracked_link.collaboration_id;
  
  IF v_creator_id IS NULL OR v_saas_id IS NULL THEN
    RAISE EXCEPTION 'Could not resolve creator/saas for collaboration %', v_tracked_link.collaboration_id;
  END IF;
  
  -- Qualification 3: Deduplication - only 1 lead per (tracked_link, IP, hour)
  -- Check if a lead already exists for a qualified click from this IP in this hour
  v_hour_bucket := date_trunc('hour', v_link_event.occurred_at);
  
  SELECT l.id INTO v_existing_lead_id
  FROM leads l
  JOIN link_events le ON le.id = l.link_event_id
  WHERE l.tracked_link_id = v_link_event.tracked_link_id
    AND l.link_event_id IS NOT NULL
    AND le.ip_address = v_link_event.ip_address
    AND date_trunc('hour', le.occurred_at) = v_hour_bucket
  LIMIT 1;
  
  IF v_existing_lead_id IS NOT NULL THEN
    RETURN NULL;
  END IF;
  
  -- Check SaaS has credits
  SELECT wallet_credits INTO v_current_credits
  FROM public.saas_companies
  WHERE id = v_saas_id;
  
  IF v_current_credits IS NULL OR v_current_credits <= 0 THEN
    RETURN NULL;
  END IF;
  
  -- Create lead
  v_creator_payout := get_creator_payout_amount(v_creator_id);
  
  INSERT INTO public.leads (
    tracked_link_id,
    creator_id,
    saas_id,
    link_event_id,
    creator_payout_amount,
    status,
    validated_at,
    credits_deducted
  ) VALUES (
    v_link_event.tracked_link_id,
    v_creator_id,
    v_saas_id,
    p_link_event_id,
    v_creator_payout,
    'validated',
    NOW(),
    false
  ) RETURNING id INTO v_lead_id;
  
  -- Deduct credit
  v_credit_deducted := deduct_saas_credit(v_saas_id, v_lead_id);
  
  IF NOT v_credit_deducted THEN
    DELETE FROM public.leads WHERE id = v_lead_id;
    RAISE EXCEPTION 'Failed to deduct credit';
  END IF;
  
  -- Pay creator
  PERFORM public.increment_creator_wallet_pending(v_creator_id, v_creator_payout);
  PERFORM public.move_wallet_pending_to_available(v_creator_id, v_creator_payout);
  
  RETURN v_lead_id;
END;
$$ LANGUAGE plpgsql;

-- 3. Update get_collaboration_analytics to use creator_payout_amount when lead_value is null (credit system)
CREATE OR REPLACE FUNCTION get_collaboration_analytics(collab_id UUID)
RETURNS TABLE(
  total_impressions BIGINT,
  total_clicks BIGINT,
  qualified_clicks BIGINT,
  leads_count BIGINT,
  total_lead_cost DECIMAL,
  savings_vs_linkedin DECIMAL
) AS $$
DECLARE
  v_impressions BIGINT;
  v_total_clicks BIGINT;
  v_qualified_clicks BIGINT;
  v_leads_count BIGINT;
  v_total_lead_cost DECIMAL;
  v_savings DECIMAL;
  linkedin_cost_per_click DECIMAL := 8.00;
BEGIN
  SELECT COUNT(*) INTO v_impressions
  FROM link_events le
  JOIN tracked_links tl ON tl.id = le.tracked_link_id
  WHERE tl.collaboration_id = collab_id
    AND le.event_type = 'impression';
  
  SELECT COUNT(*) INTO v_total_clicks
  FROM link_events le
  JOIN tracked_links tl ON tl.id = le.tracked_link_id
  WHERE tl.collaboration_id = collab_id
    AND le.event_type = 'click';
  
  SELECT get_qualified_clicks(collab_id) INTO v_qualified_clicks;
  
  SELECT 
    COUNT(*),
    COALESCE(SUM(COALESCE(l.lead_value, l.creator_payout_amount)), 0)
  INTO v_leads_count, v_total_lead_cost
  FROM leads l
  JOIN tracked_links tl ON tl.id = l.tracked_link_id
  WHERE tl.collaboration_id = collab_id
    AND l.status IN ('validated', 'billed');
  
  v_savings := (v_qualified_clicks * linkedin_cost_per_click) - COALESCE(v_total_lead_cost, 0);
  
  RETURN QUERY SELECT 
    COALESCE(v_impressions, 0),
    COALESCE(v_total_clicks, 0),
    COALESCE(v_qualified_clicks, 0),
    COALESCE(v_leads_count, 0),
    COALESCE(v_total_lead_cost, 0),
    COALESCE(v_savings, 0);
END;
$$ LANGUAGE plpgsql;
