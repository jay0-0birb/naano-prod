import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * 3-SECOND RULE TRACKING PIXEL
 * 
 * Invisible 1x1 pixel image that loads after 3 seconds
 * Automatically confirms user engagement without SaaS needing to embed anything
 * 
 * GET /api/track/3sec-pixel?eventId=xxx
 */

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');

    if (eventId) {
      // Update time_on_site to 3 seconds (pixel loaded = user stayed)
      await supabase
        .from('link_events')
        .update({
          time_on_site: 3,
        })
        .eq('id', eventId)
        .eq('event_type', 'click');
    }

    // Return 1x1 transparent PNG
    // Base64 encoded 1x1 transparent PNG: iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==
    const pixelBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    
    // Convert base64 to buffer (works in Node.js runtime)
    const pixel = Buffer.from(pixelBase64, 'base64');

    return new NextResponse(pixel, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error) {
    // Return pixel even on error (don't break page)
    const pixelBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const pixel = Buffer.from(pixelBase64, 'base64');
    return new NextResponse(pixel, {
      headers: {
        'Content-Type': 'image/png',
      },
    });
  }
}

