"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { notifyPostSubmitted, notifyPostValidated } from "@/lib/notifications";

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

  // Create the proof
  const { error } = await supabase.from("publication_proofs").insert({
    collaboration_id: collaborationId,
    linkedin_post_url: linkedinPostUrl,
  });

  if (error) {
    return { error: error.message };
  }

  // Notify SaaS that a post was submitted
  notifyPostSubmitted(collaborationId).catch(console.error);

  revalidatePath(`/dashboard/collaborations/${collaborationId}`);
  return { success: true };
}

export async function validatePost(proofId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Non authentifié" };
  }

  // Get the proof and verify the user is the SaaS owner
  const { data: proof } = await supabase
    .from("publication_proofs")
    .select(
      `
      id,
      collaboration_id,
      collaborations:collaboration_id (
        applications:application_id (
          saas_companies:saas_id (
            profile_id
          )
        )
      )
    `
    )
    .eq("id", proofId)
    .single();

  if (!proof) {
    return { error: "Preuve non trouvée" };
  }

  const saasProfileId = (proof.collaborations as any)?.applications
    ?.saas_companies?.profile_id;
  if (saasProfileId !== user.id) {
    return { error: "Non autorisé" };
  }

  // Validate the proof
  const { error } = await supabase
    .from("publication_proofs")
    .update({
      validated: true,
      validated_at: new Date().toISOString(),
    })
    .eq("id", proofId);

  if (error) {
    return { error: error.message };
  }

  // Notify creator that their post was validated
  notifyPostValidated(proof.collaboration_id).catch(console.error);

  revalidatePath(`/dashboard/collaborations/${proof.collaboration_id}`);
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

  // Check if tracking link already exists
  const { data: existingLink } = await supabase
    .from("tracked_links")
    .select(
      "id, hash, destination_url, track_impressions, track_clicks, track_revenue"
    )
    .eq("collaboration_id", collaborationId)
    .single();

  if (existingLink) {
    // Get metrics
    const { data: metrics } = await supabase
      .rpc("get_collaboration_metrics", {
        collab_id: collaborationId,
      })
      .single();

    // Type assertion for RPC return type
    const metricsData = metrics as {
      impressions?: number;
      clicks?: number;
      revenue?: number;
    } | null;

    return {
      success: true,
      link: existingLink,
      impressions: metricsData?.impressions || 0,
      clicks: metricsData?.clicks || 0,
      revenue: metricsData?.revenue || 0,
    };
  }

  // Get collaboration details to create tracking link
  const { data: collaboration } = await supabase
    .from("collaborations")
    .select(
      `
      id,
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
          company_name,
          website
        )
      )
    `
    )
    .eq("id", collaborationId)
    .single();

  if (!collaboration) {
    return { error: "Collaboration non trouvée" };
  }

  const saasWebsite = (collaboration.applications as any)?.saas_companies
    ?.website;
  if (!saasWebsite) {
    return { error: "Le SaaS n'a pas de site web configuré" };
  }

  // Get creator and SaaS IDs
  const creatorId = (collaboration.applications as any)?.creator_id;
  const saasId = (collaboration.applications as any)?.saas_id;

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
      destination_url: saasWebsite,
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
