# Stripe Fees Integration - Update Summary

## Overview

The commission system has been updated to account for Stripe fees in commission calculations. Commissions are now calculated on **net revenue** (after Stripe fees) instead of gross revenue (what the customer paid).

## Changes Made

### 1. Database Schema Updates

**File**: `supabase/add-net-revenue-tracking.sql`

- Added `net_revenue_amount` column to `link_events` table
- Added `stripe_fee_amount` column to `link_events` table
- Added `gross_revenue_generated` column to `commissions` table
- Added `total_stripe_fees` column to `commissions` table
- Created helper function `calculate_stripe_fee()` for fee calculations

### 2. Stripe Webhook Handler

**File**: `app/api/stripe/webhook/route.ts`

- Updated to calculate Stripe fees from balance transactions when available
- Falls back to estimated fees based on payment method and location
- Stores both gross and net revenue in `link_events`
- Logs Stripe fee amount for transparency

### 3. Commission Calculation

**File**: `supabase/commissions-system-fixed.sql`

- Updated `calculate_commission_for_period()` function to use `net_revenue_amount`
- Falls back to `revenue_amount` for backward compatibility (old records)
- Tracks both gross and net revenue in commissions table
- Calculates commissions based on net revenue (what SaaS actually receives)

### 4. Conversion Tracking API

**File**: `app/api/track/conversion/route.ts`

- Updated to accept optional `net_revenue` and `stripe_fee` parameters
- Maintains backward compatibility (if not provided, treats revenue as gross)
- Stores all three values: gross, net, and fees

## Migration Steps

### Step 1: Run Database Migration

```sql
-- Run this in Supabase SQL Editor
\i supabase/add-net-revenue-tracking.sql
```

Or copy and paste the contents of `supabase/add-net-revenue-tracking.sql` into the Supabase SQL Editor.

### Step 2: Update Commission Calculation Function

```sql
-- Run the updated commission calculation function
-- This is already in commissions-system-fixed.sql
-- You may need to re-run it if you've already created it
```

### Step 3: Verify Existing Data

For existing `link_events` records:
- `net_revenue_amount` is set to `revenue_amount` (no fee data available)
- `stripe_fee_amount` is set to 0
- This is acceptable for historical data

For future conversions:
- Stripe webhook will automatically calculate and store fees
- Manual conversions via API can optionally provide net revenue

## How It Works Now

### Example: €100 Customer Payment

1. **Customer pays**: €100 (gross)
2. **Stripe fees**: €3.45 (3.2% + €0.25 for EU)
3. **SaaS receives**: €96.55 (net)
4. **Commission calculation**:
   - Based on **€96.55** (net revenue)
   - Creator gets 15%: €14.48
   - Platform fee (15% of creator): €2.17
   - Creator net: €12.31
   - Platform fee from SaaS (5% if Starter): €4.83
   - SaaS keeps: €96.55 - €14.48 - €4.83 = €77.24

### Before vs After

**Before** (calculated on gross):
- Commission on €100 = €15
- SaaS actually received €96.55, but commission calculated on €100
- **Problem**: Commission was higher than it should be

**After** (calculated on net):
- Commission on €96.55 = €14.48
- SaaS actually received €96.55, commission calculated on €96.55
- **Correct**: Commission matches actual revenue received

## Database Fields

### `link_events` Table

- `revenue_amount`: Gross revenue (what customer paid)
- `net_revenue_amount`: Net revenue (after Stripe fees)
- `stripe_fee_amount`: Stripe fees deducted

### `commissions` Table

- `gross_revenue_generated`: Gross revenue (for reference)
- `total_revenue_generated`: Net revenue (used for calculations)
- `total_stripe_fees`: Total Stripe fees deducted

## Testing

1. **Test Stripe Webhook**:
   - Make a test payment through a SaaS's Stripe account
   - Verify webhook logs conversion with correct gross/net/fees
   - Check `link_events` table has all three values

2. **Test Commission Calculation**:
   - Calculate commission for a period with conversions
   - Verify `gross_revenue_generated` and `total_revenue_generated` are different
   - Verify `total_stripe_fees` is populated

3. **Test Manual Conversion API**:
   ```bash
   curl -X POST https://your-domain.com/api/track/conversion \
     -H "Authorization: Bearer YOUR_API_KEY" \
     -H "Content-Type: application/json" \
     -d '{
       "session_id": "test-session",
       "revenue": 100,
       "net_revenue": 96.55,
       "stripe_fee": 3.45
     }'
   ```

## Backward Compatibility

- Old records without `net_revenue_amount` will use `revenue_amount` (treated as net)
- This means old commissions may have been slightly over-calculated
- New records will have accurate net revenue tracking
- No breaking changes to existing APIs

## Important Notes

1. **Stripe fees vary** by payment method and location
2. **Actual fees** are fetched from Stripe balance transactions when available
3. **Estimated fees** are used as fallback (EU: 3.2% + €0.25, Non-EU: 3.9% + €0.25)
4. **Commissions are now fair** - calculated on what SaaS actually receives

## Documentation

See `docs/MONEY_FLOW.md` for complete explanation of the money flow and commission system.

