-- =====================================================
-- Delete a single user by email
-- =====================================================
-- Usage: Replace 'jnamour1@gmail.com' with the target email if needed.
-- Run in Supabase Dashboard → SQL Editor (uses service role).
-- This removes the auth user and cascades to profiles + all related data.
-- =====================================================

DO $$
DECLARE
  target_email text := 'rexrussell93@gmail.com';
  uid uuid;
BEGIN
  SELECT id INTO uid FROM auth.users WHERE email = target_email;

  IF uid IS NULL THEN
    RAISE NOTICE 'No user found with email: %', target_email;
    RETURN;
  END IF;

  -- Auth: delete child rows first (Supabase auth schema)
  DELETE FROM auth.refresh_tokens WHERE session_id IN (SELECT id FROM auth.sessions WHERE user_id = uid);
  DELETE FROM auth.sessions WHERE user_id = uid;
  DELETE FROM auth.identities WHERE user_id = uid;

  -- Delete the auth user; profiles and all app data cascade from profiles
  DELETE FROM auth.users WHERE id = uid;

  RAISE NOTICE 'Deleted user % (id: %)', target_email, uid;
END
$$;
