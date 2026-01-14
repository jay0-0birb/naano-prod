import { NextResponse } from 'next/server';
import { createClient } from '@supabase/server';
import { stripe } from '@/lib/stripe';
import { createClient as createAdminClient } from '@supabase/supabase-js';

const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Check and bill SaaS if threshold reached
 * Called by cron job or manually
 */
export async function POST(request: Request) {
  if (!stripe || !supabaseAdmin) {
    return NextResponse.json(
      { error: 'Service non configuré' },
      { status: 503 }
    );
  }

  try {
    const body = await request.json().catch(() => ({}));
    const { saas_id } = body;

    // If specific SaaS provided, bill only that one
    if (saas_id) {
      const result = await billSingleSaaS(saas_id);
      return NextResponse.json(result);
    }

    // Otherwise, check all SaaS that should be billed
    const { data: saasToBill, error } = await supabaseAdmin.rpc('get_saas_to_bill');

    if (error) {
      console.error('Error getting SaaS to bill:', error);
      return NextResponse.json(
        { error: 'Failed to get SaaS to bill' },
        { status: 500 }
      );
    }

    if (!saasToBill || saasToBill.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No SaaS to bill',
        billed_count: 0,
      });
    }

    const results = [];
    for (const saas of saasToBill) {
      try {
        const result = await billSingleSaaS(saas.saas_id);
        results.push(result);
      } catch (error: any) {
        console.error(`Error billing SaaS ${saas.saas_id}:`, error);
        results.push({
          saas_id: saas.saas_id,
          success: false,
          error: error.message,
        });
      }
    }

    return NextResponse.json({
      success: true,
      billed_count: results.filter((r) => r.success).length,
      failed_count: results.filter((r) => !r.success).length,
      results,
    });
  } catch (error: any) {
    console.error('Billing error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

async function billSingleSaaS(saasId: string) {
  // Get SaaS details
  const { data: saas, error: saasError } = await supabaseAdmin
    .from('saas_companies')
    .select('id, company_name, profile_id, card_on_file, stripe_customer_id')
    .eq('id', saasId)
    .single();

  if (saasError || !saas) {
    throw new Error('SaaS not found');
  }

  if (!saas.card_on_file || !saas.stripe_customer_id) {
    throw new Error('SaaS does not have payment method on file');
  }

  // Create invoice in database
  const { data: invoiceId, error: invoiceError } = await supabaseAdmin.rpc(
    'bill_saas',
    {
      p_saas_id: saasId,
    }
  );

  if (invoiceError) {
    throw new Error(`Failed to create invoice: ${invoiceError.message}`);
  }

  // Get invoice details
  const { data: invoice } = await supabaseAdmin
    .from('billing_invoices')
    .select('*')
    .eq('id', invoiceId)
    .single();

  if (!invoice) {
    throw new Error('Invoice not found after creation');
  }

  // Charge SaaS via Stripe
  const amountInCents = Math.round(invoice.amount_ht * 100);

  try {
    // Get payment methods attached to this customer
    const paymentMethods = await stripe.paymentMethods.list({
      customer: saas.stripe_customer_id,
      type: 'card',
    });

    if (paymentMethods.data.length === 0) {
      throw new Error('No payment method found for customer. Please add a card in settings.');
    }

    // Use the first (most recent) payment method
    const paymentMethodId = paymentMethods.data[0].id;

    // Create and confirm payment intent with saved payment method
    // off_session: true means we're charging a saved card without customer interaction
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: 'eur',
      customer: saas.stripe_customer_id,
      payment_method: paymentMethodId,
      off_session: true, // Saved payment method, no customer interaction needed
      confirm: true, // Automatically confirm
      description: `Naano - Facture ${invoice.invoice_number} - ${invoice.leads_count} leads`,
      metadata: {
        invoice_id: invoice.id,
        saas_id: saasId,
        invoice_number: invoice.invoice_number,
      },
    });

    // Payment intent is already confirmed (confirm: true)
    const confirmedPayment = paymentIntent;

    // Update invoice with Stripe details
    await supabaseAdmin
      .from('billing_invoices')
      .update({
        stripe_payment_intent_id: confirmedPayment.id,
        status: confirmedPayment.status === 'succeeded' ? 'paid' : 'sent',
        paid_at:
          confirmedPayment.status === 'succeeded'
            ? new Date().toISOString()
            : null,
      })
      .eq('id', invoiceId);

    return {
      saas_id: saasId,
      invoice_id: invoiceId,
      invoice_number: invoice.invoice_number,
      amount: invoice.amount_ht,
      leads_count: invoice.leads_count,
      stripe_payment_intent_id: confirmedPayment.id,
      status: confirmedPayment.status,
      success: confirmedPayment.status === 'succeeded',
    };
  } catch (stripeError: any) {
    // Update invoice as failed
    await supabaseAdmin
      .from('billing_invoices')
      .update({
        status: 'failed',
      })
      .eq('id', invoiceId);

    throw new Error(`Stripe payment failed: ${stripeError.message}`);
  }
}

