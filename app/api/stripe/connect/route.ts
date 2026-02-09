import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { stripe } from '@/lib/stripe';

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

    // Get return path from request body (optional)
    const body = await request.json().catch(() => ({}));
    const returnPath = body.returnPath || 'settings';

    // Get creator profile (include country so Stripe account uses creator's country)
    const { data: creatorProfile } = await supabase
      .from('creator_profiles')
      .select('id, stripe_account_id, country')
      .eq('profile_id', user.id)
      .single();

    if (!creatorProfile) {
      return NextResponse.json({ error: 'Profil créateur non trouvé' }, { status: 404 });
    }

    const profileCountry = (creatorProfile.country ?? '').trim().toUpperCase();
    if (!profileCountry) {
      return NextResponse.json(
        { error: 'Country required', code: 'country_required' },
        { status: 400 }
      );
    }

    let accountId = creatorProfile.stripe_account_id;

    // If user has an existing Stripe account, check if onboarding was completed.
    // If not (e.g. they got a wrong default country and left), reset: create a new
    // account with the correct country so they start over.
    if (accountId) {
      try {
        const existingAccount = await stripe.accounts.retrieve(accountId);
        const isComplete =
          existingAccount.details_submitted ||
          (existingAccount.charges_enabled && existingAccount.payouts_enabled);
        if (!isComplete) {
          // Incomplete: create new account with creator's country and replace
          const { data: profile } = await supabase
            .from('profiles')
            .select('email, full_name')
            .eq('id', user.id)
            .single();

          const account = await stripe.accounts.create({
            type: 'express',
            country: profileCountry,
            email: profile?.email,
            capabilities: {
              card_payments: { requested: true },
              transfers: { requested: true },
            },
            business_type: 'individual',
            business_profile: {
              product_description: 'LinkedIn content creation and promotion services',
            },
          });

          accountId = account.id;
          await supabase
            .from('creator_profiles')
            .update({
              stripe_account_id: accountId,
              stripe_onboarding_completed: false,
            })
            .eq('id', creatorProfile.id);
        }
      } catch (err) {
        // If retrieve fails (e.g. account deleted), treat as no account and create one below
        accountId = null;
      }
    }

    // Create Stripe Connect account if not exists (or was invalid)
    if (!accountId) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('email, full_name')
        .eq('id', user.id)
        .single();

      const account = await stripe.accounts.create({
        type: 'express',
        country: profileCountry,
        email: profile?.email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_type: 'individual',
        business_profile: {
          product_description: 'LinkedIn content creation and promotion services',
        },
      });

      accountId = account.id;

      await supabase
        .from('creator_profiles')
        .update({ stripe_account_id: accountId })
        .eq('id', creatorProfile.id);
    }

    // Determine base URL dynamically.
    // On localhost, ALWAYS use the current request origin (correct port).
    // In production, prefer NEXT_PUBLIC_APP_URL if set.
    const requestUrl = new URL(request.url);
    const isLocalhost =
      requestUrl.hostname === 'localhost' || requestUrl.hostname === '127.0.0.1';

    const baseUrl = isLocalhost
      ? `${requestUrl.protocol}//${requestUrl.host}`
      : process.env.NEXT_PUBLIC_APP_URL || `${requestUrl.protocol}//${requestUrl.host}`;
    const returnUrl = returnPath === 'finances' 
      ? `${baseUrl}/dashboard/finances?stripe=success`
      : `${baseUrl}/dashboard/settings?stripe=success`;
    
    const refreshUrl = returnPath === 'finances'
      ? `${baseUrl}/dashboard/finances?stripe=refresh`
      : `${baseUrl}/dashboard/settings?stripe=refresh`;

    // Create account link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: refreshUrl,
      return_url: returnUrl,
      type: 'account_onboarding',
    });

    return NextResponse.json({ url: accountLink.url });
  } catch (error: any) {
    console.error('Stripe Connect error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

