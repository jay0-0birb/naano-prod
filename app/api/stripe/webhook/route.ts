import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { stripe } from '@/lib/stripe';
import { createClient } from '@supabase/supabase-js';

// Use service role for webhook (no user context)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

export async function POST(request: Request) {
  if (!stripe || !supabaseAdmin) {
    return NextResponse.json({ error: 'Service non configuré' }, { status: 503 });
  }

  const body = await request.text();
  const headersList = await headers();
  const signature = headersList.get('stripe-signature')!;

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  switch (event.type) {
    // =====================================================
    // REVENUE TRACKING: Handle successful payments from connected SaaS accounts
    // =====================================================
    case 'checkout.session.completed': {
      const session = event.data.object as any;
      
      // Check if this is from a connected account (SaaS revenue tracking)
      if (event.account) {
        await handleConnectedAccountPayment(event.account, session, 'checkout');
      } else {
        // Internal payment (e.g., subscription)
        const collaborationId = session.metadata?.collaboration_id;
        const paymentIntentId = session.payment_intent as string;

        if (collaborationId) {
          await supabaseAdmin
            .from('payments')
            .update({
              status: 'completed',
              paid_at: new Date().toISOString(),
            })
            .eq('stripe_payment_intent_id', paymentIntentId);

          console.log(`Payment completed for collaboration ${collaborationId}`);
        }
      }
      break;
    }

    case 'payment_intent.succeeded': {
      const paymentIntent = event.data.object as any;
      
      // Check if this is from a connected account (SaaS revenue tracking)
      if (event.account) {
        await handleConnectedAccountPayment(event.account, paymentIntent, 'payment_intent');
      }
      break;
    }

    case 'charge.succeeded': {
      const charge = event.data.object as any;
      
      // Check if this is from a connected account (SaaS revenue tracking)
      if (event.account) {
        await handleConnectedAccountPayment(event.account, charge, 'charge');
      }
      break;
    }

    case 'payment_intent.payment_failed': {
      const paymentIntent = event.data.object;
      
      await supabaseAdmin
        .from('payments')
        .update({ status: 'failed' })
        .eq('stripe_payment_intent_id', paymentIntent.id);

      console.log(`Payment failed: ${paymentIntent.id}`);
      break;
    }

    case 'account.updated': {
      const account = event.data.object;
      
      // Check if onboarding is complete (for creators)
      if (account.details_submitted && account.charges_enabled) {
        await supabaseAdmin
          .from('creator_profiles')
          .update({ stripe_onboarding_completed: true })
          .eq('stripe_account_id', account.id);

        console.log(`Stripe onboarding completed for account ${account.id}`);
      }
      break;
    }

    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  return NextResponse.json({ received: true });
}

/**
 * Handle payments from connected SaaS Stripe accounts
 * This is where the magic happens for automatic revenue tracking!
 */
async function handleConnectedAccountPayment(
  stripeAccountId: string,
  paymentData: any,
  eventType: string
) {
  if (!supabaseAdmin) return;

  try {
    // 1. Find the SaaS company by their Stripe account ID
    const { data: saasCompany } = await supabaseAdmin
      .from('saas_companies')
      .select('id, company_name')
      .eq('stripe_account_id', stripeAccountId)
      .single();

    if (!saasCompany) {
      console.log(`No SaaS found for Stripe account ${stripeAccountId}`);
      return;
    }

    // 2. Extract revenue amount (in cents, convert to euros)
    const amountCents = paymentData.amount || paymentData.amount_total || 0;
    const revenue = amountCents / 100;

    if (revenue <= 0) {
      console.log('Payment has no revenue, skipping');
      return;
    }

    // 3. Try to find attribution via metadata or customer email
    // Option A: Check if naano_session is in metadata
    const naanoSession = paymentData.metadata?.naano_session;
    
    // Option B: Check customer email for existing session
    const customerEmail = paymentData.customer_email || 
                         paymentData.receipt_email ||
                         paymentData.billing_details?.email;

    let trackedLinkId: string | null = null;
    let sessionId: string | null = naanoSession;

    if (naanoSession) {
      // Direct attribution via session ID
      const { data: clickEvent } = await supabaseAdmin
        .from('link_events')
        .select('tracked_link_id')
        .eq('session_id', naanoSession)
        .eq('event_type', 'click')
        .single();

      if (clickEvent) {
        trackedLinkId = clickEvent.tracked_link_id;
      }
    }

    // If no direct session, try to find recent click for this SaaS
    if (!trackedLinkId) {
      // Look for any click in the last 30 days for this SaaS
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: recentClicks } = await supabaseAdmin
        .from('link_events')
        .select(`
          tracked_link_id,
          session_id,
          tracked_links!inner (
            collaborations!inner (
              applications!inner (
                saas_id
              )
            )
          )
        `)
        .eq('event_type', 'click')
        .gte('occurred_at', thirtyDaysAgo.toISOString())
        .order('occurred_at', { ascending: false })
        .limit(100);

      // Find a click that belongs to this SaaS
      const matchingClick = recentClicks?.find((click: any) => 
        click.tracked_links?.collaborations?.applications?.saas_id === saasCompany.id
      );

      if (matchingClick) {
        trackedLinkId = matchingClick.tracked_link_id;
        sessionId = matchingClick.session_id;
        console.log(`Found attribution via recent click for ${saasCompany.company_name}`);
      }
    }

    // 4. If we found attribution, log the conversion
    if (trackedLinkId && sessionId) {
      // Check for duplicate
      const { data: existingConversion } = await supabaseAdmin
        .from('link_events')
        .select('id')
        .eq('tracked_link_id', trackedLinkId)
        .eq('event_type', 'conversion')
        .eq('referrer', `stripe:${paymentData.id}`)
        .single();

      if (!existingConversion) {
        await supabaseAdmin
          .from('link_events')
          .insert({
            tracked_link_id: trackedLinkId,
            event_type: 'conversion',
            session_id: sessionId,
            revenue_amount: revenue,
            referrer: `stripe:${paymentData.id}`, // Store Stripe payment ID to prevent duplicates
            ip_address: 'stripe_webhook',
            user_agent: `stripe_${eventType}`,
          });

        console.log(`✅ Revenue attributed: €${revenue} for ${saasCompany.company_name} via Stripe Connect`);
      } else {
        console.log(`Duplicate conversion skipped: ${paymentData.id}`);
      }
    } else {
      console.log(`No attribution found for payment ${paymentData.id} from ${saasCompany.company_name}`);
    }

  } catch (error) {
    console.error('Error handling connected account payment:', error);
  }
}

