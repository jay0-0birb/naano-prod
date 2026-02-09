'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { notifyNewApplication } from '@/lib/notifications'

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
    .select('profile_id, stripe_account_id, stripe_onboarding_completed')
    .eq('id', creatorId)
    .single()

  if (!creatorProfile || creatorProfile.profile_id !== user.id) {
    return { error: 'Non autorisé' }
  }

  // Require Stripe to be connected before applying
  if (!creatorProfile.stripe_onboarding_completed || !creatorProfile.stripe_account_id) {
    return {
      error:
        "Vous devez connecter votre compte Stripe dans les paramètres avant de pouvoir postuler à des collaborations.",
    }
  }

  // Get SaaS company
  const { data: saasCompany, error: saasError } = await supabase
    .from('saas_companies')
    .select('id')
    .eq('id', saasId)
    .single()

  if (saasError || !saasCompany) {
    return { error: "Entreprise introuvable" }
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
  const { error, data: newApplication } = await supabase
    .from('applications')
    .insert({
      creator_id: creatorId,
      saas_id: saasId,
      message: message || null,
      status: 'pending',
    })
    .select('id')
    .single()

  if (error) {
    return { error: error.message }
  }

  // Trigger email notification to SaaS (async, don't wait)
  if (newApplication) {
    notifyNewApplication(newApplication.id).catch(console.error)
  }

  revalidatePath('/dashboard/marketplace')
  revalidatePath('/dashboard/applications')
  
  return { success: true }
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
    .select('id, profile_id, wallet_credits')
    .eq('id', saasId)
    .single()

  if (!saasCompany || saasCompany.profile_id !== user.id) {
    return { error: 'Non autorisé', success: false }
  }

  // Require credits before inviting creators (brand must add credits first)
  const walletCredits = saasCompany.wallet_credits ?? 0
  if (walletCredits <= 0) {
    return {
      error:
        "Vous devez ajouter des crédits avant de pouvoir inviter des créateurs. Allez dans Finances pour souscrire.",
      success: false,
    }
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

