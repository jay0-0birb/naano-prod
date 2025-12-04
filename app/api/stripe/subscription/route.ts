import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { stripe } from '@/lib/stripe';
import { SAAS_TIERS, SaasTier } from '@/lib/subscription-config';

// Stripe Price IDs - set these in your environment or Stripe dashboard
// You'll need to create these products/prices in Stripe first
const STRIPE_PRICE_IDS: Record<SaasTier, string | null> = {
  starter: null, // Free plan, no Stripe price
  growth: process.env.STRIPE_PRICE_GROWTH || 'price_growth_placeholder',
  scale: process.env.STRIPE_PRICE_SCALE || 'price_scale_placeholder',
};

export async function POST(request: Request) {
  try {
    if (!stripe) {
      return NextResponse.json({ error: 'Stripe non configuré' }, { status: 503 });
    }

    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { tier } = await request.json();

    // Validate tier
    if (!tier || !SAAS_TIERS[tier as SaasTier]) {
      return NextResponse.json({ error: 'Plan invalide' }, { status: 400 });
    }

    // Get SaaS company
    const { data: saasCompany } = await supabase
      .from('saas_companies')
      .select('id, company_name, stripe_subscription_id, subscription_tier')
      .eq('profile_id', user.id)
      .single();

    if (!saasCompany) {
      return NextResponse.json({ error: 'Entreprise non trouvée' }, { status: 404 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', user.id)
      .single();

    const targetTier = tier as SaasTier;
    const currentTier = (saasCompany.subscription_tier || 'starter') as SaasTier;

    // If downgrading to starter (free), cancel subscription
    if (targetTier === 'starter') {
      if (saasCompany.stripe_subscription_id) {
        await stripe.subscriptions.cancel(saasCompany.stripe_subscription_id);
        
        await supabase
          .from('saas_companies')
          .update({ 
            subscription_tier: 'starter',
            stripe_subscription_id: null,
            subscription_status: 'active'
          })
          .eq('id', saasCompany.id);
      }
      
      return NextResponse.json({ 
        success: true, 
        message: 'Abonnement annulé, retour au plan Starter' 
      });
    }

    const priceId = STRIPE_PRICE_IDS[targetTier];
    if (!priceId || priceId.includes('placeholder')) {
      return NextResponse.json({ 
        error: 'Les prix Stripe ne sont pas encore configurés. Contactez le support.' 
      }, { status: 503 });
    }

    // If already has subscription, create a checkout session for the upgrade/downgrade
    // This shows the payment page - old subscription will be cancelled when new one is created
    if (saasCompany.stripe_subscription_id) {
      const subscription = await stripe.subscriptions.retrieve(saasCompany.stripe_subscription_id);
      const customerId = subscription.customer as string;
      const oldSubscriptionId = saasCompany.stripe_subscription_id;

      // Create new checkout session for the new plan
      // The old subscription will be cancelled in the webhook when new one is confirmed
      const session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        payment_method_types: ['card'],
        customer: customerId, // Use existing customer
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/finances?subscription=success&tier=${targetTier}`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/finances?subscription=cancelled`,
        metadata: {
          saas_id: saasCompany.id,
          tier: targetTier,
          user_id: user.id,
          old_subscription_id: oldSubscriptionId, // Store old subscription ID to cancel it later
          is_upgrade: 'true',
        },
        subscription_data: {
          metadata: {
            saas_id: saasCompany.id,
            tier: targetTier,
            old_subscription_id: oldSubscriptionId,
          },
        },
      });

      return NextResponse.json({ url: session.url });
    }

    // Create new checkout session for new subscription
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      customer_email: profile?.email,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/finances?subscription=success&tier=${targetTier}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/finances?subscription=cancelled`,
      metadata: {
        saas_id: saasCompany.id,
        tier: targetTier,
        user_id: user.id,
      },
      subscription_data: {
        metadata: {
          saas_id: saasCompany.id,
          tier: targetTier,
        },
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('Stripe subscription error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Handle subscription management (portal)
export async function GET() {
  try {
    if (!stripe) {
      return NextResponse.json({ error: 'Stripe non configuré' }, { status: 503 });
    }

    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { data: saasCompany } = await supabase
      .from('saas_companies')
      .select('stripe_subscription_id')
      .eq('profile_id', user.id)
      .single();

    if (!saasCompany?.stripe_subscription_id) {
      return NextResponse.json({ 
        error: 'Aucun abonnement actif trouvé. Cliquez sur le bouton de synchronisation pour mettre à jour votre statut.' 
      }, { status: 400 });
    }

    // Get customer ID from subscription
    const subscription = await stripe.subscriptions.retrieve(saasCompany.stripe_subscription_id);
    const customerId = subscription.customer as string;

    // Create billing portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/finances`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('Stripe portal error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

