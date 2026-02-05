import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  let user = null
  try {
    const { data, error } = await supabase.auth.getUser()
    
    // If there's an error or no user, clear any stale cookies
    if (error || !data.user) {
      const allCookies = request.cookies.getAll()
      allCookies.forEach((cookie) => {
        if (cookie.name.startsWith('sb-')) {
          supabaseResponse.cookies.delete(cookie.name)
        }
      })
      user = null
    } else {
    user = data.user
    }
  } catch (error) {
    console.error('Middleware Auth Error:', error)
    // Clear cookies on error
    const allCookies = request.cookies.getAll()
    allCookies.forEach((cookie) => {
      if (cookie.name.startsWith('sb-')) {
        supabaseResponse.cookies.delete(cookie.name)
      }
    })
    user = null
  }

  // Require verified email for dashboard access
  const isVerified = user?.email_confirmed_at != null

  if (request.nextUrl.pathname.startsWith('/dashboard')) {
    if (!user) return NextResponse.redirect(new URL('/login', request.url))
    if (!isVerified) {
      return NextResponse.redirect(new URL('/login?message=verify_email', request.url))
    }
  }

  // Only redirect to dashboard if user is verified (so unverified users see the login form)
  if (request.nextUrl.pathname === '/login' && user && isVerified) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  if (request.nextUrl.pathname === '/register' && user && isVerified) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return supabaseResponse
}
