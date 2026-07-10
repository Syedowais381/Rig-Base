import { createClient } from '@/lib/supabase/server'
import { requirePermission } from '@/lib/api/workspace-context'
import {
  buildAiInsightContext,
  generateAiInsights,
  getInsightDateKey,
  getNextInsightAvailableAt,
  type AiInsightsResponse,
} from '@/lib/dashboard/ai-insights'
import type { TimePeriod, WorkspaceConfig } from '@/lib/types'
import { NextResponse } from 'next/server'

const VALID_PERIODS: TimePeriod[] = ['today', 'week', 'month', 'year', 'all']

async function loadDashboardData(supabase: Awaited<ReturnType<typeof createClient>>, workspaceId: string) {
  const [transactions, products, employees, customers, purchaseOrders, suppliers] = await Promise.all([
    supabase.from('transactions').select('type, amount, date, category').eq('workspace_id', workspaceId),
    supabase.from('products').select('quantity, unit_price, cost_price, status').eq('workspace_id', workspaceId),
    supabase.from('employees').select('status').eq('workspace_id', workspaceId),
    supabase.from('customers').select('status, total_spent').eq('workspace_id', workspaceId),
    supabase.from('purchase_orders').select('status, total_amount, order_date').eq('workspace_id', workspaceId),
    supabase.from('suppliers').select('id').eq('workspace_id', workspaceId),
  ])

  return {
    transactions: transactions.data ?? [],
    products: products.data ?? [],
    employees: employees.data ?? [],
    customers: customers.data ?? [],
    purchaseOrders: purchaseOrders.data ?? [],
    suppliers: suppliers.data ?? [],
  }
}

function toAiResponse(
  row: {
    summary: string
    suggestions: unknown
    created_at: string
    insight_date: string
  },
  cached: boolean
): AiInsightsResponse {
  return {
    summary: row.summary,
    suggestions: Array.isArray(row.suggestions) ? row.suggestions : [],
    generated_at: row.created_at,
    insight_date: row.insight_date,
    cached,
    next_available_at: getNextInsightAvailableAt(new Date(`${row.insight_date}T00:00:00.000Z`)),
  }
}

export async function GET(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const periodParam = searchParams.get('period') ?? 'month'
  const timePeriod = VALID_PERIODS.includes(periodParam as TimePeriod) ? (periodParam as TimePeriod) : 'month'
  const insightDate = getInsightDateKey()

  const access = await requirePermission(supabase, user.id, 'dashboard', 'view')
  if ('error' in access) {
    return NextResponse.json({ error: 'Workspace not found' }, { status: access.status })
  }

  const { data: workspace, error: workspaceError } = await supabase
    .from('workspaces')
    .select('*')
    .eq('id', access.workspaceId)
    .single()

  if (workspaceError || !workspace) {
    return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })
  }

  const { data: existing } = await supabase
    .from('dashboard_ai_insights')
    .select('summary, suggestions, created_at, insight_date')
    .eq('workspace_id', workspace.id)
    .eq('insight_date', insightDate)
    .maybeSingle()

  if (existing) {
    return NextResponse.json(toAiResponse(existing, true))
  }

  return NextResponse.json({
    summary: null,
    suggestions: [],
    insight_date: insightDate,
    cached: false,
    can_generate: true,
    next_available_at: getNextInsightAvailableAt(),
  })
}

export async function POST(request: Request) {
  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json({ error: 'AI insights are not configured.' }, { status: 503 })
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json().catch(() => ({}))
  const periodParam = typeof body.period === 'string' ? body.period : 'month'
  const timePeriod = VALID_PERIODS.includes(periodParam as TimePeriod) ? (periodParam as TimePeriod) : 'month'
  const insightDate = getInsightDateKey()

  const access = await requirePermission(supabase, user.id, 'dashboard', 'view_reports')
  if ('error' in access) {
    return NextResponse.json({ error: 'Workspace not found' }, { status: access.status })
  }

  const { data: workspace, error: workspaceError } = await supabase
    .from('workspaces')
    .select('*')
    .eq('id', access.workspaceId)
    .single()

  if (workspaceError || !workspace) {
    return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })
  }

  const { data: existing } = await supabase
    .from('dashboard_ai_insights')
    .select('summary, suggestions, created_at, insight_date')
    .eq('workspace_id', workspace.id)
    .eq('insight_date', insightDate)
    .maybeSingle()

  if (existing) {
    return NextResponse.json(toAiResponse(existing, true))
  }

  const dashboardData = await loadDashboardData(supabase, workspace.id)
  const counts = {
    employees: dashboardData.employees.length,
    products: dashboardData.products.length,
    transactions: dashboardData.transactions.length,
    suppliers: dashboardData.suppliers.length,
    customers: dashboardData.customers.length,
    purchaseOrders: dashboardData.purchaseOrders.length,
  }

  const context = buildAiInsightContext(workspace as WorkspaceConfig, dashboardData, counts, timePeriod)

  try {
    const insight = await generateAiInsights(context)

    const { data: inserted, error: insertError } = await supabase
      .from('dashboard_ai_insights')
      .insert({
        workspace_id: workspace.id,
        insight_date: insightDate,
        time_period: timePeriod,
        metrics_snapshot: context.metrics,
        summary: insight.summary,
        suggestions: insight.suggestions,
      })
      .select('summary, suggestions, created_at, insight_date')
      .single()

    if (insertError) {
      if (insertError.code === '23505') {
        const { data: raced } = await supabase
          .from('dashboard_ai_insights')
          .select('summary, suggestions, created_at, insight_date')
          .eq('workspace_id', workspace.id)
          .eq('insight_date', insightDate)
          .single()

        if (raced) {
          return NextResponse.json(toAiResponse(raced, true))
        }
      }

      console.error('Failed to store AI insight', insertError)
      return NextResponse.json({ error: 'Failed to save AI insights.' }, { status: 500 })
    }

    return NextResponse.json(toAiResponse(inserted, false))
  } catch (error) {
    console.error('AI insight generation failed', error)
    const message = error instanceof Error ? error.message : 'Failed to generate AI insights.'
    const isQuota = message.includes('429') || message.toLowerCase().includes('quota')
    return NextResponse.json(
      {
        error: isQuota
          ? 'Gemini API quota exceeded. Try again later or check your Google AI Studio plan.'
          : 'Failed to generate AI insights. Please try again in a few minutes.',
        detail: message.slice(0, 200),
      },
      { status: isQuota ? 429 : 502 }
    )
  }
}
