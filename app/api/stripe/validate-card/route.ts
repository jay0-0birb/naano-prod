import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { stripe } from '@/lib/stripe';

/**
 * Validate card after Setup Intent succeeds
 * Updates SaaS card status and grants dashboard access (BP1.md)
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

    const { setup_intent_id } = await request.json();

    if (!setup_intent_id) {
      return NextResponse.json({ error: 'setup_intent_id requis' }, { status: 400 });
    }

    // Get Setup Intent from Stripe
    const setupIntent = await stripe.setupIntents.retrieve(setup_intent_id);

    console.log('[validate-card] Setup Intent status:', setupIntent.status);

    if (setupIntent.status !== 'succeeded') {
      return NextResponse.json({ 
        error: `Setup Intent non complété (status: ${setupIntent.status})`,
        status: setupIntent.status 
      }, { status: 400 });
    }

    // Get payment method details
    const paymentMethodId = setupIntent.payment_method as string;
    if (!paymentMethodId) {
      return NextResponse.json({ error: 'Aucune méthode de paiement trouvée' }, { status: 400 });
    }

    const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);

    // Get SaaS company
    const { data: saasCompany } = await supabase
      .from('saas_companies')
      .select('id, stripe_customer_id')
      .eq('profile_id', user.id)
      .single();

    if (!saasCompany) {
      return NextResponse.json({ error: 'Entreprise SaaS non trouvée' }, { status: 404 });
    }

    // The payment method should already be attached to the customer via the setup intent
    // But let's verify and attach if needed
    if (!paymentMethod.customer && saasCompany.stripe_customer_id) {
      // Attach payment method to customer
      await stripe.paymentMethods.attach(paymentMethodId, {
        customer: saasCompany.stripe_customer_id,
      });
      // Refresh payment method to get updated customer
      const updatedPaymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);
      if (updatedPaymentMethod.customer !== saasCompany.stripe_customer_id) {
        return NextResponse.json({ error: 'Impossible d\'attacher la méthode de paiement' }, { status: 500 });
      }
    } else if (paymentMethod.customer && paymentMethod.customer !== saasCompany.stripe_customer_id) {
      return NextResponse.json({ error: 'Méthode de paiement invalide' }, { status: 403 });
    }

    // No need for pre-authorization - SetupIntent confirmation is enough
    // The card is already validated by Stripe when the SetupIntent succeeds
    // We can optionally verify the payment method is valid by checking its details
    if (!paymentMethod.card) {
      return NextResponse.json({ 
        error: 'Type de carte non supporté'
      }, { status: 400 });
    }

    // Update SaaS company with card info
    await supabase
      .from('saas_companies')
      .update({
        card_on_file: true,
        card_last4: paymentMethod.card?.last4 || null,
        card_brand: paymentMethod.card?.brand || null,
        stripe_setup_intent_id: setup_intent_id,
      })
      .eq('id', saasCompany.id);

    return NextResponse.json({
      success: true,
      message: 'Carte validée avec succès',
      card: {
        last4: paymentMethod.card?.last4,
        brand: paymentMethod.card?.brand,
      },
    });
  } catch (error: any) {
    console.error('Card validation error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

