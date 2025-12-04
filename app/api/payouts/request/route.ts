import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
});

// Create admin client for database operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Minimum payout amount in EUR
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

    // Get pending earnings
    const { data: pendingAmount, error: earningsError } = await supabaseAdmin.rpc(
      'get_creator_pending_earnings',
      { p_creator_profile_id: creatorProfile.id }
    );

    if (earningsError) {
      console.error('Error getting pending earnings:', earningsError);
      return NextResponse.json({ error: 'Erreur lors du calcul des gains' }, { status: 500 });
    }

    // Check minimum amount
    if ((pendingAmount || 0) < MIN_PAYOUT_AMOUNT) {
      return NextResponse.json({ 
        error: `Montant minimum requis: ${MIN_PAYOUT_AMOUNT}€. Vous avez ${pendingAmount?.toFixed(2) || 0}€` 
      }, { status: 400 });
    }

    // Get all approved commissions for this creator
    const { data: commissions, error: commissionsError } = await supabaseAdmin
      .from('commissions')
      .select(`
        id,
        creator_net_amount,
        collaboration_id,
        collaborations:collaboration_id (
          applications:application_id (
            creator_id
          )
        )
      `)
      .in('status', ['pending', 'approved'])
      .gt('creator_net_amount', 0);

    if (commissionsError) {
      console.error('Error getting commissions:', commissionsError);
      return NextResponse.json({ error: 'Erreur lors de la récupération des commissions' }, { status: 500 });
    }

    // Filter commissions for this creator
    const creatorCommissions = commissions?.filter(c => 
      (c.collaborations as any)?.applications?.creator_id === creatorProfile.id
    ) || [];

    if (creatorCommissions.length === 0) {
      return NextResponse.json({ error: 'Aucune commission à verser' }, { status: 400 });
    }

    // Calculate total payout amount (in cents for Stripe)
    const totalAmount = creatorCommissions.reduce((sum, c) => sum + (c.creator_net_amount || 0), 0);
    const amountInCents = Math.round(totalAmount * 100);

    // Create payout record
    const { data: payout, error: payoutError } = await supabaseAdmin
      .from('commission_payouts')
      .insert({
        creator_profile_id: creatorProfile.id,
        amount: totalAmount,
        currency: 'eur',
        stripe_account_id: creatorProfile.stripe_account_id,
        status: 'processing',
      })
      .select()
      .single();

    if (payoutError) {
      console.error('Error creating payout record:', payoutError);
      return NextResponse.json({ error: 'Erreur lors de la création du virement' }, { status: 500 });
    }

    try {
      // Create Stripe transfer
      const transfer = await stripe.transfers.create({
        amount: amountInCents,
        currency: 'eur',
        destination: creatorProfile.stripe_account_id,
        description: `Konex - Paiement commissions (${creatorCommissions.length} commissions)`,
        metadata: {
          payout_id: payout.id,
          creator_profile_id: creatorProfile.id,
          commission_count: creatorCommissions.length.toString(),
        },
      });

      // Update payout with Stripe transfer ID
      await supabaseAdmin
        .from('commission_payouts')
        .update({
          stripe_transfer_id: transfer.id,
          status: 'completed',
          completed_at: new Date().toISOString(),
        })
        .eq('id', payout.id);

      // Update all commissions to paid status
      const commissionIds = creatorCommissions.map(c => c.id);
      await supabaseAdmin
        .from('commissions')
        .update({
          status: 'paid',
          paid_at: new Date().toISOString(),
          payout_id: payout.id,
        })
        .in('id', commissionIds);

      return NextResponse.json({
        success: true,
        message: 'Virement effectué avec succès',
        payout: {
          id: payout.id,
          amount: totalAmount,
          currency: 'eur',
          commissions_count: creatorCommissions.length,
          stripe_transfer_id: transfer.id,
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

