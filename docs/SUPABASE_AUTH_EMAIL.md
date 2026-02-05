# Supabase auth emails (signup confirmation)

Confirmation emails are **sent by Supabase**, not by the app. The app only calls `signUp()`; Supabase queues and sends the email.

## Why you might not receive the email

1. **Supabase default email provider is limited**
   - Rate limit: about **2 emails per hour**.
   - Often only sends to **authorized addresses** (emails added in the project).
   - Not suitable for production; many messages never reach external inboxes.

2. **Confirm email is disabled**
   - In [Supabase Dashboard](https://supabase.com/dashboard) → **Authentication** → **Providers** → **Email**, ensure **Confirm email** is **ON**.
   - If it’s off, Supabase may not send a confirmation email at all.

3. **Redirect URL not allowed**
   - **Authentication** → **URL Configuration**: add your app URLs (e.g. `http://localhost:3000/auth/callback`, `https://yourdomain.com/auth/callback`) to **Redirect URLs**.
   - If the link in the email points to a URL that isn’t allowed, the flow can fail or look broken.

4. **Local / dev**
   - With **Supabase local** (`supabase start`), emails often go to **Inbucket** (e.g. http://localhost:54324) instead of real inboxes. Check Inbucket to see if the signup email is there.

## What to do

### Use Resend (recommended)

The app already uses Resend for notifications (`lib/email.ts`). Use the **same Resend API key** so Supabase sends auth emails (signup confirmation, password reset) via Resend.

1. **Resend**
   - Get an API key: [resend.com](https://resend.com) → **API Keys**.
   - Verify a domain (e.g. `naano.xyz` or `konex.app`) so you can send from e.g. `noreply@yourdomain.com`.

2. **Supabase**
   - [Supabase Dashboard](https://supabase.com/dashboard) → your project → **Authentication** → **Email** (or **Project Settings** → **Auth**).
   - Find **SMTP** and enable **Custom SMTP**.
   - Use Resend’s SMTP:

   | Field        | Value |
   |-------------|--------|
   | **Sender email** | `Naano <noreply@yourdomain.com>` (use a verified Resend domain) |
   | **Sender name**  | e.g. `Naano` |
   | **Host**        | `smtp.resend.com` |
   | **Port**        | `465` |
   | **Username**    | `resend` |
   | **Password**    | Your **Resend API key** (starts with `re_`) |

   Save. From then on, Supabase will send all auth emails through Resend (no code changes).

3. **Redirect URLs**
   - **Authentication** → **URL Configuration**: add `https://yourdomain.com/auth/callback` and, for local dev, `http://localhost:3002/auth/callback`.

Ref: [Resend – Send with Supabase (SMTP)](https://resend.com/docs/send-with-supabase-smtp).

### Other custom SMTP

You can also use your Naano/LWS mail or another provider (SendGrid, Brevo, etc.):

- [Supabase: Send emails with custom SMTP](https://supabase.com/docs/guides/auth/auth-smtp)
- In **Authentication** → **Email** / **SMTP**: set host, port, user, password, and sender.

### For testing right now

1. **Check Supabase Auth**
   - **Authentication** → **Users**: confirm the new user exists and note if they’re “confirmed” or not.
   - **Authentication** → **Logs** (or **Logs** in the sidebar): look for signup/email errors.

2. **Use “Resend confirmation email”**
   - On the “Check your email” screen after signup, use **Resend confirmation email**.
   - Still no email → likely Supabase default provider limits or SMTP not set; switch to custom SMTP or use an authorized/test email.

3. **Authorized emails (quick test)**
   - In the Supabase project, add the test address as an authorized email if your plan has that option, so the default provider is allowed to send to it.

## Summary

- **Backend is correct**: the app calls `signUp()` and (optionally) `resend()`; Supabase is responsible for sending.
- **No email** is almost always **Supabase config**: enable **Confirm email**, add **Redirect URLs**, and for real use set **custom SMTP**.
