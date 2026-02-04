-- Simulate 75€ available balance for Clark Kent (for testing payments)
-- Run this in Supabase SQL Editor.

-- Option 1: Find Clark Kent by display name, set available_balance to 75
INSERT INTO public.creator_wallets (creator_id, pending_balance, available_balance, total_earned, updated_at)
SELECT cp.id, COALESCE(cw.pending_balance, 0), 75.00, COALESCE(cw.total_earned, 0), NOW()
FROM public.creator_profiles cp
JOIN public.profiles p ON p.id = cp.profile_id
LEFT JOIN public.creator_wallets cw ON cw.creator_id = cp.id
WHERE p.full_name ILIKE '%Clark Kent%'
ON CONFLICT (creator_id) DO UPDATE SET
  available_balance = 75.00,
  updated_at = NOW();

-- If no row was updated above (Clark Kent not found by name), use Option 2:
-- Replace YOUR_CREATOR_PROFILE_ID with the actual creator_profiles.id for Clark Kent.
-- You can get it from: Profiles → find Clark Kent → get id from creator_profiles where profile_id = that user id.

/*
-- Option 2: Set balance by creator_profiles.id (uncomment and set the UUID)
INSERT INTO public.creator_wallets (creator_id, pending_balance, available_balance, total_earned, updated_at)
VALUES ('YOUR_CREATOR_PROFILE_ID'::uuid, 0, 75.00, 75.00, NOW())
ON CONFLICT (creator_id) DO UPDATE SET
  available_balance = 75.00,
  updated_at = NOW();
*/

-- Check result (run after Option 1 to see if Clark Kent was found)
SELECT p.full_name, p.email, cw.available_balance, cw.pending_balance, cw.total_earned
FROM public.creator_wallets cw
JOIN public.creator_profiles cp ON cp.id = cw.creator_id
JOIN public.profiles p ON p.id = cp.profile_id
WHERE p.full_name ILIKE '%Clark Kent%';
