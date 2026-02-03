"use client";

import { useTranslations } from "next-intl";
import { AlertCircle, CheckCircle2, Clock } from "lucide-react";

interface CreditBalanceWidgetProps {
  walletCredits: number;
  monthlySubscription: number | null;
  renewalDate: string | null;
}

export default function CreditBalanceWidget({
  walletCredits,
  monthlySubscription,
  renewalDate,
}: CreditBalanceWidgetProps) {
  const t = useTranslations("credits");
  const getHealthStatus = (credits: number): {
    status: "safe" | "risky" | "low" | "empty";
    color: string;
    icon: React.ReactNode;
    label: string;
  } => {
    if (credits > 200) {
      return {
        status: "safe",
        color: "text-green-600 bg-green-50 border-green-200",
        icon: <CheckCircle2 className="w-5 h-5 text-green-600" />,
        label: t("safe"),
      };
    }
    if (credits > 50) {
      return {
        status: "risky",
        color: "text-slate-600 bg-slate-50 border-slate-200",
        icon: <AlertCircle className="w-5 h-5 text-slate-600" />,
        label: t("risky"),
      };
    }
    if (credits > 0) {
      return {
        status: "low",
        color: "text-red-600 bg-red-50 border-red-200",
        icon: <AlertCircle className="w-5 h-5 text-red-600" />,
        label: t("low"),
      };
    }
    return {
      status: "empty",
      color: "text-slate-700 bg-slate-100 border-slate-300",
      icon: <AlertCircle className="w-5 h-5 text-slate-700" />,
      label: t("empty"),
    };
  };

  const health = getHealthStatus(walletCredits);

  const getDaysUntilRenewal = (dateString: string | null): number | null => {
    if (!dateString) return null;
    const renewal = new Date(dateString);
    const now = new Date();
    const diffTime = renewal.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const daysUntilRenewal = renewalDate ? getDaysUntilRenewal(renewalDate) : null;

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-900">
          {t("balance")}
        </h3>
        <div className={`px-3 py-1 rounded-full border ${health.color} flex items-center gap-2`}>
          {health.icon}
          <span className="text-sm font-medium">{health.label}</span>
        </div>
      </div>

      <div className="mb-4">
        <div className="text-4xl font-bold text-slate-900 mb-1">
          {walletCredits.toLocaleString()}
        </div>
        <div className="text-sm text-slate-600">{t("creditsAvailable")}</div>
      </div>

      {monthlySubscription && (
        <div className="mb-4 pb-4 border-b border-slate-200">
          <div className="text-sm text-slate-600 mb-1">{t("monthlySubscription")}</div>
          <div className="text-lg font-semibold text-slate-900">
            {monthlySubscription.toLocaleString()} {t("creditsPerMonth")}
          </div>
        </div>
      )}

      {renewalDate && daysUntilRenewal !== null && (
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <Clock className="w-4 h-4" />
          <span>
            {daysUntilRenewal === 1
              ? t("renewalInDays", { count: 1 })
              : t("renewalInDaysPlural", { count: daysUntilRenewal })}
          </span>
        </div>
      )}

      {walletCredits === 0 && (
        <div className="mt-4 p-3 bg-slate-100 border border-slate-200 rounded-lg">
          <p className="text-sm text-slate-700">
            {t("noCredits")}
          </p>
        </div>
      )}
    </div>
  );
}
