'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

// =====================================================
// COMMISSION CALCULATION & FETCHING
// =====================================================

/**
 * Calculate commissions for a specific collaboration and period
 */
export async function calculateCommissionForPeriod(
  collaborationId: string,
  periodStart: Date,
  periodEnd: Date
) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'Non authentifié' };
  }

  // Only admins or collaboration participants can trigger calculation
  // For now, allow any authenticated user (we can restrict later)
  
  const { data, error } = await supabase.rpc('calculate_commission_for_period', {
    p_collaboration_id: collaborationId,
    p_period_start: periodStart.toISOString(),
    p_period_end: periodEnd.toISOString(),
  });

  if (error) {
    console.error('Error calculating commission:', error);
    return { error: error.message };
  }

  return { success: true, commissionId: data };
}

/**
 * Calculate all commissions for a specific month
 */
export async function calculateMonthlyCommissions(year: number, month: number) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'Non authentifié' };
  }

  // Only admins should be able to do this
  // For now, allow any authenticated user (we can restrict later)
  
  const { data, error } = await supabase.rpc('calculate_monthly_commissions', {
    p_year: year,
    p_month: month,
  });

  if (error) {
    console.error('Error calculating monthly commissions:', error);
    return { error: error.message };
  }

  return { success: true, processedCount: data };
}

/**
 * Get creator earnings summary
 */
export async function getCreatorEarningsSummary() {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login');
  }

  const { data: earnings, error } = await supabase.rpc('get_creator_earnings_summary', {
    p_creator_profile_id: user.id,
  });

  if (error) {
    console.error('Error fetching creator earnings:', error);
    return { 
      pendingEarnings: 0,
      paidEarnings: 0,
      totalEarnings: 0,
      pendingCount: 0,
      paidCount: 0,
    };
  }

  if (!earnings || earnings.length === 0) {
    return {
      pendingEarnings: 0,
      paidEarnings: 0,
      totalEarnings: 0,
      pendingCount: 0,
      paidCount: 0,
    };
  }

  const summary = earnings[0];
  return {
    pendingEarnings: Number(summary.pending_earnings || 0),
    paidEarnings: Number(summary.paid_earnings || 0),
    totalEarnings: Number(summary.total_earnings || 0),
    pendingCount: Number(summary.pending_count || 0),
    paidCount: Number(summary.paid_count || 0),
  };
}

/**
 * Get creator's pending commissions (for payout)
 */
export async function getCreatorPendingCommissions() {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login');
  }

  // Get creator profile
  const { data: creatorProfile } = await supabase
    .from('creator_profiles')
    .select('id')
    .eq('profile_id', user.id)
    .single();

  if (!creatorProfile) {
    return { commissions: [], totalAmount: 0 };
  }

  // Get pending commissions
  const { data: commissions, error } = await supabase
    .from('commissions')
    .select(`
      id,
      collaboration_id,
      total_revenue_generated,
      creator_net_earnings,
      period_start,
      period_end,
      created_at,
      collaborations!inner(
        id,
        applications!inner(
          saas_companies!inner(company_name)
        )
      )
    `)
    .eq('creator_id', creatorProfile.id)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching pending commissions:', error);
    return { commissions: [], totalAmount: 0 };
  }

  const totalAmount = commissions?.reduce((sum, c) => sum + Number(c.creator_net_earnings || 0), 0) || 0;

  return {
    commissions: commissions || [],
    totalAmount,
  };
}

/**
 * Get SaaS commission summary
 */
export async function getSaasCommissionSummary() {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login');
  }

  // Get SaaS company
  const { data: saasCompany } = await supabase
    .from('saas_companies')
    .select('id')
    .eq('profile_id', user.id)
    .single();

  if (!saasCompany) {
    return {
      totalCommissionsDue: 0,
      totalRevenueGenerated: 0,
      activeCollaborationsCount: 0,
    };
  }

  const { data: summary, error } = await supabase.rpc('get_saas_commission_summary', {
    p_saas_id: saasCompany.id,
  });

  if (error) {
    console.error('Error fetching SaaS commission summary:', error);
    return {
      totalCommissionsDue: 0,
      totalRevenueGenerated: 0,
      activeCollaborationsCount: 0,
    };
  }

  if (!summary || summary.length === 0) {
    return {
      totalCommissionsDue: 0,
      totalRevenueGenerated: 0,
      activeCollaborationsCount: 0,
    };
  }

  const result = summary[0];
  return {
    totalCommissionsDue: Number(result.total_commissions_due || 0),
    totalRevenueGenerated: Number(result.total_revenue_generated || 0),
    activeCollaborationsCount: Number(result.active_collaborations_count || 0),
  };
}

/**
 * Get SaaS commission history
 */
export async function getSaasCommissionHistory() {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login');
  }

  // Get SaaS company
  const { data: saasCompany } = await supabase
    .from('saas_companies')
    .select('id')
    .eq('profile_id', user.id)
    .single();

  if (!saasCompany) {
    return { commissions: [] };
  }

  // Get all commissions (pending and paid)
  const { data: commissions, error } = await supabase
    .from('commissions')
    .select(`
      id,
      collaboration_id,
      total_revenue_generated,
      creator_net_earnings,
      platform_saas_fee,
      period_start,
      period_end,
      status,
      created_at,
      paid_at,
      collaborations!inner(
        id,
        applications!inner(
          creator_profiles!inner(
            id,
            profiles!inner(full_name, avatar_url)
          )
        )
      )
    `)
    .eq('saas_id', saasCompany.id)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    console.error('Error fetching SaaS commission history:', error);
    return { commissions: [] };
  }

  return { commissions: commissions || [] };
}

