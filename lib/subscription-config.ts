// =====================================================
// SUBSCRIPTION CONFIGURATION
// =====================================================

// SaaS Subscription Tiers
export const SAAS_TIERS = {
  starter: {
    id: 'starter',
    name: 'Starter',
    price: 0,
    priceLabel: 'Gratuit',
    maxCreators: 3,
    platformFee: 5, // 5% of revenue
    features: [
      '3 créateurs maximum',
      'Analytics de base',
      'Liens trackés',
      'Support email',
    ],
    recommended: false,
  },
  growth: {
    id: 'growth',
    name: 'Growth',
    price: 59,
    priceLabel: '59€/mois HT',
    maxCreators: 10,
    platformFee: 3, // 3% of revenue
    features: [
      '10 créateurs maximum',
      'Analytics avancés',
      'Visibilité augmentée',
      'Support prioritaire',
    ],
    recommended: true,
  },
  scale: {
    id: 'scale',
    name: 'Scale',
    price: 89,
    priceLabel: '89€/mois HT',
    maxCreators: Infinity,
    platformFee: 1, // 1% of revenue
    features: [
      'Créateurs illimités',
      'Analytics premium',
      'Mise en avant premium',
      'Support dédié',
      'Matching premium',
    ],
    recommended: false,
  },
} as const;

export type SaasTier = keyof typeof SAAS_TIERS;

// Creator Subscription Tiers (only free for now)
export const CREATOR_TIERS = {
  free: {
    id: 'free',
    name: 'Free',
    price: 0,
    priceLabel: 'Gratuit',
    maxSaas: 5,
    features: [
      '5 partenariats SaaS maximum',
      '15% de commission sur les ventes',
      'Liens trackés personnalisés',
      'Paiements via Stripe',
    ],
  },
};

export type CreatorTier = keyof typeof CREATOR_TIERS;

// Commission rates (fixed)
export const COMMISSION_CONFIG = {
  creatorRate: 15, // Creator gets 15% of revenue
  platformCreatorFee: 15, // Platform takes 15% of creator commission (= 2.25% of total)
  minPayoutAmount: 50, // Minimum €50 for payout
} as const;

// Helper functions
export function getSaasTierConfig(tier: SaasTier) {
  return SAAS_TIERS[tier] || SAAS_TIERS.starter;
}

export function getCreatorTierConfig(tier: CreatorTier) {
  return CREATOR_TIERS[tier] || CREATOR_TIERS.free;
}

export function formatMaxCreators(max: number): string {
  return max === Infinity ? 'Illimité' : `${max}`;
}

// Calculate commission breakdown for a sale
export function calculateCommission(revenue: number, saasTier: SaasTier) {
  const tierConfig = getSaasTierConfig(saasTier);
  
  // Creator gets 15% of revenue
  const creatorGross = revenue * (COMMISSION_CONFIG.creatorRate / 100);
  
  // Platform takes 15% of creator's commission
  const platformCreatorFee = creatorGross * (COMMISSION_CONFIG.platformCreatorFee / 100);
  
  // Platform takes X% from SaaS (based on tier)
  const platformSaasFee = revenue * (tierConfig.platformFee / 100);
  
  // Creator net (after platform fee)
  const creatorNet = creatorGross - platformCreatorFee;
  
  return {
    revenue,
    creatorGross: Math.round(creatorGross * 100) / 100,
    creatorNet: Math.round(creatorNet * 100) / 100,
    platformCreatorFee: Math.round(platformCreatorFee * 100) / 100,
    platformSaasFee: Math.round(platformSaasFee * 100) / 100,
    platformTotal: Math.round((platformCreatorFee + platformSaasFee) * 100) / 100,
    saasTotalCost: Math.round((creatorGross + platformSaasFee) * 100) / 100,
  };
}

