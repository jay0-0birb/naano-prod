'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Loader2, ExternalLink } from 'lucide-react';

export default function StripeConnectButton() {
  const t = useTranslations('forms');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConnect = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/stripe/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ returnPath: 'settings' }),
      });

      const data = await response.json();

      if (data.error) {
        setError(data.code === 'country_required' ? t('stripeCountryRequired') : data.error);
        setIsLoading(false);
        return;
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      setError(t('errorOccurred'));
      setIsLoading(false);
    }
  };

  return (
    <div>
      <button
        onClick={handleConnect}
        disabled={isLoading}
        className="flex items-center gap-2 px-4 py-2 bg-[#635BFF] hover:bg-[#5851DB] text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            {t('connecting')}
          </>
        ) : (
          <>
            <ExternalLink className="w-4 h-4" />
            {t('connectStripe')}
          </>
        )}
      </button>
      {error && (
        <p className="text-xs text-red-400 mt-2">{error}</p>
      )}
    </div>
  );
}

