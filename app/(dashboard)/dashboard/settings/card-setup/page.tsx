import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { stripe } from '@/lib/stripe';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import CardSetupClient from './card-setup-client';

const supabaseAdmin = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
  ? createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )
  : null;

interface PageProps {
  searchParams: Promise<{ setup_intent?: string; client_secret?: string; refresh?: string }>;
}

export default async function CardSetupPage({ searchParams }: PageProps) {
  const { setup_intent, client_secret } = await searchParams;
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  if (!stripe || !supabaseAdmin) {
    redirect('/dashboard/settings?error=stripe_not_configured');
  }

  // Always create a fresh setup intent to avoid "unexpected_state" errors
  // Get SaaS company
  const { data: saasCompany } = await supabaseAdmin
    .from('saas_companies')
    .select('id, company_name, stripe_customer_id')
    .eq('profile_id', user.id)
    .single();

  if (!saasCompany) {
    redirect('/dashboard/settings?error=saas_not_found');
  }

  // Create or get Stripe customer
  let customerId = saasCompany.stripe_customer_id;
  if (!customerId) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('id', user.id)
      .single();

    const customer = await stripe.customers.create({
      email: profile?.email,
      name: profile?.full_name || saasCompany.company_name,
      metadata: {
        saas_id: saasCompany.id,
        profile_id: user.id,
      },
    });

    customerId = customer.id;
    await supabaseAdmin
      .from('saas_companies')
      .update({ stripe_customer_id: customerId })
      .eq('id', saasCompany.id);
  }

  // Always create a fresh Setup Intent (don't reuse old ones)
  const setupIntent = await stripe.setupIntents.create({
    customer: customerId,
    payment_method_types: ['card'],
    usage: 'off_session',
    metadata: {
      saas_id: saasCompany.id,
      purpose: 'card_validation',
    },
  });

  return (
    <CardSetupClient 
      setupIntentId={setupIntent.id}
      clientSecret={setupIntent.client_secret!}
    />
  );
}

