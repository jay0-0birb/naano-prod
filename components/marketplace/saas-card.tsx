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
  isFull?: boolean;
}

export default function SaasCard({
  company,
  hasApplied,
  creatorProfileId,
  isFull,
}: SaasCardProps) {
  const t = useTranslations("dashboard");
  const [showModal, setShowModal] = useState(false);
  const [applied, setApplied] = useState(hasApplied);

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

        {/* Middle section: description + budget; padding-bottom = gap above Terms */}
        <div
          className="flex-1 min-h-0 flex flex-col shrink-0"
          style={{ paddingBottom: 48 }}
        >
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
          <div
            className="shrink-0 flex flex-col"
            style={{ minHeight: "220px" }}
          >
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
        </div>

        {/* Bottom section: Terms + Apply button */}
        <div className="shrink-0 space-y-4">
          {company.conditions && (
            <div
              style={{ height: 56, maxHeight: 56 }}
              className="text-xs text-[#64748B] p-3 bg-gray-50 rounded-lg border border-gray-100 overflow-y-auto overflow-x-hidden break-words overscroll-contain"
            >
              <span className="font-medium text-[#475569]">{t("terms")}:</span>{" "}
              {company.conditions}
            </div>
          )}
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
    </>
  );
}
