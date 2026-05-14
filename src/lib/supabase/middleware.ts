import { createServerClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'
import { NextResponse, type NextRequest } from 'next/server'

/** True if profile says done OR a workspace row exists (avoids stuck onboarding when flag is out of sync). */
async function isUserOnboarded(supabase: SupabaseClient, userId: string): Promise<boolean> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('onboarding_completed')
    .eq('id', userId)
    .maybeSingle()

  if (profile?.onboarding_completed === true) {
    return true
  }

  const { data: workspace } = await supabase
    .from('workspaces')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle()

  return !!workspace
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const path = request.nextUrl.pathname

  // Marketing home: always render (Sign in / Get started stay available).
  if (path === '/') {
    return supabaseResponse
  }

  // Auth pages: always render so users can enter credentials, switch accounts, or sign out.
  // (A stale session was skipping the login/signup UI and sending people straight to onboarding.)
  if (path.startsWith('/auth')) {
    return supabaseResponse
  }

  // API routes: never redirect to HTML login (handlers return JSON 401).
  if (path.startsWith('/api')) {
    return supabaseResponse
  }

  // Protected routes
  if (!user) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    return NextResponse.redirect(url)
  }

  // Onboarding route
  if (path === '/onboarding') {
    if (await isUserOnboarded(supabase, user.id)) {
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard'
      return NextResponse.redirect(url)
    }
    return supabaseResponse
  }

  // Dashboard routes — require completed onboarding
  if (path.startsWith('/dashboard')) {
    if (!(await isUserOnboarded(supabase, user.id))) {
      const url = request.nextUrl.clone()
      url.pathname = '/onboarding'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}
