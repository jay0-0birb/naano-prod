"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import {
  Link as LinkIcon,
  Copy,
  Check,
  ExternalLink,
  TrendingUp,
} from "lucide-react";

interface TrackingLinkCardProps {
  hash: string;
  clickCount: number;
  isCreator: boolean;
}

export default function TrackingLinkCard({
  hash,
  clickCount,
  isCreator,
}: TrackingLinkCardProps) {
  const t = useTranslations("collaboration");
  const [copied, setCopied] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Wait for client-side mount to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Build the full tracking URL (only show full URL after mount)
  const trackingUrl = mounted
    ? `${window.location.origin}/t/${hash}`
    : `/t/${hash}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(trackingUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-2xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
            <LinkIcon className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h3 className="text-lg font-medium text-white">
              {isCreator ? t("yourLink") : t("creatorLink")}
            </h3>
            <p className="text-xs text-slate-400">
              {isCreator ? t("useInPosts") : t("uniqueForTraffic")}
            </p>
          </div>
        </div>

        {/* Click Count */}
        <div className="text-right">
          <div className="flex items-center gap-2 text-2xl font-semibold text-blue-400">
            <TrendingUp className="w-5 h-5" />
            {clickCount}
          </div>
          <div className="text-xs text-slate-500">Clics totaux</div>
        </div>
      </div>

      {/* Tracking Link Display */}
      <div className="bg-[#0A0C10] border border-white/10 rounded-xl p-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="flex-1 font-mono text-sm text-slate-300 break-all">
            {trackingUrl}
          </div>
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" />
                {t("copied")}
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                {t("copy")}
              </>
            )}
          </button>
        </div>
      </div>

      {/* Instructions for Creator */}
      {isCreator && (
        <div className="space-y-2">
          <p className="text-sm text-slate-400 font-medium">
            💡 Comment l'utiliser :
          </p>
          <ul className="space-y-1.5 text-xs text-slate-500">
            <li className="flex items-start gap-2">
              <span className="text-blue-400 mt-0.5">•</span>
              <span>
                Ajoute-le en{" "}
                <strong className="text-slate-400">premier commentaire</strong>{" "}
                de tes posts LinkedIn
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400 mt-0.5">•</span>
              <span>
                Mets-le dans ta{" "}
                <strong className="text-slate-400">bio LinkedIn</strong>{" "}
                (section "À propos")
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400 mt-0.5">•</span>
              <span>
                Partage-le en <strong className="text-slate-400">DM</strong>{" "}
                quand on te demande le produit
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400 mt-0.5">•</span>
              <span>
                Chaque clic est{" "}
                <strong className="text-slate-400">
                  automatiquement tracké
                </strong>{" "}
                📊
              </span>
            </li>
          </ul>
        </div>
      )}

      {/* Test Link Button */}
      <div className="mt-4 pt-4 border-t border-white/5">
        <a
          href={trackingUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors"
        >
          <ExternalLink className="w-4 h-4" />
          {t("testLinkNewTab")}
        </a>
      </div>
    </div>
  );
}
