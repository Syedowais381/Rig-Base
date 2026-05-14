import { createClient } from '@/lib/supabase/server'
import { validateOnboardingConfig } from '@/lib/onboarding-config'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const rawConfig = await request.json()
  const validation = validateOnboardingConfig(rawConfig)
  if (!validation.success) {
    console.error('Workspace validation failed', { userId: user.id, reason: validation.error })
    return NextResponse.json({ error: validation.error }, { status: 400 })
  }
  const config = validation.data

  console.info('Workspace save started', { userId: user.id, businessType: config.business_type })
  const { data: workspace, error: workspaceError } = await supabase
    .from('workspaces')
    .upsert({
      user_id: user.id,
      business_type: config.business_type,
      modules: config.modules,
      dashboard_metrics: config.dashboard_metrics,
      departments: config.departments,
      shifts: config.shifts,
      product_categories: config.product_categories,
      service_types: config.service_types,
      roles: config.roles,
      setup_checklist: config.setup_checklist,
    })
    .select('id')
    .single()

  if (workspaceError) {
    console.error('Workspace insert error:', workspaceError)
    return NextResponse.json({ error: 'Failed to save workspace' }, { status: 500 })
  }
  console.info('Workspace save completed', { userId: user.id, workspaceId: workspace?.id })

  const { error: profileError } = await supabase
    .from('profiles')
    .update({ onboarding_completed: true })
    .eq('id', user.id)

  if (profileError) {
    console.error('Profile update error:', profileError)
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
  }
  console.info('Profile onboarding marked complete', { userId: user.id })

  if (workspace) {
    const uniqueRoles = new Map<string, Record<string, boolean>>()
    for (const role of config.roles) {
      const roleName = role.name.trim()
      if (!roleName) continue
      uniqueRoles.set(
        roleName,
        role.permissions.reduce((acc: Record<string, boolean>, perm: string) => {
          acc[perm] = true
          return acc
        }, {})
      )
    }

    const { error: clearRolesError } = await supabase
      .from('roles')
      .delete()
      .eq('workspace_id', workspace.id)

    if (clearRolesError) {
      console.error('Roles cleanup error:', clearRolesError)
      return NextResponse.json({ error: 'Failed to sync roles' }, { status: 500 })
    }

    const rolesToInsert = Array.from(uniqueRoles.entries()).map(([name, permissions]) => ({
      workspace_id: workspace.id,
      name,
      permissions,
    }))

    if (rolesToInsert.length > 0) {
      const { error: roleInsertError } = await supabase.from('roles').insert(rolesToInsert)
      if (roleInsertError) {
        console.error('Roles insert error:', roleInsertError)
        return NextResponse.json({ error: 'Failed to sync roles' }, { status: 500 })
      }
    }
    console.info('Role sync completed', { userId: user.id, roleCount: rolesToInsert.length })
  }

  return NextResponse.json({ success: true, stage: 'workspace_ready' })
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: workspace, error } = await supabase
    .from('workspaces')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (error) {
    return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('onboarding_completed')
    .eq('id', user.id)
    .maybeSingle()

  if (profile && profile.onboarding_completed === false) {
    await supabase.from('profiles').update({ onboarding_completed: true }).eq('id', user.id)
  }

  return NextResponse.json(workspace)
}
