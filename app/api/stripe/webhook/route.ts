import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { stripe } from "@/lib/stripe";
import { createClient } from "@supabase/supabase-js";
import type { Stripe } from "stripe";

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
        // Check if this is a credit subscription checkout
        if (
          session.mode === "subscription" &&
          session.subscription &&
          session.metadata?.type === "credit_subscription"
        ) {
          const saasId = session.metadata.saas_id;
          const creditVolume = parseInt(session.metadata.credit_volume || "0");
          const unitPrice = parseFloat(session.metadata.unit_price || "0");
          const subscriptionId = session.subscription as string;

          if (saasId && creditVolume > 0) {
            // Get subscription to get the actual invoice
            const subscription = await stripe.subscriptions.retrieve(subscriptionId);
            
            // Calculate correct price vs what Stripe charged
            const correctTotalPrice = parseFloat(session.metadata.total_price || "0");
            const correctTotalCents = Math.round(correctTotalPrice * 100);
            
            // Get the latest invoice to see what was actually charged
            const latestInvoice = await stripe.invoices.retrieve(subscription.latest_invoice as string);
            const amountCharged = latestInvoice.amount_paid; // in cents
            
            // If there's a difference, create an invoice item to adjust
            if (amountCharged !== correctTotalCents && correctTotalCents > 0) {
              const difference = correctTotalCents - amountCharged;
              
              if (difference !== 0) {
                // Create invoice item to adjust the price
                await stripe.invoiceItems.create({
                  customer: subscription.customer as string,
                  subscription: subscriptionId,
                  amount: difference, // Positive = credit, Negative = additional charge
                  currency: 'eur',
                  description: `Volume pricing adjustment for ${creditVolume} credits`,
                });
                
                // Finalize the invoice with the adjustment
                await stripe.invoices.finalizeInvoice(latestInvoice.id);
                
                console.log(
                  `Price adjustment applied: Charged ${amountCharged/100}€, Correct ${correctTotalPrice}€, Adjustment ${difference/100}€`
                );
              }
            }
            
            // Add credits to SaaS wallet (initial purchase)
            const { error: creditError } = await supabaseAdmin.rpc('add_saas_credits', {
              p_saas_id: saasId,
              p_credits_to_add: creditVolume,
              p_stripe_subscription_id: subscriptionId,
            });

            if (creditError) {
              console.error('Error adding credits:', creditError);
            }

            // Update SaaS company with subscription info
            const renewalDate = new Date();
            renewalDate.setMonth(renewalDate.getMonth() + 1);

            await supabaseAdmin
              .from("saas_companies")
              .update({
                stripe_subscription_id_credits: subscriptionId,
                monthly_credit_subscription: creditVolume,
                credit_renewal_date: renewalDate.toISOString().split('T')[0],
              })
              .eq("id", saasId);

            console.log(
              `Credit subscription created for SaaS ${saasId}: ${creditVolume} credits`
            );
          }
        }
        // Check if this is a Creator Pro subscription checkout
        else if (
          session.mode === "subscription" &&
          session.subscription &&
          session.metadata?.type === "creator_pro"
        ) {
          const creatorId = session.metadata.creator_id;
          const plan = session.metadata.plan;
          const subscriptionId = session.subscription as string;

          if (creatorId) {
            // Calculate expiration date
            const expirationDate = new Date();
            if (plan === 'monthly') {
              expirationDate.setMonth(expirationDate.getMonth() + 1);
            } else {
              expirationDate.setFullYear(expirationDate.getFullYear() + 1);
            }

            await supabaseAdmin
              .from("creator_profiles")
              .update({
                is_pro: true,
                pro_status_source: 'PAYMENT',
                pro_expiration_date: expirationDate.toISOString(),
                stripe_subscription_id_pro: subscriptionId,
              })
              .eq("id", creatorId);

            console.log(
              `Creator Pro subscription activated for creator ${creatorId}: ${plan}`
            );
          }
        }
        // Check if this is a SaaS tier subscription checkout (old system)
        else if (
          session.mode === "subscription" &&
          session.subscription &&
          session.metadata?.saas_id &&
          session.metadata?.tier
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
      
      // Handle credit subscription updates
      if (subscription.metadata?.type === "credit_subscription") {
        const saasId = subscription.metadata.saas_id;
        const creditVolume = parseInt(subscription.metadata.credit_volume || "0");

        if (saasId && creditVolume > 0) {
          await supabaseAdmin
            .from("saas_companies")
            .update({
              stripe_subscription_id_credits: subscription.id,
              monthly_credit_subscription: creditVolume,
              credit_renewal_date: new Date((subscription as any).current_period_end * 1000).toISOString().split('T')[0],
            })
            .eq("id", saasId);

          console.log(`Credit subscription ${event.type} for SaaS ${saasId}`);
        }
      }
      // Handle Creator Pro subscription updates
      else if (subscription.metadata?.type === "creator_pro") {
        const creatorId = subscription.metadata.creator_id;
        const plan = subscription.metadata.plan;

        if (creatorId) {
          const expirationDate = new Date((subscription as any).current_period_end * 1000);

          await supabaseAdmin
            .from("creator_profiles")
            .update({
              is_pro: subscription.status === "active",
              stripe_subscription_id_pro: subscription.id,
              pro_expiration_date: expirationDate.toISOString(),
            })
            .eq("id", creatorId);

          console.log(`Creator Pro subscription ${event.type} for creator ${creatorId}`);
        }
      }
      // Handle old SaaS tier subscriptions
      else {
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
      }
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as any;
      
      // Handle credit subscription cancellation
      if (subscription.metadata?.type === "credit_subscription") {
        const saasId = subscription.metadata.saas_id;

        if (saasId) {
          // Credits remain until renewal date (as per decision)
          // Just remove subscription ID, keep credits
          await supabaseAdmin
            .from("saas_companies")
            .update({
              stripe_subscription_id_credits: null,
              // Don't clear monthly_credit_subscription or credit_renewal_date
              // Credits remain until renewal date
            })
            .eq("id", saasId);

          console.log(
            `Credit subscription cancelled for SaaS ${saasId} (credits remain until renewal)`
          );
        }
      }
      // Handle Creator Pro cancellation
      else if (subscription.metadata?.type === "creator_pro") {
        const creatorId = subscription.metadata.creator_id;

        if (creatorId) {
          // Keep Pro until end of billing period (as per decision)
          // Set expiration to end of current period
          const expirationDate = new Date((subscription as any).current_period_end * 1000);

          await supabaseAdmin
            .from("creator_profiles")
            .update({
              stripe_subscription_id_pro: null,
              pro_expiration_date: expirationDate.toISOString(),
              // Keep is_pro = true until expiration
            })
            .eq("id", creatorId);

          console.log(
            `Creator Pro subscription cancelled for creator ${creatorId} (Pro until ${expirationDate})`
          );
        }
      }
      // Handle old SaaS tier subscription cancellation
      else {
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
      }
      break;
    }

    case "invoice.paid": {
      const invoice = event.data.object as any;
      const subscriptionId = invoice.subscription;

      if (subscriptionId) {
        // Get subscription to check type
        const subscription = await stripe.subscriptions.retrieve(subscriptionId) as Stripe.Subscription;
        
        // Handle credit subscription renewal
        if (subscription.metadata?.type === "credit_subscription") {
          const saasId = subscription.metadata.saas_id;
          const creditVolume = parseInt(subscription.metadata.credit_volume || "0");

          if (saasId && creditVolume > 0) {
            // Add credits with roll-over (current balance + new credits)
            const { error: creditError } = await supabaseAdmin.rpc('add_saas_credits', {
              p_saas_id: saasId,
              p_credits_to_add: creditVolume,
              p_stripe_subscription_id: subscriptionId,
            });

            if (creditError) {
              console.error('Error adding credits on renewal:', creditError);
            } else {
              // Update renewal date
              const renewalDate = new Date((subscription as any).current_period_end * 1000);
              await supabaseAdmin
                .from("saas_companies")
                .update({
                  credit_renewal_date: renewalDate.toISOString().split('T')[0],
                })
                .eq("id", saasId);

              console.log(
                `Credit subscription renewed for SaaS ${saasId}: +${creditVolume} credits (with roll-over)`
              );
            }
          }
        }
        // Handle Creator Pro renewal
        else if (subscription.metadata?.type === "creator_pro") {
          const creatorId = subscription.metadata.creator_id;
          const plan = subscription.metadata.plan;

          if (creatorId) {
            const expirationDate = new Date((subscription as any).current_period_end * 1000);

            await supabaseAdmin
              .from("creator_profiles")
              .update({
                is_pro: true,
                pro_expiration_date: expirationDate.toISOString(),
              })
              .eq("id", creatorId);

            console.log(`Creator Pro renewed for creator ${creatorId}: ${plan}`);
          }
        }
      }
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as any;
      const subscriptionId = invoice.subscription;

      if (subscriptionId) {
        // Get subscription to check type
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        
        if (subscription.metadata?.type === "credit_subscription") {
          const saasId = subscription.metadata.saas_id;
          // Log failure but don't remove credits (they remain until renewal date)
          console.log(`Credit subscription payment failed for SaaS ${saasId}`);
        } else if (subscription.metadata?.type === "creator_pro") {
          const creatorId = subscription.metadata.creator_id;
          // Pro expires at end of period, not immediately
          console.log(`Creator Pro payment failed for creator ${creatorId}`);
        } else {
          // Old SaaS tier subscription
          await supabaseAdmin
            .from("saas_companies")
            .update({ subscription_status: "past_due" })
            .eq("stripe_subscription_id", subscriptionId);

          console.log(`Payment failed for subscription ${subscriptionId}`);
        }
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
