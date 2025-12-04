import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { SAAS_TIERS, CREATOR_TIERS, SaasTier, CreatorTier, COMMISSION_CONFIG } from '@/lib/subscription-config';
import { verifyStripeConnectStatus } from '@/lib/stripe-status';
import FinancesPageClient from './page-client';

interface PageProps {
  searchParams: Promise<{ subscription?: string; tier?: string; stripe?: string }>;
}

export default async function FinancesPage({ searchParams }: PageProps) {
  const { subscription, tier: newTier, stripe: stripeStatus } = await searchParams;
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, onboarding_completed, full_name')
    .eq('id', user.id)
    .single();

  if (!profile?.onboarding_completed) {
    redirect('/dashboard/onboarding');
  }

  const isCreator = profile?.role === 'influencer';

  if (isCreator) {
    // Get creator data
    const { data: creatorProfile } = await supabase
      .from('creator_profiles')
      .select('id, subscription_tier, stripe_account_id, stripe_onboarding_completed')
      .eq('profile_id', user.id)
      .single();

    if (!creatorProfile) redirect('/dashboard');

    const tier = (creatorProfile.subscription_tier || 'free') as CreatorTier;
    
    // Count active SaaS - handle if function doesn't exist
    let activeSaas = 0;
    try {
      const { data } = await supabase.rpc('count_creator_active_saas', {
        creator_id: creatorProfile.id
      });
      activeSaas = data || 0;
    } catch {
      // Function may not exist yet, count manually
      const { count } = await supabase
        .from('collaborations')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');
      activeSaas = count || 0;
    }

    // Generate Stripe success message if coming from Stripe
    const stripeMessage = stripeStatus === 'success' 
      ? 'Votre compte Stripe a été configuré avec succès !'
      : undefined;

    return (
      <FinancesPageClient
        isCreator={true}
        creatorData={{
          tier,
          tierConfig: CREATOR_TIERS[tier],
          activeSaas,
          maxSaas: CREATOR_TIERS[tier].maxSaas,
          stripeConnected: creatorProfile.stripe_onboarding_completed || false,
          commissionRate: COMMISSION_CONFIG.creatorRate,
          platformFee: COMMISSION_CONFIG.platformCreatorFee,
          minPayout: COMMISSION_CONFIG.minPayoutAmount,
        }}
        stripeMessage={stripeMessage}
      />
    );
  } else {
    // Get SaaS data
    const { data: saasCompany } = await supabase
      .from('saas_companies')
      .select('id, company_name, subscription_tier, subscription_status, stripe_subscription_id')
      .eq('profile_id', user.id)
      .single();

    if (!saasCompany) redirect('/dashboard');

    const tier = (saasCompany.subscription_tier || 'starter') as SaasTier;
    
    // Count active creators - handle if function doesn't exist
    let activeCreators = 0;
    try {
      const { data } = await supabase.rpc('count_saas_active_creators', {
        saas_id: saasCompany.id
      });
      activeCreators = data || 0;
    } catch {
      // Function may not exist yet, count manually
      const { count } = await supabase
        .from('collaborations')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');
      activeCreators = count || 0;
    }

    // Generate subscription message if coming from Stripe
    let subscriptionMessage: string | undefined;
    // Use tier from URL if available (more recent than DB), otherwise use DB tier
    let displayTier = tier;
    
    if (subscription === 'success' && newTier) {
      const tierName = SAAS_TIERS[newTier as SaasTier]?.name || newTier;
      subscriptionMessage = `Félicitations ! Votre abonnement ${tierName} est maintenant actif.`;
      
      // If URL tier is different from DB tier, use URL tier (it's more recent)
      if (newTier !== tier && SAAS_TIERS[newTier as SaasTier]) {
        displayTier = newTier as SaasTier;
      }
    } else if (subscription === 'cancelled') {
      subscriptionMessage = undefined; // No message for cancelled
    }

    return (
      <FinancesPageClient
        isCreator={false}
        saasData={{
          companyName: saasCompany.company_name,
          tier: displayTier,
          tierConfig: SAAS_TIERS[displayTier],
          subscriptionStatus: saasCompany.subscription_status || 'active',
          activeCreators,
          maxCreators: SAAS_TIERS[displayTier].maxCreators,
          allTiers: SAAS_TIERS,
          commissionConfig: COMMISSION_CONFIG,
        }}
        subscriptionMessage={subscriptionMessage}
      />
    );
  }
}
