import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { Search, Filter, Building2, Users as UsersIcon } from 'lucide-react';
import SaasCard from '@/components/marketplace/saas-card';
import CreatorCard from '@/components/marketplace/creator-card';
import { SAAS_TIERS, SaasTier } from '@/lib/subscription-config';

export default async function MarketplacePage() {
  const t = await getTranslations('dashboard');
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Get user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, onboarding_completed')
    .eq('id', user.id)
    .single();

  if (!profile?.onboarding_completed) {
    redirect('/dashboard/onboarding');
  }

  const isCreator = profile?.role === 'influencer';

  // Fetch data based on role
  if (isCreator) {
    // Creator view: Browse SaaS companies
  const [creatorProfileResult, companiesResult] = await Promise.all([
    supabase
      .from('creator_profiles')
      .select('id')
      .eq('profile_id', user.id)
      .single(),
    supabase
      .from('saas_companies')
      .select(`
        *,
        wallet_credits,
        credit_renewal_date,
        subscription_tier,
        profiles:profile_id (
          id,
          full_name,
          avatar_url
        )
      `)
      .order('created_at', { ascending: false })
  ]);

  const creatorProfile = creatorProfileResult.data;
  const companies = companiesResult.data || [];

  // Compute active creators per SaaS to know if they're at capacity
  let activeCreatorsBySaas: Record<string, number> = {};
  if (companies.length > 0) {
    const saasIds = companies.map((c: any) => c.id);

    const { data: collabs } = await supabase
      .from('collaborations')
      .select(
        `
        application_id,
        status,
        applications!inner(
          creator_id,
          saas_id
        )
      `
      )
      .in('applications.saas_id', saasIds)
      .eq('status', 'active');

    if (collabs) {
      const map: Record<string, Set<string>> = {};
      for (const row of collabs as any[]) {
        const app = row.applications;
        if (!app?.saas_id || !app?.creator_id) continue;
        if (!map[app.saas_id]) map[app.saas_id] = new Set();
        map[app.saas_id].add(app.creator_id);
      }
      activeCreatorsBySaas = Object.fromEntries(
        Object.entries(map).map(([saasId, set]) => [saasId, (set as Set<string>).size]),
      );
    }
  }

  // Get applications if creator profile exists
  let appliedSaasIds: string[] = [];
  if (creatorProfile) {
    const { data: applications } = await supabase
      .from('applications')
      .select('saas_id')
      .eq('creator_id', creatorProfile.id);
    
    appliedSaasIds = applications?.map(a => a.saas_id) || [];
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
            <h2 className="text-2xl font-semibold text-[#111827] mb-1">{t('saasMarketplace')}</h2>
          <p className="text-[#64748B] text-sm">
            {t('discoverSaaSApply')}
          </p>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex gap-4 mb-8">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#94A3B8]" />
          <input
            type="text"
            placeholder={t('searchCompany')}
            className="w-full bg-white border border-gray-200 rounded-xl pl-12 pr-4 py-3 text-[#111827] placeholder:text-gray-400 focus:outline-none focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6]/10 transition-all"
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-3 bg-white border border-gray-200 rounded-xl text-[#64748B] hover:text-[#111827] hover:border-gray-300 transition-all">
          <Filter className="w-5 h-5" />
          <span className="text-sm">{t('filters')}</span>
        </button>
      </div>

      {/* Companies Grid */}
      {companies && companies.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {companies.map((company: any) => {
            const tier = (company.subscription_tier || 'starter') as SaasTier;
            const tierConfig = SAAS_TIERS[tier];
            const activeCreators = activeCreatorsBySaas[company.id] || 0;
            const maxCreators = tierConfig.maxCreators;
            const isFull =
              maxCreators !== Infinity && activeCreators >= maxCreators;

            return (
              <SaasCard
                key={company.id}
                company={company as any}
                hasApplied={appliedSaasIds.includes(company.id)}
                creatorProfileId={creatorProfile?.id || null}
                activeCreators={activeCreators}
                maxCreators={maxCreators}
                isFull={isFull}
              />
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16 bg-white border border-gray-200 rounded-2xl shadow-sm">
          <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-8 h-8 text-[#94A3B8]" />
          </div>
          <h3 className="text-lg font-semibold text-[#111827] mb-2">{t('noCompanies')}</h3>
          <p className="text-[#64748B] text-sm max-w-md mx-auto">
            {t('noCompaniesDesc')}
          </p>
        </div>
      )}
    </div>
  );
  } else {
    // SaaS view: Browse Creators
    const [saasCompanyResult, creatorsResult] = await Promise.all([
      supabase
        .from('saas_companies')
        .select('id')
        .eq('profile_id', user.id)
        .single(),
      supabase
        .from('creator_profiles')
        .select(`
          *,
          is_pro,
          profiles:profile_id (
            id,
            full_name,
            avatar_url,
            email
          )
        `)
        .order('is_pro', { ascending: false }) // Pro creators first
        .order('created_at', { ascending: false })
    ]);

    const saasCompany = saasCompanyResult.data;
    const creators = creatorsResult.data;

    // Get existing applications/invites if saas company exists
    let invitedCreatorIds: string[] = [];
    if (saasCompany) {
      const { data: applications } = await supabase
        .from('applications')
        .select('creator_id')
        .eq('saas_id', saasCompany.id);
      
      invitedCreatorIds = applications?.map(a => a.creator_id) || [];
    }

    return (
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-semibold text-[#111827] mb-1">{t('creatorMarketplace')}</h2>
            <p className="text-[#64748B] text-sm">
              {t('discoverCreatorsInvite')}
            </p>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="flex gap-4 mb-8">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#94A3B8]" />
            <input
              type="text"
              placeholder={t('searchCreator')}
              className="w-full bg-white border border-gray-200 rounded-xl pl-12 pr-4 py-3 text-[#111827] placeholder:text-gray-400 focus:outline-none focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6]/10 transition-all"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-3 bg-white border border-gray-200 rounded-xl text-[#64748B] hover:text-[#111827] hover:border-gray-300 transition-all">
            <Filter className="w-5 h-5" />
            <span className="text-sm">{t('filters')}</span>
          </button>
        </div>

        {/* Creators Grid */}
        {creators && creators.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {creators.map((creator) => (
              <CreatorCard
                key={creator.id}
                creator={creator as any}
                hasInvited={invitedCreatorIds.includes(creator.id)}
                saasCompanyId={saasCompany?.id || null}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white border border-gray-200 rounded-2xl shadow-sm">
            <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-4">
              <UsersIcon className="w-8 h-8 text-[#94A3B8]" />
            </div>
            <h3 className="text-lg font-semibold text-[#111827] mb-2">{t('noCreators')}</h3>
            <p className="text-[#64748B] text-sm max-w-md mx-auto">
              {t('noCreatorsDesc')}
            </p>
          </div>
        )}
      </div>
    );
  }
}
