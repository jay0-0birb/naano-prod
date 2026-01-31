"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { notifyPostSubmitted } from "@/lib/notifications";

export async function submitPost(
  collaborationId: string,
  linkedinPostUrl: string
) {
  const supabase = await createClient();
  
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Non authentifié" };
  }

  // Verify the user is the creator of this collaboration
  const { data: collaboration } = await supabase
    .from("collaborations")
    .select(
      `
      id,
      status,
      applications:application_id (
        creator_profiles:creator_id (
          profile_id
        )
      )
    `
    )
    .eq("id", collaborationId)
    .single();

  if (!collaboration) {
    return { error: "Collaboration non trouvée" };
  }

  if (collaboration.status !== "active") {
    return { error: "Cette collaboration n'est plus active" };
  }

  const creatorProfileId = (collaboration.applications as any)?.creator_profiles
    ?.profile_id;
  if (creatorProfileId !== user.id) {
    return { error: "Non autorisé" };
  }

  // Validate LinkedIn URL
  if (!linkedinPostUrl.includes("linkedin.com/")) {
    return { error: "URL LinkedIn invalide" };
  }

  // Check if this URL was already submitted
  const { data: existingProof } = await supabase
    .from("publication_proofs")
    .select("id")
    .eq("collaboration_id", collaborationId)
    .eq("linkedin_post_url", linkedinPostUrl)
    .single();

  if (existingProof) {
    return { error: "Ce post a déjà été soumis" };
  }

  // CREDIT SYSTEM: Check if SaaS has credits available
  const { data: saasCompany } = await supabase
    .from("collaborations")
    .select(`
      applications:application_id (
        saas_companies:saas_id (
          id,
          wallet_credits,
          company_name
        )
      )
    `)
    .eq("id", collaborationId)
    .single();

  const saas = (saasCompany?.applications as any)?.saas_companies;
  const walletCredits = saas?.wallet_credits || 0;

  if (walletCredits <= 0) {
    return { 
      error: `Budget épuisé. ${saas?.company_name || "Le SaaS"} n'a plus de crédits disponibles. Les posts ne peuvent pas être soumis jusqu'à ce que le budget soit renouvelé.` 
    };
  }

  // Create the proof (no validation step - posts are auto-confirmed)
  const { error } = await supabase.from("publication_proofs").insert({
      collaboration_id: collaborationId,
      linkedin_post_url: linkedinPostUrl,
      validated: true,
      validated_at: new Date().toISOString(),
  });

  if (error) {
    return { error: error.message };
  }

  // Notify SaaS that a post was submitted
  notifyPostSubmitted(collaborationId).catch(console.error);

  revalidatePath(`/dashboard/collaborations/${collaborationId}`);
  return { success: true };
}

/**
 * Generate or retrieve tracking link for a collaboration
 * Format: /c/[CREATOR_ID]-[SAAS_ID]-[UNIQUE_HASH]
 */
export async function getOrCreateTrackingLink(collaborationId: string) {
  const supabase = await createClient();
  
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Non authentifié" };
  }

  // Get collaboration details (used to determine destination URL and validate access)
  const { data: collaboration } = await supabase
    .from("collaborations")
    .select(
      `
      id,
      brand_id,
      applications:application_id (
        creator_id,
        saas_id,
        creator_profiles:creator_id (
          id,
          profiles:profile_id (
            full_name
          )
        ),
        saas_companies:saas_id (
          id,
          profile_id,
          company_name,
          website,
          subscription_tier
        )
      ),
      saas_brands (
        id,
        name,
        main_url
      )
    `
    )
    .eq("id", collaborationId)
    .single();

  if (!collaboration) {
    return { error: "Collaboration non trouvée" };
  }

  // Determine destination URL:
  // - If collaboration has a brand with main_url, use it
  // - Otherwise fall back to SaaS website
  const saasWebsite = (collaboration.applications as any)?.saas_companies
    ?.website;
  const brand = (collaboration as any)?.saas_brands;
  const destinationUrl = brand?.main_url || saasWebsite;

  if (!destinationUrl) {
    return { error: "Le SaaS n'a pas de lien de destination configuré" };
  }

  // Get creator and SaaS IDs
  const creatorId = (collaboration.applications as any)?.creator_id;
  const saasId = (collaboration.applications as any)?.saas_id;
  const saasProfileId = (collaboration.applications as any)?.saas_companies
    ?.profile_id;

  if (!creatorId || !saasId) {
    return { error: "Données de collaboration invalides" };
  }

  // Get SaaS tracking preferences
  const { data: trackingConfig } = await supabase
    .from("saas_tracking_config")
    .select("track_impressions, track_clicks, track_revenue")
    .eq("saas_id", saasId)
    .single();

  // Get creator and SaaS names for readable hash
  const creatorName =
    (collaboration.applications as any)?.creator_profiles?.profiles
      ?.full_name || "creator";
  const saasName =
    (collaboration.applications as any)?.saas_companies?.company_name || "saas";

  // Check if a tracking link already exists for this collaboration
  const { data: existingLink } = await supabase
    .from("tracked_links")
    .select(
      "id, hash, destination_url, track_impressions, track_clicks, track_revenue"
    )
    .eq("collaboration_id", collaborationId)
    .single();

  const isSaasOwner = saasProfileId === user.id;

  if (existingLink) {
    let finalLink = existingLink;

    // If the brand / website changed AND the current user is the SaaS owner,
    // we want a NEW tracked link (new hash) so creators get a different URL
    // per promoted product. Creators loading the page should *not* reset
    // the destination back to the default if they can't see the brand.
    if (isSaasOwner && existingLink.destination_url !== destinationUrl) {
      // Create URL-friendly slugs (lowercase, no spaces, no special chars)
      const creatorSlug = creatorName
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // Remove accents
        .replace(/[^a-z0-9]+/g, "-") // Replace non-alphanumeric with dashes
        .replace(/^-|-$/g, "") // Remove leading/trailing dashes
        .substring(0, 20); // Max 20 chars

      const saasSlug = saasName
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
        .substring(0, 20);

      let hash = "";
      let isUnique = false;
      let attempts = 0;
      const maxAttempts = 10;

      while (!isUnique && attempts < maxAttempts) {
        const randomPart = Math.random().toString(36).substring(2, 8).toLowerCase();
        hash = `${creatorSlug}-${saasSlug}-${randomPart}`;

        const { data: existing } = await supabase
          .from("tracked_links")
          .select("id")
          .eq("hash", hash)
          .single();

        if (!existing) {
          isUnique = true;
        }
        attempts++;
      }

      if (!isUnique) {
        return { error: "Impossible de générer un lien unique" };
      }

      const { data: updated, error: updateError } = await supabase
        .from("tracked_links")
        .update({
          destination_url: destinationUrl,
          hash,
        })
        .eq("id", existingLink.id)
        .select(
          "id, hash, destination_url, track_impressions, track_clicks, track_revenue"
        )
        .single();

      if (!updateError && updated) {
        finalLink = updated;
      }
    }

    // Get metrics for this collaboration
    const { data: metrics } = await supabase
      .rpc("get_collaboration_metrics", {
        collab_id: collaborationId,
      })
      .single();

    const metricsData = metrics as {
      impressions?: number;
      clicks?: number;
      revenue?: number;
    } | null;

    return {
      success: true,
      link: finalLink,
      impressions: metricsData?.impressions || 0,
      clicks: metricsData?.clicks || 0,
      revenue: metricsData?.revenue || 0,
    };
  }

  // No link yet: create a new one with a unique hash
  // Create URL-friendly slugs (lowercase, no spaces, no special chars)
  const creatorSlug = creatorName
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove accents
    .replace(/[^a-z0-9]+/g, "-") // Replace non-alphanumeric with dashes
      .replace(/^-|-$/g, "") // Remove leading/trailing dashes
      .substring(0, 20); // Max 20 chars

  const saasSlug = saasName
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
      .substring(0, 20);

  // Generate unique hash with format: creator-name-saas-name-randomhash
  let hash = "";
  let isUnique = false;
  let attempts = 0;
  const maxAttempts = 10;

  while (!isUnique && attempts < maxAttempts) {
    // Generate 6-character random hash
    const randomPart = Math.random().toString(36).substring(2, 8).toLowerCase();
    hash = `${creatorSlug}-${saasSlug}-${randomPart}`;
    
    // Check if hash already exists
    const { data: existing } = await supabase
      .from("tracked_links")
      .select("id")
      .eq("hash", hash)
      .single();

    if (!existing) {
      isUnique = true;
    }
    attempts++;
  }

  if (!isUnique) {
    return { error: "Impossible de générer un lien unique" };
  }

  // Create tracking link - ALWAYS track everything
  const { data: newLink, error } = await supabase
      .from("tracked_links")
      .insert({
        collaboration_id: collaborationId,
        hash: hash,
        destination_url: destinationUrl,
        track_impressions: true, // Always ON
        track_clicks: true, // Always ON
        track_revenue: true, // Always ON
      })
    .select(
      "id, hash, destination_url, track_impressions, track_clicks, track_revenue"
    )
    .single();

  if (error) {
    return { error: error.message };
  }

  return { 
    success: true, 
    link: newLink,
    impressions: 0,
    clicks: 0,
    revenue: 0,
  };
}

/**
 * Get analytics data for a collaboration
 * Returns KPIs: impressions, total clicks, qualified clicks, leads, savings
 */
export async function getCollaborationAnalytics(collaborationId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Non authentifié" };
  }

  // Verify access - only SaaS can view analytics
  const { data: collaboration } = await supabase
    .from("collaborations")
    .select(
      `
      id,
      applications:application_id (
        saas_companies:saas_id (
          profile_id,
          subscription_tier
        )
      )
    `
    )
    .eq("id", collaborationId)
    .single();

  if (!collaboration) {
    return { error: "Collaboration non trouvée" };
  }

  const saasProfileId = (collaboration.applications as any)?.saas_companies
    ?.profile_id;
  if (saasProfileId !== user.id) {
    return { error: "Non autorisé - Analytics réservés aux SaaS" };
  }

  // Get analytics using the database function
  const { data: analytics, error } = await supabase
    .rpc("get_collaboration_analytics", {
      collab_id: collaborationId,
    })
    .single();

  if (error) {
    console.error("Error fetching analytics:", error);
    return { error: "Erreur lors de la récupération des analytics" };
  }

  // Type assertion for RPC return type
  const analyticsData = analytics as {
    total_impressions?: number;
    total_clicks?: number;
    qualified_clicks?: number;
    leads_count?: number;
    total_lead_cost?: number;
    savings_vs_linkedin?: number;
  } | null;

  return {
    success: true,
    analytics: {
      totalImpressions: analyticsData?.total_impressions || 0,
      totalClicks: analyticsData?.total_clicks || 0,
      qualifiedClicks: analyticsData?.qualified_clicks || 0,
      leadsCount: analyticsData?.leads_count || 0,
      totalLeadCost: Number(analyticsData?.total_lead_cost || 0),
      savingsVsLinkedIn: Number(analyticsData?.savings_vs_linkedin || 0),
    },
  };
}

/**
 * Get leads with three-layer attribution data for a collaboration
 * Returns leads with Layer 1 (session), Layer 2 (company), Layer 3 (intent)
 *
 * @param sortBy - 'date' | 'confidence' | 'intent' | 'company_intent'
 * @param filterConfirmed - Only show confirmed companies
 * @param filterHighConfidence - Only show confidence >= 0.7
 */
export async function getCollaborationLeads(
  collaborationId: string,
  sortBy: "date" | "confidence" | "intent" | "company_intent" = "date",
  filterConfirmed: boolean = false,
  filterHighConfidence: boolean = false
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Non authentifié" };
  }

  // Verify access - only SaaS can view leads (Growth/Scale tiers)
  const { data: collaboration } = await supabase
    .from("collaborations")
    .select(
      `
      id,
      applications:application_id (
        saas_companies:saas_id (
          profile_id,
          subscription_tier
        )
      )
    `
    )
    .eq("id", collaborationId)
    .single();

  if (!collaboration) {
    return { error: "Collaboration non trouvée" };
  }

  const saasProfileId = (collaboration.applications as any)?.saas_companies
    ?.profile_id;
  const subscriptionTier = (collaboration.applications as any)?.saas_companies
    ?.subscription_tier;

  if (saasProfileId !== user.id) {
    return { error: "Non autorisé - Lead Feed réservé aux SaaS" };
  }

  // Lead Feed available to all SaaS (no plan restrictions)

  // Get tracked link for this collaboration
  const { data: trackedLink } = await supabase
    .from("tracked_links")
    .select("id")
    .eq("collaboration_id", collaborationId)
    .single();

  if (!trackedLink) {
    return { success: true, leads: [] };
  }

  // Build base query
  let query = supabase
    .from("link_events")
    .select(
      `
      id,
      session_id,
      occurred_at,
      ip_address,
      user_agent,
      referrer,
      country,
      city,
      time_on_site,
      device_type,
      os,
      browser,
      network_type,
      company_inferences (
        id,
        inferred_company_name,
        inferred_company_domain,
        inferred_industry,
        inferred_company_size,
        inferred_location,
        confidence_score,
        confidence_reasons,
        attribution_state,
        asn_organization,
        is_ambiguous,
        created_at,
        confirmed_at
      ),
      intent_scores (
        id,
        session_intent_score,
        is_repeat_visit,
        visit_count,
        viewed_pricing,
        viewed_security,
        viewed_integrations,
        intent_signals,
        recency_weight,
        days_since_session
      )
    `
    )
    .eq("tracked_link_id", trackedLink.id)
    .eq("event_type", "click");
    // Note: We filter out clicks without company inference in the mapping step below

  // Apply filters
  if (filterConfirmed) {
    query = query.eq("company_inferences.attribution_state", "confirmed");
  }

  if (filterHighConfidence) {
    query = query.gte("company_inferences.confidence_score", 0.7);
  }

  // Apply sorting
  if (sortBy === "confidence") {
    query = query.order("company_inferences.confidence_score", {
      ascending: false,
      foreignTable: "company_inferences",
    });
  } else if (sortBy === "intent") {
    query = query.order("session_intent_score", {
      ascending: false,
      foreignTable: "intent_scores",
    });
  } else {
    query = query.order("occurred_at", { ascending: false });
  }

  const { data: clickEvents, error } = await query.limit(100);

  if (error) {
    console.error("Error fetching leads:", error);
    console.error("Error details:", JSON.stringify(error, null, 2));
    return { 
      error: "Erreur lors de la récupération des leads",
      details: error.message 
    };
  }

  // Get creator name for each lead
  const { data: collaborationData } = await supabase
    .from("collaborations")
    .select(
      `
      id,
      applications:application_id (
        creator_profiles:creator_id (
          profiles:profile_id (
            full_name
          )
        )
      )
    `
    )
    .eq("id", collaborationId)
    .single();

  const creatorName =
    (collaborationData?.applications as any)?.creator_profiles?.profiles
      ?.full_name || "Unknown";

  // Get company-level aggregated intent for each unique company (Issue 3.2)
  const companyAggregates = new Map<string, any>();

  if (clickEvents && clickEvents.length > 0) {
    const uniqueCompanies = new Set(
      clickEvents
        .map((e: any) => {
          const ci = e.company_inferences?.[0] || e.company_inferences;
          return ci?.inferred_company_name;
        })
        .filter(Boolean)
    );

    for (const companyName of uniqueCompanies) {
      try {
        const { data: aggregate } = await supabase
          .rpc("get_company_aggregated_intent", {
            company_name: companyName,
            tracked_link_id: trackedLink.id,
          })
          .single();

        if (aggregate) {
          companyAggregates.set(companyName, aggregate);
        }
      } catch (err) {
        console.error(`Error fetching aggregate for ${companyName}:`, err);
      }
    }
  }

  // Format leads data - only include clicks with company inference (confidence >= 0.3)
  const leads = (clickEvents || [])
    .filter((event: any) => {
      const companyInference = event.company_inferences?.[0] || event.company_inferences;
      // Only show clicks with company inference (confidence >= 0.3 requirement)
      return companyInference && companyInference.inferred_company_name;
    })
    .map((event: any) => {
    const companyInference =
      event.company_inferences?.[0] || event.company_inferences;
    const intentScore = event.intent_scores?.[0] || event.intent_scores;

    return {
      id: event.id,
      occurredAt: event.occurred_at,
      // Layer 1: Session Intelligence
      session: {
        sessionId: event.session_id,
        ipAddress: event.ip_address,
        country: event.country,
        city: event.city,
        deviceType: event.device_type,
        os: event.os,
        browser: event.browser,
        referrer: event.referrer,
        timeOnSite: event.time_on_site,
        networkType: event.network_type,
      },
      // Layer 2: Company Inference
      company: companyInference
        ? {
            name: companyInference.inferred_company_name,
            domain: companyInference.inferred_company_domain,
            industry: companyInference.inferred_industry,
            size: companyInference.inferred_company_size,
            location: companyInference.inferred_location,
            confidenceScore: companyInference.confidence_score,
            effectiveConfidenceScore: null, // Will be calculated client-side or via RPC
            confidenceReasons: companyInference.confidence_reasons || [],
            attributionState: companyInference.attribution_state,
            asnOrganization: companyInference.asn_organization,
            isAmbiguous: companyInference.is_ambiguous || false,
            createdAt: companyInference.created_at,
            confirmedAt: companyInference.confirmed_at,
            // Company-level aggregated intent (Issue 3.2)
            aggregatedIntent:
              companyAggregates.get(companyInference.inferred_company_name) ||
              null,
          }
        : null,
      // Layer 3: Intent Score
      intent: intentScore
        ? {
            score: intentScore.session_intent_score,
            isRepeatVisit: intentScore.is_repeat_visit,
            visitCount: intentScore.visit_count,
            viewedPricing: intentScore.viewed_pricing,
            viewedSecurity: intentScore.viewed_security,
            viewedIntegrations: intentScore.viewed_integrations,
            signals: intentScore.intent_signals,
            recencyWeight: intentScore.recency_weight || 1.0,
            daysSinceSession: intentScore.days_since_session,
          }
        : null,
      // Creator source
      creatorName,
    };
  });

  return {
    success: true,
    leads,
  };
}
