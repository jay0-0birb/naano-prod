"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  User,
  CreditCard,
  Bell,
  Shield,
  CheckCircle2,
  Edit2,
  Loader2,
  AlertCircle,
} from "lucide-react";
import StripeConnectButton from "@/components/settings/stripe-connect-button";
import StripeConnectSaasButton from "@/components/settings/stripe-connect-saas-button";
import CardRegistrationButton from "@/components/settings/card-registration-button";
import RevenueTrackingSetup from "@/components/collaborations/revenue-tracking-setup";
import EditProfileForm from "@/components/settings/edit-profile-form";
import EditCreatorProfileForm from "@/components/settings/edit-creator-profile-form";
import EditSaasProfileForm from "@/components/settings/edit-saas-profile-form";
import { createClient } from "@/lib/supabase/client";
import { refreshStripeStatus } from "@/lib/stripe-status";

interface NotificationPreferences {
  email_new_applications: boolean;
  email_new_messages: boolean;
  email_collaboration_updates: boolean;
}

interface SettingsClientProps {
  profile: any;
  creatorProfile: any;
  saasCompany: any;
  stripeConnected: boolean;
  stripeStatus: string | undefined;
  stripeError?: string;
  initialNotificationPrefs?: NotificationPreferences;
}

export default function SettingsClient({
  profile,
  creatorProfile,
  saasCompany,
  stripeConnected,
  stripeStatus,
  stripeError,
  initialNotificationPrefs,
}: SettingsClientProps) {
  const router = useRouter();
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showEditCreatorProfile, setShowEditCreatorProfile] = useState(false);
  const [showEditSaasProfile, setShowEditSaasProfile] = useState(false);

  // Notification preferences state
  const [notifPrefs, setNotifPrefs] = useState<NotificationPreferences>({
    email_new_applications:
      initialNotificationPrefs?.email_new_applications ?? true,
    email_new_messages: initialNotificationPrefs?.email_new_messages ?? true,
    email_collaboration_updates:
      initialNotificationPrefs?.email_collaboration_updates ?? true,
  });
  const [savingNotifs, setSavingNotifs] = useState(false);

  const isCreator = profile?.role === "influencer";

  const handleNotificationChange = async (
    key: keyof NotificationPreferences,
    value: boolean
  ) => {
    const newPrefs = { ...notifPrefs, [key]: value };
    setNotifPrefs(newPrefs);
    setSavingNotifs(true);

    const supabase = createClient();

    // Upsert the preferences
    const { error } = await supabase.from("notification_preferences").upsert(
      {
        user_id: profile.id,
        ...newPrefs,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "user_id",
      }
    );

    if (error) {
      console.error("Failed to save notification preferences:", error);
      // Revert on error
      setNotifPrefs((prev) => ({ ...prev, [key]: !value }));
    }

    setSavingNotifs(false);
  };

  const handleSuccess = () => {
    setShowEditProfile(false);
    setShowEditCreatorProfile(false);
    setShowEditSaasProfile(false);
    router.refresh();
  };

  // Auto-verify Stripe status when coming back from onboarding
  useEffect(() => {
    if (stripeStatus === "success") {
      if (isCreator && !stripeConnected) {
        // For creators, verify account status
        const verifyAndRefresh = async () => {
          try {
            const result = await refreshStripeStatus();
            if (result.success && result.onboardingComplete) {
              // Wait a moment for DB to update, then refresh
              setTimeout(() => {
                router.refresh();
              }, 500);
            } else {
              // If not complete yet, try again after 2 seconds
              setTimeout(() => {
                router.refresh();
              }, 2000);
            }
          } catch (err) {
            console.error("Error verifying status:", err);
            // Still refresh after delay
            setTimeout(() => {
              router.refresh();
            }, 2000);
          }
        };

        verifyAndRefresh();
      } else if (!isCreator && saasCompany && !saasCompany.stripe_account_id) {
        // For SaaS, just refresh to show updated status (callback already updated DB)
        setTimeout(() => {
          router.refresh();
        }, 500);
      }
    }
  }, [stripeStatus, isCreator, stripeConnected, saasCompany, router]);

  return (
    <div className="max-w-3xl">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-normal text-white mb-1">Paramètres</h2>
        <p className="text-slate-400 text-sm">
          Gérez votre compte et vos préférences
        </p>
      </div>

      {/* Stripe Status Messages */}
      {stripeStatus === "success" && (
        <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-green-400" />
          <p className="text-green-400 text-sm">
            {isCreator
              ? "Votre compte Stripe a été configuré avec succès !"
              : "Votre compte Stripe a été connecté avec succès ! Le CA sera automatiquement tracké."}
          </p>
        </div>
      )}

      {stripeError && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-400" />
          <p className="text-red-400 text-sm">
            Erreur lors de la connexion Stripe : {stripeError}
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
                <p className="text-xs text-slate-500">
                  Informations personnelles
                </p>
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
              <span className="text-sm text-white">
                {profile?.full_name || "-"}
              </span>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-white/5">
              <span className="text-sm text-slate-400">Email</span>
              <span className="text-sm text-white">{profile?.email}</span>
            </div>
            <div className="flex items-center justify-between py-3">
              <span className="text-sm text-slate-400">Rôle</span>
              <span
                className={`text-sm px-2 py-0.5 rounded-full ${
                  isCreator
                    ? "bg-purple-500/10 text-purple-400"
                    : "bg-blue-500/10 text-blue-400"
                }`}
              >
                {isCreator ? "Créateur" : "Entreprise"}
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
                  <p className="text-xs text-slate-500">
                    Informations professionnelles
                  </p>
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
                <span className="text-sm text-white">
                  {creatorProfile.bio || "-"}
                </span>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-white/5">
                <span className="text-sm text-slate-400">Followers</span>
                <span className="text-sm text-white">
                  {creatorProfile.followers_count?.toLocaleString() || "0"}
                </span>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-white/5">
                <span className="text-sm text-slate-400">Engagement</span>
                <span className="text-sm text-white">
                  {creatorProfile.engagement_rate
                    ? `${creatorProfile.engagement_rate}%`
                    : "-"}
                </span>
              </div>
              <div className="flex items-center justify-between py-3">
                <span className="text-sm text-slate-400">Tarif indicatif</span>
                <span className="text-sm text-white">
                  {creatorProfile.hourly_rate
                    ? `${creatorProfile.hourly_rate}€`
                    : "-"}
                </span>
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
                  <p className="text-xs text-slate-500">
                    Informations de l'entreprise
                  </p>
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
                <span className="text-sm text-white">
                  {saasCompany.company_name || "-"}
                </span>
              </div>
              <div className="py-3 border-b border-white/5">
                <span className="text-sm text-slate-400 block mb-1">
                  Description
                </span>
                <span className="text-sm text-white">
                  {saasCompany.description || "-"}
                </span>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-white/5">
                <span className="text-sm text-slate-400">Site web</span>
                <a
                  href={saasCompany.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-400 hover:text-blue-300"
                >
                  {saasCompany.website || "-"}
                </a>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-white/5">
                <span className="text-sm text-slate-400">Secteur</span>
                <span className="text-sm text-white">
                  {saasCompany.industry || "-"}
                </span>
              </div>
              <div className="flex items-center justify-between py-3">
                <span className="text-sm text-slate-400">Commission</span>
                <span className="text-sm text-white">
                  {saasCompany.commission_rate
                    ? `${saasCompany.commission_rate}%`
                    : "-"}
                </span>
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
                <p className="text-xs text-slate-500">
                  Configuration Stripe Connect
                </p>
              </div>
            </div>

            <div className="p-4 bg-white/[0.02] rounded-xl border border-white/5 mb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-white mb-1">Compte Stripe</p>
                  <p className="text-xs text-slate-500">
                    {stripeConnected
                      ? "Votre compte est configuré pour recevoir des paiements"
                      : "Connectez votre compte pour recevoir des paiements"}
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
              Stripe Connect permet de recevoir les paiements des entreprises
              SaaS directement sur votre compte bancaire.
            </p>
          </div>
        )}

        {/* Card Registration Section (SaaS only) - BP1.md: Required for billing */}
        {!isCreator && saasCompany && (
          <div className="bg-[#0A0C10] border border-white/10 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h3 className="font-medium text-white">
                  Carte bancaire
                </h3>
                <p className="text-xs text-slate-500">
                  Enregistrez une carte pour payer les leads générés
                </p>
              </div>
            </div>

            <div className="p-4 bg-white/[0.02] rounded-xl border border-white/5 mb-4">
              {saasCompany.card_on_file ? (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-white mb-1">Carte enregistrée</p>
                    <p className="text-xs text-slate-500">
                      {saasCompany.card_brand && saasCompany.card_brand.charAt(0).toUpperCase() + saasCompany.card_brand.slice(1)}
                      {saasCompany.card_last4 && ` •••• ${saasCompany.card_last4}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-green-400">
                    <CheckCircle2 className="w-5 h-5" />
                    <span className="text-sm">Enregistrée</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-white mb-1">Aucune carte enregistrée</p>
                    <p className="text-xs text-slate-500">
                      Vous devez enregistrer une carte pour utiliser Naano et payer les leads générés par vos créateurs.
                    </p>
                  </div>
                  <CardRegistrationButton />
                </div>
              )}
            </div>

            <p className="text-xs text-slate-500">
              Cette carte sera utilisée pour payer automatiquement les leads lorsque vous atteignez 100€ de dette ou à la fin du mois.
            </p>
          </div>
        )}

        {/* Revenue Tracking Section (SaaS only) - Optional */}
        {!isCreator && saasCompany && (
          <div className="bg-[#0A0C10] border border-white/10 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <h3 className="font-medium text-white">
                  Suivi du Chiffre d'Affaires (Optionnel)
                </h3>
                <p className="text-xs text-slate-500">
                  Configurez le tracking des ventes générées par vos
                  ambassadeurs
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Option 1: Stripe Connect (Easiest) */}
              <div className="p-4 bg-gradient-to-br from-[#635BFF]/10 to-[#635BFF]/5 border border-[#635BFF]/20 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-medium text-white">
                    Option 1 : Stripe Connect
                  </span>
                  <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">
                    Recommandé
                  </span>
                </div>
                <p className="text-xs text-slate-400 mb-4">
                  Connectez votre Stripe et le CA sera tracké automatiquement.
                  Aucun code à ajouter !
                </p>
                <StripeConnectSaasButton
                  isConnected={!!saasCompany.stripe_account_id}
                  connectedAt={saasCompany.stripe_connected_at}
                />
              </div>

              {/* Divider */}
              <div className="flex items-center gap-4">
                <div className="flex-1 h-px bg-white/10" />
                <span className="text-xs text-slate-500">ou</span>
                <div className="flex-1 h-px bg-white/10" />
              </div>

              {/* Option 2 & 3: Pixel & Webhook */}
              <RevenueTrackingSetup />
            </div>
          </div>
        )}

        {/* Notifications Section */}
        <div className="bg-[#0A0C10] border border-white/10 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <Bell className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h3 className="font-medium text-white">
                  Notifications par email
                </h3>
                <p className="text-xs text-slate-500">
                  Recevez des emails pour ces événements
                </p>
              </div>
            </div>
            {savingNotifs && (
              <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
            )}
          </div>

          <div className="space-y-4">
            <label className="flex items-center justify-between py-3 border-b border-white/5 cursor-pointer group">
              <div>
                <span className="text-sm text-white block">
                  Nouvelles candidatures
                </span>
                <span className="text-xs text-slate-500">
                  {isCreator
                    ? "Quand une entreprise vous contacte"
                    : "Quand un créateur postule"}
                </span>
              </div>
              <input
                type="checkbox"
                checked={notifPrefs.email_new_applications}
                onChange={(e) =>
                  handleNotificationChange(
                    "email_new_applications",
                    e.target.checked
                  )
                }
                className="w-5 h-5 accent-blue-500 cursor-pointer"
              />
            </label>
            <label className="flex items-center justify-between py-3 border-b border-white/5 cursor-pointer group">
              <div>
                <span className="text-sm text-white block">
                  Nouveaux messages
                </span>
                <span className="text-xs text-slate-500">
                  Quand vous recevez un message
                </span>
              </div>
              <input
                type="checkbox"
                checked={notifPrefs.email_new_messages}
                onChange={(e) =>
                  handleNotificationChange(
                    "email_new_messages",
                    e.target.checked
                  )
                }
                className="w-5 h-5 accent-blue-500 cursor-pointer"
              />
            </label>
            <label className="flex items-center justify-between py-3 cursor-pointer group">
              <div>
                <span className="text-sm text-white block">
                  Mises à jour de collaboration
                </span>
                <span className="text-xs text-slate-500">
                  {isCreator
                    ? "Candidatures acceptées, posts validés..."
                    : "Nouveaux posts soumis, etc."}
                </span>
              </div>
              <input
                type="checkbox"
                checked={notifPrefs.email_collaboration_updates}
                onChange={(e) =>
                  handleNotificationChange(
                    "email_collaboration_updates",
                    e.target.checked
                  )
                }
                className="w-5 h-5 accent-blue-500 cursor-pointer"
              />
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
              <p className="text-xs text-slate-500">
                Mot de passe et connexion
              </p>
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
