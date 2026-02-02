import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { getCreatorWalletSummary, getCreatorPayoutHistory } from '@/lib/wallet';
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
    // Get creator data (including Pro status + legal status for €500 cap)
    const { data: creatorProfile } = await supabase
      .from('creator_profiles')
      .select('id, subscription_tier, stripe_account_id, stripe_onboarding_completed, is_pro, pro_status_source, pro_expiration_date, stripe_subscription_id_pro, legal_status, siret_number')
      .eq('profile_id', user.id)
      .single();

    if (!creatorProfile) redirect('/dashboard');

    // Count active SaaS - handle if function doesn't exist
    let activeSaas = 0;
    try {
      const { data } = await supabase.rpc('count_creator_active_saas', {
        p_creator_id: creatorProfile.id
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
    const t = await getTranslations('finances');
    const stripeMessage = stripeStatus === 'success' ? t('stripeSuccess') : undefined;

    const walletSummary = await getCreatorWalletSummary();
    const payoutHistory = await getCreatorPayoutHistory();

    // Check €500 withdrawal cap for Particuliers without SIRET
    let canWithdraw = true;
    let withdrawBlockReason: string | null = null;
    try {
      const { data: withdrawResult } = await supabase
        .rpc('can_creator_withdraw', { p_creator_id: creatorProfile.id });
      const withdrawCheck = Array.isArray(withdrawResult) && withdrawResult.length > 0
        ? withdrawResult[0]
        : withdrawResult;
      if (withdrawCheck && !withdrawCheck.can_withdraw) {
        canWithdraw = false;
        withdrawBlockReason = withdrawCheck.reason || null;
      }
    } catch {
      // RPC may not exist yet; allow withdraw
    }

    const legalStatus = creatorProfile.legal_status || 'particulier';
    const hasSiret = !!(creatorProfile.siret_number && creatorProfile.siret_number.trim());

    return (
      <FinancesPageClient
        isCreator={true}
        creatorData={{
          creatorId: creatorProfile.id,
          activeSaas,
          stripeConnected: creatorProfile.stripe_onboarding_completed || false,
          minPayout: 50,
          pendingBalance: walletSummary.pendingBalance, // Waiting for SaaS payment
          availableBalance: walletSummary.availableBalance, // Ready for payout
          totalEarned: walletSummary.totalEarned,
          payoutHistory: payoutHistory.payouts,
          // Pro status
          isPro: creatorProfile.is_pro || false,
          proStatusSource: creatorProfile.pro_status_source || null,
          proExpirationDate: creatorProfile.pro_expiration_date || null,
          hasProSubscription: !!creatorProfile.stripe_subscription_id_pro,
          // €500 withdrawal cap (Particulier without SIRET)
          canWithdraw,
          withdrawBlockReason,
          legalStatus,
          hasSiret,
        }}
        stripeMessage={stripeMessage}
      />
    );
  } else {
    // Get SaaS data (including card info and credit data)
    const { data: saasCompany } = await supabase
      .from('saas_companies')
      .select('id, company_name, subscription_tier, subscription_status, stripe_subscription_id, card_on_file, card_last4, card_brand, wallet_credits, monthly_credit_subscription, credit_renewal_date, stripe_subscription_id_credits')
      .eq('profile_id', user.id)
      .single();

    if (!saasCompany) redirect('/dashboard');

    // Count active creators - handle if function doesn't exist
    let activeCreators = 0;
    try {
      const { data, error } = await supabase.rpc('count_saas_active_creators', {
        p_saas_id: saasCompany.id
      });
      
      if (error) {
        console.error('Error calling count_saas_active_creators:', error);
        throw error;
      }
      
      // RPC function returns INTEGER directly, not wrapped
      activeCreators = typeof data === 'number' ? data : (data?.[0]?.count_saas_active_creators || 0);
    } catch (err) {
      console.error('Error counting active creators, using fallback:', err);
      // Function may not exist yet, count manually
      // Get all active collaborations for this SaaS and count distinct creators
      const { data: collabs, error: collabError } = await supabase
        .from('collaborations')
        .select(`
          application_id,
          applications!inner(
            creator_id,
            saas_id
          )
        `)
        .eq('status', 'active');
      
      if (collabError) {
        console.error('Error fetching collaborations:', collabError);
      } else if (collabs) {
        // Filter by SaaS ID and get unique creator IDs
        const uniqueCreators = new Set(
          collabs
            .map((c: any) => c.applications)
            .filter((app: any) => app?.saas_id === saasCompany.id)
            .map((app: any) => app?.creator_id)
            .filter(Boolean)
        );
        activeCreators = uniqueCreators.size;
        console.log('Fallback count:', { activeCreators, totalCollabs: collabs.length });
      }
    }

    // Generate subscription message if coming from Stripe (legacy - for credit subscriptions)
    const t = await getTranslations('finances');
    let subscriptionMessage: string | undefined;
    if (subscription === 'success' && newTier) {
      subscriptionMessage = t('subscriptionSuccess');
    } else if (subscription === 'cancelled') {
      subscriptionMessage = undefined;
    }

    return (
      <FinancesPageClient
        isCreator={false}
        saasData={{
          companyName: saasCompany.company_name,
          subscriptionStatus: saasCompany.subscription_status || 'active',
          activeCreators,
          invoices: [],
          cardOnFile: saasCompany.card_on_file || false,
          cardLast4: saasCompany.card_last4 || null,
          cardBrand: saasCompany.card_brand || null,
          // Credit system data
          walletCredits: saasCompany.wallet_credits || 0,
          monthlyCreditSubscription: saasCompany.monthly_credit_subscription || null,
          creditRenewalDate: saasCompany.credit_renewal_date || null,
          hasCreditSubscription: !!saasCompany.stripe_subscription_id_credits,
        }}
        subscriptionMessage={subscriptionMessage}
      />
    );
  }
}
