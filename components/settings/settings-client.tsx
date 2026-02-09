"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import Image from "next/image";
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
import { sendPasswordResetEmail } from "@/app/(auth)/actions";
import { COUNTRIES } from "@/lib/countries";

interface NotificationPreferences {
  email_new_applications: boolean;
  email_new_messages: boolean;
  email_collaboration_updates: boolean;
  email_collaboration_stopped: boolean;
}

interface SettingsClientProps {
  profile: any;
  creatorProfile: any;
  saasCompany: any;
  stripeConnected: boolean;
  stripeStatus: string | undefined;
  stripeError?: string;
  passwordUpdated?: boolean;
  initialNotificationPrefs?: NotificationPreferences;
}

export default function SettingsClient({
  profile,
  creatorProfile,
  saasCompany,
  stripeConnected,
  stripeStatus,
  stripeError,
  passwordUpdated,
  initialNotificationPrefs,
}: SettingsClientProps) {
  const router = useRouter();
  const t = useTranslations("settings");
  const tFinances = useTranslations("finances");
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showEditCreatorProfile, setShowEditCreatorProfile] = useState(false);
  const [showEditSaasProfile, setShowEditSaasProfile] = useState(false);
  const [cardSuccess, setCardSuccess] = useState<string | null>(null);
  const [hasCardOnFile, setHasCardOnFile] = useState<boolean>(
    !!saasCompany?.card_on_file,
  );
  const [cardBrand, setCardBrand] = useState<string | null>(
    saasCompany?.card_brand ?? null,
  );
  const [cardLast4, setCardLast4] = useState<string | null>(
    saasCompany?.card_last4 ?? null,
  );

  // Notification preferences state
  const [notifPrefs, setNotifPrefs] = useState<NotificationPreferences>({
    email_new_applications:
      initialNotificationPrefs?.email_new_applications ?? true,
    email_new_messages: initialNotificationPrefs?.email_new_messages ?? true,
    email_collaboration_updates:
      initialNotificationPrefs?.email_collaboration_updates ?? true,
    email_collaboration_stopped:
      initialNotificationPrefs?.email_collaboration_stopped ?? true,
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
  const [passwordResetSent, setPasswordResetSent] = useState(false);
  const [passwordResetError, setPasswordResetError] = useState<string | null>(null);
  const [passwordResetLoading, setPasswordResetLoading] = useState(false);

  const isCreator = profile?.role === "influencer";

  const handleChangePassword = async () => {
    const email = profile?.email;
    if (!email) return;
    setPasswordResetLoading(true);
    setPasswordResetError(null);
    setPasswordResetSent(false);
    const result = await sendPasswordResetEmail(email);
    setPasswordResetLoading(false);
    if (result?.error) {
      setPasswordResetError(result.error);
    } else {
      setPasswordResetSent(true);
    }
  };

  const handleNotificationChange = async (
    key: keyof NotificationPreferences,
    value: boolean,
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
      },
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
          setBrandError(t("errorLoadingBrands"));
        } else {
          setBrands((data || []) as any);
        }
      } catch (err: any) {
        setBrandError(err.message || t("errorLoadingBrands"));
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
      setBrandError(err.message || t("errorCreatingBrand"));
    } finally {
      setLoadingBrands(false);
    }
  };

  const handleDeleteBrand = async (id: string) => {
    if (!window.confirm(tFinances("deleteBrandConfirm"))) return;
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
      setBrandError(err.message || t("errorDeletingBrand"));
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
        alert(data.error || tFinances("disconnectStripeError"));
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
        alert(data.error || tFinances("removeCardError"));
        return;
      }

      setHasCardOnFile(false);
      setCardBrand(null);
      setCardLast4(null);
      setCardSuccess(tFinances("cardRemovedSuccess"));
    } catch (error: any) {
      alert(error?.message || tFinances("removeCardError"));
    }
  };

  // If URL has #card anchor (e.g. from finances page), auto-scroll to card section
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.location.hash === "#card") {
      // Small delay to ensure layout is rendered
      setTimeout(() => {
        const el = document.getElementById("card");
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 100);
    }
  }, []);

  return (
    <div className="max-w-5xl">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-[#111827] mb-1">
          {t("title")}
        </h2>
        <p className="text-[#64748B] text-sm">{t("subtitle")}</p>
      </div>

      {/* Stripe Status Messages */}
      {stripeStatus === "success" && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-green-600" />
          <p className="text-green-700 text-sm">
            {isCreator ? t("stripeSuccessCreator") : t("stripeSuccessSaas")}
          </p>
        </div>
      )}

      {stripeError && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <p className="text-red-700 text-sm">
            {t("stripeError", { error: stripeError })}
          </p>
        </div>
      )}

      {passwordUpdated && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-green-600" />
          <p className="text-green-700 text-sm">{t("passwordUpdated")}</p>
        </div>
      )}

      {cardSuccess && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-green-600" />
          <p className="text-green-700 text-sm">{cardSuccess}</p>
        </div>
      )}

      <div className="space-y-6">
        {/* Profile Section */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              {profile?.avatar_url ? (
                <div className="w-10 h-10 rounded-full overflow-hidden relative shrink-0">
                  <Image
                    src={profile.avatar_url}
                    alt={profile?.full_name || "Avatar"}
                    fill
                    className="object-cover"
                    sizes="40px"
                  />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                  <User className="w-5 h-5 text-[#1D4ED8]" />
                </div>
              )}
              <div>
                <h3 className="font-medium text-[#111827]">{t("profile")}</h3>
                <p className="text-xs text-[#64748B]">{t("personalInfo")}</p>
              </div>
            </div>
            <button
              onClick={() => setShowEditProfile(true)}
              className="flex items-center gap-2 px-3 py-1.5 bg-white hover:bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium text-[#111827] transition-all"
            >
              <Edit2 className="w-4 h-4" />
              <span>{t("edit")}</span>
            </button>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-gray-200">
              <span className="text-sm text-[#6B7280]">{t("name")}</span>
              <span className="text-sm text-[#111827]">
                {profile?.full_name || "-"}
              </span>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-gray-200">
              <span className="text-sm text-[#6B7280]">{t("email")}</span>
              <span className="text-sm text-[#111827]">{profile?.email}</span>
            </div>
            <div className="flex items-center justify-between py-3">
              <span className="text-sm text-[#6B7280]">{t("role")}</span>
              <span
                className={`text-sm px-2 py-0.5 rounded-full ${
                  isCreator
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-blue-50 text-[#1D4ED8]"
                }`}
              >
                {isCreator ? t("creator") : t("company")}
              </span>
            </div>
          </div>
        </div>

        {/* Creator Profile Section */}
        {isCreator && creatorProfile && (
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                {profile?.avatar_url ? (
                  <div className="w-10 h-10 rounded-full overflow-hidden relative shrink-0">
                    <Image
                      src={profile.avatar_url}
                      alt={profile?.full_name || "Avatar"}
                      fill
                      className="object-cover"
                      sizes="40px"
                    />
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                    <User className="w-5 h-5 text-[#1D4ED8]" />
                  </div>
                )}
                <div>
                  <h3 className="font-medium text-[#111827]">
                    {t("creatorProfile")}
                  </h3>
                  <p className="text-xs text-[#64748B]">
                    {t("professionalInfo")}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowEditCreatorProfile(true)}
                className="flex items-center gap-2 px-3 py-1.5 bg-white hover:bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium text-[#111827] transition-all"
              >
                <Edit2 className="w-4 h-4" />
                <span>{t("edit")}</span>
              </button>
            </div>

            <div className="space-y-4">
              <div className="py-3 border-b border-gray-200">
                <span className="text-sm text-[#6B7280] block mb-1">
                  {t("bio")}
                </span>
                <span className="text-sm text-[#111827]">
                  {creatorProfile.bio || "-"}
                </span>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-gray-200">
                <span className="text-sm text-[#6B7280]">{t("linkedInProfile")}</span>
                <span className="text-sm text-[#111827]">
                  {creatorProfile.linkedin_url ? (
                    <a
                      href={creatorProfile.linkedin_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#1D4ED8] hover:underline truncate max-w-[240px] inline-block"
                    >
                      {creatorProfile.linkedin_url}
                    </a>
                  ) : (
                    "-"
                  )}
                </span>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-gray-200">
                <span className="text-sm text-[#6B7280]">{t("followers")}</span>
                <span className="text-sm text-[#111827]">
                  {creatorProfile.followers_count?.toLocaleString() || "0"}
                </span>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-gray-200">
                <span className="text-sm text-[#6B7280]">{t("industry")}</span>
                <span className="text-sm text-[#111827]">
                  {creatorProfile.theme || "-"}
                </span>
              </div>
              <div className="flex items-center justify-between py-3">
                <span className="text-sm text-[#6B7280]">{t("country")}</span>
                <span className="text-sm text-[#111827]">
                  {creatorProfile.country
                    ? (() => {
                        const name = COUNTRIES.find((c) => c.code === creatorProfile.country)?.name;
                        return name ?? creatorProfile.country;
                      })()
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
                {saasCompany.logo_url ? (
                  <div className="w-10 h-10 rounded-full overflow-hidden relative shrink-0 bg-white border border-gray-200">
                    <Image
                      src={saasCompany.logo_url}
                      alt={saasCompany.company_name || "Logo"}
                      fill
                      className="object-cover"
                      sizes="40px"
                    />
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                    <User className="w-5 h-5 text-[#1D4ED8]" />
                  </div>
                )}
                <div>
                  <h3 className="font-medium text-[#111827]">
                    {t("companyProfile")}
                  </h3>
                  <p className="text-xs text-[#64748B]">{t("companyInfo")}</p>
                </div>
              </div>
              <button
                onClick={() => setShowEditSaasProfile(true)}
                className="flex items-center gap-2 px-3 py-1.5 bg-white hover:bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium text-[#111827] transition-all"
              >
                <Edit2 className="w-4 h-4" />
                <span>{t("edit")}</span>
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-gray-200">
                <span className="text-sm text-[#6B7280]">{t("company")}</span>
                <span className="text-sm text-[#111827]">
                  {saasCompany.company_name || "-"}
                </span>
              </div>
              <div className="py-3 border-b border-gray-200">
                <span className="text-sm text-[#6B7280] block mb-1">
                  {t("description")}
                </span>
                <span className="text-sm text-[#111827]">
                  {saasCompany.description || "-"}
                </span>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-gray-200">
                <span className="text-sm text-[#6B7280]">{t("website")}</span>
                <a
                  href={saasCompany.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-[#1D4ED8] hover:text-[#1E40AF]"
                >
                  {saasCompany.website || "-"}
                </a>
              </div>
              <div className="flex items-center justify-between py-3">
                <span className="text-sm text-[#6B7280]">{t("industry")}</span>
                <span className="text-sm text-[#111827]">
                  {saasCompany.industry || "-"}
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
                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-[#1D4ED8]" />
                </div>
                <div>
                  <h3 className="font-medium text-[#111827]">
                    {t("brandsUrls")}
                  </h3>
                  <p className="text-xs text-[#64748B]">{t("brandsDesc")}</p>
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
                        {t("delete")}
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-[#64748B]">
                  {t("noBrands")}{" "}
                  <span className="font-mono break-all text-[#111827]">
                    {saasCompany.website || t("notDefined")}
                  </span>
                </p>
              )}

              {/* Add brand form */}
              <div className="pt-4 border-t border-gray-200 space-y-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder={t("brandNamePlaceholder")}
                    value={newBrandName}
                    onChange={(e) => setNewBrandName(e.target.value)}
                    className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs text-[#111827] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#1D4ED8] focus:ring-1 focus:ring-[#1D4ED8]/40"
                  />
                  <input
                    type="url"
                    placeholder={t("brandUrlPlaceholder")}
                    value={newBrandUrl}
                    onChange={(e) => setNewBrandUrl(e.target.value)}
                    className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs text-[#111827] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#1D4ED8] focus:ring-1 focus:ring-[#1D4ED8]/40"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAddBrand}
                  disabled={loadingBrands || !newBrandName || !newBrandUrl}
                  className="mt-2 inline-flex items-center gap-2 px-3 py-1.5 bg-[#0F172A] hover:bg-[#020617] text-white rounded-lg text-xs font-medium disabled:opacity-50"
                >
                  {loadingBrands ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin" />
                      {t("saving")}
                    </>
                  ) : (
                    t("addBrand")
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
              <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h3 className="font-medium text-[#111827]">{t("payments")}</h3>
                <p className="text-xs text-[#64748B]">{t("stripeConnect")}</p>
              </div>
            </div>

            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 mb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[#111827] mb-1">
                    {t("stripeAccount")}
                  </p>
                  <p className="text-xs text-[#64748B]">
                    {stripeConnected
                      ? t("stripeConfigured")
                      : t("connectToReceive")}
                  </p>
                </div>
                {stripeConnected ? (
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 text-emerald-600">
                      <CheckCircle2 className="w-5 h-5" />
                      <span className="text-sm">{t("connected")}</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleCreatorDisconnectStripe}
                      className="px-3 py-1.5 text-xs rounded-lg border border-gray-300 text-[#6B7280] hover:text-[#111827] hover:bg-gray-50"
                    >
                      {t("disconnect")}
                    </button>
                  </div>
                ) : (
                  <StripeConnectButton />
                )}
              </div>
            </div>

            <p className="text-xs text-[#64748B]">{t("stripeConnectDesc")}</p>
            <p className="text-xs text-[#64748B] mt-3 pt-3 border-t border-gray-100">
              {t("stripePayoutsCountryWarning")}{" "}
              <a
                href="https://stripe.com/docs/connect/cross-border-payouts"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#635BFF] hover:underline"
              >
                {t("stripePayoutsDocsLink")}
              </a>
              . {t("stripePayoutsInquiries")}
            </p>
          </div>
        )}

        {/* Card Registration Section (SaaS only) */}
        {!isCreator && saasCompany && (
          <div
            id="card"
            className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-[#1D4ED8]" />
              </div>
              <div>
                <h3 className="font-medium text-[#111827]">{t("card")}</h3>
                <p className="text-xs text-[#64748B]">{t("cardDesc")}</p>
              </div>
            </div>

            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 mb-4">
              {hasCardOnFile ? (
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm text-[#111827] mb-1">
                      {t("cardRegistered")}
                    </p>
                    <p className="text-xs text-[#64748B]">
                      {cardBrand &&
                        cardBrand.charAt(0).toUpperCase() +
                          cardBrand.slice(1)}
                      {cardLast4 && ` •••• ${cardLast4}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 text-emerald-600">
                      <CheckCircle2 className="w-5 h-5" />
                      <span className="text-sm">{t("cardRegistered")}</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleSaasRemoveCard}
                      className="px-3 py-1.5 text-xs rounded-lg border border-gray-300 text-[#6B7280] hover:text-[#111827] hover:bg-gray-50"
                    >
                      {t("removeCard")}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-[#111827] mb-1">{t("noCard")}</p>
                    <p className="text-xs text-[#64748B]">{t("noCardDesc")}</p>
                  </div>
                  <CardRegistrationButton />
                </div>
              )}
            </div>

            <p className="text-xs text-[#64748B]">{t("cardUsage")}</p>
          </div>
        )}

        {/* Notifications Section */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center">
                <Bell className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <h3 className="font-medium text-[#111827]">
                  {t("emailNotifications")}
                </h3>
                <p className="text-xs text-[#64748B]">{t("receiveEmails")}</p>
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
                  {t("newApplications")}
                </span>
                <span className="text-xs text-[#64748B]">
                  {isCreator
                    ? t("whenCompanyContacts")
                    : t("whenCreatorApplies")}
                </span>
              </div>
              <input
                type="checkbox"
                checked={notifPrefs.email_new_applications}
                onChange={(e) =>
                  handleNotificationChange(
                    "email_new_applications",
                    e.target.checked,
                  )
                }
                className="w-5 h-5 accent-blue-500 cursor-pointer"
              />
            </label>
            <label className="flex items-center justify-between py-3 border-b border-gray-200 cursor-pointer group">
              <div>
                <span className="text-sm text-[#111827] block">
                  {t("newMessages")}
                </span>
                <span className="text-xs text-[#64748B]">
                  {t("whenYouReceiveMessage")}
                </span>
              </div>
              <input
                type="checkbox"
                checked={notifPrefs.email_new_messages}
                onChange={(e) =>
                  handleNotificationChange(
                    "email_new_messages",
                    e.target.checked,
                  )
                }
                className="w-5 h-5 accent-blue-500 cursor-pointer"
              />
            </label>
            <label className="flex items-center justify-between py-3 border-b border-gray-200 cursor-pointer group">
              <div>
                <span className="text-sm text-[#111827] block">
                  {t("collaborationUpdates")}
                </span>
                <span className="text-xs text-[#64748B]">
                  {isCreator ? t("creatorUpdates") : t("saasUpdates")}
                </span>
              </div>
              <input
                type="checkbox"
                checked={notifPrefs.email_collaboration_updates}
                onChange={(e) =>
                  handleNotificationChange(
                    "email_collaboration_updates",
                    e.target.checked,
                  )
                }
                className="w-5 h-5 accent-blue-500 cursor-pointer"
              />
            </label>
            <label className="flex items-center justify-between py-3 cursor-pointer group">
              <div>
                <span className="text-sm text-[#111827] block">
                  {t("collaborationStopped")}
                </span>
                <span className="text-xs text-[#64748B]">
                  {t("collaborationStoppedDesc")}
                </span>
              </div>
              <input
                type="checkbox"
                checked={notifPrefs.email_collaboration_stopped}
                onChange={(e) =>
                  handleNotificationChange(
                    "email_collaboration_stopped",
                    e.target.checked,
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
            <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
              <Shield className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <h3 className="font-medium text-[#111827]">{t("security")}</h3>
              <p className="text-xs text-[#64748B]">{t("passwordLogin")}</p>
            </div>
          </div>

          {passwordResetSent && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
              <p className="text-green-700 text-sm">{t("changePasswordSent")}</p>
            </div>
          )}
          {passwordResetError && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
              <p className="text-red-700 text-sm">{t("changePasswordError")}</p>
            </div>
          )}

          <button
            type="button"
            onClick={handleChangePassword}
            disabled={passwordResetLoading}
            className="w-full py-2.5 bg-[#0F172A] hover:bg-[#020617] text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {passwordResetLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {t("changePassword")}
              </>
            ) : (
              t("changePassword")
            )}
          </button>
        </div>
      </div>

      {/* Modals */}
      {showEditProfile && (
        <EditProfileForm
          profile={profile}
          websiteUrl={saasCompany?.website}
          onClose={() => setShowEditProfile(false)}
          onSuccess={handleSuccess}
        />
      )}

      {showEditCreatorProfile && creatorProfile && (
        <EditCreatorProfileForm
          creatorProfile={creatorProfile}
          stripeConnected={stripeConnected}
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
