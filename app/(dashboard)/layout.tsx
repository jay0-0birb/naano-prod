import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { getClientIP } from "@/lib/get-client-ip";
import DashboardShell from "@/components/dashboard/dashboard-shell";
import SessionValidator from "@/components/dashboard/session-validator";
import CardValidator from "@/components/dashboard/card-validator";
import OnboardingGuard from "@/components/dashboard/onboarding-guard";

const CREATOR_IP_UPDATE_INTERVAL_MS = 60 * 60 * 1000; // 1 hour

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get user profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  // Record creator's IP for Naano promo self-click protection (throttled to once per hour)
  if (profile?.role === "influencer") {
    try {
      const h = await headers();
      const ip = getClientIP(h);
      if (ip && ip !== "local") {
        const { data: creator } = await supabase
          .from("creator_profiles")
          .select("id, last_seen_ip, last_seen_ip_at")
          .eq("profile_id", user.id)
          .maybeSingle();
        if (creator) {
          const lastAt = creator.last_seen_ip_at
            ? new Date(creator.last_seen_ip_at).getTime()
            : 0;
          const now = Date.now();
          const shouldUpdate =
            !creator.last_seen_ip_at ||
            now - lastAt > CREATOR_IP_UPDATE_INTERVAL_MS ||
            creator.last_seen_ip !== ip;
          if (shouldUpdate) {
            await supabase
              .from("creator_profiles")
              .update({
                last_seen_ip: ip,
                last_seen_ip_at: new Date().toISOString(),
              })
              .eq("id", creator.id);
          }
        }
      }
    } catch {
      // Non-fatal; don't block dashboard load
    }
  }

  // Get card status for SaaS (admins skip this)
  let cardOnFile = true; // Default to true (creators don't need card)
  if (profile?.role === "saas") {
    const { data: saasCompany } = await supabase
      .from("saas_companies")
      .select("card_on_file")
      .eq("profile_id", user.id)
      .single();

    cardOnFile = saasCompany?.card_on_file || false;
  }

  const isAdmin = profile?.role === "admin";

  return (
    <div
      className="flex min-h-screen bg-gray-50 text-[#111827] dashboard-layout"
      style={{ fontFamily: "Satoshi, sans-serif" }}
    >
      <SessionValidator userId={user.id} />
      <CardValidator
        cardOnFile={cardOnFile}
        isSaaS={profile?.role === "saas"}
        onboardingCompleted={isAdmin ? true : (profile?.onboarding_completed || false)}
      />
      <DashboardShell
        role={profile?.role || "saas"}
        onboardingCompleted={isAdmin ? true : (profile?.onboarding_completed || false)}
        userId={user.id}
        userName={profile?.full_name || user.email || "User"}
        avatarUrl={profile?.avatar_url}
      >
        {isAdmin ? (
          children
        ) : (
          <OnboardingGuard
            onboardingCompleted={profile?.onboarding_completed ?? false}
          >
            {children}
          </OnboardingGuard>
        )}
      </DashboardShell>
    </div>
  );
}
