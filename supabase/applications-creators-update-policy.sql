-- =====================================================
-- Allow creators to update the status of their applications
-- (needed for accepting/rejecting SaaS invitations)
-- =====================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'applications'
      AND policyname = 'Creators can update their applications'
  ) THEN
    CREATE POLICY "Creators can update their applications"
      ON public.applications
      FOR UPDATE
      USING (
        auth.uid() IN (
          SELECT profile_id
          FROM public.creator_profiles
          WHERE id = applications.creator_id
        )
      )
      WITH CHECK (
        auth.uid() IN (
          SELECT profile_id
          FROM public.creator_profiles
          WHERE id = applications.creator_id
        )
      );
  END IF;
END $$;

