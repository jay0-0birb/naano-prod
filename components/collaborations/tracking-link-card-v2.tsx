'use client';

import { useState, useEffect } from 'react';
import { Link as LinkIcon, Copy, Check, ExternalLink, Eye, MousePointerClick, DollarSign, AlertCircle, BarChart3 } from 'lucide-react';

interface TrackingLinkCardProps {
  hash: string;
  impressions: number;
  clicks: number;
  revenue: number;
  isCreator: boolean;
  trackImpressions: boolean;
  trackClicks: boolean;
  trackRevenue: boolean;
}

export default function TrackingLinkCardV2({ 
  hash, 
  impressions, 
  clicks, 
  revenue,
  isCreator,
  trackImpressions,
  trackClicks,
  trackRevenue
}: TrackingLinkCardProps) {
  const [copied, setCopied] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  // Wait for client-side mount to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Build the full tracking URL (only show full URL after mount)
  const trackingUrl = mounted ? `${window.location.origin}/c/${hash}` : `/c/${hash}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(trackingUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Calculate active metrics count for grid layout
  const activeMetrics = [trackImpressions, trackClicks, trackRevenue].filter(Boolean).length;
  const gridCols = activeMetrics === 3 ? 'grid-cols-3' : activeMetrics === 2 ? 'grid-cols-2' : 'grid-cols-1';

  return (
    <div className={`border rounded-2xl p-6 bg-white shadow-sm ${isCreator ? 'border-blue-100' : 'border-gray-200'}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              isCreator ? 'bg-blue-50 text-[#1D4ED8]' : 'bg-gray-100 text-[#111827]'
            }`}
          >
            {isCreator ? (
              <LinkIcon className="w-5 h-5" />
            ) : (
              <BarChart3 className="w-5 h-5" />
            )}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-[#111827]">
              {isCreator ? 'Ton lien tracké' : 'Performance du créateur'}
            </h3>
            <p className="text-xs text-[#64748B]">
              {isCreator 
                ? 'Utilise ce lien dans tes posts, bio, et commentaires'
                : 'Statistiques de trafic et conversions générées'}
            </p>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className={`grid ${gridCols} gap-4 ${isCreator ? 'mb-6' : ''}`}>
        {/* Impressions */}
        {trackImpressions && (
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
            <div className="flex items-center gap-2 text-[#64748B] mb-1">
              <Eye className="w-4 h-4" />
              <span className="text-xs font-medium">Impressions</span>
            </div>
            <div className="text-2xl font-semibold text-[#111827]">
              {impressions.toLocaleString()}
            </div>
          </div>
        )}

        {/* Clicks */}
        {trackClicks && (
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
            <div className="flex items-center gap-2 text-[#64748B] mb-1">
              <MousePointerClick className="w-4 h-4" />
              <span className="text-xs font-medium">Clics</span>
            </div>
            <div className="text-2xl font-semibold text-[#1D4ED8]">
              {clicks.toLocaleString()}
            </div>
          </div>
        )}

        {/* Revenue */}
        {trackRevenue && (
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
            <div className="flex items-center gap-2 text-[#64748B] mb-1">
              <DollarSign className="w-4 h-4" />
              <span className="text-xs font-medium">CA Généré</span>
            </div>
            <div className="text-2xl font-semibold text-emerald-600">
              €{revenue.toFixed(2)}
            </div>
          </div>
        )}
      </div>

      {/* === CREATOR ONLY SECTION === */}
      {isCreator && (
        <>
          {/* Tracking Link Display */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="flex-1 font-mono text-sm text-[#111827] break-all">
                {trackingUrl}
              </div>
              <button
                onClick={handleCopy}
                className="flex items-center gap-2 px-4 py-2 bg-[#111827] hover:bg-[#020617] text-white rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    Copié !
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copier
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Instructions for Creator */}
          <div className="space-y-2 mb-4">
            <p className="text-sm text-[#111827] font-medium">
              💡 Comment l&apos;utiliser :
            </p>
            <ul className="space-y-1.5 text-xs text-[#4B5563]">
              <li className="flex items-start gap-2">
                <span className="text-[#3B82F6] mt-0.5">•</span>
                <span>
                  Ajoute-le en{" "}
                  <strong className="text-[#111827]">premier commentaire</strong>{" "}
                  de tes posts LinkedIn
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#3B82F6] mt-0.5">•</span>
                <span>
                  Mets-le dans ta <strong className="text-[#111827]">bio LinkedIn</strong>{" "}
                  (section &quot;À propos&quot;)
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#3B82F6] mt-0.5">•</span>
                <span>
                  Partage-le en <strong className="text-[#111827]">DM</strong> quand
                  on te demande le produit
                </span>
              </li>
            </ul>
          </div>

          {/* Warning about not modifying link */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-amber-800">
                <strong>Important :</strong> Ne modifie pas ce lien ! Utilise-le tel
                quel pour que tes stats soient correctement comptabilisées.
              </p>
            </div>
          </div>

          {/* Footer with test link */}
          <div className="flex items-center justify-end pt-4 border-t border-gray-100">
            <a
              href={trackingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-[#3B82F6] hover:text-[#1D4ED8] transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              Tester le lien
            </a>
          </div>
        </>
      )}
    </div>
  );
}

