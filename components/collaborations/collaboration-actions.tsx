'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, Loader2 } from 'lucide-react';

interface CollaborationActionsProps {
  collaborationId: string;
  status: string;
  isCreator: boolean;
  cancelRequestedBy: 'creator' | 'saas' | null;
  cancelReason: string | null;
}

export default function CollaborationActions({
  collaborationId,
  status,
  isCreator,
  cancelRequestedBy,
  cancelReason,
}: CollaborationActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<null | 'request' | 'confirm' | 'reject'>(null);
  const [error, setError] = useState<string | null>(null);

  if (status !== 'active') return null;

  const roleLabel = isCreator ? 'créateur' : 'SaaS';
  const otherRoleLabel = isCreator ? 'SaaS' : 'créateur';

  const handleAction = async (action: 'request' | 'confirm' | 'reject') => {
    setLoading(action);
    setError(null);
    try {
      let reason: string | undefined = undefined;
      if (action === 'request') {
        reason =
          window.prompt(
            "Pourquoi souhaitez-vous arrêter cette collaboration ? (optionnel)",
          ) || undefined;
      }

      const res = await fetch('/api/collaborations/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ collaborationId, action, reason }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setError(data.error || 'Erreur lors de la mise à jour de la collaboration');
      } else {
        router.refresh();
      }
    } catch (err: any) {
      setError(err.message || 'Erreur réseau');
    } finally {
      setLoading(null);
    }
  };

  // No request yet: show request button
  if (!cancelRequestedBy) {
    return (
      <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
        <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5" />
        <div className="flex-1">
          <p className="text-xs text-amber-800 mb-2">
            Vous pouvez arrêter cette collaboration à tout moment. Une demande sera envoyée à l&apos;autre partie pour confirmation.
          </p>
          <button
            onClick={() => handleAction('request')}
            disabled={loading !== null}
            className="text-xs px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-white font-medium disabled:opacity-50"
          >
            {loading === 'request' ? (
              <span className="inline-flex items-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin" />
                Demande en cours...
              </span>
            ) : (
              'Demander l’arrêt de la collaboration'
            )}
          </button>
          {error && (
            <p className="mt-2 text-[11px] text-red-600">
              {error}
            </p>
          )}
        </div>
      </div>
    );
  }

  const requestedByCreator = cancelRequestedBy === 'creator';
  const youRequested =
    (isCreator && requestedByCreator) || (!isCreator && !requestedByCreator);

  // You requested the cancel
  if (youRequested) {
    return (
      <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700">
        <p className="mb-1">
          Demande d&apos;arrêt envoyée à l&apos;autre partie ({otherRoleLabel}).
        </p>
        {cancelReason && (
          <p className="text-[11px] text-slate-500">
            Raison: {cancelReason}
          </p>
        )}
        <button
          onClick={() => handleAction('reject')}
          disabled={loading !== null}
          className="mt-2 text-[11px] px-3 py-1.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium disabled:opacity-50"
        >
          {loading === 'reject' ? (
            <span className="inline-flex items-center gap-1">
              <Loader2 className="w-3 h-3 animate-spin" />
              Annulation...
            </span>
          ) : (
            'Annuler la demande'
          )}
        </button>
        {error && (
          <p className="mt-2 text-[11px] text-red-600">
            {error}
          </p>
        )}
      </div>
    );
  }

  // Other party requested cancel: you can confirm or keep
  return (
    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800">
      <p className="mb-1">
        {otherRoleLabel} souhaite arrêter cette collaboration.
      </p>
      {cancelReason && (
        <p className="text-[11px] mb-2">
          Raison: {cancelReason}
        </p>
      )}
      <div className="flex flex-wrap gap-2 mt-1">
        <button
          onClick={() => handleAction('confirm')}
          disabled={loading !== null}
          className="px-3 py-1.5 rounded-lg bg-red-500 hover:bg-red-400 text-white font-medium disabled:opacity-50"
        >
          {loading === 'confirm' ? (
            <span className="inline-flex items-center gap-1">
              <Loader2 className="w-3 h-3 animate-spin" />
              Arrêt en cours...
            </span>
          ) : (
            'Confirmer l’arrêt'
          )}
        </button>
        <button
          onClick={() => handleAction('reject')}
          disabled={loading !== null}
          className="px-3 py-1.5 rounded-lg bg-white border border-red-300 hover:bg-red-50 text-red-700 font-medium disabled:opacity-50"
        >
          {loading === 'reject' ? (
            <span className="inline-flex items-center gap-1">
              <Loader2 className="w-3 h-3 animate-spin" />
              Annulation...
            </span>
          ) : (
            'Continuer la collaboration'
          )}
        </button>
      </div>
      {error && (
        <p className="mt-2 text-[11px] text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}

