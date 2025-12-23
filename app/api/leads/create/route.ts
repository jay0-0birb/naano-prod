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
 * This follows BP1.md: Lead-based pricing model
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
      .select('id, subscription_tier')
      .eq('id', saas_id)
      .single();

    if (!creator || !saas) {
      return NextResponse.json(
        { error: 'Creator or SaaS not found' },
        { status: 404 }
      );
    }

    // Create lead using database function
    // This function:
    // 1. Gets SaaS's current plan
    // 2. Calculates lead_value based on plan (€2.50 / €2.00 / €1.60)
    // 3. Sets creator_earnings to €1.20 (fixed)
    // 4. Updates creator wallet (pending)
    // 5. Updates SaaS debt
    const { data: leadId, error: leadError } = await supabaseAdmin.rpc(
      'create_lead',
      {
        p_tracked_link_id: tracked_link_id,
        p_creator_id: creator_id,
        p_saas_id: saas_id,
      }
    );

    if (leadError) {
      console.error('Error creating lead:', leadError);
      return NextResponse.json(
        { error: 'Failed to create lead', details: leadError.message },
        { status: 500 }
      );
    }

    // Get created lead details
    const { data: lead } = await supabaseAdmin
      .from('leads')
      .select('id, saas_plan, lead_value, creator_earnings, naano_margin_brut, status, created_at')
      .eq('id', leadId)
      .single();

    // Check if SaaS should be billed (threshold reached)
    const { data: shouldBill } = await supabaseAdmin.rpc('should_bill_saas', {
      p_saas_id: saas_id,
    });

    return NextResponse.json({
      success: true,
      lead: {
        id: leadId,
        saas_plan: lead?.saas_plan,
        lead_value: lead?.lead_value,
        creator_earnings: lead?.creator_earnings,
        naano_margin_brut: lead?.naano_margin_brut,
        status: lead?.status,
      },
      should_bill: shouldBill,
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

