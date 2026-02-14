# Affiliate system – full spec

---

## 1. Objective

- Know **which creator** and **which company** were brought by a referrer (apporteur).
- Pay referrers **manually** (e.g. at end of month): 10% of creator payments and company credits **within 6 months of attribution** (see Section 7). No commission after that window.
- No Stripe automation for these payments; manual bank transfer only.

---

## 2. Referrer links and param

- Referrers share: `https://naano.xyz/?aff=CODE` (e.g. `?aff=COMMUNAUTE_X`).
- We use **`aff`** for affiliates only. **`ref`** stays for Naano Pro (creator ID). No overlap.

---

## 3. Data model

### 3.1 Table: `affiliate_codes`

- `code` – text, **primary key**, stored in uppercase (e.g. `COMMUNAUTE_X`).
- `referrer_name` – text (display name for the apporteur).
- `created_at` – timestamptz.

### 3.2 `creator_profiles` (new columns)

- `affiliate_code` – text, nullable, **foreign key** to `affiliate_codes(code)`.
- `affiliate_attributed_at` – timestamptz, nullable. Set when we attach the code.
- `affiliate_source` – text, nullable. e.g. `'landing_ref'` for now.

### 3.3 `saas_companies` (new columns)

- `affiliate_code` – text, nullable, **foreign key** to `affiliate_codes(code)`.
- `affiliate_attributed_at` – timestamptz, nullable.
- `affiliate_source` – text, nullable.

### 3.4 Indexes (for report performance)

- Index on **`creator_profiles.affiliate_code`**.
- Index on **`saas_companies.affiliate_code`**.
- Index on **`payments.paid_at`**.

---

## 4. Attribution flow

### 4.1 Landing with `?aff=...`

- Read `aff` from URL.
- Normalize to **uppercase** before any lookup or storage.
- If code **exists** in `affiliate_codes`: set a **cookie** (e.g. `naano_affiliate_ref`) with value = that uppercase code, expiry **30 days**.
- If code does not exist: do nothing (no cookie).
- **Do not** use `aff` for Naano Pro; `ref` remains the only param for creator promo.

### 4.2 Registration

- No persistence of affiliate at signup. Cookie is enough.

### 4.3 Onboarding (creator or company)

- **Client:** On the onboarding page, read the affiliate code from the cookie and send it with the form (e.g. hidden field).
- **Server:** When creating or updating `creator_profiles` or `saas_companies`:
  - **Only set affiliate fields if they are currently NULL.** Never overwrite an existing `affiliate_code`.
  - If existing row already has `affiliate_code` set → ignore the cookie; do not update.
  - If `affiliate_code` is NULL:
    - Normalize submitted code to uppercase.
    - Check that the code exists in `affiliate_codes`. If not → do not set anything.
    - If it exists: set `affiliate_code`, `affiliate_attributed_at = now()`, `affiliate_source = 'landing_ref'`.

This protects against: someone revisiting with another `?aff=`, internal testing overwriting real attributions, and affiliate disputes.

### 4.4 Cookie and “last ref”

- Cookie is overwritten on each visit with `?aff=...` (last ref wins for the **cookie**).
- **Attribution** is first-write-only: once `affiliate_code` is set, we never overwrite it.

---

## 5. Code format and validation

- **Storage:** All codes in `affiliate_codes` are stored in **uppercase**.
- **Reading `?aff=...`:** Convert to uppercase before matching or saving to cookie.
- **Validation:** Only allow attribution if the code exists in `affiliate_codes`. No free-form text.

---

## 6. Existing users and private browsing

- **Existing users:** No backfill. Only new onboarding can get attributed.
- **Private browsing:** Attribution works if the user lands with `?aff=` and completes onboarding in the **same session**. Cross-session in private mode may lose the cookie; no code change can fix that.

---

## 7. Commission

Commission applies for **6 months from `affiliate_attributed_at`** only. No commission after the 6-month window.

Payouts are calculated **monthly**, but only include transactions that fall within each entity’s 6-month window from `affiliate_attributed_at`.

- **Creators:** 10% of payments **earned by that creator** within 6 months of their attribution date (i.e. `paid_at` between `affiliate_attributed_at` and `affiliate_attributed_at + 6 months`).
- **Companies:** 10% of **credits purchased by that company** within 6 months of their attribution date.

**Payment:** Manual bank transfer. No Stripe automation for referrer payouts.

---

## 8. Admin report and admin access (separate from creator/saas)

### 8.1 Admin access (separate flow)

- **Signup:** Admins use a **separate** signup page: **`/admin/register`**. No creator/saas choice; only email, password, optional name.
- **Allowlist:** Only emails listed in the **`ADMIN_EMAILS`** env var (comma-separated, case-insensitive) can create an admin account. Example: `ADMIN_EMAILS=you@company.com,founder@company.com`.
- **Profile:** Signup creates a profile with `role = 'admin'` (via Supabase Auth user_metadata). No creator_profiles or saas_companies row; no onboarding.
- **After login:** Admin sees only the admin sidebar (Affiliates, Settings, Sign out). No creator/saas menu, no “complete your profile” prompt. Visiting `/dashboard` redirects to `/dashboard/admin/affiliates`.

### 8.2 Admin report access

- One page in the same app: `/dashboard/admin/affiliates`.
- **Only** users with `profiles.role = 'admin'` can access it. Server-side: if not admin → redirect to `/dashboard`.
- Admins get there via the sidebar (Affiliates) or by being redirected from `/dashboard`.

### 8.3 Content (one page, two sections)

**Section 1 – Affiliate codes**

- Table: Code | Referrer name | Created at | (optional: actions).
- Way to **create** a new code (code + referrer name). Codes stored uppercase.

**Section 2 – Report**

- Optional **filter by affiliate code**.
- Report is based on the **6-month window** per attribution (see Section 7). For each affiliate code: attributed creators and companies; for each, sum of earnings/credits within their 6-month window; then 10% commission.
- **One table:**  
  Code | Referrer name | # Creators | # Companies | Creator earnings (6mo window, €) | Company credits (6mo window, €) | Commission (10%, €)
- Optional: **Export CSV** for that table (for manual bank transfer).

---

## 9. Implementation order

1. **DB migration**
   - Create `affiliate_codes` (code primary key, referrer_name, created_at). Store code uppercase.
   - Add to `creator_profiles`: `affiliate_code` (FK to `affiliate_codes.code`), `affiliate_attributed_at`, `affiliate_source`. Index on `affiliate_code`.
   - Add to `saas_companies`: same three columns + index on `affiliate_code`.
   - Index on `payments.paid_at`.

2. **Landing**
   - On `?aff=...`: uppercase → check exists in `affiliate_codes` → set cookie 30 days. Do not use `aff` for Naano Pro.

3. **Onboarding**
   - Client: read cookie, send with creator/SaaS onboarding form.
   - Server: in `completeCreatorOnboarding` and `completeSaasOnboarding`, only if current `affiliate_code` is NULL: validate code in `affiliate_codes`, then set the three fields. Never overwrite existing attribution.

4. **Admin page**
   - Route (e.g. `/dashboard/admin/affiliates`) with server-side role check (`role === 'admin'`).
   - Codes table + create form.
   - Report: month picker, optional code filter, one table as above, optional CSV export.

5. **Report query**
   - Per affiliate code: list attributed creators and companies; for each, sum payments (creators) or credits purchased (companies) where `paid_at` is within 6 months of that row’s `affiliate_attributed_at`; then 10% of those sums. Optional filter by code.

---

## 10. Summary checklist

| Item           | Decision                                                                                   |
| -------------- | ------------------------------------------------------------------------------------------ |
| Param          | `?aff=CODE` for affiliates; `?ref=` only for Naano Pro                                     |
| Cookie         | 30 days; overwritten on each visit with `?aff=`                                            |
| Attribution    | Only set when `affiliate_code` is NULL; never overwrite                                    |
| Codes          | Uppercase in DB; uppercase when reading `?aff=`                                            |
| Validation     | Only allow if code exists in `affiliate_codes`                                             |
| Existing users | No backfill                                                                                |
| Admin report   | Option 1: same app, role=admin, one page, codes + report table, optional CSV               |
| Commission     | 10% of (creator payments + company credits) within 6 months of attribution; manual payment |
