# 🧪 PRIORITY 1 FEATURES - TESTING CHECKLIST

**Date:** $(date +%Y-%m-%d)
**Status:** In Progress

---

## 📋 PRIORITY 1 FEATURES (FROM PRD)

### ✅ 1. PROFIL CRÉATEUR (Creator Profile)
**Status:** ✅ Marked as DONE  
**Test Status:** 🔍 TO TEST

**What to test:**
- [ ] Register as Creator (influencer role)
- [ ] Complete onboarding form
- [ ] Fill in: Bio, LinkedIn URL, Followers count, Engagement rate, Expertise sectors
- [ ] Profile saves correctly
- [ ] Profile displays in settings

**How to test:**
1. Go to `/register`
2. Create account with role "influencer"
3. Complete onboarding at `/dashboard/onboarding`
4. Verify data in Supabase: Table Editor → `creator_profiles`

**Files to check:**
- `app/(dashboard)/dashboard/onboarding/page.tsx`
- `components/onboarding/creator-onboarding-form.tsx`

---

### ✅ 2. PROFIL SAAS (SaaS Profile)
**Status:** ✅ Marked as DONE  
**Test Status:** 🔍 TO TEST

**What to test:**
- [ ] Register as SaaS (saas role)
- [ ] Complete onboarding form
- [ ] Fill in: Company name, Description, Website, Industry, Commission rate, Logo
- [ ] Profile saves correctly
- [ ] Profile displays in settings

**How to test:**
1. Go to `/register`
2. Create account with role "saas"
3. Complete onboarding at `/dashboard/onboarding`
4. Verify data in Supabase: Table Editor → `saas_companies`

**Files to check:**
- `app/(dashboard)/dashboard/onboarding/page.tsx`
- `components/onboarding/saas-onboarding-form.tsx`

---

### ✅ 3. MARKETPLACE/DISCOVERY (Creator browses SaaS)
**Status:** ✅ Marked as DONE (but search/filters broken)  
**Test Status:** 🔍 TO TEST

**What to test:**
- [ ] Creator can see list of SaaS companies
- [ ] Company cards show: Logo, Name, Description, Industry, Commission rate
- [ ] Cards are clickable
- [ ] ⚠️ Search bar (known to be non-functional)
- [ ] ⚠️ Filters button (known to be non-functional)

**How to test:**
1. Login as Creator
2. Go to `/dashboard/marketplace`
3. Should see grid of SaaS companies
4. Try searching (won't work - needs fix)

**Files to check:**
- `app/(dashboard)/dashboard/marketplace/page.tsx`
- `components/marketplace/saas-card.tsx`

---

### ✅ 4. MARKETPLACE AMBASSADEURS (SaaS browses Creators)
**Status:** ✅ JUST IMPLEMENTED  
**Test Status:** 🔍 TO TEST

**What to test:**
- [ ] SaaS can see "Créateurs" tab in sidebar
- [ ] SaaS can browse list of creators
- [ ] Creator cards show: Avatar, Name, Bio, Followers, Engagement, Sectors
- [ ] "Inviter" button works
- [ ] Invitation modal opens
- [ ] Can send invitation message
- [ ] Invitation appears in applications

**How to test:**
1. Login as SaaS
2. Click "Créateurs" in sidebar
3. Should see grid of creators
4. Click "Inviter" on a creator
5. Write message and send
6. Check Supabase: `applications` table should have new row

**Files to check:**
- `app/(dashboard)/dashboard/marketplace/page.tsx`
- `components/marketplace/creator-card.tsx`

---

### ✅ 5. CANDIDATURE "AMBASSADEUR" (Application System)
**Status:** ✅ Marked as DONE  
**Test Status:** 🔍 TO TEST

**What to test:**
- [ ] Creator can apply to SaaS from marketplace
- [ ] Application modal opens
- [ ] Can write application message
- [ ] Application submits successfully
- [ ] Application appears in creator's "Mes candidatures"
- [ ] Application appears in SaaS "Candidatures"
- [ ] SaaS can accept application
- [ ] SaaS can reject application
- [ ] Status updates correctly

**How to test:**
1. Login as Creator
2. Go to `/dashboard/marketplace`
3. Click "Postuler" on a SaaS card
4. Write message and submit
5. Go to `/dashboard/applications` - should see application
6. Login as SaaS
7. Go to `/dashboard/candidates` - should see application
8. Accept or reject it
9. Check Supabase: `applications` table status should update

**Files to check:**
- `components/marketplace/saas-card.tsx`
- `app/(dashboard)/dashboard/applications/page.tsx`
- `app/(dashboard)/dashboard/candidates/page.tsx`

---

### ✅ 6. ESPACE DE TRAVAIL PARTAGÉ (Collaboration Workspace)
**Status:** ✅ Marked as DONE  
**Test Status:** 🔍 TO TEST

**What to test:**
- [ ] When application accepted, collaboration is created
- [ ] Both parties can access collaboration page
- [ ] Collaboration shows: SaaS info, Creator info, Status
- [ ] Can view collaboration details
- [ ] Collaboration appears in `/dashboard/collaborations`

**How to test:**
1. Accept an application (from previous test)
2. Go to `/dashboard/collaborations`
3. Should see new collaboration
4. Click on it to open workspace
5. Check Supabase: `collaborations` table should have new row

**Files to check:**
- `app/(dashboard)/dashboard/collaborations/page.tsx`
- `app/(dashboard)/dashboard/collaborations/[id]/page.tsx`

---

### ❌ 7. LIEN TRACKÉ UNIQUE (Tracked Links) ⭐ CRITICAL
**Status:** ❌ NOT IMPLEMENTED  
**Test Status:** ⚠️ NEEDS IMPLEMENTATION

**What needs to exist:**
- [ ] Unique tracking URL generated per collaboration
- [ ] Link displayed in collaboration workspace
- [ ] Copy button to copy link
- [ ] Redirect endpoint at `/t/[hash]`
- [ ] Clicks are logged in database
- [ ] Analytics showing click count

**Database needed:**
- `tracked_links` table
- `link_clicks` table

**This is CRITICAL - core value proposition!**

---

### ✅ 8. UPLOAD POST (Post Submission)
**Status:** ✅ Marked as DONE  
**Test Status:** 🔍 TO TEST

**What to test:**
- [ ] Creator can submit LinkedIn post URL
- [ ] Can upload screenshot (optional)
- [ ] Post appears in collaboration workspace
- [ ] SaaS can see submitted post
- [ ] SaaS can validate post
- [ ] Validation status updates

**How to test:**
1. Login as Creator with active collaboration
2. Go to collaboration workspace
3. Submit post form with LinkedIn URL
4. Upload screenshot (optional)
5. Submit
6. Login as SaaS
7. View same collaboration
8. Should see submitted post
9. Click "Valider" button
10. Check Supabase: `publication_proofs` table

**Files to check:**
- `app/(dashboard)/dashboard/collaborations/[id]/page.tsx`
- `components/collaborations/submit-post-form.tsx`

---

### ✅ 9. DASHBOARD CRÉATEUR (Creator Dashboard)
**Status:** ✅ Marked as DONE  
**Test Status:** 🔍 TO TEST

**What to test:**
- [ ] Shows welcome message with name
- [ ] Stats: Pending applications, Active collaborations, Messages
- [ ] Quick actions: "Explorer la Marketplace", "Mes candidatures"
- [ ] Stats are accurate

**How to test:**
1. Login as Creator
2. Go to `/dashboard`
3. Verify stats match reality
4. Check Supabase counts vs displayed counts

**Files to check:**
- `app/(dashboard)/dashboard/page.tsx`

---

### ✅ 10. DASHBOARD SAAS (SaaS Dashboard)
**Status:** ✅ Marked as DONE  
**Test Status:** 🔍 TO TEST

**What to test:**
- [ ] Shows welcome message with name
- [ ] Stats: Pending applications, Active collaborations, Messages
- [ ] Quick actions: "Voir les candidatures", "Collaborations"
- [ ] Stats are accurate

**How to test:**
1. Login as SaaS
2. Go to `/dashboard`
3. Verify stats match reality
4. Check Supabase counts vs displayed counts

**Files to check:**
- `app/(dashboard)/dashboard/page.tsx`

---

### ❌ 11. SUBSCRIPTION LIMITS (Free/Pro) ⭐ CRITICAL
**Status:** ❌ NOT IMPLEMENTED  
**Test Status:** ⚠️ NEEDS IMPLEMENTATION

**What needs to exist:**
- [ ] Free plan: Max 3 ambassadors
- [ ] Pro plan: Unlimited ambassadors
- [ ] Block accepting 4th application on free plan
- [ ] Upgrade modal when limit reached
- [ ] Stripe subscription checkout
- [ ] Webhook handlers

**Database needed:**
- `subscriptions` table
- `subscription_usage` tracking

**This is CRITICAL - business model!**

---

### ❌ 12. ACADEMY ⭐ CRITICAL
**Status:** ❌ NOT IMPLEMENTED  
**Test Status:** ⚠️ NEEDS IMPLEMENTATION

**What needs to exist:**
- [ ] `/dashboard/academy` page
- [ ] Module cards for Creators
- [ ] Module cards for SaaS
- [ ] Expandable content
- [ ] Templates, guides, checklists

**This is CRITICAL - user education!**

---

### ❌ 13. EMAIL NOTIFICATIONS ⭐ CRITICAL
**Status:** ❌ NOT IMPLEMENTED  
**Test Status:** ⚠️ NEEDS IMPLEMENTATION

**What needs to exist:**
- [ ] Email on application accepted
- [ ] Email on application rejected
- [ ] Email on new application received
- [ ] Email on post submitted
- [ ] Email on post validated

**This is CRITICAL - user engagement!**

---

### ❌ 14. COMMISSION CALCULATION ⭐ CRITICAL
**Status:** ❌ NOT IMPLEMENTED  
**Test Status:** ⚠️ NEEDS IMPLEMENTATION

**What needs to exist:**
- [ ] Commission calculation logic
- [ ] Display earnings in collaboration
- [ ] Breakdown: Total, Konex fee (15%), Creator earnings
- [ ] Payout system via Stripe Connect

**Database needed:**
- `commissions` table
- `commission_events` table

**This is CRITICAL - payment system!**

---

### ❌ 15. ADMIN APPROVAL SYSTEM
**Status:** ❌ NOT IMPLEMENTED  
**Test Status:** ⚠️ NEEDS IMPLEMENTATION

**What needs to exist:**
- [ ] Admin dashboard to review profiles
- [ ] Approve/reject profiles
- [ ] Waiting page for pending users
- [ ] Email notifications on approval/rejection

**Database needed:**
- Add approval fields to profiles

---

## 📊 SUMMARY

**Total Features:** 15  
**Implemented:** 10 (67%)  
**To Implement:** 5 (33%)

**Next Steps:**
1. Test all "DONE" features (1-10)
2. Fix any broken features
3. Implement missing critical features (7, 11, 12, 13, 14)

