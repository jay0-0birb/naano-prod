-- =====================================================
-- BP1 BILLING & PAYOUT FUNCTIONS
-- =====================================================
-- Threshold billing and payout logic
-- =====================================================

-- =====================================================
-- BILLING FUNCTIONS
-- =====================================================

-- Check if SaaS should be billed (threshold or month-end)
CREATE OR REPLACE FUNCTION public.should_bill_saas(p_saas_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_debt RECORD;
  v_current_date DATE := CURRENT_DATE;
  v_month_end DATE;
BEGIN
  -- Get current debt
  SELECT current_debt, next_billing_date INTO v_debt
  FROM public.saas_billing_debt
  WHERE saas_id = p_saas_id;
  
  IF v_debt IS NULL THEN
    RETURN false;
  END IF;
  
  -- Check threshold (€100)
  IF v_debt.current_debt >= 100.00 THEN
    RETURN true;
  END IF;
  
  -- Check month-end
  IF v_debt.next_billing_date IS NOT NULL AND v_current_date >= v_debt.next_billing_date THEN
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$ LANGUAGE plpgsql;

-- Generate invoice number
CREATE OR REPLACE FUNCTION public.generate_invoice_number()
RETURNS TEXT AS $$
DECLARE
  v_year TEXT := TO_CHAR(NOW(), 'YYYY');
  v_month TEXT := TO_CHAR(NOW(), 'MM');
  v_sequence INTEGER;
BEGIN
  -- Get next sequence for this month
  SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM '\d+$') AS INTEGER)), 0) + 1
  INTO v_sequence
  FROM public.billing_invoices
  WHERE invoice_number LIKE 'INV-' || v_year || v_month || '-%';
  
  RETURN 'INV-' || v_year || v_month || '-' || LPAD(v_sequence::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- Bill SaaS (create invoice and charge)
CREATE OR REPLACE FUNCTION public.bill_saas(p_saas_id UUID)
RETURNS UUID AS $$
DECLARE
  v_debt RECORD;
  v_total_ht DECIMAL(10, 2) := 0.00;
  v_leads_count INTEGER := 0;
  v_invoice_id UUID;
  v_invoice_number TEXT;
  v_stripe_fees DECIMAL(10, 2);
  v_naano_received DECIMAL(10, 2);
  v_talent_total DECIMAL(10, 2) := 0.00;
  v_tech_total DECIMAL(10, 2) := 0.00;
  v_tva_amount DECIMAL(10, 2);
  v_total_ttc DECIMAL(10, 2);
  v_lead RECORD;
BEGIN
  -- Get debt and pending leads
  SELECT current_debt INTO v_debt
  FROM public.saas_billing_debt
  WHERE saas_id = p_saas_id;
  
  IF v_debt IS NULL OR v_debt.current_debt <= 0 THEN
    RAISE EXCEPTION 'No debt to bill for SaaS: %', p_saas_id;
  END IF;
  
  -- Check if there are pending leads
  SELECT COUNT(*) INTO v_leads_count
  FROM public.leads l
  WHERE l.saas_id = p_saas_id
    AND l.status = 'validated';
  
  IF v_leads_count = 0 THEN
    RAISE EXCEPTION 'No pending leads to bill for SaaS: %', p_saas_id;
  END IF;
  
  -- Calculate totals by iterating through leads directly
  FOR v_lead IN 
    SELECT lead_value, creator_earnings, naano_margin_brut
    FROM public.leads
    WHERE saas_id = p_saas_id
      AND status = 'validated'
  LOOP
    v_total_ht := v_total_ht + v_lead.lead_value;
    v_talent_total := v_talent_total + v_lead.creator_earnings;
    v_tech_total := v_tech_total + v_lead.naano_margin_brut;
  END LOOP;
  
  -- Calculate Stripe fees
  v_stripe_fees := public.calculate_stripe_fees(v_total_ht);
  v_naano_received := v_total_ht - v_stripe_fees;
  
  -- Calculate TVA (20% on tech fee only)
  v_tva_amount := ROUND((v_tech_total * 0.20)::numeric, 2);
  v_total_ttc := v_total_ht + v_tva_amount;
  
  -- Generate invoice number
  v_invoice_number := public.generate_invoice_number();
  
  -- Create invoice
  INSERT INTO public.billing_invoices (
    saas_id,
    invoice_number,
    amount_ht,
    amount_ttc,
    stripe_fee_amount,
    naano_received_amount,
    leads_count,
    period_start,
    period_end,
    status
  ) VALUES (
    p_saas_id,
    v_invoice_number,
    v_total_ht,
    v_total_ttc,
    v_stripe_fees,
    v_naano_received,
    v_leads_count,
    date_trunc('month', NOW()),
    (date_trunc('month', NOW()) + interval '1 month'),
    'draft' -- Will be updated to 'paid' after Stripe charge succeeds
  ) RETURNING id INTO v_invoice_id;
  
  -- Create invoice line items
  -- Line 1: Talent (TVA 0%)
  INSERT INTO public.invoice_line_items (
    invoice_id,
    line_type,
    description,
    amount_ht,
    tva_rate,
    tva_amount,
    amount_ttc,
    quantity,
    unit_price
  ) VALUES (
    v_invoice_id,
    'talent',
    'Part Talent - ' || v_leads_count || ' leads',
    v_talent_total,
    0.00,
    0.00,
    v_talent_total,
    v_leads_count,
    1.20
  );
  
  -- Line 2: Tech Fee (TVA 20%)
  INSERT INTO public.invoice_line_items (
    invoice_id,
    line_type,
    description,
    amount_ht,
    tva_rate,
    tva_amount,
    amount_ttc,
    quantity,
    unit_price
  ) VALUES (
    v_invoice_id,
    'tech_fee',
    'Frais Tech Naano - ' || v_leads_count || ' leads',
    v_tech_total,
    20.00,
    v_tva_amount,
    v_tech_total + v_tva_amount,
    v_leads_count,
    v_tech_total / v_leads_count
  );
  
  -- Update leads status and link to invoice
  UPDATE public.leads
  SET
    status = 'billed',
    billed_at = NOW(),
    billing_invoice_id = v_invoice_id
  WHERE saas_id = p_saas_id
    AND status = 'validated';
  
  -- Move creator wallets from pending to available
  -- Group by creator to sum amounts
  FOR v_lead IN SELECT DISTINCT creator_id, SUM(creator_earnings) as total_earnings
    FROM public.leads
    WHERE saas_id = p_saas_id
      AND billing_invoice_id = v_invoice_id
    GROUP BY creator_id
  LOOP
    PERFORM public.move_wallet_pending_to_available(v_lead.creator_id, v_lead.total_earnings);
  END LOOP;
  
  -- Reset SaaS debt
  UPDATE public.saas_billing_debt
  SET
    current_debt = 0.00,
    last_billed_at = NOW(),
    next_billing_date = public.get_next_billing_date(),
    updated_at = NOW()
  WHERE saas_id = p_saas_id;
  
  RETURN v_invoice_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- PAYOUT FUNCTIONS
-- =====================================================

-- Check if creator can request payout (≥€50 available)
CREATE OR REPLACE FUNCTION public.can_creator_payout(p_creator_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_available DECIMAL(10, 2);
BEGIN
  SELECT available_balance INTO v_available
  FROM public.creator_wallets
  WHERE creator_id = p_creator_id;
  
  RETURN COALESCE(v_available, 0) >= 50.00;
END;
$$ LANGUAGE plpgsql;

-- Generate creator invoice/receipt number
CREATE OR REPLACE FUNCTION public.generate_creator_invoice_number()
RETURNS TEXT AS $$
DECLARE
  v_year TEXT := TO_CHAR(NOW(), 'YYYY');
  v_month TEXT := TO_CHAR(NOW(), 'MM');
  v_sequence INTEGER;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM '\d+$') AS INTEGER)), 0) + 1
  INTO v_sequence
  FROM public.creator_invoices
  WHERE invoice_number LIKE 'CRE-' || v_year || v_month || '-%';
  
  RETURN 'CRE-' || v_year || v_month || '-' || LPAD(v_sequence::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- Create payout and invoice for creator
CREATE OR REPLACE FUNCTION public.create_creator_payout(
  p_creator_id UUID,
  p_amount DECIMAL,
  p_stripe_account_id TEXT
)
RETURNS UUID AS $$
DECLARE
  v_available DECIMAL(10, 2);
  v_payout_id UUID;
  v_invoice_id UUID;
  v_invoice_number TEXT;
  v_document_type TEXT;
  v_has_siret BOOLEAN;
  v_is_tva_assujetti BOOLEAN := false;
  v_tva_rate DECIMAL(5, 2) := 0.00;
  v_tva_amount DECIMAL(10, 2) := 0.00;
  v_leads_count INTEGER;
BEGIN
  -- Check available balance
  SELECT available_balance INTO v_available
  FROM public.creator_wallets
  WHERE creator_id = p_creator_id;
  
  IF v_available < p_amount THEN
    RAISE EXCEPTION 'Insufficient available balance. Available: %, Requested: %', v_available, p_amount;
  END IF;
  
  -- Check if creator has SIRET (determines document type) and TVA status
  SELECT 
    siret IS NOT NULL, 
    COALESCE(tva_assujetti, false) 
  INTO v_has_siret, v_is_tva_assujetti
  FROM public.creator_profiles
  WHERE id = p_creator_id;
  
  -- Determine document type
  IF v_has_siret THEN
    v_document_type := 'facture';
    -- If creator is assujetti, add 20% TVA
    IF v_is_tva_assujetti THEN
      v_tva_rate := 20.00;
      v_tva_amount := ROUND((p_amount * 0.20)::numeric, 2);
    END IF;
  ELSE
    v_document_type := 'releve';
    v_tva_rate := 0.00;
    v_tva_amount := 0.00;
  END IF;
  
  -- Calculate leads count (approximate: amount / 1.20)
  v_leads_count := FLOOR(p_amount / 1.20)::INTEGER;
  
  -- Generate invoice number
  v_invoice_number := public.generate_creator_invoice_number();
  
  -- Create payout record
  INSERT INTO public.creator_payouts (
    creator_id,
    amount,
    stripe_account_id,
    status
  ) VALUES (
    p_creator_id,
    p_amount,
    p_stripe_account_id,
    'pending'
  ) RETURNING id INTO v_payout_id;
  
  -- Create creator invoice/receipt
  INSERT INTO public.creator_invoices (
    creator_id,
    payout_id,
    invoice_number,
    document_type,
    amount_ht,
    tva_rate,
    tva_amount,
    amount_ttc,
    leads_count
  ) VALUES (
    p_creator_id,
    v_payout_id,
    v_invoice_number,
    v_document_type,
    p_amount,
    v_tva_rate,
    v_tva_amount,
    p_amount + v_tva_amount,
    v_leads_count
  ) RETURNING id INTO v_invoice_id;
  
  -- Update wallet (deduct from available)
  UPDATE public.creator_wallets
  SET
    available_balance = available_balance - p_amount,
    updated_at = NOW()
  WHERE creator_id = p_creator_id;
  
  RETURN v_payout_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- HELPER FUNCTIONS FOR CHECKING BILLING TRIGGERS
-- =====================================================

-- Check all SaaS that should be billed
CREATE OR REPLACE FUNCTION public.get_saas_to_bill()
RETURNS TABLE(saas_id UUID, current_debt DECIMAL, should_bill BOOLEAN) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sbd.saas_id,
    sbd.current_debt,
    public.should_bill_saas(sbd.saas_id) as should_bill
  FROM public.saas_billing_debt sbd
  WHERE sbd.current_debt > 0
    AND public.should_bill_saas(sbd.saas_id) = true;
END;
$$ LANGUAGE plpgsql;

-- Check all creators that can request payout
CREATE OR REPLACE FUNCTION public.get_creators_ready_for_payout()
RETURNS TABLE(creator_id UUID, available_balance DECIMAL) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cw.creator_id,
    cw.available_balance
  FROM public.creator_wallets cw
  WHERE cw.available_balance >= 50.00;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- INITIALIZE DEBT TRACKING FOR EXISTING SAAS
-- =====================================================

-- Initialize billing debt for all existing SaaS
INSERT INTO public.saas_billing_debt (saas_id, next_billing_date)
SELECT id, public.get_next_billing_date()
FROM public.saas_companies
ON CONFLICT (saas_id) DO NOTHING;

-- Initialize wallets for all existing creators
INSERT INTO public.creator_wallets (creator_id)
SELECT id
FROM public.creator_profiles
ON CONFLICT (creator_id) DO NOTHING;

-- =====================================================
-- DONE! ✅
-- =====================================================
-- 
-- Functions created:
-- - should_bill_saas() - Check if billing threshold reached
-- - bill_saas() - Create invoice and charge SaaS
-- - can_creator_payout() - Check if creator can payout
-- - create_creator_payout() - Create payout and invoice
-- - get_saas_to_bill() - Get all SaaS that should be billed
-- - get_creators_ready_for_payout() - Get creators ready for payout
--
-- Next: Implement API endpoints and Stripe integration
-- =====================================================

