import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * SIGNUP WEBHOOK ENDPOINT
 * 
 * Called by SaaS when a user signs up to upgrade inferred → confirmed attribution
 * 
 * Expected payload:
 * {
 *   "session_id": "naano_session_xxx", // From naano_session cookie
 *   "email": "user@example.com",
 *   "name": "John Doe",
 *   "job_title": "CTO",
 *   "company": "Acme Corp",
 *   "linkedin_url": "https://linkedin.com/in/johndoe" // Optional
 * }
 */

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { session_id, email, name, job_title, company, linkedin_url } = body;

    // Validate required fields
    if (!session_id || !email || !company) {
      return NextResponse.json(
        { 
          error: 'Missing required fields: session_id, email, and company are required' 
        },
        { status: 400 }
      );
    }

    // Find the lead/click event by session_id
    const { data: clickEvent, error: eventError } = await supabase
      .from('link_events')
      .select(`
        id,
        tracked_link_id,
        company_inferences (
          id,
          inferred_company_name
        )
      `)
      .eq('session_id', session_id)
      .eq('event_type', 'click')
      .order('occurred_at', { ascending: false })
      .limit(1)
      .single();

    if (eventError || !clickEvent) {
      return NextResponse.json(
        { 
          error: 'No click event found for this session. Make sure the user clicked a Naano tracking link before signing up.',
          details: eventError?.message 
        },
        { status: 404 }
      );
    }

    // Find or create the lead for this click
    const { data: existingLead } = await supabase
      .from('leads')
      .select('id, company_inference_id')
      .eq('link_event_id', clickEvent.id)
      .single();

    let leadId: string;

    if (existingLead) {
      leadId = existingLead.id;
    } else {
      // Create a new lead if it doesn't exist
      // Get collaboration details to create lead properly
      const { data: trackedLink } = await supabase
        .from('tracked_links')
        .select(`
          id,
          collaboration_id,
          collaborations:collaboration_id (
            applications:application_id (
              creator_id,
              saas_id
            )
          )
        `)
        .eq('id', clickEvent.tracked_link_id)
        .single();

      if (!trackedLink) {
        return NextResponse.json(
          { error: 'Tracked link not found' },
          { status: 404 }
        );
      }

      const application = (trackedLink.collaborations as any)?.applications;
      const creatorId = application?.creator_id;
      const saasId = application?.saas_id;

      if (!creatorId || !saasId) {
        return NextResponse.json(
          { error: 'Could not determine creator or SaaS from collaboration' },
          { status: 404 }
        );
      }

      // Get SaaS plan for pricing
      const { data: saas } = await supabase
        .from('saas_companies')
        .select('subscription_tier')
        .eq('id', saasId)
        .single();

      const plan = saas?.subscription_tier || 'starter';
      const leadValue = plan === 'starter' ? 2.50 : plan === 'growth' ? 2.00 : 1.60;

      // Create lead using RPC function
      const { data: newLead, error: leadError } = await supabase
        .rpc('create_lead_for_collaboration', {
          p_tracked_link_id: clickEvent.tracked_link_id,
          p_creator_id: creatorId,
          p_saas_id: saasId
        })
        .single();

      if (leadError || !newLead) {
        return NextResponse.json(
          { error: 'Failed to create lead', details: leadError?.message },
          { status: 500 }
        );
      }

      leadId = newLead.id;
    }

    // Get company inference ID
    const companyInference = (clickEvent.company_inferences as any)?.[0] || clickEvent.company_inferences;
    const companyInferenceId = companyInference?.id;

    if (!companyInferenceId) {
      return NextResponse.json(
        { 
          error: 'No company inference found for this session. Company enrichment may not have completed yet.',
          suggestion: 'Wait a few seconds and try again, or the click may not have been from a corporate network.'
        },
        { status: 404 }
      );
    }

    // Update lead with company inference ID if not set
    if (existingLead && !existingLead.company_inference_id) {
      await supabase
        .from('leads')
        .update({ company_inference_id: companyInferenceId })
        .eq('id', leadId);
    }

    // Call upgrade function
    const { data: upgradeResult, error: upgradeError } = await supabase
      .rpc('upgrade_company_inference_on_signup', {
        p_lead_id: leadId,
        p_signup_company: company,
        p_signup_email: email,
        p_signup_name: name,
        p_signup_job_title: job_title,
        p_signup_linkedin_url: linkedin_url
      })
      .single();

    if (upgradeError) {
      console.error('Error upgrading company inference:', upgradeError);
      return NextResponse.json(
        { error: 'Failed to upgrade company inference', details: upgradeError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Signup attribution upgraded successfully',
      result: upgradeResult,
      lead_id: leadId,
      company_inference_id: companyInferenceId
    });

  } catch (error: any) {
    console.error('Error in signup webhook:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

