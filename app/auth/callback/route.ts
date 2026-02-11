import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  // Default to onboarding first; that page will redirect to /dashboard once onboarding is completed
  const next = searchParams.get('next') ?? '/dashboard/onboarding'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Si erreur ou pas de code, rediriger vers login avec message d'erreur
  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`)
}

