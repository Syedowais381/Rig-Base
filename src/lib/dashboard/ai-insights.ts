import { generateGeminiText } from '@/lib/gemini'
import { filterDashboardMetrics } from '@/lib/dashboard/metric-filter'
import { getComparisonLabel } from '@/lib/dashboard/date-ranges'
import { resolveMetric, type DashboardData } from '@/lib/dashboard/metric-resolver'
import { getSetupProgress, resolveSetupChecklist, type SetupDataCounts } from '@/lib/setup-checklist'
import type { DashboardMetric, TimePeriod, WorkspaceConfig } from '@/lib/types'

export type AiInsightSuggestion = {
  priority: 'high' | 'medium' | 'low'
  title: string
  detail: string
  metric_ref?: string
}

export type AiInsightPayload = {
  summary: string
  suggestions: AiInsightSuggestion[]
}

export type AiInsightsResponse = {
  summary: string
  suggestions: AiInsightSuggestion[]
  generated_at: string
  insight_date: string
  cached: boolean
  next_available_at: string
}

function formatMetricValue(metric: DashboardMetric, value: number): string {
  if (metric.type === 'currency') {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value)
  }
  if (metric.type === 'percentage' || metric.type === 'ratio') {
    return `${value.toFixed(1)}%`
  }
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(value)
}

export function buildMetricsSnapshot(
  workspace: WorkspaceConfig,
  dashboardData: DashboardData,
  timePeriod: TimePeriod
) {
  const visibleMetrics = filterDashboardMetrics(workspace.dashboard_metrics, workspace.modules, timePeriod)

  return visibleMetrics.map((metric) => {
    const resolution = resolveMetric(metric, dashboardData, timePeriod)
    return {
      id: metric.id,
      name: metric.name,
      description: metric.description,
      category: metric.category,
      type: metric.type,
      value: resolution.value,
      formatted_value: formatMetricValue(metric, resolution.value),
      change_percent: resolution.changePercent,
      is_snapshot: resolution.isSnapshot,
      period: timePeriod,
      comparison_label: getComparisonLabel(timePeriod),
    }
  })
}

export function buildAiInsightContext(
  workspace: WorkspaceConfig,
  dashboardData: DashboardData,
  counts: SetupDataCounts,
  timePeriod: TimePeriod
) {
  const checklist = resolveSetupChecklist(workspace.setup_checklist, counts, workspace)
  const setupProgress = getSetupProgress(checklist)

  return {
    business_type: workspace.business_type,
    enabled_modules: workspace.modules,
    time_period: timePeriod,
    comparison_label: getComparisonLabel(timePeriod),
    metrics: buildMetricsSnapshot(workspace, dashboardData, timePeriod),
    setup_progress: {
      completed: setupProgress.completed,
      total: setupProgress.total,
      incomplete_tasks: checklist.filter((item) => !item.completed).map((item) => item.title),
    },
    operational_counts: counts,
  }
}

function extractJson(text: string): AiInsightPayload {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i)
  const raw = fenced?.[1]?.trim() ?? text.trim()

  try {
    const parsed = JSON.parse(raw) as AiInsightPayload
    if (!parsed.summary || !Array.isArray(parsed.suggestions)) {
      throw new Error('Invalid insight shape')
    }
    return parsed
  } catch {
    return {
      summary: text.trim().slice(0, 280) || 'Review your dashboard metrics and address the highest-impact gaps first.',
      suggestions: [
        {
          priority: 'medium',
          title: 'Review dashboard trends',
          detail: text.trim().slice(0, 500) || 'Use your metric changes to prioritize operational improvements this week.',
        },
      ],
    }
  }
}

export function getInsightDateKey(date = new Date()): string {
  return date.toISOString().slice(0, 10)
}

export function getNextInsightAvailableAt(date = new Date()): string {
  const next = new Date(date)
  next.setUTCDate(next.getUTCDate() + 1)
  next.setUTCHours(0, 0, 0, 0)
  return next.toISOString()
}

export async function generateAiInsights(context: ReturnType<typeof buildAiInsightContext>): Promise<AiInsightPayload> {
  const prompt = `You are a business operations advisor for Rig Base ERP. Analyze the workspace metrics and recommend practical improvements.

Rules:
- Use only the data provided. Do not invent numbers.
- Compare metrics with their change_percent when available.
- Tie each suggestion to a metric, setup gap, or operational count when possible.
- Return 3-5 concise, actionable suggestions prioritized by business impact.
- Focus on revenue, cost control, inventory risk, staffing, customer growth, and supply chain reliability as relevant.
- Respond with valid JSON only (no markdown outside JSON).

Context:
${JSON.stringify(context, null, 2)}

Return JSON in this exact shape:
{
  "summary": "One paragraph executive summary",
  "suggestions": [
    {
      "priority": "high|medium|low",
      "title": "Short action title",
      "detail": "Specific recommendation with reasoning from the metrics",
      "metric_ref": "Optional metric name referenced"
    }
  ]
}`

  const text = await generateGeminiText(prompt, { json: true, maxModels: 3 })
  return extractJson(text)
}
