import { createClient } from '@/lib/supabase/server'
import { demoRestaurantWorkspace } from '@/lib/demo-workspace'
import { validateOnboardingConfig } from '@/lib/onboarding-config'
import { normalizeRolePermissions } from '@/lib/rbac/permissions'
import { syncRoleModulePermissions } from '@/lib/rbac/sync-role-permissions'
import { NextResponse } from 'next/server'

export async function POST() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const validation = validateOnboardingConfig(demoRestaurantWorkspace)
  if (!validation.success) {
    return NextResponse.json({ error: validation.error }, { status: 400 })
  }
  const config = validation.data

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
    console.error('Demo workspace upsert error:', workspaceError)
    return NextResponse.json({ error: 'Failed to create demo workspace' }, { status: 500 })
  }

  const { error: profileError } = await supabase
    .from('profiles')
    .update({ onboarding_completed: true })
    .eq('id', user.id)

  if (profileError) {
    console.error('Profile update error:', profileError)
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
  }

  if (workspace) {
    const { error: clearRolesError } = await supabase.from('roles').delete().eq('workspace_id', workspace.id)
    if (clearRolesError) {
      console.error('Roles cleanup error:', clearRolesError)
      return NextResponse.json({ error: 'Failed to sync demo roles' }, { status: 500 })
    }

    const rolesToInsert = config.roles.map((role) => ({
      workspace_id: workspace.id,
      name: role.name,
      description: role.description ?? null,
      is_system: role.is_system ?? false,
      permissions: normalizeRolePermissions(role.permissions),
    }))

    if (rolesToInsert.length > 0) {
      const { data: insertedRoles, error: roleInsertError } = await supabase
        .from('roles')
        .insert(rolesToInsert)
        .select('id, permissions')

      if (roleInsertError) {
        console.error('Roles insert error:', roleInsertError)
        return NextResponse.json({ error: 'Failed to sync demo roles' }, { status: 500 })
      }

      for (const role of insertedRoles ?? []) {
        try {
          await syncRoleModulePermissions(
            supabase,
            role.id,
            normalizeRolePermissions(role.permissions)
          )
        } catch (syncError) {
          console.error('Role permission sync error:', syncError)
        }
      }
    }
  }

  return NextResponse.json({
    success: true,
    message: 'Demo workspace created successfully.',
  })
}
