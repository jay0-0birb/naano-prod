import { createClient } from "@/lib/supabase/server";
import { getAppUrl } from "@/lib/utils";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST() {
  const supabase = await createClient();

  // Sign out from Supabase
  await supabase.auth.signOut({ scope: "local" });

  // Force clear all Supabase cookies
  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll();

  allCookies.forEach((cookie) => {
    if (cookie.name.startsWith("sb-")) {
      cookieStore.delete(cookie.name);
    }
  });

  // Redirect to login
  return NextResponse.redirect(new URL("/login", getAppUrl()));
}

export async function GET() {
  return POST();
}
