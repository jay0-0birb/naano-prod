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
import EditProfileForm from "@/components/settings/edit-profile-form";
import EditCreatorProfileForm from "@/components/settings/edit-creator-profile-form";
import EditSaasProfileForm from "@/components/settings/edit-saas-profile-form";
import { createClient } from "@/lib/supabase/client";
import { refreshStripeStatus } from "@/lib/stripe-status";
import { createClient as createSupabaseClient } from "@/lib/supabase/client";

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

  // SaaS brands (multi-brand for Scale)
  const [brands, setBrands] = useState<
    { id: string; name: string; main_url: string }[]
  >([]);
  const [loadingBrands, setLoadingBrands] = useState(false);
  const [brandError, setBrandError] = useState<string | null>(null);
  const [newBrandName, setNewBrandName] = useState("");
  const [newBrandUrl, setNewBrandUrl] = useState("");

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

  // Load brands for SaaS (server-side props didn't include them)
  useEffect(() => {
    const fetchBrands = async () => {
      if (isCreator || !saasCompany?.id) return;
      setLoadingBrands(true);
      setBrandError(null);
      try {
        const supabase = createSupabaseClient();
        const { data, error } = await supabase
          .from("saas_brands")
          .select("id, name, main_url")
          .eq("saas_id", saasCompany.id)
          .order("created_at", { ascending: true });
        if (error) {
          setBrandError(error.message);
        } else {
          setBrands((data || []) as any);
        }
      } catch (err: any) {
        setBrandError(err.message || "Erreur lors du chargement des marques");
      } finally {
        setLoadingBrands(false);
      }
    };

    fetchBrands();
  }, [isCreator, saasCompany]);

  const handleAddBrand = async () => {
    if (!saasCompany?.id || !newBrandName || !newBrandUrl) return;
    setLoadingBrands(true);
    setBrandError(null);
    try {
      const supabase = createSupabaseClient();
      const { data, error } = await supabase
        .from("saas_brands")
        .insert({
          saas_id: saasCompany.id,
          name: newBrandName,
          main_url: newBrandUrl,
        })
        .select("id, name, main_url")
        .single();
      if (error) {
        setBrandError(error.message);
      } else if (data) {
        setBrands((prev) => [...prev, data as any]);
        setNewBrandName("");
        setNewBrandUrl("");
      }
    } catch (err: any) {
      setBrandError(err.message || "Erreur lors de la création de la marque");
    } finally {
      setLoadingBrands(false);
    }
  };

  const handleDeleteBrand = async (id: string) => {
    if (!window.confirm("Supprimer cette marque ?")) return;
    setLoadingBrands(true);
    setBrandError(null);
    try {
      const supabase = createSupabaseClient();
      const { error } = await supabase
        .from("saas_brands")
        .delete()
        .eq("id", id);
      if (error) {
        setBrandError(error.message);
      } else {
        setBrands((prev) => prev.filter((b) => b.id !== id));
      }
    } catch (err: any) {
      setBrandError(err.message || "Erreur lors de la suppression de la marque");
    } finally {
      setLoadingBrands(false);
    }
  };

  const handleCreatorDisconnectStripe = async () => {
    try {
      const response = await fetch("/api/stripe/disconnect-creator", {
        method: "POST",
      });
      const data = await response.json();

      if (!response.ok) {
        alert(
          data.error ||
            "Impossible de déconnecter Stripe. Merci de réessayer ou de contacter Naano.",
        );
        return;
      }

      router.refresh();
    } catch (error: any) {
      alert(
        error?.message ||
          "Impossible de déconnecter Stripe. Merci de réessayer ou de contacter Naano.",
      );
    }
  };

  const handleSaasRemoveCard = async () => {
    try {
      const response = await fetch("/api/stripe/remove-card", {
        method: "POST",
      });
      const data = await response.json();

      if (!response.ok) {
        alert(
          data.error ||
            "Impossible de supprimer la carte. Merci de réessayer ou de contacter Naano.",
        );
        return;
      }

      router.refresh();
    } catch (error: any) {
      alert(
        error?.message ||
          "Impossible de supprimer la carte. Merci de réessayer ou de contacter Naano.",
      );
    }
  };

  return (
    <div className="max-w-5xl">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-[#111827] mb-1">
          Paramètres
        </h2>
        <p className="text-[#64748B] text-sm">
          Gérez votre compte et vos préférences
        </p>
      </div>

      {/* Stripe Status Messages */}
      {stripeStatus === "success" && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-green-600" />
          <p className="text-green-700 text-sm">
            {isCreator
              ? "Votre compte Stripe a été configuré avec succès !"
              : "Votre compte Stripe a été connecté avec succès ! Le CA sera automatiquement tracké."}
          </p>
        </div>
      )}

      {stripeError && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <p className="text-red-700 text-sm">
            Erreur lors de la connexion Stripe : {stripeError}
          </p>
        </div>
      )}

      <div className="space-y-6">
        {/* Profile Section */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                <User className="w-5 h-5 text-[#1D4ED8]" />
              </div>
              <div>
                <h3 className="font-medium text-[#111827]">Profil</h3>
                <p className="text-xs text-[#64748B]">
                  Informations personnelles
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowEditProfile(true)}
              className="flex items-center gap-2 px-3 py-1.5 bg-white hover:bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium text-[#111827] transition-all"
            >
              <Edit2 className="w-4 h-4" />
              <span>Modifier</span>
            </button>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-gray-200">
              <span className="text-sm text-[#6B7280]">Nom</span>
              <span className="text-sm text-[#111827]">
                {profile?.full_name || "-"}
              </span>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-gray-200">
              <span className="text-sm text-[#6B7280]">Email</span>
              <span className="text-sm text-[#111827]">{profile?.email}</span>
            </div>
            <div className="flex items-center justify-between py-3">
              <span className="text-sm text-[#6B7280]">Rôle</span>
              <span
                className={`text-sm px-2 py-0.5 rounded-full ${
                  isCreator
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-blue-50 text-[#1D4ED8]"
                }`}
              >
                {isCreator ? "Créateur" : "Entreprise"}
              </span>
            </div>
          </div>
        </div>

        {/* Creator Profile Section */}
        {isCreator && creatorProfile && (
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                  <User className="w-5 h-5 text-[#1D4ED8]" />
                </div>
                <div>
                  <h3 className="font-medium text-[#111827]">
                    Profil Créateur
                  </h3>
                  <p className="text-xs text-[#64748B]">
                    Informations professionnelles
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowEditCreatorProfile(true)}
                className="flex items-center gap-2 px-3 py-1.5 bg-white hover:bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium text-[#111827] transition-all"
              >
                <Edit2 className="w-4 h-4" />
                <span>Modifier</span>
              </button>
            </div>

            <div className="space-y-4">
              <div className="py-3 border-b border-gray-200">
                <span className="text-sm text-[#6B7280] block mb-1">Bio</span>
                <span className="text-sm text-[#111827]">
                  {creatorProfile.bio || "-"}
                </span>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-gray-200">
                <span className="text-sm text-[#6B7280]">Followers</span>
                <span className="text-sm text-[#111827]">
                  {creatorProfile.followers_count?.toLocaleString() || "0"}
                </span>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-gray-200">
                <span className="text-sm text-[#6B7280]">Engagement</span>
                <span className="text-sm text-[#111827]">
                  {creatorProfile.engagement_rate
                    ? `${creatorProfile.engagement_rate}%`
                    : "-"}
                </span>
              </div>
              <div className="flex items-center justify-between py-3">
                <span className="text-sm text-[#6B7280]">
                  Tarif indicatif
                </span>
                <span className="text-sm text-[#111827]">
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
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                  <User className="w-5 h-5 text-[#1D4ED8]" />
                </div>
                <div>
                  <h3 className="font-medium text-[#111827]">
                    Profil Entreprise
                  </h3>
                  <p className="text-xs text-[#64748B]">
                    Informations de l'entreprise
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowEditSaasProfile(true)}
                className="flex items-center gap-2 px-3 py-1.5 bg-white hover:bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium text-[#111827] transition-all"
              >
                <Edit2 className="w-4 h-4" />
                <span>Modifier</span>
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-gray-200">
                <span className="text-sm text-[#6B7280]">Entreprise</span>
                <span className="text-sm text-[#111827]">
                  {saasCompany.company_name || "-"}
                </span>
              </div>
              <div className="py-3 border-b border-gray-200">
                <span className="text-sm text-[#6B7280] block mb-1">
                  Description
                </span>
                <span className="text-sm text-[#111827]">
                  {saasCompany.description || "-"}
                </span>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-gray-200">
                <span className="text-sm text-[#6B7280]">Site web</span>
                <a
                  href={saasCompany.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-[#1D4ED8] hover:text-[#1E40AF]"
                >
                  {saasCompany.website || "-"}
                </a>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-gray-200">
                <span className="text-sm text-[#6B7280]">Secteur</span>
                <span className="text-sm text-[#111827]">
                  {saasCompany.industry || "-"}
                </span>
              </div>
              <div className="flex items-center justify-between py-3">
                <span className="text-sm text-[#6B7280]">Commission</span>
                <span className="text-sm text-[#111827]">
                  {saasCompany.commission_rate
                    ? `${saasCompany.commission_rate}%`
                    : "-"}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* SaaS Brands (multi-brand) */}
        {!isCreator && saasCompany && (
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-[#1D4ED8]" />
                </div>
                <div>
                  <h3 className="font-medium text-[#111827]">Marques & URLs</h3>
                  <p className="text-xs text-[#64748B]">
                    Définissez plusieurs marques et pages de destination (Plan Scale)
                  </p>
                </div>
              </div>
              {loadingBrands && (
                <Loader2 className="w-4 h-4 animate-spin text-[#9CA3AF]" />
              )}
            </div>

            <div className="space-y-4">
              {brandError && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs">
                  {brandError}
                </div>
              )}

              {brands.length > 0 ? (
                <div className="space-y-2">
                  {brands.map((b) => (
                    <div
                      key={b.id}
                      className="flex items-center justify-between gap-3 p-3 bg-gray-50 border border-gray-200 rounded-xl"
                    >
                      <div>
                        <p className="text-sm text-[#111827] font-medium">
                          {b.name}
                        </p>
                        <p className="text-[11px] text-[#6B7280] break-all">
                          {b.main_url}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDeleteBrand(b.id)}
                        disabled={loadingBrands}
                        className="text-[11px] px-2 py-1 rounded-lg bg-white hover:bg-gray-50 text-[#111827] border border-gray-200 disabled:opacity-50"
                      >
                        Supprimer
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-[#64748B]">
                  Aucune marque configurée pour le moment. Par défaut, le site web
                  de votre entreprise est utilisé:{" "}
                  <span className="font-mono break-all text-[#111827]">
                    {saasCompany.website || "non défini"}
                  </span>
                </p>
              )}

              {/* Add brand form - only meaningful for Scale */}
              <div className="pt-4 border-t border-gray-200 space-y-2">
                <p className="text-[11px] text-[#6B7280] mb-1">
                  Multi-marque est optimisé pour le plan{" "}
                  <span className="font-semibold">Scale</span>.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="Nom de la marque"
                    value={newBrandName}
                    onChange={(e) => setNewBrandName(e.target.value)}
                    className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs text-[#111827] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#1D4ED8] focus:ring-1 focus:ring-[#1D4ED8]/40"
                  />
                  <input
                    type="url"
                    placeholder="URL principale (https://...)"
                    value={newBrandUrl}
                    onChange={(e) => setNewBrandUrl(e.target.value)}
                    className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs text-[#111827] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#1D4ED8] focus:ring-1 focus:ring-[#1D4ED8]/40"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAddBrand}
                  disabled={
                    loadingBrands || !newBrandName || !newBrandUrl
                  }
                  className="mt-2 inline-flex items-center gap-2 px-3 py-1.5 bg-[#0F172A] hover:bg-[#020617] text-white rounded-lg text-xs font-medium disabled:opacity-50"
                >
                  {loadingBrands ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Enregistrement...
                    </>
                  ) : (
                    'Ajouter une marque'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Stripe Connect Section (Creators only) */}
        {isCreator && (
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h3 className="font-medium text-[#111827]">Paiements</h3>
                <p className="text-xs text-[#64748B]">
                  Configuration Stripe Connect
                </p>
              </div>
            </div>

            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 mb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[#111827] mb-1">Compte Stripe</p>
                  <p className="text-xs text-[#64748B]">
                    {stripeConnected
                      ? "Votre compte est configuré pour recevoir des paiements"
                      : "Connectez votre compte pour recevoir des paiements"}
                  </p>
                </div>
                {stripeConnected ? (
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 text-emerald-600">
                      <CheckCircle2 className="w-5 h-5" />
                      <span className="text-sm">Connecté</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleCreatorDisconnectStripe}
                      className="px-3 py-1.5 text-xs rounded-lg border border-gray-300 text-[#6B7280] hover:text-[#111827] hover:bg-gray-50"
                    >
                      Déconnecter
                    </button>
                  </div>
                ) : (
                  <StripeConnectButton />
                )}
              </div>
            </div>

            <p className="text-xs text-[#64748B]">
              Stripe Connect permet de recevoir les paiements des entreprises
              SaaS directement sur votre compte bancaire.
            </p>
          </div>
        )}

        {/* Card Registration Section (SaaS only) - BP1.md: Required for billing */}
        {!isCreator && saasCompany && (
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-[#1D4ED8]" />
              </div>
              <div>
                <h3 className="font-medium text-[#111827]">
                  Carte bancaire
                </h3>
                <p className="text-xs text-[#64748B]">
                  Enregistrez une carte pour payer les leads générés
                </p>
              </div>
            </div>

            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 mb-4">
              {saasCompany.card_on_file ? (
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm text-[#111827] mb-1">
                      Carte enregistrée
                    </p>
                    <p className="text-xs text-[#64748B]">
                      {saasCompany.card_brand &&
                        saasCompany.card_brand.charAt(0).toUpperCase() +
                          saasCompany.card_brand.slice(1)}
                      {saasCompany.card_last4 &&
                        ` •••• ${saasCompany.card_last4}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 text-emerald-600">
                      <CheckCircle2 className="w-5 h-5" />
                      <span className="text-sm">Enregistrée</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleSaasRemoveCard}
                      className="px-3 py-1.5 text-xs rounded-lg border border-gray-300 text-[#6B7280] hover:text-[#111827] hover:bg-gray-50"
                    >
                      Supprimer la carte
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-[#111827] mb-1">
                      Aucune carte enregistrée
                    </p>
                    <p className="text-xs text-[#64748B]">
                      Vous devez enregistrer une carte pour utiliser Naano et
                      payer les leads générés par vos créateurs.
                    </p>
                  </div>
                  <CardRegistrationButton />
                </div>
              )}
            </div>

            <p className="text-xs text-[#64748B]">
              Cette carte sera utilisée pour payer automatiquement les leads lorsque vous atteignez 100€ de dette ou à la fin du mois.
            </p>
          </div>
        )}

        {/* Notifications Section */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                <Bell className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <h3 className="font-medium text-[#111827]">
                  Notifications par email
                </h3>
                <p className="text-xs text-[#64748B]">
                  Recevez des emails pour ces événements
                </p>
              </div>
            </div>
            {savingNotifs && (
              <Loader2 className="w-4 h-4 animate-spin text-[#9CA3AF]" />
            )}
          </div>

          <div className="space-y-4">
            <label className="flex items-center justify-between py-3 border-b border-gray-200 cursor-pointer group">
              <div>
                <span className="text-sm text-[#111827] block">
                  Nouvelles candidatures
                </span>
                <span className="text-xs text-[#64748B]">
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
            <label className="flex items-center justify-between py-3 border-b border-gray-200 cursor-pointer group">
              <div>
                <span className="text-sm text-[#111827] block">
                  Nouveaux messages
                </span>
                <span className="text-xs text-[#64748B]">
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
                <span className="text-sm text-[#111827] block">
                  Mises à jour de collaboration
                </span>
                <span className="text-xs text-[#64748B]">
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
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
              <Shield className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <h3 className="font-medium text-[#111827]">Sécurité</h3>
              <p className="text-xs text-[#64748B]">
                Mot de passe et connexion
              </p>
            </div>
          </div>

          <button className="w-full py-2.5 bg-[#0F172A] hover:bg-[#020617] text-white rounded-xl text-sm font-medium transition-colors">
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
