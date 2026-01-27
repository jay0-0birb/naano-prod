import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    // Load creator profile for this user
    const { data: creatorProfile, error: creatorError } = await supabase
      .from('creator_profiles')
      .select('id, stripe_account_id, stripe_onboarding_completed')
      .eq('profile_id', user.id)
      .single();

    if (creatorError || !creatorProfile) {
      return NextResponse.json(
        { error: "Profil créateur introuvable" },
        { status: 404 },
      );
    }

    // Load wallet balances to ensure no money is pending/available
    const { data: wallet } = await supabase
      .from('creator_wallets')
      .select('pending_balance, available_balance')
      .eq('creator_id', creatorProfile.id)
      .single();

    const pending = Number(wallet?.pending_balance || 0);
    const available = Number(wallet?.available_balance || 0);

    if (pending > 0 || available > 0) {
      return NextResponse.json(
        {
          error:
            "Impossible de déconnecter Stripe : des gains sont encore en attente de paiement. Merci de contacter Naano pour fermer votre compte.",
          blocking: true,
        },
        { status: 400 },
      );
    }

    // Soft-disconnect: clear Stripe flags so the app requires reconnection
    const { error: updateError } = await supabase
      .from('creator_profiles')
      .update({
        stripe_onboarding_completed: false,
        stripe_account_id: null,
      })
      .eq('id', creatorProfile.id);

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('disconnect-creator error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

