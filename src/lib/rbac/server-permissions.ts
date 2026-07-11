import type { SupabaseClient } from '@supabase/supabase-js'
import {
  canAccessModule,
  canViewModuleWithContext,
  getDefaultLandingRoute,
  type ModuleAccessContext,
} from '@/lib/rbac/module-access'
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
  accessContext: ModuleAccessContext
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
    const permissions = ownerRole?.permissions ?? ownerPermissions(access.workspace.modules)
    const accessContext: ModuleAccessContext = {
      workspaceModules: access.workspace.modules,
      permissions,
      department: null,
      isOwner: true,
      roleName: 'Owner',
    }

    return {
      ...access,
      roleName: 'Owner',
      permissions,
      accessContext,
    }
  }

  if (!access.employee?.role_id) {
    const accessContext: ModuleAccessContext = {
      workspaceModules: access.workspace.modules,
      permissions: {},
      department: access.employee?.department ?? null,
      isOwner: false,
      roleName: 'Guest',
    }

    return { ...access, roleName: 'Guest', permissions: {}, accessContext }
  }

  const activeRole = normalizedRoles.find((r) => r.id === access.employee?.role_id)
  const roleName = activeRole?.name ?? 'Staff'
  const permissions = activeRole?.permissions ?? {}
  const accessContext: ModuleAccessContext = {
    workspaceModules: access.workspace.modules,
    permissions,
    department: access.employee?.department ?? null,
    isOwner: false,
    roleName,
  }

  return {
    ...access,
    roleName,
    permissions,
    accessContext,
  }
}

export function userCan(
  ctx: ServerPermissionContext,
  module: ModuleKey,
  permission: PermissionKey
): boolean {
  if (ctx.isOwner) return true
  return canAccessModule(ctx.accessContext, module, permission)
}

export function userCanViewModule(ctx: ServerPermissionContext, module: ModuleKey): boolean {
  return userCan(ctx, module, 'view')
}

export function resolveDefaultLandingRoute(ctx: ServerPermissionContext): string {
  return getDefaultLandingRoute(ctx.accessContext)
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

// Keep hasPermission available for legacy imports within this module.
export { hasPermission }
