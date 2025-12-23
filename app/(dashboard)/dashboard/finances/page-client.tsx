'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Wallet, 
  Crown, 
  Zap, 
  Rocket,
  Check,
  AlertCircle,
  ExternalLink,
  CreditCard,
  TrendingUp,
  Info,
  Loader2,
  Settings,
  RefreshCw,
  FileText
} from 'lucide-react';
import Link from 'next/link';
import { SAAS_TIERS, SaasTier } from '@/lib/subscription-config';
import { refreshStripeStatus } from '@/lib/stripe-status';
import { verifySubscriptionStatus } from '@/lib/subscription-status';

interface CreatorData {
  tier: string;
  tierConfig: {
    name: string;
    price: number;
    priceLabel: string;
    maxSaas: number;
    features: string[];
  };
  activeSaas: number;
  maxSaas: number;
  stripeConnected: boolean;
  minPayout: number;
  pendingBalance: number; // BP1.md: Waiting for SaaS payment
  availableBalance: number; // BP1.md: Ready for payout
  totalEarned: number; // Lifetime total
  payoutHistory: any[];
}

interface SaasData {
  companyName: string;
  tier: SaasTier;
  tierConfig: typeof SAAS_TIERS[SaasTier];
  subscriptionStatus: string;
  activeCreators: number;
  maxCreators: number;
  allTiers: typeof SAAS_TIERS;
  currentDebt: number; // BP1.md: Current accumulated debt
  totalLeads: number; // Total leads generated
  totalInvoiced: number; // Total amount invoiced
  invoices: any[]; // Billing invoices
  cardOnFile: boolean; // Card registration status
  cardLast4: string | null; // Last 4 digits of card
  cardBrand: string | null; // Card brand (visa, mastercard, etc.)
}

interface FinancesPageClientProps {
  isCreator: boolean;
  creatorData?: CreatorData;
  saasData?: SaasData;
  subscriptionMessage?: string;
  stripeMessage?: string;
}

export default function FinancesPageClient({ 
  isCreator, 
  creatorData, 
  saasData,
  subscriptionMessage,
  stripeMessage
}: FinancesPageClientProps) {
  const router = useRouter();
  const [selectedTab, setSelectedTab] = useState<'plan' | 'commissions'>('plan');
  const [loadingTier, setLoadingTier] = useState<SaasTier | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [stripeLoading, setStripeLoading] = useState(false);
  const [payoutLoading, setPayoutLoading] = useState(false);

  // Debug: Log what we're rendering
  useEffect(() => {
    console.log('FinancesPageClient render:', { 
      isCreator, 
      hasCreatorData: !!creatorData, 
      hasSaasData: !!saasData,
      selectedTab,
      saasDataKeys: saasData ? Object.keys(saasData) : null
    });
  }, [isCreator, creatorData, saasData, selectedTab]);

  // Auto-verify and refresh if we have success message but status not updated
  useEffect(() => {
    if (stripeMessage && isCreator && creatorData && !creatorData.stripeConnected) {
      // Verify status immediately, then refresh
      const verifyAndRefresh = async () => {
        try {
          const result = await refreshStripeStatus();
          if (result.success && result.onboardingComplete) {
            // Wait a moment for DB to update, then refresh
            setTimeout(() => {
              router.refresh();
            }, 500);
          } else {
            // If not complete yet, try again after 2 seconds
            setTimeout(() => {
              router.refresh();
            }, 2000);
          }
        } catch (err) {
          console.error('Error verifying status:', err);
          // Still refresh after delay
          setTimeout(() => {
            router.refresh();
          }, 2000);
        }
      };
      
      verifyAndRefresh();
    }
  }, [stripeMessage, isCreator, creatorData, router]);

  // Auto-refresh for SaaS subscriptions when coming back from Stripe Checkout
  useEffect(() => {
    if (subscriptionMessage && !isCreator && saasData) {
      // Verify subscription status immediately, then refresh multiple times
      const verifyAndRefresh = async () => {
        try {
          // First verification attempt
          const result = await verifySubscriptionStatus();
          if (result.success && result.tier && result.tier !== 'starter') {
            // Success! Refresh immediately
            setTimeout(() => {
              router.refresh();
            }, 500);
          } else {
            // If not found yet, try again after 1 second
            setTimeout(async () => {
              const retryResult = await verifySubscriptionStatus();
              if (retryResult.success && retryResult.tier) {
                router.refresh();
              } else {
                // Still refresh after 2 seconds (webhook might have updated it)
                setTimeout(() => {
                  router.refresh();
                }, 2000);
              }
            }, 1000);
          }
        } catch (err) {
          console.error('Error verifying subscription:', err);
          // Still refresh after delays
          setTimeout(() => {
            router.refresh();
          }, 1000);
          setTimeout(() => {
            router.refresh();
          }, 3000);
        }
      };

      verifyAndRefresh();
    }
  }, [subscriptionMessage, isCreator, saasData, router]);

  const getTierIcon = (tier: SaasTier) => {
    switch (tier) {
      case 'starter': return <Zap className="w-5 h-5" />;
      case 'growth': return <Rocket className="w-5 h-5" />;
      case 'scale': return <Crown className="w-5 h-5" />;
    }
  };

  const getTierGradient = (tier: SaasTier) => {
    switch (tier) {
      case 'starter': return 'from-slate-600 to-slate-700';
      case 'growth': return 'from-blue-600 to-blue-700';
      case 'scale': return 'from-amber-500 to-amber-600';
    }
  };

  const formatMaxCreators = (max: number) => {
    return max === Infinity || max > 100000 ? '∞' : max.toString();
  };

  // Handle plan change for SaaS
  const handlePlanChange = async (targetTier: SaasTier) => {
    setLoadingTier(targetTier);
    setError(null);

    try {
      const response = await fetch('/api/stripe/subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier: targetTier }),
      });

      const data = await response.json();

      if (data.error) {
        setError(data.error);
        setLoadingTier(null);
        return;
      }

      if (data.url) {
        // Redirect to Stripe Checkout
        window.location.href = data.url;
      } else if (data.success) {
        // Plan changed directly (downgrade or update)
        router.refresh();
      }
    } catch (err) {
      setError('Une erreur est survenue');
    } finally {
      setLoadingTier(null);
    }
  };

  // Handle Stripe Connect for creators
  const handleStripeConnect = async () => {
    setStripeLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/stripe/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ returnPath: 'finances' }),
      });

      const data = await response.json();

      if (data.error) {
        setError(data.error);
        setStripeLoading(false);
        return;
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      setError('Une erreur est survenue');
      setStripeLoading(false);
    }
  };

  // Handle manual status refresh
  const handleRefreshStatus = async () => {
    setStripeLoading(true);
    setError(null);

    try {
      const result = await refreshStripeStatus();
      if (result.error) {
        setError(result.error);
      } else {
        // Refresh the page to show updated status
        router.refresh();
      }
    } catch (err) {
      setError('Une erreur est survenue');
    } finally {
      setStripeLoading(false);
    }
  };

  // Handle sync subscription status
  const handleSyncSubscription = async () => {
    setStripeLoading(true);
    setError(null);

    try {
      const result = await verifySubscriptionStatus();
      if (result.error) {
        setError(result.error);
      } else {
        // Refresh the page to show updated status
        router.refresh();
      }
    } catch (err) {
      setError('Une erreur est survenue');
    } finally {
      setStripeLoading(false);
    }
  };

  // Handle payout request for creators
  const handleRequestPayout = async () => {
    setPayoutLoading(true);
    setError(null);

    try {
      const supabase = (await import('@/lib/supabase/client')).createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setError('Non authentifié');
        setPayoutLoading(false);
        return;
      }

      const response = await fetch('/api/payouts/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      const data = await response.json();

      if (data.error) {
        setError(data.error);
        setPayoutLoading(false);
        return;
      }

      if (data.success) {
        // Success! Refresh the page to show updated earnings
        router.refresh();
      }
    } catch (err) {
      setError('Une erreur est survenue');
      setPayoutLoading(false);
    }
  };

  // Handle manage subscription (Stripe portal)
  const handleManageSubscription = async () => {
    setStripeLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/stripe/subscription', {
        method: 'GET',
      });

      const data = await response.json();

      if (data.error) {
        setError(data.error);
        setStripeLoading(false);
        return;
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      setError('Une erreur est survenue');
      setStripeLoading(false);
    }
  };

  // Handle card registration (BP1.md: Card required for SaaS)
  const handleAddCard = async () => {
    // Redirect to settings page where card setup will be handled
    router.push('/dashboard/settings');
  };

  // Creator View
  if (isCreator && creatorData) {
    return (
      <div className="max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-normal text-white mb-1">💰 Finances</h1>
          <p className="text-slate-400 text-sm">
            Gérez vos gains et demandez vos virements
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Success message */}
        {stripeMessage && (
          <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center gap-3">
            <Check className="w-5 h-5 text-green-400" />
            <p className="text-green-400 text-sm">{stripeMessage}</p>
          </div>
        )}

        {/* Current Plan Card */}
        <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-2xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                <Wallet className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">Plan {creatorData.tierConfig.name}</h2>
                <p className="text-purple-200">{creatorData.tierConfig.priceLabel}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="bg-black/20 rounded-xl p-4">
              <p className="text-purple-200 text-sm mb-1">Partenariats actifs</p>
              <p className="text-2xl font-bold text-white">
                {creatorData.activeSaas}
                <span className="text-lg font-normal text-purple-200">/{creatorData.maxSaas}</span>
              </p>
            </div>
            <div className="bg-black/20 rounded-xl p-4">
              <p className="text-purple-200 text-sm mb-1">Total gagné</p>
              <p className="text-2xl font-bold text-white">
                {creatorData.totalEarned.toFixed(2)}€
              </p>
              <p className="text-xs text-purple-200">Depuis le début</p>
            </div>
            <div className="bg-black/20 rounded-xl p-4">
              <p className="text-purple-200 text-sm mb-1">Disponible</p>
              <p className="text-2xl font-bold text-white">
                {creatorData.availableBalance.toFixed(2)}€
              </p>
              <p className="text-xs text-purple-200">Prêt pour virement</p>
            </div>
          </div>
        </div>

        {/* Stripe Connection */}
        <div className="bg-[#0A0C10] border border-white/10 rounded-2xl p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-[#635BFF]/10 flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-[#635BFF]" />
            </div>
            <div>
              <h3 className="font-medium text-white">Paiements Stripe</h3>
              <p className="text-xs text-slate-500">Recevez vos commissions</p>
            </div>
          </div>

          {creatorData.stripeConnected ? (
            <div className="flex items-center justify-between p-4 bg-green-500/10 rounded-xl border border-green-500/20">
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-green-400" />
                <span className="text-sm text-green-400">Compte Stripe connecté</span>
              </div>
              <Link 
                href="/dashboard/settings"
                className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
              >
                <Settings className="w-3 h-3" />
                Gérer
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-amber-400 font-medium">Stripe non connecté</p>
                    <p className="text-xs text-amber-400/70 mt-1">
                      Connectez votre compte pour recevoir vos commissions directement sur votre compte bancaire.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={handleStripeConnect}
                  disabled={stripeLoading}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#635BFF] hover:bg-[#5851DB] text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {stripeLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Connexion en cours...
                    </>
                  ) : (
                    <>
                      <ExternalLink className="w-4 h-4" />
                      Connecter mon compte Stripe
                    </>
                  )}
                </button>
                
                {stripeMessage && (
                  <button
                    onClick={handleRefreshStatus}
                    disabled={stripeLoading}
                    className="px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
                    title="Actualiser le statut"
                  >
                    <RefreshCw className={`w-4 h-4 ${stripeLoading ? 'animate-spin' : ''}`} />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Wallet Overview - Simplified */}
        <div className="bg-[#0A0C10] border border-white/10 rounded-2xl p-6 mb-6">
          <h3 className="font-medium text-white mb-4 flex items-center gap-2">
            <Wallet className="w-5 h-5 text-purple-400" />
            Solde de votre portefeuille
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
              <p className="text-xs text-blue-400 mb-1 font-medium">En attente</p>
              <p className="text-2xl font-bold text-white">
                {creatorData.pendingBalance.toFixed(2)}€
              </p>
              <p className="text-xs text-slate-400 mt-1">
                En attente que le SaaS paie Naano. Une fois payé, cet argent passera en "Disponible".
              </p>
            </div>
            <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
              <p className="text-xs text-green-400 mb-1 font-medium">Disponible</p>
              <p className="text-2xl font-bold text-white">
                {creatorData.availableBalance.toFixed(2)}€
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Prêt pour virement. Cliquez sur "Retirer" pour recevoir cet argent sur votre compte Stripe.
              </p>
            </div>
          </div>
          
          <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl">
            <p className="text-xs text-purple-400 mb-1 font-medium">Total gagné (lifetime)</p>
            <p className="text-2xl font-bold text-white">
              {creatorData.totalEarned.toFixed(2)}€
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Total de tous vos gains depuis le début (En attente + Disponible + Déjà retiré)
            </p>
          </div>
            
          {/* How it works */}
          <div className="pt-6 border-t border-white/10">
            <h4 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
              <Info className="w-4 h-4 text-blue-400" />
              Comment ça fonctionne
            </h4>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center text-green-400 font-bold shrink-0 text-xs">1</div>
              <div>
                  <p className="text-xs text-white font-medium">Vous générez des leads</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Partagez votre lien tracké. Chaque lead validé vous rapporte 1,20€.
                </p>
              </div>
            </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center text-green-400 font-bold shrink-0 text-xs">2</div>
                <div>
                  <p className="text-xs text-white font-medium">Paiement par le SaaS</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Le SaaS paie Naano, votre solde passe de "En attente" à "Disponible".
                  </p>
          </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center text-green-400 font-bold shrink-0 text-xs">3</div>
                <div>
                  <p className="text-xs text-white font-medium">Demandez un virement</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Dès que vous avez {creatorData.minPayout}€ disponible, retirez via Stripe.
                  </p>
              </div>
              </div>
              </div>
            </div>
          </div>

          {/* Payout Section (BP1.md) */}
          {creatorData.availableBalance > 0 && (
            <div className="mt-6 p-6 bg-green-500/10 border border-green-500/20 rounded-xl">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="text-lg font-medium text-white mb-1">Solde disponible</h4>
                  <p className="text-3xl font-bold text-green-400">
                    {creatorData.availableBalance.toFixed(2)}€
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Total gagné: {creatorData.totalEarned.toFixed(2)}€
                  </p>
                </div>
              </div>

              {creatorData.stripeConnected ? (
                creatorData.availableBalance >= creatorData.minPayout ? (
                  <button
                    onClick={handleRequestPayout}
                    disabled={payoutLoading}
                    className="w-full py-3 bg-green-500 hover:bg-green-400 text-white rounded-xl font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {payoutLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Traitement en cours...
                      </>
                    ) : (
                      <>
                        <Wallet className="w-4 h-4" />
                        Retirer ({creatorData.availableBalance.toFixed(2)}€)
                      </>
                    )}
                  </button>
                ) : (
                  <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                    <p className="text-sm text-amber-400">
                      Montant minimum requis: {creatorData.minPayout}€. 
                      Il vous manque {(creatorData.minPayout - creatorData.availableBalance).toFixed(2)}€.
                    </p>
                  </div>
                )
              ) : (
                <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                  <p className="text-sm text-amber-400">
                    Connectez votre compte Stripe pour recevoir vos gains.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Payout History */}
          {creatorData.payoutHistory && creatorData.payoutHistory.length > 0 && (
            <div className="mt-6 p-6 bg-[#0A0C10] border border-white/10 rounded-xl">
              <h4 className="text-lg font-medium text-white mb-4">Historique des virements</h4>
              <div className="space-y-3">
                {creatorData.payoutHistory.map((payout: any) => (
                  <div key={payout.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                    <div>
                      <p className="text-sm text-white font-medium">
                        {payout.amount.toFixed(2)}€
                      </p>
                      <p className="text-xs text-slate-400">
                        {new Date(payout.created_at).toLocaleDateString('fr-FR')}
                      </p>
        </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                      payout.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                      payout.status === 'processing' ? 'bg-blue-500/20 text-blue-400' :
                      payout.status === 'failed' ? 'bg-red-500/20 text-red-400' :
                      'bg-slate-500/20 text-slate-400'
                    }`}>
                      {payout.status === 'completed' ? 'Complété' :
                       payout.status === 'processing' ? 'En cours' :
                       payout.status === 'failed' ? 'Échoué' : 'En attente'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
      </div>
    );
  }

  // SaaS View
  if (!isCreator) {
    if (!saasData) {
      return (
        <div className="max-w-5xl">
          <div className="mb-8">
            <h1 className="text-2xl font-normal text-white mb-1">💼 Finances & Plans</h1>
            <p className="text-slate-400 text-sm">
              Gérez votre abonnement et votre facturation
            </p>
          </div>
          <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6">
            <p className="text-red-400">Erreur: Données SaaS non trouvées</p>
          </div>
        </div>
      );
    }
    const tabs = [
      { id: 'plan', label: 'Mon Plan' },
      { id: 'commissions', label: 'Facturation' }, // BP1.md: Changed from "Commissions" to "Facturation"
    ];

    return (
      <div className="max-w-5xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-normal text-white mb-1">💼 Finances & Plans</h1>
          <p className="text-slate-400 text-sm">
            Gérez votre abonnement et votre facturation
          </p>
        </div>

        {/* Success/Error messages */}
        {subscriptionMessage && (
          <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center gap-3">
            <Check className="w-5 h-5 text-green-400" />
            <p className="text-green-400 text-sm">{subscriptionMessage}</p>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Tab clicked:', tab.id);
                setSelectedTab(tab.id as 'plan' | 'commissions');
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                selectedTab === tab.id
                  ? 'bg-white/10 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Card Registration Section - Show first if no card */}
        {!saasData.cardOnFile && (
          <div className="mb-6 bg-amber-500/10 border border-amber-500/20 rounded-2xl p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0">
                <CreditCard className="w-6 h-6 text-amber-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white mb-2">
                  Carte bancaire requise
                </h3>
                <p className="text-slate-400 text-sm mb-4">
                  Vous devez enregistrer une carte bancaire pour utiliser Naano. 
                  Cette carte sera utilisée pour payer les leads générés par vos créateurs.
                </p>
                <button
                  onClick={handleAddCard}
                  disabled={stripeLoading}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {stripeLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Chargement...
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4" />
                      Ajouter une carte
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Card Status - Show if card is registered */}
        {saasData.cardOnFile && (
          <div className="mb-6 bg-green-500/10 border border-green-500/20 rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
                  <Check className="w-6 h-6 text-green-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-1">
                    Carte enregistrée
                  </h3>
                  <p className="text-slate-400 text-sm">
                    {saasData.cardBrand && saasData.cardBrand.charAt(0).toUpperCase() + saasData.cardBrand.slice(1)} 
                    {saasData.cardLast4 && ` •••• ${saasData.cardLast4}`}
                  </p>
                </div>
              </div>
              <button
                onClick={handleAddCard}
                disabled={stripeLoading}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {stripeLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Settings className="w-4 h-4" />
                    Modifier
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {selectedTab === 'plan' && (
          <div className="space-y-6">
            {/* Current Plan Card */}
            <div className={`bg-gradient-to-br ${getTierGradient(saasData.tier)} rounded-2xl p-6`}>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center text-white">
                    {getTierIcon(saasData.tier)}
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-white">Plan {saasData.tierConfig.name}</h2>
                    <p className="text-white/80">{saasData.tierConfig.priceLabel}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {(subscriptionMessage || saasData.tier !== 'starter') && (
                    <button
                      onClick={handleSyncSubscription}
                      disabled={stripeLoading}
                      className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                      title="Synchroniser avec Stripe"
                    >
                      <RefreshCw className={`w-4 h-4 ${stripeLoading ? 'animate-spin' : ''}`} />
                    </button>
                  )}
                  {saasData.tier !== 'starter' && (
                    <button
                      onClick={handleManageSubscription}
                      disabled={stripeLoading}
                      className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                    >
                      {stripeLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Settings className="w-4 h-4" />
                      )}
                      Gérer
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="bg-black/20 rounded-xl p-4">
                  <p className="text-white/70 text-sm mb-1">Créateurs actifs</p>
                  <p className="text-2xl font-bold text-white">
                    {saasData.activeCreators}
                    <span className="text-lg font-normal text-white/60">
                      /{formatMaxCreators(saasData.maxCreators)}
                    </span>
                  </p>
                </div>
                <div className="bg-black/20 rounded-xl p-4">
                  <p className="text-white/70 text-sm mb-1">Prix par lead</p>
                  <p className="text-2xl font-bold text-white">
                    {saasData.tier === 'starter' ? '2,50€' :
                     saasData.tier === 'growth' ? '2,00€' :
                     saasData.tier === 'scale' ? '1,60€' : 'N/A'}
                  </p>
                  <p className="text-xs text-white/60 mt-1">Selon votre plan</p>
                </div>
                <div className="bg-black/20 rounded-xl p-4">
                  <p className="text-white/70 text-sm mb-1">Statut</p>
                  <p className={`text-lg font-medium capitalize ${
                    saasData.subscriptionStatus === 'active' ? 'text-green-400' :
                    saasData.subscriptionStatus === 'past_due' ? 'text-amber-400' : 'text-white'
                  }`}>
                    {saasData.subscriptionStatus === 'active' ? 'Actif' :
                     saasData.subscriptionStatus === 'past_due' ? 'Paiement en retard' :
                     saasData.subscriptionStatus}
                  </p>
                </div>
              </div>
            </div>

            {/* All Plans */}
            <div>
              <h3 className="text-lg font-medium text-white mb-4">Tous les plans</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {(Object.entries(saasData.allTiers) as [SaasTier, typeof SAAS_TIERS[SaasTier]][]).map(([tierKey, tier]) => {
                  const isCurrentTier = tierKey === saasData.tier;
                  const isLoading = loadingTier === tierKey;
                  const isUpgrade = tier.price > saasData.tierConfig.price;
                  const isDowngrade = tier.price < saasData.tierConfig.price;
                  
                  return (
                    <div 
                      key={tierKey}
                      className={`bg-[#0A0C10] border rounded-2xl p-6 relative ${
                        isCurrentTier 
                          ? 'border-blue-500/50 ring-1 ring-blue-500/20' 
                          : 'border-white/10'
                      }`}
                    >
                      {isCurrentTier && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-blue-500 text-white text-xs font-medium rounded-full">
                          Plan actuel
                        </div>
                      )}
                      
                      {tier.recommended && !isCurrentTier && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-green-500 text-white text-xs font-medium rounded-full">
                          Recommandé
                        </div>
                      )}

                      <div className="flex items-center gap-3 mb-4 mt-2">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          tierKey === 'starter' ? 'bg-slate-500/10 text-slate-400' :
                          tierKey === 'growth' ? 'bg-blue-500/10 text-blue-400' :
                          'bg-amber-500/10 text-amber-400'
                        }`}>
                          {getTierIcon(tierKey)}
                        </div>
                        <div>
                          <h4 className="font-semibold text-white">{tier.name}</h4>
                          <p className="text-xl font-bold text-white">
                            {tier.price === 0 ? 'Gratuit' : `${tier.price}€`}
                            {tier.price > 0 && <span className="text-sm font-normal text-slate-500">/mois</span>}
                          </p>
                        </div>
                      </div>

                      <ul className="space-y-2 mb-6">
                        {tier.features.map((feature, i) => (
                          <li key={i} className="flex items-center gap-2 text-sm text-slate-300">
                            <Check className="w-4 h-4 text-green-400 shrink-0" />
                            {feature}
                          </li>
                        ))}
                        <li className="flex items-center gap-2 text-sm text-slate-300">
                          <Check className="w-4 h-4 text-green-400 shrink-0" />
                          {tierKey === 'starter' ? '2,50€' : tierKey === 'growth' ? '2,00€' : '1,60€'} par lead
                        </li>
                      </ul>

                      {isCurrentTier ? (
                        <button 
                          disabled
                          className="w-full py-2.5 bg-white/5 text-slate-500 rounded-xl text-sm font-medium cursor-not-allowed"
                        >
                          Plan actuel
                        </button>
                      ) : (
                        <button 
                          onClick={() => handlePlanChange(tierKey)}
                          disabled={isLoading || loadingTier !== null}
                          className={`w-full py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50 ${
                            tierKey === 'scale' 
                              ? 'bg-amber-500 hover:bg-amber-400 text-black' 
                              : tierKey === 'growth'
                              ? 'bg-blue-600 hover:bg-blue-500 text-white'
                              : 'bg-white/10 hover:bg-white/20 text-white'
                          }`}
                        >
                          {isLoading ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Chargement...
                            </>
                          ) : (
                            isDowngrade ? 'Rétrograder' : isUpgrade ? 'Passer à ce plan' : 'Sélectionner'
                          )}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {selectedTab === 'commissions' && (
          <div className="space-y-6">
            {/* Billing Overview */}
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-6 mb-6">
              <h3 className="font-medium text-white mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-white" />
                Vue d'ensemble de la facturation
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-black/20 rounded-xl p-4">
                  <p className="text-blue-200 text-sm mb-1">Dette actuelle</p>
                  <p className="text-3xl font-bold text-white">
                    {saasData.currentDebt.toFixed(2)}€
                  </p>
                  <p className="text-xs text-blue-200 mt-1 mb-3">
                    {saasData.currentDebt >= 100 
                      ? '⚠️ Facturation imminente' 
                      : `${(100 - saasData.currentDebt).toFixed(2)}€ avant facturation`}
                  </p>
                  {saasData.currentDebt >= 100 && (
                    <button
                      onClick={async () => {
                        if (!confirm(`Payer ${saasData.currentDebt.toFixed(2)}€ maintenant ?`)) return;
                        
                        try {
                          const response = await fetch('/api/billing/check-and-bill', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({})
                          });
                          
                          const result = await response.json();
                          
                          if (result.success || result.billed_count > 0) {
                            alert('Facturation en cours... Vous serez redirigé dans quelques secondes.');
                            setTimeout(() => window.location.reload(), 2000);
                          } else {
                            alert('Erreur: ' + (result.error || 'Impossible de facturer'));
                          }
                        } catch (error: any) {
                          alert('Erreur: ' + error.message);
                        }
                      }}
                      className="w-full px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      <CreditCard className="w-4 h-4" />
                      Payer maintenant
                    </button>
                  )}
                </div>
                <div className="bg-black/20 rounded-xl p-4">
                  <p className="text-blue-200 text-sm mb-1">Total leads</p>
                  <p className="text-3xl font-bold text-white">
                    {saasData.totalLeads}
                  </p>
                  <p className="text-xs text-blue-200 mt-1">Leads validés</p>
                </div>
                <div className="bg-black/20 rounded-xl p-4">
                  <p className="text-blue-200 text-sm mb-1">Total facturé</p>
                  <p className="text-3xl font-bold text-white">
                    {saasData.totalInvoiced.toFixed(2)}€
                  </p>
                  <p className="text-xs text-blue-200 mt-1">Toutes factures payées</p>
              </div>
              </div>
            </div>

            {/* How Billing Works */}
              <div className="bg-[#0A0C10] border border-white/10 rounded-2xl p-6">
                <h3 className="font-medium text-white mb-4 flex items-center gap-2">
                <Info className="w-5 h-5 text-blue-400" />
                Comment fonctionne la facturation
                </h3>

              <div className="space-y-4 mb-6">
                <div className="flex items-start gap-3 p-4 bg-white/[0.02] rounded-xl">
                  <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center text-green-400 font-bold shrink-0 text-sm">1</div>
                  <div>
                    <h4 className="text-sm text-white font-medium">Vous recevez des leads</h4>
                    <p className="text-xs text-slate-400 mt-1">
                      Chaque lead validé ajoute {saasData.tier === 'starter' ? '2,50€' : saasData.tier === 'growth' ? '2,00€' : '1,60€'} à votre dette.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 bg-white/[0.02] rounded-xl">
                  <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center text-green-400 font-bold shrink-0 text-sm">2</div>
                  <div>
                    <h4 className="text-sm text-white font-medium">Facturation automatique</h4>
                    <p className="text-xs text-slate-400 mt-1">
                      Vous êtes facturé automatiquement lorsque vous atteignez 100€ de dette ou à la fin du mois.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 bg-white/[0.02] rounded-xl">
                  <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center text-green-400 font-bold shrink-0 text-sm">3</div>
                  <div>
                    <h4 className="text-sm text-white font-medium">Paiement par carte</h4>
                    <p className="text-xs text-slate-400 mt-1">
                      La facture est prélevée automatiquement sur votre carte enregistrée.
                    </p>
                  </div>
                  </div>
                </div>

              {/* Pricing by Plan */}
              <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                <p className="text-xs text-blue-400 mb-3 font-medium">💡 Prix par lead selon votre plan</p>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Plan Starter</span>
                    <span className="text-white font-medium">2,50€</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Plan Growth</span>
                    <span className="text-white font-medium">2,00€</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Plan Scale</span>
                    <span className="text-white font-medium">1,60€</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-blue-500/20">
                    <span className="text-blue-400 font-medium">Créateur reçoit</span>
                    <span className="text-blue-400 font-medium">1,20€ (fixe)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Invoice History */}
            {saasData.invoices && saasData.invoices.length > 0 ? (
              <div className="bg-[#0A0C10] border border-white/10 rounded-2xl p-6">
                <h3 className="font-medium text-white mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-400" />
                  Historique des factures
                </h3>
                <div className="space-y-3">
                  {saasData.invoices.map((invoice: any) => {
                    const period = invoice.period_start 
                      ? new Date(invoice.period_start).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })
                      : 'N/A';
                        
                        return (
                      <div key={invoice.id} className="p-4 bg-white/[0.02] rounded-xl border border-white/5">
                            <div className="flex items-center justify-between">
                              <div>
                            <p className="text-sm text-white font-medium">
                              {invoice.invoice_number || `Facture #${invoice.id.slice(0, 8)}`}
                            </p>
                            <p className="text-xs text-slate-400">
                              {period} • {invoice.leads_count} leads
                            </p>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-medium text-white">
                              {Number(invoice.amount_ht).toFixed(2)}€ HT
                                </p>
                            <p className="text-xs text-slate-400">
                              {invoice.status === 'paid' ? 'Payée' : 
                               invoice.status === 'sent' ? 'Envoyée' : 
                               invoice.status === 'failed' ? 'Échouée' : 'Brouillon'}
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
              </div>
            ) : (
              <div className="bg-[#0A0C10] border border-white/10 rounded-2xl p-6 text-center">
                <p className="text-slate-400 text-sm">
                  Aucune facture pour le moment. Les factures apparaîtront ici une fois que vous atteignez 100€ de dette ou la fin du mois.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  return null;
}
