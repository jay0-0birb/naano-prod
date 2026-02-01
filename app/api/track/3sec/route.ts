import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * 3-SECOND RULE TRACKING ENDPOINT
 * 
 * Called by tracking script embedded on SaaS website
 * Updates time_on_site for a click event when user stays 3+ seconds
 * 
 * POST /api/track/3sec
 * Body: { eventId: string, timeOnSite: number }
 */

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    // Handle both JSON and sendBeacon (Blob) formats
    let body: any;
    const contentType = request.headers.get('content-type') || '';
    
    if (contentType.includes('application/json')) {
      body = await request.json();
    } else {
      // sendBeacon sends as Blob (application/json)
      const text = await request.text();
      try {
        body = JSON.parse(text);
      } catch {
        // Fallback: try to parse as form data or return error
        return NextResponse.json(
          { error: 'Invalid request format' },
          { status: 400 }
        );
      }
    }
    
    const { eventId, timeOnSite } = body;

    if (!eventId || typeof timeOnSite !== 'number') {
      return NextResponse.json(
        { error: 'Missing eventId or timeOnSite' },
        { status: 400 }
      );
    }

    // Update the link_event with time_on_site
    const { error } = await supabase
      .from('link_events')
      .update({
        time_on_site: Math.round(timeOnSite), // Round to nearest second
      })
      .eq('id', eventId)
      .eq('event_type', 'click'); // Only update click events

    if (error) {
      console.error('Error updating time_on_site:', error);
      return NextResponse.json(
        { error: 'Failed to update tracking' },
        { status: 500 }
      );
    }

    // Create lead only if click is qualified (bot filter, 3-sec rule, dedup)
    if (timeOnSite >= 3) {
      supabase
        .rpc('create_qualified_lead_from_event', { p_link_event_id: eventId })
        .then(({ data: leadId, error: leadError }) => {
          if (leadError) {
            console.error('[3SEC] Lead creation:', leadError.message);
          } else if (leadId) {
            console.log('[3SEC] Qualified lead created:', leadId);
          }
          // leadId null + no error = skipped (bot, duplicate, no credits)
        })
        .catch((err) => console.error('[3SEC] Lead creation error:', err));
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in 3-second tracking:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Allow CORS for tracking script
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

