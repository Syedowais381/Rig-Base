export type PermissionKey =
  | 'view'
  | 'create'
  | 'edit'
  | 'delete'
  | 'approve'
  | 'import'
  | 'export'
  | 'print'
  | 'manage'
  | 'view_reports'

export type ModuleKey =
  | 'dashboard'
  | 'hr'
  | 'inventory'
  | 'finance'
  | 'supply_chain'
  | 'crm'
  | 'settings'

export type ModulePermissionMap = Partial<Record<ModuleKey, Partial<Record<PermissionKey, boolean>>>>

export type WorkspaceModules = {
  dashboard: boolean
  hr: boolean
  inventory: boolean
  finance: boolean
  supply_chain: boolean
  crm: boolean
}

export type UniversalRoleKey =
  | 'owner'
  | 'administrator'
  | 'manager'
  | 'staff'
  | 'data_entry'
  | 'viewer'

export interface UniversalRoleTemplate {
  key: UniversalRoleKey
  name: string
  description: string
  isSystem: boolean
  buildPermissions: (modules: WorkspaceModules) => ModulePermissionMap
}
