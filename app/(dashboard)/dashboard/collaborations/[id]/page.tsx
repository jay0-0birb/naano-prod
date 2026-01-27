import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  Users,
  MessageSquare,
  ExternalLink,
} from "lucide-react";
import TrackingLinkCardV2 from "@/components/collaborations/tracking-link-card-v2";
import { getOrCreateTrackingLink } from "./actions-v2";
import CollaborationTabs from "./collaboration-tabs";
import BudgetWidget from "@/components/collaborations/budget-widget";
import BrandSelector from "@/components/collaborations/brand-selector";
import CollaborationActions from "@/components/collaborations/collaboration-actions";

interface PageProps {
  params: Promise<{ id: string }>;
}

interface PublicationProof {
  id: string;
  linkedin_post_url: string;
  screenshot_url: string | null;
  submitted_at: string;
  validated: boolean;
  validated_at: string | null;
}

export default async function CollaborationDetailPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, onboarding_completed")
    .eq("id", user.id)
    .single();

  if (!profile?.onboarding_completed) {
    redirect("/dashboard/onboarding");
  }

  const isCreator = profile?.role === "influencer";

  // Get collaboration with all details
  const { data: collaboration } = await supabase
    .from("collaborations")
    .select(
      `
      *,
      applications:application_id (
        id,
        creator_profiles:creator_id (
          id,
          profile_id,
          bio,
          linkedin_url,
          followers_count,
          profiles:profile_id (
            id,
            full_name,
            avatar_url
          )
        ),
        saas_companies:saas_id (
          id,
          profile_id,
          company_name,
          logo_url,
          industry,
          website,
          commission_rate,
          description,
          subscription_tier,
          wallet_credits,
          credit_renewal_date,
          profiles:profile_id (
            id,
            full_name
          )
        )
      ),
      conversations (
        id
      ),
      publication_proofs (
        id,
        linkedin_post_url,
        screenshot_url,
        submitted_at,
        validated,
        validated_at
      )
    `
    )
    .eq("id", id)
    .single();

  if (!collaboration) {
    notFound();
  }

  // Verify access
  const app = collaboration.applications;
  const creatorProfileId = app?.creator_profiles?.profile_id;
  const saasProfileId = app?.saas_companies?.profile_id;

  if (user.id !== creatorProfileId && user.id !== saasProfileId) {
    redirect("/dashboard/collaborations");
  }

  const partner = isCreator ? app?.saas_companies : app?.creator_profiles;
  const partnerProfile = partner?.profiles;
  const conversation = collaboration.conversations?.[0];
  const posts: PublicationProof[] = collaboration.publication_proofs || [];

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const pendingPosts = posts.filter((p) => !p.validated);
  const validatedPosts = posts.filter((p) => p.validated);

  // Get or create tracking link for this collaboration
  const trackingLinkResult = await getOrCreateTrackingLink(collaboration.id);
  const trackingLink = trackingLinkResult.success
    ? trackingLinkResult.link
    : null;
  const impressions = trackingLinkResult.success
    ? (trackingLinkResult.impressions as number)
    : 0;
  const clicks = trackingLinkResult.success
    ? (trackingLinkResult.clicks as number)
    : 0;
  const revenue = trackingLinkResult.success
    ? (trackingLinkResult.revenue as number)
    : 0;

  // Multi-brand: fetch all brands for this SaaS (SaaS view only)
  let brands: { id: string; name: string; main_url: string }[] = [];
  if (!isCreator && app?.saas_companies?.id) {
    const { data: brandRows } = await supabase
      .from("saas_brands")
      .select("id, name, main_url")
      .eq("saas_id", app.saas_companies.id);
    brands = (brandRows || []) as any;
  }

  const subscriptionTier = app?.saas_companies?.subscription_tier || "starter";
  const isScale = subscriptionTier === "scale";
  const currentBrandId = (collaboration as any)?.brand_id || null;
  const defaultUrl = app?.saas_companies?.website || null;

  return (
    <div className="max-w-4xl">
      {/* Back Link */}
      <Link
        href="/dashboard/collaborations"
        className="inline-flex items-center gap-2 text-[#64748B] hover:text-[#111827] transition-colors mb-6 text-sm"
      >
        <ArrowLeft className="w-4 h-4" />
        Retour aux collaborations
      </Link>

      {/* Header */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            {isCreator ? (
              partner?.logo_url ? (
                <img
                  src={partner.logo_url}
                  alt={partner.company_name}
                  className="w-16 h-16 rounded-xl object-cover border border-gray-200"
                />
              ) : (
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-50 to-purple-50 border border-gray-200 flex items-center justify-center">
                  <Building2 className="w-8 h-8 text-[#3B82F6]" />
                </div>
              )
            ) : partnerProfile?.avatar_url ? (
              <img
                src={partnerProfile.avatar_url}
                alt={partnerProfile.full_name}
                className="w-16 h-16 rounded-xl object-cover border border-gray-200"
              />
            ) : (
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-purple-50 to-pink-50 border border-gray-200 flex items-center justify-center">
                <Users className="w-8 h-8 text-purple-500" />
              </div>
            )}

            <div>
              <h1 className="text-xl font-semibold text-[#111827] mb-1">
                Collaboration avec{" "}
                {isCreator ? partner?.company_name : partnerProfile?.full_name}
              </h1>
              <div className="flex items-center gap-3">
                {isCreator ? (
                  <>
                    <span className="text-sm text-[#64748B]">
                      {partner?.industry}
                    </span>
                    {partner?.commission_rate && (
                      <span className="text-sm font-medium text-emerald-600">
                        {partner.commission_rate}% commission
                      </span>
                    )}
                  </>
                ) : (
                  <span className="text-sm text-[#64748B]">
                    {partner?.followers_count?.toLocaleString()} followers
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isCreator && partner?.website && (
              <a
                href={partner.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 hover:bg-gray-50 text-[#111827] rounded-lg text-sm transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                Site web
              </a>
            )}
            {conversation && (
              <Link
                href={`/dashboard/messages?conversation=${conversation.id}`}
                className="flex items-center gap-2 px-3 py-1.5 bg-[#0F172A] hover:bg-[#020617] text-white rounded-lg text-sm transition-colors"
              >
                <MessageSquare className="w-4 h-4" />
                Messages
              </Link>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-100">
          <div>
            <div className="text-2xl font-semibold text-[#111827]">
              {posts.length}
            </div>
            <div className="text-xs text-[#94A3B8] uppercase tracking-wide mt-1">
              Posts soumis
            </div>
          </div>
          <div>
            <div className="text-2xl font-semibold text-emerald-600">
              {validatedPosts.length}
            </div>
            <div className="text-xs text-[#94A3B8] uppercase tracking-wide mt-1">
              Posts validés
            </div>
          </div>
          <div>
            <div className="text-2xl font-semibold text-amber-600">
              {pendingPosts.length}
            </div>
            <div className="text-xs text-[#94A3B8] uppercase tracking-wide mt-1">
              En attente
            </div>
          </div>
        </div>
      </div>

      {/* Collaboration tools & metrics */}
      <div className="mt-8 mb-10 space-y-6">
        {/* Collaboration actions (cancel / request) */}
        <CollaborationActions
          collaborationId={collaboration.id}
          status={collaboration.status}
          isCreator={isCreator}
          cancelRequestedBy={
            (collaboration as any)?.cancel_requested_by as
              | "creator"
              | "saas"
              | null
          }
          cancelReason={(collaboration as any)?.cancel_reason || null}
        />

        {/* Brand selector (SaaS only) */}
        {!isCreator && (
          <BrandSelector
            collaborationId={collaboration.id}
            brands={brands}
            currentBrandId={currentBrandId}
            defaultUrl={defaultUrl}
            isScale={isScale}
          />
        )}

        {/* Budget Widget (visible to creators) */}
        {isCreator &&
          collaboration.status === "active" &&
          app?.saas_companies && (
            <div>
              <BudgetWidget
                walletCredits={app.saas_companies.wallet_credits || 0}
                renewalDate={app.saas_companies.credit_renewal_date || null}
                saasCompanyName={app.saas_companies.company_name}
              />
            </div>
          )}

        {/* Tracking Link Section */}
        {trackingLink && collaboration.status === "active" && (
          <div>
            <TrackingLinkCardV2
              hash={trackingLink.hash}
              impressions={impressions}
              clicks={clicks}
              revenue={revenue}
              isCreator={isCreator}
              trackImpressions={trackingLink.track_impressions ?? true}
              trackClicks={trackingLink.track_clicks ?? true}
              trackRevenue={trackingLink.track_revenue ?? true}
            />
          </div>
        )}

        {/* Error message if tracking link couldn't be created */}
        {!trackingLink && trackingLinkResult.error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
            <p className="text-sm text-red-400">⚠️ {trackingLinkResult.error}</p>
          </div>
        )}
      </div>

      {/* Tabs Content */}
      <CollaborationTabs
        collaborationId={collaboration.id}
        isCreator={isCreator}
        isSaaS={!isCreator}
        subscriptionTier={app?.saas_companies?.subscription_tier || null}
        posts={posts}
        collaborationStatus={collaboration.status}
        initialTab="posts"
        saasWalletCredits={
          isCreator ? app?.saas_companies?.wallet_credits || 0 : undefined
        }
      />
    </div>
  );
}
