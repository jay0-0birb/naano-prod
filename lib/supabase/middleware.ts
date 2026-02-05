import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  const pathname = request.nextUrl.pathname;
  const isRscFetch =
    request.nextUrl.searchParams.has("_rsc") || request.headers.get("RSC") === "1";
  const sbCookies = request.cookies.getAll().filter((c) => c.name.startsWith("sb-"));
  console.log("[auth-middleware] request", {
    pathname,
    isRscFetch,
    sbCookieCount: sbCookies.length,
    search: request.nextUrl.search.slice(0, 50),
  });

  let user = null;
  try {
    const { data, error } = await supabase.auth.getUser();

    if (error || !data.user) {
      console.log("[auth-middleware] getUser: no user", {
        pathname,
        error: error?.message ?? null,
        hasDataUser: !!data?.user,
      });
      const allCookies = request.cookies.getAll();
      allCookies.forEach((cookie) => {
        if (cookie.name.startsWith("sb-")) {
          supabaseResponse.cookies.delete(cookie.name);
        }
      });
      user = null;
    } else {
      user = data.user;
      console.log("[auth-middleware] getUser: ok", {
        pathname,
        userId: user.id.slice(0, 8) + "...",
      });
    }
  } catch (error) {
    console.error("[auth-middleware] getUser threw", { pathname, error });
    const allCookies = request.cookies.getAll();
    allCookies.forEach((cookie) => {
      if (cookie.name.startsWith("sb-")) {
        supabaseResponse.cookies.delete(cookie.name);
      }
    });
    user = null;
  }

  // Only redirect full page loads to /dashboard, never RSC fetches (?_rsc=).
  if (pathname.startsWith("/dashboard") && !user) {
    if (!isRscFetch) {
      console.log("[auth-middleware] redirect to /login (full page, no user)", {
        pathname,
      });
      return NextResponse.redirect(new URL("/login", request.url));
    }
    console.log("[auth-middleware] dashboard but no user, allowing (RSC fetch)", {
      pathname,
    });
  }

  if (pathname === "/login" && user) {
    console.log("[auth-middleware] redirect to /dashboard (logged in)", { pathname });
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (pathname === "/register" && user) {
    console.log("[auth-middleware] redirect to /dashboard (logged in)", { pathname });
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  console.log("[auth-middleware] pass through", { pathname, hasUser: !!user });
  return supabaseResponse;
}
