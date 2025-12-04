'use server';

import { createClient } from '@/lib/supabase/server';
import { SAAS_TIERS, CREATOR_TIERS, SaasTier, CreatorTier } from '@/lib/subscription-config';

/**
 * Get SaaS subscription info
 */
export async function getSaasSubscription() {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'Non authentifié' };
  }

  const { data: saasCompany, error } = await supabase
    .from('saas_companies')
    .select('id, subscription_tier, subscription_status, stripe_subscription_id')
    .eq('profile_id', user.id)
    .single();

  if (error || !saasCompany) {
    return { error: 'Entreprise non trouvée' };
  }

  const tier = (saasCompany.subscription_tier || 'starter') as SaasTier;
  const tierConfig = SAAS_TIERS[tier];

  // Count active creators
  const { data: activeCreators } = await supabase.rpc('count_saas_active_creators', {
    saas_id: saasCompany.id
  });

  return {
    subscription: {
      tier,
      tierConfig,
      status: saasCompany.subscription_status || 'active',
      stripeSubscriptionId: saasCompany.stripe_subscription_id,
      activeCreators: activeCreators || 0,
      maxCreators: tierConfig.maxCreators,
      canAddCreators: (activeCreators || 0) < tierConfig.maxCreators,
      platformFee: tierConfig.platformFee,
    }
  };
}

/**
 * Get creator subscription info
 */
export async function getCreatorSubscription() {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'Non authentifié' };
  }

  const { data: creatorProfile, error } = await supabase
    .from('creator_profiles')
    .select('id, subscription_tier')
    .eq('profile_id', user.id)
    .single();

  if (error || !creatorProfile) {
    return { error: 'Profil créateur non trouvé' };
  }

  const tier = (creatorProfile.subscription_tier || 'free') as CreatorTier;
  const tierConfig = CREATOR_TIERS[tier];

  // Count active SaaS partnerships
  const { data: activeSaas } = await supabase.rpc('count_creator_active_saas', {
    creator_id: creatorProfile.id
  });

  return {
    subscription: {
      tier,
      tierConfig,
      activeSaas: activeSaas || 0,
      maxSaas: tierConfig.maxSaas,
      canAddSaas: (activeSaas || 0) < tierConfig.maxSaas,
    }
  };
}

/**
 * Check if SaaS can accept a new creator
 */
export async function checkSaasCanAcceptCreator(saasId: string) {
  const supabase = await createClient();

  const { data: canAccept } = await supabase.rpc('can_saas_accept_creator', {
    saas_id: saasId
  });

  if (!canAccept) {
    // Get current limits for error message
    const { data: saasCompany } = await supabase
      .from('saas_companies')
      .select('subscription_tier')
      .eq('id', saasId)
      .single();

    const tier = (saasCompany?.subscription_tier || 'starter') as SaasTier;
    const tierConfig = SAAS_TIERS[tier];

    return {
      canAccept: false,
      reason: `Limite de créateurs atteinte (${tierConfig.maxCreators} max). Passez au plan supérieur pour ajouter plus de créateurs.`,
      currentTier: tier,
      suggestedTier: tier === 'starter' ? 'growth' : 'scale',
    };
  }

  return { canAccept: true };
}

/**
 * Check if creator can apply to a new SaaS
 */
export async function checkCreatorCanApply(creatorId: string) {
  const supabase = await createClient();

  const { data: canApply } = await supabase.rpc('can_creator_apply', {
    creator_id: creatorId
  });

  if (!canApply) {
    const tierConfig = CREATOR_TIERS.free;

    return {
      canApply: false,
      reason: `Limite de partenariats atteinte (${tierConfig.maxSaas} max). Vous devez terminer une collaboration existante pour en commencer une nouvelle.`,
    };
  }

  return { canApply: true };
}

/**
 * Update SaaS subscription tier (called after Stripe payment)
 */
export async function updateSaasSubscription(
  saasId: string, 
  tier: SaasTier, 
  stripeSubscriptionId?: string
) {
  const supabase = await createClient();

  const { error } = await supabase
    .from('saas_companies')
    .update({
      subscription_tier: tier,
      stripe_subscription_id: stripeSubscriptionId || null,
      subscription_status: 'active',
    })
    .eq('id', saasId);

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}

