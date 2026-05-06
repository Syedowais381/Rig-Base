import { normalizeMetricCategory, normalizeModuleName } from '@/lib/category-normalization'

export type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; error: string }

type MetricType = 'number' | 'currency' | 'percentage' | 'ratio'
type MetricVisualization = 'line_chart' | 'bar_chart' | 'area_chart' | 'stat_card' | 'pie_chart' | 'gauge'
type MetricComparisonPeriod = 'day' | 'week' | 'month' | 'year'
type MetricCategory = 'revenue' | 'operations' | 'hr' | 'inventory' | 'customers' | 'growth' | 'finance' | 'supply_chain'

const METRIC_TYPES = new Set<MetricType>(['number', 'currency', 'percentage', 'ratio'])
const VISUALIZATIONS = new Set<MetricVisualization>(['line_chart', 'bar_chart', 'area_chart', 'stat_card', 'pie_chart', 'gauge'])
const COMPARISON_PERIODS = new Set<MetricComparisonPeriod>(['day', 'week', 'month', 'year'])
type OnboardingModuleConfig = {
  dashboard: boolean
  hr: boolean
  inventory: boolean
  finance: boolean
  supply_chain: boolean
  crm: boolean
}

type OnboardingDashboardMetric = {
  id: string
  name: string
  description: string
  type: MetricType
  visualization: MetricVisualization
  comparison_period: MetricComparisonPeriod
  category: MetricCategory
}

type OnboardingRole = {
  name: string
  permissions: string[]
}

type OnboardingChecklistItem = {
  id: string
  title: string
  description: string
  module: string
  priority: number
}

export type OnboardingConfig = {
  business_type: string
  modules: OnboardingModuleConfig
  dashboard_metrics: OnboardingDashboardMetric[]
  departments: string[]
  shifts: { name: string; start: string; end: string }[] | null
  product_categories: string[] | null
  service_types: string[] | null
  roles: OnboardingRole[]
  setup_checklist: OnboardingChecklistItem[]
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string' && item.trim().length > 0)
}

function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean'
}

export function extractOnboardingConfigText(response: string): ValidationResult<string> {
  const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/i)
  if (!jsonMatch || !jsonMatch[1]) {
    return { success: false, error: 'AI response did not include a JSON block.' }
  }

  return { success: true, data: jsonMatch[1] }
}

export function validateOnboardingConfig(value: unknown): ValidationResult<OnboardingConfig> {
  if (!isObject(value)) {
    return { success: false, error: 'Workspace config must be a JSON object.' }
  }

  if (typeof value.business_type !== 'string' || value.business_type.trim().length < 2) {
    return { success: false, error: 'business_type is required.' }
  }

  if (!isObject(value.modules)) {
    return { success: false, error: 'modules must be an object.' }
  }

  const normalizedModules: OnboardingModuleConfig = {
    dashboard: false,
    hr: false,
    inventory: false,
    finance: false,
    supply_chain: false,
    crm: false,
  }
  for (const [key, rawValue] of Object.entries(value.modules)) {
    const normalizedKey = normalizeModuleName(key)
    if (!isBoolean(rawValue)) continue
    normalizedModules[normalizedKey] = rawValue
  }
  normalizedModules.dashboard = true
  normalizedModules.finance = true
  value.modules = normalizedModules

  if (!Array.isArray(value.dashboard_metrics) || value.dashboard_metrics.length < 1) {
    return { success: false, error: 'dashboard_metrics must contain at least one metric.' }
  }

  for (const metric of value.dashboard_metrics) {
    if (!isObject(metric)) {
      return { success: false, error: 'Each dashboard metric must be an object.' }
    }

    if (typeof metric.id !== 'string' || typeof metric.name !== 'string' || typeof metric.description !== 'string') {
      return { success: false, error: 'Each metric must include id, name, and description.' }
    }

    if (!METRIC_TYPES.has(metric.type as MetricType)) {
      return { success: false, error: `Invalid metric type: ${String(metric.type)}` }
    }

    if (!VISUALIZATIONS.has(metric.visualization as MetricVisualization)) {
      return { success: false, error: `Invalid metric visualization: ${String(metric.visualization)}` }
    }

    if (!COMPARISON_PERIODS.has(metric.comparison_period as MetricComparisonPeriod)) {
      return { success: false, error: `Invalid metric comparison period: ${String(metric.comparison_period)}` }
    }

    metric.category = normalizeMetricCategory(metric.category) as MetricCategory
  }

  if (!isStringArray(value.departments)) {
    return { success: false, error: 'departments must be a non-empty array of strings.' }
  }

  if (value.product_categories !== null && !isStringArray(value.product_categories)) {
    return { success: false, error: 'product_categories must be null or a string array.' }
  }

  if (value.service_types !== null && !isStringArray(value.service_types)) {
    return { success: false, error: 'service_types must be null or a string array.' }
  }

  if (value.shifts !== null) {
    if (!Array.isArray(value.shifts)) {
      return { success: false, error: 'shifts must be null or an array.' }
    }

    for (const shift of value.shifts) {
      if (!isObject(shift) || typeof shift.name !== 'string' || typeof shift.start !== 'string' || typeof shift.end !== 'string') {
        return { success: false, error: 'Each shift must include name, start, and end.' }
      }
    }
  }

  if (!Array.isArray(value.roles) || value.roles.length < 1) {
    return { success: false, error: 'roles must contain at least one role.' }
  }

  for (const role of value.roles) {
    if (!isObject(role) || typeof role.name !== 'string' || !isStringArray(role.permissions)) {
      return { success: false, error: 'Each role must include name and permissions array.' }
    }
  }

  if (!Array.isArray(value.setup_checklist) || value.setup_checklist.length < 1) {
    return { success: false, error: 'setup_checklist must contain at least one item.' }
  }

  for (const task of value.setup_checklist) {
    if (
      !isObject(task) ||
      typeof task.id !== 'string' ||
      typeof task.title !== 'string' ||
      typeof task.description !== 'string' ||
      typeof task.module !== 'string' ||
      typeof task.priority !== 'number'
    ) {
      return { success: false, error: 'Each checklist item must include id, title, description, module, and numeric priority.' }
    }
    task.module = normalizeModuleName(task.module)
  }

  return { success: true, data: value as OnboardingConfig }
}
