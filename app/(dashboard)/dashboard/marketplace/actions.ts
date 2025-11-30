'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

interface ApplyToSaasParams {
  creatorId: string;
  saasId: string;
  message?: string;
}

export async function applyToSaas({ creatorId, saasId, message }: ApplyToSaasParams) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Non authentifié' }
  }

  // Verify that the creator profile belongs to the current user
  const { data: creatorProfile } = await supabase
    .from('creator_profiles')
    .select('profile_id')
    .eq('id', creatorId)
    .single()

  if (!creatorProfile || creatorProfile.profile_id !== user.id) {
    return { error: 'Non autorisé' }
  }

  // Check if already applied
  const { data: existingApplication } = await supabase
    .from('applications')
    .select('id')
    .eq('creator_id', creatorId)
    .eq('saas_id', saasId)
    .single()

  if (existingApplication) {
    return { error: 'Vous avez déjà postulé à cette entreprise' }
  }

  // Create application
  const { error } = await supabase
    .from('applications')
    .insert({
      creator_id: creatorId,
      saas_id: saasId,
      message: message || null,
      status: 'pending',
    })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard/marketplace')
  revalidatePath('/dashboard/applications')
  
  return { success: true }
}

interface InviteCreatorParams {
  saasId: string;
  creatorId: string;
  message: string;
}

export async function inviteCreator(saasId: string, creatorId: string, message: string) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Non authentifié', success: false }
  }

  // Verify that the SaaS company belongs to the current user
  const { data: saasCompany } = await supabase
    .from('saas_companies')
    .select('profile_id')
    .eq('id', saasId)
    .single()

  if (!saasCompany || saasCompany.profile_id !== user.id) {
    return { error: 'Non autorisé', success: false }
  }

  // Check if already invited/applied
  const { data: existingApplication } = await supabase
    .from('applications')
    .select('id')
    .eq('creator_id', creatorId)
    .eq('saas_id', saasId)
    .single()

  if (existingApplication) {
    return { error: 'Ce créateur a déjà été invité ou a déjà postulé', success: false }
  }

  // Create application with 'invited' status
  const { error } = await supabase
    .from('applications')
    .insert({
      creator_id: creatorId,
      saas_id: saasId,
      message: message,
      status: 'pending', // We'll use 'pending' for now, can add 'invited' status later
    })

  if (error) {
    return { error: error.message, success: false }
  }

  revalidatePath('/dashboard/marketplace')
  revalidatePath('/dashboard/candidates')
  
  return { success: true }
}

