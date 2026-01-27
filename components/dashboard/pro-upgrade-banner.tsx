"use client";

import { useState } from "react";
import { Crown, Check, Loader2, Sparkles } from "lucide-react";

interface ProUpgradeBannerProps {
  isPro: boolean;
  proStatusSource: string | null;
  proExpirationDate: string | null;
  hasProSubscription: boolean;
}

export default function ProUpgradeBanner({
  isPro,
  proStatusSource,
  proExpirationDate,
  hasProSubscription,
}: ProUpgradeBannerProps) {
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<"monthly" | "annual">("monthly");

  const handleUpgrade = async (plan: "monthly" | "annual") => {
    setLoading(true);
    try {
      const response = await fetch("/api/stripe/pro-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });

      if (!response.ok) {
        throw new Error("Erreur lors de la création de l'abonnement");
      }

      const { url } = await response.json();
      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      console.error("Pro upgrade error:", error);
      alert("Erreur lors de l'upgrade. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  const getExpirationText = (dateString: string | null): string => {
    if (!dateString) return "";
    const expiration = new Date(dateString);
    const now = new Date();
    
    if (expiration < now) {
      return "Expiré";
    }
    
    const diffTime = expiration.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays > 30) {
      const months = Math.floor(diffDays / 30);
      return `Expire dans ${months} mois`;
    }
    return `Expire dans ${diffDays} jour${diffDays !== 1 ? "s" : ""}`;
  };

  // If Pro (paid)
  if (isPro && proStatusSource === "PAYMENT" && hasProSubscription) {
    return (
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-blue-50 rounded-lg">
            <Crown className="w-6 h-6 text-[#1D4ED8]" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900">
              Membre Pro
            </h3>
            <p className="text-sm text-slate-600">
              {proExpirationDate && getExpirationText(proExpirationDate)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-700">
          <Check className="w-4 h-4 text-green-600" />
          <span>Vous gagnez <strong>1,10€</strong> par clic qualifié (au lieu de 0,90€)</span>
        </div>
      </div>
    );
  }

  // If Pro (promo/free)
  if (isPro && proStatusSource === "PROMO") {
    return (
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-blue-50 rounded-lg">
            <Sparkles className="w-6 h-6 text-[#1D4ED8]" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900">
              Membre Pro (Offert) 🎁
            </h3>
            <p className="text-sm text-slate-600">
              {proExpirationDate && getExpirationText(proExpirationDate)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-700">
          <Check className="w-4 h-4 text-green-600" />
          <span>Vous gagnez <strong>1,10€</strong> par clic qualifié</span>
        </div>
      </div>
    );
  }

  // If Standard - show upgrade CTA
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 rounded-lg">
            <Crown className="w-6 h-6 text-[#1D4ED8]" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900">
              Passez à Naano Pro
            </h3>
            <p className="text-sm text-slate-600">
              Gagnez plus par clic qualifié
            </p>
          </div>
        </div>
      </div>

      <div className="mb-4 space-y-2">
        <div className="flex items-center gap-2 text-sm text-slate-700">
          <Check className="w-4 h-4 text-green-600" />
          <span><strong>1,10€</strong> par clic (au lieu de 0,90€)</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-700">
          <Check className="w-4 h-4 text-green-600" />
          <span>Badge "Pro" sur votre profil</span>
        </div>
      </div>

      {/* Plan Selection */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setSelectedPlan("monthly")}
          className={`flex-1 px-4 py-2 rounded-lg border transition-colors ${
            selectedPlan === "monthly"
              ? "bg-[#0F172A] text-white border-[#0F172A]"
              : "bg-white text-[#111827] border-gray-200 hover:bg-gray-50"
          }`}
        >
          <div className="text-sm font-semibold">Mensuel</div>
          <div className="text-xs opacity-90">25€/mois</div>
        </button>
        <button
          onClick={() => setSelectedPlan("annual")}
          className={`flex-1 px-4 py-2 rounded-lg border transition-colors ${
            selectedPlan === "annual"
              ? "bg-[#0F172A] text-white border-[#0F172A]"
              : "bg-white text-[#111827] border-gray-200 hover:bg-gray-50"
          }`}
        >
          <div className="text-sm font-semibold">Annuel</div>
          <div className="text-xs opacity-90">250€/an</div>
        </button>
      </div>

      <button
        onClick={() => handleUpgrade(selectedPlan)}
        disabled={loading}
        className="w-full bg-[#0F172A] hover:bg-[#020617] disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors"
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Chargement...</span>
          </>
        ) : (
          <>
            <Crown className="w-5 h-5" />
            <span>Passer à Pro</span>
          </>
        )}
      </button>
    </div>
  );
}
