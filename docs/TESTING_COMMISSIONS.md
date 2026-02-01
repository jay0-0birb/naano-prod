# Testing the Commission System

## Step 1: Run the Database Migration

1. Open Supabase Dashboard → SQL Editor
2. Copy and paste the contents of `supabase/commissions-system.sql`
3. Click "Run" to execute
4. Verify tables were created:
   ```sql
   SELECT table_name FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name IN ('commissions', 'commission_payouts');
   ```

## Step 2: Set Up Test Data

### A. Create a Collaboration (if you don't have one)

1. As a SaaS user:
   - Go to Marketplace
   - Find a creator and invite them (or accept an application)

2. As a Creator:
   - Accept the collaboration invitation
   - Go to Collaborations → Select the collaboration
   - Generate a tracking link (should already exist)

### B. Get Your Tracking Link

1. Go to the collaboration detail page
2. Copy the tracking link (format: `https://your-domain.com/c/[creator-name]-[saas-name]-[hash]`)
3. Note the collaboration ID from the URL: `/dashboard/collaborations/[id]`

## Step 3: Generate Test Revenue

### Option A: Using the Conversion API (Recommended)

1. **First, click your tracking link** (to set the attribution cookie):
   ```
   https://localhost:3001/c/your-tracking-link
   ```

2. **Then, simulate a conversion** using curl or Postman:

   ```bash
   curl -X POST http://localhost:3001/api/track/conversion \
     -H "Content-Type: application/json" \
     -d '{
       "revenue": 1000.00,
       "session_id": "your-session-id-from-cookie"
     }'
   ```

   **OR** if you have an API key (from SaaS settings):
   ```bash
   curl -X POST http://localhost:3001/api/track/conversion \
     -H "Content-Type: application/json" \
     -H "X-API-Key: your-api-key" \
     -d '{
       "revenue": 1000.00,
       "session_id": "your-session-id"
     }'
   ```

### Option B: Direct Database Insert (Quick Test)

1. Get your `tracked_link_id`:
   ```sql
   SELECT id, collaboration_id, hash 
   FROM tracked_links 
   WHERE collaboration_id = 'your-collaboration-id';
   ```

2. Insert a test conversion:
   ```sql
   INSERT INTO link_events (
     tracked_link_id,
     event_type,
     revenue_amount,
     occurred_at,
     session_id
   ) VALUES (
     'your-tracked-link-id',
     'conversion',
     1000.00,
     NOW(),
     'test-session-' || gen_random_uuid()::text
   );
   ```

## Step 4: Calculate Commissions

### Calculate for Current Month (So Far)

```sql
-- Replace 'your-collaboration-id' with actual ID
SELECT calculate_commission_for_period(
  'your-collaboration-id',
  date_trunc('month', NOW()),  -- Start of current month
  NOW()                         -- Now
);
```

### Calculate for Last Month

```sql
-- Example: November 2024
SELECT calculate_monthly_commissions(2024, 11);
```

### Verify Commission Was Created

```sql
SELECT 
  c.id,
  c.collaboration_id,
  c.total_revenue_generated,
  c.creator_net_earnings,
  c.status,
  c.period_start,
  c.period_end
FROM commissions c
WHERE c.collaboration_id = 'your-collaboration-id'
ORDER BY c.created_at DESC
LIMIT 5;
```

**Expected Result:**
- `total_revenue_generated`: 1000.00
- `creator_net_earnings`: 127.50 (15% - 15% platform fee = 12.75% of 1000)
- `status`: 'pending'

## Step 5: View in UI

### As Creator:

1. Go to **Finances** page (`/dashboard/finances`)
2. You should see:
   - **Pending Earnings**: €127.50 (or your calculated amount)
   - **Paid Earnings**: €0.00
   - Number of pending commissions

3. If you have ≥ €50 pending:
   - **"Demander un virement"** button should appear
   - Make sure Stripe Connect is connected first!

### As SaaS:

1. Go to **Finances** page → **Commissions** tab
2. You should see:
   - **Total Revenue Generated**: €1000.00
   - **Commissions Due**: €127.50
   - Commission history with creator name

## Step 6: Test Payout Flow (Creator)

### Prerequisites:
- Creator must have Stripe Connect account connected
- Pending earnings ≥ €50

### Steps:

1. **Connect Stripe** (if not already):
   - Go to Settings → Connect Stripe
   - Complete onboarding

2. **Request Payout**:
   - Go to Finances page
   - Click "Demander un virement"
   - Should see success message

3. **Verify in Database**:
   ```sql
   SELECT 
     c.id,
     c.status,
     c.paid_at,
     c.payout_id,
     p.amount,
     p.status as payout_status,
     p.stripe_transfer_id
   FROM commissions c
   LEFT JOIN commission_payouts p ON c.payout_id = p.id
   WHERE c.creator_id = 'your-creator-id'
   ORDER BY c.created_at DESC;
   ```

   **Expected:**
   - `c.status`: 'paid'
   - `c.paid_at`: timestamp
   - `p.status`: 'succeeded' or 'processing'
   - `p.stripe_transfer_id`: Stripe transfer ID

4. **Check Stripe Dashboard**:
   - Go to Stripe Dashboard → Transfers
   - Should see the transfer to creator's account

## Step 7: Test Multiple Conversions

### Add More Revenue:

```sql
-- Add multiple conversions for same collaboration
INSERT INTO link_events (
  tracked_link_id,
  event_type,
  revenue_amount,
  occurred_at,
  session_id
) VALUES 
  ('your-tracked-link-id', 'conversion', 500.00, NOW(), 'session-1'),
  ('your-tracked-link-id', 'conversion', 750.00, NOW(), 'session-2'),
  ('your-tracked-link-id', 'conversion', 250.00, NOW(), 'session-3');
```

### Recalculate Commission:

```sql
-- This will update the existing commission (or create new if period changed)
SELECT calculate_commission_for_period(
  'your-collaboration-id',
  date_trunc('month', NOW()),
  NOW()
);
```

### Verify Updated Amount:

```sql
SELECT 
  total_revenue_generated,  -- Should be 2500.00 (1000 + 500 + 750 + 250)
  creator_net_earnings      -- Should be 318.75 (12.75% of 2500)
FROM commissions
WHERE collaboration_id = 'your-collaboration-id'
ORDER BY created_at DESC
LIMIT 1;
```

## Step 8: Test Monthly Calculation

### Create Test Data for Last Month:

```sql
-- Insert conversion from last month
INSERT INTO link_events (
  tracked_link_id,
  event_type,
  revenue_amount,
  occurred_at,
  session_id
) VALUES (
  'your-tracked-link-id',
  'conversion',
  2000.00,
  NOW() - interval '1 month',  -- Last month
  'session-last-month'
);
```

### Calculate for Last Month:

```sql
-- Get last month's year and month
SELECT calculate_monthly_commissions(
  EXTRACT(YEAR FROM NOW() - interval '1 month')::INTEGER,
  EXTRACT(MONTH FROM NOW() - interval '1 month')::INTEGER
);
```

### Verify Separate Commission:

```sql
SELECT 
  period_start,
  period_end,
  total_revenue_generated,
  creator_net_earnings
FROM commissions
WHERE collaboration_id = 'your-collaboration-id'
ORDER BY period_start DESC;
```

Should see **two separate commissions** (one for current month, one for last month).

## Troubleshooting

### No Commission Created?

1. **Check if revenue exists:**
   ```sql
   SELECT 
     le.event_type,
     le.revenue_amount,
     le.occurred_at,
     tl.collaboration_id
   FROM link_events le
   JOIN tracked_links tl ON le.tracked_link_id = tl.id
   WHERE tl.collaboration_id = 'your-collaboration-id'
     AND le.event_type = 'conversion';
   ```

2. **Check collaboration is active:**
   ```sql
   SELECT status FROM collaborations WHERE id = 'your-collaboration-id';
   ```
   Should be `'active'`.

### Commission Amount Wrong?

1. **Check SaaS tier:**
   ```sql
   SELECT subscription_tier FROM saas_companies WHERE id = 'your-saas-id';
   ```

2. **Verify calculation:**
   - Creator gets: 15% of revenue
   - Platform fee: 15% of creator commission
   - Creator net: 12.75% of revenue
   - Example: €1000 → €127.50 creator net

### Payout Not Working?

1. **Check Stripe Connect:**
   ```sql
   SELECT stripe_account_id, stripe_onboarding_completed 
   FROM creator_profiles 
   WHERE profile_id = 'your-user-id';
   ```

2. **Check minimum amount:**
   - Must be ≥ €50
   - Check pending earnings in UI

3. **Check API logs:**
   - Look for errors in terminal/console
   - Check Stripe Dashboard for transfer errors

## Quick Test Script

Run this in Supabase SQL Editor for a complete test:

```sql
-- 1. Get a collaboration ID (replace with yours)
-- SELECT id FROM collaborations WHERE status = 'active' LIMIT 1;

-- 2. Get tracked link ID
-- SELECT id FROM tracked_links WHERE collaboration_id = 'your-collaboration-id' LIMIT 1;

-- 3. Insert test conversion
INSERT INTO link_events (
  tracked_link_id,
  event_type,
  revenue_amount,
  occurred_at,
  session_id
) VALUES (
  'your-tracked-link-id',  -- Replace
  'conversion',
  1000.00,
  NOW(),
  'test-session-' || gen_random_uuid()::text
);

-- 4. Calculate commission
SELECT calculate_commission_for_period(
  'your-collaboration-id',  -- Replace
  date_trunc('month', NOW()),
  NOW()
);

-- 5. View result
SELECT * FROM commissions 
WHERE collaboration_id = 'your-collaboration-id'  -- Replace
ORDER BY created_at DESC 
LIMIT 1;
```

