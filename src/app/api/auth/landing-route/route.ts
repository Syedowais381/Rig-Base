import { createClient } from '@/lib/supabase/server'
import { resolveDefaultLandingRoute, resolveServerPermissions } from '@/lib/rbac/server-permissions'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ route: '/auth/login' })
  }

  const ctx = await resolveServerPermissions(supabase, user.id)
  if (!ctx) {
    return NextResponse.json({ route: '/onboarding' })
  }

  return NextResponse.json({ route: resolveDefaultLandingRoute(ctx) })
}
