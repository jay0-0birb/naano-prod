-- =====================================================
-- NAANO PROMOTION VERIFICATION (CREATOR SIDE)
-- =====================================================
-- Goal:
-- - Detect creators who promoted Naano using a special link
-- - Use objective traffic signals (3s rule + anti-bot + IP/hour dedup)
-- - On first qualified promo click → lifetime Pro (1.10€/click) for that creator
-- - No manual review, no social API
-- =====================================================

-- 1) Events table for Naano promo traffic
--    We deliberately keep it separate from collaboration tracking / leads.

CREATE TABLE IF NOT EXISTS public.naano_promo_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES public.creator_profiles(id) ON DELETE CASCADE,
  ip_address TEXT,
  user_agent TEXT,
  time_on_site INTEGER,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_naano_promo_events_creator_id
  ON public.naano_promo_events(creator_id);

-- Index to help deduplicate by (creator, IP, hour).
-- We avoid functional index here to keep compatibility with all Postgres settings.
CREATE INDEX IF NOT EXISTS idx_naano_promo_events_creator_ip_hour
  ON public.naano_promo_events(creator_id, ip_address, occurred_at);

-- 2) Helper: upgrade creator to lifetime Pro via promo
--    - Sets is_pro = true
--    - pro_status_source = 'PROMO'
--    - pro_expiration_date = NULL  (lifetime)

CREATE OR REPLACE FUNCTION public.upgrade_creator_to_pro_lifetime(p_creator_id UUID)
RETURNS VOID AS $$
DECLARE
  v_is_pro BOOLEAN;
  v_source pro_status_source_enum;
  v_expiration TIMESTAMPTZ;
BEGIN
  SELECT is_pro, pro_status_source, pro_expiration_date
  INTO v_is_pro, v_source, v_expiration
  FROM public.creator_profiles
  WHERE id = p_creator_id;

  -- Already lifetime promo Pro → nothing to do
  IF v_is_pro AND v_source = 'PROMO' AND v_expiration IS NULL THEN
    RETURN;
  END IF;

  -- Upgrade to lifetime Pro via PROMO
  UPDATE public.creator_profiles
  SET
    is_pro = true,
    pro_status_source = 'PROMO',
    pro_expiration_date = NULL,          -- lifetime
    stripe_subscription_id_pro = NULL    -- ensure not tied to any subscription
  WHERE id = p_creator_id;
END;
$$ LANGUAGE plpgsql;

-- 3) Main RPC: track_naano_promo_click
--    Called by the app when someone visits https://naano.xyz/?ref=CREATOR_ID
--    after staying 3+ seconds.
--
--    Logic:
--    - Filter bots via is_bot_user_agent()
--    - Enforce 3s rule (time_on_site >= 3)
--    - Deduplicate per (creator_id, ip, hour)
--    - Record event
--    - On first qualified click ever → upgrade creator to lifetime Pro

CREATE OR REPLACE FUNCTION public.track_naano_promo_click(
  p_creator_id UUID,
  p_ip_address TEXT,
  p_user_agent TEXT,
  p_time_on_site INTEGER
)
RETURNS BOOLEAN AS $$
DECLARE
  v_hour_bucket TIMESTAMPTZ;
  v_existing_id UUID;
  v_ip TEXT;
BEGIN
  IF p_creator_id IS NULL THEN
    RETURN false;
  END IF;

  -- Normalise IP
  v_ip := COALESCE(NULLIF(p_ip_address, ''), 'unknown');

  -- 1) Anti-bot filter (reuses global helper)
  IF is_bot_user_agent(p_user_agent) THEN
    RETURN false;
  END IF;

  -- 2) 3-second rule
  IF p_time_on_site IS NULL OR p_time_on_site < 3 THEN
    RETURN false;
  END IF;

  -- 3) Deduplicate by (creator, IP, hour bucket)
  v_hour_bucket := date_trunc('hour', NOW());

  SELECT id
  INTO v_existing_id
  FROM public.naano_promo_events
  WHERE creator_id = p_creator_id
    AND ip_address = v_ip
    AND date_trunc('hour', occurred_at) = v_hour_bucket
  LIMIT 1;

  -- Always log the event for diagnostics, even if duplicate
  INSERT INTO public.naano_promo_events (creator_id, ip_address, user_agent, time_on_site)
  VALUES (p_creator_id, v_ip, p_user_agent, p_time_on_site);

  -- If we already had a qualified click this hour from this IP, don't trigger upgrade
  IF v_existing_id IS NOT NULL THEN
    RETURN false;
  END IF;

  -- 4) On first qualified click ever → upgrade creator to lifetime Pro
  PERFORM public.upgrade_creator_to_pro_lifetime(p_creator_id);

  RETURN true;
END;
$$ LANGUAGE plpgsql;

-- Notes:
-- - This RPC is intended to be called from the backend using the service role key.
-- - Creator Pro payout logic already uses is_creator_pro() and get_creator_payout_amount().
--   Once upgraded here, all future qualified clicks automatically pay €1.10.

