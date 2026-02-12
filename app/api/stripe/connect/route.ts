import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { stripe } from '@/lib/stripe';
import type Stripe from 'stripe';

/** Build Stripe Express account create params from creator profile. Uses company (EIN/tax ID) for business accounts, individual (SSN) otherwise. */
function buildStripeAccountParams(
  profileCountry: string,
  email: string | null,
  creator: {
    legal_status: string | null;
    company_legal_name: string | null;
    company_registration_country: string | null;
    company_tax_id: string | null;
    company_vat_number: string | null;
    company_registered_address: string | null;
  }
): Stripe.AccountCreateParams {
  const isBusiness =
    creator.legal_status === 'professionnel' &&
    (creator.company_legal_name ?? '').trim() !== '';

  const base = {
    type: 'express',
    country: profileCountry,
    email: email ?? undefined,
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
    business_profile: {
      product_description: 'LinkedIn content creation and promotion services',
    },
  } as Stripe.AccountCreateParams;

  if (isBusiness) {
    const companyName = (creator.company_legal_name ?? '').trim();
    const companyCountry = (creator.company_registration_country ?? '').trim().toUpperCase();
    const taxId = (creator.company_tax_id ?? '').replace(/\s+/g, '').trim() || undefined;
    const vatId = (creator.company_vat_number ?? '').trim() || undefined;
    const addressLine1 = (creator.company_registered_address ?? '').trim() || undefined;

    const company: Stripe.AccountCreateParams.Company = {
      name: companyName,
      ...(taxId && { tax_id: taxId }),
      ...(vatId && { vat_id: vatId }),
      ...(addressLine1 &&
        companyCountry && {
          address: {
            line1: addressLine1,
            country: companyCountry,
          },
        }),
    };

    return {
      ...base,
      business_type: 'company',
      company,
    };
  }

  return {
    ...base,
    business_type: 'individual',
  };
}

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

    // Get creator profile: country, Stripe id, and legal/company fields so we request EIN (company) vs SSN (individual)
    const { data: creatorProfile } = await supabase
      .from('creator_profiles')
      .select(
        'id, stripe_account_id, country, legal_status, company_legal_name, company_registration_country, company_tax_id, company_vat_number, company_registered_address'
      )
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
    // account with the correct country and business type so they start over.
    if (accountId) {
      try {
        const existingAccount = await stripe.accounts.retrieve(accountId);
        const isComplete =
          existingAccount.details_submitted ||
          (existingAccount.charges_enabled && existingAccount.payouts_enabled);
        if (!isComplete) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('email, full_name')
            .eq('id', user.id)
            .single();

          const accountParams = buildStripeAccountParams(
            profileCountry,
            profile?.email ?? null,
            creatorProfile
          );
          const account = await stripe.accounts.create(accountParams);

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

      const accountParams = buildStripeAccountParams(
        profileCountry,
        profile?.email ?? null,
        creatorProfile
      );
      const account = await stripe.accounts.create(accountParams);

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

