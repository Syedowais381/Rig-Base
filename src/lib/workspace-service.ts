import type { SupabaseClient } from '@supabase/supabase-js'
import type { OnboardingConfig } from '@/lib/onboarding-config'

export async function persistWorkspace(
  supabase: SupabaseClient,
  userId: string,
  config: OnboardingConfig
): Promise<{ success: true; workspaceId: string } | { success: false; error: string; status: number }> {
  console.info('Workspace save started', { userId, businessType: config.business_type })

  const { data: workspace, error: workspaceError } = await supabase
    .from('workspaces')
    .upsert({
      user_id: userId,
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

  if (workspaceError || !workspace) {
    console.error('Workspace insert error:', workspaceError)
    return { success: false, error: 'Failed to save workspace', status: 500 }
  }

  console.info('Workspace save completed', { userId, workspaceId: workspace.id })

  const { error: profileError } = await supabase
    .from('profiles')
    .update({ onboarding_completed: true })
    .eq('id', userId)

  if (profileError) {
    console.error('Profile update error:', profileError)
    return { success: false, error: 'Failed to update profile', status: 500 }
  }

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

  const { error: clearRolesError } = await supabase.from('roles').delete().eq('workspace_id', workspace.id)
  if (clearRolesError) {
    console.error('Roles cleanup error:', clearRolesError)
    return { success: false, error: 'Failed to sync roles', status: 500 }
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
      return { success: false, error: 'Failed to sync roles', status: 500 }
    }
  }

  console.info('Role sync completed', { userId, roleCount: rolesToInsert.length })
  return { success: true, workspaceId: workspace.id }
}
