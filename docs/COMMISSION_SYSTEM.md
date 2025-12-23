# Commission System Documentation

## Overview

The commission system automatically calculates earnings for creators based on revenue generated through tracked links. Commissions are calculated monthly (calendar month) and are auto-approved.

## How It Works

### 1. Revenue Tracking
- When a user clicks a tracking link and makes a purchase, revenue is logged in `link_events` table
- Event type: `conversion`
- Revenue amount is stored in `revenue_amount`
- Attribution cookie (30 days) links the conversion to the creator

### 2. Commission Calculation

**For each collaboration, monthly:**
- Sum all `revenue_amount` from `link_events` where:
  - `event_type = 'conversion'`
  - `tracked_link_id` belongs to the collaboration
  - `occurred_at` is within the month period

**Commission Breakdown:**
```
Example: €1,000 revenue generated

Creator gets: 15% = €150 (gross)
Platform fee (15% of creator): €22.50
Creator net: €127.50

Platform fee from SaaS (based on tier):
- Starter: 5% = €50
- Growth: 3% = €30
- Scale: 1% = €10

Total platform revenue: €22.50 + €50 = €72.50 (Starter example)
```

### 3. Commission Storage

Commissions are stored in the `commissions` table with:
- `collaboration_id` - Links to the collaboration
- `creator_id` - The creator earning the commission
- `saas_id` - The SaaS company paying
- `period_start` / `period_end` - Month boundaries
- `total_revenue_generated` - Total revenue for the period
- `creator_net_earnings` - Amount creator receives (after platform fee)
- `status` - `pending` → `paid` (auto-approved, no manual approval)

### 4. Payout System

**For Creators:**
- Minimum payout: €50
- Must have Stripe Connect account connected
- Can request payout from Finances page
- System creates Stripe transfer to creator's account
- Updates all commissions to `paid` status

## Database Schema

### Tables

**`commissions`**
- Stores calculated commissions per collaboration per month
- Auto-approved (status = 'pending' by default, changes to 'paid' after payout)

**`commission_payouts`**
- Tracks payout requests and Stripe transfers
- Links to multiple commissions via `payout_id` in commissions table

## Functions

### `calculate_commission_for_period(collaboration_id, period_start, period_end)`
- Calculates commission for a specific collaboration and time period
- Returns commission ID or NULL if no revenue

### `calculate_monthly_commissions(year, month)`
- Calculates commissions for all active collaborations for a specific month
- Returns count of processed collaborations

### `get_creator_earnings_summary(creator_profile_id)`
- Returns pending/paid earnings summary for a creator

### `get_saas_commission_summary(saas_id)`
- Returns total commissions due and revenue generated for a SaaS

## Usage

### Calculate Commissions for Last Month

```sql
-- Example: Calculate for November 2024
SELECT calculate_monthly_commissions(2024, 11);
```

### Calculate for Current Month (So Far)

```sql
-- For a specific collaboration
SELECT calculate_commission_for_period(
  'collaboration-uuid',
  '2024-12-01'::timestamptz,
  NOW()
);
```

### Manual Calculation (Server Action)

```typescript
import { calculateMonthlyCommissions } from '@/lib/commissions';

// Calculate for November 2024
await calculateMonthlyCommissions(2024, 11);
```

## UI Features

### Creator View (Finances Page)
- **Pending Earnings**: Shows total pending commissions
- **Paid Earnings**: Shows total paid commissions
- **Payout Button**: Request payout if ≥ €50 and Stripe connected
- **Commission Breakdown**: Shows how commissions are calculated

### SaaS View (Finances Page → Commissions Tab)
- **Total Revenue Generated**: Sum of all revenue from creators
- **Commissions Due**: Total amount owed to creators
- **Commission History**: List of recent commissions with creator names and amounts

## Testing

### 1. Create Test Revenue
- Use tracking link to generate a conversion
- Log conversion via `/api/track/conversion` with revenue amount

### 2. Calculate Commission
```sql
-- Calculate for current month
SELECT calculate_commission_for_period(
  'your-collaboration-id',
  date_trunc('month', NOW()),
  NOW()
);
```

### 3. Check Creator Earnings
- Go to Finances page as creator
- Should see pending earnings
- If ≥ €50, can request payout

### 4. Test Payout
- Connect Stripe account (if not already)
- Click "Demander un virement"
- Should create Stripe transfer and update commission status

## Monthly Automation (Future)

To automate monthly commission calculation, set up a cron job or scheduled task:

```typescript
// Run on 1st of each month for previous month
const lastMonth = new Date();
lastMonth.setMonth(lastMonth.getMonth() - 1);

await calculateMonthlyCommissions(
  lastMonth.getFullYear(),
  lastMonth.getMonth() + 1
);
```

## Important Notes

1. **Auto-Approval**: Commissions are automatically approved (no manual review)
2. **Monthly Periods**: Commissions are calculated per calendar month
3. **Minimum Payout**: €50 minimum for creators to request payout
4. **Stripe Required**: Creators must have Stripe Connect account to receive payouts
5. **Historical Accuracy**: Commission rates are stored in the commission record for historical accuracy (if SaaS changes tier, old commissions keep old rate)

