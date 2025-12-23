import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { stripe } from '@/lib/stripe';

// Create admin client for database operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Minimum payout amount in EUR (from BP1.md)
const MIN_PAYOUT_AMOUNT = 50;

export async function POST(request: Request) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];

    // Verify the user
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Get creator profile
    const { data: creatorProfile, error: profileError } = await supabaseAdmin
      .from('creator_profiles')
      .select('id, stripe_account_id, stripe_onboarding_completed')
      .eq('profile_id', user.id)
      .single();

    if (profileError || !creatorProfile) {
      return NextResponse.json({ error: 'Profil créateur non trouvé' }, { status: 404 });
    }

    // Check if Stripe is connected
    if (!creatorProfile.stripe_account_id || !creatorProfile.stripe_onboarding_completed) {
      return NextResponse.json({ 
        error: 'Veuillez d\'abord connecter votre compte Stripe dans les paramètres' 
      }, { status: 400 });
    }

    // Get creator wallet (BP1.md model)
    const { data: wallet, error: walletError } = await supabaseAdmin
      .from('creator_wallets')
      .select('available_balance')
      .eq('creator_id', creatorProfile.id)
      .single();

    if (walletError || !wallet) {
      console.error('Error getting wallet:', walletError);
      return NextResponse.json({ error: 'Erreur lors de la récupération du portefeuille' }, { status: 500 });
    }

    const availableBalance = Number(wallet.available_balance || 0);

    // Check minimum amount (BP1.md: €50 threshold)
    if (availableBalance < MIN_PAYOUT_AMOUNT) {
      return NextResponse.json({ 
        error: `Montant minimum requis: ${MIN_PAYOUT_AMOUNT}€. Vous avez ${availableBalance.toFixed(2)}€ disponible` 
      }, { status: 400 });
    }

    // Use all available balance for payout
    const payoutAmount = availableBalance;
    const amountInCents = Math.round(payoutAmount * 100);

    // Create payout and invoice using database function (BP1.md)
    const { data: payoutId, error: payoutError } = await supabaseAdmin.rpc(
      'create_creator_payout',
      {
        p_creator_id: creatorProfile.id,
        p_amount: payoutAmount,
        p_stripe_account_id: creatorProfile.stripe_account_id,
      }
    );

    if (payoutError) {
      console.error('Error creating payout:', payoutError);
      return NextResponse.json({ 
        error: 'Erreur lors de la création du virement',
        details: payoutError.message 
      }, { status: 500 });
    }

    // Get payout details
    const { data: payout } = await supabaseAdmin
      .from('creator_payouts')
      .select('*')
      .eq('id', payoutId)
      .single();

    if (!payout) {
      return NextResponse.json({ error: 'Payout not found after creation' }, { status: 500 });
    }

    try {
      // Create Stripe transfer (Naano → Creator)
      const transfer = await stripe.transfers.create({
        amount: amountInCents,
        currency: 'eur',
        destination: creatorProfile.stripe_account_id,
        description: `Naano - Paiement commissions (${payoutAmount.toFixed(2)}€)`,
        metadata: {
          payout_id: payout.id,
          creator_profile_id: creatorProfile.id,
        },
      });

      // Update payout with Stripe transfer ID
      await supabaseAdmin
        .from('creator_payouts')
        .update({
          stripe_transfer_id: transfer.id,
          status: 'completed',
          completed_at: new Date().toISOString(),
        })
        .eq('id', payout.id);

      // Get creator invoice (created by function)
      const { data: creatorInvoice } = await supabaseAdmin
        .from('creator_invoices')
        .select('*')
        .eq('payout_id', payout.id)
        .single();

      return NextResponse.json({
        success: true,
        message: 'Virement effectué avec succès',
        payout: {
          id: payout.id,
          amount: payoutAmount,
          currency: 'eur',
          stripe_transfer_id: transfer.id,
          invoice_id: creatorInvoice?.id,
          invoice_number: creatorInvoice?.invoice_number,
        },
      });

    } catch (stripeError: any) {
      console.error('Stripe transfer error:', stripeError);

      // Update payout as failed
      await supabaseAdmin
        .from('commission_payouts')
        .update({
          status: 'failed',
          failure_reason: stripeError.message,
        })
        .eq('id', payout.id);

      return NextResponse.json({ 
        error: `Erreur Stripe: ${stripeError.message}` 
      }, { status: 500 });
    }

  } catch (error: any) {
    console.error('Payout request error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

