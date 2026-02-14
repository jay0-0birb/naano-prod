"use server";

import { createClient } from "@supabase/supabase-js";

export type AffiliateReportRow = {
  code: string;
  referrerName: string;
  creatorCount: number;
  companyCount: number;
  creatorEarningsCents: number;
  companyCreditsCents: number;
  commissionCents: number;
};

/**
 * Get affiliate report for a given month. Uses service role to call report RPC.
 * Commission = 10% of (creator earnings + company credits) within each entity's 6-month window.
 */
export async function getAffiliateReport(
  year: number,
  month: number,
  codeFilter?: string | null
): Promise<AffiliateReportRow[]> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) return [];

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  });

  const { data, error } = await supabase.rpc("get_affiliate_report_month", {
    p_year: year,
    p_month: month,
    p_code_filter: codeFilter?.trim() || null,
  });

  if (error) {
    console.error("[affiliate-report]", error);
    return [];
  }

  return (data ?? []).map((row: {
    code: string;
    referrer_name: string;
    creator_count: number;
    company_count: number;
    creator_earnings_cents: number;
    company_credits_cents: number;
    commission_cents: string | number;
  }) => ({
    code: row.code,
    referrerName: row.referrer_name ?? "",
    creatorCount: Number(row.creator_count) ?? 0,
    companyCount: Number(row.company_count) ?? 0,
    creatorEarningsCents: Number(row.creator_earnings_cents) ?? 0,
    companyCreditsCents: Number(row.company_credits_cents) ?? 0,
    commissionCents: Math.round(Number(row.commission_cents) ?? 0),
  }));
}
