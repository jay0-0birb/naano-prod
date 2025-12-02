import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { stripe } from '@/lib/stripe';

/**
 * Stripe Connect OAuth Callback for SaaS
 * 
 * After SaaS authorizes Naano, Stripe redirects here with an authorization code.
 * We exchange it for access credentials and save them.
 */

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  // Handle errors from Stripe
  if (error) {
    console.error('Stripe Connect error:', error, errorDescription);
    return NextResponse.redirect(
      new URL(`/dashboard/settings?stripe_error=${encodeURIComponent(errorDescription || error)}`, request.url)
    );
  }

  if (!code || !state) {
    return NextResponse.redirect(
      new URL('/dashboard/settings?stripe_error=missing_params', request.url)
    );
  }

  try {
    if (!stripe) {
      throw new Error('Stripe not configured');
    }

    // Decode state to get SaaS info
    const stateData = JSON.parse(Buffer.from(state, 'base64').toString());
    const { saas_id, user_id } = stateData;

    // Exchange authorization code for access token
    const response = await stripe.oauth.token({
      grant_type: 'authorization_code',
      code: code,
    });

    const stripeAccountId = response.stripe_user_id;

    // Save to database using service role
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Update SaaS company with Stripe account ID
    const { error: updateError } = await supabase
      .from('saas_companies')
      .update({
        stripe_account_id: stripeAccountId,
        stripe_connected_at: new Date().toISOString(),
      })
      .eq('id', saas_id);

    if (updateError) {
      console.error('Error saving Stripe account:', updateError);
      throw updateError;
    }

    console.log(`SaaS ${saas_id} connected Stripe account ${stripeAccountId}`);

    // Redirect back to settings with success
    return NextResponse.redirect(
      new URL('/dashboard/settings?stripe_success=true', request.url)
    );

  } catch (err: any) {
    console.error('Stripe Connect callback error:', err);
    return NextResponse.redirect(
      new URL(`/dashboard/settings?stripe_error=${encodeURIComponent(err.message)}`, request.url)
    );
  }
}

