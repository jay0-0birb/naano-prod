# BP1 - Pricing & Stripe Fees - Quick Reference

## ✅ CORRECTED UNDERSTANDING

### 1. Pricing Varies by SaaS Plan
```
Starter: €2.50 per lead
Growth: €2.00 per lead
Scale: €1.60 per lead
Creator: €1.20 per lead (ALWAYS, regardless of plan)
```

### 2. Stripe Fees - Only Naano Pays
```
SaaS pays: Full lead price (€2.50 / €2.00 / €1.60) - NO fees
Creator gets: Full €1.20 - NO fees
Naano pays: Stripe fees on total billing (~1.5% + €0.25)
```

---

## 💰 PER LEAD BREAKDOWN

| Plan | SaaS Pays | Creator Gets | Naano Margin (Brut) |
|------|-----------|--------------|---------------------|
| Starter | €2.50 | €1.20 | €1.30 |
| Growth | €2.00 | €1.20 | €0.80 |
| Scale | €1.60 | €1.20 | €0.40 |

**Note**: Stripe fees are NOT per lead, but on total billing amount.

---

## 📊 BILLING EXAMPLE (40 Leads, Starter)

### What Happens:
```
40 leads × €2.50 = €100 total
    ↓
Stripe charges SaaS: €100 (SaaS pays full, no fees)
    ↓
Stripe fees: €1.75 (1.5% + €0.25) - Naano pays
    ↓
Naano receives: €100 - €1.75 = €98.25
    ↓
Creator wallets: 40 × €1.20 = €48 (available)
    ↓
Naano net margin: €98.25 - €48 = €50.25
```

### Breakdown:
- **SaaS pays**: €100 (no fees)
- **Creator gets**: €48 (no fees)
- **Naano receives**: €98.25 (after Stripe fees)
- **Naano net margin**: €50.25

---

## 🔧 KEY FUNCTIONS NEEDED

```sql
-- Get lead price based on SaaS plan
get_lead_price_by_plan('starter') → €2.50
get_lead_price_by_plan('growth') → €2.00
get_lead_price_by_plan('scale') → €1.60

-- Calculate Stripe fees (on total billing)
calculate_stripe_fees(€100) → €1.75

-- Creator earnings (always fixed)
creator_earnings = €1.20 (constant)

-- Naano margin (brut per lead)
naano_margin_brut = lead_price - €1.20
```

---

## ⚠️ CRITICAL RULES

1. **Lead price MUST be determined by SaaS plan** at lead creation time
2. **Creator always gets €1.20** - never varies
3. **Stripe fees only affect Naano** - deducted from total billing
4. **SaaS pays full price** - no fees deducted
5. **Creator receives full €1.20** - no fees deducted

---

## 🗄️ DATABASE FIELDS

### `leads` table:
- `saas_plan` - 'starter' | 'growth' | 'scale'
- `lead_value` - €2.50 / €2.00 / €1.60 (based on plan)
- `creator_earnings` - €1.20 (always)
- `naano_margin_brut` - lead_value - 1.20

### `billing_invoices` table:
- `amount_ht` - Total billing (sum of lead_values)
- `stripe_fee_amount` - Stripe fees (calculated on amount_ht)
- `naano_received_amount` - amount_ht - stripe_fee_amount

---

## ✅ IMPLEMENTATION CHECKLIST

- [ ] Get SaaS plan when creating lead
- [ ] Calculate lead_price based on plan
- [ ] Store lead_value in leads table
- [ ] Always use €1.20 for creator earnings
- [ ] Calculate Stripe fees on total billing (not per lead)
- [ ] Store Stripe fees in billing_invoices
- [ ] Deduct Stripe fees from Naano margin only
- [ ] Verify SaaS pays full price (no fees)
- [ ] Verify Creator gets full €1.20 (no fees)

