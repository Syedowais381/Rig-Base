import type { SupabaseClient } from '@supabase/supabase-js'
import {
  hasPermission,
  normalizeRolePermissions,
  ownerPermissions,
} from '@/lib/rbac/permissions'
import type { ModuleKey, ModulePermissionMap, PermissionKey } from '@/lib/rbac/types'
import { resolveWorkspaceForUser, type WorkspaceAccess } from '@/lib/workspace-access'

export type ServerPermissionContext = WorkspaceAccess & {
  permissions: ModulePermissionMap
  roleName: string
}

export async function resolveServerPermissions(
  supabase: SupabaseClient,
  userId: string
): Promise<ServerPermissionContext | null> {
  const access = await resolveWorkspaceForUser(supabase, userId)
  if (!access) return null

  const { data: roles } = await supabase
    .from('roles')
    .select('*')
    .eq('workspace_id', access.workspace.id)

  const normalizedRoles = (roles ?? []).map((role) => ({
    ...role,
    permissions: normalizeRolePermissions(role.permissions),
  }))

  if (access.isOwner) {
    const ownerRole = normalizedRoles.find((r) => r.name === 'Owner')
    return {
      ...access,
      roleName: 'Owner',
      permissions: ownerRole?.permissions ?? ownerPermissions(access.workspace.modules),
    }
  }

  if (!access.employee?.role_id) {
    return { ...access, roleName: 'Guest', permissions: {} }
  }

  const activeRole = normalizedRoles.find((r) => r.id === access.employee?.role_id)
  return {
    ...access,
    roleName: activeRole?.name ?? 'Staff',
    permissions: activeRole?.permissions ?? {},
  }
}

export function userCan(
  ctx: ServerPermissionContext,
  module: ModuleKey,
  permission: PermissionKey
): boolean {
  if (module !== 'settings' && module in ctx.workspace.modules) {
    const key = module as keyof typeof ctx.workspace.modules
    if (!ctx.workspace.modules[key]) return false
  }
  if (ctx.isOwner) return true
  return hasPermission(ctx.permissions, module, permission)
}

export function userCanViewModule(ctx: ServerPermissionContext, module: ModuleKey): boolean {
  return userCan(ctx, module, 'view')
}

export async function requireServerPermission(
  supabase: SupabaseClient,
  userId: string,
  module: ModuleKey,
  permission: PermissionKey
) {
  const ctx = await resolveServerPermissions(supabase, userId)
  if (!ctx) return { error: 'No workspace' as const, status: 404 as const }
  if (!userCan(ctx, module, permission)) {
    return { error: 'Forbidden' as const, status: 403 as const }
  }
  return { ctx, workspaceId: ctx.workspace.id }
}

export const MODULE_API_MAP = {
  products: 'inventory',
  transactions: 'finance',
  customers: 'crm',
  suppliers: 'supply_chain',
  purchase_orders: 'supply_chain',
  employees: 'hr',
  attendance: 'hr',
  leave_requests: 'hr',
} as const satisfies Record<string, ModuleKey>
