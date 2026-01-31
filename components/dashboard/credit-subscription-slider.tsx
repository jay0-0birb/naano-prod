"use client";

import { useState, useEffect } from "react";
import { Loader2, CreditCard } from "lucide-react";

// Volume pricing tiers (from planP.md) - used for instant local calculation
function getCreditUnitPrice(volume: number): number {
  if (volume >= 5000) return 1.60;
  if (volume >= 4000) return 1.75;
  if (volume >= 3000) return 1.85;
  if (volume >= 2500) return 1.95;
  if (volume >= 2000) return 2.05;
  if (volume >= 1750) return 2.10;
  if (volume >= 1500) return 2.15;
  if (volume >= 1250) return 2.20;
  if (volume >= 1000) return 2.25;
  if (volume >= 750) return 2.35;
  if (volume >= 500) return 2.45;
  if (volume >= 250) return 2.55;
  return 2.60; // Default for 100-249
}

interface CreditSubscriptionSliderProps {
  currentSubscription?: number | null;
  onSubscribe: (creditVolume: number) => Promise<void>;
}

export default function CreditSubscriptionSlider({
  currentSubscription,
  onSubscribe,
}: CreditSubscriptionSliderProps) {
  const [creditVolume, setCreditVolume] = useState(currentSubscription || 1000);
  const [unitPrice, setUnitPrice] = useState<number>(0);
  const [totalPrice, setTotalPrice] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  // Calculate price - use local calculation for instant display (avoids race condition when slider moves quickly)
  useEffect(() => {
    const price = getCreditUnitPrice(creditVolume);
    setUnitPrice(price);
    setTotalPrice(price * creditVolume);
  }, [creditVolume]);

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      await onSubscribe(creditVolume);
    } catch (error) {
      console.error("Subscription error:", error);
    } finally {
      setLoading(false);
    }
  };

  // Round to nearest 50
  const roundToStep = (value: number, step: number = 50) => {
    return Math.round(value / step) * step;
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    setCreditVolume(roundToStep(value, 50));
  };

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-2">
          Abonnement Crédits
        </h3>
        <p className="text-sm text-slate-600">
          Choisissez votre volume mensuel de crédits (1 crédit = 1 clic qualifié)
        </p>
      </div>

      {/* Slider */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <label className="text-sm font-medium text-slate-700">
            Volume mensuel
          </label>
          <span className="text-lg font-semibold text-slate-900">
            {creditVolume.toLocaleString()} crédits
          </span>
        </div>

        <input
          type="range"
          min="100"
          max="5000"
          step="50"
          value={creditVolume}
          onChange={handleSliderChange}
          className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
        />

        <div className="flex justify-between text-xs text-slate-500 mt-2">
          <span>100</span>
          <span>2,500</span>
          <span>5,000+</span>
        </div>
      </div>

      {/* Pricing Display */}
      <div className="bg-slate-50 rounded-xl p-4 mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-slate-600">Prix unitaire</span>
          <span className="text-sm font-medium text-slate-900">
            {unitPrice.toFixed(2)}€ / crédit
          </span>
        </div>
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-slate-600">Volume</span>
          <span className="text-sm font-medium text-slate-900">
            {creditVolume.toLocaleString()} crédits
          </span>
        </div>
        <div className="border-t border-slate-200 pt-2 mt-2">
          <div className="flex justify-between items-center">
            <span className="text-base font-semibold text-slate-900">
              Total mensuel (HT)
            </span>
            <span className="text-xl font-bold text-blue-600">
              {totalPrice.toFixed(2)}€
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 text-right">
            TVA calculée automatiquement à la commande
          </p>
        </div>
      </div>

      {/* Subscribe Button */}
      <button
        onClick={handleSubscribe}
        disabled={loading || creditVolume < 100}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors"
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Chargement...</span>
          </>
        ) : currentSubscription ? (
          <>
            <CreditCard className="w-5 h-5" />
            <span>Mettre à jour l'abonnement</span>
          </>
        ) : (
          <>
            <CreditCard className="w-5 h-5" />
            <span>S'abonner</span>
          </>
        )}
      </button>

      {currentSubscription && (
        <p className="text-xs text-slate-500 text-center mt-3">
          Abonnement actuel: {currentSubscription.toLocaleString()} crédits/mois
        </p>
      )}
    </div>
  );
}
