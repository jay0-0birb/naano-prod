'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { loadStripe, StripeElementsOptions } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Loader2, Check, AlertCircle, X } from 'lucide-react';

// Get publishable key from environment
const getStripePublishableKey = () => {
  const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  if (!key) {
    console.error('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not set in environment variables');
    return null;
  }
  return key;
};

const stripePromise = getStripePublishableKey() 
  ? loadStripe(getStripePublishableKey()!)
  : null;

interface CardSetupClientProps {
  setupIntentId: string;
  clientSecret: string;
}

function CardSetupForm({ setupIntentId, clientSecret }: { setupIntentId: string; clientSecret: string }) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!stripe || !elements) {
      return;
    }

    setIsLoading(true);
    setError(null);

    const cardElement = elements.getElement(CardElement);

    if (!cardElement) {
      setError('Élément de carte non trouvé');
      setIsLoading(false);
      return;
    }

    try {
      console.log('Confirming setup intent with client secret...');
      console.log('Client secret:', clientSecret.substring(0, 20) + '...');
      
      // First, let's check if we can retrieve the setup intent to see its current state
      // But we can't do that from client side, so we'll just try to confirm
      
      // Confirm setup intent with client secret
      const result = await stripe.confirmCardSetup(clientSecret, {
        payment_method: {
          card: cardElement,
        },
      });

      if (result.error) {
        console.error('Stripe confirmCardSetup error:', result.error);
        console.error('Error details:', {
          type: result.error.type,
          code: result.error.code,
          message: result.error.message,
          decline_code: result.error.decline_code,
          param: result.error.param,
        });
        
        // Handle specific error codes
        if (result.error.code === 'setup_intent_unexpected_state') {
          setError('Cette session a expiré. Veuillez réessayer.');
        } else {
          setError(result.error.message || 'Erreur lors de la confirmation de la carte');
        }
        setIsLoading(false);
        return;
      }

      if (!result.setupIntent) {
        console.error('No setup intent returned from confirmCardSetup');
        setError('Erreur: aucune réponse de Stripe');
        setIsLoading(false);
        return;
      }

      console.log('Setup intent confirmed:', result.setupIntent.id, 'Status:', result.setupIntent.status);
      
      // Check if setup intent succeeded
      if (result.setupIntent.status !== 'succeeded') {
        console.warn('Setup intent not succeeded, status:', result.setupIntent.status);
        setError(`Le statut de la carte est: ${result.setupIntent.status}. Veuillez réessayer.`);
        setIsLoading(false);
        return;
      }

      // Wait a moment for Stripe to process
      await new Promise(resolve => setTimeout(resolve, 500));

      // Validate card (pre-authorization)
      const validateResponse = await fetch('/api/stripe/validate-card', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          setup_intent_id: setupIntentId,
        }),
      });

      const validateData = await validateResponse.json();

      if (!validateResponse.ok || validateData.error) {
        console.error('Validation error:', validateData);
        setError(validateData.error || validateData.message || 'Erreur lors de la validation de la carte');
        setIsLoading(false);
        return;
      }

      // Success!
      setSuccess(true);
      setTimeout(() => {
        router.push('/dashboard/settings');
        router.refresh();
      }, 2000);
    } catch (err: any) {
      console.error('Card setup error:', err);
      setError('Une erreur est survenue: ' + (err.message || 'Erreur inconnue'));
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
          <Check className="w-8 h-8 text-green-400" />
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">Carte enregistrée !</h3>
        <p className="text-slate-400">Redirection en cours...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-white mb-2">
          Informations de la carte
        </label>
        <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: '16px',
                  color: '#ffffff',
                  '::placeholder': {
                    color: '#9ca3af',
                  },
                },
                invalid: {
                  color: '#ef4444',
                },
              },
              // Disable "Save with link" feature
              hidePostalCode: false,
            }}
          />
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-400" />
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={!stripe || isLoading}
          className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Enregistrement...
            </>
          ) : (
            'Enregistrer la carte'
          )}
        </button>
        <button
          type="button"
          onClick={() => router.push('/dashboard/settings')}
          className="px-4 py-3 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl font-medium transition-colors"
        >
          Annuler
        </button>
      </div>

      <p className="text-xs text-slate-500 text-center">
        Votre carte sera validée avec une autorisation de 1€ qui sera immédiatement annulée.
      </p>
    </form>
  );
}

export default function CardSetupClient({ setupIntentId, clientSecret }: CardSetupClientProps) {
  const [stripeLoaded, setStripeLoaded] = useState(false);

  useEffect(() => {
    if (stripePromise) {
      stripePromise.then(() => setStripeLoaded(true));
    }
  }, []);

  if (!getStripePublishableKey()) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-8 text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">Configuration manquante</h3>
          <p className="text-slate-400 text-sm mb-4">
            La clé publique Stripe n'est pas configurée. Veuillez ajouter <code className="bg-white/10 px-2 py-1 rounded">NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY</code> dans votre fichier <code className="bg-white/10 px-2 py-1 rounded">.env.local</code>.
          </p>
          <p className="text-xs text-slate-500">
            Vous pouvez la trouver dans votre tableau de bord Stripe → Developers → API keys
          </p>
        </div>
      </div>
    );
  }

  const options: StripeElementsOptions = {
    clientSecret,
    appearance: {
      theme: 'night',
      variables: {
        colorPrimary: '#3b82f6',
        colorBackground: '#0A0C10',
        colorText: '#ffffff',
        colorDanger: '#ef4444',
        fontFamily: 'system-ui, sans-serif',
        spacingUnit: '4px',
        borderRadius: '8px',
      },
    },
  };

  if (!stripeLoaded) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-[#0A0C10] border border-white/10 rounded-2xl p-8 text-center">
          <Loader2 className="w-8 h-8 text-blue-400 animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Chargement de Stripe...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-normal text-white mb-1">Enregistrer une carte</h2>
        <p className="text-slate-400 text-sm">
          Ajoutez une carte bancaire pour payer les leads générés
        </p>
      </div>

      {/* Security notice */}
      <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
        <div className="flex items-start gap-3">
          <div className="w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0 mt-0.5">
            <Check className="w-3 h-3 text-blue-400" />
          </div>
          <div>
            <p className="text-sm text-blue-400 font-medium mb-1">Sécurisé par Stripe</p>
            <p className="text-xs text-slate-400">
              Vos informations de carte sont traitées directement par Stripe. Nous ne stockons jamais vos détails de carte.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-[#0A0C10] border border-white/10 rounded-2xl p-8">
        {stripePromise && (
          <Elements options={options} stripe={stripePromise}>
            <CardSetupForm setupIntentId={setupIntentId} clientSecret={clientSecret} />
          </Elements>
        )}
      </div>
    </div>
  );
}

