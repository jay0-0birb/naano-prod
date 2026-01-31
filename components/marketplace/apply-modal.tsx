"use client";

import { useState } from "react";
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
      <div className="relative w-full max-w-lg bg-[#0A0C10] border border-white/10 rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            {company.logo_url ? (
              <img
                src={company.logo_url}
                alt={company.company_name}
                className="w-10 h-10 rounded-full object-contain"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-blue-500/20 border border-white/10 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-blue-400" />
              </div>
            )}
            <div>
              <h3 className="font-medium text-white">
                Postuler chez {company.company_name}
              </h3>
              <p className="text-xs text-slate-500">{company.industry}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Message de candidature
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
              placeholder="Présentez-vous et expliquez pourquoi vous souhaitez collaborer avec cette entreprise..."
              className="w-full bg-[#020408] border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all resize-none"
            />
            <p className="text-xs text-slate-500 mt-1.5">
              Un bon message augmente vos chances d'être accepté
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl text-sm font-medium transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Envoi...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Envoyer ma candidature
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
