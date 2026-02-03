"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import {
  BarChart3,
  MousePointerClick,
  Target,
  Users,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { getCollaborationAnalytics } from "./actions-v2";

interface AnalyticsTabProps {
  collaborationId: string;
}

interface AnalyticsData {
  totalImpressions: number;
  totalClicks: number;
  qualifiedClicks: number;
  leadsCount: number;
  totalLeadCost: number;
  savingsVsLinkedIn: number;
}

export default function AnalyticsTab({ collaborationId }: AnalyticsTabProps) {
  const t = useTranslations("collaborationAnalytics");
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        setLoading(true);
        const result = await getCollaborationAnalytics(collaborationId);

        if (result.error) {
          setError(result.error);
        } else if (result.success && result.analytics) {
          setAnalytics(result.analytics);
        }
      } catch (err) {
        setError(t("loadingError"));
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchAnalytics();
  }, [collaborationId]);

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-100 rounded w-48"></div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-24 bg-gray-100 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
        <p className="text-sm text-red-700">⚠️ {error}</p>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="bg-white border border-gray-200 rounded-2xl p-6 text-center">
        <p className="text-[#64748B] text-sm">{t("noData")}</p>
      </div>
    );
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("fr-FR").format(num);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const kpiCards = [
    {
      label: t("totalImpressions"),
      value: formatNumber(analytics.totalImpressions),
      icon: BarChart3,
      color: "text-[#1D4ED8]",
      bgColor: "bg-blue-50",
    },
    {
      label: t("totalClicksRaw"),
      value: formatNumber(analytics.totalClicks),
      icon: MousePointerClick,
      color: "text-[#1D4ED8]",
      bgColor: "bg-blue-50",
    },
    {
      label: t("qualifiedClicksBillable"),
      value: formatNumber(analytics.qualifiedClicks),
      icon: Target,
      color: "text-[#1D4ED8]",
      bgColor: "bg-blue-50",
      description: t("qualifiedClicksDesc"),
    },
    {
      label: t("conversionsLeads"),
      value: formatNumber(analytics.leadsCount),
      icon: Users,
      color: "text-[#1D4ED8]",
      bgColor: "bg-blue-50",
    },
    {
      label: t("totalNaanoCost"),
      value: formatCurrency(analytics.totalLeadCost),
      icon: TrendingDown,
      color: "text-[#1D4ED8]",
      bgColor: "bg-blue-50",
    },
    {
      label: t("savingsVsLinkedIn"),
      value: formatCurrency(analytics.savingsVsLinkedIn),
      icon: TrendingUp,
      color: "text-[#1D4ED8]",
      bgColor: "bg-blue-50",
      description: t("savingsFormula"),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold text-[#111827] mb-2">
          {t("performanceTitle")}
        </h2>
        <p className="text-sm text-[#64748B]">{t("performanceDesc")}</p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {kpiCards.map((kpi, index) => {
          const Icon = kpi.icon;
          return (
            <div
              key={index}
              className={`${kpi.bgColor} rounded-xl p-4 shadow-sm`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className={`${kpi.color} p-2 rounded-lg bg-white`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-2">
                <p className="text-2xl font-semibold text-[#111827] mb-1">
                  {kpi.value}
                </p>
                <p className="text-xs text-[#6B7280] mb-1">{kpi.label}</p>
                {kpi.description && (
                  <p className="text-xs text-[#9CA3AF] mt-1">
                    {kpi.description}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Info Note */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
        <p className="text-sm text-[#1D4ED8]">
          <strong>{t("note")}</strong> {t("noteQualifiedClicks")}
        </p>
      </div>
    </div>
  );
}
