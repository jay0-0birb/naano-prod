import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getClientIP } from "@/lib/get-client-ip";

/**
 * Records the current user's IP on their creator_profiles for Naano promo self-click protection.
 * Call this when the creator copies their Naano link so we have a fresh IP to block self-clicks.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const creatorId = typeof body?.creatorId === "string" ? body.creatorId : null;
    if (!creatorId) {
      return NextResponse.json(
        { error: "Missing creatorId" },
        { status: 400 },
      );
    }

    const { data: creator } = await supabase
      .from("creator_profiles")
      .select("id")
      .eq("id", creatorId)
      .eq("profile_id", user.id)
      .maybeSingle();
    if (!creator) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const ip = getClientIP(request.headers);
    if (!ip || ip === "local") {
      return NextResponse.json({ success: true });
    }

    await supabase
      .from("creator_profiles")
      .update({
        last_seen_ip: ip,
        last_seen_ip_at: new Date().toISOString(),
      })
      .eq("id", creatorId);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
