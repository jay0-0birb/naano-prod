'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
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
  isScale?: boolean; // Deprecated: multi-brand now available to all
}

export default function BrandSelector({
  collaborationId,
  brands,
  currentBrandId,
  defaultUrl,
  isScale = true, // Always true - multi-brand for everyone
}: BrandSelectorProps) {
  const t = useTranslations('brandSelector');
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | 'default'>(
    currentBrandId || 'default',
  );

  const handleChange = async (value: string) => {
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
        setError(data.error || t('errorUpdate'));
      } else {
        router.refresh();
      }
    } catch (err: any) {
      setError(err.message || t('networkError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-xl">
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1">
          <p className="text-xs font-semibold text-blue-800 mb-1">
            {t('label')}
          </p>
          <p className="text-[11px] text-blue-700">
            {t('desc')}
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
              {t('defaultWebsite')}
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
          {t('url')}: {brands.find((b) => b.id === selectedId)?.main_url}
        </p>
      )}
    </div>
  );
}

