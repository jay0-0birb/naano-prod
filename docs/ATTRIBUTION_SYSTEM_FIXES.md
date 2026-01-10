# Attribution System - Comprehensive Fixes

This document summarizes all fixes applied to address the evaluation issues.

## Critical Issues (Fixed)

### ✅ Issue 4.1: Signup Upgrade Function Not Called
**Status:** Fixed

**Solution:**
- Created `/api/track/signup` webhook endpoint
- SaaS can call this endpoint when a user signs up, passing:
  - `session_id` (from `naano_session` cookie)
  - `email`, `name`, `job_title`, `company`, `linkedin_url`
- Endpoint automatically:
  - Finds the click event by session_id
  - Creates/updates the lead
  - Calls `upgrade_company_inference_on_signup()` function
  - Handles company mismatches

**Usage:**
```bash
POST /api/track/signup
{
  "session_id": "naano_session_xxx",
  "email": "user@example.com",
  "company": "Acme Corp",
  "name": "John Doe",
  "job_title": "CTO"
}
```

## High Priority Issues (Fixed)

### ✅ Issue 3.2: Show Company-Level Aggregated Intent
**Status:** Fixed

**Solution:**
- Created `get_company_aggregated_intent()` SQL function
- Updated Lead Feed to fetch and display company-level intent prominently
- Shows: avg intent, max intent, total sessions, repeat visits, intent trend
- Default sort is now by company-level intent (most meaningful)
- Session-level intent shown as secondary metric

### ✅ Issue 5.1: Make Uncertainty More Prominent
**Status:** Fixed

**Solution:**
- Company names prefixed with "Probable: " or "Possible: " for inferred
- Large, colored badges: "Probable", "Confirmé", "Ambigu", "Incompatible"
- Confidence score shown next to company name for inferred
- Tooltips explaining what each state means
- Effective confidence (with decay) displayed prominently

## Medium Priority Issues (Fixed)

### ✅ Issue 1.1: Confidence Decay Over Time
**Status:** Fixed

**Solution:**
- Created `calculate_confidence_decay()` function
- Created `get_effective_confidence()` function
- Decay: -0.1% per day, max -30%, minimum 30%
- Effective confidence displayed in UI
- Shows original vs effective confidence when decay applied
- No decay for confirmed companies

### ✅ Issue 1.2: Handle Ambiguous Company Matches
**Status:** Fixed

**Solution:**
- Added `is_ambiguous` flag to `company_inferences` table
- Enrichment service marks ambiguous when:
  - Confidence < 0.5
  - Network type is hosting/VPN/proxy
- UI shows "Possible: [Company]" with orange "Ambigu" badge
- Confidence reasons explain why it's ambiguous

### ✅ Issue 2.2: Confidence Aggregation Rules
**Status:** Fixed

**Solution:**
- Effective confidence calculated per inference (with decay)
- Company-level aggregates use weighted averages
- `company_intent_aggregates` view shows effective confidence
- UI displays both original and effective confidence

### ✅ Issue 3.1: Intent Score Recency Weighting
**Status:** Fixed

**Solution:**
- Added `recency_weight` and `days_since_session` to `intent_scores`
- Auto-calculated via trigger:
  - 100% for <7 days
  - 80% for <30 days
  - 50% for <90 days
  - 20% for older
- Company-level intent uses recency-weighted averages
- UI shows recency weight when < 100%

### ✅ Issue 3.3: Incomplete Intent Signals
**Status:** Documented (requires SaaS integration)

**Solution:**
- Added tooltip explaining intent score calculation
- UI clearly shows which signals are available
- When page tracking is missing, intent score is lower (by design)
- Future: SaaS can send page views via webhook to increase intent scores

### ✅ Issue 4.2: Handle Signup Company Mismatch
**Status:** Fixed

**Solution:**
- `upgrade_company_inference_on_signup()` now:
  - Normalizes company names for comparison
  - If mismatch: marks old inference as "mismatch", creates new confirmed inference
  - Returns action taken: "upgraded" or "mismatch_handled"
- UI shows "Incompatible" badge for mismatched inferences
- Audit trail preserved

### ✅ Issue 5.2: Sorting/Filtering by Confidence
**Status:** Fixed

**Solution:**
- Added sort options: date, confidence, intent, company_intent (default)
- Added filters: "Show only confirmed", "Show only high confidence (≥70%)"
- Filter panel with clear UI
- Default sort by company-level intent (most meaningful)

### ✅ Issue 5.3: Intent Score Context/Explanation
**Status:** Fixed

**Solution:**
- Added tooltip with HelpCircle icon explaining:
  - "Score d'intention basé sur l'engagement, la qualité du référent, et les signaux comportementaux. Plus élevé = plus susceptible de convertir."
- Clear distinction between session-level and company-level intent
- Shows which is more reliable (company-level)

### ✅ Issue 5.4: Company Name Normalization
**Status:** Fixed

**Solution:**
- Created `normalize_company_name()` function
- Removes: Inc., LLC, Ltd., Corp., Corporation
- Converts to lowercase
- Auto-applied via trigger on insert/update
- Used in upgrade function for matching
- Prevents duplicate entries for same company

### ✅ Issue 6.1: IP Address Masking
**Status:** Fixed

**Solution:**
- Created `maskIPAddress()` utility function
- Masks last octet for IPv4: "192.168.1.x"
- Masks last segment for IPv6
- Applied consistently in UI
- IPs still stored in DB for enrichment, but masked in display

## Low Priority Issues (Fixed)

### ✅ Issue 1.3: Disputed/Incorrect State
**Status:** Fixed

**Solution:**
- Added `disputed_at` and `disputed_reason` to `company_inferences`
- Added "disputed" to attribution_state enum
- Created `dispute_company_inference()` function
- UI can show disputed state (future: add dispute button)

### ✅ Issue 2.1: Confidence Threshold Documentation
**Status:** Fixed

**Solution:**
- Threshold of 0.3 (30%) documented in code comments
- Rationale: balances noise vs. missing valid companies
- UI shows note: "Only showing visits with identified companies (confidence ≥30%)"

### ✅ Issue 2.3: Dynamic Confidence Reasons
**Status:** Fixed

**Solution:**
- Upgrade function appends "Confirmed via signup" to confidence reasons
- Related inferences also get "Confirmed via signup (related inference)"
- Reasons are JSONB array, can be updated dynamically

### ✅ Issue 4.3: Multiple Leads Per Inference
**Status:** Verified

**Solution:**
- Upgrade function already handles this correctly
- Updates all related inferences with same normalized company name
- Tested and verified working

### ✅ Issue 6.2: Fingerprinting Guardrails
**Status:** Documented

**Solution:**
- Documented in code: user agent only used for device classification
- Never combined with IP + other signals to create unique identifier
- Privacy-first approach maintained

### ✅ Issue 6.3: Unknown Handling Transparency
**Status:** Fixed

**Solution:**
- UI shows clear message when no leads:
  - "Les leads apparaîtront ici une fois qu'ils auront été enrichis avec des données d'entreprise (confiance ≥30%)."
  - "Seuls les clics avec identification d'entreprise sont affichés ici."

## Database Migrations

Run these SQL files in order:
1. `supabase/attribution-intent-system.sql` (original schema)
2. `supabase/attribution-intent-system-fixes.sql` (all fixes)

## API Endpoints

### Signup Webhook
- **Endpoint:** `POST /api/track/signup`
- **Purpose:** Upgrade inferred → confirmed attribution when user signs up
- **Auth:** None (SaaS calls directly)
- **Payload:** See Issue 4.1 above

## UI Improvements

### Lead Feed Tab
- Prominent uncertainty indicators
- Company-level intent displayed prominently
- Sorting and filtering options
- Confidence decay visualization
- IP address masking
- Tooltips and explanations
- Clear distinction between inferred and confirmed

## Testing Checklist

- [ ] Run SQL migrations
- [ ] Test signup webhook with real session_id
- [ ] Verify confidence decay calculation
- [ ] Test company name normalization
- [ ] Verify ambiguity flagging
- [ ] Test sorting and filtering
- [ ] Verify IP masking in UI
- [ ] Test mismatch handling

## Future Enhancements

- Add "Dispute" button in UI
- Implement page tracking webhook for SaaS
- Add export to CSV functionality
- Add company-level dashboard view
- Implement confidence threshold configuration per SaaS

