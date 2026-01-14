import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';

/**
 * TRACKING LINK REDIRECT ENDPOINT
 * 
 * This endpoint handles all tracking link clicks.
 * URL format: konex.app/t/abc123
 * 
 * Flow:
 * 1. User clicks tracking link
 * 2. We log the click (IP, user agent, referrer, timestamp)
 * 3. We redirect to the SaaS website with UTM parameters
 */

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ hash: string }> }
) {
  const { hash } = await params;
  const supabase = await createClient();

  try {
    // 1. Look up the tracking link by hash
    const { data: trackingLink, error: linkError } = await supabase
      .from('tracked_links')
      .select(`
        id,
        destination_url,
        collaboration_id,
        collaborations:collaboration_id (
          id,
          applications:application_id (
            creator_profiles:creator_id (
              id,
              profiles:profile_id (
                full_name
              )
            ),
            saas_companies:saas_id (
              company_name
            )
          )
        )
      `)
      .eq('hash', hash)
      .single();

    if (linkError || !trackingLink) {
      // Link not found - redirect to homepage
      return NextResponse.redirect(new URL('/', request.url));
    }

    // 2. Extract metadata from the request
    const headersList = await headers();
    const ipAddress = headersList.get('x-forwarded-for') || 
                     headersList.get('x-real-ip') || 
                     'unknown';
    const userAgent = headersList.get('user-agent') || 'unknown';
    const referrer = headersList.get('referer') || 'direct';

    // 3. Log the click (async, don't wait for it)
    supabase
      .from('link_clicks')
      .insert({
        tracked_link_id: trackingLink.id,
        ip_address: ipAddress,
        user_agent: userAgent,
        referrer: referrer,
      })
      .then(({ error }) => {
        if (error) {
          console.error('Error logging click:', error);
        }
      });

    // 4. Build the destination URL with UTM parameters
    const destinationUrl = new URL(trackingLink.destination_url);
    
    // Add UTM parameters for tracking
    destinationUrl.searchParams.set('utm_source', 'konex');
    destinationUrl.searchParams.set('utm_medium', 'ambassador');
    
    // Add creator info if available (handle nested array shape safely)
    const creatorName =
      (trackingLink as any).collaborations?.[0]?.applications?.creator_profiles?.[0]?.profiles?.[0]?.full_name;
    if (creatorName) {
      destinationUrl.searchParams.set('utm_content', creatorName.toLowerCase().replace(/\s+/g, '-'));
    }

    // 5. Redirect to the SaaS website
    return NextResponse.redirect(destinationUrl.toString());

  } catch (error) {
    console.error('Tracking redirect error:', error);
    // On error, redirect to homepage
    return NextResponse.redirect(new URL('/', request.url));
  }
}

