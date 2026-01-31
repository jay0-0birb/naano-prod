// =====================================================
// SUBSCRIPTION CONFIGURATION
// =====================================================
// Pricing plans removed: Everyone gets multi-brand dashboard,
// unlimited creators, and qualified links (Lead Feed) analysis.
// SaaS pays only for credits (credit-based model).
// =====================================================

// Single unified config - no tiered plans
export const SAAS_DEFAULT_CONFIG = {
  id: 'default',
  name: 'Naano',
  maxCreators: Infinity,
  platformFee: 1, // 1% of revenue for all
  features: [
    'Créateurs illimités',
    'Multi-brand dashboard',
    'Analytics & Lead Feed',
    'Liens trackés qualifiés',
  ],
} as const;

// Legacy: DB may still have subscription_tier (starter/growth/scale)
// All map to same config - no limits, 1% fee
export const SAAS_TIERS = {
  starter: { ...SAAS_DEFAULT_CONFIG, id: 'starter', name: 'Starter', price: 0, priceLabel: 'Gratuit', recommended: false },
  growth: { ...SAAS_DEFAULT_CONFIG, id: 'growth', name: 'Growth', price: 0, priceLabel: 'Gratuit', recommended: false },
  scale: { ...SAAS_DEFAULT_CONFIG, id: 'scale', name: 'Scale', price: 0, priceLabel: 'Gratuit', recommended: false },
} as const;

export type SaasTier = keyof typeof SAAS_TIERS;

// Creator config - no plans, no partnership cap
export const CREATOR_TIERS = {
  free: {
    id: 'free',
    name: 'Creator',
    maxSaas: Infinity,
    features: [
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

