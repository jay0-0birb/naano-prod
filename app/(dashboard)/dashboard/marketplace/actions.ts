'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { notifyNewApplication } from '@/lib/notifications'
import { SAAS_TIERS, SaasTier } from '@/lib/subscription-config'

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

  // Get SaaS company and its plan
  const { data: saasCompany, error: saasError } = await supabase
    .from('saas_companies')
    .select('id, subscription_tier')
    .eq('id', saasId)
    .single()

  if (saasError || !saasCompany) {
    return { error: "Entreprise introuvable" }
  }

  const tier = (saasCompany.subscription_tier || 'starter') as SaasTier
  const maxCreators = SAAS_TIERS[tier].maxCreators

  // Count active creators for this SaaS
  let activeCreators = 0
  try {
    const { data, error } = await supabase.rpc('count_saas_active_creators', {
      p_saas_id: saasCompany.id,
    })

    if (error) {
      throw error
    }

    activeCreators =
      typeof data === 'number'
        ? data
        : (data as any)?.[0]?.count_saas_active_creators || 0
  } catch (err) {
    // Fallback: count distinct creators from active collaborations
    const { data: collabs, error: collabError } = await supabase
      .from('collaborations')
      .select(
        `
        application_id,
        applications!inner(
          creator_id,
          saas_id
        )
      `
      )
      .eq('status', 'active')

    if (!collabError && collabs) {
      const uniqueCreators = new Set(
        (collabs as any[])
          .map((c) => c.applications)
          .filter((app: any) => app?.saas_id === saasCompany.id)
          .map((app: any) => app?.creator_id)
          .filter(Boolean)
      )
      activeCreators = uniqueCreators.size
    }
  }

  // Enforce plan limits (Starter: 3, Growth: 10, Scale: unlimited)
  if (maxCreators !== Infinity && activeCreators >= maxCreators) {
    return {
      error:
        tier === 'starter'
          ? "Cette entreprise a atteint la limite de 3 créateurs pour le plan Starter."
          : "Cette entreprise a atteint la limite de créateurs pour son plan actuel.",
    }
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
    .select('id, profile_id, subscription_tier')
    .eq('id', saasId)
    .single()

  if (!saasCompany || saasCompany.profile_id !== user.id) {
    return { error: 'Non autorisé', success: false }
  }

  const tier = (saasCompany.subscription_tier || 'starter') as SaasTier
  const maxCreators = SAAS_TIERS[tier].maxCreators

  // Count active creators for this SaaS (same logic as applyToSaas)
  let activeCreators = 0
  try {
    const { data, error } = await supabase.rpc('count_saas_active_creators', {
      p_saas_id: saasCompany.id,
    })

    if (error) {
      throw error
    }

    activeCreators =
      typeof data === 'number'
        ? data
        : (data as any)?.[0]?.count_saas_active_creators || 0
  } catch (err) {
    const { data: collabs, error: collabError } = await supabase
      .from('collaborations')
      .select(
        `
        application_id,
        applications!inner(
          creator_id,
          saas_id
        )
      `
      )
      .eq('status', 'active')

    if (!collabError && collabs) {
      const uniqueCreators = new Set(
        (collabs as any[])
          .map((c) => c.applications)
          .filter((app: any) => app?.saas_id === saasCompany.id)
          .map((app: any) => app?.creator_id)
          .filter(Boolean)
      )
      activeCreators = uniqueCreators.size
    }
  }

  if (maxCreators !== Infinity && activeCreators >= maxCreators) {
    return {
      error:
        tier === 'starter'
          ? "Vous avez atteint la limite de 3 créateurs pour le plan Starter. Passez à Growth ou Scale pour inviter plus de créateurs."
          : "Vous avez atteint la limite de créateurs pour votre plan actuel.",
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

