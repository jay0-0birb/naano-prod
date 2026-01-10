# Attribution System - Complete Testing Guide

This guide walks you through testing all aspects of the three-layer attribution system.

## Prerequisites

1. ✅ Both SQL migrations have been run successfully
2. ✅ You have a collaboration with a tracking link
3. ✅ You have access to the SaaS dashboard (Growth/Scale tier)
4. ✅ You have access to Supabase SQL Editor

---

## A. Click Logging and Session Intelligence (Layer 1)

### A1. Basic Click Recording

**Test:** Click a tracking link and verify it's logged.

**Steps:**
1. Get your tracking link from the collaboration page
2. Open the link in a new incognito/private window
3. Wait for redirect (should be fast, <1 second)

**Verify in SQL:**
```sql
SELECT 
  id,
  event_type,
  occurred_at,
  ip_address,
  user_agent,
  referrer,
  device_type,
  os,
  browser,
  network_type,
  country,
  city
FROM link_events
WHERE event_type = 'click'
ORDER BY occurred_at DESC
LIMIT 5;
```

**✅ Checklist:**
- [ ] Click appears in `link_events` table
- [ ] `event_type` = 'click'
- [ ] `occurred_at` timestamp is recent and correct (check timezone)
- [ ] `ip_address` is NOT your server IP (should be your actual IP)
- [ ] `user_agent` is captured (not null/empty)
- [ ] `referrer` shows where you came from (or 'direct' if typed URL)
- [ ] `device_type`, `os`, `browser` are populated (from user agent parsing)
- [ ] `country` and `city` are populated (from IP geolocation)

### A2. Referrer Detection

**Test:** Click from different sources.

**Steps:**
1. Click link from LinkedIn (share link, then click)
2. Click link from Twitter/X
3. Click link directly (type URL)
4. Click link from another website

**Verify:**
```sql
SELECT 
  referrer,
  COUNT(*) as count
FROM link_events
WHERE event_type = 'click'
  AND occurred_at > NOW() - INTERVAL '1 hour'
GROUP BY referrer;
```

**✅ Checklist:**
- [ ] LinkedIn referrer shows `linkedin.com` in referrer
- [ ] Direct traffic shows `direct` or empty referrer
- [ ] Other referrers show correct domain

### A3. Device/OS/Browser Parsing

**Test:** Access from different devices/browsers.

**Steps:**
1. Click link from Chrome on desktop
2. Click link from Safari on iPhone
3. Click link from Chrome on Android

**Verify:**
```sql
SELECT 
  device_type,
  os,
  browser,
  COUNT(*) as count
FROM link_events
WHERE event_type = 'click'
  AND occurred_at > NOW() - INTERVAL '1 hour'
GROUP BY device_type, os, browser;
```

**✅ Checklist:**
- [ ] Desktop shows `device_type = 'desktop'`
- [ ] Mobile shows `device_type = 'mobile'`
- [ ] OS is correctly identified (Windows, macOS, iOS, Android)
- [ ] Browser is correctly identified (Chrome, Safari, Firefox, etc.)

### A4. Time on Site (3-Second Rule)

**Test:** Verify 3-second rule tracking.

**Steps:**
1. Click tracking link
2. Stay on destination page for 5+ seconds
3. Check if `time_on_site` is updated

**Verify:**
```sql
SELECT 
  id,
  occurred_at,
  time_on_site,
  CASE 
    WHEN time_on_site IS NULL AND occurred_at > NOW() - INTERVAL '5 minutes' THEN 'Pending (recent)'
    WHEN time_on_site IS NULL THEN 'Never updated (old)'
    WHEN time_on_site >= 3 THEN 'Qualified (3+ seconds)'
    ELSE 'Bounce (<3 seconds)'
  END as status
FROM link_events
WHERE event_type = 'click'
ORDER BY occurred_at DESC
LIMIT 10;
```

**✅ Checklist:**
- [ ] Recent clicks (<5 min old) with `time_on_site = NULL` are "Pending"
- [ ] Clicks with `time_on_site >= 3` are marked as "Qualified"
- [ ] Old clicks (>5 min) with `time_on_site = NULL` are excluded from qualified

### A5. Session Tracking Without Cookies

**Test:** Verify session tracking works in private browsing.

**Steps:**
1. Open tracking link in incognito/private window
2. Disable cookies in browser
3. Click link and verify it's still tracked

**Verify:**
```sql
SELECT 
  session_id,
  COUNT(*) as clicks_in_session
FROM link_events
WHERE event_type = 'click'
  AND occurred_at > NOW() - INTERVAL '1 hour'
GROUP BY session_id;
```

**✅ Checklist:**
- [ ] Click is still logged even without cookies
- [ ] `session_id` is generated (from URL parameter or IP+UA fingerprint)
- [ ] Multiple clicks from same session share same `session_id`

---

## B. IP Enrichment and Company Inference (Layer 2)

### B1. Enrichment Triggers

**Test:** Verify enrichment runs after click.

**Steps:**
1. Click tracking link from a corporate network (office WiFi)
2. Wait 2-3 seconds for async enrichment
3. Check if company inference was created

**Verify:**
```sql
SELECT 
  le.id as click_id,
  le.occurred_at as click_time,
  ci.id as inference_id,
  ci.created_at as enrichment_time,
  ci.inferred_company_name,
  ci.confidence_score,
  ci.network_type,
  EXTRACT(EPOCH FROM (ci.created_at - le.occurred_at)) as enrichment_delay_seconds
FROM link_events le
LEFT JOIN company_inferences ci ON ci.link_event_id = le.id
WHERE le.event_type = 'click'
  AND le.occurred_at > NOW() - INTERVAL '1 hour'
ORDER BY le.occurred_at DESC
LIMIT 10;
```

**✅ Checklist:**
- [ ] Click is logged immediately (no delay)
- [ ] Enrichment happens async (delay of 1-3 seconds is normal)
- [ ] Enrichment doesn't block the redirect

### B2. Network Classification

**Test:** Verify correct network type classification.

**Test Cases:**
1. **Corporate Network:** Click from office WiFi
2. **Residential:** Click from home WiFi
3. **Mobile:** Click from mobile data
4. **Hosting:** Click from AWS/GCP/Azure IP (if you have access)

**Verify:**
```sql
SELECT 
  network_type,
  COUNT(*) as count,
  AVG(confidence_score) as avg_confidence
FROM company_inferences
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY network_type
ORDER BY count DESC;
```

**✅ Checklist:**
- [ ] Corporate IPs show `network_type = 'corporate'`
- [ ] Residential IPs show `network_type = 'residential'`
- [ ] Mobile IPs show `network_type = 'mobile'`
- [ ] Hosting IPs (AWS/GCP) show `network_type = 'hosting'`
- [ ] Corporate networks have higher confidence scores

### B3. Company Name Inference

**Test:** Verify company names are inferred correctly.

**Verify:**
```sql
SELECT 
  inferred_company_name,
  normalized_company_name,
  confidence_score,
  confidence_reasons,
  network_type,
  is_ambiguous,
  attribution_state
FROM company_inferences
WHERE created_at > NOW() - INTERVAL '24 hours'
  AND inferred_company_name IS NOT NULL
ORDER BY confidence_score DESC
LIMIT 10;
```

**✅ Checklist:**
- [ ] Corporate networks yield company names
- [ ] Company names are normalized (no "Inc.", "LLC", etc.)
- [ ] Confidence scores vary (not always 1.0)
- [ ] `confidence_reasons` array has at least 1 reason
- [ ] High confidence (>0.7) = company name present
- [ ] Low confidence (<0.3) = no company name (shouldn't appear in Lead Feed)

### B4. VPN/Proxy Detection

**Test:** Verify VPN/proxy detection.

**Steps:**
1. Connect to a VPN
2. Click tracking link
3. Check if VPN is detected

**Verify:**
```sql
SELECT 
  inferred_company_name,
  network_type,
  is_vpn,
  is_proxy,
  confidence_score,
  is_ambiguous
FROM company_inferences
WHERE (is_vpn = true OR is_proxy = true)
  AND created_at > NOW() - INTERVAL '24 hours';
```

**✅ Checklist:**
- [ ] VPN IPs show `is_vpn = true` or `network_type = 'vpn'`
- [ ] Proxy IPs show `is_proxy = true` or `network_type = 'proxy'`
- [ ] VPN/proxy IPs have lower confidence or marked as ambiguous
- [ ] VPN/proxy IPs may not yield company names (correct behavior)

### B5. Unknown/Low Confidence Handling

**Test:** Verify low confidence results don't show companies.

**Verify:**
```sql
-- Check that low confidence inferences exist
SELECT 
  COUNT(*) as low_confidence_count
FROM company_inferences
WHERE confidence_score < 0.3
  AND created_at > NOW() - INTERVAL '24 hours';

-- Check Lead Feed only shows high confidence
-- (This should match the query in actions-v2.ts)
SELECT 
  COUNT(*) as leads_in_feed
FROM link_events le
JOIN company_inferences ci ON ci.link_event_id = le.id
WHERE le.event_type = 'click'
  AND ci.confidence_score >= 0.3
  AND ci.inferred_company_name IS NOT NULL;
```

**✅ Checklist:**
- [ ] Low confidence (<0.3) inferences exist in database
- [ ] Lead Feed only shows clicks with `confidence_score >= 0.3`
- [ ] UI doesn't show "guessed" company names

---

## C. Intent Scoring (Layer 3)

### C1. Basic Intent Score Calculation

**Test:** Verify intent scores are calculated.

**Verify:**
```sql
SELECT 
  le.id,
  le.occurred_at,
  is.session_intent_score,
  is.is_repeat_visit,
  is.visit_count,
  is.viewed_pricing,
  is.viewed_security,
  is.viewed_integrations,
  is.intent_signals,
  is.recency_weight,
  is.days_since_session
FROM link_events le
JOIN intent_scores is ON is.link_event_id = le.id
WHERE le.event_type = 'click'
  AND le.occurred_at > NOW() - INTERVAL '24 hours'
ORDER BY is.session_intent_score DESC
LIMIT 10;
```

**✅ Checklist:**
- [ ] Every click has an intent score (0-100)
- [ ] Intent scores vary (not all the same)
- [ ] `intent_signals` JSONB contains reasons
- [ ] `recency_weight` is calculated (1.0 for recent, lower for old)

### C2. Intent Score Factors

**Test:** Verify different factors affect intent score.

**Verify:**
```sql
-- LinkedIn referrer should have higher intent
SELECT 
  le.referrer,
  AVG(is.session_intent_score) as avg_intent,
  COUNT(*) as count
FROM link_events le
JOIN intent_scores is ON is.link_event_id = le.id
WHERE le.event_type = 'click'
  AND le.occurred_at > NOW() - INTERVAL '24 hours'
GROUP BY le.referrer
ORDER BY avg_intent DESC;

-- Time on site should correlate with intent
SELECT 
  CASE 
    WHEN le.time_on_site >= 300 THEN '5+ min'
    WHEN le.time_on_site >= 180 THEN '3-5 min'
    WHEN le.time_on_site >= 60 THEN '1-3 min'
    WHEN le.time_on_site >= 3 THEN '3-60 sec'
    ELSE '<3 sec'
  END as engagement_level,
  AVG(is.session_intent_score) as avg_intent,
  COUNT(*) as count
FROM link_events le
JOIN intent_scores is ON is.link_event_id = le.id
WHERE le.event_type = 'click'
  AND le.occurred_at > NOW() - INTERVAL '24 hours'
GROUP BY engagement_level
ORDER BY avg_intent DESC;
```

**✅ Checklist:**
- [ ] LinkedIn referrers have higher intent scores
- [ ] Longer time on site = higher intent
- [ ] Repeat visits have higher intent
- [ ] Working hours visits have slightly higher intent

### C3. Company-Level Aggregated Intent

**Test:** Verify company-level intent aggregation.

**Verify:**
```sql
-- Test the aggregation function
SELECT * FROM get_company_aggregated_intent(
  'Your Company Name Here',  -- Replace with actual company name
  'your-tracked-link-id-here'::uuid  -- Replace with actual tracked_link_id
);

-- Or check the view
SELECT 
  inferred_company_name,
  total_sessions,
  avg_intent_score,
  max_intent_score,
  repeat_visits,
  intent_trend
FROM company_intent_aggregates
WHERE collaboration_id = 'your-collaboration-id-here'::uuid  -- Replace
ORDER BY avg_intent_score DESC
LIMIT 10;
```

**✅ Checklist:**
- [ ] Function returns aggregated metrics
- [ ] `avg_intent_score` is weighted by recency
- [ ] Companies with multiple sessions have higher aggregated intent
- [ ] `intent_trend` shows 'increasing', 'stable', or 'decreasing'

### C4. Recency Weighting

**Test:** Verify old sessions have lower weight.

**Verify:**
```sql
SELECT 
  is.days_since_session,
  is.recency_weight,
  is.session_intent_score,
  COUNT(*) as count
FROM intent_scores is
WHERE is.created_at > NOW() - INTERVAL '7 days'
GROUP BY is.days_since_session, is.recency_weight, is.session_intent_score
ORDER BY is.days_since_session;
```

**✅ Checklist:**
- [ ] Recent sessions (<7 days) have `recency_weight = 1.0`
- [ ] Older sessions (30-90 days) have lower weights (0.5-0.8)
- [ ] Very old sessions (>90 days) have low weights (0.2)

---

## D. Pre-Signup SaaS Dashboard Behavior

### D1. Language and Uncertainty Indicators

**Test:** Check UI language and badges.

**Steps:**
1. Go to collaboration detail page
2. Click "Lead Feed" tab
3. Check how companies are displayed

**✅ Checklist:**
- [ ] Inferred companies show "Probable: [Company Name]" or "Possible: [Company Name]"
- [ ] Confirmed companies show just "[Company Name]" with "✓ Confirmé" badge
- [ ] Ambiguous companies show "Possible: [Company Name]" with "⚠ Ambigu" badge
- [ ] Confidence score is visible (percentage or badge)
- [ ] Confidence reasons are shown (tooltip or expandable section)

### D2. Sorting and Filtering

**Test:** Verify sorting and filtering work.

**Steps:**
1. In Lead Feed, test sorting options:
   - By date
   - By confidence
   - By intent (session)
   - By company intent (aggregated)
2. Test filters:
   - "Show only confirmed"
   - "Show only high confidence (≥70%)"

**✅ Checklist:**
- [ ] Default sort is by company-level intent (most meaningful)
- [ ] Sorting by confidence works (high to low)
- [ ] Filter "confirmed only" shows only confirmed companies
- [ ] Filter "high confidence" shows only ≥70% confidence
- [ ] Filters can be combined

### D3. Company-Level Intent Display

**Test:** Verify company-level intent is prominently shown.

**Steps:**
1. Find a company with multiple sessions
2. Check if aggregated intent is displayed

**✅ Checklist:**
- [ ] Company-level intent score is shown prominently (large number)
- [ ] Session-level intent is shown as secondary
- [ ] Intent trend is displayed (↑ increasing, ↓ decreasing, → stable)
- [ ] Total sessions count is shown
- [ ] Repeat visits count is shown

### D4. IP Address Masking

**Test:** Verify IPs are masked in UI.

**Steps:**
1. Check Lead Feed
2. Look at IP addresses shown

**✅ Checklist:**
- [ ] IP addresses are masked (e.g., "192.168.1.x")
- [ ] IPv6 addresses are also masked
- [ ] "Unknown" is shown for missing IPs

---

## E. Signup Conversion and Truth Upgrade

### E1. Signup Webhook Integration

**Test:** Call signup webhook when user signs up.

**Steps:**
1. Click a tracking link (note the `naano_session` cookie value)
2. Simulate a signup by calling the webhook:

```bash
curl -X POST http://localhost:3000/api/track/signup \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "naano_session_xxx",
    "email": "test@example.com",
    "company": "Test Company Inc",
    "name": "Test User",
    "job_title": "CTO"
  }'
```

**Verify:**
```sql
-- Check if lead was updated
SELECT 
  l.id,
  l.signup_email,
  l.signup_company,
  l.signup_name,
  l.company_inference_id,
  ci.attribution_state,
  ci.confidence_score,
  ci.confirmed_at
FROM leads l
LEFT JOIN company_inferences ci ON ci.id = l.company_inference_id
WHERE l.signup_email IS NOT NULL
ORDER BY l.created_at DESC
LIMIT 5;
```

**✅ Checklist:**
- [ ] Webhook accepts the request
- [ ] Lead record is updated with signup data
- [ ] Company inference is upgraded to "confirmed"
- [ ] `confidence_score` becomes 1.00
- [ ] `confirmed_at` timestamp is set

### E2. Company Mismatch Handling

**Test:** Test when signup company ≠ inferred company.

**Steps:**
1. Click link from Company A's network
2. Sign up with Company B's email/company

**Verify:**
```sql
SELECT 
  ci.id,
  ci.inferred_company_name,
  ci.attribution_state,
  l.signup_company,
  CASE 
    WHEN ci.attribution_state = 'mismatch' THEN 'Mismatch detected'
    WHEN ci.attribution_state = 'confirmed' AND ci.inferred_company_name = l.signup_company THEN 'Match'
    ELSE 'Unknown'
  END as status
FROM company_inferences ci
JOIN leads l ON l.company_inference_id = ci.id
WHERE l.signup_company IS NOT NULL
ORDER BY l.created_at DESC
LIMIT 10;
```

**✅ Checklist:**
- [ ] Old inference is marked as "mismatch"
- [ ] New confirmed inference is created with signup company
- [ ] Lead points to new confirmed inference
- [ ] UI shows "Incompatible" badge for mismatched inferences

### E3. No Double-Counting

**Test:** Verify confirmed companies aren't counted twice.

**Verify:**
```sql
-- Check that confirmed companies appear once in aggregates
SELECT 
  ci.normalized_company_name,
  COUNT(DISTINCT ci.id) as inference_count,
  COUNT(DISTINCT CASE WHEN ci.attribution_state = 'confirmed' THEN ci.id END) as confirmed_count,
  COUNT(DISTINCT CASE WHEN ci.attribution_state = 'inferred' THEN ci.id END) as inferred_count
FROM company_inferences ci
WHERE ci.inferred_company_name IS NOT NULL
GROUP BY ci.normalized_company_name
HAVING COUNT(DISTINCT ci.id) > 1
ORDER BY inference_count DESC
LIMIT 10;
```

**✅ Checklist:**
- [ ] Same company (normalized) has multiple inferences (expected)
- [ ] After confirmation, old inferred inferences are also upgraded
- [ ] Company aggregates don't count same company twice

---

## F. Failure Modes and Resilience

### F1. Enrichment Provider Down

**Test:** Simulate enrichment failure.

**Steps:**
1. Temporarily break IP enrichment (comment out API call)
2. Click tracking link
3. Verify system still works

**✅ Checklist:**
- [ ] Click is still logged
- [ ] Redirect still works
- [ ] No errors in console
- [ ] Lead Feed shows "No leads" or "Unknown" (not crash)

### F2. Missing Data Handling

**Test:** Verify system handles missing data gracefully.

**Verify:**
```sql
-- Check for clicks with missing data
SELECT 
  COUNT(*) FILTER (WHERE ip_address IS NULL) as missing_ip,
  COUNT(*) FILTER (WHERE user_agent IS NULL) as missing_ua,
  COUNT(*) FILTER (WHERE referrer IS NULL) as missing_referrer
FROM link_events
WHERE event_type = 'click'
  AND occurred_at > NOW() - INTERVAL '24 hours';
```

**✅ Checklist:**
- [ ] Missing IP doesn't break enrichment (returns "unknown")
- [ ] Missing user agent doesn't break parsing (returns "unknown")
- [ ] Missing referrer is handled (shows "direct" or null)

---

## G. Security and Privacy

### G1. No Personal Data Pre-Signup

**Verify:**
```sql
-- Check that no personal data exists pre-signup
SELECT 
  COUNT(*) as total_inferences,
  COUNT(*) FILTER (WHERE inferred_company_name IS NOT NULL) as with_company,
  COUNT(*) FILTER (WHERE inferred_company_name LIKE '%@%') as with_email,
  COUNT(*) FILTER (WHERE inferred_company_name ~ '[A-Z][a-z]+ [A-Z][a-z]+') as with_name
FROM company_inferences
WHERE created_at > NOW() - INTERVAL '7 days';
```

**✅ Checklist:**
- [ ] No email addresses in company names
- [ ] No personal names in company names
- [ ] Only company-level data is stored

### G2. Access Control

**Test:** Verify RLS policies work.

**Steps:**
1. Log in as Creator (not SaaS)
2. Try to access Lead Feed
3. Should see "Not authorized" or no tab

**Verify:**
```sql
-- Test RLS (run as different users)
SET ROLE authenticated;
SET request.jwt.claim.sub = 'creator-user-id-here';

-- Should return 0 rows (creators can't see company inferences)
SELECT COUNT(*) FROM company_inferences;
```

**✅ Checklist:**
- [ ] Creators cannot see Lead Feed
- [ ] Only SaaS (Growth/Scale) can see Lead Feed
- [ ] SaaS can only see their own collaborations' leads
- [ ] No cross-tenant data leakage

---

## Quick Verification Queries

Run these to get a quick health check:

```sql
-- Overall system health
SELECT 
  'Total Clicks (24h)' as metric,
  COUNT(*)::text as value
FROM link_events
WHERE event_type = 'click' AND occurred_at > NOW() - INTERVAL '24 hours'

UNION ALL

SELECT 
  'Enriched Clicks',
  COUNT(*)::text
FROM link_events le
JOIN company_inferences ci ON ci.link_event_id = le.id
WHERE le.event_type = 'click' AND le.occurred_at > NOW() - INTERVAL '24 hours'

UNION ALL

SELECT 
  'Intent Scores Calculated',
  COUNT(*)::text
FROM intent_scores
WHERE created_at > NOW() - INTERVAL '24 hours'

UNION ALL

SELECT 
  'Confirmed Companies',
  COUNT(DISTINCT normalized_company_name)::text
FROM company_inferences
WHERE attribution_state = 'confirmed'
  AND created_at > NOW() - INTERVAL '7 days';
```

---

## Next Steps After Testing

1. ✅ Document any issues found
2. ✅ Fix critical issues
3. ✅ Re-test fixed issues
4. ✅ Update documentation with findings
5. ✅ Share results with team

