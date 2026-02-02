"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
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
  const t = useTranslations("analytics");
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
        <div className="text-gray-500">{t("loading")}</div>
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
            <div className="text-sm text-[#64748B]">{t("totalImpressions")}</div>
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
            <div className="text-sm text-[#64748B]">{t("totalClicks")}</div>
            <MousePointerClick className="w-5 h-5 text-emerald-500" />
          </div>
          <div className="text-3xl font-bold text-[#111827]">
            {analytics.totalClicks.toLocaleString()}
          </div>
          <div className="text-xs text-[#94A3B8] mt-2">
            {t("totalClicksDesc")}
          </div>
        </div>

        {/* Qualified Clicks */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm text-[#64748B]">
              {t("qualifiedClicksLabel")}
            </div>
            <CheckCircle className="w-5 h-5 text-amber-500" />
          </div>
          <div className="text-3xl font-bold text-[#111827]">
            {analytics.qualifiedClicks.toLocaleString()}
          </div>
          <div className="text-xs text-[#94A3B8] mt-2">
            {t("qualifiedClicksDesc")}
          </div>
        </div>

        {/* Conversions/Leads */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm text-[#64748B]">{t("conversionsLeads")}</div>
            <Users className="w-5 h-5 text-purple-500" />
          </div>
          <div className="text-3xl font-bold text-[#111827]">
            {analytics.leadsCount.toLocaleString()}
          </div>
          <div className="text-xs text-[#94A3B8] mt-2">
            {t("conversionsLeadsDesc")}
          </div>
        </div>

        {/* Total Naano Cost */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm text-[#64748B]">{t("totalCost")}</div>
            <DollarSign className="w-5 h-5 text-rose-500" />
          </div>
          <div className="text-3xl font-bold text-[#111827]">
            {formatCurrency(analytics.totalLeadCost)}
          </div>
          <div className="text-xs text-[#94A3B8] mt-2">
            {t("totalCostDesc")}
          </div>
        </div>

        {/* Savings vs LinkedIn Ads */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm text-[#64748B]">
              {t("savingsVsLinkedInLabel")}
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
            {t("savingsDesc")}
          </div>
        </div>
      </div>
    </div>
  );
}
