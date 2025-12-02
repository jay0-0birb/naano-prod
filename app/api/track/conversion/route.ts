import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

/**
 * CONVERSION TRACKING API
 * 
 * Supports TWO methods:
 * 1. JavaScript Pixel (reads cookie from request)
 * 2. Server Webhook (receives session_id + API key)
 * 
 * Usage:
 * 
 * PIXEL:
 * fetch('/api/track/conversion', {
 *   method: 'POST',
 *   credentials: 'include',
 *   body: JSON.stringify({ revenue: 100, order_id: '123' })
 * });
 * 
 * WEBHOOK:
 * fetch('/api/track/conversion', {
 *   method: 'POST',
 *   headers: { 'Authorization': 'Bearer saas-api-key-123' },
 *   body: JSON.stringify({ 
 *     session_id: 'uuid-123',
 *     revenue: 100,
 *     order_id: '123'
 *   })
 * });
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
    const { revenue, order_id, customer_email, session_id } = body;

    // Validate revenue
    if (!revenue || typeof revenue !== 'number' || revenue <= 0) {
      return NextResponse.json(
        { error: 'Invalid revenue amount' },
        { status: 400 }
      );
    }

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

    // Find the tracking link by session_id
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

    // Check if this session already converted (prevent double-counting)
    const { data: existingConversion } = await supabase
      .from('link_events')
      .select('id')
      .eq('tracked_link_id', trackedLinkId)
      .eq('session_id', trackingSessionId)
      .eq('event_type', 'conversion')
      .single();

    if (existingConversion) {
      return NextResponse.json(
        { 
          success: true, 
          message: 'Conversion already recorded',
          conversion_id: existingConversion.id
        },
        { status: 200 }
      );
    }

    // Log the conversion
    const { data: conversion, error: conversionError } = await supabase
      .from('link_events')
      .insert({
        tracked_link_id: trackedLinkId,
        event_type: 'conversion',
        session_id: trackingSessionId,
        revenue_amount: revenue,
        ip_address: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown',
        user_agent: request.headers.get('user-agent') || 'unknown',
        referrer: trackingMethod,
      })
      .select('id')
      .single();

    if (conversionError) {
      console.error('Error logging conversion:', conversionError);
      return NextResponse.json(
        { error: 'Failed to log conversion' },
        { status: 500 }
      );
    }

    console.log('Conversion tracked:', {
      method: trackingMethod,
      session_id: trackingSessionId,
      revenue,
      order_id,
      conversion_id: conversion.id
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Conversion tracked successfully',
        conversion_id: conversion.id,
        method: trackingMethod
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Conversion tracking error:', error);
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

