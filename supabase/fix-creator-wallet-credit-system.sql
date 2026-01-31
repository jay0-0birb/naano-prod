-- =====================================================
-- FIX: Creator earnings move to available immediately
-- =====================================================
-- In credit system, SaaS prepays with credits. So when a
-- qualified click happens, creator earnings should go to
-- "available" immediately (not stay in "pending" forever).
-- Without this, creators could never withdraw.
-- =====================================================

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
    false
  ) RETURNING id INTO v_lead_id;
  
  -- Deduct credit (this also creates transaction and marks lead)
  v_credit_deducted := deduct_saas_credit(p_saas_id, v_lead_id);
  
  IF NOT v_credit_deducted THEN
    DELETE FROM public.leads WHERE id = v_lead_id;
    RAISE EXCEPTION 'Failed to deduct credit. Lead creation cancelled.';
  END IF;
  
  -- Update creator wallet: add to pending, then immediately move to available
  -- (SaaS prepaid with credits, so creator earnings are immediately available)
  PERFORM public.increment_creator_wallet_pending(p_creator_id, v_creator_payout);
  PERFORM public.move_wallet_pending_to_available(p_creator_id, v_creator_payout);
  
  RETURN v_lead_id;
END;
$$ LANGUAGE plpgsql;
