-- Block self-clicks in track_naano_promo_click: if the click IP matches the creator's
-- last_seen_ip (from dashboard) within 24h, do not insert event and do not upgrade.
-- Run after 20250211180000_add_creator_last_seen_ip.sql so last_seen_ip columns exist.

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
  v_creator_last_ip TEXT;
  v_creator_last_seen_at TIMESTAMPTZ;
BEGIN
  IF p_creator_id IS NULL THEN
    RETURN false;
  END IF;

  v_ip := COALESCE(NULLIF(TRIM(p_ip_address), ''), 'unknown');

  -- 0) Self-click protection: if this IP was recently seen for this creator on the dashboard, do not count.
  IF v_ip IS NOT NULL AND v_ip != 'unknown' AND v_ip != 'local' THEN
    SELECT last_seen_ip, last_seen_ip_at
    INTO v_creator_last_ip, v_creator_last_seen_at
    FROM public.creator_profiles
    WHERE id = p_creator_id;
    IF v_creator_last_ip IS NOT NULL AND v_creator_last_ip = v_ip AND v_creator_last_seen_at IS NOT NULL THEN
      IF v_creator_last_seen_at > (NOW() - INTERVAL '24 hours') THEN
        RETURN false;
      END IF;
    END IF;
  END IF;

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
