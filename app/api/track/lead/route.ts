import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getClientIP } from '@/lib/get-client-ip';

/**
 * LEAD TRACKING API (BP1 Model)
 * 
 * Creates a lead when user clicks tracking link
 * This replaces the old conversion tracking
 * 
 * Usage:
 * - Called automatically when tracking link is clicked
 * - Or manually via API with session_id
 */

const COOKIE_NAME = 'naano_attribution';

export async function POST(request: NextRequest) {
  try {
    // Use service role to bypass RLS
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Parse request body
    const body = await request.json();
    const { session_id } = body;

    // Determine tracking method: Webhook (has session_id) or Pixel (has cookie)
    let trackingSessionId: string | null = null;
    let trackingMethod: 'webhook' | 'pixel' = 'pixel';

    // Method 1: Webhook with session_id
    if (session_id) {
      trackingMethod = 'webhook';
      trackingSessionId = session_id;

      // Validate API key for webhook
      const authHeader = request.headers.get('authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return NextResponse.json(
          { error: 'Missing or invalid API key for webhook' },
          { status: 401 }
        );
      }

      const apiKey = authHeader.replace('Bearer ', '');

      // Verify API key belongs to a SaaS company
      const { data: saasCompany } = await supabase
        .from('saas_companies')
        .select('id')
        .eq('api_key', apiKey)
        .single();

      if (!saasCompany) {
        return NextResponse.json(
          { error: 'Invalid API key' },
          { status: 401 }
        );
      }
    } 
    // Method 2: Pixel with cookie
    else {
      const cookieStore = await cookies();
      const attributionCookie = cookieStore.get(COOKIE_NAME);

      if (!attributionCookie) {
        return NextResponse.json(
          { error: 'No attribution cookie found' },
          { status: 400 }
        );
      }

      trackingSessionId = attributionCookie.value;
    }

    if (!trackingSessionId) {
      return NextResponse.json(
        { error: 'Could not determine session ID' },
        { status: 400 }
      );
    }

    // Find the tracking link by session_id (from click event)
    const { data: existingEvent } = await supabase
      .from('link_events')
      .select('tracked_link_id')
      .eq('session_id', trackingSessionId)
      .eq('event_type', 'click')
      .order('occurred_at', { ascending: false })
      .limit(1)
      .single();

    if (!existingEvent) {
      return NextResponse.json(
        { error: 'No tracking link found for this session' },
        { status: 404 }
      );
    }

    const trackedLinkId = existingEvent.tracked_link_id;

    // Get tracked link details to find collaboration
    const { data: trackedLink } = await supabase
      .from('tracked_links')
      .select(`
        id,
        collaboration_id,
        collaborations!inner(
          id,
          applications!inner(
            creator_id,
            saas_id
          )
        )
      `)
      .eq('id', trackedLinkId)
      .single();

    if (!trackedLink) {
      return NextResponse.json(
        { error: 'Tracked link not found' },
        { status: 404 }
      );
    }

    const collaboration = trackedLink.collaborations as any;
    const application = collaboration?.applications as any;
    const creatorId = application?.creator_id;
    const saasId = application?.saas_id;

    if (!creatorId || !saasId) {
      return NextResponse.json(
        { error: 'Could not determine creator or SaaS from collaboration' },
        { status: 404 }
      );
    }

    // Check if this session already created a lead (prevent double-counting)
    const { data: existingLead } = await supabase
      .from('leads')
      .select('id')
      .eq('tracked_link_id', trackedLinkId)
      .eq('creator_id', creatorId)
      .eq('saas_id', saasId)
      .eq('status', 'validated')
      .single();

    if (existingLead) {
      return NextResponse.json(
        { 
          success: true, 
          message: 'Lead already created for this session',
          lead_id: existingLead.id
        },
        { status: 200 }
      );
    }

    // Log lead event in link_events
    const { data: leadEvent } = await supabase
      .from('link_events')
      .insert({
        tracked_link_id: trackedLinkId,
        event_type: 'lead',
        session_id: trackingSessionId,
        ip_address: getClientIP(request.headers),
        user_agent: request.headers.get('user-agent') || 'unknown',
        referrer: trackingMethod,
      })
      .select('id')
      .single();

    // Check if SaaS has credits available (CREDIT SYSTEM)
    const { data: saasCompany } = await supabase
      .from('saas_companies')
      .select('wallet_credits')
      .eq('id', saasId)
      .single();

    const currentCredits = saasCompany?.wallet_credits || 0;

    // HARD CAP: If credits = 0, block lead creation but still return success (user gets redirected)
    if (currentCredits <= 0) {
      console.log('Lead blocked - insufficient credits:', {
        method: trackingMethod,
        session_id: trackingSessionId,
        saas_id: saasId,
        credits: currentCredits,
      });

      return NextResponse.json(
        {
          success: false,
          message: 'Insufficient credits. Lead not created.',
          blocked: true,
          reason: 'insufficient_credits',
          credits_remaining: 0,
        },
        { status: 200 } // Still 200 - user gets redirected, but no payment
      );
    }

    // Create lead using new credit-based function
    // This function:
    // - Checks if SaaS has credits > 0
    // - Gets creator payout amount (€0.90 Standard or €1.10 Pro)
    // - Deducts 1 credit
    // - Creates lead with payout amount
    // - Updates creator wallet (pending)
    const { data: leadId, error: leadError } = await supabase.rpc('create_lead_with_credits', {
      p_tracked_link_id: trackedLinkId,
      p_creator_id: creatorId,
      p_saas_id: saasId,
    });

    if (leadError) {
      console.error('Error creating lead:', leadError);
      
      // If error is about insufficient credits, return specific message
      if (leadError.message?.includes('Insufficient credits')) {
        return NextResponse.json(
          {
            success: false,
            message: 'Insufficient credits. Lead not created.',
            blocked: true,
            reason: 'insufficient_credits',
            credits_remaining: currentCredits,
          },
          { status: 200 }
        );
      }

      return NextResponse.json(
        { error: 'Failed to create lead', details: leadError.message },
        { status: 500 }
      );
    }

    // Get created lead details
    const { data: lead } = await supabase
      .from('leads')
      .select('id, creator_payout_amount, credits_deducted, status')
      .eq('id', leadId)
      .single();

    // Get updated credit balance
    const { data: updatedSaas } = await supabase
      .from('saas_companies')
      .select('wallet_credits')
      .eq('id', saasId)
      .single();

    console.log('Lead created with credits:', {
      method: trackingMethod,
      session_id: trackingSessionId,
      lead_id: leadId,
      creator_payout: lead?.creator_payout_amount,
      credits_deducted: lead?.credits_deducted,
      credits_remaining: updatedSaas?.wallet_credits,
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Lead created successfully',
        lead: {
          id: leadId,
          creator_payout_amount: lead?.creator_payout_amount,
          credits_deducted: lead?.credits_deducted,
          status: lead?.status,
        },
        credits_remaining: updatedSaas?.wallet_credits || 0,
        method: trackingMethod
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Lead tracking error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Credentials': 'true',
    },
  });
}

