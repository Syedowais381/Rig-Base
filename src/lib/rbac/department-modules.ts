import { ERP_MODULE_KEYS } from '@/lib/rbac/constants'
import type { ModuleKey, WorkspaceModules } from '@/lib/rbac/types'

/** Leadership departments see every workspace-enabled module. */
export const BROAD_ACCESS_DEPARTMENTS = new Set([
  'management',
  'operations',
  'executive',
  'general',
  'administration',
])

/**
 * Maps normalized department names to ERP modules.
 * Department controls visibility; role controls actions within those modules.
 */
export const DEPARTMENT_MODULE_MAP: Record<string, ModuleKey[]> = {
  finance: ['finance'],
  billing: ['finance'],
  accounting: ['finance'],
  estimating: ['finance'],

  hr: ['hr'],
  'human resources': ['hr'],
  clinical: ['hr'],
  safety: ['hr'],

  kitchen: ['inventory'],
  warehouse: ['inventory'],
  production: ['inventory'],
  quality: ['inventory'],
  pharmacy: ['inventory'],
  inventory: ['inventory'],

  procurement: ['supply_chain'],
  'supply chain': ['supply_chain'],
  fleet: ['supply_chain'],
  dispatch: ['supply_chain'],
  logistics: ['supply_chain'],

  sales: ['crm'],
  service: ['crm'],
  marketing: ['crm'],
  delivery: ['crm'],
  'customer support': ['crm'],
  'customer service': ['crm'],
  crm: ['crm'],
  'front desk': ['crm'],

  admin: ['hr', 'finance'],
}

function normalizeDepartment(department: string): string {
  return department.trim().toLowerCase()
}

function enabledErpModules(modules: WorkspaceModules): ModuleKey[] {
  return ERP_MODULE_KEYS.filter((key) => modules[key as keyof WorkspaceModules])
}

function filterEnabledModules(moduleKeys: ModuleKey[], modules: WorkspaceModules): ModuleKey[] {
  return moduleKeys.filter((key) => key === 'settings' || modules[key as keyof WorkspaceModules])
}

export function bypassesDepartmentFilter(isOwner: boolean, roleName: string | null | undefined): boolean {
  return isOwner || roleName === 'Administrator'
}

export function getDepartmentModules(
  department: string | null | undefined,
  workspaceModules: WorkspaceModules
): ModuleKey[] {
  if (!department?.trim()) return []

  const normalized = normalizeDepartment(department)

  if (BROAD_ACCESS_DEPARTMENTS.has(normalized)) {
    return enabledErpModules(workspaceModules)
  }

  const directModule = ERP_MODULE_KEYS.find(
    (key) => key === normalized || key.replace(/_/g, ' ') === normalized
  )
  if (directModule) {
    return filterEnabledModules([directModule], workspaceModules)
  }

  const mapped = DEPARTMENT_MODULE_MAP[normalized]
  if (mapped) {
    return filterEnabledModules(mapped, workspaceModules)
  }

  for (const [deptKey, moduleKeys] of Object.entries(DEPARTMENT_MODULE_MAP)) {
    if (normalized.includes(deptKey)) {
      return filterEnabledModules(moduleKeys, workspaceModules)
    }
  }

  return []
}

export function departmentAllowsModule(
  department: string | null | undefined,
  module: ModuleKey,
  workspaceModules: WorkspaceModules
): boolean {
  if (module === 'settings') return true
  return getDepartmentModules(department, workspaceModules).includes(module)
}
