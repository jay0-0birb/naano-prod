import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { stripe } from "@/lib/stripe";
import { createClient } from "@supabase/supabase-js";

// Use service role for webhook (no user context)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin =
  supabaseUrl && supabaseServiceKey
    ? createClient(supabaseUrl, supabaseServiceKey)
    : null;

export async function POST(request: Request) {
  if (!stripe || !supabaseAdmin) {
    return NextResponse.json(
      { error: "Service non configuré" },
      { status: 503 }
    );
  }

  const body = await request.text();
  const headersList = await headers();
  const signature = headersList.get("stripe-signature")!;

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  switch (event.type) {
    // =====================================================
    // REVENUE TRACKING: Handle successful payments from connected SaaS accounts
    // =====================================================
    case "checkout.session.completed": {
      const session = event.data.object as any;

      // Check if this is from a connected account (SaaS revenue tracking)
      if (event.account) {
        await handleConnectedAccountPayment(event.account, session, "checkout");
      } else {
        // Check if this is a subscription checkout
        if (
          session.mode === "subscription" &&
          session.subscription &&
          session.metadata?.saas_id
        ) {
          const saasId = session.metadata.saas_id;
          const tier = session.metadata.tier;
          const oldSubscriptionId = session.metadata.old_subscription_id;
          const isUpgrade = session.metadata.is_upgrade === "true";

          if (saasId && tier) {
            // If this is an upgrade/downgrade, cancel the old subscription
            if (isUpgrade && oldSubscriptionId) {
              try {
                await stripe.subscriptions.cancel(oldSubscriptionId);
                console.log(
                  `Cancelled old subscription ${oldSubscriptionId} for SaaS ${saasId}`
                );
              } catch (err) {
                console.error(
                  `Error cancelling old subscription ${oldSubscriptionId}:`,
                  err
                );
                // Continue anyway - new subscription is created
              }
            }

            await supabaseAdmin
              .from("saas_companies")
              .update({
                subscription_tier: tier,
                stripe_subscription_id: session.subscription,
                subscription_status: "active",
              })
              .eq("id", saasId);

            console.log(
              `Subscription ${
                isUpgrade ? "upgraded" : "created"
              } for SaaS ${saasId}: ${tier}`
            );
          }
        }

        // Internal payment (e.g., collaboration payment)
        const collaborationId = session.metadata?.collaboration_id;
        const paymentIntentId = session.payment_intent as string;

        if (collaborationId) {
          await supabaseAdmin
            .from("payments")
            .update({
              status: "completed",
              paid_at: new Date().toISOString(),
            })
            .eq("stripe_payment_intent_id", paymentIntentId);

          console.log(`Payment completed for collaboration ${collaborationId}`);
        }
      }
      break;
    }

    case "payment_intent.succeeded": {
      const paymentIntent = event.data.object as any;

      // BP1 Model: Handle billing invoice payment
      if (paymentIntent.metadata?.invoice_id) {
        const invoiceId = paymentIntent.metadata.invoice_id;
        const saasId = paymentIntent.metadata.saas_id;

        // Update invoice status
        await supabaseAdmin
          .from("billing_invoices")
          .update({
            status: "paid",
            paid_at: new Date().toISOString(),
            stripe_payment_intent_id: paymentIntent.id,
          })
          .eq("id", invoiceId);

        // Note: bill_saas() function already moves wallets from pending to available
        // when invoice is created. This webhook just confirms payment succeeded.
        // If payment fails, we'd need to reverse the wallet movement (not implemented yet).

        console.log(`Billing invoice ${invoiceId} paid successfully`);
      }
      // Legacy: Check if this is from a connected account (old revenue tracking)
      else if (event.account) {
        await handleConnectedAccountPayment(
          event.account,
          paymentIntent,
          "payment_intent"
        );
      }
      break;
    }

    case "charge.succeeded": {
      const charge = event.data.object as any;

      // Check if this is from a connected account (SaaS revenue tracking)
      if (event.account) {
        await handleConnectedAccountPayment(event.account, charge, "charge");
      }
      break;
    }

    case "payment_intent.payment_failed": {
      const paymentIntent = event.data.object as any;

      // BP1 Model: Handle billing invoice payment failure
      if (paymentIntent.metadata?.invoice_id) {
        const invoiceId = paymentIntent.metadata.invoice_id;

        await supabaseAdmin
          .from("billing_invoices")
          .update({
            status: "failed",
          })
          .eq("id", invoiceId);

        console.log(`Billing invoice ${invoiceId} payment failed`);
      }
      // Legacy: Old payment system
      else {
        await supabaseAdmin
          .from("payments")
          .update({ status: "failed" })
          .eq("stripe_payment_intent_id", paymentIntent.id);

        console.log(`Payment failed: ${paymentIntent.id}`);
      }
      break;
    }

    case "account.updated": {
      const account = event.data.object;

      // Check if onboarding is complete (for creators)
      if (account.details_submitted && account.charges_enabled) {
        await supabaseAdmin
          .from("creator_profiles")
          .update({ stripe_onboarding_completed: true })
          .eq("stripe_account_id", account.id);

        console.log(`Stripe onboarding completed for account ${account.id}`);
      }
      break;
    }

    // =====================================================
    // SUBSCRIPTION EVENTS: Handle SaaS plan changes
    // =====================================================
    case "customer.subscription.created":
    case "customer.subscription.updated": {
      const subscription = event.data.object as any;
      const saasId = subscription.metadata?.saas_id;
      const tier = subscription.metadata?.tier;
      const oldSubscriptionId = subscription.metadata?.old_subscription_id;

      if (saasId && tier) {
        // If this is an upgrade/downgrade, cancel the old subscription
        if (
          oldSubscriptionId &&
          event.type === "customer.subscription.created"
        ) {
          try {
            await stripe.subscriptions.cancel(oldSubscriptionId);
            console.log(
              `Cancelled old subscription ${oldSubscriptionId} for SaaS ${saasId}`
            );
          } catch (err) {
            console.error(
              `Error cancelling old subscription ${oldSubscriptionId}:`,
              err
            );
            // Continue anyway - new subscription is created
          }
        }

        await supabaseAdmin
          .from("saas_companies")
          .update({
            subscription_tier: tier,
            stripe_subscription_id: subscription.id,
            subscription_status:
              subscription.status === "active"
                ? "active"
                : subscription.status === "past_due"
                ? "past_due"
                : "active",
          })
          .eq("id", saasId);

        console.log(`Subscription ${event.type} for SaaS ${saasId}: ${tier}`);
      }
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as any;
      const saasId = subscription.metadata?.saas_id;

      if (saasId) {
        await supabaseAdmin
          .from("saas_companies")
          .update({
            subscription_tier: "starter",
            stripe_subscription_id: null,
            subscription_status: "active",
          })
          .eq("id", saasId);

        console.log(
          `Subscription cancelled for SaaS ${saasId}, reverted to starter`
        );
      }
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as any;
      const subscriptionId = invoice.subscription;

      if (subscriptionId) {
        await supabaseAdmin
          .from("saas_companies")
          .update({ subscription_status: "past_due" })
          .eq("stripe_subscription_id", subscriptionId);

        console.log(`Payment failed for subscription ${subscriptionId}`);
      }
      break;
    }

    // =====================================================
    // BP1 MODEL: Transfer events (Creator payouts)
    // =====================================================
    default: {
      // Handle transfer events (not in Stripe TypeScript types, so check string)
      const eventType = event.type as string;
      if (eventType.startsWith("transfer.")) {
        const transfer = event.data.object as any;

        if (transfer.metadata?.payout_id) {
          if (eventType === "transfer.created") {
            await supabaseAdmin
              .from("creator_payouts")
              .update({
                stripe_transfer_id: transfer.id,
                status: "processing",
              })
              .eq("id", transfer.metadata.payout_id);
            console.log(
              `Transfer created for payout ${transfer.metadata.payout_id}`
            );
          } else if (eventType === "transfer.paid") {
            await supabaseAdmin
              .from("creator_payouts")
              .update({
                status: "completed",
                completed_at: new Date().toISOString(),
              })
              .eq("id", transfer.metadata.payout_id);
            console.log(
              `Transfer completed for payout ${transfer.metadata.payout_id}`
            );
          } else if (
            eventType === "transfer.failed" ||
            eventType === "transfer.reversed"
          ) {
            await supabaseAdmin
              .from("creator_payouts")
              .update({
                status: "failed",
                failed_at: new Date().toISOString(),
                error_message: transfer.failure_message || "Transfer failed",
              })
              .eq("id", transfer.metadata.payout_id);

            // Refund the amount back to creator's available balance
            const { data: payout } = await supabaseAdmin
              .from("creator_payouts")
              .select("creator_id, amount")
              .eq("id", transfer.metadata.payout_id)
              .single();

            if (payout) {
              await supabaseAdmin.rpc("move_wallet_pending_to_available", {
                p_creator_id: payout.creator_id,
                p_amount: payout.amount,
              });
            }

            console.log(
              `Transfer failed for payout ${transfer.metadata.payout_id}`
            );
          }
        }
      } else {
        console.log(`Unhandled event type: ${event.type}`);
      }
      break;
    }

    // =====================================================
    // BP1 MODEL: Setup Intent (Card validation)
    // =====================================================
    case "setup_intent.succeeded": {
      const setupIntent = event.data.object as any;

      if (
        setupIntent.metadata?.saas_id &&
        setupIntent.metadata?.purpose === "card_validation"
      ) {
        const paymentMethodId = setupIntent.payment_method as string;

        if (paymentMethodId) {
          const paymentMethod = await stripe.paymentMethods.retrieve(
            paymentMethodId
          );

          await supabaseAdmin
            .from("saas_companies")
            .update({
              card_on_file: true,
              card_last4: paymentMethod.card?.last4 || null,
              card_brand: paymentMethod.card?.brand || null,
              stripe_setup_intent_id: setupIntent.id,
            })
            .eq("id", setupIntent.metadata.saas_id);

          console.log(
            `Card validated for SaaS ${setupIntent.metadata.saas_id}`
          );
        }
      }
      break;
    }
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
      .from("saas_companies")
      .select("id, company_name")
      .eq("stripe_account_id", stripeAccountId)
      .single();

    if (!saasCompany) {
      console.log(`No SaaS found for Stripe account ${stripeAccountId}`);
      return;
    }

    // 2. Extract revenue amount (in cents, convert to euros)
    const amountCents = paymentData.amount || paymentData.amount_total || 0;
    const grossRevenue = amountCents / 100;

    if (grossRevenue <= 0) {
      console.log("Payment has no revenue, skipping");
      return;
    }

    // 3. Calculate Stripe fees and net revenue
    // Try to get actual fee from balance_transaction if available
    let stripeFee = 0;
    let netRevenue = grossRevenue;

    // Check if we have balance_transaction data (from charge or payment_intent)
    const balanceTransactionId =
      paymentData.balance_transaction ||
      paymentData.charge?.balance_transaction ||
      paymentData.payment_intent?.charges?.data?.[0]?.balance_transaction;

    if (balanceTransactionId && stripe) {
      try {
        // Fetch balance transaction to get actual fees
        const balanceTransaction = await stripe.balanceTransactions.retrieve(
          balanceTransactionId,
          { stripeAccount: stripeAccountId }
        );

        // Fee is in cents, convert to euros
        stripeFee = (balanceTransaction.fee || 0) / 100;
        netRevenue = grossRevenue - stripeFee;
      } catch (error) {
        console.warn(
          `Could not fetch balance transaction ${balanceTransactionId}, using estimated fees`
        );
        // Fall back to estimated fees
        const isEU =
          paymentData.billing_details?.address?.country
            ?.toUpperCase()
            .startsWith("EU") ||
          paymentData.billing_details?.address?.country === "FR" ||
          paymentData.billing_details?.address?.country === "DE" ||
          paymentData.billing_details?.address?.country === "ES" ||
          paymentData.billing_details?.address?.country === "IT";

        // EU: 3.2% + €0.25, Non-EU: 3.9% + €0.25
        const feeRate = isEU ? 0.032 : 0.039;
        const fixedFee = 0.25;
        stripeFee = Math.round((grossRevenue * feeRate + fixedFee) * 100) / 100;
        netRevenue = grossRevenue - stripeFee;
      }
    } else {
      // No balance transaction available, estimate fees
      const isEU =
        paymentData.billing_details?.address?.country
          ?.toUpperCase()
          .startsWith("EU") ||
        paymentData.billing_details?.address?.country === "FR" ||
        paymentData.billing_details?.address?.country === "DE" ||
        paymentData.billing_details?.address?.country === "ES" ||
        paymentData.billing_details?.address?.country === "IT";

      // EU: 3.2% + €0.25, Non-EU: 3.9% + €0.25
      const feeRate = isEU ? 0.032 : 0.039;
      const fixedFee = 0.25;
      stripeFee = Math.round((grossRevenue * feeRate + fixedFee) * 100) / 100;
      netRevenue = grossRevenue - stripeFee;
    }

    // 4. Try to find attribution via metadata or customer email
    // Option A: Check if naano_session is in metadata
    const naanoSession = paymentData.metadata?.naano_session;

    // Option B: Check customer email for existing session
    const customerEmail =
      paymentData.customer_email ||
      paymentData.receipt_email ||
      paymentData.billing_details?.email;

    let trackedLinkId: string | null = null;
    let sessionId: string | null = naanoSession;

    if (naanoSession) {
      // Direct attribution via session ID
      const { data: clickEvent } = await supabaseAdmin
        .from("link_events")
        .select("tracked_link_id")
        .eq("session_id", naanoSession)
        .eq("event_type", "click")
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
        .from("link_events")
        .select(
          `
          tracked_link_id,
          session_id,
          tracked_links!inner (
            collaborations!inner (
              applications!inner (
                saas_id
              )
            )
          )
        `
        )
        .eq("event_type", "click")
        .gte("occurred_at", thirtyDaysAgo.toISOString())
        .order("occurred_at", { ascending: false })
        .limit(100);

      // Find a click that belongs to this SaaS
      const matchingClick = recentClicks?.find(
        (click: any) =>
          click.tracked_links?.collaborations?.applications?.saas_id ===
          saasCompany.id
      );

      if (matchingClick) {
        trackedLinkId = matchingClick.tracked_link_id;
        sessionId = matchingClick.session_id;
        console.log(
          `Found attribution via recent click for ${saasCompany.company_name}`
        );
      }
    }

    // 5. If we found attribution, log the conversion
    if (trackedLinkId && sessionId) {
      // Check for duplicate
      const { data: existingConversion } = await supabaseAdmin
        .from("link_events")
        .select("id")
        .eq("tracked_link_id", trackedLinkId)
        .eq("event_type", "conversion")
        .eq("referrer", `stripe:${paymentData.id}`)
        .single();

      if (!existingConversion) {
        await supabaseAdmin.from("link_events").insert({
          tracked_link_id: trackedLinkId,
          event_type: "conversion",
          session_id: sessionId,
          revenue_amount: grossRevenue, // Gross revenue (what customer paid)
          net_revenue_amount: netRevenue, // Net revenue (after Stripe fees)
          stripe_fee_amount: stripeFee, // Stripe fees deducted
          referrer: `stripe:${paymentData.id}`, // Store Stripe payment ID to prevent duplicates
          ip_address: "stripe_webhook",
          user_agent: `stripe_${eventType}`,
        });

        console.log(
          `✅ Revenue attributed: €${grossRevenue} gross (€${netRevenue} net after €${stripeFee} fees) for ${saasCompany.company_name} via Stripe Connect`
        );
      } else {
        console.log(`Duplicate conversion skipped: ${paymentData.id}`);
      }
    } else {
      console.log(
        `No attribution found for payment ${paymentData.id} from ${saasCompany.company_name}`
      );
    }
  } catch (error) {
    console.error("Error handling connected account payment:", error);
  }
}
