'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Loader2, CreditCard } from 'lucide-react';

export default function CardRegistrationButton() {
  const t = useTranslations('forms');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleAddCard = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Create setup intent
      const setupResponse = await fetch('/api/stripe/setup-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const setupData = await setupResponse.json();

      if (setupData.error) {
        setError(setupData.error);
        setIsLoading(false);
        return;
      }

      // Redirect to card setup page (it will create a fresh setup intent)
      router.push('/dashboard/settings/card-setup');
    } catch (err: any) {
      setError(t('errorOccurred') + ': ' + err.message);
      setIsLoading(false);
    }
  };

  return (
    <div>
      <button
        onClick={handleAddCard}
        disabled={isLoading}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            {t('loading')}
          </>
        ) : (
          <>
            <CreditCard className="w-4 h-4" />
            {t('registerCard')}
          </>
        )}
      </button>
      {error && (
        <p className="text-xs text-red-400 mt-2">{error}</p>
      )}
    </div>
  );
}

