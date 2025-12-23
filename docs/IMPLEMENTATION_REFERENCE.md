# Implementation Reference - Which Document to Follow

## 📘 PRIMARY SOURCE: BP1.md

**BP1.md** is the **MASTER DOCUMENT** and source of truth for:
- Business model
- Pricing structure
- Payment flows
- Invoice requirements
- All business rules

**I will follow BP1.md exactly.**

---

## 🔧 TECHNICAL GUIDE: BP1_EXACT_IMPLEMENTATION.md

**BP1_EXACT_IMPLEMENTATION.md** is the **TECHNICAL IMPLEMENTATION PLAN** I created from BP1.md. It contains:
- Database schema derived from BP1.md
- Functions and calculations from BP1.md
- Implementation logic based on BP1.md
- Code examples following BP1.md

**This is a guide, but BP1.md is the source of truth.**

---

## ✅ IMPLEMENTATION APPROACH

1. **Read BP1.md** for all business rules
2. **Use BP1_EXACT_IMPLEMENTATION.md** as technical reference
3. **Verify everything against BP1.md** before implementing
4. **If there's any conflict, BP1.md wins**

---

## 📋 KEY RULES FROM BP1.md (To Follow Exactly)

### Pricing:
- STARTER: 0€/mo, 2,50€ per lead
- GROWTH: 99€/mo, 2,00€ per lead
- SCALE: 199€/mo, 1,60€ per lead
- Creator: Always 1,20€ per lead (fixed)

### Billing:
- Threshold: €100 OR end of month
- Stripe fees: ~1.5% + €0.25 (paid by Naano)
- Invoice: Generic (no creator names), TVA split (0% talent, 20% tech)

### Payout:
- Threshold: €50 available balance
- Auto or manual
- Generate invoice/receipt for creator

### Card Requirement:
- SaaS MUST have card before accessing dashboard
- Pre-authorization (€0 or €1) at signup

---

## 🎯 IMPLEMENTATION ORDER

1. **Database Schema** (from BP1_EXACT_IMPLEMENTATION.md, verified against BP1.md)
2. **Lead Creation** (get SaaS plan, calculate price, store in leads table)
3. **Wallet System** (pending/available balance)
4. **Threshold Billing** (€100 or month-end)
5. **Payout System** (€50 threshold)
6. **Invoice Generation** (SaaS generic, Creator with SIRET check)

---

## ✅ CONFIRMATION

**I will build following:**
- ✅ **BP1.md** as the master business document
- ✅ **BP1_EXACT_IMPLEMENTATION.md** as the technical guide
- ✅ Verify every implementation against BP1.md

**Ready to start implementation!**

