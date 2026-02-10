"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Building2, ExternalLink, Send, X } from "lucide-react";
import type { SaasCompanyWithProfile } from "@/types/database";
import ApplyModal from "./apply-modal";
import BudgetWidget from "@/components/collaborations/budget-widget";

interface SaasCardProps {
  company: SaasCompanyWithProfile;
  hasApplied: boolean;
  creatorProfileId: string | null;
  isFull?: boolean;
}

type MediaItem = {
  label: string;
  url: string;
};

function parseMediaPack(
  raw: string | null,
  fallbackLabel: string,
): MediaItem[] {
  if (!raw) return [];

  const trimmed = raw.trim();
  if (!trimmed) return [];

  // Try JSON array format first
  try {
    const parsed = JSON.parse(trimmed);
    if (Array.isArray(parsed)) {
      return parsed
        .map((item) => {
          const url = typeof item?.url === "string" ? item.url.trim() : "";
          if (!url) return null;
          const labelRaw =
            typeof item?.label === "string" ? item.label.trim() : "";
          return {
            label: labelRaw || fallbackLabel,
            url,
          };
        })
        .filter((i): i is MediaItem => i !== null);
    }
  } catch {
    // ignore, will fallback below
  }

  // Fallback: treat as single URL
  return [
    {
      label: fallbackLabel,
      url: trimmed,
    },
  ];
}

export default function SaasCard({
  company,
  hasApplied,
  creatorProfileId,
  isFull,
}: SaasCardProps) {
  const t = useTranslations("dashboard");
  const onboardingT = useTranslations("onboarding");
  const [showModal, setShowModal] = useState(false);
  const [applied, setApplied] = useState(hasApplied);
  const mediaItems = parseMediaPack(
    company.media_pack_url,
    onboardingT("mediaPack"),
  );
  const [showMediaModal, setShowMediaModal] = useState(false);

  return (
    <>
      <div
        style={{ width: 360, height: 600, minHeight: 600, maxHeight: 600 }}
        className={`flex flex-col shrink-0 grow-0 bg-white border border-gray-200 rounded-2xl p-6 transition-all shadow-sm overflow-hidden ${
          isFull
            ? "opacity-60 border-dashed cursor-not-allowed"
            : "hover:border-gray-300 hover:shadow-md"
        }`}
      >
        {/* Top section: logo, company name, subtitle */}
        <div className="shrink-0">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-4">
              {company.logo_url ? (
                <div className="w-14 h-14 shrink-0 rounded-full bg-gray-50 border border-gray-200 overflow-hidden flex items-center justify-center">
                  <img
                    src={company.logo_url}
                    alt={company.company_name}
                    className="w-full h-full object-contain"
                  />
                </div>
              ) : (
                <div className="w-14 h-14 shrink-0 rounded-full bg-blue-50 border border-gray-200 flex items-center justify-center">
                  <Building2 className="w-7 h-7 text-[#3B82F6]" />
                </div>
              )}
              <div className="min-w-0">
                <h3 className="font-semibold text-[#111827] text-lg truncate">
                  {company.company_name}
                </h3>
                <span className="text-xs text-[#64748B] bg-gray-50 px-2 py-0.5 rounded-full inline-block mt-1">
                  {company.industry || t("notSpecified")}
                </span>
              </div>
            </div>
            {company.website && (
              <a
                href={company.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#94A3B8] hover:text-[#111827] transition-colors shrink-0"
              >
                <ExternalLink className="w-5 h-5" />
              </a>
            )}
          </div>
        </div>

        {/* Middle section: description + budget */}
        <div className="flex-1 min-h-0 flex flex-col shrink-0">
          {/* Description: max 56px — scrolls when content exceeds it */}
          <div
            style={{ height: 40, maxHeight: 40 }}
            className="shrink-0 overflow-y-auto overflow-x-hidden rounded overscroll-contain"
          >
            <p className="text-[#64748B] text-sm break-words pr-1">
              {company.description || t("noDescription")}
            </p>
          </div>
          <div className="h-5 shrink-0" aria-hidden />
          {/* Budget area */}
          <div className="shrink-0 flex flex-col" style={{ minHeight: "220px" }}>
            {company.wallet_credits !== undefined ||
            company.credit_renewal_date ? (
              <BudgetWidget
                walletCredits={company.wallet_credits ?? 0}
                renewalDate={company.credit_renewal_date ?? null}
                saasCompanyName={company.company_name}
              />
            ) : (
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 flex-1" />
            )}
          </div>

          {/* Media pack button (space is reserved even when absent) */}
          <div className="mt-3 shrink-0 h-9 flex items-center">
            {mediaItems.length > 0 && (
              <button
                type="button"
                onClick={() => setShowMediaModal(true)}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-[#1D4ED8] hover:text-[#1E40AF]"
              >
                {t("seeMedia")}
                <ExternalLink className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Bottom section: Apply button */}
        <div className="shrink-0 space-y-4">
          {creatorProfileId ? (
            applied ? (
              <button
                disabled
                className="w-full py-2.5 bg-gray-50 text-[#94A3B8] rounded-xl text-sm font-medium cursor-not-allowed border border-gray-200"
              >
                {t("applicationSent")}
              </button>
            ) : isFull ? (
              <button
                disabled
                className="w-full py-2.5 bg-gray-50 text-[#9CA3AF] rounded-xl text-xs font-medium cursor-not-allowed border border-gray-200"
              >
                {t("notTakingCreators")}
              </button>
            ) : (
              <button
                onClick={() => setShowModal(true)}
                className="w-full py-2.5 bg-[#0F172A] hover:bg-[#1E293B] text-white rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                {t("apply")}
              </button>
            )
          ) : (
            <div className="text-xs text-center text-[#64748B] py-2">
              {t("completeProfileToApply")}
            </div>
          )}
        </div>
      </div>

      {/* Apply Modal */}
      {showModal && (
        <ApplyModal
          company={company}
          creatorProfileId={creatorProfileId!}
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            setApplied(true);
            setShowModal(false);
          }}
        />
      )}

      {/* Media modal */}
      {showMediaModal && mediaItems.length > 0 && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-white border border-gray-200 rounded-2xl shadow-xl max-w-md w-full p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-semibold text-[#111827]">
                  {onboardingT("mediaPack")}
                </h3>
                <p className="text-xs text-[#64748B]">
                  {company.company_name}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowMediaModal(false)}
                className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4 text-[#64748B]" />
              </button>
            </div>

            <div className="space-y-2">
              {mediaItems.map((item) => (
                <a
                  key={`${item.label}-${item.url}`}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between gap-3 px-3 py-2 rounded-xl border border-gray-200 hover:border-[#1D4ED8] hover:bg-blue-50/30 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-[#111827] truncate">
                      {item.label}
                    </p>
                    <p className="text-[11px] text-[#6B7280] break-all">
                      {item.url}
                    </p>
                  </div>
                  <ExternalLink className="w-3 h-3 text-[#64748B] shrink-0" />
                </a>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
