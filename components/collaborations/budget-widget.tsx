"use client";

import { AlertCircle, CheckCircle2, Clock, Info } from "lucide-react";

interface BudgetWidgetProps {
  walletCredits: number;
  renewalDate: string | null;
  saasCompanyName: string;
}

export default function BudgetWidget({
  walletCredits,
  renewalDate,
  saasCompanyName,
}: BudgetWidgetProps) {
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
        icon: <CheckCircle2 className="w-4 h-4 text-green-600" />,
        label: "Safe",
      };
    }
    if (credits > 50) {
      return {
        status: "risky",
        color: "text-orange-600 bg-orange-50 border-orange-200",
        icon: <AlertCircle className="w-4 h-4 text-orange-600" />,
        label: "Risky",
      };
    }
    if (credits > 0) {
      return {
        status: "low",
        color: "text-red-600 bg-red-50 border-red-200",
        icon: <AlertCircle className="w-4 h-4 text-red-600" />,
        label: "Low",
      };
    }
    return {
      status: "empty",
      color: "text-red-700 bg-red-100 border-red-300",
      icon: <AlertCircle className="w-4 h-4 text-red-700" />,
      label: "Empty",
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
    <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold text-slate-900">
          Budget {saasCompanyName}
        </h4>
        <div className={`px-2 py-1 rounded-full border ${health.color} flex items-center gap-1.5`}>
          {health.icon}
          <span className="text-xs font-medium">{health.label}</span>
        </div>
      </div>

      <div className="mb-3">
        <div className="text-2xl font-bold text-slate-900">
          {walletCredits.toLocaleString()}
        </div>
        <div className="text-xs text-slate-600">crédits restants</div>
      </div>

      {renewalDate && daysUntilRenewal !== null && (
        <div className="flex items-center gap-2 text-xs text-slate-600 mb-3">
          <Clock className="w-3 h-3" />
          <span>Renouvellement dans {daysUntilRenewal} jour{daysUntilRenewal !== 1 ? "s" : ""}</span>
        </div>
      )}

      <div className="flex items-start gap-2 p-2 bg-blue-50 border border-blue-200 rounded-lg">
        <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
        <p className="text-xs text-blue-800">
          Budget partagé. Premier arrivé, premier servi.
        </p>
      </div>

      {walletCredits === 0 && (
        <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-xs text-red-700 font-medium">
            ⚠️ Budget épuisé. Les posts ne peuvent pas être soumis jusqu'à ce que le budget soit renouvelé.
          </p>
        </div>
      )}
    </div>
  );
}
