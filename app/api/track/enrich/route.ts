import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { enrichCompanyFromIPFast } from '@/lib/company-enrichment';
import { calculateIntentScore, isWorkingHours, parseUserAgent } from '@/lib/intent-scoring';

/**
 * ASYNC ENRICHMENT & INTENT SCORING ENDPOINT
 * 
 * Processes click events to add:
 * - Layer 1: Session intelligence (device, OS, browser, network type)
 * - Layer 2: Company inference (probabilistic)
 * - Layer 3: Intent scoring (behavioral)
 * 
 * Called asynchronously after click is logged (non-blocking)
 */

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { eventId } = body;

    if (!eventId) {
      return NextResponse.json(
        { error: 'Missing eventId' },
        { status: 400 }
      );
    }

    // Get the click event
    const { data: clickEvent, error: eventError } = await supabase
      .from('link_events')
      .select('*')
      .eq('id', eventId)
      .eq('event_type', 'click')
      .single();

    if (eventError || !clickEvent) {
      return NextResponse.json(
        { error: 'Click event not found' },
        { status: 404 }
      );
    }

    // =====================================================
    // LAYER 1: Session Intelligence (Deterministic)
    // =====================================================
    
    const { deviceType, os, browser } = parseUserAgent(clickEvent.user_agent);
    
    // Update link_event with parsed device info
    await supabase
      .from('link_events')
      .update({
        device_type: deviceType,
        os: os,
        browser: browser,
      })
      .eq('id', eventId);

    // =====================================================
    // LAYER 2: Company Inference (Probabilistic)
    // =====================================================
    
    let companyInferenceId: string | null = null;
    let networkType: string | null = null;
    
    if (clickEvent.ip_address && 
        clickEvent.ip_address !== 'unknown' && 
        clickEvent.ip_address !== 'local') {
      // Enrich company from IP (with 2 second timeout)
      console.log(`[ENRICHMENT] Starting enrichment for IP: ${clickEvent.ip_address}`);
      const enrichment = await enrichCompanyFromIPFast(clickEvent.ip_address, 2000);
      console.log(`[ENRICHMENT] Result: confidence=${enrichment.confidenceScore}, company=${enrichment.companyName || 'none'}, networkType=${enrichment.networkType}`);
      
      // Always set network_type from enrichment (even if no company inferred)
      networkType = enrichment.networkType || 'unknown';
      
      // Only create inference if we have reasonable confidence
      if (enrichment.confidenceScore >= 0.3 && enrichment.companyName) {
        console.log(`[ENRICHMENT] Creating company inference (confidence >= 0.3)`);
        const { data: inference, error: inferenceError } = await supabase
          .from('company_inferences')
          .insert({
            link_event_id: eventId,
            tracked_link_id: clickEvent.tracked_link_id,
            inferred_company_name: enrichment.companyName,
            inferred_company_domain: enrichment.companyDomain,
            inferred_industry: enrichment.industry,
            inferred_company_size: enrichment.companySize,
            inferred_location: enrichment.location,
            confidence_score: enrichment.confidenceScore,
            confidence_reasons: enrichment.confidenceReasons,
            network_type: enrichment.networkType,
            asn_number: enrichment.asnNumber,
            asn_organization: enrichment.asnOrganization,
            is_hosting: enrichment.isHosting,
            is_vpn: enrichment.isVpn,
            is_proxy: enrichment.isProxy,
            is_mobile_isp: enrichment.isMobileIsp,
            is_ambiguous: enrichment.isAmbiguous,
            attribution_state: 'inferred',
          })
          .select('id')
          .single();
        
        if (inference && !inferenceError) {
          companyInferenceId = inference.id;
          console.log(`[ENRICHMENT] ✅ Company inference created: ${inference.id}`);
        } else if (inferenceError) {
          console.error(`[ENRICHMENT] ❌ Error creating inference:`, inferenceError);
        }
      } else {
        console.log(`[ENRICHMENT] ⚠️ Skipping inference: confidence too low (${enrichment.confidenceScore}) or no company name`);
      }
    } else {
      // IP is local/unknown - set network_type to 'unknown'
      networkType = 'unknown';
      console.log(`[ENRICHMENT] ⚠️ Skipping enrichment: IP is ${clickEvent.ip_address}`);
    }
    
    // Update link_event with network type (always, even if enrichment failed)
    if (networkType) {
      await supabase
        .from('link_events')
        .update({
          network_type: networkType,
        })
        .eq('id', eventId);
    }

    // =====================================================
    // LAYER 3: Intent Scoring (Behavioral)
    // =====================================================
    
    // Check if this is a repeat visit (same company/IP)
    const { data: previousVisits } = await supabase
      .from('link_events')
      .select('occurred_at')
      .eq('tracked_link_id', clickEvent.tracked_link_id)
      .eq('event_type', 'click')
      .eq('ip_address', clickEvent.ip_address)
      .lt('occurred_at', clickEvent.occurred_at)
      .order('occurred_at', { ascending: false })
      .limit(1);
    
    const isRepeatVisit = (previousVisits?.length || 0) > 0;
    const firstVisit = previousVisits?.[0];
    const daysSinceFirstVisit = firstVisit 
      ? Math.floor((new Date(clickEvent.occurred_at).getTime() - new Date(firstVisit.occurred_at).getTime()) / (1000 * 60 * 60 * 24))
      : null;
    
    // Calculate intent score
    const intentSignals = {
      referrer: clickEvent.referrer,
      isLinkedInReferrer: clickEvent.referrer?.includes('linkedin.com') || false,
      isDirectTraffic: clickEvent.referrer === 'direct' || !clickEvent.referrer,
      timeOnSite: clickEvent.time_on_site,
      isWorkingHours: isWorkingHours(new Date(clickEvent.occurred_at), clickEvent.country),
      pagesViewed: [], // Will be populated if SaaS sends page tracking
      viewedPricing: false, // Will be populated if SaaS sends page tracking
      viewedSecurity: false,
      viewedDocs: false,
      viewedIntegrations: false,
      downloadCount: 0,
      isRepeatVisit,
      visitCount: isRepeatVisit ? ((await supabase
        .from('link_events')
        .select('id', { count: 'exact', head: true })
        .eq('tracked_link_id', clickEvent.tracked_link_id)
        .eq('event_type', 'click')
        .eq('ip_address', clickEvent.ip_address)
      ).count || 1) + 1 : 1,
      daysSinceFirstVisit,
      networkType: clickEvent.network_type || 'unknown',
      isCorporateNetwork: clickEvent.network_type === 'corporate',
    };
    
    const intentResult = calculateIntentScore(intentSignals);
    console.log(`[INTENT] Calculated intent score: ${intentResult.sessionIntentScore} for eventId: ${eventId}`);
    console.log(`[INTENT] Signals: repeat=${isRepeatVisit}, workingHours=${intentSignals.isWorkingHours}, referrer=${clickEvent.referrer?.substring(0, 30)}`);
    
    // Store intent score
    const { data: intentScore, error: intentError } = await supabase
      .from('intent_scores')
      .insert({
        link_event_id: eventId,
        tracked_link_id: clickEvent.tracked_link_id,
        company_inference_id: companyInferenceId,
        session_intent_score: intentResult.sessionIntentScore,
        time_on_site_seconds: clickEvent.time_on_site,
        is_working_hours: intentSignals.isWorkingHours,
        is_repeat_visit: isRepeatVisit,
        days_since_first_visit: daysSinceFirstVisit,
        visit_count: intentSignals.visitCount,
        viewed_pricing: intentSignals.viewedPricing,
        viewed_security: intentSignals.viewedSecurity,
        viewed_docs: intentSignals.viewedDocs,
        viewed_integrations: intentSignals.viewedIntegrations,
        intent_signals: intentResult.intentSignals,
      })
      .select('id')
      .single();
    
    if (intentScore && !intentError) {
      console.log(`[INTENT] ✅ Intent score stored: ${intentScore.id}`);
    } else if (intentError) {
      console.error('[INTENT] ❌ Error storing intent score:', intentError);
    }

    return NextResponse.json({ 
      success: true,
      companyInferenceId,
      intentScoreId: intentScore?.id,
    });
  } catch (error) {
    console.error('Error in enrichment:', error);
    // Don't fail the request - enrichment is non-critical
    return NextResponse.json(
      { error: 'Enrichment failed but click was logged' },
      { status: 500 }
    );
  }
}

