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
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm text-[#64748B]">Total impressions</div>
            <TrendingUp className="w-5 h-5 text-[#3B82F6]" />
          </div>
          <div className="text-3xl font-bold text-[#111827]">
            {analytics.totalImpressions.toLocaleString()}
          </div>
          <div className="text-xs text-[#94A3B8] mt-2">
            Volume de visibilité brut généré
          </div>
        </div>

        {/* Total Clicks */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm text-[#64748B]">Total clics (brut)</div>
            <MousePointerClick className="w-5 h-5 text-emerald-500" />
          </div>
          <div className="text-3xl font-bold text-[#111827]">
            {analytics.totalClicks.toLocaleString()}
          </div>
          <div className="text-xs text-[#94A3B8] mt-2">
            Tous les clics enregistrés
          </div>
        </div>

        {/* Qualified Clicks */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm text-[#64748B]">
              Qualified clicks (billable)
            </div>
            <CheckCircle className="w-5 h-5 text-amber-500" />
          </div>
          <div className="text-3xl font-bold text-[#111827]">
            {analytics.qualifiedClicks.toLocaleString()}
          </div>
          <div className="text-xs text-[#94A3B8] mt-2">
            Règle 3s + Anti-bot + IP + Geo
          </div>
        </div>

        {/* Conversions/Leads */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm text-[#64748B]">Conversions / leads</div>
            <Users className="w-5 h-5 text-purple-500" />
          </div>
          <div className="text-3xl font-bold text-[#111827]">
            {analytics.leadsCount.toLocaleString()}
          </div>
          <div className="text-xs text-[#94A3B8] mt-2">
            Sign-ups ou démos enregistrés
          </div>
        </div>

        {/* Total Naano Cost */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm text-[#64748B]">Coût total Naano</div>
            <DollarSign className="w-5 h-5 text-rose-500" />
          </div>
          <div className="text-3xl font-bold text-[#111827]">
            {formatCurrency(analytics.totalLeadCost)}
          </div>
          <div className="text-xs text-[#94A3B8] mt-2">
            Coût total des leads générés
          </div>
        </div>

        {/* Savings vs LinkedIn Ads */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm text-[#64748B]">
              Économies vs LinkedIn Ads
            </div>
            {savingsIsPositive ? (
              <ArrowUpRight className="w-5 h-5 text-emerald-500" />
            ) : (
              <ArrowDownRight className="w-5 h-5 text-rose-500" />
            )}
          </div>
          <div
            className={`text-3xl font-bold ${
              savingsIsPositive ? "text-emerald-600" : "text-rose-600"
            }`}
          >
            {savingsIsPositive ? "+" : ""}
            {formatCurrency(analytics.savingsVsLinkedIn)}
          </div>
          <div className="text-xs text-[#94A3B8] mt-2">
            (Qualified Clicks × 8€) - Coût Naano
          </div>
        </div>
      </div>
    </div>
  );
}
