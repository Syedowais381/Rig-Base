import { createClient } from '@/lib/supabase/server'
import { validateOnboardingConfig } from '@/lib/onboarding-config'
import { persistWorkspace } from '@/lib/workspace-service'
import { resolveWorkspaceForUser } from '@/lib/workspace-access'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const rawConfig = await request.json()
  const validation = validateOnboardingConfig(rawConfig)
  if (!validation.success) {
    console.error('Workspace validation failed', { userId: user.id, reason: validation.error })
    return NextResponse.json({ error: validation.error }, { status: 400 })
  }

  const result = await persistWorkspace(supabase, user.id, validation.data)
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: result.status })
  }

  return NextResponse.json({ success: true, stage: 'workspace_ready' })
}

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const access = await resolveWorkspaceForUser(supabase, user.id)

  if (!access) {
    return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })
  }

  const { workspace } = access

  if (access.isOwner) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('onboarding_completed')
      .eq('id', user.id)
      .maybeSingle()

    if (profile && profile.onboarding_completed === false) {
      await supabase.from('profiles').update({ onboarding_completed: true }).eq('id', user.id)
    }
  }

  return NextResponse.json(workspace)
}
