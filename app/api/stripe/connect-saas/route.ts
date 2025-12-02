import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { stripe } from '@/lib/stripe';

/**
 * Stripe Connect for SaaS Companies
 * 
 * This allows SaaS companies to connect their Stripe account
 * so we can automatically track revenue from referred customers.
 * 
 * Flow:
 * 1. SaaS clicks "Connect Stripe" button
 * 2. We create an OAuth link to Stripe
 * 3. SaaS authorizes Naano to read their payments
 * 4. Stripe sends us payment webhooks
 * 5. We match payments to tracking sessions and attribute revenue
 */

export async function POST() {
  try {
    if (!stripe) {
      return NextResponse.json({ error: 'Stripe non configuré' }, { status: 503 });
    }

    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    // Get SaaS company profile
    const { data: saasCompany } = await supabase
      .from('saas_companies')
      .select('id, stripe_account_id, company_name')
      .eq('profile_id', user.id)
      .single();

    if (!saasCompany) {
      return NextResponse.json({ error: 'Profil SaaS non trouvé' }, { status: 404 });
    }

    // If already connected, create a dashboard link instead
    if (saasCompany.stripe_account_id) {
      // Create a login link to Stripe dashboard
      const loginLink = await stripe.accounts.createLoginLink(saasCompany.stripe_account_id);
      return NextResponse.json({ 
        url: loginLink.url,
        already_connected: true 
      });
    }

    // Create Stripe Connect OAuth link
    // Using Standard Connect for read-only access to payments
    const state = Buffer.from(JSON.stringify({
      saas_id: saasCompany.id,
      user_id: user.id,
    })).toString('base64');

    const connectUrl = new URL('https://connect.stripe.com/oauth/authorize');
    connectUrl.searchParams.set('response_type', 'code');
    connectUrl.searchParams.set('client_id', process.env.STRIPE_CLIENT_ID!);
    connectUrl.searchParams.set('scope', 'read_only'); // We only need to read payments
    connectUrl.searchParams.set('state', state);
    connectUrl.searchParams.set('redirect_uri', `${process.env.NEXT_PUBLIC_APP_URL}/api/stripe/connect-saas/callback`);
    
    // Pre-fill company name
    if (saasCompany.company_name) {
      connectUrl.searchParams.set('stripe_user[business_name]', saasCompany.company_name);
    }

    return NextResponse.json({ url: connectUrl.toString() });
  } catch (error: any) {
    console.error('Stripe Connect SaaS error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

