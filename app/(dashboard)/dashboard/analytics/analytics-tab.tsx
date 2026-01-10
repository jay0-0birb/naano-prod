"use client";

import { useEffect, useState } from "react";
import { getGlobalAnalytics } from "./actions";
import {
  TrendingUp,
  MousePointerClick,
  CheckCircle,
  Users,
  DollarSign,
  ArrowDownRight,
  ArrowUpRight,
} from "lucide-react";

interface Analytics {
  totalImpressions: number;
  totalClicks: number;
  qualifiedClicks: number;
  leadsCount: number;
  totalLeadCost: number;
  savingsVsLinkedIn: number;
}

export default function GlobalAnalyticsTab() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAnalytics() {
      setLoading(true);
      setError(null);

      const result = await getGlobalAnalytics();

      if (result.error) {
        setError(result.error);
      } else if (result.success) {
        setAnalytics(result.analytics);
      }

      setLoading(false);
    }

    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-500">Chargement des analytics...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-800">{error}</p>
      </div>
    );
  }

  if (!analytics) {
    return null;
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
    }).format(amount);
  };

  const savingsIsPositive = analytics.savingsVsLinkedIn >= 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Total Impressions */}
        <div className="bg-[#0A0C10] border border-white/10 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm text-slate-400">Total Impressions</div>
            <TrendingUp className="w-5 h-5 text-blue-400" />
          </div>
          <div className="text-3xl font-bold text-white">
            {analytics.totalImpressions.toLocaleString()}
          </div>
          <div className="text-xs text-slate-500 mt-2">
            Volume de visibilité brut généré
          </div>
        </div>

        {/* Total Clicks */}
        <div className="bg-[#0A0C10] border border-white/10 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm text-slate-400">Total Clicks (Brut)</div>
            <MousePointerClick className="w-5 h-5 text-green-400" />
          </div>
          <div className="text-3xl font-bold text-white">
            {analytics.totalClicks.toLocaleString()}
          </div>
          <div className="text-xs text-slate-500 mt-2">
            Tous les clics enregistrés
          </div>
        </div>

        {/* Qualified Clicks */}
        <div className="bg-[#0A0C10] border border-white/10 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm text-slate-400">
              Qualified Clicks (Billable)
            </div>
            <CheckCircle className="w-5 h-5 text-amber-400" />
          </div>
          <div className="text-3xl font-bold text-white">
            {analytics.qualifiedClicks.toLocaleString()}
          </div>
          <div className="text-xs text-slate-500 mt-2">
            Règle 3s + Anti-bot + IP + Geo
          </div>
        </div>

        {/* Conversions/Leads */}
        <div className="bg-[#0A0C10] border border-white/10 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm text-slate-400">Conversions / Leads</div>
            <Users className="w-5 h-5 text-purple-400" />
          </div>
          <div className="text-3xl font-bold text-white">
            {analytics.leadsCount.toLocaleString()}
          </div>
          <div className="text-xs text-slate-500 mt-2">
            Sign-ups ou démos enregistrés
          </div>
        </div>

        {/* Total Naano Cost */}
        <div className="bg-[#0A0C10] border border-white/10 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm text-slate-400">Coût Total Naano</div>
            <DollarSign className="w-5 h-5 text-red-400" />
          </div>
          <div className="text-3xl font-bold text-white">
            {formatCurrency(analytics.totalLeadCost)}
          </div>
          <div className="text-xs text-slate-500 mt-2">
            Coût total des leads générés
          </div>
        </div>

        {/* Savings vs LinkedIn Ads */}
        <div className="bg-[#0A0C10] border border-white/10 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm text-slate-400">
              Économies vs LinkedIn Ads
            </div>
            {savingsIsPositive ? (
              <ArrowUpRight className="w-5 h-5 text-green-400" />
            ) : (
              <ArrowDownRight className="w-5 h-5 text-red-400" />
            )}
          </div>
          <div
            className={`text-3xl font-bold ${
              savingsIsPositive ? "text-green-400" : "text-red-400"
            }`}
          >
            {savingsIsPositive ? "+" : ""}
            {formatCurrency(analytics.savingsVsLinkedIn)}
          </div>
          <div className="text-xs text-slate-500 mt-2">
            (Qualified Clicks × 8€) - Coût Naano
          </div>
        </div>
      </div>

      <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
        <p className="text-sm text-blue-300">
          <strong>Note:</strong> Les Qualified Clicks suivent la règle des 3
          secondes, le filtrage anti-bot & IP, et le géo-targeting. Les
          économies sont calculées en comparant le coût LinkedIn Ads (8€ par
          clic qualifié) avec votre coût Naano réel.
        </p>
      </div>
    </div>
  );
}

