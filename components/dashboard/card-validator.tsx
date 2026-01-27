'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { CreditCard, AlertCircle } from 'lucide-react';

interface CardValidatorProps {
  cardOnFile: boolean;
  isSaaS: boolean;
  onboardingCompleted: boolean;
}

/**
 * BP1.md: Card required for SaaS before dashboard access
 * Blocks dashboard access if SaaS doesn't have card on file
 */
export default function CardValidator({ 
  cardOnFile, 
  isSaaS, 
  onboardingCompleted 
}: CardValidatorProps) {
  // Card guard is enabled: SaaS must have a card on file
  const ENABLE_CARD_GUARD = true;

  const router = useRouter();
  const pathname = usePathname();

  // Pages that don't require card (even for SaaS)
  const allowedPaths = [
    '/dashboard/settings',
    '/dashboard/onboarding',
    // Allow access to finances page so SaaS can see billing info
    // BP1.md: card is required for charging, but UI should be visible
    '/dashboard/finances',
  ];

  const isAllowedPath = allowedPaths.some(path => pathname?.startsWith(path));

  useEffect(() => {
    if (!ENABLE_CARD_GUARD) {
      return;
    }

    // Only check for SaaS users who completed onboarding
    if (!isSaaS || !onboardingCompleted || isAllowedPath) {
      return;
    }

    // Block access if no card on file
    if (!cardOnFile) {
      // Redirect to settings to add card
      router.push('/dashboard/settings?card_required=true');
    }
  }, [cardOnFile, isSaaS, onboardingCompleted, isAllowedPath, pathname, router]);

  if (!ENABLE_CARD_GUARD) {
    return null;
  }

  // Show blocking message if no card
  if (isSaaS && onboardingCompleted && !cardOnFile && !isAllowedPath) {
    return (
      <div className="fixed inset-0 bg-[#020408] z-50 flex items-center justify-center p-8">
        <div className="max-w-md w-full bg-[#0A0C10] border border-red-500/20 rounded-2xl p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
            <CreditCard className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-2xl font-semibold text-white mb-2">
            Carte bancaire requise
          </h2>
          <p className="text-slate-400 mb-6">
            Vous devez ajouter une carte bancaire pour accéder au dashboard.
            C'est une exigence de sécurité pour utiliser Naano.
          </p>
          <button
            onClick={() => router.push('/dashboard/settings?card_required=true')}
        className="w-full bg-[#111827] hover:bg-[#020617] text-white font-medium py-3 px-6 rounded-xl transition-colors"
          >
            Ajouter une carte
          </button>
        </div>
      </div>
    );
  }

  return null;
}

