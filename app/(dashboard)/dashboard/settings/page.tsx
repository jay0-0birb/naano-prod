import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import SettingsClient from '@/components/settings/settings-client';
import { verifyStripeConnectStatus } from '@/lib/stripe-status';

interface PageProps {
  searchParams: Promise<{ stripe?: string; stripe_success?: string; stripe_error?: string }>;
}

export default async function SettingsPage({ searchParams }: PageProps) {
  const { stripe: stripeStatus, stripe_success, stripe_error } = await searchParams;
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Get user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profile?.onboarding_completed) {
    redirect('/dashboard/onboarding');
  }

  const isCreator = profile?.role === 'influencer';

  // Get creator profile or saas company
  // Note: Verification happens client-side to avoid revalidatePath during render
  let stripeConnected = false;
  let creatorProfile = null;
  let saasCompany = null;

  if (isCreator) {
    const { data } = await supabase
      .from('creator_profiles')
      .select('*')
      .eq('profile_id', user.id)
      .single();
    
    creatorProfile = data;
    stripeConnected = data?.stripe_onboarding_completed || false;
  } else {
    const { data } = await supabase
      .from('saas_companies')
      .select('*')
      .eq('profile_id', user.id)
      .single();
    
    saasCompany = data;
  }

  // Get notification preferences
  const { data: notificationPrefs } = await supabase
    .from('notification_preferences')
    .select('email_new_applications, email_new_messages, email_collaboration_updates')
    .eq('user_id', user.id)
    .single();

  // Determine which stripe status to show
  const finalStripeStatus = stripeStatus || (stripe_success ? 'success' : undefined);
  const stripeError = stripe_error;

  return (
    <SettingsClient 
      profile={profile}
      creatorProfile={creatorProfile}
      saasCompany={saasCompany}
      stripeConnected={stripeConnected}
      stripeStatus={finalStripeStatus}
      stripeError={stripeError}
      initialNotificationPrefs={notificationPrefs || undefined}
    />
  );
}

function OriginalSettingsPage({ profile, creatorProfile, saasCompany, stripeConnected, stripeStatus }: any) {
  const isCreator = profile?.role === 'influencer';

  return (
    <div className="max-w-3xl">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-normal text-white mb-1">Paramètres</h2>
        <p className="text-slate-400 text-sm">
          Gérez votre compte et vos préférences
        </p>
      </div>

      {/* Stripe Status Message */}
      {stripeStatus === 'success' && (
        <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-green-400" />
          <p className="text-green-400 text-sm">
            Votre compte Stripe a été configuré avec succès !
          </p>
        </div>
      )}

      <div className="space-y-6">
        {/* Profile Section */}
        <div className="bg-[#0A0C10] border border-white/10 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <User className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h3 className="font-medium text-white">Profil</h3>
              <p className="text-xs text-slate-500">Informations personnelles</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-white/5">
              <span className="text-sm text-slate-400">Nom</span>
              <span className="text-sm text-white">{profile?.full_name || '-'}</span>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-white/5">
              <span className="text-sm text-slate-400">Email</span>
              <span className="text-sm text-white">{profile?.email}</span>
            </div>
            <div className="flex items-center justify-between py-3">
              <span className="text-sm text-slate-400">Rôle</span>
              <span className={`text-sm px-2 py-0.5 rounded-full ${
                isCreator 
                  ? 'bg-purple-500/10 text-purple-400' 
                  : 'bg-blue-500/10 text-blue-400'
              }`}>
                {isCreator ? 'Créateur' : 'Entreprise'}
              </span>
            </div>
          </div>
        </div>

        {/* Stripe Connect Section (Creators only) */}
        {isCreator && (
          <div className="bg-[#0A0C10] border border-white/10 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <h3 className="font-medium text-white">Paiements</h3>
                <p className="text-xs text-slate-500">Configuration Stripe Connect</p>
              </div>
            </div>

            <div className="p-4 bg-white/[0.02] rounded-xl border border-white/5 mb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-white mb-1">Compte Stripe</p>
                  <p className="text-xs text-slate-500">
                    {stripeConnected 
                      ? 'Votre compte est configuré pour recevoir des paiements'
                      : 'Connectez votre compte pour recevoir des paiements'}
                  </p>
                </div>
                {stripeConnected ? (
                  <div className="flex items-center gap-2 text-green-400">
                    <CheckCircle2 className="w-5 h-5" />
                    <span className="text-sm">Connecté</span>
                  </div>
                ) : (
                  <StripeConnectButton />
                )}
              </div>
            </div>

            <p className="text-xs text-slate-500">
              Stripe Connect permet de recevoir les paiements des entreprises SaaS directement sur votre compte bancaire.
            </p>
          </div>
        )}

        {/* Notifications Section */}
        <div className="bg-[#0A0C10] border border-white/10 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
              <Bell className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h3 className="font-medium text-white">Notifications</h3>
              <p className="text-xs text-slate-500">Préférences de notification</p>
            </div>
          </div>

          <div className="space-y-4">
            <label className="flex items-center justify-between py-3 border-b border-white/5 cursor-pointer">
              <span className="text-sm text-slate-400">Nouvelles candidatures</span>
              <input type="checkbox" defaultChecked className="w-4 h-4 accent-blue-500" />
            </label>
            <label className="flex items-center justify-between py-3 border-b border-white/5 cursor-pointer">
              <span className="text-sm text-slate-400">Nouveaux messages</span>
              <input type="checkbox" defaultChecked className="w-4 h-4 accent-blue-500" />
            </label>
            <label className="flex items-center justify-between py-3 cursor-pointer">
              <span className="text-sm text-slate-400">Mises à jour de collaboration</span>
              <input type="checkbox" defaultChecked className="w-4 h-4 accent-blue-500" />
            </label>
          </div>
        </div>

        {/* Security Section */}
        <div className="bg-[#0A0C10] border border-white/10 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <h3 className="font-medium text-white">Sécurité</h3>
              <p className="text-xs text-slate-500">Mot de passe et connexion</p>
            </div>
          </div>

          <button className="w-full py-2.5 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl text-sm font-medium transition-colors">
            Changer le mot de passe
          </button>
        </div>
      </div>
    </div>
  );
}

// This is now just for reference, actual rendering is in SettingsClient

