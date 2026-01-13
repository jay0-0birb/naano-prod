-- =====================================================
-- FIX COMMISSION DUPLICATES ISSUE
-- =====================================================
-- Problem: Unique constraint includes period_end, which changes
-- each time (NOW()), causing duplicate commissions for same month
-- 
-- Solution: Change constraint to only (collaboration_id, period_start)
-- =====================================================

-- Step 1: Drop the old unique constraint
ALTER TABLE public.commissions 
DROP CONSTRAINT IF EXISTS commissions_collaboration_id_period_start_period_end_key;

-- Step 2: Add new unique constraint (only collaboration + period_start)
ALTER TABLE public.commissions 
ADD CONSTRAINT commissions_collaboration_period_unique 
UNIQUE (collaboration_id, period_start);

-- Step 3: Update the calculate_commission_for_period function
-- to use the new constraint in ON CONFLICT
CREATE OR REPLACE FUNCTION public.calculate_commission_for_period(
  p_collaboration_id UUID,
  p_period_start TIMESTAMPTZ,
  p_period_end TIMESTAMPTZ
)
RETURNS UUID AS $$
DECLARE
  v_creator_id UUID;
  v_saas_id UUID;
  v_total_revenue DECIMAL(10, 2);
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
  SELECT COALESCE(SUM(le.revenue_amount), 0)
  INTO v_total_revenue
  FROM public.link_events le
  JOIN public.tracked_links tl ON le.tracked_link_id = tl.id
  WHERE tl.collaboration_id = p_collaboration_id
    AND le.event_type = 'conversion'
    AND le.occurred_at >= p_period_start
    AND le.occurred_at < p_period_end;

  -- If no revenue, return NULL (no commission to create)
  IF v_total_revenue = 0 THEN
    RETURN NULL;
  END IF;

  -- Get SaaS platform fee rate
  v_saas_platform_fee_rate := public.get_saas_platform_fee_rate(v_saas_id);

  -- Calculate amounts
  v_creator_gross := v_total_revenue * (v_creator_commission_rate / 100);
  v_platform_creator_fee := v_creator_gross * (v_platform_creator_fee_rate / 100);
  v_creator_net := v_creator_gross - v_platform_creator_fee;
  v_platform_saas_fee := v_total_revenue * (v_saas_platform_fee_rate / 100);
  v_platform_total := v_platform_creator_fee + v_platform_saas_fee;

  -- Insert or update commission
  -- FIXED: ON CONFLICT now only checks (collaboration_id, period_start)
  INSERT INTO public.commissions (
    collaboration_id,
    creator_id,
    saas_id,
    period_start,
    period_end,
    total_revenue_generated,
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
    v_total_revenue,
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
  ON CONFLICT (collaboration_id, period_start)  -- FIXED: Removed period_end
  DO UPDATE SET
    period_end = EXCLUDED.period_end,  -- Update period_end to latest calculation time
    total_revenue_generated = EXCLUDED.total_revenue_generated,
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

-- =====================================================
-- OPTIONAL: Merge existing duplicate commissions
-- =====================================================
-- This will combine duplicate commissions for the same
-- collaboration and month into a single record
-- =====================================================

DO $$
DECLARE
  v_duplicate RECORD;
  v_merged_revenue DECIMAL(10, 2);
  v_merged_creator_net DECIMAL(10, 2);
  v_merged_creator_gross DECIMAL(10, 2);
  v_merged_platform_fee DECIMAL(10, 2);
  v_merged_saas_fee DECIMAL(10, 2);
  v_merged_platform_total DECIMAL(10, 2);
  v_keep_id UUID;
  v_delete_ids UUID[];
BEGIN
  -- Find duplicate commissions (same collaboration + period_start)
  FOR v_duplicate IN
    SELECT 
      collaboration_id,
      period_start,
      COUNT(*) as count,
      array_agg(id ORDER BY created_at) as ids,
      array_agg(total_revenue_generated) as revenues,
      array_agg(creator_net_earnings) as nets,
      array_agg(creator_gross_earnings) as grosses,
      array_agg(platform_creator_fee) as fees,
      array_agg(platform_saas_fee) as saas_fees,
      array_agg(platform_total_revenue) as totals
    FROM public.commissions
    GROUP BY collaboration_id, period_start
    HAVING COUNT(*) > 1
  LOOP
    -- Keep the first one (oldest), delete the rest
    v_keep_id := v_duplicate.ids[1];
    v_delete_ids := v_duplicate.ids[2:array_length(v_duplicate.ids, 1)];
    
    -- Sum all values
    SELECT 
      SUM(total_revenue_generated),
      SUM(creator_net_earnings),
      SUM(creator_gross_earnings),
      SUM(platform_creator_fee),
      SUM(platform_saas_fee),
      SUM(platform_total_revenue)
    INTO
      v_merged_revenue,
      v_merged_creator_net,
      v_merged_creator_gross,
      v_merged_platform_fee,
      v_merged_saas_fee,
      v_merged_platform_total
    FROM public.commissions
    WHERE id = ANY(v_duplicate.ids);
    
    -- Update the kept record with merged values
    UPDATE public.commissions
    SET
      total_revenue_generated = v_merged_revenue,
      creator_net_earnings = v_merged_creator_net,
      creator_gross_earnings = v_merged_creator_gross,
      platform_creator_fee = v_merged_platform_fee,
      platform_saas_fee = v_merged_saas_fee,
      platform_total_revenue = v_merged_platform_total,
      period_end = (SELECT MAX(period_end) FROM public.commissions WHERE id = ANY(v_duplicate.ids)),
      updated_at = NOW()
    WHERE id = v_keep_id;
    
    -- Delete the duplicate records
    DELETE FROM public.commissions
    WHERE id = ANY(v_delete_ids);
    
    RAISE NOTICE 'Merged % duplicate commissions for collaboration % period %', 
      v_duplicate.count, v_duplicate.collaboration_id, v_duplicate.period_start;
  END LOOP;
END $$;

-- =====================================================
-- VERIFY THE FIX
-- =====================================================
-- Run this to check if duplicates are gone:
-- SELECT 
--   collaboration_id,
--   period_start,
--   COUNT(*) as count
-- FROM commissions
-- GROUP BY collaboration_id, period_start
-- HAVING COUNT(*) > 1;
-- 
-- Should return 0 rows if fix worked
-- =====================================================


