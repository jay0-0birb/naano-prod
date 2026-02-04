"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

/**
 * Get global analytics across all collaborations for a SaaS
 */
export async function getGlobalAnalytics() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Non authentifié" };
  }

  // Get SaaS company
  const { data: saasCompany } = await supabase
    .from("saas_companies")
    .select("id, subscription_tier")
    .eq("profile_id", user.id)
    .single();

  if (!saasCompany) {
    return { error: "SaaS non trouvé" };
  }

  // Get all tracked links for this SaaS
  const { data: applications } = await supabase
    .from("applications")
    .select("id")
    .eq("saas_id", saasCompany.id);

  if (!applications || applications.length === 0) {
    return {
      success: true,
      analytics: {
        totalImpressions: 0,
        totalClicks: 0,
        qualifiedClicks: 0,
        leadsCount: 0,
        totalLeadCost: 0,
        savingsVsLinkedIn: 0,
      },
    };
  }

  const applicationIds = applications.map((a) => a.id);

  const { data: collaborations } = await supabase
    .from("collaborations")
    .select("id")
    .in("application_id", applicationIds);

  if (!collaborations || collaborations.length === 0) {
    return {
      success: true,
      analytics: {
        totalImpressions: 0,
        totalClicks: 0,
        qualifiedClicks: 0,
        leadsCount: 0,
        totalLeadCost: 0,
        savingsVsLinkedIn: 0,
      },
    };
  }

  const collaborationIds = collaborations.map((c) => c.id);

  const { data: trackedLinks } = await supabase
    .from("tracked_links")
    .select("id")
    .in("collaboration_id", collaborationIds);

  if (!trackedLinks || trackedLinks.length === 0) {
    return {
      success: true,
      analytics: {
        totalImpressions: 0,
        totalClicks: 0,
        qualifiedClicks: 0,
        leadsCount: 0,
        totalLeadCost: 0,
        savingsVsLinkedIn: 0,
      },
    };
  }

  const trackedLinkIds = trackedLinks.map((tl) => tl.id);

  // Get all clicks and impressions
  const { data: allEvents } = await supabase
    .from("link_events")
    .select(
      "event_type, time_on_site, occurred_at, ip_address, user_agent, country",
    )
    .in("tracked_link_id", trackedLinkIds);

  // Calculate totals
  const totalImpressions =
    allEvents?.filter((e) => e.event_type === "impression").length || 0;
  const totalClicks =
    allEvents?.filter((e) => e.event_type === "click").length || 0;

  // Get qualified clicks (using same logic as RPC)
  // Need to check bot filtering too - for now, simplified version
  const qualifiedClicks =
    allEvents?.filter(
      (e: any) =>
        e.event_type === "click" &&
        (e.time_on_site >= 3 ||
          (e.time_on_site === null &&
            e.occurred_at &&
            new Date(e.occurred_at) > new Date(Date.now() - 5 * 60 * 1000))),
    ).length || 0;

  // Get leads count
  const { data: leads } = await supabase
    .from("leads")
    .select("id, cost_per_lead")
    .in("tracked_link_id", trackedLinkIds);

  const leadsCount = leads?.length || 0;
  const totalLeadCost =
    leads?.reduce((sum, lead) => sum + (lead.cost_per_lead || 0), 0) || 0;

  // Calculate savings vs LinkedIn Ads
  const linkedinCost = qualifiedClicks * 8; // 8€ per click
  const savingsVsLinkedIn = linkedinCost - totalLeadCost;

  return {
    success: true,
    analytics: {
      totalImpressions,
      totalClicks,
      qualifiedClicks,
      leadsCount,
      totalLeadCost,
      savingsVsLinkedIn,
    },
  };
}

/**
 * Get all leads across all collaborations for a SaaS
 */
export async function getGlobalLeads(
  sortBy: "date" | "confidence" | "intent" | "company_intent" = "date",
  filterConfirmed: boolean = false,
  filterHighConfidence: boolean = false,
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Non authentifié" };
  }

  // Get SaaS company
  const { data: saasCompany } = await supabase
    .from("saas_companies")
    .select("id, subscription_tier")
    .eq("profile_id", user.id)
    .single();

  if (!saasCompany) {
    return { error: "SaaS non trouvé" };
  }

  // Lead Feed available to all SaaS (no plan restrictions)

  // Get all tracked links for this SaaS
  const { data: applications } = await supabase
    .from("applications")
    .select("id")
    .eq("saas_id", saasCompany.id);

  if (!applications || applications.length === 0) {
    return { success: true, leads: [] };
  }

  const applicationIds = applications.map((a) => a.id);

  const { data: collaborations } = await supabase
    .from("collaborations")
    .select("id")
    .in("application_id", applicationIds);

  if (!collaborations || collaborations.length === 0) {
    return { success: true, leads: [] };
  }

  const collaborationIds = collaborations.map((c) => c.id);

  const { data: trackedLinks } = await supabase
    .from("tracked_links")
    .select("id")
    .in("collaboration_id", collaborationIds);

  if (!trackedLinks || trackedLinks.length === 0) {
    return { success: true, leads: [] };
  }

  const trackedLinkIds = trackedLinks.map((tl) => tl.id);

  // Lead Feed = qualified leads only (leads table), regardless of confidence/company inference
  const { data: leadRows } = await supabase
    .from("leads")
    .select("link_event_id")
    .in("tracked_link_id", trackedLinkIds)
    .in("status", ["validated", "billed"])
    .not("link_event_id", "is", null);

  const linkEventIds = (leadRows || [])
    .map((r: { link_event_id: string }) => r.link_event_id)
    .filter(Boolean) as string[];

  if (linkEventIds.length === 0) {
    return { success: true, leads: [] };
  }

  // Fetch link_events for qualified leads only
  const { data: clickEvents, error } = await supabase
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
      tracked_link_id,
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
      ),
      tracked_links:tracked_link_id (
        collaboration_id
      )
    `,
    )
    .in("id", linkEventIds)
    .order("occurred_at", { ascending: false })
    .limit(500);

  if (error) {
    console.error("Error fetching global leads:", error);
    return {
      error: "Erreur lors de la récupération des leads",
      details: error.message,
    };
  }

  // Apply optional filters in JS
  let filteredEvents = clickEvents || [];
  if (filterConfirmed) {
    filteredEvents = filteredEvents.filter((e: any) => {
      const ci = e.company_inferences?.[0] || e.company_inferences;
      return ci?.attribution_state === "confirmed";
    });
  }
  if (filterHighConfidence) {
    filteredEvents = filteredEvents.filter((e: any) => {
      const ci = e.company_inferences?.[0] || e.company_inferences;
      return (ci?.confidence_score ?? 0) >= 0.7;
    });
  }
  if (sortBy === "confidence") {
    filteredEvents = [...filteredEvents].sort((a: any, b: any) => {
      const ca =
        (a.company_inferences?.[0] || a.company_inferences)?.confidence_score ??
        0;
      const cb =
        (b.company_inferences?.[0] || b.company_inferences)?.confidence_score ??
        0;
      return cb - ca;
    });
  } else if (sortBy === "intent") {
    filteredEvents = [...filteredEvents].sort((a: any, b: any) => {
      const sa =
        (a.intent_scores?.[0] || a.intent_scores)?.session_intent_score ?? 0;
      const sb =
        (b.intent_scores?.[0] || b.intent_scores)?.session_intent_score ?? 0;
      return sb - sa;
    });
  }

  // Get company-level aggregated intent for each unique company
  const companyAggregates = new Map<string, any>();

  if (filteredEvents.length > 0) {
    const uniqueCompanies = new Set(
      filteredEvents
        .map((e: any) => {
          const ci = e.company_inferences?.[0] || e.company_inferences;
          return ci?.inferred_company_name;
        })
        .filter(Boolean),
    );

    for (const companyName of uniqueCompanies) {
      try {
        // Get aggregate across all tracked links for this company
        const { data: aggregates } = await supabase.rpc(
          "get_company_aggregated_intent",
          {
            company_name: companyName,
            tracked_link_id: trackedLinkIds[0], // We'll need to aggregate across all links
          },
        );

        // For now, use the first result (we can improve this later)
        if (aggregates) {
          companyAggregates.set(companyName, aggregates);
        }
      } catch (err) {
        console.error(`Error fetching aggregate for ${companyName}:`, err);
      }
    }
  }

  // Get creator names for all collaborations
  const collaborationIdsForCreatorNames = [
    ...new Set(
      filteredEvents
        .map((e: any) => {
          const trackedLink = e.tracked_links;
          return (trackedLink as any)?.collaboration_id;
        })
        .filter(Boolean),
    ),
  ];

  const creatorNamesMap = new Map<string, string>();

  if (collaborationIdsForCreatorNames.length > 0) {
    const { data: collaborationsData } = await supabase
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
      `,
      )
      .in("id", collaborationIdsForCreatorNames);

    if (collaborationsData) {
      for (const collab of collaborationsData) {
        const creatorName =
          (collab.applications as any)?.creator_profiles?.profiles?.full_name ||
          "Unknown";
        creatorNamesMap.set(collab.id, creatorName);
      }
    }
  }

  // Format leads data - show all qualified leads (company and intent optional)
  const leads = filteredEvents.map((event: any) => {
    const companyInference =
      event.company_inferences?.[0] || event.company_inferences;
    const intentScore = event.intent_scores?.[0] || event.intent_scores;
    const trackedLink = event.tracked_links;
    const collaborationId = (trackedLink as any)?.collaboration_id || null;
    const creatorName =
      collaborationId && creatorNamesMap.has(collaborationId)
        ? creatorNamesMap.get(collaborationId)!
        : "Unknown";

    return {
      id: event.id,
      occurredAt: event.occurred_at,
      collaborationId: collaborationId,
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
            effectiveConfidenceScore: null,
            confidenceReasons: companyInference.confidence_reasons || [],
            attributionState: companyInference.attribution_state,
            asnOrganization: companyInference.asn_organization,
            isAmbiguous: companyInference.is_ambiguous || false,
            createdAt: companyInference.created_at,
            confirmedAt: companyInference.confirmed_at,
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
