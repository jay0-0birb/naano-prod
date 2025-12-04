'use server';

import { createClient } from '@/lib/supabase/server';
import { stripe } from '@/lib/stripe';

/**
 * Verify and update SaaS subscription status from Stripe
 * Called after Stripe Checkout to ensure status is up to date
 */
export async function verifySubscriptionStatus() {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'Non authentifié' };
  }

  if (!stripe) {
    return { error: 'Stripe non configuré' };
  }

  // Get SaaS company
  const { data: saasCompany } = await supabase
    .from('saas_companies')
    .select('id, stripe_subscription_id')
    .eq('profile_id', user.id)
    .single();

  if (!saasCompany) {
    return { error: 'Entreprise non trouvée' };
  }

  try {
    // If no subscription ID, check for recent checkout sessions
    if (!saasCompany.stripe_subscription_id) {
      // Get user email to search checkout sessions
      const { data: profile } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', user.id)
        .single();

      if (profile?.email) {
        // First, try to find customer by email
        let customerId: string | null = null;
        try {
          const customers = await stripe.customers.list({
            email: profile.email,
            limit: 1,
          });
          if (customers.data.length > 0) {
            customerId = customers.data[0].id;
          }
        } catch (err) {
          console.error('Error searching for customer:', err);
        }

        // If we found a customer, search their subscriptions
        if (customerId) {
          try {
            const subscriptions = await stripe.subscriptions.list({
              customer: customerId,
              limit: 10,
              status: 'all',
            });

            // Find subscription with matching metadata
            const matchingSubscription = subscriptions.data.find(
              (sub) => sub.metadata?.saas_id === saasCompany.id && sub.status === 'active'
            );

            if (matchingSubscription) {
              const tier = matchingSubscription.metadata?.tier as string;
              if (tier) {
                const { error: updateError } = await supabase
                  .from('saas_companies')
                  .update({
                    subscription_tier: tier,
                    stripe_subscription_id: matchingSubscription.id,
                    subscription_status: 'active',
                  })
                  .eq('id', saasCompany.id);

                if (!updateError) {
                  console.log(`✅ Found subscription via customer search: ${matchingSubscription.id}`);
                  return { success: true, tier, status: 'active' };
                }
              }
            }
          } catch (err) {
            console.error('Error searching subscriptions:', err);
          }
        }

        // Fallback: Search for recent completed checkout sessions (last 7 days)
        const sessions = await stripe.checkout.sessions.list({
          limit: 20,
          created: { gte: Math.floor(Date.now() / 1000) - 604800 }, // Last 7 days
        });

        // Find the most recent completed subscription session for this SaaS
        // Check both by email and by metadata
        const recentSubscriptionSession = sessions.data.find(
          (s) => s.mode === 'subscription' && 
                 s.status === 'complete' && 
                 s.subscription &&
                 (s.customer_email === profile.email || s.metadata?.saas_id === saasCompany.id)
        );

        if (recentSubscriptionSession && recentSubscriptionSession.subscription) {
          const subscriptionId = typeof recentSubscriptionSession.subscription === 'string' 
            ? recentSubscriptionSession.subscription 
            : recentSubscriptionSession.subscription.id;
          
          // Get tier from metadata or retrieve subscription
          let tier = recentSubscriptionSession.metadata?.tier as string;
          
          if (!tier && subscriptionId) {
            // Retrieve subscription to get metadata
            try {
              const subscription = await stripe.subscriptions.retrieve(subscriptionId);
              tier = subscription.metadata?.tier as string;
            } catch (err) {
              console.error('Error retrieving subscription:', err);
            }
          }

          if (tier) {
            // Update database with subscription
            const { error: updateError } = await supabase
              .from('saas_companies')
              .update({
                subscription_tier: tier,
                stripe_subscription_id: subscriptionId,
                subscription_status: 'active',
              })
              .eq('id', saasCompany.id);

            if (updateError) {
              console.error('Error updating subscription:', updateError);
            } else {
              console.log(`✅ Found and synced subscription ${subscriptionId} for SaaS ${saasCompany.id}: ${tier}`);
              return { success: true, tier, status: 'active' };
            }
          }
        }
      }

      return { success: true, tier: 'starter' };
    }

    // Check subscription status with Stripe
    const subscription = await stripe.subscriptions.retrieve(saasCompany.stripe_subscription_id);
    
    const tier = subscription.metadata?.tier as string;
    const status = subscription.status === 'active' ? 'active' : 
                   subscription.status === 'past_due' ? 'past_due' : 'active';

    if (tier) {
      // Update database
      const { error: updateError } = await supabase
        .from('saas_companies')
        .update({
          subscription_tier: tier,
          subscription_status: status,
        })
        .eq('id', saasCompany.id);

      if (updateError) {
        console.error('Error updating subscription:', updateError);
        return { error: 'Erreur lors de la mise à jour' };
      }

      return { success: true, tier, status };
    }

    return { success: true, tier: 'starter' };
  } catch (error: any) {
    console.error('Error verifying subscription:', error);
    return { error: error.message || 'Erreur lors de la vérification' };
  }
}

