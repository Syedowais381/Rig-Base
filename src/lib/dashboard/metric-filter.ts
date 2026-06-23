import type { DashboardMetric, TimePeriod, WorkspaceConfig } from '@/lib/types'
import { getComparisonLabel } from '@/lib/dashboard/date-ranges'

const MAX_VISIBLE_METRICS = 8

type ModuleKey = keyof WorkspaceConfig['modules']

const CATEGORY_MODULE: Record<DashboardMetric['category'], ModuleKey | 'shared' | 'ops'> = {
  finance: 'finance',
  revenue: 'finance',
  hr: 'hr',
  inventory: 'inventory',
  customers: 'crm',
  supply_chain: 'supply_chain',
  operations: 'ops',
  growth: 'crm',
}

function isModuleEnabled(modules: WorkspaceConfig['modules'], key: ModuleKey | 'shared' | 'ops'): boolean {
  if (key === 'shared') return true
  if (key === 'ops') {
    return modules.hr || modules.inventory || modules.crm || modules.supply_chain
  }
  if (key === 'finance' || key === 'dashboard') return modules.finance !== false
  return modules[key] === true
}

function periodAlignmentScore(metric: DashboardMetric, period: TimePeriod): number {
  const cp = metric.comparison_period
  switch (period) {
    case 'today':
      return cp === 'day' ? 4 : cp === 'week' ? 2 : 0
    case 'week':
      return cp === 'day' || cp === 'week' ? 4 : cp === 'month' ? 1 : 0
    case 'month':
      return cp === 'week' || cp === 'month' ? 4 : cp === 'day' ? 2 : cp === 'year' ? 1 : 0
    case 'year':
      return cp === 'month' || cp === 'year' ? 4 : 1
    case 'all':
      return cp === 'year' ? 3 : cp === 'month' ? 2 : 1
    default:
      return 0
  }
}

/** Keep metrics tied to enabled modules; cap count for a crisp dashboard. */
export function filterDashboardMetrics(
  metrics: DashboardMetric[] | undefined,
  modules: WorkspaceConfig['modules'] | undefined,
  period: TimePeriod
): DashboardMetric[] {
  if (!metrics || metrics.length === 0 || !modules) return []

  const moduleFiltered = metrics.filter((metric) => {
    const moduleKey = CATEGORY_MODULE[metric.category] ?? 'shared'
    return isModuleEnabled(modules, moduleKey)
  })

  const deduped = dedupeMetrics(moduleFiltered)

  return deduped
    .map((metric) => ({ metric, score: periodAlignmentScore(metric, period) }))
    .sort((a, b) => b.score - a.score || a.metric.name.localeCompare(b.metric.name))
    .slice(0, MAX_VISIBLE_METRICS)
    .map(({ metric }) => metric)
}

function dedupeMetrics(metrics: DashboardMetric[]): DashboardMetric[] {
  const seen = new Set<string>()
  const result: DashboardMetric[] = []

  for (const metric of metrics) {
    const key = `${metric.category}:${metric.type}:${metric.name.toLowerCase()}`
    if (seen.has(key)) continue
    seen.add(key)
    result.push(metric)
  }

  return result
}

export function getMetricPeriodHint(_metric: DashboardMetric, period: TimePeriod, isSnapshot: boolean): string {
  if (isSnapshot) return 'Current snapshot'
  if (period === 'all') return 'All time · lifetime total'

  const labels: Record<TimePeriod, string> = {
    today: 'Today',
    week: 'This week',
    month: 'This month',
    year: 'This year',
    all: 'All time',
  }

  return `${labels[period]} · ${getComparisonLabel(period)}`
}
