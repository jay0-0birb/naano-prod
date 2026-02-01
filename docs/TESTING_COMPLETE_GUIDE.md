# Complete Testing Guide: Payments, Links, Qualified Leads, CSV

End-to-end testing for the full business flow.

---

## Prerequisites

### 1. Environment Variables

```env
# Stripe (test mode)
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_CLIENT_ID=ca_...  # For Stripe Connect OAuth

# Credit subscription (SaaS buys credits)
STRIPE_PRICE_CREDITS_BASE=price_...

# Supabase
NEXT_PUBLIC_SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...

# Optional: IP enrichment
IPINFO_API_KEY=...  # Optional, ip-api fallback works without
```

### 2. Stripe Webhook (Local)

```bash
# Terminal 1: Start app
npm run dev

# Terminal 2: Forward webhooks
stripe listen --forward-to localhost:3002/api/stripe/webhook
# Copy the whsec_... to .env.local as STRIPE_WEBHOOK_SECRET
```

**Required events:** `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.paid`, `invoice.payment_failed`, `transfer.created`, `transfer.paid`

### 3. Migrations

Ensure qualified-lead-only migration is run:

```bash
supabase db execute -f supabase/analytics-qualified-clicks.sql
supabase db execute -f supabase/add-3sec-geo-tracking.sql
supabase db execute -f supabase/qualified-lead-only-migration.sql
```

---

## Part 1: Payments

### Test 1.1: SaaS Buys Credits

1. **Login as SaaS**
2. Go to `/dashboard/finances` → "Mon Plan" tab
3. Use slider to select 500 credits
4. Click "S'abonner" → Stripe Checkout
5. Use test card: `4242 4242 4242 4242`
6. Complete payment

**Verify:**

- Credit balance shows 500
- Stripe Dashboard → Subscriptions: Active
- Webhook fired `checkout.session.completed`

```sql
SELECT wallet_credits, monthly_credit_subscription
FROM saas_companies WHERE id = 'YOUR_SAAS_ID';
```

### Test 1.2: SaaS Card Setup (for threshold billing)

1. Login as SaaS
2. Go to `/dashboard/settings` or card setup page
3. Add card via Stripe Elements
4. Use test card: `4242 4242 4242 4242`

**Verify:** `card_on_file = true`, `stripe_customer_id` set in `saas_companies`

### Test 1.3: Creator Stripe Connect

1. Login as Creator
2. Go to `/dashboard/settings` or `/dashboard/finances`
3. Click "Connect Stripe" / "Connecter Stripe"
4. Complete Stripe Connect onboarding (test mode)

**Verify:** `stripe_account_id` set in `creator_profiles`, `stripe_onboarding_completed = true`

### Test 1.4: Creator Payout (≥€50)

1. Creator must have ≥€50 available balance
2. Go to `/dashboard/finances`
3. Click "Request payout" / "Retirer"
4. Confirm

**Verify:**

- Stripe Dashboard → Transfers: new transfer to creator
- Creator wallet: available balance decreased
- `creator_payouts` table: new row with status "completed" or "processing"

### Test 1.5: Pro Creator (€1.10/click) – Post-to-Unlock

Pro is no longer a paid subscription. Creators unlock Pro by posting about Naano on LinkedIn:

1. Login as Creator
2. Go to `/dashboard/finances`
3. Find "Débloquez Naano Pro" banner
4. Copy the Naano referral link
5. Post on LinkedIn mentioning Naano with that link
6. Paste the LinkedIn post URL in the form
7. Click "Débloquer Pro"

**Verify:** `is_pro = true`, `pro_status_source = 'PROMO'`, `pro_expiration_date` = 6 months from now. Next qualified lead pays €1.10 instead of €0.90.

---

## Part 2: Tracking Links

### Test 2.1: Get a Tracking Link

1. Create collaboration: Creator applies → SaaS accepts
2. Go to collaboration detail: `/dashboard/collaborations/[id]`
3. Tracking link appears (e.g. `https://yourapp.com/c/creator-slug-saas-slug-abc123`)

**Or via SQL:**

```sql
SELECT tl.hash, tl.destination_url, tl.collaboration_id
FROM tracked_links tl
JOIN collaborations c ON c.id = tl.collaboration_id
WHERE c.status = 'active'
LIMIT 1;
```

URL format: `https://YOUR_DOMAIN/c/[hash]`

### Test 2.2: Click Flow (Redirect Works)

1. Open tracking link in browser (or incognito)
2. You should see:
   - Naano redirect page (3 seconds)
   - Then redirect to destination URL with UTM params
3. Check URL has: `utm_source=naano`, `utm_medium=ambassador`, `naano_session=...`

**Verify in DB:**

```sql
SELECT id, event_type, ip_address, time_on_site, occurred_at
FROM link_events
WHERE tracked_link_id = 'YOUR_TRACKED_LINK_ID'
ORDER BY occurred_at DESC
LIMIT 5;
```

- New `link_event` with `event_type = 'click'`
- `time_on_site` = null initially (updated by 3sec API)

---

## Part 3: Qualified Leads (3-Second Rule)

**Important:** A lead is created ONLY when:

1. Not a bot (user-agent)
2. `time_on_site >= 3` seconds
3. No duplicate (same link + IP + hour)
4. SaaS has credits

### Test 3.1: Qualified Click (Creates Lead)

1. SaaS has credits > 0
2. Click tracking link
3. **Stay on redirect page for 3+ seconds** (do not close tab)
4. After 3 sec, page redirects automatically
5. API 3sec is called with `timeOnSite >= 3`

**Verify:**

- `link_events.time_on_site` = 3 or more
- New row in `leads` with `link_event_id` set
- `saas_companies.wallet_credits` decreased by 1
- `creator_wallets.available_balance` increased by €0.90 or €1.10

```sql
SELECT le.time_on_site, l.id as lead_id, l.creator_payout_amount, l.link_event_id
FROM link_events le
LEFT JOIN leads l ON l.link_event_id = le.id
WHERE le.tracked_link_id = 'YOUR_TRACKED_LINK_ID'
ORDER BY le.occurred_at DESC
LIMIT 3;
```

### Test 3.2: Non-Qualified Click (No Lead)

**A. Leave before 3 seconds**

1. Click link
2. Close tab or navigate away before 3 seconds
3. `time_on_site` stays null or < 3

**Verify:** No new lead, credits unchanged

**B. Bot user-agent**

- Simulate with curl: `curl -A "Googlebot/2.1" "https://yourapp.com/c/HASH"`
- Or use a bot user-agent in browser dev tools

**Verify:** No lead created (even if time_on_site >= 3)

**C. Duplicate (same IP, same hour)**

1. Create qualified click (stay 3+ sec)
2. Click same link again from same IP within same hour
3. Stay 3+ sec again

**Verify:** Only 1 lead for that IP/hour

### Test 3.3: Zero Credits (No Lead)

1. Set `wallet_credits = 0` for SaaS
2. Click link, stay 3+ sec

**Verify:** No lead, no credit deduction, no creator payout

---

## Part 4: Lead Feed & CSV Export

### Test 4.1: Lead Feed (Collaboration)

1. Login as SaaS
2. Go to collaboration: `/dashboard/collaborations/[id]`
3. Click "Lead Feed" tab
4. Should see clicks with company inference (corporate IPs)

**Note:** Lead Feed shows `link_events` with `company_inference`, not the `leads` table. Clicks without company inference (residential) are excluded.

### Test 4.2: CSV Export (English, Lead Type)

1. On Lead Feed tab, click "Export CSV" / "Télécharger CSV"
2. Open downloaded file

**Verify:**

- Headers in English: Date, Time, Creator, IP (masked), Country, City, Network type, **Lead type**, etc.
- **Lead type** column: Corporate, Individual, Mobile, Hosting, VPN, Proxy, or Unknown
- Boolean values: "Yes" / "No" (not Oui/Non)
- Dates: ISO format (YYYY-MM-DD)

### Test 4.3: Global Lead Feed (Analytics)

1. Login as SaaS
2. Go to `/dashboard/analytics`
3. Lead Feed tab shows all leads across collaborations
4. Export CSV → same format as collaboration CSV
5. Filename: `leads-global-YYYY-MM-DD.csv`

---

## Part 5: Analytics & Qualified Clicks

### Test 5.1: Qualified Clicks Count

On collaboration analytics:

- **Total clicks:** All link_events with event_type = 'click'
- **Qualified clicks:** Filtered (no bot, time_on_site >= 3, dedup IP/hour)
- **Leads count:** Should match qualified clicks (when credits available)

```sql
SELECT get_qualified_clicks('YOUR_COLLABORATION_ID');
```

### Test 5.2: Collaboration Analytics

```sql
SELECT * FROM get_collaboration_analytics('YOUR_COLLABORATION_ID');
```

Returns: total_impressions, total_clicks, qualified_clicks, leads_count, total_lead_cost, savings_vs_linkedin

---

## Quick Verification Queries

```sql
-- Recent link events
SELECT le.event_type, le.time_on_site, le.ip_address, le.occurred_at
FROM link_events le
ORDER BY le.occurred_at DESC LIMIT 10;

-- Recent leads with link_event
SELECT l.id, l.creator_payout_amount, l.link_event_id, l.created_at
FROM leads l
ORDER BY l.created_at DESC LIMIT 5;

-- Credit balance
SELECT company_name, wallet_credits FROM saas_companies;

-- Creator wallet
SELECT cw.available_balance, cw.total_earned
FROM creator_wallets cw
JOIN creator_profiles cp ON cp.id = cw.creator_id
LIMIT 5;
```

---

## Stripe Test Cards

| Card                  | Result    |
| --------------------- | --------- |
| `4242 4242 4242 4242` | Success   |
| `4000 0000 0000 0002` | Declined  |
| `4000 0000 0000 3220` | 3D Secure |

---

## Troubleshooting

**No lead created after click?**

- Did you stay 3+ seconds? Check `link_events.time_on_site`
- Does SaaS have credits? Check `saas_companies.wallet_credits`
- Is it a bot? Check `link_events.user_agent`
- Duplicate? Check if lead exists for same IP/hour

**Webhook not firing?**

- `stripe listen` running? Check terminal
- Correct `STRIPE_WEBHOOK_SECRET` in .env.local?
- Stripe Dashboard → Webhooks → Events: any failures?

**CSV empty or wrong format?**

- Lead Feed only shows clicks with company_inference
- Need corporate IP for company data (residential = no inference = excluded from Lead Feed)
- Check you're on the right tab (collaboration vs global)
