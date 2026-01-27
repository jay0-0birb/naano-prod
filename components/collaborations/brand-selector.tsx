'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

interface Brand {
  id: string;
  name: string;
  main_url: string;
}

interface BrandSelectorProps {
  collaborationId: string;
  brands: Brand[];
  currentBrandId: string | null;
  defaultUrl: string | null;
  isScale: boolean;
}

export default function BrandSelector({
  collaborationId,
  brands,
  currentBrandId,
  defaultUrl,
  isScale,
}: BrandSelectorProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | 'default'>(
    currentBrandId || 'default',
  );

  const handleChange = async (value: string) => {
    if (!isScale) return; // Safety guard
    setSelectedId(value);
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/collaborations/brand', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          collaborationId,
          brandId: value === 'default' ? null : value,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        setError(data.error || 'Erreur lors de la mise à jour de la marque');
      } else {
        router.refresh();
      }
    } catch (err: any) {
      setError(err.message || 'Erreur réseau');
    } finally {
      setLoading(false);
    }
  };

  if (!isScale) {
    return (
      <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600">
        Multi-brand is available on the <span className="font-semibold">Scale</span> plan.
        {defaultUrl && (
          <>
            {' '}Current link used for this collaboration:{' '}
            <span className="font-mono break-all">{defaultUrl}</span>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-xl">
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1">
          <p className="text-xs font-semibold text-blue-800 mb-1">
            Brand / Landing page
          </p>
          <p className="text-[11px] text-blue-700">
            Choose which brand URL this creator promotes. Scale plan only.
          </p>
          {error && (
            <p className="mt-1 text-[11px] text-red-600">
              {error}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <select
            className="text-xs border border-blue-300 rounded-lg px-2 py-1 bg-white text-slate-900"
            value={selectedId}
            disabled={loading}
            onChange={(e) => handleChange(e.target.value)}
          >
            <option value="default">
              Default website
            </option>
            {brands.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
          {loading && <Loader2 className="w-4 h-4 animate-spin text-blue-500" />}
        </div>
      </div>
      {selectedId !== 'default' && (
        <p className="mt-1 text-[11px] text-blue-700 break-all">
          URL: {brands.find((b) => b.id === selectedId)?.main_url}
        </p>
      )}
    </div>
  );
}

