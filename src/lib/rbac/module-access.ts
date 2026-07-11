import { MODULE_DEFINITIONS } from '@/lib/rbac/constants'
import {
  bypassesDepartmentFilter,
  departmentAllowsModule,
  getDepartmentModules,
} from '@/lib/rbac/department-modules'
import { hasPermission } from '@/lib/rbac/permissions'
import type { ModuleKey, ModulePermissionMap, PermissionKey, WorkspaceModules } from '@/lib/rbac/types'

export type ModuleAccessContext = {
  workspaceModules: WorkspaceModules
  permissions: ModulePermissionMap
  department: string | null
  isOwner: boolean
  roleName: string
}

export function isWorkspaceModuleEnabled(
  workspaceModules: WorkspaceModules,
  module: ModuleKey
): boolean {
  if (module === 'settings') return true
  if (module in workspaceModules) {
    return workspaceModules[module as keyof WorkspaceModules]
  }
  return false
}

export function canAccessModule(
  ctx: ModuleAccessContext,
  module: ModuleKey,
  permission: PermissionKey = 'view'
): boolean {
  if (!isWorkspaceModuleEnabled(ctx.workspaceModules, module)) return false
  if (!hasPermission(ctx.permissions, module, permission)) return false

  if (bypassesDepartmentFilter(ctx.isOwner, ctx.roleName)) return true

  return departmentAllowsModule(ctx.department, module, ctx.workspaceModules)
}

export function canViewModuleWithContext(ctx: ModuleAccessContext, module: ModuleKey): boolean {
  return canAccessModule(ctx, module, 'view')
}

export function getVisibleModules(ctx: ModuleAccessContext): ModuleKey[] {
  const modules = new Set<ModuleKey>()

  for (const definition of MODULE_DEFINITIONS) {
    if (canViewModuleWithContext(ctx, definition.key)) {
      modules.add(definition.key)
    }
  }

  return Array.from(modules)
}

export function getDefaultLandingRoute(ctx: ModuleAccessContext): string {
  const preferredOrder: ModuleKey[] = [
    'dashboard',
    'hr',
    'inventory',
    'finance',
    'supply_chain',
    'crm',
    'settings',
  ]

  for (const moduleKey of preferredOrder) {
    if (!canViewModuleWithContext(ctx, moduleKey)) continue
    const definition = MODULE_DEFINITIONS.find((item) => item.key === moduleKey)
    if (definition?.route) return definition.route
  }

  return '/dashboard/profile'
}

export function getModuleFromPathname(pathname: string): ModuleKey | null {
  if (pathname === '/dashboard/profile') return null

  const sorted = [...MODULE_DEFINITIONS]
    .filter((item) => item.route && item.route !== '/dashboard')
    .sort((a, b) => (b.route?.length ?? 0) - (a.route?.length ?? 0))

  for (const definition of sorted) {
    if (definition.route && pathname.startsWith(definition.route)) {
      return definition.key
    }
  }

  if (pathname === '/dashboard' || pathname.startsWith('/dashboard/')) {
    return 'dashboard'
  }

  return null
}

export { getDepartmentModules }
