'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

/**
 * Wallet system functions
 * Get creator wallet balance (pending/available)
 */

/**
 * Get creator wallet summary
 */
export async function getCreatorWalletSummary() {
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
    return {
      pendingBalance: 0,
      availableBalance: 0,
      totalEarned: 0,
    };
  }

  // Get wallet
  const { data: wallet, error } = await supabase
    .from('creator_wallets')
    .select('pending_balance, available_balance, total_earned')
    .eq('creator_id', creatorProfile.id)
    .single();

  if (error || !wallet) {
    return {
      pendingBalance: 0,
      availableBalance: 0,
      totalEarned: 0,
    };
  }

  return {
    pendingBalance: Number(wallet.pending_balance || 0),
    availableBalance: Number(wallet.available_balance || 0),
    totalEarned: Number(wallet.total_earned || 0),
  };
}

/**
 * Get creator payout history
 */
export async function getCreatorPayoutHistory() {
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
    return { payouts: [] };
  }

  // Get payout history
  const { data: payouts, error } = await supabase
    .from('creator_payouts')
    .select('*')
    .eq('creator_id', creatorProfile.id)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    console.error('Error fetching payout history:', error);
    return { payouts: [] };
  }

  return { payouts: payouts || [] };
}


