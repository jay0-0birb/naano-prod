import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, ShoppingBag, FileText, Users, Handshake, Wallet } from 'lucide-react';

export default async function DashboardPage() {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Fetch profile first (needed for role check)
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, onboarding_completed, full_name')
    .eq('id', user.id)
    .single();

  if (!profile?.onboarding_completed) {
    redirect('/dashboard/onboarding');
  }

  const isCreator = profile?.role === 'influencer';

  // Fetch basic stats
  let stats = { collaborations: 0, pending: 0 };

  if (isCreator) {
    const { data: creatorProfile } = await supabase
      .from('creator_profiles')
      .select('id')
      .eq('profile_id', user.id)
      .single();

    if (creatorProfile) {
      const [applicationsResult, collaborationsResult] = await Promise.all([
        supabase
          .from('applications')
          .select('*', { count: 'exact', head: true })
          .eq('creator_id', creatorProfile.id)
          .eq('status', 'pending'),
        supabase
          .from('collaborations')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'active'),
      ]);
      
      stats.pending = applicationsResult.count || 0;
      stats.collaborations = collaborationsResult.count || 0;
    }
  } else {
    const { data: saasCompany } = await supabase
      .from('saas_companies')
      .select('id')
      .eq('profile_id', user.id)
      .single();

    if (saasCompany) {
      const [candidatesResult, collaborationsResult] = await Promise.all([
        supabase
          .from('applications')
          .select('*', { count: 'exact', head: true })
          .eq('saas_id', saasCompany.id)
          .eq('status', 'pending'),
        supabase
          .from('collaborations')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'active'),
      ]);
      
      stats.pending = candidatesResult.count || 0;
      stats.collaborations = collaborationsResult.count || 0;
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-normal text-white mb-2">
        Bonjour, {profile?.full_name?.split(' ')[0] || 'Utilisateur'} 👋
      </h2>
      <p className="text-slate-400 mb-8">
        {isCreator 
          ? 'Découvrez les opportunités SaaS et développez vos partenariats.'
          : 'Gérez vos candidatures et collaborations avec les créateurs.'}
      </p>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-[#0A0C10] border border-white/10 rounded-2xl p-6">
          <div className="text-slate-400 text-sm mb-1">
            {isCreator ? 'Candidatures en attente' : 'Candidatures reçues'}
          </div>
          <div className="text-3xl font-semibold text-white">{stats.pending}</div>
        </div>
        <div className="bg-[#0A0C10] border border-white/10 rounded-2xl p-6">
          <div className="text-slate-400 text-sm mb-1">Collaborations actives</div>
          <div className="text-3xl font-semibold text-white">{stats.collaborations}</div>
        </div>
      </div>

      {/* Quick Actions */}
      <h3 className="text-lg font-medium text-white mb-4">Actions rapides</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {isCreator ? (
          <>
            <Link 
              href="/dashboard/marketplace"
              className="group p-6 rounded-2xl border border-white/10 bg-[#0A0C10] hover:border-blue-500/30 hover:bg-blue-500/5 transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                    <ShoppingBag className="w-6 h-6 text-blue-400" />
                  </div>
                  <div>
                    <h4 className="font-medium text-white">Explorer la Marketplace</h4>
                    <p className="text-sm text-slate-400">Découvrez les entreprises SaaS</p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-slate-500 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
              </div>
            </Link>
            <Link 
              href="/dashboard/applications"
              className="group p-6 rounded-2xl border border-white/10 bg-[#0A0C10] hover:border-purple-500/30 hover:bg-purple-500/5 transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center">
                    <FileText className="w-6 h-6 text-purple-400" />
                  </div>
                  <div>
                    <h4 className="font-medium text-white">Mes candidatures</h4>
                    <p className="text-sm text-slate-400">Suivez vos candidatures</p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-slate-500 group-hover:text-purple-400 group-hover:translate-x-1 transition-all" />
              </div>
            </Link>
            <Link 
              href="/dashboard/finances"
              className="group p-6 rounded-2xl border border-white/10 bg-[#0A0C10] hover:border-green-500/30 hover:bg-green-500/5 transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center">
                    <Wallet className="w-6 h-6 text-green-400" />
                  </div>
                  <div>
                    <h4 className="font-medium text-white">Mes finances</h4>
                    <p className="text-sm text-slate-400">Commissions et paiements</p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-slate-500 group-hover:text-green-400 group-hover:translate-x-1 transition-all" />
              </div>
            </Link>
          </>
        ) : (
          <>
            <Link 
              href="/dashboard/candidates"
              className="group p-6 rounded-2xl border border-white/10 bg-[#0A0C10] hover:border-blue-500/30 hover:bg-blue-500/5 transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                    <Users className="w-6 h-6 text-blue-400" />
                  </div>
                  <div>
                    <h4 className="font-medium text-white">Voir les candidatures</h4>
                    <p className="text-sm text-slate-400">{stats.pending} en attente</p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-slate-500 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
              </div>
            </Link>
            <Link 
              href="/dashboard/collaborations"
              className="group p-6 rounded-2xl border border-white/10 bg-[#0A0C10] hover:border-green-500/30 hover:bg-green-500/5 transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center">
                    <Handshake className="w-6 h-6 text-green-400" />
                  </div>
                  <div>
                    <h4 className="font-medium text-white">Collaborations</h4>
                    <p className="text-sm text-slate-400">Gérez vos partenariats</p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-slate-500 group-hover:text-green-400 group-hover:translate-x-1 transition-all" />
              </div>
            </Link>
            <Link 
              href="/dashboard/finances"
              className="group p-6 rounded-2xl border border-white/10 bg-[#0A0C10] hover:border-amber-500/30 hover:bg-amber-500/5 transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
                    <Wallet className="w-6 h-6 text-amber-400" />
                  </div>
                  <div>
                    <h4 className="font-medium text-white">Finances & Plans</h4>
                    <p className="text-sm text-slate-400">Gérez votre abonnement</p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-slate-500 group-hover:text-amber-400 group-hover:translate-x-1 transition-all" />
              </div>
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
