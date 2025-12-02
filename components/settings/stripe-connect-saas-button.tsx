'use client';

import { useState } from 'react';
import { Loader2, CreditCard, Check, ExternalLink } from 'lucide-react';

interface StripeConnectSaasButtonProps {
  isConnected: boolean;
  connectedAt?: string;
}

export default function StripeConnectSaasButton({ 
  isConnected, 
  connectedAt 
}: StripeConnectSaasButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConnect = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/stripe/connect-saas', {
        method: 'POST',
      });

      const data = await response.json();

      if (data.error) {
        setError(data.error);
        setIsLoading(false);
        return;
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      setError('Une erreur est survenue');
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  if (isConnected) {
    return (
      <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/20 rounded-lg">
              <Check className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <h4 className="font-medium text-white">Stripe Connecté</h4>
              <p className="text-xs text-slate-400">
                {connectedAt ? `Connecté le ${formatDate(connectedAt)}` : 'Connecté'}
              </p>
            </div>
          </div>
          <button
            onClick={handleConnect}
            disabled={isLoading}
            className="flex items-center gap-2 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm transition-colors"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <ExternalLink className="w-4 h-4" />
                Dashboard Stripe
              </>
            )}
          </button>
        </div>
        <p className="text-xs text-green-300 mt-3">
          ✅ Le CA généré par vos ambassadeurs sera automatiquement tracké !
        </p>
      </div>
    );
  }

  return (
    <div className="bg-[#0A0C10] border border-white/10 rounded-xl p-4">
      <div className="flex items-start gap-4">
        <div className="p-2 bg-[#635BFF]/20 rounded-lg">
          <CreditCard className="w-5 h-5 text-[#635BFF]" />
        </div>
        <div className="flex-1">
          <h4 className="font-medium text-white mb-1">Connecter Stripe</h4>
          <p className="text-sm text-slate-400 mb-4">
            Connectez votre compte Stripe pour tracker automatiquement le CA généré par vos ambassadeurs. 
            Plus besoin d'ajouter de code !
          </p>
          
          <div className="flex items-center gap-3">
            <button
              onClick={handleConnect}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 bg-[#635BFF] hover:bg-[#5851DB] text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Connexion...
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4" />
                  Connecter Stripe
                </>
              )}
            </button>
            
            <span className="text-xs text-slate-500">
              Lecture seule • Sécurisé
            </span>
          </div>
          
          {error && (
            <p className="text-xs text-red-400 mt-2">{error}</p>
          )}
        </div>
      </div>
      
      <div className="mt-4 pt-4 border-t border-white/5">
        <p className="text-xs text-slate-500">
          💡 Une fois connecté, chaque vente sera automatiquement attribuée à l'ambassadeur 
          qui a généré le clic (via le cookie de 30 jours).
        </p>
      </div>
    </div>
  );
}

