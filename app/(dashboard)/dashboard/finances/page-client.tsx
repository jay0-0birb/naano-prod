"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Wallet,
  Crown,
  Zap,
  Rocket,
  Check,
  AlertCircle,
  ExternalLink,
  CreditCard,
  TrendingUp,
  Info,
  Loader2,
  Settings,
  RefreshCw,
  FileText,
} from "lucide-react";
import Link from "next/link";
import { SAAS_TIERS, SaasTier } from "@/lib/subscription-config";
import { refreshStripeStatus } from "@/lib/stripe-status";
import { verifySubscriptionStatus } from "@/lib/subscription-status";

interface CreatorData {
  tier: string;
  tierConfig: {
    name: string;
    price: number;
    priceLabel: string;
    maxSaas: number;
    features: string[];
  };
  activeSaas: number;
  maxSaas: number;
  stripeConnected: boolean;
  minPayout: number;
  pendingBalance: number; // BP1.md: Waiting for SaaS payment
  availableBalance: number; // BP1.md: Ready for payout
  totalEarned: number; // Lifetime total
  payoutHistory: any[];
}

interface SaasData {
  companyName: string;
  tier: SaasTier;
  tierConfig: (typeof SAAS_TIERS)[SaasTier];
  subscriptionStatus: string;
  activeCreators: number;
  maxCreators: number;
  allTiers: typeof SAAS_TIERS;
  currentDebt: number; // BP1.md: Current accumulated debt
  totalLeads: number; // Total leads generated
  totalInvoiced: number; // Total amount invoiced
  invoices: any[]; // Billing invoices
  cardOnFile: boolean; // Card registration status
  cardLast4: string | null; // Last 4 digits of card
  cardBrand: string | null; // Card brand (visa, mastercard, etc.)
}

interface FinancesPageClientProps {
  isCreator: boolean;
  creatorData?: CreatorData;
  saasData?: SaasData;
  subscriptionMessage?: string;
  stripeMessage?: string;
}

export default function FinancesPageClient({
  isCreator,
  creatorData,
  saasData,
  subscriptionMessage,
  stripeMessage,
}: FinancesPageClientProps) {
  const router = useRouter();
  const [selectedTab, setSelectedTab] = useState<"plan" | "commissions">(
    "plan"
  );
  const [loadingTier, setLoadingTier] = useState<SaasTier | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [stripeLoading, setStripeLoading] = useState(false);
  const [payoutLoading, setPayoutLoading] = useState(false);

  // Debug: Log what we're rendering
  useEffect(() => {
    console.log("FinancesPageClient render:", {
      isCreator,
      hasCreatorData: !!creatorData,
      hasSaasData: !!saasData,
      selectedTab,
      saasDataKeys: saasData ? Object.keys(saasData) : null,
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

  // Auto-refresh for SaaS subscriptions when coming back from Stripe Checkout
  useEffect(() => {
    if (subscriptionMessage && !isCreator && saasData) {
      // Verify subscription status immediately, then refresh multiple times
      const verifyAndRefresh = async () => {
        try {
          // First verification attempt
          const result = await verifySubscriptionStatus();
          if (result.success && result.tier && result.tier !== "starter") {
            // Success! Refresh immediately
            setTimeout(() => {
              router.refresh();
            }, 500);
          } else {
            // If not found yet, try again after 1 second
            setTimeout(async () => {
              const retryResult = await verifySubscriptionStatus();
              if (retryResult.success && retryResult.tier) {
                router.refresh();
              } else {
                // Still refresh after 2 seconds (webhook might have updated it)
                setTimeout(() => {
                  router.refresh();
                }, 2000);
              }
            }, 1000);
          }
        } catch (err) {
          console.error("Error verifying subscription:", err);
          // Still refresh after delays
          setTimeout(() => {
            router.refresh();
          }, 1000);
          setTimeout(() => {
            router.refresh();
          }, 3000);
        }
      };

      verifyAndRefresh();
    }
  }, [subscriptionMessage, isCreator, saasData, router]);

  const getTierIcon = (tier: SaasTier) => {
    switch (tier) {
      case "starter":
        return <Zap className="w-5 h-5" />;
      case "growth":
        return <Rocket className="w-5 h-5" />;
      case "scale":
        return <Crown className="w-5 h-5" />;
    }
  };

  const getTierGradient = (tier: SaasTier) => {
    switch (tier) {
      case "starter":
        return "from-slate-600 to-slate-700";
      case "growth":
        return "from-blue-600 to-blue-700";
      case "scale":
        return "from-amber-500 to-amber-600";
    }
  };

  const formatMaxCreators = (max: number) => {
    return max === Infinity || max > 100000 ? "∞" : max.toString();
  };

  // Handle plan change for SaaS
  const handlePlanChange = async (targetTier: SaasTier) => {
    setLoadingTier(targetTier);
    setError(null);

    try {
      const response = await fetch("/api/stripe/subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier: targetTier }),
      });

      const data = await response.json();

      if (data.error) {
        setError(data.error);
        setLoadingTier(null);
        return;
      }

      if (data.url) {
        // Redirect to Stripe Checkout
        window.location.href = data.url;
      } else if (data.success) {
        // Plan changed directly (downgrade or update)
        router.refresh();
      }
    } catch (err) {
      setError("Une erreur est survenue");
    } finally {
      setLoadingTier(null);
    }
  };

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
        setError(data.error);
        setStripeLoading(false);
        return;
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      setError("Une erreur est survenue");
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
      setError("Une erreur est survenue");
    } finally {
      setStripeLoading(false);
    }
  };

  // Handle sync subscription status
  const handleSyncSubscription = async () => {
    setStripeLoading(true);
    setError(null);

    try {
      const result = await verifySubscriptionStatus();
      if (result.error) {
        setError(result.error);
      } else {
        // Refresh the page to show updated status
        router.refresh();
      }
    } catch (err) {
      setError("Une erreur est survenue");
    } finally {
      setStripeLoading(false);
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
        setError("Non authentifié");
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
      setError("Une erreur est survenue");
      setPayoutLoading(false);
    }
  };

  // Handle manage subscription (Stripe portal)
  const handleManageSubscription = async () => {
    setStripeLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/stripe/subscription", {
        method: "GET",
      });

      const data = await response.json();

      if (data.error) {
        setError(data.error);
        setStripeLoading(false);
        return;
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      setError("Une erreur est survenue");
      setStripeLoading(false);
    }
  };

  // Handle card registration (BP1.md: Card required for SaaS)
  const handleAddCard = async () => {
    // Redirect to settings page where card setup will be handled
    router.push("/dashboard/settings");
  };

  // Creator View
  if (isCreator && creatorData) {
    return (
      <div className="max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-[#111827] mb-1">
            💰 Finances
          </h1>
          <p className="text-[#64748B] text-sm">
            Manage your earnings and request payouts
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {/* Success message */}
        {stripeMessage && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3">
            <Check className="w-5 h-5 text-green-600" />
            <p className="text-green-600 text-sm">{stripeMessage}</p>
          </div>
        )}

        {/* Current Plan Card */}
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-2xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-purple-600 flex items-center justify-center">
                <Wallet className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-[#111827]">
                  Plan {creatorData.tierConfig.name}
                </h2>
                <p className="text-[#64748B]">
                  {creatorData.tierConfig.priceLabel}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white rounded-xl p-4 border border-gray-200">
              <p className="text-[#64748B] text-sm mb-1">Active Partnerships</p>
              <p className="text-2xl font-bold text-[#111827]">
                {creatorData.activeSaas}
                <span className="text-lg font-normal text-[#64748B]">
                  /{creatorData.maxSaas}
                </span>
              </p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-200">
              <p className="text-[#64748B] text-sm mb-1">Total Earned</p>
              <p className="text-2xl font-bold text-[#111827]">
                {creatorData.totalEarned.toFixed(2)}€
              </p>
              <p className="text-xs text-[#64748B]">Since the beginning</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-200">
              <p className="text-[#64748B] text-sm mb-1">Available</p>
              <p className="text-2xl font-bold text-[#111827]">
                {creatorData.availableBalance.toFixed(2)}€
              </p>
              <p className="text-xs text-[#64748B]">Ready for payout</p>
            </div>
          </div>
        </div>

        {/* Stripe Connection */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-[#3B82F6]" />
            </div>
            <div>
              <h3 className="font-semibold text-[#111827]">Stripe Payments</h3>
              <p className="text-xs text-[#64748B]">Receive your commissions</p>
            </div>
          </div>

          {creatorData.stripeConnected ? (
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-xl border border-green-200">
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-green-600" />
                <span className="text-sm text-green-700 font-medium">
                  Stripe account connected
                </span>
              </div>
              <Link
                href="/dashboard/settings"
                className="text-xs text-[#64748B] hover:text-[#111827] flex items-center gap-1"
              >
                <Settings className="w-3 h-3" />
                Manage
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-amber-400 font-medium">
                      Stripe non connecté
                    </p>
                    <p className="text-xs text-amber-400/70 mt-1">
                      Connectez votre compte pour recevoir vos commissions
                      directement sur votre compte bancaire.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleStripeConnect}
                  disabled={stripeLoading}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#635BFF] hover:bg-[#5851DB] text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {stripeLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Connexion en cours...
                    </>
                  ) : (
                    <>
                      <ExternalLink className="w-4 h-4" />
                      Connecter mon compte Stripe
                    </>
                  )}
                </button>

                {stripeMessage && (
                  <button
                    onClick={handleRefreshStatus}
                    disabled={stripeLoading}
                    className="px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
                    title="Actualiser le statut"
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
        </div>

        {/* Wallet Overview - Simplified */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-6 shadow-sm">
          <h3 className="font-semibold text-[#111827] mb-4 flex items-center gap-2">
            <Wallet className="w-5 h-5 text-[#8B5CF6]" />
            Wallet Balance
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
              <p className="text-xs text-blue-700 mb-1 font-medium">Pending</p>
              <p className="text-2xl font-bold text-[#111827]">
                {creatorData.pendingBalance.toFixed(2)}€
              </p>
              <p className="text-xs text-[#64748B] mt-1">
                Waiting for SaaS to pay Naano. Once paid, this will move to
                "Available".
              </p>
            </div>
            <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
              <p className="text-xs text-green-700 mb-1 font-medium">
                Available
              </p>
              <p className="text-2xl font-bold text-[#111827]">
                {creatorData.availableBalance.toFixed(2)}€
              </p>
              <p className="text-xs text-[#64748B] mt-1">
                Ready for payout. Click "Withdraw" to receive this money in your
                Stripe account.
              </p>
            </div>
          </div>

          <div className="p-4 bg-purple-50 border border-purple-200 rounded-xl">
            <p className="text-xs text-purple-700 mb-1 font-medium">
              Total Earned (Lifetime)
            </p>
            <p className="text-2xl font-bold text-[#111827]">
              {creatorData.totalEarned.toFixed(2)}€
            </p>
            <p className="text-xs text-[#64748B] mt-1">
              Total of all your earnings since the beginning (Pending +
              Available + Already withdrawn)
            </p>
          </div>

          {/* How it works */}
          <div className="pt-6 border-t border-gray-200">
            <h4 className="text-sm font-semibold text-[#111827] mb-3 flex items-center gap-2">
              <Info className="w-4 h-4 text-[#3B82F6]" />
              How it works
            </h4>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold shrink-0 text-xs">
                  1
                </div>
                <div>
                  <p className="text-xs text-[#111827] font-medium">
                    You generate leads
                  </p>
                  <p className="text-xs text-[#64748B] mt-0.5">
                    Share your tracked link. Each validated lead earns you
                    1.20€.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold shrink-0 text-xs">
                  2
                </div>
                <div>
                  <p className="text-xs text-[#111827] font-medium">
                    SaaS pays
                  </p>
                  <p className="text-xs text-[#64748B] mt-0.5">
                    SaaS pays Naano, your balance moves from "Pending" to
                    "Available".
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold shrink-0 text-xs">
                  3
                </div>
                <div>
                  <p className="text-xs text-[#111827] font-medium">
                    Request payout
                  </p>
                  <p className="text-xs text-[#64748B] mt-0.5">
                    Once you have {creatorData.minPayout}€ available, withdraw
                    via Stripe.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Payout Section (BP1.md) */}
        {creatorData.availableBalance > 0 && (
          <div className="mt-6 p-6 bg-green-500/10 border border-green-500/20 rounded-xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="text-lg font-medium text-white mb-1">
                  Solde disponible
                </h4>
                <p className="text-3xl font-bold text-green-400">
                  {creatorData.availableBalance.toFixed(2)}€
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Total gagné: {creatorData.totalEarned.toFixed(2)}€
                </p>
              </div>
            </div>

            {creatorData.stripeConnected ? (
              creatorData.availableBalance >= creatorData.minPayout ? (
                <button
                  onClick={handleRequestPayout}
                  disabled={payoutLoading}
                  className="w-full py-3 bg-green-500 hover:bg-green-400 text-white rounded-xl font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {payoutLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Traitement en cours...
                    </>
                  ) : (
                    <>
                      <Wallet className="w-4 h-4" />
                      Retirer ({creatorData.availableBalance.toFixed(2)}€)
                    </>
                  )}
                </button>
              ) : (
                <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                  <p className="text-sm text-amber-400">
                    Montant minimum requis: {creatorData.minPayout}€. Il vous
                    manque{" "}
                    {(
                      creatorData.minPayout - creatorData.availableBalance
                    ).toFixed(2)}
                    €.
                  </p>
                </div>
              )
            ) : (
              <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                <p className="text-sm text-amber-400">
                  Connectez votre compte Stripe pour recevoir vos gains.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Payout History */}
        {creatorData.payoutHistory && creatorData.payoutHistory.length > 0 && (
          <div className="mt-6 p-6 bg-[#0A0C10] border border-white/10 rounded-xl">
            <h4 className="text-lg font-medium text-white mb-4">
              Historique des virements
            </h4>
            <div className="space-y-3">
              {creatorData.payoutHistory.map((payout: any) => (
                <div
                  key={payout.id}
                  className="flex items-center justify-between p-3 bg-white/5 rounded-lg"
                >
                  <div>
                    <p className="text-sm text-white font-medium">
                      {payout.amount.toFixed(2)}€
                    </p>
                    <p className="text-xs text-slate-400">
                      {new Date(payout.created_at).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                  <div
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      payout.status === "completed"
                        ? "bg-green-500/20 text-green-400"
                        : payout.status === "processing"
                        ? "bg-blue-500/20 text-blue-400"
                        : payout.status === "failed"
                        ? "bg-red-500/20 text-red-400"
                        : "bg-slate-500/20 text-slate-400"
                    }`}
                  >
                    {payout.status === "completed"
                      ? "Complété"
                      : payout.status === "processing"
                      ? "En cours"
                      : payout.status === "failed"
                      ? "Échoué"
                      : "En attente"}
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
    if (!saasData) {
      return (
        <div className="max-w-5xl">
          <div className="mb-8">
            <h1 className="text-2xl font-normal text-white mb-1">
              Finances & Plans
            </h1>
            <p className="text-slate-400 text-sm">
              Gérez votre abonnement et votre facturation
            </p>
          </div>
          <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6">
            <p className="text-red-400">Erreur: Données SaaS non trouvées</p>
          </div>
        </div>
      );
    }
    const tabs = [
      { id: "plan", label: "Mon Plan" },
      { id: "commissions", label: "Facturation" }, // BP1.md: Changed from "Commissions" to "Facturation"
    ];

    return (
      <div className="max-w-5xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-[#111827] mb-1">
            Finances & Plans
          </h1>
          <p className="text-[#64748B] text-sm">
            Manage your subscription and billing
          </p>
        </div>

        {/* Success/Error messages */}
        {subscriptionMessage && (
          <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center gap-3">
            <Check className="w-5 h-5 text-green-400" />
            <p className="text-green-400 text-sm">{subscriptionMessage}</p>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setSelectedTab(tab.id as "plan" | "commissions");
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
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
          <div className="mb-6 bg-amber-500/10 border border-amber-500/20 rounded-2xl p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0">
                <CreditCard className="w-6 h-6 text-amber-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white mb-2">
                  Carte bancaire requise
                </h3>
                <p className="text-slate-400 text-sm mb-4">
                  Vous devez enregistrer une carte bancaire pour utiliser Naano.
                  Cette carte sera utilisée pour payer les leads générés par vos
                  créateurs.
                </p>
                <button
                  onClick={handleAddCard}
                  disabled={stripeLoading}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {stripeLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Chargement...
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4" />
                      Ajouter une carte
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Card Status - Show if card is registered */}
        {saasData.cardOnFile && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-2xl p-6">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                  <Check className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-[#166534] mb-1">
                    Carte enregistrée
                  </h3>
                  <p className="text-sm text-[#166534]">
                    {saasData.cardBrand &&
                      saasData.cardBrand.charAt(0).toUpperCase() +
                        saasData.cardBrand.slice(1)}{" "}
                    {saasData.cardLast4 && ` •••• ${saasData.cardLast4}`}
                  </p>
                </div>
              </div>
              <button
                onClick={handleAddCard}
                disabled={stripeLoading}
                className="px-4 py-2 bg-white hover:bg-gray-50 text-[#166534] border border-green-200 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {stripeLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Settings className="w-4 h-4" />
                    Modifier
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {selectedTab === "plan" && (
          <div className="space-y-6">
            {/* Current Plan Card */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-[#1D4ED8]">
                    {getTierIcon(saasData.tier)}
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-[#111827]">
                      Plan {saasData.tierConfig.name}
                    </h2>
                    <p className="text-sm text-[#64748B]">
                      {saasData.tierConfig.priceLabel}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {(subscriptionMessage || saasData.tier !== "starter") && (
                    <button
                      onClick={handleSyncSubscription}
                      disabled={stripeLoading}
                      className="px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-[#111827] rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                      title="Synchroniser avec Stripe"
                    >
                      <RefreshCw
                        className={`w-4 h-4 ${
                          stripeLoading ? "animate-spin" : ""
                        }`}
                      />
                    </button>
                  )}
                  {saasData.tier !== "starter" && (
                    <button
                      onClick={handleManageSubscription}
                      disabled={stripeLoading}
                      className="px-4 py-2 bg-[#111827] hover:bg-[#020617] text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                    >
                      {stripeLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Settings className="w-4 h-4" />
                      )}
                      Gérer
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <p className="text-xs font-medium text-[#6B7280] mb-1 uppercase tracking-wide">
                    Créateurs actifs
                  </p>
                  <p className="text-2xl font-bold text-[#111827]">
                    {saasData.activeCreators}
                    <span className="text-lg font-normal text-[#64748B]">
                      /{formatMaxCreators(saasData.maxCreators)}
                    </span>
                  </p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <p className="text-xs font-medium text-[#6B7280] mb-1 uppercase tracking-wide">
                    Prix par lead
                  </p>
                  <p className="text-2xl font-bold text-[#111827]">
                    {saasData.tier === "starter"
                      ? "2,50€"
                      : saasData.tier === "growth"
                      ? "2,00€"
                      : saasData.tier === "scale"
                      ? "1,60€"
                      : "N/A"}
                  </p>
                  <p className="text-xs text-[#64748B] mt-1">
                    Selon votre plan
                  </p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <p className="text-xs font-medium text-[#6B7280] mb-1 uppercase tracking-wide">
                    Statut
                  </p>
                  <p
                    className={`text-lg font-semibold capitalize ${
                      saasData.subscriptionStatus === "active"
                        ? "text-emerald-600"
                        : saasData.subscriptionStatus === "past_due"
                        ? "text-amber-600"
                        : "text-[#111827]"
                    }`}
                  >
                    {saasData.subscriptionStatus === "active"
                      ? "Actif"
                      : saasData.subscriptionStatus === "past_due"
                      ? "Paiement en retard"
                      : saasData.subscriptionStatus}
                  </p>
                </div>
              </div>
            </div>

            {/* All Plans */}
            <div>
              <h3 className="text-lg font-medium text-[#111827] mb-4">
                Tous les plans
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {(
                  Object.entries(saasData.allTiers) as [
                    SaasTier,
                    (typeof SAAS_TIERS)[SaasTier]
                  ][]
                ).map(([tierKey, tier]) => {
                  const isCurrentTier = tierKey === saasData.tier;
                  const isLoading = loadingTier === tierKey;
                  const isUpgrade = tier.price > saasData.tierConfig.price;
                  const isDowngrade = tier.price < saasData.tierConfig.price;

                  return (
                    <div
                      key={tierKey}
                      className={`bg-white border rounded-2xl p-6 relative shadow-sm ${
                        isCurrentTier
                          ? "border-[#3B82F6] ring-1 ring-[#3B82F6]/10"
                          : "border-gray-200"
                      }`}
                    >
                      {isCurrentTier && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-[#3B82F6] text-white text-xs font-medium rounded-full">
                          Plan actuel
                        </div>
                      )}

                      {tier.recommended && !isCurrentTier && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-emerald-500 text-white text-xs font-medium rounded-full">
                          Recommandé
                        </div>
                      )}

                      <div className="flex items-center gap-3 mb-4 mt-2">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                            tierKey === "starter"
                              ? "bg-gray-100 text-gray-600"
                              : tierKey === "growth"
                              ? "bg-blue-50 text-[#1D4ED8]"
                              : "bg-amber-50 text-amber-600"
                          }`}
                        >
                          {getTierIcon(tierKey)}
                        </div>
                        <div>
                          <h4 className="font-semibold text-[#111827]">
                            {tier.name}
                          </h4>
                          <p className="text-xl font-bold text-[#111827]">
                            {tier.price === 0 ? "Gratuit" : `${tier.price}€`}
                            {tier.price > 0 && (
                              <span className="text-sm font-normal text-[#6B7280]">
                                /mois
                              </span>
                            )}
                          </p>
                        </div>
                      </div>

                      <ul className="space-y-2 mb-6">
                        {tier.features.map((feature, i) => (
                          <li
                            key={i}
                            className="flex items-center gap-2 text-sm text-[#4B5563]"
                          >
                            <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                            {feature}
                          </li>
                        ))}
                        <li className="flex items-center gap-2 text-sm text-[#4B5563]">
                          <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                          {tierKey === "starter"
                            ? "2,50€"
                            : tierKey === "growth"
                            ? "2,00€"
                            : "1,60€"}{" "}
                          par lead
                        </li>
                      </ul>

                      {isCurrentTier ? (
                        <button
                          disabled
                          className="w-full py-2.5 bg-gray-100 text-[#6B7280] rounded-xl text-sm font-medium cursor-not-allowed"
                        >
                          Plan actuel
                        </button>
                      ) : (
                        <button
                          onClick={() => handlePlanChange(tierKey)}
                          disabled={isLoading || loadingTier !== null}
                          className={`w-full py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50 ${
                            tierKey === "scale"
                              ? "bg-amber-500 hover:bg-amber-400 text-black"
                              : "bg-[#111827] hover:bg-[#020617] text-white"
                          }`}
                        >
                          {isLoading ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Chargement...
                            </>
                          ) : isDowngrade ? (
                            "Rétrograder"
                          ) : isUpgrade ? (
                            "Passer à ce plan"
                          ) : (
                            "Sélectionner"
                          )}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {selectedTab === "commissions" && (
          <div className="space-y-6">
            {/* Billing Overview */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-6 shadow-sm">
              <h3 className="font-semibold text-[#111827] mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-[#1D4ED8]" />
                Vue d&apos;ensemble de la facturation
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                  <p className="text-xs font-medium text-[#1D4ED8] mb-1 uppercase tracking-wide">
                    Dette actuelle
                  </p>
                  <p className="text-3xl font-bold text-[#111827]">
                    {saasData.currentDebt.toFixed(2)}€
                  </p>
                  <p className="text-xs text-[#1D4ED8] mt-1 mb-3">
                    {saasData.currentDebt >= 100
                      ? "⚠️ Facturation imminente"
                      : `${(100 - saasData.currentDebt).toFixed(
                          2
                        )}€ avant facturation`}
                  </p>
                  {saasData.currentDebt >= 100 && (
                    <button
                      onClick={async () => {
                        if (
                          !confirm(
                            `Payer ${saasData.currentDebt.toFixed(
                              2
                            )}€ maintenant ?`
                          )
                        )
                          return;

                        try {
                          const response = await fetch(
                            "/api/billing/check-and-bill",
                            {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({}),
                            }
                          );

                          const result = await response.json();

                          if (result.success || result.billed_count > 0) {
                            alert(
                              "Facturation en cours... Vous serez redirigé dans quelques secondes."
                            );
                            setTimeout(() => window.location.reload(), 2000);
                          } else {
                            alert(
                              "Erreur: " +
                                (result.error || "Impossible de facturer")
                            );
                          }
                        } catch (error: any) {
                          alert("Erreur: " + error.message);
                        }
                      }}
                      className="w-full px-4 py-2 bg-[#111827] hover:bg-[#020617] text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      <CreditCard className="w-4 h-4" />
                      Payer maintenant
                    </button>
                  )}
                </div>
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <p className="text-xs font-medium text-[#6B7280] mb-1 uppercase tracking-wide">
                    Total leads
                  </p>
                  <p className="text-3xl font-bold text-[#111827]">
                    {saasData.totalLeads}
                  </p>
                  <p className="text-xs text-[#64748B] mt-1">Leads validés</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <p className="text-xs font-medium text-[#6B7280] mb-1 uppercase tracking-wide">
                    Total facturé
                  </p>
                  <p className="text-3xl font-bold text-[#111827]">
                    {saasData.totalInvoiced.toFixed(2)}€
                  </p>
                  <p className="text-xs text-[#64748B] mt-1">
                    Toutes factures payées
                  </p>
                </div>
              </div>
            </div>

            {/* How Billing Works */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
              <h3 className="font-semibold text-[#111827] mb-4 flex items-center gap-2">
                <Info className="w-5 h-5 text-[#3B82F6]" />
                Comment fonctionne la facturation
              </h3>

              <div className="space-y-4 mb-6">
                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-700 font-bold shrink-0 text-sm">
                    1
                  </div>
                  <div>
                    <h4 className="text-sm text-[#111827] font-medium">
                      Vous recevez des leads
                    </h4>
                    <p className="text-xs text-[#64748B] mt-1">
                      Chaque lead validé ajoute{" "}
                      {saasData.tier === "starter"
                        ? "2,50€"
                        : saasData.tier === "growth"
                        ? "2,00€"
                        : "1,60€"}{" "}
                      à votre dette.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-700 font-bold shrink-0 text-sm">
                    2
                  </div>
                  <div>
                    <h4 className="text-sm text-[#111827] font-medium">
                      Facturation automatique
                    </h4>
                    <p className="text-xs text-[#64748B] mt-1">
                      Vous êtes facturé automatiquement lorsque vous atteignez
                      100€ de dette ou à la fin du mois.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-700 font-bold shrink-0 text-sm">
                    3
                  </div>
                  <div>
                    <h4 className="text-sm text-[#111827] font-medium">
                      Paiement par carte
                    </h4>
                    <p className="text-xs text-[#64748B] mt-1">
                      La facture est prélevée automatiquement sur votre carte
                      enregistrée.
                    </p>
                  </div>
                </div>
              </div>

              {/* Pricing by Plan */}
              <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl">
                <p className="text-xs text-[#1D4ED8] mb-3 font-medium">
                  💡 Prix par lead selon votre plan
                </p>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-[#64748B]">Plan Starter</span>
                    <span className="text-[#111827] font-medium">2,50€</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[#64748B]">Plan Growth</span>
                    <span className="text-[#111827] font-medium">2,00€</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[#64748B]">Plan Scale</span>
                    <span className="text-[#111827] font-medium">1,60€</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-blue-100">
                    <span className="text-[#1D4ED8] font-medium">
                      Créateur reçoit
                    </span>
                    <span className="text-[#1D4ED8] font-medium">
                      1,20€ (fixe)
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Invoice History */}
            {saasData.invoices && saasData.invoices.length > 0 ? (
              <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                <h3 className="font-semibold text-[#111827] mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-[#3B82F6]" />
                  Historique des factures
                </h3>
                <div className="space-y-3">
                  {saasData.invoices.map((invoice: any) => {
                    const period = invoice.period_start
                      ? new Date(invoice.period_start).toLocaleDateString(
                          "fr-FR",
                          { month: "short", year: "numeric" }
                        )
                      : "N/A";

                    return (
                      <div
                        key={invoice.id}
                        className="p-4 bg-gray-50 rounded-xl border border-gray-200"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-[#111827] font-medium">
                              {invoice.invoice_number ||
                                `Facture #${invoice.id.slice(0, 8)}`}
                            </p>
                            <p className="text-xs text-[#6B7280]">
                              {period} • {invoice.leads_count} leads
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-[#111827]">
                              {Number(invoice.amount_ht).toFixed(2)}€ HT
                            </p>
                            <p className="text-xs text-[#6B7280]">
                              {invoice.status === "paid"
                                ? "Payée"
                                : invoice.status === "sent"
                                ? "Envoyée"
                                : invoice.status === "failed"
                                ? "Échouée"
                                : "Brouillon"}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="bg-white border border-gray-200 rounded-2xl p-6 text-center shadow-sm">
                <p className="text-[#64748B] text-sm">
                  Aucune facture pour le moment. Les factures apparaîtront ici
                  une fois que vous atteignez 100€ de dette ou la fin du mois.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  return null;
}
