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

    // Create lead using database function (BP1 model)
    // This function:
    // - Gets SaaS's current plan
    // - Calculates lead_value (€2.50 / €2.00 / €1.60)
    // - Sets creator_earnings to €1.20 (fixed)
    // - Updates creator wallet (pending)
    // - Updates SaaS debt
    const { data: leadId, error: leadError } = await supabase.rpc('create_lead', {
      p_tracked_link_id: trackedLinkId,
      p_creator_id: creatorId,
      p_saas_id: saasId,
    });

    if (leadError) {
      console.error('Error creating lead:', leadError);
      return NextResponse.json(
        { error: 'Failed to create lead', details: leadError.message },
        { status: 500 }
      );
    }

    // Get created lead details
    const { data: lead } = await supabase
      .from('leads')
      .select('id, saas_plan, lead_value, creator_earnings, naano_margin_brut, status')
      .eq('id', leadId)
      .single();

    // Check if SaaS should be billed (threshold reached)
    const { data: shouldBill } = await supabase.rpc('should_bill_saas', {
      p_saas_id: saasId,
    });

    console.log('Lead created:', {
      method: trackingMethod,
      session_id: trackingSessionId,
      lead_id: leadId,
      saas_plan: lead?.saas_plan,
      lead_value: lead?.lead_value,
      should_bill: shouldBill,
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Lead created successfully',
        lead: {
          id: leadId,
          saas_plan: lead?.saas_plan,
          lead_value: lead?.lead_value,
          creator_earnings: lead?.creator_earnings,
          naano_margin_brut: lead?.naano_margin_brut,
        },
        should_bill: shouldBill,
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

