"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Crown, Check, Loader2, Sparkles, Link as LinkIcon, Send } from "lucide-react";
import { submitProUnlockPost } from "@/app/(dashboard)/dashboard/finances/actions";

const NAANO_LINK = "https://naano.vercel.app/";

interface ProUpgradeBannerProps {
  creatorId: string;
  isPro: boolean;
  proStatusSource: string | null;
  proExpirationDate: string | null;
  hasProSubscription: boolean;
}

export default function ProUpgradeBanner({
  creatorId,
  isPro,
  proStatusSource,
  proExpirationDate,
  hasProSubscription,
}: ProUpgradeBannerProps) {
  const t = useTranslations("proUpgrade");
  const tFinances = useTranslations("finances");
  const tCredits = useTranslations("credits");
  const [loading, setLoading] = useState(false);
  const [postUrl, setPostUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleUnlockPro = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postUrl.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const result = await submitProUnlockPost(postUrl.trim());
      if (result.error) {
        setError(result.error);
      } else {
        setSuccess(true);
        setPostUrl("");
        window.location.reload();
      }
    } catch (err) {
      setError(tFinances("error"));
    } finally {
      setLoading(false);
    }
  };

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
      return months === 1 ? t("expiresInMonths", { count: 1 }) : t("expiresInMonthsPlural", { count: months });
    }
    return diffDays === 1 ? t("expiresInDays", { count: 1 }) : t("expiresInDaysPlural", { count: diffDays });
  };

  // If Pro (legacy paid - no longer offered)
  if (isPro && proStatusSource === "PAYMENT") {
    return (
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-blue-50 rounded-lg">
            <Crown className="w-6 h-6 text-[#1D4ED8]" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900">
              {t("memberPro")}
            </h3>
            <p className="text-sm text-slate-600">
              {proExpirationDate && getExpirationText(proExpirationDate)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-700">
          <Check className="w-4 h-4 text-green-600" />
          <span>{t("earnPerClick", { amount: "1,10€" })}</span>
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
              {t("memberProFree")}
            </h3>
            <p className="text-sm text-slate-600">
              {proExpirationDate && getExpirationText(proExpirationDate)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-700">
          <Check className="w-4 h-4 text-green-600" />
          <span>{t("earnPerClickPro", { amount: "1,10€" })}</span>
        </div>
      </div>
    );
  }

  // If Standard - show "Unlock Pro by posting" CTA
  const naanoLink = `${NAANO_LINK}?ref=${creatorId}`;

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 rounded-lg">
            <Crown className="w-6 h-6 text-[#1D4ED8]" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900">
              {t("unlockPro")}
            </h3>
            <p className="text-sm text-slate-600">
              {t("unlockProDesc")}
            </p>
          </div>
        </div>
      </div>

      <div className="mb-4 space-y-2">
        <div className="flex items-center gap-2 text-sm text-slate-700">
          <Check className="w-4 h-4 text-green-600" />
          <span>{t("earnPerClick", { amount: "1,10€" })}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-700">
          <Check className="w-4 h-4 text-green-600" />
          <span>{t("badgePro")}</span>
        </div>
      </div>

      {/* Instructions */}
      <div className="mb-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
        <p className="text-sm font-medium text-slate-800 mb-2">{t("howTo")}</p>
        <ol className="text-xs text-slate-600 space-y-1 list-decimal list-inside">
          <li>{t("step1")}</li>
        </ol>
        <div className="mt-2 flex items-center gap-2">
          <LinkIcon className="w-4 h-4 text-slate-500 shrink-0" />
          <code className="text-xs bg-white px-2 py-1 rounded border border-slate-200 break-all">
            {naanoLink}
          </code>
          <button
            type="button"
            onClick={() => navigator.clipboard.writeText(naanoLink)}
            className="text-xs text-blue-600 hover:text-blue-700 shrink-0"
          >
            {t("copy")}
          </button>
        </div>
        <p className="text-xs text-slate-600 mt-2">
          2. {t("step2")}
        </p>
      </div>

      {/* Submit form */}
      <form onSubmit={handleUnlockPro} className="space-y-2">
        <input
          type="url"
          value={postUrl}
          onChange={(e) => setPostUrl(e.target.value)}
          placeholder={tCredits("placeholder")}
          className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        {error && (
          <p className="text-xs text-red-600">{error}</p>
        )}
        {success && (
          <p className="text-xs text-green-600">{t("proUnlocked")}</p>
        )}
        <button
          type="submit"
          disabled={loading || !postUrl.trim()}
          className="w-full bg-[#0F172A] hover:bg-[#020617] disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>{tCredits("loading")}</span>
            </>
          ) : (
            <>
              <Send className="w-5 h-5" />
              <span>{t("unlockProBtn")}</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
