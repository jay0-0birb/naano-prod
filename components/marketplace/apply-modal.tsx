"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { X, Loader2, Send, Building2 } from "lucide-react";
import { applyToSaas } from "@/app/(dashboard)/dashboard/marketplace/actions";
import type { SaasCompanyWithProfile } from "@/types/database";

interface ApplyModalProps {
  company: SaasCompanyWithProfile;
  creatorProfileId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ApplyModal({
  company,
  creatorProfileId,
  onClose,
  onSuccess,
}: ApplyModalProps) {
  const t = useTranslations("dashboard");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const result = await applyToSaas({
      creatorId: creatorProfileId,
      saasId: company.id,
      message,
    });

    if (result.error) {
      setError(result.error);
      setIsLoading(false);
    } else {
      onSuccess();
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-white border border-gray-200 rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            {company.logo_url ? (
              <img
                src={company.logo_url}
                alt={company.company_name}
                className="w-10 h-10 rounded-full object-contain"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-blue-50 border border-gray-200 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-[#3B82F6]" />
              </div>
            )}
            <div>
              <h3 className="font-medium text-[#111827]">
                {t("applyTo", { company: company.company_name })}
              </h3>
              <p className="text-xs text-[#64748B]">{company.industry}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-900 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t("applicationMessage")}
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
              placeholder={t("applicationPlaceholder")}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 placeholder:text-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all resize-none"
            />
            <p className="text-xs text-gray-500 mt-1.5">
              {t("applicationTip")}
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-medium transition-colors"
            >
              {t("cancel")}
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {t("sending")}
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  {t("submitApplication")}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
