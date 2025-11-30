import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Search, Filter, Building2, Users as UsersIcon } from 'lucide-react';
import SaasCard from '@/components/marketplace/saas-card';
import CreatorCard from '@/components/marketplace/creator-card';

export default async function MarketplacePage() {
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
          profiles:profile_id (
            id,
            full_name,
            avatar_url
          )
        `)
        .order('created_at', { ascending: false })
    ]);

    const creatorProfile = creatorProfileResult.data;
    const companies = companiesResult.data;

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
            <h2 className="text-2xl font-normal text-white mb-1">Marketplace SaaS</h2>
            <p className="text-slate-400 text-sm">
              Découvrez les entreprises SaaS et postulez pour des collaborations
            </p>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="flex gap-4 mb-8">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <input
              type="text"
              placeholder="Rechercher une entreprise..."
              className="w-full bg-[#0A0C10] border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-3 bg-[#0A0C10] border border-white/10 rounded-xl text-slate-400 hover:text-white hover:border-white/20 transition-all">
            <Filter className="w-5 h-5" />
            <span className="text-sm">Filtres</span>
          </button>
        </div>

        {/* Companies Grid */}
        {companies && companies.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {companies.map((company) => (
              <SaasCard
                key={company.id}
                company={company as any}
                hasApplied={appliedSaasIds.includes(company.id)}
                creatorProfileId={creatorProfile?.id || null}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-[#0A0C10] border border-white/10 rounded-2xl">
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
              <Building2 className="w-8 h-8 text-slate-500" />
            </div>
            <h3 className="text-lg font-medium text-white mb-2">Aucune entreprise disponible</h3>
            <p className="text-slate-400 text-sm max-w-md mx-auto">
              Il n'y a pas encore d'entreprises SaaS inscrites. Revenez bientôt !
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
          profiles:profile_id (
            id,
            full_name,
            avatar_url,
            email
          )
        `)
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
            <h2 className="text-2xl font-normal text-white mb-1">Marketplace Créateurs</h2>
            <p className="text-slate-400 text-sm">
              Découvrez des créateurs et invitez-les à collaborer avec vous
            </p>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="flex gap-4 mb-8">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <input
              type="text"
              placeholder="Rechercher un créateur..."
              className="w-full bg-[#0A0C10] border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-3 bg-[#0A0C10] border border-white/10 rounded-xl text-slate-400 hover:text-white hover:border-white/20 transition-all">
            <Filter className="w-5 h-5" />
            <span className="text-sm">Filtres</span>
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
          <div className="text-center py-16 bg-[#0A0C10] border border-white/10 rounded-2xl">
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
              <UsersIcon className="w-8 h-8 text-slate-500" />
            </div>
            <h3 className="text-lg font-medium text-white mb-2">Aucun créateur disponible</h3>
            <p className="text-slate-400 text-sm max-w-md mx-auto">
              Il n'y a pas encore de créateurs inscrits. Revenez bientôt !
            </p>
          </div>
        )}
      </div>
    );
  }
}
