-- =====================================================
-- TEST SIMULATIONS FOR ATTRIBUTION SYSTEM
-- =====================================================
-- Creates test click events simulating different user types
-- =====================================================

-- First, get the tracked_link_id for your collaboration
-- Replace 'sarah-reynolds-super-cool-company-d56sqt' with your actual hash
DO $$
DECLARE
  v_tracked_link_id UUID;
  v_collaboration_id UUID;
  v_event_id UUID;
BEGIN
  -- Get tracked link ID
  SELECT id, collaboration_id 
  INTO v_tracked_link_id, v_collaboration_id
  FROM tracked_links
  WHERE hash = 'sarah-reynolds-super-cool-company-d56sqt'
  LIMIT 1;

  IF v_tracked_link_id IS NULL THEN
    RAISE EXCEPTION 'Tracked link not found. Make sure the hash is correct.';
  END IF;

  RAISE NOTICE 'Found tracked_link_id: %, collaboration_id: %', v_tracked_link_id, v_collaboration_id;

  -- =====================================================
  -- SIMULATION 1: Corporate Office User
  -- =====================================================
  INSERT INTO link_events (
    tracked_link_id,
    event_type,
    occurred_at,
    ip_address,
    user_agent,
    referrer,
    country,
    city,
    device_type,
    os,
    browser,
    network_type,
    time_on_site,
    session_id
  ) VALUES (
    v_tracked_link_id,
    'click',
    NOW() - INTERVAL '2 hours',
    '203.0.113.45',  -- Simulated corporate IP (RFC 5737 test range)
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'https://www.linkedin.com/feed/',
    'United States',
    'San Francisco',
    'desktop',
    'Windows',
    'Chrome',
    'corporate',
    180,  -- 3 minutes on site
    'test_session_corporate_' || gen_random_uuid()::text
  ) RETURNING id INTO v_event_id;

  RAISE NOTICE 'Created corporate click event: %', v_event_id;

  -- =====================================================
  -- SIMULATION 2: Home WiFi User
  -- =====================================================
  INSERT INTO link_events (
    tracked_link_id,
    event_type,
    occurred_at,
    ip_address,
    user_agent,
    referrer,
    country,
    city,
    device_type,
    os,
    browser,
    network_type,
    time_on_site,
    session_id
  ) VALUES (
    v_tracked_link_id,
    'click',
    NOW() - INTERVAL '1 hour',
    '198.51.100.23',  -- Simulated residential IP (RFC 5737 test range)
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
    'direct',
    'United States',
    'New York',
    'desktop',
    'macOS',
    'Safari',
    'residential',
    45,  -- 45 seconds (bounce)
    'test_session_residential_' || gen_random_uuid()::text
  ) RETURNING id INTO v_event_id;

  RAISE NOTICE 'Created residential click event: %', v_event_id;

  -- =====================================================
  -- SIMULATION 3: Mobile User (4G/5G)
  -- =====================================================
  INSERT INTO link_events (
    tracked_link_id,
    event_type,
    occurred_at,
    ip_address,
    user_agent,
    referrer,
    country,
    city,
    device_type,
    os,
    browser,
    network_type,
    time_on_site,
    session_id
  ) VALUES (
    v_tracked_link_id,
    'click',
    NOW() - INTERVAL '30 minutes',
    '192.0.2.78',  -- Simulated mobile IP (RFC 5737 test range)
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    'https://twitter.com/',
    'France',
    'Paris',
    'mobile',
    'iOS',
    'Safari',
    'mobile',
    120,  -- 2 minutes on site
    'test_session_mobile_' || gen_random_uuid()::text
  ) RETURNING id INTO v_event_id;

  RAISE NOTICE 'Created mobile click event: %', v_event_id;

  -- =====================================================
  -- SIMULATION 4: High-Intent Corporate User (Multiple Pages)
  -- =====================================================
  INSERT INTO link_events (
    tracked_link_id,
    event_type,
    occurred_at,
    ip_address,
    user_agent,
    referrer,
    country,
    city,
    device_type,
    os,
    browser,
    network_type,
    time_on_site,
    session_id
  ) VALUES (
    v_tracked_link_id,
    'click',
    NOW() - INTERVAL '15 minutes',
    '203.0.113.100',  -- Another corporate IP
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'https://www.linkedin.com/feed/',
    'Germany',
    'Berlin',
    'desktop',
    'Windows',
    'Chrome',
    'corporate',
    420,  -- 7 minutes (high engagement)
    'test_session_high_intent_' || gen_random_uuid()::text
  ) RETURNING id INTO v_event_id;

  RAISE NOTICE 'Created high-intent corporate click event: %', v_event_id;

  -- =====================================================
  -- SIMULATION 5: VPN User
  -- =====================================================
  INSERT INTO link_events (
    tracked_link_id,
    event_type,
    occurred_at,
    ip_address,
    user_agent,
    referrer,
    country,
    city,
    device_type,
    os,
    browser,
    network_type,
    time_on_site,
    session_id
  ) VALUES (
    v_tracked_link_id,
    'click',
    NOW() - INTERVAL '10 minutes',
    '185.220.101.45',  -- Simulated VPN IP (common VPN range)
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'direct',
    'Switzerland',
    'Zurich',
    'desktop',
    'macOS',
    'Chrome',
    'vpn',
    60,  -- 1 minute
    'test_session_vpn_' || gen_random_uuid()::text
  ) RETURNING id INTO v_event_id;

  RAISE NOTICE 'Created VPN click event: %', v_event_id;

  RAISE NOTICE '✅ All test events created successfully!';
  RAISE NOTICE 'Next: Run the enrichment script or wait for async enrichment to process these events.';

END $$;

-- =====================================================
-- VIEW CREATED TEST EVENTS
-- =====================================================
SELECT 
  le.id,
  le.occurred_at,
  le.ip_address,
  le.network_type,
  le.country,
  le.city,
  le.device_type,
  le.os,
  le.browser,
  le.time_on_site,
  le.referrer,
  CASE 
    WHEN le.session_id LIKE 'test_session_%' THEN 'Test Event'
    ELSE 'Real Event'
  END as event_type_label
FROM link_events le
WHERE le.session_id LIKE 'test_session_%'
ORDER BY le.occurred_at DESC;

