# Quick Test: Commission System

## Step 1: Get Your IDs

Run this SQL in Supabase SQL Editor to get your collaboration and tracking link:

```sql
-- Get your collaboration and tracking link IDs
SELECT 
  c.id as collaboration_id,
  tl.id as tracked_link_id,
  tl.hash as tracking_hash,
  cp.company_name as saas_name,
  cr.profiles!inner(full_name) as creator_name
FROM collaborations c
JOIN tracked_links tl ON tl.collaboration_id = c.id
JOIN applications a ON c.application_id = a.id
JOIN saas_companies cp ON a.saas_id = cp.id
JOIN creator_profiles cr ON a.creator_id = cr.id
WHERE c.status = 'active'
LIMIT 1;
```

**Copy these values:**
- `collaboration_id` (UUID)
- `tracked_link_id` (UUID)
- `tracking_hash` (text)

## Step 2: Create Test Revenue

Insert a test conversion (replace `YOUR_TRACKED_LINK_ID` with the actual ID):

```sql
-- Insert test conversion
INSERT INTO link_events (
  tracked_link_id,
  event_type,
  revenue_amount,
  occurred_at,
  session_id
) VALUES (
  'YOUR_TRACKED_LINK_ID',  -- Replace with actual tracked_link_id from Step 1
  'conversion',
  1000.00,  -- €1000 revenue
  NOW(),
  'test-session-' || gen_random_uuid()::text
);
```

**Expected:** Should insert 1 row successfully.

## Step 3: Calculate Commission

Calculate the commission for the current month (replace `YOUR_COLLABORATION_ID`):

```sql
-- Calculate commission for current month
SELECT calculate_commission_for_period(
  'YOUR_COLLABORATION_ID',  -- Replace with actual collaboration_id from Step 1
  date_trunc('month', NOW()),  -- Start of current month
  NOW()  -- Now
);
```

**Expected:** Should return a UUID (the commission ID).

## Step 4: Verify Commission Was Created

Check that the commission exists:

```sql
-- Verify commission
SELECT 
  id,
  total_revenue_generated,
  creator_net_earnings,
  creator_gross_earnings,
  platform_creator_fee,
  platform_saas_fee,
  status,
  period_start,
  period_end
FROM commissions
WHERE collaboration_id = 'YOUR_COLLABORATION_ID'  -- Replace
ORDER BY created_at DESC
LIMIT 1;
```

**Expected Results:**
- `total_revenue_generated`: **1000.00**
- `creator_gross_earnings`: **150.00** (15% of 1000)
- `platform_creator_fee`: **22.50** (15% of 150)
- `creator_net_earnings`: **127.50** (150 - 22.50)
- `platform_saas_fee`: **50.00** (5% if Starter tier, 3% if Growth, 1% if Scale)
- `status`: **'pending'**

## Step 5: Check in UI

### As Creator:
1. Go to `/dashboard/finances`
2. You should see:
   - **Pending Earnings**: €127.50
   - **Paid Earnings**: €0.00
   - Number of pending commissions: 1

### As SaaS:
1. Go to `/dashboard/finances` → **Commissions** tab
2. You should see:
   - **Total Revenue Generated**: €1000.00
   - **Commissions Due**: €127.50
   - Commission history with creator name

## Step 6: Test Multiple Conversions (Optional)

Add more revenue to see the commission update:

```sql
-- Add more conversions
INSERT INTO link_events (
  tracked_link_id,
  event_type,
  revenue_amount,
  occurred_at,
  session_id
) VALUES 
  ('YOUR_TRACKED_LINK_ID', 'conversion', 500.00, NOW(), 'test-2'),
  ('YOUR_TRACKED_LINK_ID', 'conversion', 750.00, NOW(), 'test-3');
```

Then recalculate:

```sql
-- Recalculate (will update existing commission)
SELECT calculate_commission_for_period(
  'YOUR_COLLABORATION_ID',
  date_trunc('month', NOW()),
  NOW()
);
```

Check again:

```sql
-- Should now show 2250.00 total revenue
SELECT total_revenue_generated, creator_net_earnings
FROM commissions
WHERE collaboration_id = 'YOUR_COLLABORATION_ID'
ORDER BY created_at DESC
LIMIT 1;
```

**Expected:**
- `total_revenue_generated`: **2250.00** (1000 + 500 + 750)
- `creator_net_earnings`: **286.88** (12.75% of 2250)

## Step 7: Test Payout (Optional)

If you have ≥ €50 pending and Stripe Connect connected:

1. As Creator, go to Finances page
2. Click **"Demander un virement"**
3. Check database:

```sql
-- Check payout was created
SELECT 
  p.id,
  p.amount,
  p.status,
  p.stripe_transfer_id,
  COUNT(c.id) as commission_count
FROM commission_payouts p
LEFT JOIN commissions c ON c.payout_id = p.id
WHERE p.creator_id = (
  SELECT id FROM creator_profiles 
  WHERE profile_id = auth.uid()
)
GROUP BY p.id
ORDER BY p.created_at DESC
LIMIT 1;
```

## Troubleshooting

### "No commission created"
- Check if revenue exists: `SELECT * FROM link_events WHERE event_type = 'conversion';`
- Check collaboration is active: `SELECT status FROM collaborations WHERE id = '...';`

### "Wrong commission amount"
- Check SaaS tier: `SELECT subscription_tier FROM saas_companies WHERE id = '...';`
- Verify calculation: Creator gets 12.75% net (15% - 15% platform fee)

### "Can't see in UI"
- Refresh the page
- Check you're logged in as the correct user (creator or SaaS)
- Check browser console for errors

