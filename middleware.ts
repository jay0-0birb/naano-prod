import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const BLOCKED_COUNTRIES = new Set<string>(["IN"]);

export function middleware(request: NextRequest) {
  const country = request.headers.get("x-vercel-ip-country") || "";

  if (BLOCKED_COUNTRIES.has(country)) {
    const url = request.nextUrl.clone();
    url.pathname = "/temporary-issue";

    // Rewrite to a generic "temporary issue" page without exposing geo-blocking.
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|pdf)$).*)',
  ],
}

