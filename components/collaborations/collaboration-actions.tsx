'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
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
  const t = useTranslations('collaboration');
  const [loading, setLoading] = useState<null | 'request' | 'confirm' | 'reject'>(null);
  const [error, setError] = useState<string | null>(null);

  if (status !== 'active') return null;

  const roleLabel = isCreator ? 'créateur' : 'SaaS';
  const otherRoleLabel = isCreator ? 'SaaS' : 'créateur';

  const handleAction = async (action: 'request' | 'confirm' | 'reject') => {
    setLoading(action);
    setError(null);
    try {
      // In the simplified flow we ignore the distinction between request/confirm/reject
      // and just treat any action as an immediate stop.
      const res = await fetch('/api/collaborations/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ collaborationId, action: 'request' }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setError(data.error || t('collabError'));
      } else {
        router.refresh();
      }
    } catch (err: any) {
      setError(err.message || 'Erreur réseau');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
      <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5" />
      <div className="flex-1">
        <p className="text-xs text-amber-800 mb-2">
          {t('stopDesc')}
        </p>
        <button
          onClick={() => handleAction('request')}
          disabled={loading !== null}
          className="text-xs px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-white font-medium disabled:opacity-50"
        >
          {loading === 'request' ? (
            <span className="inline-flex items-center gap-1">
              <Loader2 className="w-3 h-3 animate-spin" />
              {t('stopping')}
            </span>
          ) : (
            t('stopCollaboration')
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

