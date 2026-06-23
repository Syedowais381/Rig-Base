export type ImportModule =
  | 'hr'
  | 'inventory'
  | 'finance'
  | 'supply_chain'
  | 'crm'

export type ImportEntity =
  | 'employees'
  | 'products'
  | 'transactions'
  | 'suppliers'
  | 'purchase_orders'
  | 'customers'

export type ImportFieldType = 'string' | 'number' | 'email' | 'date' | 'enum' | 'boolean'

export type ImportFieldDef = {
  key: string
  label: string
  type: ImportFieldType
  required: boolean
  description: string
  allowedValues?: string[]
  example?: string
  constraints?: string[]
}

export type ImportSchema = {
  module: ImportModule
  entity: ImportEntity
  title: string
  description: string
  formats: ('csv' | 'json')[]
  fields: ImportFieldDef[]
  rules: string[]
  workspaceContext: Record<string, string[] | string | boolean | null>
  sampleCsv: string
  sampleJson: Record<string, unknown>
}

export type ImportRowError = {
  row: number
  field?: string
  message: string
}

export type ImportResult = {
  success: boolean
  imported: number
  failed: number
  errors: ImportRowError[]
}

export type WorkspaceImportContext = {
  workspaceId: string
  departments: string[]
  productCategories: string[]
  serviceTypes: string[]
  shifts: { name: string; start: string; end: string }[] | null
  roleNames: string[]
  roleNameToId: Record<string, string>
  supplierNames: string[]
  supplierNameToId: Record<string, string>
  financeCategories: string[]
  businessType: string
}

export function isImportModule(value: string): value is ImportModule {
  return ['hr', 'inventory', 'finance', 'supply_chain', 'crm'].includes(value)
}

export function isImportEntity(value: string): value is ImportEntity {
  return ['employees', 'products', 'transactions', 'suppliers', 'purchase_orders', 'customers'].includes(value)
}

export const MODULE_ENTITY_MAP: Record<ImportModule, ImportEntity[]> = {
  hr: ['employees'],
  inventory: ['products'],
  finance: ['transactions'],
  supply_chain: ['suppliers', 'purchase_orders'],
  crm: ['customers'],
}

export function isValidImportTarget(module: ImportModule, entity: ImportEntity): boolean {
  return MODULE_ENTITY_MAP[module].includes(entity)
}
