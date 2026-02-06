"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

interface OnboardingGuardProps {
  onboardingCompleted: boolean;
  children: React.ReactNode;
}

const ONBOARDING_PATH = "/dashboard/onboarding";
const ENABLE_ONBOARDING_GUARD = false;

/**
 * Redirects to /dashboard/onboarding when the user has not completed their profile,
 * so other dashboard pages don't load and cause broken state (e.g. RSC/access issues).
 */
export default function OnboardingGuard({
  onboardingCompleted,
  children,
}: OnboardingGuardProps) {
  // When disabled, just render children and rely on soft UI nudges (e.g. sidebar banner)
  if (!ENABLE_ONBOARDING_GUARD) {
    return <>{children}</>;
  }

  const router = useRouter();
  const pathname = usePathname();

  const isOnOnboardingPage =
    pathname === ONBOARDING_PATH ||
    pathname?.startsWith(`${ONBOARDING_PATH}/`);

  const shouldRedirect =
    !onboardingCompleted && pathname?.startsWith("/dashboard") && !isOnOnboardingPage;

  useEffect(() => {
    if (shouldRedirect) {
      router.replace(ONBOARDING_PATH);
    }
  }, [shouldRedirect, router]);

  if (shouldRedirect) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-[#111827]">
        <p className="text-sm text-gray-500">Redirecting to complete your profile…</p>
      </div>
    );
  }

  return <>{children}</>;
}
