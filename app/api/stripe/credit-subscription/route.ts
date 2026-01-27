import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { stripe } from '@/lib/stripe';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// Use service role for admin operations
const supabaseAdmin = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
  ? createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )
  : null;

/**
 * Create credit subscription checkout
 * POST /api/stripe/credit-subscription
 * Body: { creditVolume: number } (e.g., 1200)
 */
export async function POST(request: Request) {
  try {
    if (!stripe) {
      return NextResponse.json({ error: 'Stripe non configuré' }, { status: 503 });
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Supabase non configuré' }, { status: 503 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { creditVolume } = await request.json();

    // Validate credit volume
    if (!creditVolume || creditVolume < 100 || creditVolume > 10000) {
      return NextResponse.json(
        { error: 'Volume de crédits invalide (100-10000)' },
        { status: 400 }
      );
    }

    // Get SaaS company
    const { data: saasCompany } = await supabase
      .from('saas_companies')
      .select('id, company_name, profile_id')
      .eq('profile_id', user.id)
      .single();

    if (!saasCompany) {
      return NextResponse.json({ error: 'Entreprise non trouvée' }, { status: 404 });
    }

    // Get user email
    const { data: profile } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', user.id)
      .single();

    // Calculate price using database function (from planP.md pricing table)
    const { data: unitPrice, error: priceError } = await supabaseAdmin.rpc(
      'get_credit_unit_price',
      { volume: creditVolume }
    );

    if (priceError || !unitPrice) {
      console.error('Error calculating credit price:', priceError);
      return NextResponse.json(
        { error: 'Erreur de calcul du prix' },
        { status: 500 }
      );
    }

    const totalPrice = Number(unitPrice) * creditVolume;
    const totalPriceCents = Math.round(totalPrice * 100); // Convert to cents

    // Get or create Stripe customer
    let customerId: string;
    
    // Check if we have a customer ID stored (you might want to add stripe_customer_id to saas_companies)
    // For now, search by email or create new
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
          saas_id: saasCompany.id,
          user_id: user.id,
        },
      });
      customerId = customer.id;
    }

    // Get base price ID from env
    const basePriceId = process.env.STRIPE_PRICE_CREDITS_BASE;
    if (!basePriceId) {
      return NextResponse.json(
        { error: 'STRIPE_PRICE_CREDITS_BASE non configuré' },
        { status: 500 }
      );
    }

    // Note: If SaaS already has a subscription, we'll handle updates via Stripe portal
    // For now, create new subscription (user can manage via portal)

    // Create subscription checkout with custom pricing
    // We'll use subscription mode and handle the custom amount via webhook
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: basePriceId,
          quantity: creditVolume, // Use quantity to track volume
        },
      ],
      // Enable Stripe Tax for automatic VAT/tax calculation
      automatic_tax: {
        enabled: true,
      },
      // Collect billing address for tax calculation
      billing_address_collection: 'auto',
      subscription_data: {
        metadata: {
          credit_volume: creditVolume.toString(),
          unit_price: unitPrice.toString(),
          total_price: totalPrice.toString(),
          total_price_cents: totalPriceCents.toString(),
          saas_id: saasCompany.id,
          type: 'credit_subscription',
        },
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/finances?credits=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/finances?credits=cancelled`,
      metadata: {
        saas_id: saasCompany.id,
        credit_volume: creditVolume.toString(),
        unit_price: unitPrice.toString(),
        total_price: totalPrice.toString(),
        total_price_cents: totalPriceCents.toString(),
        type: 'credit_subscription',
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('Credit subscription error:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    );
  }
}
