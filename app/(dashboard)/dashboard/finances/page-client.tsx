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
  RefreshCw
} from 'lucide-react';
import Link from 'next/link';
import { SAAS_TIERS, SaasTier, COMMISSION_CONFIG } from '@/lib/subscription-config';
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
  commissionRate: number;
  platformFee: number;
  minPayout: number;
}

interface SaasData {
  companyName: string;
  tier: SaasTier;
  tierConfig: typeof SAAS_TIERS[SaasTier];
  subscriptionStatus: string;
  activeCreators: number;
  maxCreators: number;
  allTiers: typeof SAAS_TIERS;
  commissionConfig: typeof COMMISSION_CONFIG;
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

  // Creator View
  if (isCreator && creatorData) {
    return (
      <div className="max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-normal text-white mb-1">💰 Finances</h1>
          <p className="text-slate-400 text-sm">
            Gérez vos partenariats et commissions
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

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-black/20 rounded-xl p-4">
              <p className="text-purple-200 text-sm mb-1">Partenariats actifs</p>
              <p className="text-2xl font-bold text-white">
                {creatorData.activeSaas}
                <span className="text-lg font-normal text-purple-200">/{creatorData.maxSaas}</span>
              </p>
            </div>
            <div className="bg-black/20 rounded-xl p-4">
              <p className="text-purple-200 text-sm mb-1">Commission</p>
              <p className="text-2xl font-bold text-white">{creatorData.commissionRate}%</p>
              <p className="text-xs text-purple-200">du CA généré</p>
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

        {/* How it works */}
        <div className="bg-[#0A0C10] border border-white/10 rounded-2xl p-6">
          <h3 className="font-medium text-white mb-4 flex items-center gap-2">
            <Info className="w-5 h-5 text-blue-400" />
            Comment fonctionnent les commissions
          </h3>
          
          <div className="space-y-4">
            <div className="flex items-start gap-4 p-4 bg-white/[0.02] rounded-xl">
              <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center text-green-400 font-bold shrink-0">1</div>
              <div>
                <h4 className="text-sm text-white font-medium">Vous générez des ventes</h4>
                <p className="text-xs text-slate-500 mt-1">
                  Partagez votre lien tracké. Chaque vente est attribuée à vous pendant 30 jours.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-4 p-4 bg-white/[0.02] rounded-xl">
              <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center text-green-400 font-bold shrink-0">2</div>
              <div>
                <h4 className="text-sm text-white font-medium">Vous gagnez {creatorData.commissionRate}%</h4>
                <p className="text-xs text-slate-500 mt-1">
                  Sur chaque vente, vous recevez {creatorData.commissionRate}% du CA. 
                  Konex prélève {creatorData.platformFee}% de frais sur votre commission.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-4 p-4 bg-white/[0.02] rounded-xl">
              <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center text-green-400 font-bold shrink-0">3</div>
              <div>
                <h4 className="text-sm text-white font-medium">Demandez un virement</h4>
                <p className="text-xs text-slate-500 mt-1">
                  Dès que vous atteignez {creatorData.minPayout}€, demandez un virement instantané via Stripe.
                </p>
              </div>
            </div>
          </div>

          {/* Example calculation */}
          <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
            <p className="text-xs text-blue-400 mb-2 font-medium">💡 Exemple pour 1 000€ de CA généré</p>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Votre commission (15%)</span>
                <span className="text-white">150,00€</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Frais Konex (15% de 150€)</span>
                <span className="text-red-400">-22,50€</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-blue-500/20">
                <span className="text-blue-400 font-medium">Vous recevez</span>
                <span className="text-blue-400 font-medium">127,50€</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // SaaS View
  if (!isCreator && saasData) {
    const tabs = [
      { id: 'plan', label: 'Mon Plan' },
      { id: 'commissions', label: 'Commissions' },
    ];

    return (
      <div className="max-w-5xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-normal text-white mb-1">💼 Finances & Plans</h1>
          <p className="text-slate-400 text-sm">
            Gérez votre abonnement et vos commissions
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
              onClick={() => setSelectedTab(tab.id as 'plan' | 'commissions')}
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
                  <p className="text-white/70 text-sm mb-1">Frais plateforme</p>
                  <p className="text-2xl font-bold text-white">{saasData.tierConfig.platformFee}%</p>
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
                          {tier.platformFee}% frais plateforme
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
            {/* Commission Info */}
            <div className="bg-[#0A0C10] border border-white/10 rounded-2xl p-6">
              <h3 className="font-medium text-white mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-400" />
                Comment fonctionnent les commissions
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="p-4 bg-white/[0.02] rounded-xl border border-white/5">
                  <p className="text-sm text-slate-400 mb-1">Commission créateur</p>
                  <p className="text-2xl font-bold text-white">{saasData.commissionConfig.creatorRate}%</p>
                  <p className="text-xs text-slate-500 mt-1">du CA généré</p>
                </div>
                <div className="p-4 bg-white/[0.02] rounded-xl border border-white/5">
                  <p className="text-sm text-slate-400 mb-1">Frais plateforme (votre plan)</p>
                  <p className="text-2xl font-bold text-white">{saasData.tierConfig.platformFee}%</p>
                  <p className="text-xs text-slate-500 mt-1">du CA généré</p>
                </div>
              </div>

              {/* Cost comparison table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left py-3 text-slate-400 font-medium">Pour 1 000€ de CA</th>
                      <th className="text-center py-3 text-slate-400 font-medium">Starter</th>
                      <th className="text-center py-3 text-slate-400 font-medium">Growth</th>
                      <th className="text-center py-3 text-slate-400 font-medium">Scale</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-white/5">
                      <td className="py-3 text-slate-300">Commission créateur</td>
                      <td className="py-3 text-center text-white">150€</td>
                      <td className="py-3 text-center text-white">150€</td>
                      <td className="py-3 text-center text-white">150€</td>
                    </tr>
                    <tr className="border-b border-white/5">
                      <td className="py-3 text-slate-300">Frais plateforme</td>
                      <td className="py-3 text-center text-white">50€</td>
                      <td className="py-3 text-center text-white">30€</td>
                      <td className="py-3 text-center text-white">10€</td>
                    </tr>
                    <tr className="border-b border-white/5">
                      <td className="py-3 text-slate-300">Abonnement</td>
                      <td className="py-3 text-center text-white">0€</td>
                      <td className="py-3 text-center text-white">59€</td>
                      <td className="py-3 text-center text-white">89€</td>
                    </tr>
                    <tr className="bg-green-500/5">
                      <td className="py-3 text-green-400 font-medium">Coût total</td>
                      <td className="py-3 text-center text-green-400 font-medium">200€</td>
                      <td className="py-3 text-center text-green-400 font-medium">239€</td>
                      <td className="py-3 text-center text-green-400 font-medium">249€</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <p className="text-xs text-slate-500 mt-4">
                💡 Le plan Scale devient rentable à partir de ~2 500€/mois de CA généré.
              </p>
            </div>

            {/* Coming soon notice */}
            <div className="bg-[#0A0C10] border border-white/10 rounded-2xl p-6 text-center">
              <div className="w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center mx-auto mb-4">
                <Wallet className="w-8 h-8 text-blue-400" />
              </div>
              <h3 className="text-lg font-medium text-white mb-2">Historique des commissions</h3>
              <p className="text-slate-400 text-sm mb-4">
                L'historique détaillé des commissions apparaîtra ici quand vos créateurs généreront des ventes.
              </p>
            </div>
          </div>
        )}
      </div>
    );
  }

  return null;
}
