'use client';

import { useState } from 'react';
import { Copy, Check, ChevronDown, ChevronUp, Code, Zap, Terminal } from 'lucide-react';

interface RevenueTrackingSetupProps {
  apiKey?: string;
  trackingDomain?: string;
}

export default function RevenueTrackingSetup({ 
  apiKey = 'VOTRE_API_KEY', 
  trackingDomain = 'https://naano.com' 
}: RevenueTrackingSetupProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copiedPixel, setCopiedPixel] = useState(false);
  const [copiedWebhook, setCopiedWebhook] = useState(false);

  const pixelCode = `<!-- Naano Tracking - Page de confirmation -->
<script>
  fetch('${trackingDomain}/api/track/conversion', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ 
      revenue: MONTANT,    // ex: 99.00
      order_id: 'ORDER_ID' // optionnel
    })
  });
</script>`;

  const webhookCode = `// Server-side (Node.js, Python, etc.)
await fetch('${trackingDomain}/api/track/conversion', {
  method: 'POST',
  headers: { 
    'Authorization': 'Bearer ${apiKey}',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ 
    session_id: naano_session, // from URL
    revenue: 99.00,
    order_id: 'ORDER_123'
  })
});`;

  const copyToClipboard = (text: string, type: 'pixel' | 'webhook') => {
    navigator.clipboard.writeText(text);
    if (type === 'pixel') {
      setCopiedPixel(true);
      setTimeout(() => setCopiedPixel(false), 2000);
    } else {
      setCopiedWebhook(true);
      setTimeout(() => setCopiedWebhook(false), 2000);
    }
  };

  return (
    <div className="rounded-xl overflow-hidden border border-white/10 bg-gradient-to-b from-white/[0.03] to-transparent">
      {/* Header - Collapsible */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-slate-500/10">
            <Terminal className="w-4 h-4 text-slate-400" />
          </div>
          <div>
            <h4 className="text-sm font-medium text-white">Intégration manuelle</h4>
            <p className="text-xs text-slate-500">Pixel ou Webhook pour développeurs</p>
          </div>
        </div>
        <div className={`p-1 rounded-md transition-colors ${isOpen ? 'bg-white/10' : ''}`}>
          {isOpen ? (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </div>
      </button>

      {/* Expandable Content */}
      {isOpen && (
        <div className="px-4 pb-4 space-y-3">
          {/* Option 2: Pixel */}
          <div className="rounded-xl overflow-hidden border border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-transparent">
            <div className="p-3 border-b border-amber-500/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-md bg-amber-500/20">
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                  </div>
                  <div>
                    <span className="text-sm font-medium text-white">Pixel</span>
                    <span className="text-xs text-slate-500 ml-2">JavaScript côté client</span>
                  </div>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 font-medium">
                  FACILE
                </span>
              </div>
            </div>
            <div className="p-3">
              <div className="bg-black/40 rounded-lg p-3 font-mono text-xs text-slate-300 overflow-x-auto border border-white/5">
                <pre className="whitespace-pre-wrap">{pixelCode}</pre>
              </div>
              <div className="flex items-center justify-between mt-3">
                <span className="text-[11px] text-amber-400/80 flex items-center gap-1">
                  <span>⚠️</span> Navigation privée non supportée
                </span>
                <button
                  onClick={() => copyToClipboard(pixelCode, 'pixel')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    copiedPixel 
                      ? 'bg-green-500/20 text-green-400' 
                      : 'bg-white/10 hover:bg-white/15 text-white'
                  }`}
                >
                  {copiedPixel ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      Copié !
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      Copier
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Option 3: Webhook */}
          <div className="rounded-xl overflow-hidden border border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-transparent">
            <div className="p-3 border-b border-blue-500/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-md bg-blue-500/20">
                    <Code className="w-3.5 h-3.5 text-blue-400" />
                  </div>
                  <div>
                    <span className="text-sm font-medium text-white">Webhook</span>
                    <span className="text-xs text-slate-500 ml-2">API côté serveur</span>
                  </div>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 font-medium">
                  PRÉCIS
                </span>
              </div>
            </div>
            <div className="p-3">
              <div className="bg-black/40 rounded-lg p-3 font-mono text-xs text-slate-300 overflow-x-auto border border-white/5">
                <pre className="whitespace-pre-wrap">{webhookCode}</pre>
              </div>
              <div className="flex items-center justify-between mt-3">
                <span className="text-[11px] text-green-400/80 flex items-center gap-1">
                  <span>✓</span> Fonctionne partout
                </span>
                <button
                  onClick={() => copyToClipboard(webhookCode, 'webhook')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    copiedWebhook 
                      ? 'bg-green-500/20 text-green-400' 
                      : 'bg-white/10 hover:bg-white/15 text-white'
                  }`}
                >
                  {copiedWebhook ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      Copié !
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      Copier
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

