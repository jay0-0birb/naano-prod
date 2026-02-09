"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Users, Mail, CheckCircle2, Loader2, Crown } from "lucide-react";
import { inviteCreator } from "@/app/(dashboard)/dashboard/marketplace/actions";

interface CreatorCardProps {
  creator: {
    id: string;
    bio: string | null;
    linkedin_url: string | null;
    followers_count: number;
    theme: string | null;
    country?: string | null;
    is_pro?: boolean; // Pro status
    profiles: {
      id: string;
      full_name: string | null;
      avatar_url: string | null;
      email: string;
    };
  };
  hasInvited: boolean;
  saasCompanyId: string | null;
  /** When false, invite button is disabled (brand must add credits first). */
  canInviteCreators?: boolean;
}

export default function CreatorCard({
  creator,
  hasInvited,
  saasCompanyId,
  canInviteCreators = true,
}: CreatorCardProps) {
  const t = useTranslations("dashboard");
  const [isInviting, setIsInviting] = useState(false);
  const [invited, setInvited] = useState(hasInvited);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteMessage, setInviteMessage] = useState("");

  const handleInvite = async () => {
    if (!saasCompanyId || !inviteMessage.trim()) return;

    setIsInviting(true);
    const result = await inviteCreator(
      saasCompanyId,
      creator.id,
      inviteMessage,
    );

    if (result.success) {
      setInvited(true);
      setShowInviteModal(false);
      setInviteMessage("");
    } else {
      alert(result.error || "Error sending invitation");
    }
    setIsInviting(false);
  };

  return (
    <>
      <div className="flex flex-col bg-white border border-gray-200 rounded-2xl p-6 hover:border-gray-300 hover:shadow-md transition-all shadow-sm min-h-[280px] max-h-[280px]">
        <div className="flex-1">
          {/* Avatar & Name */}
          <div className="flex items-start gap-4 mb-4">
            {creator.profiles.avatar_url ? (
              <img
                src={creator.profiles.avatar_url}
                alt={creator.profiles.full_name || "Creator"}
                className="w-14 h-14 rounded-full object-contain shrink-0"
              />
            ) : (
              <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-semibold text-lg shrink-0">
                {creator.profiles.full_name?.charAt(0).toUpperCase() || "C"}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-[#111827] text-lg truncate">
                  {creator.profiles.full_name || "Creator"}
                </h3>
                {creator.is_pro && (
                  <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-xs font-semibold rounded-full flex items-center gap-1 border border-blue-200">
                    <Crown className="w-3 h-3" />
                    Pro
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-[#64748B] text-sm mb-1">
                <Users className="w-4 h-4" />
                <span>
                  {creator.followers_count.toLocaleString()} {t("followers")}
                </span>
              </div>
              {(creator.theme || creator.country) && (
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  {creator.theme && (
                    <span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-md border border-blue-100 capitalize">
                      {creator.theme}
                    </span>
                  )}
                  {creator.country && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-md border border-gray-200">
                      {creator.country}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Bio */}
          {creator.bio && (
            <div className="mb-4 h-16 overflow-y-auto overflow-x-hidden pr-1">
              <p className="text-[#64748B] text-sm">
                {creator.bio}
              </p>
            </div>
          )}

          {/* Theme is rendered under the name */}
        </div>

        {/* Actions */}
        <div className="mt-2 flex gap-2">
          {creator.linkedin_url && (
            <a
              href={creator.linkedin_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-[#64748B] hover:text-[#111827] hover:border-gray-300 transition-all text-sm"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
              </svg>
              <span>{t("profile")}</span>
            </a>
          )}
          {invited ? (
            <button
              disabled
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm cursor-not-allowed"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{t("invited")}</span>
            </button>
          ) : (
            <button
              onClick={() => canInviteCreators && setShowInviteModal(true)}
              disabled={!saasCompanyId || !canInviteCreators}
              title={!canInviteCreators ? t("addCreditsToInvite") : undefined}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-[#0F172A] hover:bg-[#1E293B] rounded-xl text-white transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Mail className="w-4 h-4" />
              <span>{t("invite")}</span>
            </button>
          )}
        </div>
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 max-w-md w-full shadow-xl">
            <h3 className="text-xl font-semibold text-[#111827] mb-2">
              {t("inviteCreator", {
                name: creator.profiles.full_name || "Creator",
              })}
            </h3>
            <p className="text-[#64748B] text-sm mb-6">
              {t("inviteMessageDesc")}
            </p>

            <div className="mb-6">
              <label className="block text-sm text-[#475569] mb-2 font-medium">
                {t("invitationMessage")}
              </label>
              <textarea
                value={inviteMessage}
                onChange={(e) => setInviteMessage(e.target.value)}
                placeholder={t("invitationPlaceholder")}
                rows={5}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-[#111827] placeholder:text-gray-400 focus:outline-none focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6]/10 transition-all resize-none"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowInviteModal(false);
                  setInviteMessage("");
                }}
                disabled={isInviting}
                className="flex-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-[#64748B] hover:text-[#111827] hover:border-gray-300 transition-all disabled:opacity-50"
              >
                {t("cancel")}
              </button>
              <button
                onClick={handleInvite}
                disabled={isInviting || !inviteMessage.trim()}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-[#0F172A] hover:bg-[#1E293B] rounded-xl text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isInviting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{t("sending")}</span>
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4" />
                    <span>{t("sendInvitation")}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
