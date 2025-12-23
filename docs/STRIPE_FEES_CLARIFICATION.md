# Stripe Fees - Clarification

## 🤔 THE QUESTION

**User asked**: "Why would Naano pay for anything?"

This is a valid question! Let me clarify how Stripe fees actually work.

---

## 💳 HOW STRIPE FEES ACTUALLY WORK

When you charge a customer via Stripe:

```
SaaS pays: €100
    ↓
Stripe processes payment
    ↓
Stripe automatically deducts fees: €1.75
    ↓
Naano receives: €98.25 (not €100)
```

**Key Point**: Naano doesn't "pay" fees separately. Stripe **automatically deducts** fees from the payment before it reaches Naano's account.

---

## 📊 BP1.md SAYS:

> "Qui paie Stripe ? Naano. Toujours."
> "Sur un prélèvement SaaS de 100 € : ~1,5% + 0,25 € = 1,75 €."

This means:
- **SaaS pays**: €100 (they see this amount)
- **Stripe takes**: €1.75 (automatically deducted)
- **Naano receives**: €98.25 (what actually lands in Naano's account)

So "Naano pays" means "Naano absorbs the cost" - the fees are deducted from what Naano receives, not charged separately.

---

## 💰 OPTIONS FOR HANDLING FEES

### Option 1: Naano Absorbs Fees (Current BP1.md Model)
```
SaaS pays: €2.50 per lead
Stripe takes: ~€0.04 (1.5% + €0.25 on €2.50)
Naano receives: €2.46
Creator gets: €1.20
Naano margin: €2.46 - €1.20 = €1.26 (after fees)
```

**Pros**: Simple for SaaS, transparent pricing
**Cons**: Naano's margin is reduced by fees

---

### Option 2: Pass Fees to SaaS (SaaS Pays More)
```
SaaS pays: €2.50 + fees = €2.54 per lead
Stripe takes: ~€0.04
Naano receives: €2.50 (full amount)
Creator gets: €1.20
Naano margin: €2.50 - €1.20 = €1.30 (no fee impact)
```

**Pros**: Naano keeps full margin
**Cons**: SaaS pays more, pricing less transparent

---

### Option 3: Build Fees into Pricing
```
Adjust lead prices to account for fees:
- Starter: €2.50 → €2.54 (includes fees)
- Growth: €2.00 → €2.03
- Scale: €1.60 → €1.63

SaaS pays: €2.54
Stripe takes: ~€0.04
Naano receives: €2.50
Creator gets: €1.20
Naano margin: €1.30
```

**Pros**: Fees are transparent in pricing
**Cons**: Slightly higher prices for SaaS

---

## 🎯 WHAT BP1.md IMPLIES

Looking at the example in BP1.md:
```
40 leads × €2.50 = €100
Stripe fees: €1.75
Naano receives: €98.25
Creator payouts: 40 × €1.20 = €48
Naano margin: €50.25
```

This suggests **Option 1** - Naano absorbs the fees. The SaaS pays €2.50, but Naano only receives €2.46 after Stripe takes its cut.

---

## ❓ QUESTIONS FOR YOU

1. **Do you want to absorb Stripe fees?** (Current BP1.md model)
   - SaaS pays €2.50, Naano receives ~€2.46
   - Naano's margin is reduced by fees

2. **Do you want to pass fees to SaaS?** (Alternative)
   - SaaS pays €2.54, Naano receives €2.50
   - Naano keeps full margin

3. **Do you want to build fees into pricing?** (Alternative)
   - Adjust prices to account for fees
   - More transparent but higher prices

---

## 💡 MY RECOMMENDATION

**Option 1 (Current BP1.md)** makes sense because:
- ✅ Simple for SaaS (they see one price)
- ✅ Competitive pricing
- ✅ Fees are already accounted for in Naano's margin calculation
- ✅ Standard practice (most platforms absorb payment fees)

The "Naano pays" language just means "fees are deducted from what Naano receives" - which is how Stripe works automatically.

---

## 🔧 TECHNICAL IMPLEMENTATION

Regardless of which option you choose, Stripe works the same way:

```typescript
// Charge SaaS
const paymentIntent = await stripe.paymentIntents.create({
  amount: 250, // €2.50 in cents
  currency: 'eur',
  // ...
});

// Stripe automatically:
// - Charges SaaS: €2.50
// - Deducts fees: ~€0.04
// - Transfers to Naano: ~€2.46
```

The difference is just in **how you present the pricing** to SaaS:
- Option 1: Show €2.50, absorb fees
- Option 2: Show €2.54, pass fees
- Option 3: Show €2.54, but it's built into the price

---

## ✅ WHAT DO YOU WANT?

Please clarify:
1. Should SaaS pay the exact lead price (€2.50), and Naano absorbs fees?
2. Should SaaS pay lead price + fees (€2.54), and Naano keeps full margin?
3. Should we adjust lead prices to include fees in the base price?

Once you decide, I'll update the implementation accordingly!

