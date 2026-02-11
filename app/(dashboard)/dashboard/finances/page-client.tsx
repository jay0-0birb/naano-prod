"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  Wallet,
  Check,
  AlertCircle,
  ExternalLink,
  CreditCard,
  Info,
  Loader2,
  Settings,
  RefreshCw,
  FileText,
  Calendar,
} from "lucide-react";
import Link from "next/link";
import { refreshStripeStatus } from "@/lib/stripe-status";
import { verifySubscriptionStatus } from "@/lib/subscription-status";
import CreditBalanceWidget from "@/components/dashboard/credit-balance-widget";
import CreditSubscriptionSlider from "@/components/dashboard/credit-subscription-slider";
import ProUpgradeBanner from "@/components/dashboard/pro-upgrade-banner";
import { updateCreatorSiret } from "./actions";

interface CreatorData {
  creatorId: string;
  activeSaas: number;
  stripeConnected: boolean;
  minPayout: number;
  availableBalance: number;
  totalEarned: number; // Lifetime total
  payoutHistory: any[];
  // Pro status
  isPro: boolean;
  proStatusSource: string | null;
  proExpirationDate: string | null;
  hasProSubscription: boolean;
  // €500 withdrawal cap (Particulier without SIRET)
  canWithdraw: boolean;
  withdrawBlockReason: string | null;
  legalStatus: "particulier" | "professionnel";
  hasSiret: boolean;
}

interface SaasData {
  companyName: string;
  subscriptionStatus: string;
  activeCreators: number;
  invoices: any[];
  cardOnFile: boolean; // Card registration status
  cardLast4: string | null; // Last 4 digits of card
  cardBrand: string | null; // Card brand (visa, mastercard, etc.)
  // Credit system data
  walletCredits: number;
  monthlyCreditSubscription: number | null;
  creditRenewalDate: string | null;
  hasCreditSubscription: boolean;
}

interface FinancesPageClientProps {
  isCreator: boolean;
  creatorData?: CreatorData;
  saasData?: SaasData;
  subscriptionMessage?: string;
  stripeMessage?: string;
  canManageSubscription?: boolean;
}

export default function FinancesPageClient({
  isCreator,
  creatorData,
  saasData,
  subscriptionMessage,
  stripeMessage,
  canManageSubscription,
}: FinancesPageClientProps) {
  const router = useRouter();
  const t = useTranslations("finances");
  const tDashboard = useTranslations("dashboard");
  const [selectedTab, setSelectedTab] = useState<"plan" | "commissions">(
    "plan",
  );
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [stripeLoading, setStripeLoading] = useState(false);
  const [payoutLoading, setPayoutLoading] = useState(false);
  const [siretLoading, setSiretLoading] = useState(false);
  const [siretInput, setSiretInput] = useState("");
  const [showSiretForm, setShowSiretForm] = useState(false);

  const CALENDLY_EXPERT_URL =
    process.env.NEXT_PUBLIC_CALENDLY_EXPERT_CALL_URL ||
    "https://calendly.com/naano-expert/10min";

  // Debug: Log what we're rendering
  useEffect(() => {
    console.log("FinancesPageClient render:", {
      isCreator,
      hasCreatorData: !!creatorData,
      hasSaasData: !!saasData,
      selectedTab,
      saasDataKeys: saasData ? Object.keys(saasData) : null,
      saasInvoiceCount: saasData?.invoices ? saasData.invoices.length : 0,
    });
  }, [isCreator, creatorData, saasData, selectedTab]);

  // Auto-verify and refresh if we have success message but status not updated
  useEffect(() => {
    if (
      stripeMessage &&
      isCreator &&
      creatorData &&
      !creatorData.stripeConnected
    ) {
      // Verify status immediately, then refresh
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
    }
  }, [stripeMessage, isCreator, creatorData, router]);

  // Auto-refresh for SaaS when coming back from Stripe (credits or legacy tier)
  useEffect(() => {
    if (subscriptionMessage && !isCreator && saasData) {
      const verifyAndRefresh = async () => {
        try {
          await verifySubscriptionStatus();
          setTimeout(() => router.refresh(), 500);
        } catch (err) {
          setTimeout(() => router.refresh(), 1000);
        }
      };
      verifyAndRefresh();
    }
  }, [subscriptionMessage, isCreator, saasData, router]);

  // Handle Stripe Connect for creators
  const handleStripeConnect = async () => {
    setStripeLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/stripe/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ returnPath: "finances" }),
      });

      const data = await response.json();

      if (data.error) {
        setError(data.code === "country_required" ? t("stripeCountryRequired") : data.error);
        setStripeLoading(false);
        return;
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      setError(t("error"));
      setStripeLoading(false);
    }
  };

  // Handle manual status refresh
  const handleRefreshStatus = async () => {
    setStripeLoading(true);
    setError(null);

    try {
      const result = await refreshStripeStatus();
      if (result.error) {
        setError(result.error);
      } else {
        // Refresh the page to show updated status
        router.refresh();
      }
    } catch (err) {
      setError(t("error"));
    } finally {
      setStripeLoading(false);
    }
  };

  // Handle cancelling SaaS credit subscription directly (no portal)
  const handleCancelCreditSubscription = async () => {
    setStripeLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/stripe/cancel-credit-subscription", {
        method: "POST",
      });
      const data = await response.json();

      if (data.error) {
        setError(data.error);
        setStripeLoading(false);
        return;
      }

      if (data.url) {
        window.location.href = data.url;
        return;
      }

      if (data.success) {
        setSuccess(data.message || t("subscriptionCancelled"));
        setStripeLoading(false);
        // Refresh after a short delay so the UI reflects the cancelled subscription
        setTimeout(() => {
          router.refresh();
        }, 800);
      } else {
        setStripeLoading(false);
      }
    } catch (err) {
      console.error("Error opening subscription portal:", err);
      setError(t("subscriptionError"));
      setStripeLoading(false);
    }
  };

  // Handle credit subscription
  const handleCreditSubscription = async (creditVolume: number) => {
    setError(null);
    try {
      const response = await fetch("/api/stripe/credit-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ creditVolume }),
      });

      const data = await response.json();

      if (data.error) {
        setError(data.error);
        return;
      }

      if (data.url) {
        window.location.href = data.url;
      } else if (data.success) {
        router.refresh();
      }
    } catch (err) {
      setError(t("subscriptionError"));
    }
  };

  // Handle payout request for creators
  const handleRequestPayout = async () => {
    setPayoutLoading(true);
    setError(null);

    try {
      const supabase = (await import("@/lib/supabase/client")).createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        setError(t("notAuthenticated"));
        setPayoutLoading(false);
        return;
      }

      const response = await fetch("/api/payouts/request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      const data = await response.json();

      if (data.error) {
        setError(data.error);
        setPayoutLoading(false);
        return;
      }

      if (data.success) {
        // Success! Refresh the page to show updated earnings
        router.refresh();
      }
    } catch (err) {
      setError(t("error"));
      setPayoutLoading(false);
    }
  };

  // Handle card registration
  const handleAddCard = async () => {
    // Redirect to settings page where card setup will be handled
    // Include hash so settings page can auto-scroll to card section
    router.push("/dashboard/settings#card");
  };

  // Creator View
  if (isCreator && !creatorData) {
    return (
      <div className="max-w-5xl w-full">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-xl sm:text-2xl font-semibold text-[#111827] mb-1">
            {t("title")}
          </h1>
          <p className="text-[#64748B] text-sm">{t("subtitle")}</p>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 sm:p-6">
          <p className="text-sm text-yellow-800">
            {t("creatorOnboardingRequired")}
          </p>
        </div>
      </div>
    );
  }

  if (isCreator && creatorData) {
    const canWithdraw = creatorData.canWithdraw ?? true;
    const legalStatus = creatorData.legalStatus ?? "particulier";
    const hasSiret = creatorData.hasSiret ?? false;

    return (
      <div className="max-w-5xl w-full">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-xl sm:text-2xl font-semibold text-[#111827] mb-1">
            {t("title")}
          </h1>
          <p className="text-[#64748B] text-sm">{t("subtitle")}</p>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-red-50 border border-red-200 rounded-xl flex items-start sm:items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
            <p className="text-red-600 text-sm break-words">{error}</p>
          </div>
        )}

        {/* Success message */}
        {stripeMessage && (
          <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-green-50 border border-green-200 rounded-xl flex items-start sm:items-center gap-3">
            <Check className="w-5 h-5 text-green-600 shrink-0" />
            <p className="text-green-600 text-sm break-words">{stripeMessage}</p>
          </div>
        )}

        {/* Overview */}
        <div className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-6 mb-4 sm:mb-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
              <Wallet className="w-5 h-5 sm:w-6 sm:h-6 text-[#1D4ED8]" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg sm:text-xl font-semibold text-[#111827]">
                {t("overview")}
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
            <div className="bg-gray-50 rounded-xl p-3 sm:p-4 border border-gray-200 min-w-0">
              <p className="text-[#64748B] text-sm mb-1">
                {t("activePartnerships")}
              </p>
              <p className="text-xl sm:text-2xl font-bold text-[#111827]">
                {creatorData.activeSaas}
              </p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 sm:p-4 border border-gray-200 min-w-0">
              <p className="text-[#64748B] text-sm mb-1">{t("totalEarned")}</p>
              <p className="text-xl sm:text-2xl font-bold text-[#111827]">
                {creatorData.totalEarned.toFixed(2)}€
              </p>
              <p className="text-xs text-[#64748B]">{t("sinceBeginning")}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 sm:p-4 border border-gray-200 min-w-0">
              <p className="text-[#64748B] text-sm mb-1">{t("available")}</p>
              <p className="text-xl sm:text-2xl font-bold text-[#111827]">
                {creatorData.availableBalance.toFixed(2)}€
              </p>
              <p className="text-xs text-[#64748B]">{t("readyForPayout")}</p>
            </div>
          </div>
        </div>

        {/* Stripe Connection */}
        <div className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-6 mb-4 sm:mb-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
              <CreditCard className="w-5 h-5 text-[#1D4ED8]" />
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-[#111827]">
                {t("stripePayments")}
              </h3>
              <p className="text-xs text-[#64748B]">
                {t("receiveCommissions")}
              </p>
            </div>
          </div>

          {creatorData.stripeConnected ? (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 sm:p-4 bg-green-50 rounded-xl border border-green-200">
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-green-600 shrink-0" />
                <span className="text-sm text-green-700 font-medium">
                  {t("stripeConnected")}
                </span>
              </div>
              <Link
                href="/dashboard/settings"
                className="text-xs text-[#64748B] hover:text-[#111827] flex items-center gap-1 self-start sm:self-auto"
              >
                <Settings className="w-3 h-3" />
                {t("manage")}
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-3 sm:p-4 bg-slate-100 border border-slate-200 rounded-xl">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-slate-600 shrink-0 mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-slate-600 font-medium">
                      {t("stripeNotConnected")}
                    </p>
                    <p className="text-xs text-slate-600/70 mt-1">
                      {t("connectStripeDesc")}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  onClick={handleStripeConnect}
                  disabled={stripeLoading}
                  className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-[#0F172A] hover:bg-[#020617] text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {stripeLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {t("connecting")}
                    </>
                  ) : (
                    <>
                      <ExternalLink className="w-4 h-4" />
                      {t("connectStripe")}
                    </>
                  )}
                </button>

                {stripeMessage && (
                  <button
                    onClick={handleRefreshStatus}
                    disabled={stripeLoading}
                    className="sm:shrink-0 px-4 py-3 bg-gray-200 hover:bg-gray-300 text-[#111827] rounded-xl text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    title={t("refreshStatus")}
                  >
                    <RefreshCw
                      className={`w-4 h-4 ${
                        stripeLoading ? "animate-spin" : ""
                      }`}
                    />
                  </button>
                )}
              </div>
            </div>
          )}

          <p className="text-xs text-[#64748B] mt-4 pt-4 border-t border-gray-100">
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

        {/* Pro Upgrade Banner */}
        <div className="mb-4 sm:mb-6">
          <ProUpgradeBanner
            creatorId={creatorData.creatorId}
            isPro={creatorData.isPro}
            proStatusSource={creatorData.proStatusSource}
            proExpirationDate={creatorData.proExpirationDate}
            hasProSubscription={creatorData.hasProSubscription}
          />
        </div>

        {/* €400 banner: Particulier without SIRET approaching €500 cap */}
        {legalStatus === "particulier" &&
          !hasSiret &&
          creatorData.totalEarned >= 400 &&
          creatorData.totalEarned < 500 && (
            <div className="mb-4 sm:mb-6 p-3 sm:p-4 rounded-xl bg-slate-100 border border-slate-200">
              <p className="text-sm text-slate-800 font-medium">
                {t("euro400Banner", {
                  amount: Math.ceil(500 - creatorData.totalEarned).toString(),
                })}
              </p>
              <p className="text-xs text-slate-700 mt-1">
                {t("microEntrepriseBanner")}
              </p>
              <div className="mt-3 flex flex-col sm:flex-row sm:flex-wrap gap-2">
                <a
                  href={CALENDLY_EXPERT_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 text-sm font-medium transition-colors"
                >
                  <Calendar className="w-4 h-4" />
                  {t("bookCall")}
                </a>
                <button
                  type="button"
                  onClick={() => setShowSiretForm(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0F172A] hover:bg-[#1E293B] text-white text-sm font-medium transition-colors"
                >
                  {t("enterSiret")}
                </button>
              </div>
            </div>
          )}

        {/* Wallet Overview - Simplified */}
        <div className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-6 mb-4 sm:mb-6 shadow-sm">
          <h3 className="font-semibold text-[#111827] mb-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
              <Wallet className="w-5 h-5 text-[#1D4ED8]" />
            </div>
            <span>{t("walletBalance")}</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
            <div className="p-3 sm:p-4 bg-green-50 border border-green-200 rounded-xl min-w-0">
              <p className="text-xs text-green-700 mb-1 font-medium">
                {t("available")}
              </p>
              <p className="text-xl sm:text-2xl font-bold text-[#111827]">
                {creatorData.availableBalance.toFixed(2)}€
              </p>
              <p className="text-xs text-[#64748B] mt-1">
                {t("availableDesc")}
              </p>
            </div>
            <div className="p-3 sm:p-4 bg-gray-50 border border-gray-200 rounded-xl min-w-0">
              <p className="text-xs text-[#6B7280] mb-1 font-medium">
                {t("totalEarnedLifetime")}
              </p>
              <p className="text-xl sm:text-2xl font-bold text-[#111827]">
                {creatorData.totalEarned.toFixed(2)}€
              </p>
              <p className="text-xs text-[#64748B] mt-1">
                {t("totalEarnedDesc")}
              </p>
            </div>
          </div>

          {/* How it works */}
          <div className="pt-4 sm:pt-6 border-t border-gray-200">
            <h4 className="text-sm font-semibold text-[#111827] mb-3 flex items-center gap-2">
              <Info className="w-4 h-4 text-[#1D4ED8]" />
              {t("howItWorks")}
            </h4>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold shrink-0 text-xs">
                  1
                </div>
                <div>
                  <p className="text-xs text-[#111827] font-medium">
                    {t("step1Title")}
                  </p>
                  <p className="text-xs text-[#64748B] mt-0.5">
                    {t("step1Desc", {
                      amount: creatorData.isPro ? "1,10€" : "0,90€",
                    })}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold shrink-0 text-xs">
                  2
                </div>
                <div>
                  <p className="text-xs text-[#111827] font-medium">
                    {t("step2Title")}
                  </p>
                  <p className="text-xs text-[#64748B] mt-0.5">
                    {t("step2Desc")}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold shrink-0 text-xs">
                  3
                </div>
                <div>
                  <p className="text-xs text-[#111827] font-medium">
                    {t("step3Title")}
                  </p>
                  <p className="text-xs text-[#64748B] mt-0.5">
                    {t("step3Desc", { min: creatorData.minPayout })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Payout Section */}
        {creatorData.availableBalance > 0 && (
          <div className="mt-4 sm:mt-6 bg-white border border-gray-200 rounded-2xl p-4 sm:p-6 shadow-sm">
            <div className="mb-4">
              <h4 className="text-base sm:text-lg font-medium text-[#111827] mb-1">
                {t("availableBalance")}
              </h4>
              <p className="text-2xl sm:text-3xl font-bold text-emerald-600">
                {creatorData.availableBalance.toFixed(2)}€
              </p>
            </div>

            {creatorData.stripeConnected ? (
              creatorData.availableBalance >= creatorData.minPayout ? (
                canWithdraw ? (
                  <button
                    onClick={handleRequestPayout}
                    disabled={payoutLoading}
                    className="w-full py-3 px-4 bg-[#0F172A] hover:bg-[#020617] text-white rounded-xl text-sm sm:text-base font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {payoutLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        {t("processing")}
                      </>
                    ) : (
                      <>
                        <Wallet className="w-4 h-4" />
                        {t("requestTransfer", {
                          amount: creatorData.availableBalance.toFixed(2),
                        })}
                      </>
                    )}
                  </button>
                ) : (
                  <div className="space-y-4">
                    <div className="p-4 bg-slate-100 border border-slate-200 rounded-xl">
                      <p className="text-sm text-slate-800 font-medium">
                        {creatorData.withdrawBlockReason ||
                          t("unlockWithdrawSiret")}
                      </p>
                    </div>
                    <div className="flex flex-col sm:flex-row flex-wrap gap-2">
                      <a
                        href={CALENDLY_EXPERT_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-[#0F172A] hover:bg-[#1E293B] text-white text-sm font-medium transition-colors"
                      >
                        <Calendar className="w-4 h-4 shrink-0" />
                        {t("bookCall")}
                      </a>
                      <button
                        type="button"
                        onClick={() => setShowSiretForm(true)}
                        className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 text-[#111827] text-sm font-medium transition-colors"
                      >
                        {t("enterSiret")}
                      </button>
                    </div>
                  </div>
                )
              ) : (
                <div className="p-4 bg-slate-100 border border-slate-200 rounded-xl">
                  <p className="text-sm text-slate-700">
                    {t("minRequired", {
                      min: creatorData.minPayout,
                      missing: (
                        creatorData.minPayout - creatorData.availableBalance
                      ).toFixed(2),
                    })}
                  </p>
                </div>
              )
            ) : (
              <div className="p-4 bg-slate-100 border border-slate-200 rounded-xl">
                <p className="text-sm text-slate-700">
                  {t("connectStripeToReceive")}
                </p>
              </div>
            )}
          </div>
        )}

        {/* SIRET entry modal (for Particuliers blocked at €500) */}
        {showSiretForm && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-6 max-w-md w-full shadow-xl my-4">
              <h3 className="text-lg font-semibold text-[#111827] mb-2">
                {t("enterSiretTitle")}
              </h3>
              <p className="text-sm text-[#64748B] mb-4">
                {t("enterSiretDesc")}
              </p>
              {error && (
                <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  setSiretLoading(true);
                  setError(null);
                  const result = await updateCreatorSiret(siretInput);
                  setSiretLoading(false);
                  if (result?.error) {
                    setError(result.error);
                  } else {
                    setShowSiretForm(false);
                    setSiretInput("");
                    router.refresh();
                  }
                }}
                className="space-y-4"
              >
                <input
                  type="text"
                  value={siretInput}
                  onChange={(e) => setSiretInput(e.target.value)}
                  placeholder="123 456 789 00012"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-[#111827] placeholder:text-gray-400 focus:outline-none focus:border-[#8B5CF6] focus:ring-2 focus:ring-[#8B5CF6]/10"
                  required
                  minLength={9}
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowSiretForm(false);
                      setSiretInput("");
                      setError(null);
                    }}
                    disabled={siretLoading}
                    className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-[#111827] rounded-xl font-medium transition-colors disabled:opacity-50"
                  >
                    {tDashboard("cancel")}
                  </button>
                  <button
                    type="submit"
                    disabled={siretLoading}
                    className="flex-1 py-2.5 bg-[#0F172A] hover:bg-[#1E293B] text-white rounded-xl font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {siretLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      t("validate")
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Payout History */}
        {creatorData.payoutHistory && creatorData.payoutHistory.length > 0 && (
          <div className="mt-4 sm:mt-6 bg-white border border-gray-200 rounded-2xl p-4 sm:p-6 shadow-sm">
            <h4 className="text-base sm:text-lg font-medium text-[#111827] mb-4">
              {t("payoutHistory")}
            </h4>
            <div className="space-y-3">
              {creatorData.payoutHistory.map((payout: any) => (
                <div
                  key={payout.id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <div className="min-w-0">
                    <p className="text-sm text-[#111827] font-medium">
                      {payout.amount.toFixed(2)}€
                    </p>
                    <p className="text-xs text-[#6B7280]">
                      {new Date(payout.created_at).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                  <div
                    className={`px-3 py-1 rounded-full text-xs font-medium shrink-0 self-start sm:self-auto ${
                      payout.status === "completed"
                        ? "bg-green-50 text-green-700"
                        : payout.status === "processing"
                          ? "bg-blue-50 text-blue-700"
                          : payout.status === "failed"
                            ? "bg-red-50 text-red-700"
                            : "bg-gray-50 text-gray-600"
                    }`}
                  >
                    {payout.status === "completed"
                      ? t("completed")
                      : payout.status === "processing"
                        ? t("processingStatus")
                        : payout.status === "failed"
                          ? t("failed")
                          : t("waiting")}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // SaaS View
  if (!isCreator) {
    // Safety: if for some reason we didn't receive SaaS data, show a soft error state
    if (!saasData) {
      return (
        <div className="max-w-5xl w-full">
          <div className="mb-6 sm:mb-8">
            <h1 className="text-xl sm:text-2xl font-semibold text-[#111827] mb-1">
              {t("financesPlans")}
            </h1>
            <p className="text-[#64748B] text-sm">{t("saasSubtitle")}</p>
          </div>
          <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 sm:p-6">
            <p className="text-red-600 text-sm">{t("saasError")}</p>
          </div>
        </div>
      );
    }

    const canManage = canManageSubscription ?? true;
    const tabs = [
      { id: "plan", label: t("myPlan") },
      { id: "commissions", label: t("billing") },
    ];

    return (
      <div className="max-w-5xl w-full">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-xl sm:text-2xl font-semibold text-[#111827] mb-1">
            {t("financesPlans")}
          </h1>
          <p className="text-[#64748B] text-sm">{t("saasSubtitle")}</p>
        </div>

        {/* Success/Error messages */}
        {(subscriptionMessage || success) && (
          <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-green-500/10 border border-green-500/20 rounded-xl flex items-start sm:items-center gap-3">
            <Check className="w-5 h-5 text-green-400 shrink-0" />
            <p className="text-green-400 text-sm break-words">
              {success || subscriptionMessage}
            </p>
          </div>
        )}

        {error && (
          <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start sm:items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
            <p className="text-red-400 text-sm break-words">{error}</p>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-4 sm:mb-6 overflow-x-auto pb-1 -mx-1 sm:mx-0">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setSelectedTab(tab.id as "plan" | "commissions");
              }}
              className={`shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                selectedTab === tab.id
                  ? "bg-white text-[#111827] shadow-sm"
                  : "text-[#64748B] hover:text-[#111827] hover:bg-gray-50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Card Registration Section - Show first if no card */}
        {!saasData.cardOnFile && (
          <div className="mb-4 sm:mb-6 bg-slate-100 border border-slate-200 rounded-2xl p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-slate-200 flex items-center justify-center shrink-0">
                <CreditCard className="w-6 h-6 text-slate-600" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-2">
                  {t("cardRequired")}
                </h3>
                <p className="text-slate-600 text-sm mb-4">
                  {t("cardRequiredDesc")}
                </p>
                <button
                  onClick={handleAddCard}
                  disabled={stripeLoading || !canManage}
                  className="w-full sm:w-auto px-4 py-2 bg-[#0F172A] hover:bg-[#1E293B] text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {stripeLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {t("loading")}
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4" />
                      {t("addCard")}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Card Status - Show if card is registered */}
        {saasData.cardOnFile && (
          <div className="mb-4 sm:mb-6 bg-green-50 border border-green-200 rounded-2xl p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-green-100 flex items-center justify-center shrink-0">
                  <Check className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-base sm:text-lg font-semibold text-[#166534] mb-1">
                    {t("cardRegistered")}
                  </h3>
                  <p className="text-sm text-[#166534] truncate">
                    {saasData.cardBrand &&
                      saasData.cardBrand.charAt(0).toUpperCase() +
                        saasData.cardBrand.slice(1)}{" "}
                    {saasData.cardLast4 && ` •••• ${saasData.cardLast4}`}
                  </p>
                </div>
              </div>
              <button
                onClick={handleAddCard}
                disabled={stripeLoading || !canManage}
                className="w-full sm:w-auto shrink-0 px-4 py-2 bg-white hover:bg-gray-50 text-[#166534] border border-green-200 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {stripeLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Settings className="w-4 h-4" />
                    {t("manage")}
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {selectedTab === "plan" && (
          <div className="space-y-4 sm:space-y-6">
            {/* Credit System Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              <CreditBalanceWidget
                walletCredits={saasData.walletCredits}
                monthlySubscription={saasData.monthlyCreditSubscription}
                renewalDate={saasData.creditRenewalDate}
                hasCreditSubscription={saasData.hasCreditSubscription}
              />
              <CreditSubscriptionSlider
                currentSubscription={saasData.monthlyCreditSubscription}
                onSubscribe={handleCreditSubscription}
                disabled={!canManage}
              />
            </div>

            {saasData.hasCreditSubscription && (
              <div className="flex justify-end mt-3">
                <button
                  onClick={handleCancelCreditSubscription}
                  disabled={stripeLoading || !canManage}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-red-200 bg-white text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {stripeLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{t("loading")}</span>
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4" />
                      <span>{t("cancelSubscription")}</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Overview */}
            <div className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-6 shadow-sm">
              <h2 className="text-base sm:text-lg font-semibold text-[#111827] mb-4">
                {t("overview")}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="bg-gray-50 rounded-xl p-3 sm:p-4 border border-gray-200 min-w-0">
                  <p className="text-xs font-medium text-[#6B7280] mb-1 uppercase tracking-wide">
                    {t("activeCreators")}
                  </p>
                  <p className="text-xl sm:text-2xl font-bold text-[#111827]">
                    {saasData.activeCreators}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 sm:p-4 border border-gray-200 min-w-0">
                  <p className="text-xs font-medium text-[#6B7280] mb-1 uppercase tracking-wide">
                    {t("status")}
                  </p>
                  <p
                    className={`text-base sm:text-lg font-semibold capitalize ${
                      saasData.subscriptionStatus === "active"
                        ? "text-emerald-600"
                        : saasData.subscriptionStatus === "past_due"
                          ? "text-red-600"
                          : "text-[#111827]"
                    }`}
                  >
                    {saasData.subscriptionStatus === "active"
                      ? t("active")
                      : saasData.subscriptionStatus === "past_due"
                        ? t("pastDue")
                        : saasData.subscriptionStatus}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {selectedTab === "commissions" && (
          <div className="space-y-4 sm:space-y-6">
            {/* Credit model - no debt */}
            <div className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-6 shadow-sm">
              <h3 className="font-semibold text-[#111827] mb-4 flex items-center gap-2">
                <Info className="w-5 h-5 text-[#3B82F6] shrink-0" />
                {t("howBillingWorks")}
              </h3>

              <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
                <div className="flex items-start gap-3 p-3 sm:p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-700 font-bold shrink-0 text-sm">
                    1
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm text-[#111827] font-medium">
                      {t("buyCredits")}
                    </h4>
                    <p className="text-xs text-[#64748B] mt-1">
                      {t("buyCreditsDesc")}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 sm:p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-700 font-bold shrink-0 text-sm">
                    2
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm text-[#111827] font-medium">
                      {t("qualifiedClicks")}
                    </h4>
                    <p className="text-xs text-[#64748B] mt-1">
                      {t("qualifiedClicksDesc")}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 sm:p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-700 font-bold shrink-0 text-sm">
                    3
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm text-[#111827] font-medium">
                      {t("monthlyRenewal")}
                    </h4>
                    <p className="text-xs text-[#64748B] mt-1">
                      {t("monthlyRenewalDesc")}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Invoice History (credit subscription invoices if any) */}
            {saasData.invoices && saasData.invoices.length > 0 ? (
              <div className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-6 shadow-sm">
                <h3 className="font-semibold text-[#111827] mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-[#3B82F6] shrink-0" />
                  {t("invoiceHistory")}
                </h3>
                <div className="space-y-3">
                  {saasData.invoices.map((invoice: any) => {
                    const period = invoice.period_start
                      ? new Date(invoice.period_start).toLocaleDateString(
                          "fr-FR",
                          { month: "short", year: "numeric" },
                        )
                      : "N/A";

                    return (
                      <div
                        key={invoice.id}
                        className="p-3 sm:p-4 bg-gray-50 rounded-xl border border-gray-200"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-sm text-[#111827] font-medium truncate">
                              {invoice.invoice_number ||
                                `Facture #${invoice.id.slice(0, 8)}`}
                            </p>
                            <p className="text-xs text-[#6B7280]">{period}</p>
                          </div>
                          <div className="text-left sm:text-right shrink-0">
                            <p className="text-sm font-medium text-[#111827]">
                              {Number(invoice.amount_ht).toFixed(2)}€ HT
                            </p>
                            <p className="text-xs text-[#6B7280]">
                              {invoice.status === "paid"
                                ? t("paid")
                                : invoice.status === "sent"
                                  ? t("sent")
                                  : invoice.status === "failed"
                                    ? t("failed")
                                    : t("draft")}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-6 text-center shadow-sm">
                <p className="text-[#64748B] text-sm">{t("noInvoices")}</p>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  return null;
}
