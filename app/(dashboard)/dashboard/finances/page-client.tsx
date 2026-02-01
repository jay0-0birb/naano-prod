"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
  pendingBalance: number;
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
    "plan",
  );
  const [error, setError] = useState<string | null>(null);
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
      setError("Une erreur est survenue lors de la création de l'abonnement");
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

  // Handle card registration
  const handleAddCard = async () => {
    // Redirect to settings page where card setup will be handled
    router.push("/dashboard/settings");
  };

  // Creator View
  if (isCreator && creatorData) {
    const canWithdraw = creatorData.canWithdraw ?? true;
    const legalStatus = creatorData.legalStatus ?? "particulier";
    const hasSiret = creatorData.hasSiret ?? false;

    return (
      <div className="max-w-5xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-[#111827] mb-1">
            Finances
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

        {/* Overview */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
              <Wallet className="w-6 h-6 text-[#1D4ED8]" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-[#111827]">
                Vue d&apos;ensemble
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
              <p className="text-[#64748B] text-sm mb-1">Active Partnerships</p>
              <p className="text-2xl font-bold text-[#111827]">
                {creatorData.activeSaas}
              </p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
              <p className="text-[#64748B] text-sm mb-1">Total Earned</p>
              <p className="text-2xl font-bold text-[#111827]">
                {creatorData.totalEarned.toFixed(2)}€
              </p>
              <p className="text-xs text-[#64748B]">Since the beginning</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
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
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#0F172A] hover:bg-[#020617] text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
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

        {/* Pro Upgrade Banner */}
        <div className="mb-6">
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
          <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200">
            <p className="text-sm text-amber-800 font-medium">
              Plus que {Math.ceil(500 - creatorData.totalEarned)} € avant le
              palier Pro. Anticipez votre création d&apos;entreprise !
            </p>
            <p className="text-xs text-amber-700 mt-1">
              Créer votre micro-entreprise prend 15 minutes et débloque des
              retraits illimités.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <a
                href={CALENDLY_EXPERT_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-800 text-sm font-medium transition-colors"
              >
                <Calendar className="w-4 h-4" />
                Prendre RDV pour créer mon Auto-Entreprise
              </a>
              <button
                type="button"
                onClick={() => setShowSiretForm(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-200 hover:bg-amber-300 text-amber-900 text-sm font-medium transition-colors"
              >
                Saisir mon SIRET
              </button>
            </div>
          </div>
        )}

        {/* Wallet Overview - Simplified */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-6 shadow-sm">
          <h3 className="font-semibold text-[#111827] mb-4 flex items-center gap-2">
            <Wallet className="w-5 h-5 text-[#1D4ED8]" />
            Wallet Balance
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl">
              <p className="text-xs text-[#6B7280] mb-1 font-medium">Pending</p>
              <p className="text-2xl font-bold text-[#111827]">
                {creatorData.pendingBalance.toFixed(2)}€
              </p>
              <p className="text-xs text-[#64748B] mt-1">
                Earnings from qualified clicks, pending transfer to your available balance.
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

          <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl">
            <p className="text-xs text-[#6B7280] mb-1 font-medium">
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
                    {creatorData.isPro ? " 1,10€" : " 0,90€"} (HT).
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
                    Credits are deducted per click. Your balance moves from "Pending" to
                    "Available" when processed.
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

        {/* Payout Section */}
        {creatorData.availableBalance > 0 && (
          <div className="mt-6 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="text-lg font-medium text-[#111827] mb-1">
                  Solde disponible
                </h4>
                <p className="text-3xl font-bold text-emerald-600">
                  {creatorData.availableBalance.toFixed(2)}€
                </p>
                <p className="text-xs text-[#64748B] mt-1">
                  Total gagné: {creatorData.totalEarned.toFixed(2)}€
                </p>
              </div>
            </div>

            {creatorData.stripeConnected ? (
              creatorData.availableBalance >= creatorData.minPayout ? (
                canWithdraw ? (
                  <button
                    onClick={handleRequestPayout}
                    disabled={payoutLoading}
                    className="w-full py-3 bg-[#0F172A] hover:bg-[#020617] text-white rounded-xl font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {payoutLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Traitement en cours...
                      </>
                    ) : (
                      <>
                        <Wallet className="w-4 h-4" />
                        Demander un virement ({creatorData.availableBalance.toFixed(2)}€)
                      </>
                    )}
                  </button>
                ) : (
                  <div className="space-y-4">
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                      <p className="text-sm text-amber-800 font-medium">
                        {creatorData.withdrawBlockReason ||
                          "Pour débloquer votre virement, renseignez un SIRET."}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <a
                        href={CALENDLY_EXPERT_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0F172A] hover:bg-[#1E293B] text-white text-sm font-medium transition-colors"
                      >
                        <Calendar className="w-4 h-4" />
                        Prendre RDV pour créer mon Auto-Entreprise
                      </a>
                      <button
                        type="button"
                        onClick={() => setShowSiretForm(true)}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 text-[#111827] text-sm font-medium transition-colors"
                      >
                        Saisir mon SIRET
                      </button>
                    </div>
                  </div>
                )
              ) : (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                  <p className="text-sm text-amber-700">
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
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                <p className="text-sm text-amber-700">
                  Connectez votre compte Stripe pour recevoir vos gains.
                </p>
              </div>
            )}
          </div>
        )}

        {/* SIRET entry modal (for Particuliers blocked at €500) */}
        {showSiretForm && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white border border-gray-200 rounded-2xl p-6 max-w-md w-full shadow-xl">
              <h3 className="text-lg font-semibold text-[#111827] mb-2">
                Saisir mon SIRET
              </h3>
              <p className="text-sm text-[#64748B] mb-4">
                Dès validation, votre compte bascule en statut Pro et débloque
                tous les fonds en attente.
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
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={siretLoading}
                    className="flex-1 py-2.5 bg-[#0F172A] hover:bg-[#1E293B] text-white rounded-xl font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {siretLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      "Valider"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Payout History */}
        {creatorData.payoutHistory && creatorData.payoutHistory.length > 0 && (
          <div className="mt-6 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <h4 className="text-lg font-medium text-[#111827] mb-4">
              Historique des virements
            </h4>
            <div className="space-y-3">
              {creatorData.payoutHistory.map((payout: any) => (
                <div
                  key={payout.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <div>
                    <p className="text-sm text-[#111827] font-medium">
                      {payout.amount.toFixed(2)}€
                    </p>
                    <p className="text-xs text-[#6B7280]">
                      {new Date(payout.created_at).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                  <div
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
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
      { id: "commissions", label: "Facturation" },
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
                  Cette carte sera utilisée pour payer votre abonnement crédits.
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
            {/* Credit System Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <CreditBalanceWidget
                walletCredits={saasData.walletCredits}
                monthlySubscription={saasData.monthlyCreditSubscription}
                renewalDate={saasData.creditRenewalDate}
              />
              <CreditSubscriptionSlider
                currentSubscription={saasData.monthlyCreditSubscription}
                onSubscribe={handleCreditSubscription}
              />
            </div>

            {/* Overview */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-[#111827] mb-4">
                Vue d&apos;ensemble
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <p className="text-xs font-medium text-[#6B7280] mb-1 uppercase tracking-wide">
                    Créateurs actifs
                  </p>
                  <p className="text-2xl font-bold text-[#111827]">
                    {saasData.activeCreators}
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
          </div>
        )}

        {selectedTab === "commissions" && (
          <div className="space-y-6">
            {/* Credit model - no debt */}
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
                      Achetez des crédits
                    </h4>
                    <p className="text-xs text-[#64748B] mt-1">
                      Choisissez votre volume mensuel dans l&apos;onglet Mon Plan.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-700 font-bold shrink-0 text-sm">
                    2
                  </div>
                  <div>
                    <h4 className="text-sm text-[#111827] font-medium">
                      Clics qualifiés
                    </h4>
                    <p className="text-xs text-[#64748B] mt-1">
                      Chaque clic qualifié consomme un crédit. Les créateurs sont payés automatiquement.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-700 font-bold shrink-0 text-sm">
                    3
                  </div>
                  <div>
                    <h4 className="text-sm text-[#111827] font-medium">
                      Renouvellement mensuel
                    </h4>
                    <p className="text-xs text-[#64748B] mt-1">
                      Vos crédits se renouvellent automatiquement chaque mois.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Invoice History (credit subscription invoices if any) */}
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
                          { month: "short", year: "numeric" },
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
                              {period}
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
                  Aucune facture pour le moment. Vos abonnements crédits apparaîtront ici.
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
