"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { getGlobalAnalytics } from "./actions";
import { MousePointerClick, CheckCircle } from "lucide-react";

interface Analytics {
  totalClicks: number;
  qualifiedClicks: number;
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

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
        {/* Total Clicks (Bulk) */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm text-[#64748B]">{t("totalClicks")}</div>
            <MousePointerClick className="w-5 h-5 text-emerald-500" />
          </div>
          <div className="text-3xl font-bold text-[#111827]">
            {analytics.totalClicks.toLocaleString()}
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
        </div>
      </div>
    </div>
  );
}
