# 🚀 KONEX - COMPLETE IMPLEMENTATION PLAN

**Version:** 2.0  
**Date:** 28 Novembre 2025  
**Status:** Ready for Development

---

## 📊 EXECUTIVE SUMMARY

**Current State:** ~65% of MVP completed

- ✅ Core infrastructure (auth, database, UI) is solid
- ✅ User flows (onboarding, applications, collaborations) work well
- ❌ Missing critical features: tracking links, subscriptions, academy
- ⚠️ Some frontend elements need fixes (search, filters, notifications)

**Estimated Work:** 4-5 weeks for full MVP completion (all Priority 1 features)

---

## ✅ PRIORITY 1 FEATURES CHECKLIST (FROM PRD)

This implementation plan covers **100% of Priority 1 "MUST HAVE" features** from the PRD:

| PRD Feature                         | Status      | Implementation Section                    |
| ----------------------------------- | ----------- | ----------------------------------------- |
| **Profil Créateur**                 | ✅ **DONE** | Already implemented                       |
| **Profil SaaS**                     | ✅ **DONE** | Already implemented                       |
| **Marketplace/Discovery**           | ✅ **DONE** | Already implemented + Section 1.1 (fixes) |
| **Marketplace Ambassadeurs (SaaS)** | ❌ **TODO** | Section 2.4                               |
| **Candidature "Ambassadeur"**       | ✅ **DONE** | Already implemented                       |
| **Espace de Travail Partagé**       | ✅ **DONE** | Already implemented                       |
| **Lien Tracké Unique**              | ❌ **TODO** | Section 2.1 ⭐                            |
| **Upload Post**                     | ✅ **DONE** | Already implemented                       |
| **Dashboard Créateur**              | ✅ **DONE** | Already implemented                       |
| **Dashboard SaaS**                  | ✅ **DONE** | Already implemented                       |
| **Subscription Limits (Free/Pro)**  | ❌ **TODO** | Section 2.2 ⭐                            |
| **Academy**                         | ❌ **TODO** | Section 2.3 ⭐                            |
| **Email Notifications**             | ❌ **TODO** | Section 2.5 ⭐                            |
| **Commission Calculation**          | ❌ **TODO** | Section 2.6 ⭐                            |
| **Admin Approval System**           | ❌ **TODO** | Section 2.7                               |

**Summary:**

- ✅ **8 features completed** (53%)
- ❌ **7 features to build** (47%)
- ⭐ = Critical path features

---

## 🔧 PART 1: FRONTEND FIXES (QUICK WINS)

### Priority: HIGH | Estimated Time: 2-3 days

These are existing UI elements that don't work or are incomplete:

### 1.1 Marketplace Search & Filters (NON-FUNCTIONAL)

**Location:** `/app/(dashboard)/dashboard/marketplace/page.tsx`

**Issue:** Search input and filter button are static UI with no functionality

**Fix Required:**

- Add client-side filtering or server action
- Convert to 'use client' or create a separate client component
- Add state for search term and filters
- Filter companies based on: company name, industry, commission rate

**Files to modify:**

- `app/(dashboard)/dashboard/marketplace/page.tsx`
- Create: `app/(dashboard)/dashboard/marketplace/actions.ts` (if using server actions)

---

### 1.2 Settings - Change Password (NON-FUNCTIONAL)

**Location:** `/app/(dashboard)/dashboard/settings/page.tsx` (line 178)

**Issue:** "Changer le mot de passe" button does nothing

**Fix Required:**

- Add modal/form for password change
- Use Supabase `auth.updateUser()` API
- Add validation (current password, new password, confirm)

**Files to create:**

- `components/settings/change-password-modal.tsx`

---

### 1.3 Settings - Notification Preferences (NON-FUNCTIONAL)

**Location:** `/app/(dashboard)/dashboard/settings/page.tsx` (lines 151-162)

**Issue:** Checkboxes are static, no save functionality

**Fix Required:**

- Create `notification_preferences` table in database
- Add server action to save preferences
- Make checkboxes functional with state management

**Database Schema Needed:**

- Table: `notification_preferences` with fields: user_id, new_applications, new_messages, collaboration_updates

---

### 1.4 Messages Page (INCOMPLETE)

**Location:** `/app/(dashboard)/dashboard/messages/page.tsx`

**Issue:** Page exists but needs full chat UI implementation

**Fix Required:**

- Build chat interface with conversation list + message thread
- Real-time updates (Supabase Realtime subscriptions)
- Message sending/receiving functionality

**Components to verify:**

- `components/messages/chat-view.tsx`
- `components/messages/conversation-list.tsx`

---

### 1.5 Creator Marketplace for SaaS (MISSING PAGE)

**PRD Requirement:** "Le saas accède aussi à une market place des ambassadeurs"

**Current:** SaaS can only see applicants, not browse all creators

**Fix Required:**

- Create `/app/(dashboard)/dashboard/creators/page.tsx`
- List all creator profiles (public)
- Add filters: followers, engagement, sectors
- SaaS can "invite" creators (reverse application flow)

**New Components:**

- `components/creators/creator-card.tsx`
- `components/creators/invite-modal.tsx`

---

## 🎯 PART 2: CRITICAL MISSING FEATURES (MVP BLOCKERS)

### Priority: CRITICAL | Estimated Time: 2-3 weeks

---

## 2.1 TRACKED LINKS SYSTEM ⭐ (HIGHEST PRIORITY)

**Why Critical:** This is the core value proposition - tracking clicks/conversions

### What to Build:

**Database Tables:**

- `tracked_links` - Store unique tracking URLs per collaboration
- `link_clicks` - Log every click with metadata (IP, user agent, referrer, country)

**Key Features:**

- Auto-generate unique hash per collaboration (format: `creator-saas-randomhash`)
- Redirect endpoint at `/t/[hash]` that logs clicks and redirects to SaaS website
- Add UTM parameters to destination URL (utm_source=konex, utm_medium=creator)
- Display tracked link prominently in collaboration workspace
- Analytics dashboard showing clicks, conversions, revenue per collaboration

**Files to Create/Modify:**

- Database: Add tables to `supabase/schema.sql`
- API: Create `/app/t/[hash]/route.ts` for redirect endpoint
- Actions: Add link generation function to collaboration actions
- UI: Modify collaboration page to display tracked link with copy button
- Component: Create analytics card component

**Estimated Time:** 4-5 days

---

## 2.2 SUBSCRIPTION SYSTEM & LIMITS ⭐

**Why Critical:** This is the business model - Free vs Pro plans

### What to Build:

**Database Tables:**

- `subscriptions` - Track user subscription plans (free/pro)
- `subscription_usage` - Track active ambassador count

**Key Features:**

- FREE Plan: Max 3 ambassadors, block accepting 4th application
- PRO Plan: Unlimited ambassadors (€99/month via Stripe)
- Stripe subscription checkout flow
- Webhook handlers for subscription events
- Upgrade modal when limit reached
- Display current plan in settings

**Business Logic:**

- Function to check if SaaS can accept more ambassadors
- Automatic subscription creation on profile creation (default: free)
- Block application acceptance if limit reached
- Show upgrade prompt

**Files to Create/Modify:**

- Database: Add subscription tables and functions
- API: Create `/app/api/stripe/subscription/route.ts` for checkout
- API: Modify webhook handler for subscription events
- Actions: Add limit check to application acceptance flow
- Component: Create upgrade modal
- UI: Display plan badge in settings

**Estimated Time:** 4-5 days

---

## 2.3 ACADEMY SECTION 📚

**Why Critical:** PRD lists this as MUST HAVE for user education

### What to Build:

**Page Structure:**

- Main academy page at `/dashboard/academy`
- Expandable module cards
- Separate sections for Creators and SaaS

**Content Modules:**

**For Creators:**

- Les Bases du Post Viral (video/guide)
- Templates Prêts à l'Emploi (copyable templates)
- Checklist Avant Post
- FAQ Créateurs

**For SaaS:**

- Comment Recruter des Ambassadeurs
- Mesurer le ROI
- Templates de Brief

**Implementation Options:**

- Start with static content (JSON or MDX files)
- Later: Embed Notion page via iframe for easier content management

**Files to Create:**

- `app/(dashboard)/dashboard/academy/page.tsx`
- `components/academy/module-card.tsx`
- `lib/academy-content.ts` (content data)

**Estimated Time:** 2-3 days

---

## 2.4 CREATOR MARKETPLACE FOR SAAS

**Why Important:** PRD specifies SaaS should be able to browse creators

### What to Build:

**Page Features:**

- Browse all creator profiles (public)
- Filters: sector, followers range, engagement rate
- Creator cards showing stats, bio, sectors
- "Invite to collaborate" button (reverse of application flow)

**Invite System:**

- SaaS can invite creators directly
- Creates application with status 'invited'
- Creator receives notification and can accept/reject
- Need to add 'invited' status to applications table

**Files to Create:**

- `app/(dashboard)/dashboard/creators/page.tsx`
- `app/(dashboard)/dashboard/creators/actions.ts`
- `components/creators/creator-card.tsx`
- `components/creators/invite-modal.tsx`

**Database Changes:**

- Add 'invited' status to applications table constraint

**Estimated Time:** 3 days

---

## 2.5 EMAIL NOTIFICATIONS SYSTEM 📧

**Why Critical:** PRD mentions multiple email triggers - essential for user engagement

### What to Build:

**Email Service Setup:**

- Use Resend (or SendGrid/Postmark)
- Create email utility functions
- Create email templates (HTML)
- Log all sent emails in database

**Email Triggers:**

1. **Application Accepted** → Creator

   - Congratulations message
   - Link to collaboration workspace

2. **Application Rejected** → Creator

   - Polite rejection message
   - Encourage to apply elsewhere

3. **New Application** → SaaS

   - Creator applied notification
   - Link to review application

4. **Post Submitted** → SaaS

   - Creator published post notification
   - Reminder to engage with post
   - Link to validate post

5. **Post Validated** → Creator
   - Post approved notification
   - Stats now tracking

**Database Table:**

- `email_logs` - Track all sent emails (recipient, type, status, metadata)

**Files to Create:**

- `lib/email.ts` - Email utility functions
- `lib/email-templates.ts` - HTML templates
- Modify existing action files to trigger emails

**Estimated Time:** 2-3 days

---

## 2.6 COMMISSION CALCULATION & PAYMENT FLOW 💰

**Why Critical:** PRD specifies commission rates and payment system

### What to Build:

**Database Tables:**

- `commissions` - Track earnings per collaboration per period
- `commission_events` - Track individual earning events (clicks, signups, purchases)

**Key Features:**

- Calculate monthly commissions based on tracked link clicks
- Display earnings in collaboration workspace (total, pending)
- Commission breakdown: Total amount, Konex fee (15%), Creator earnings
- Payout via Stripe Connect transfers
- Commission approval workflow

**Business Logic:**

- Function to calculate commission for a collaboration period
- Click value configurable (e.g., €0.50 per click)
- Konex takes 15% of creator earnings
- Commission statuses: pending, approved, paid, cancelled

**Files to Create:**

- Database: Add commission tables and calculation function
- Actions: Add commission calculation function
- UI: Display earnings in collaboration page
- API: Create payout endpoint using Stripe Connect

**Estimated Time:** 3-4 days

---

## 2.7 ADMIN APPROVAL SYSTEM 👮

**Why Important:** PRD mentions manual validation of creator profiles (24-48h)

### What to Build:

**Admin Features:**

- Admin dashboard to review pending profiles
- Approve/reject profiles with reasons
- Audit log of admin actions
- Waiting page for users pending approval

**Approval Flow:**

- New profiles default to 'pending' status
- Middleware blocks unapproved users from accessing dashboard
- Redirect to waiting page with 24-48h message
- Admin can approve/reject with optional reason
- Email notification on approval/rejection

**Database Changes:**

- Add approval fields to profiles table: approval_status, approved_at, approved_by, rejection_reason
- Create admin_actions table for audit log

**Files to Create:**

- `app/(dashboard)/dashboard/admin/page.tsx`
- `app/(dashboard)/dashboard/waiting/page.tsx`
- `components/admin/profile-card.tsx`
- `app/api/admin/approve-profile/route.ts`
- `app/api/admin/reject-profile/route.ts`
- Modify middleware to check approval status

**Estimated Time:** 2-3 days

---

## 📋 PART 3: TASK BREAKDOWN & TIMELINE

### Week 1: Frontend Fixes + Tracked Links

**Days 1-2: Frontend Fixes**

- [ ] Fix marketplace search & filters
- [ ] Fix settings password change
- [ ] Fix notification preferences
- [ ] Test messages page functionality

**Days 3-5: Tracked Links System**

- [ ] Create database tables (tracked_links, link_clicks)
- [ ] Build tracking redirect endpoint (/t/[hash])
- [ ] Add link generation to collaboration workspace
- [ ] Build analytics dashboard component
- [ ] Test end-to-end tracking flow

---

### Week 2: Subscriptions + Email System

**Days 1-3: Subscription System**

- [ ] Create subscriptions tables
- [ ] Add Stripe subscription checkout
- [ ] Implement webhook handlers
- [ ] Add limit checks to accept flow
- [ ] Build upgrade modal UI
- [ ] Test free → pro upgrade flow

**Days 4-5: Email Notifications**

- [ ] Set up Resend email service
- [ ] Create email templates
- [ ] Integrate emails into application flow
- [ ] Integrate emails into post submission flow
- [ ] Test email deliverability

---

### Week 3: Academy + Commission System

**Days 1-2: Academy Section**

- [ ] Create academy page structure
- [ ] Build module card components
- [ ] Add static content (guides, templates)
- [ ] Test expandable sections
- [ ] (Optional) Add Notion embed

**Days 3-5: Commission & Payment System**

- [ ] Create commissions tables
- [ ] Build commission calculation function
- [ ] Display earnings in collaboration workspace
- [ ] Build payout API endpoint
- [ ] Test Stripe Connect payouts

---

### Week 4: Creator Marketplace + Admin System

**Days 1-2: Creator Marketplace**

- [ ] Create creators page for SaaS
- [ ] Build creator card component
- [ ] Add invite modal & flow
- [ ] Implement invite system (reverse application)
- [ ] Add filters (sector, followers)

**Days 3-4: Admin Approval System**

- [ ] Add approval fields to database
- [ ] Create admin dashboard
- [ ] Build profile approval UI
- [ ] Add waiting page for pending users
- [ ] Integrate approval emails

**Day 5: Final Polish & Testing**

- [ ] End-to-end testing of all flows
- [ ] Fix any bugs discovered
- [ ] Performance optimization
- [ ] Mobile responsiveness check

---

### Week 5: Launch Prep

**Days 1-2: Security & Performance**

- [ ] Final security audit
- [ ] Add rate limiting middleware
- [ ] Set up error tracking (Sentry)
- [ ] Performance testing & optimization
- [ ] Database backup strategy

**Days 3-4: Documentation & Deployment**

- [ ] Update all documentation
- [ ] Create admin user guide
- [ ] Set up production environment
- [ ] Run database migrations on production
- [ ] Configure production environment variables

**Day 5: Launch**

- [ ] Deploy to production
- [ ] Monitor error logs for 24h
- [ ] Test all critical flows in production
- [ ] Verify Stripe webhooks
- [ ] Check email deliverability

---

## 🎯 PRIORITY MATRIX

### Must Do (MVP Blockers) - Priority 1 from PRD

1. **Tracked Links System** ⭐ - Core value prop (Section 2.1)
2. **Subscription Limits** ⭐ - Business model (Section 2.2)
3. **Email Notifications** ⭐ - User engagement & communication (Section 2.5)
4. **Commission Calculation** ⭐ - Payment system (Section 2.6)
5. **Academy Section** ⭐ - User education (Section 2.3)
6. **Fix Marketplace Search** - User experience (Section 1.1)

### Should Do (Important for launch)

7. **Creator Marketplace for SaaS** - Discovery (Section 2.4)
8. **Admin Approval System** - Quality control (Section 2.7)
9. **Frontend Fixes** - Polish existing features (Section 1.2-1.5)

### Nice to Have (Post-MVP)

10. **Real-time Messaging** - Currently basic
11. **Advanced Analytics** - Charts, graphs, trends
12. **Conversion Tracking** - Cookie-based attribution
13. **Auto-tagging** - AI-powered creator matching

---

## 🚨 KNOWN ISSUES & TECHNICAL DEBT

### Current Issues:

1. **Search/Filters** - Static UI, no functionality
2. **Notifications** - Checkboxes don't save
3. **Password Change** - Button does nothing
4. **Messages** - Need to verify real-time functionality

### Technical Debt:

1. **Limited Analytics** - Just counts, no charts/graphs yet
2. **No Rate Limiting** - API routes unprotected
3. **No Error Tracking** - Should add Sentry or similar
4. **No Conversion Tracking** - Cookie-based attribution not implemented
5. **Basic Messaging** - Real-time features could be improved

---

## 📦 DEPENDENCIES TO ADD

**NPM Packages:**

- `resend` - Email service
- `recharts` - For analytics charts (optional)
- `react-hot-toast` - Better notifications
- `@radix-ui/react-dialog` - Better modals
- `@radix-ui/react-select` - Better dropdowns
- `date-fns` - Date formatting

---

## 🔐 ENVIRONMENT VARIABLES NEEDED

**Stripe:**

- `STRIPE_PRO_PRICE_ID` - Create in Stripe Dashboard
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`

**Email Service:**

- `RESEND_API_KEY` (or SENDGRID_API_KEY)

**App URL:**

- `NEXT_PUBLIC_APP_URL` - For tracked links (e.g., https://konex.app or http://localhost:3001)

**Optional:**

- `NEXT_PUBLIC_POSTHOG_KEY` - Analytics

---

## ✅ TESTING CHECKLIST

### User Flows to Test:

- [ ] Creator onboarding → Browse SaaS → Apply → Get accepted → Collaboration workspace
- [ ] SaaS onboarding → Receive application → Accept → Create collaboration
- [ ] Creator submits post → SaaS validates → Stats update
- [ ] Creator generates tracked link → Share → Clicks are logged
- [ ] SaaS hits 3 ambassador limit → Upgrade modal → Stripe checkout → Pro access
- [ ] Messages between creator and SaaS
- [ ] Stripe Connect for creator payouts

### Edge Cases:

- [ ] What if SaaS has no website? (tracked link fails)
- [ ] What if creator applies twice to same SaaS?
- [ ] What if subscription payment fails?
- [ ] What if tracked link is shared publicly (bot traffic)?

---

## 📊 SUCCESS METRICS

### MVP Launch Criteria:

✅ All Priority 1 features from PRD implemented  
✅ No critical bugs in core flows  
✅ Mobile responsive on all pages  
✅ Subscription system working (Free + Pro)  
✅ Tracked links generating and logging clicks  
✅ At least 10 test users can complete full flow

### Post-Launch Monitoring:

- Track application acceptance rate
- Monitor tracked link click-through rates
- Measure Free → Pro conversion
- User retention (7-day, 30-day)

---

## 🎨 DESIGN NOTES

**Current Design System:**

- Dark theme (bg: `#0A0C10`, borders: `white/10`)
- Primary colors: Blue (`#3B82F6`), Purple (`#8B5CF6`)
- Accent: Green (success), Amber (warning), Red (error)
- Rounded corners: `rounded-xl` (12px), `rounded-2xl` (16px)
- Consistent spacing: `gap-4`, `p-6`, `mb-8`

**Maintain Consistency:**

- All cards use `bg-[#0A0C10] border border-white/10 rounded-2xl`
- Buttons: `bg-blue-600 hover:bg-blue-500 rounded-xl`
- Icons from `lucide-react` only
- Font: System default (good performance)

---

## 🚀 DEPLOYMENT CHECKLIST

### Before Production:

- [ ] Run database migrations on production Supabase
- [ ] Set all environment variables in Vercel/hosting
- [ ] Test Stripe webhooks with production keys
- [ ] Enable RLS policies on all tables
- [ ] Set up custom domain
- [ ] Configure CORS for API routes
- [ ] Add rate limiting middleware
- [ ] Set up error tracking (Sentry)
- [ ] Create backup strategy for database

### Post-Deployment:

- [ ] Monitor error logs for 24h
- [ ] Test all critical flows in production
- [ ] Verify Stripe webhooks are received
- [ ] Check email deliverability
- [ ] Performance audit (Lighthouse)

---

## 📞 SUPPORT & MAINTENANCE

### Ongoing Tasks:

- Monitor Stripe webhook failures
- Review and approve creator profiles (if manual approval)
- Handle support tickets
- Update academy content
- Monitor tracked link abuse/bot traffic
- Database backups (weekly)

---

## 🎯 CONCLUSION

**Current Status:** 65% Complete  
**Remaining Work:** ~4-5 weeks  
**Biggest Gaps:** Tracking system, subscriptions, emails, commissions, academy

**Recommended Approach:**

1. **Week 1:** Frontend fixes + Tracked links (core value)
2. **Week 2:** Subscriptions + Email system (business model + engagement)
3. **Week 3:** Academy + Commission system (education + payments)
4. **Week 4:** Creator marketplace + Admin approval (discovery + quality)
5. **Week 5:** Polish, test, and launch

**You're in great shape!** The foundation is solid. This plan now covers **100% of Priority 1 features from the PRD**. Follow this sequentially and you'll have a complete, production-ready MVP.

---

**Questions? Need clarification on any section? Let me know and I'll dive deeper!**
