import type { ModulePermissionMap } from '@/lib/rbac/types'
import { flattenPermissions, normalizeRolePermissions } from '@/lib/rbac/permissions'
import type { SupabaseClient } from '@supabase/supabase-js'

export async function syncRoleModulePermissions(
  supabase: SupabaseClient,
  roleId: string,
  permissions: ModulePermissionMap
) {
  const normalized = normalizeRolePermissions(permissions)
  const rows = flattenPermissions(normalized)

  const { error: deleteError } = await supabase
    .from('role_module_permissions')
    .delete()
    .eq('role_id', roleId)

  if (deleteError) throw deleteError

  if (rows.length === 0) return

  const { error: insertError } = await supabase.from('role_module_permissions').insert(
    rows.map((row) => ({
      role_id: roleId,
      module_key: row.module_key,
      permission_key: row.permission_key,
    }))
  )

  if (insertError) throw insertError
}
