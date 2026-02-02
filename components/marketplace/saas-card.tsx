"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Building2, ExternalLink, Send } from "lucide-react";
import type { SaasCompanyWithProfile } from "@/types/database";
import ApplyModal from "./apply-modal";
import BudgetWidget from "@/components/collaborations/budget-widget";

interface SaasCardProps {
  company: SaasCompanyWithProfile;
  hasApplied: boolean;
  creatorProfileId: string | null;
  activeCreators?: number;
  maxCreators?: number;
  isFull?: boolean;
}

export default function SaasCard({
  company,
  hasApplied,
  creatorProfileId,
  activeCreators,
  maxCreators,
  isFull,
}: SaasCardProps) {
  const t = useTranslations("dashboard");
  const [showModal, setShowModal] = useState(false);
  const [applied, setApplied] = useState(hasApplied);

  const creatorsLabel =
    typeof activeCreators === "number" && typeof maxCreators === "number"
      ? `${activeCreators}/${maxCreators === Infinity ? "∞" : maxCreators}`
      : null;

  return (
    <>
      <div
        className={`bg-white border border-gray-200 rounded-2xl p-6 transition-all shadow-sm ${
          isFull
            ? "opacity-60 border-dashed cursor-not-allowed"
            : "hover:border-gray-300 hover:shadow-md"
        }`}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-4">
            {company.logo_url ? (
              <img
                src={company.logo_url}
                alt={company.company_name}
                className="w-14 h-14 rounded-full object-contain"
              />
            ) : (
              <div className="w-14 h-14 rounded-full bg-blue-50 border border-gray-200 flex items-center justify-center">
                <Building2 className="w-7 h-7 text-[#3B82F6]" />
              </div>
            )}
            <div>
              <h3 className="font-semibold text-[#111827] text-lg">
                {company.company_name}
              </h3>
              <span className="text-xs text-[#64748B] bg-gray-50 px-2 py-0.5 rounded-full">
                {company.industry || t("notSpecified")}
              </span>
            </div>
          </div>
          {company.website && (
            <a
              href={company.website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#94A3B8] hover:text-[#111827] transition-colors"
            >
              <ExternalLink className="w-5 h-5" />
            </a>
          )}
        </div>

        {/* Description */}
        <p className="text-[#64748B] text-sm mb-4 line-clamp-3">
          {company.description || t("noDescription")}
        </p>

        {/* Creator capacity */}
        {creatorsLabel && (
          <div className="flex items-center justify-between text-xs text-[#64748B] mb-3">
            <span>{t("activeCreators")}</span>
            <span className="font-medium text-[#111827]">{creatorsLabel}</span>
          </div>
        )}

        {/* Budget Widget (for creators) */}
        {(company.wallet_credits !== undefined ||
          company.credit_renewal_date) && (
          <div className="mb-4">
            <BudgetWidget
              walletCredits={company.wallet_credits || 0}
              renewalDate={company.credit_renewal_date || null}
              saasCompanyName={company.company_name}
            />
          </div>
        )}

        {/* Conditions Preview */}
        {company.conditions && (
          <div className="text-xs text-[#64748B] mb-4 p-3 bg-gray-50 rounded-lg border border-gray-100">
            <span className="font-medium text-[#475569]">{t("terms")}:</span>{" "}
            {company.conditions.slice(0, 100)}
            {company.conditions.length > 100 && "..."}
          </div>
        )}

        {/* Action Button */}
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
    </>
  );
}
