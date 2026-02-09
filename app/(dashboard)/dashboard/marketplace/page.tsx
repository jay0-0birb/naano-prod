import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import SaasCard from "@/components/marketplace/saas-card";
import { SAAS_TIERS, SaasTier } from "@/lib/subscription-config";
import CreatorMarketplaceClient, {
  CreatorMarketplaceCreator,
} from "@/components/marketplace/creator-marketplace-client";
import SaasMarketplaceClient from "@/components/marketplace/saas-marketplace-client";

export default async function MarketplacePage() {
  const t = await getTranslations("dashboard");
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Get user profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, onboarding_completed")
    .eq("id", user.id)
    .single();

  const isCreator = profile?.role === "influencer";

  // Fetch data based on role
  if (isCreator) {
    // Creator view: Browse SaaS companies
    const [creatorProfileResult, companiesResult] = await Promise.all([
      supabase
        .from("creator_profiles")
        .select("id")
        .eq("profile_id", user.id)
        .single(),
      supabase
        .from("saas_companies")
        .select(
          `
        *,
        wallet_credits,
        credit_renewal_date,
        subscription_tier,
        profiles:profile_id (
          id,
          full_name,
          avatar_url
        )
      `,
        )
        .order("created_at", { ascending: false }),
    ]);

    const creatorProfile = creatorProfileResult.data;
    const companies = (companiesResult.data || []) as any;

    // Compute active creators per SaaS to know if they're at capacity
    let activeCreatorsBySaas: Record<string, number> = {};
    if (companies.length > 0) {
      const saasIds = companies.map((c: any) => c.id);

      const { data: collabs } = await supabase
        .from("collaborations")
        .select(
          `
        application_id,
        status,
        applications!inner(
          creator_id,
          saas_id
        )
      `,
        )
        .in("applications.saas_id", saasIds)
        .eq("status", "active");

      if (collabs) {
        const map: Record<string, Set<string>> = {};
        for (const row of collabs as any[]) {
          const app = row.applications;
          if (!app?.saas_id || !app?.creator_id) continue;
          if (!map[app.saas_id]) map[app.saas_id] = new Set();
          map[app.saas_id].add(app.creator_id);
        }
        activeCreatorsBySaas = Object.fromEntries(
          Object.entries(map).map(([saasId, set]) => [
            saasId,
            (set as Set<string>).size,
          ]),
        );
      }
    }

    // Get applications if creator profile exists
    let appliedSaasIds: string[] = [];
    if (creatorProfile) {
      const { data: applications } = await supabase
        .from("applications")
        .select("saas_id")
        .eq("creator_id", creatorProfile.id);

      appliedSaasIds = applications?.map((a) => a.saas_id) || [];
    }

    return (
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-semibold text-[#111827] mb-1">
              {t("saasMarketplace")}
            </h2>
            <p className="text-[#64748B] text-sm">{t("discoverSaaSApply")}</p>
          </div>
        </div>

        <SaasMarketplaceClient
          companies={companies}
          activeCreatorsBySaas={activeCreatorsBySaas}
          appliedSaasIds={appliedSaasIds}
          creatorProfileId={creatorProfile?.id || null}
        />
      </div>
    );
  } else {
    // SaaS view: Browse Creators
    const [saasCompanyResult, creatorsResult] = await Promise.all([
      supabase
        .from("saas_companies")
        .select("id, wallet_credits")
        .eq("profile_id", user.id)
        .single(),
      supabase
        .from("creator_profiles")
        .select(
          `
          *,
          is_pro,
          profiles:profile_id (
            id,
            full_name,
            avatar_url,
            email
          )
        `,
        )
        .order("is_pro", { ascending: false }) // Pro creators first
        .order("created_at", { ascending: false }),
    ]);

    const saasCompany = saasCompanyResult.data;
    const creators = (creatorsResult.data ||
      []) as CreatorMarketplaceCreator[];

    // Get existing applications/invites if saas company exists
    let invitedCreatorIds: string[] = [];
    if (saasCompany) {
      const { data: applications } = await supabase
        .from("applications")
        .select("creator_id")
        .eq("saas_id", saasCompany.id);

      invitedCreatorIds = applications?.map((a) => a.creator_id) || [];
    }

    return (
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-semibold text-[#111827] mb-1">
              {t("creatorMarketplace")}
            </h2>
            <p className="text-[#64748B] text-sm">
              {t("discoverCreatorsInvite")}
            </p>
          </div>
        </div>

        <CreatorMarketplaceClient
          creators={creators}
          invitedCreatorIds={invitedCreatorIds}
          saasCompanyId={saasCompany?.id || null}
          walletCredits={saasCompany?.wallet_credits ?? 0}
        />
      </div>
    );
  }
}
