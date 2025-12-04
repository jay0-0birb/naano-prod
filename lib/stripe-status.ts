'use server';

import { createClient } from '@/lib/supabase/server';
import { stripe } from '@/lib/stripe';

/**
 * Verify and update Stripe Connect account status for a creator
 * Called after Stripe redirect to ensure status is up to date
 * Note: Does NOT call revalidatePath - client should refresh after calling this
 */
export async function verifyStripeConnectStatus() {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'Non authentifié' };
  }

  if (!stripe) {
    return { error: 'Stripe non configuré' };
  }

  // Get creator profile
  const { data: creatorProfile } = await supabase
    .from('creator_profiles')
    .select('id, stripe_account_id')
    .eq('profile_id', user.id)
    .single();

  if (!creatorProfile || !creatorProfile.stripe_account_id) {
    return { error: 'Aucun compte Stripe trouvé' };
  }

  try {
    // Check account status with Stripe
    const account = await stripe.accounts.retrieve(creatorProfile.stripe_account_id);

    // Update database if onboarding is complete
    // In test mode, details_submitted is usually enough
    // charges_enabled might take longer or require additional verification
    const isOnboardingComplete = account.details_submitted || (account.charges_enabled && account.payouts_enabled);
    
    if (isOnboardingComplete) {
      const { error: updateError } = await supabase
        .from('creator_profiles')
        .update({ stripe_onboarding_completed: true })
        .eq('id', creatorProfile.id);

      if (updateError) {
        console.error('Error updating creator profile:', updateError);
        return { error: 'Erreur lors de la mise à jour' };
      }

      return { success: true, onboardingComplete: true };
    }

    return { success: true, onboardingComplete: false };
  } catch (error: any) {
    console.error('Error verifying Stripe account:', error);
    return { error: error.message || 'Erreur lors de la vérification' };
  }
}

/**
 * Client-callable action to refresh Stripe status
 */
export async function refreshStripeStatus() {
  const result = await verifyStripeConnectStatus();
  return result;
}

