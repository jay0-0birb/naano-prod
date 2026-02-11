"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Crown, Check, Sparkles, Link as LinkIcon } from "lucide-react";

const NAANO_LINK = "https://naano.xyz/";

interface ProUpgradeBannerProps {
  creatorId: string;
  isPro: boolean;
  proStatusSource: string | null;
  proExpirationDate: string | null;
  hasProSubscription: boolean;
}

export default function ProUpgradeBanner({
  isPro,
  proStatusSource,
  proExpirationDate,
  creatorId,
}: ProUpgradeBannerProps) {
  const t = useTranslations("proUpgrade");
  const [copied, setCopied] = useState(false);

  const getExpirationText = (dateString: string | null): string => {
    if (!dateString) return "";
    const expiration = new Date(dateString);
    const now = new Date();

    if (expiration < now) {
      return t("expired");
    }

    const diffTime = expiration.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays > 30) {
      const months = Math.floor(diffDays / 30);
      return months === 1
        ? t("expiresInMonths", { count: 1 })
        : t("expiresInMonthsPlural", { count: months });
    }

    return diffDays === 1
      ? t("expiresInDays", { count: 1 })
      : t("expiresInDaysPlural", { count: diffDays });
  };

  // If Pro (legacy paid - no longer offered)
  if (isPro && proStatusSource === "PAYMENT") {
    return (
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm opacity-80">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-slate-100 rounded-lg">
            <Crown className="w-6 h-6 text-slate-500" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900">
              {t("memberPro")}
            </h3>
            <p className="text-sm text-slate-600">
              {proExpirationDate && (
                <span className="text-slate-500">
                  {getExpirationText(proExpirationDate)}
                </span>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-600">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>{t("earnPerClickLegacy")}</span>
        </div>
      </div>
    );
  }

  // If Pro (promo/free)
  if (isPro && proStatusSource === "PROMO") {
    return (
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm opacity-80">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-slate-100 rounded-lg">
            <Sparkles className="w-6 h-6 text-slate-500" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900">
              {t("memberProFree")}
            </h3>
            {proExpirationDate && (
              <p className="text-sm text-slate-600">
                <span className="text-slate-500">
                  {getExpirationText(proExpirationDate)}
                </span>
              </p>
            )}
            {!proExpirationDate && (
              <p className="text-sm text-slate-600">
                {t("earnPerClickProShort")}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-600">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>{t("earnPerClickProShort")}</span>
        </div>
      </div>
    );
  }

  // If Standard - show "Become Naano promoter" CTA
  const naanoLink = `${NAANO_LINK}?ref=${creatorId}`;

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-6 shadow-sm">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 rounded-lg">
            <Crown className="w-6 h-6 text-[#1D4ED8]" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900">
              {t("unlockPro")}
            </h3>
            <p className="text-sm text-slate-600">{t("unlockProDesc")}</p>
          </div>
        </div>
      </div>

      <div className="mb-4 space-y-2">
        <div className="flex items-center gap-2 text-sm text-slate-700">
          <Check className="w-4 h-4 text-green-600" />
          <span>{t("proEarnBullet")}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-700">
          <Check className="w-4 h-4 text-green-600" />
          <span>{t("badgePro")}</span>
        </div>
      </div>

      {/* Instructions & promotion link */}
      <div className="mb-4 p-3 sm:p-4 bg-slate-50 rounded-xl border border-slate-200">
        <p className="text-sm font-medium text-slate-800 mb-2">{t("howTo")}</p>
        <div className="space-y-3 text-xs text-slate-600">
          <div>
            <p className="mb-1">{t("step1")}</p>
            <div className="mt-1 flex flex-col sm:flex-row sm:items-center gap-2">
              <LinkIcon className="w-4 h-4 text-slate-500 shrink-0" />
              <code className="text-xs bg-white px-2 py-1 rounded border border-slate-200 break-all min-w-0">
                {naanoLink}
              </code>
              <button
                type="button"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(naanoLink);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 1200);
                  } catch {
                    // Best-effort only; ignore copy errors
                  }
                }}
                className={`text-xs px-3 py-1 rounded-full border transition-all duration-200 shrink-0 ${
                  copied
                    ? "bg-emerald-500 border-emerald-500 text-white scale-105"
                    : "bg-white border-blue-100 text-blue-600 hover:bg-blue-50 hover:border-blue-200 hover:scale-[1.02]"
                }`}
              >
                {copied ? t("copied") : t("copy")}
              </button>
            </div>
          </div>
          <p>{t("step2")}</p>
        </div>
      </div>
    </div>
  );
}
