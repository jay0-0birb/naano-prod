-- =====================================================
-- Allow both parties to update their collaborations
-- (needed for brand selection and cancellation flow)
-- =====================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'collaborations'
      AND policyname = 'Users can update their collaborations'
  ) THEN
    CREATE POLICY "Users can update their collaborations"
      ON public.collaborations
      FOR UPDATE
      USING (
        auth.uid() IN (
          SELECT cp.profile_id
          FROM public.creator_profiles cp
          JOIN public.applications a ON a.id = public.collaborations.application_id
          WHERE a.creator_id = cp.id
        )
        OR auth.uid() IN (
          SELECT sc.profile_id
          FROM public.saas_companies sc
          JOIN public.applications a ON a.id = public.collaborations.application_id
          WHERE a.saas_id = sc.id
        )
      )
      WITH CHECK (
        auth.uid() IN (
          SELECT cp.profile_id
          FROM public.creator_profiles cp
          JOIN public.applications a ON a.id = public.collaborations.application_id
          WHERE a.creator_id = cp.id
        )
        OR auth.uid() IN (
          SELECT sc.profile_id
          FROM public.saas_companies sc
          JOIN public.applications a ON a.id = public.collaborations.application_id
          WHERE a.saas_id = sc.id
        )
      );
  END IF;
END $$;

