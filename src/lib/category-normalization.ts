export type NormalizedMetricCategory =
  | 'revenue'
  | 'operations'
  | 'hr'
  | 'inventory'
  | 'customers'
  | 'growth'
  | 'finance'
  | 'supply_chain'

const metricCategoryAliases: Record<string, NormalizedMetricCategory> = {
  revenue: 'revenue',
  sales: 'revenue',
  operation: 'operations',
  operations: 'operations',
  ops: 'operations',
  hr: 'hr',
  'human resource': 'hr',
  'human resources': 'hr',
  people: 'hr',
  inventory: 'inventory',
  stock: 'inventory',
  warehouse: 'inventory',
  customer: 'customers',
  customers: 'customers',
  crm: 'customers',
  'customer management': 'customers',
  growth: 'growth',
  finance: 'finance',
  finances: 'finance',
  financial: 'finance',
  accounting: 'finance',
  supply: 'supply_chain',
  'supply chain': 'supply_chain',
  'supply-chain': 'supply_chain',
  procurement: 'supply_chain',
}

const moduleAliases: Record<string, 'dashboard' | 'hr' | 'inventory' | 'finance' | 'supply_chain' | 'crm'> = {
  dashboard: 'dashboard',
  hr: 'hr',
  'human resource': 'hr',
  'human resources': 'hr',
  people: 'hr',
  inventory: 'inventory',
  stock: 'inventory',
  finance: 'finance',
  financial: 'finance',
  accounting: 'finance',
  supply: 'supply_chain',
  'supply chain': 'supply_chain',
  'supply-chain': 'supply_chain',
  procurement: 'supply_chain',
  crm: 'crm',
  customer: 'crm',
  customers: 'crm',
  'customer management': 'crm',
}

function normalizeToken(value: string): string {
  return value.trim().toLowerCase().replace(/[_-]+/g, ' ').replace(/\s+/g, ' ')
}

export function normalizeMetricCategory(value: unknown): NormalizedMetricCategory {
  const token = normalizeToken(String(value ?? ''))
  return metricCategoryAliases[token] ?? 'operations'
}

export function normalizeModuleName(value: unknown): 'dashboard' | 'hr' | 'inventory' | 'finance' | 'supply_chain' | 'crm' {
  const token = normalizeToken(String(value ?? ''))
  return moduleAliases[token] ?? 'dashboard'
}
