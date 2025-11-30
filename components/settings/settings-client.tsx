'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { User, CreditCard, Bell, Shield, CheckCircle2, Edit2 } from 'lucide-react';
import StripeConnectButton from '@/components/settings/stripe-connect-button';
import EditProfileForm from '@/components/settings/edit-profile-form';
import EditCreatorProfileForm from '@/components/settings/edit-creator-profile-form';
import EditSaasProfileForm from '@/components/settings/edit-saas-profile-form';

interface SettingsClientProps {
  profile: any;
  creatorProfile: any;
  saasCompany: any;
  stripeConnected: boolean;
  stripeStatus: string | undefined;
}

export default function SettingsClient({ 
  profile, 
  creatorProfile, 
  saasCompany, 
  stripeConnected, 
  stripeStatus 
}: SettingsClientProps) {
  const router = useRouter();
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showEditCreatorProfile, setShowEditCreatorProfile] = useState(false);
  const [showEditSaasProfile, setShowEditSaasProfile] = useState(false);

  const isCreator = profile?.role === 'influencer';

  const handleSuccess = () => {
    setShowEditProfile(false);
    setShowEditCreatorProfile(false);
    setShowEditSaasProfile(false);
    router.refresh();
  };

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
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <User className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h3 className="font-medium text-white">Profil</h3>
                <p className="text-xs text-slate-500">Informations personnelles</p>
              </div>
            </div>
            <button
              onClick={() => setShowEditProfile(true)}
              className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-slate-300 hover:text-white transition-all text-sm"
            >
              <Edit2 className="w-4 h-4" />
              <span>Modifier</span>
            </button>
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

        {/* Creator Profile Section */}
        {isCreator && creatorProfile && (
          <div className="bg-[#0A0C10] border border-white/10 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                  <User className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <h3 className="font-medium text-white">Profil Créateur</h3>
                  <p className="text-xs text-slate-500">Informations professionnelles</p>
                </div>
              </div>
              <button
                onClick={() => setShowEditCreatorProfile(true)}
                className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-slate-300 hover:text-white transition-all text-sm"
              >
                <Edit2 className="w-4 h-4" />
                <span>Modifier</span>
              </button>
            </div>

            <div className="space-y-4">
              <div className="py-3 border-b border-white/5">
                <span className="text-sm text-slate-400 block mb-1">Bio</span>
                <span className="text-sm text-white">{creatorProfile.bio || '-'}</span>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-white/5">
                <span className="text-sm text-slate-400">Followers</span>
                <span className="text-sm text-white">{creatorProfile.followers_count?.toLocaleString() || '0'}</span>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-white/5">
                <span className="text-sm text-slate-400">Engagement</span>
                <span className="text-sm text-white">{creatorProfile.engagement_rate ? `${creatorProfile.engagement_rate}%` : '-'}</span>
              </div>
              <div className="flex items-center justify-between py-3">
                <span className="text-sm text-slate-400">Tarif indicatif</span>
                <span className="text-sm text-white">{creatorProfile.hourly_rate ? `${creatorProfile.hourly_rate}€` : '-'}</span>
              </div>
            </div>
          </div>
        )}

        {/* SaaS Profile Section */}
        {!isCreator && saasCompany && (
          <div className="bg-[#0A0C10] border border-white/10 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                  <User className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h3 className="font-medium text-white">Profil Entreprise</h3>
                  <p className="text-xs text-slate-500">Informations de l'entreprise</p>
                </div>
              </div>
              <button
                onClick={() => setShowEditSaasProfile(true)}
                className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-slate-300 hover:text-white transition-all text-sm"
              >
                <Edit2 className="w-4 h-4" />
                <span>Modifier</span>
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-white/5">
                <span className="text-sm text-slate-400">Entreprise</span>
                <span className="text-sm text-white">{saasCompany.company_name || '-'}</span>
              </div>
              <div className="py-3 border-b border-white/5">
                <span className="text-sm text-slate-400 block mb-1">Description</span>
                <span className="text-sm text-white">{saasCompany.description || '-'}</span>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-white/5">
                <span className="text-sm text-slate-400">Site web</span>
                <a href={saasCompany.website} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-400 hover:text-blue-300">
                  {saasCompany.website || '-'}
                </a>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-white/5">
                <span className="text-sm text-slate-400">Secteur</span>
                <span className="text-sm text-white">{saasCompany.industry || '-'}</span>
              </div>
              <div className="flex items-center justify-between py-3">
                <span className="text-sm text-slate-400">Commission</span>
                <span className="text-sm text-white">{saasCompany.commission_rate ? `${saasCompany.commission_rate}%` : '-'}</span>
              </div>
            </div>
          </div>
        )}

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

      {/* Modals */}
      {showEditProfile && (
        <EditProfileForm
          profile={profile}
          onClose={() => setShowEditProfile(false)}
          onSuccess={handleSuccess}
        />
      )}

      {showEditCreatorProfile && creatorProfile && (
        <EditCreatorProfileForm
          creatorProfile={creatorProfile}
          onClose={() => setShowEditCreatorProfile(false)}
          onSuccess={handleSuccess}
        />
      )}

      {showEditSaasProfile && saasCompany && (
        <EditSaasProfileForm
          saasCompany={saasCompany}
          onClose={() => setShowEditSaasProfile(false)}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  );
}

