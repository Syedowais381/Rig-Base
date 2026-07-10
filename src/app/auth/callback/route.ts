import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

async function resolvePostAuthRedirect(supabase: Awaited<ReturnType<typeof createClient>>, userId: string, origin: string) {
  const { data: profile } = await supabase
    .from('profiles')
    .select('onboarding_completed')
    .eq('id', userId)
    .maybeSingle()

  if (profile?.onboarding_completed === true) {
    return `${origin}/dashboard`
  }

  const { data: workspace } = await supabase
    .from('workspaces')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle()

  if (workspace) {
    return `${origin}/dashboard`
  }

  const { data: employee } = await supabase
    .from('employees')
    .select('id')
    .eq('user_id', userId)
    .in('status', ['active', 'on_leave'])
    .maybeSingle()

  if (employee) {
    return `${origin}/dashboard`
  }

  return `${origin}/onboarding`
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const inviteToken = searchParams.get('invite')

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        if (inviteToken) {
          const { error: acceptError } = await supabase.rpc('accept_employee_invite', {
            p_token: inviteToken,
          })
          if (!acceptError) {
            return NextResponse.redirect(`${origin}/dashboard`)
          }
        }

        const redirectTo = await resolvePostAuthRedirect(supabase, user.id, origin)
        return NextResponse.redirect(redirectTo)
      }
    }
  }

  return NextResponse.redirect(`${origin}/auth/login`)
}
