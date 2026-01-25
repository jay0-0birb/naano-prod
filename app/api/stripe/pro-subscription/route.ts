import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { stripe } from '@/lib/stripe';

/**
 * Create Creator Pro subscription checkout
 * POST /api/stripe/pro-subscription
 * Body: { plan: 'monthly' | 'annual' }
 */
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

    const { plan } = await request.json();

    // Validate plan
    if (plan !== 'monthly' && plan !== 'annual') {
      return NextResponse.json(
        { error: 'Plan invalide (monthly ou annual)' },
        { status: 400 }
      );
    }

    // Get creator profile
    const { data: creatorProfile } = await supabase
      .from('creator_profiles')
      .select('id, profile_id')
      .eq('profile_id', user.id)
      .single();

    if (!creatorProfile) {
      return NextResponse.json({ error: 'Profil créateur non trouvé' }, { status: 404 });
    }

    // Get user email
    const { data: profile } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', user.id)
      .single();

    // Get price ID based on plan
    const priceId = plan === 'monthly' 
      ? process.env.STRIPE_PRICE_PRO_MONTHLY
      : process.env.STRIPE_PRICE_PRO_ANNUAL;

    if (!priceId) {
      return NextResponse.json(
        { error: `STRIPE_PRICE_PRO_${plan.toUpperCase()} non configuré` },
        { status: 500 }
      );
    }

    // Check if creator already has Pro subscription
    if (creatorProfile.stripe_subscription_id_pro) {
      // Redirect to billing portal to manage existing subscription
      try {
        const subscription = await stripe.subscriptions.retrieve(
          creatorProfile.stripe_subscription_id_pro
        );
        const customerId = subscription.customer as string;

        const portalSession = await stripe.billingPortal.sessions.create({
          customer: customerId,
          return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings`,
        });

        return NextResponse.json({ url: portalSession.url });
      } catch (error) {
        // Subscription might not exist, continue to create new one
        console.error('Error retrieving subscription:', error);
      }
    }

    // Get or create Stripe customer
    let customerId: string;
    const customers = await stripe.customers.list({
      email: profile?.email,
      limit: 1,
    });
    
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    } else {
      const customer = await stripe.customers.create({
        email: profile?.email,
        metadata: {
          creator_id: creatorProfile.id,
          user_id: user.id,
        },
      });
      customerId = customer.id;
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      subscription_data: {
        metadata: {
          creator_id: creatorProfile.id,
          user_id: user.id,
          plan: plan,
          type: 'creator_pro',
        },
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?pro=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?pro=cancelled`,
      metadata: {
        creator_id: creatorProfile.id,
        plan: plan,
        type: 'creator_pro',
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('Pro subscription error:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    );
  }
}
