import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Use service role for lead creation (no user context needed)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin =
  supabaseUrl && supabaseServiceKey
    ? createClient(supabaseUrl, supabaseServiceKey)
    : null;

/**
 * Create a lead (called when lead is validated)
 * CREDIT SYSTEM: Uses credit-based model (PlanP)
 */
export async function POST(request: Request) {
  if (!supabaseAdmin) {
    return NextResponse.json(
      { error: 'Service non configuré' },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();
    const { tracked_link_id, creator_id, saas_id } = body;

    // Validate required fields
    if (!tracked_link_id || !creator_id || !saas_id) {
      return NextResponse.json(
        { error: 'Missing required fields: tracked_link_id, creator_id, saas_id' },
        { status: 400 }
      );
    }

    // Verify tracked link exists and belongs to the collaboration
    const { data: trackedLink, error: linkError } = await supabaseAdmin
      .from('tracked_links')
      .select('id, collaboration_id')
      .eq('id', tracked_link_id)
      .single();

    if (linkError || !trackedLink) {
      return NextResponse.json(
        { error: 'Tracked link not found' },
        { status: 404 }
      );
    }

    // Verify creator and SaaS exist
    const { data: creator } = await supabaseAdmin
      .from('creator_profiles')
      .select('id')
      .eq('id', creator_id)
      .single();

    const { data: saas } = await supabaseAdmin
      .from('saas_companies')
      .select('id, wallet_credits')
      .eq('id', saas_id)
      .single();

    if (!creator || !saas) {
      return NextResponse.json(
        { error: 'Creator or SaaS not found' },
        { status: 404 }
      );
    }

    // CREDIT SYSTEM: Check if SaaS has credits
    const walletCredits = (saas as any).wallet_credits || 0;
    if (walletCredits <= 0) {
      return NextResponse.json(
        { 
          error: 'Insufficient credits',
          message: 'SaaS has no credits available. Lead cannot be created.',
          credits_remaining: 0
        },
        { status: 400 }
      );
    }

    // Create lead using new credit-based function
    // This function:
    // 1. Checks if SaaS has credits > 0
    // 2. Gets creator payout amount (€0.90 Standard or €1.10 Pro)
    // 3. Deducts 1 credit
    // 4. Creates lead with payout amount
    // 5. Updates creator wallet (pending)
    const { data: leadId, error: leadError } = await supabaseAdmin.rpc(
      'create_lead_with_credits',
      {
        p_tracked_link_id: tracked_link_id,
        p_creator_id: creator_id,
        p_saas_id: saas_id,
      }
    );

    if (leadError) {
      console.error('Error creating lead:', leadError);
      
      // Check if error is about insufficient credits
      if (leadError.message?.includes('Insufficient credits')) {
        return NextResponse.json(
          { 
            error: 'Insufficient credits',
            message: leadError.message,
            credits_remaining: walletCredits
          },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: 'Failed to create lead', details: leadError.message },
        { status: 500 }
      );
    }

    // Get created lead details
    const { data: lead } = await supabaseAdmin
      .from('leads')
      .select('id, creator_payout_amount, credits_deducted, status, created_at')
      .eq('id', leadId)
      .single();

    // Get updated credit balance
    const { data: updatedSaas } = await supabaseAdmin
      .from('saas_companies')
      .select('wallet_credits')
      .eq('id', saas_id)
      .single();

    return NextResponse.json({
      success: true,
      lead: {
        id: leadId,
        creator_payout_amount: lead?.creator_payout_amount,
        credits_deducted: lead?.credits_deducted,
        status: lead?.status,
      },
      credits_remaining: updatedSaas?.wallet_credits || 0,
      message: 'Lead created successfully',
    });
  } catch (error: any) {
    console.error('Lead creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

