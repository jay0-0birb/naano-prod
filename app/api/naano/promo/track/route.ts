import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getClientIP } from "@/lib/get-client-ip";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { creatorId, timeOnSite, visitorUserId } = body as {
      creatorId?: string;
      timeOnSite?: number;
      visitorUserId?: string;
    };

    if (!creatorId || typeof timeOnSite !== "number") {
      return NextResponse.json(
        { error: "Missing creatorId or timeOnSite" },
        { status: 400 },
      );
    }

    // Self-click protection: if the visitor is logged in and is the creator, do not count the click.
    if (visitorUserId) {
      const { data: creatorRow } = await supabase
        .from("creator_profiles")
        .select("id")
        .eq("profile_id", visitorUserId)
        .maybeSingle();
      if (creatorRow?.id === creatorId) {
        return NextResponse.json({ success: true });
      }
    }

    const ipAddress = getClientIP(request.headers);
    const userAgent = request.headers.get("user-agent") || "unknown";

    const { error } = await supabase.rpc("track_naano_promo_click", {
      p_creator_id: creatorId,
      p_ip_address: ipAddress,
      p_user_agent: userAgent,
      p_time_on_site: Math.round(timeOnSite),
    });

    if (error) {
      console.error("track_naano_promo_click error:", error);
      return NextResponse.json(
        { error: "Failed to track promo click" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Naano promo tracking error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

