'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function respondToApplication(
  applicationId: string,
  status: 'accepted' | 'rejected',
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'Non authentifié' };
  }

  // Load application and verify creator ownership
  const { data: application, error: appError } = await supabase
    .from('applications')
    .select(
      `
      id,
      status,
      creator_id,
      saas_id,
      creator_profiles:creator_id (
        profile_id
      )
    `,
    )
    .eq('id', applicationId)
    .maybeSingle();

  if (appError) {
    console.error('[respondToApplication] load error', appError);
    return { error: appError.message || 'Erreur lors du chargement' };
  }

  if (!application) {
    return { error: 'Candidature introuvable' };
  }

  const creatorProfileId = (application.creator_profiles as any)?.profile_id;
  if (creatorProfileId !== user.id) {
    return { error: 'Non autorisé' };
  }

  if (application.status !== 'pending') {
    return { error: 'Cette candidature a déjà été traitée' };
  }

  // Update application status (RLS ensures only this creator can do it)
  const { error: updateError } = await supabase
    .from('applications')
    .update({ status })
    .eq('id', applicationId);

  if (updateError) {
    console.error('[respondToApplication] update error', updateError);
    return { error: updateError.message || 'Erreur lors de la mise à jour' };
  }

  // Note: actual collaboration creation still happens when the SaaS accepts
  // the application from their side (via updateApplicationStatus).
  // Here we only signal interest or rejection from the creator.

  revalidatePath('/dashboard/applications');
  revalidatePath('/dashboard/candidates');

  return { success: true };
}

