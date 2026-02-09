-- Add recent_posts_linkedin to creator_profiles for profile setup.
-- Fixes: "Could not find the 'recent_posts_linkedin' column of 'creator_profiles' in the schema cache"
ALTER TABLE public.creator_profiles ADD COLUMN IF NOT EXISTS recent_posts_linkedin TEXT;
