'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { respondToApplication } from '@/app/(dashboard)/dashboard/applications/actions';

interface ApplicationActionsProps {
  applicationId: string;
  initialStatus: 'pending' | 'accepted' | 'rejected';
}

export default function ApplicationActions({
  applicationId,
  initialStatus,
}: ApplicationActionsProps) {
  const router = useRouter();
  const [status, setStatus] = useState<ApplicationActionsProps['initialStatus']>(
    initialStatus,
  );
  const [loading, setLoading] = useState<null | 'accept' | 'reject'>(null);
  const [error, setError] = useState<string | null>(null);

  if (status !== 'pending') return null;

  const handleRespond = async (next: 'accepted' | 'rejected') => {
    setLoading(next === 'accepted' ? 'accept' : 'reject');
    setError(null);

    const result = await respondToApplication(applicationId, next);
    if (result.error) {
      setError(result.error);
    } else if (result.success) {
      setStatus(next);
      // Refresh the page so the main status badge reflects the new state
      router.refresh();
    }

    setLoading(null);
  };

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={() => handleRespond('accepted')}
        disabled={loading !== null}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-medium disabled:opacity-50"
      >
        {loading === 'accept' ? (
          <>
            <Loader2 className="w-3 h-3 animate-spin" />
            <span>Acceptation...</span>
          </>
        ) : (
          <>
            <CheckCircle2 className="w-3 h-3" />
            <span>Accepter</span>
          </>
        )}
      </button>
      <button
        onClick={() => handleRespond('rejected')}
        disabled={loading !== null}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-medium disabled:opacity-50"
      >
        {loading === 'reject' ? (
          <>
            <Loader2 className="w-3 h-3 animate-spin" />
            <span>Refus...</span>
          </>
        ) : (
          <>
            <XCircle className="w-3 h-3" />
            <span>Refuser</span>
          </>
        )}
      </button>
      {error && (
        <p className="text-[11px] text-red-600 mt-1">
          {error}
        </p>
      )}
    </div>
  );
}

