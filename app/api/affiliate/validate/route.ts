import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase =
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
    ? createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY,
        { auth: { persistSession: false } }
      )
    : null;

/**
 * GET /api/affiliate/validate?code=XXX
 * Returns { valid: true } if code exists in affiliate_codes (case-insensitive; we uppercase).
 * Used by landing page to set cookie only for valid codes.
 */
export async function GET(request: NextRequest) {
  if (!supabase) {
    return NextResponse.json({ valid: false }, { status: 500 });
  }
  const { searchParams } = new URL(request.url);
  const raw = searchParams.get("code");
  if (!raw || typeof raw !== "string") {
    return NextResponse.json({ valid: false }, { status: 200 });
  }
  const code = raw.trim().toUpperCase();
  if (!code) {
    return NextResponse.json({ valid: false }, { status: 200 });
  }

  const { data, error } = await supabase
    .from("affiliate_codes")
    .select("code")
    .eq("code", code)
    .maybeSingle();

  if (error) {
    console.error("[affiliate/validate]", error);
    return NextResponse.json({ valid: false }, { status: 200 });
  }
  return NextResponse.json({ valid: !!data }, { status: 200 });
}
