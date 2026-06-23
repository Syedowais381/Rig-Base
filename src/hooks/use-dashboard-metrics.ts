'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { resolveMetric, type DashboardData, type MetricResolution } from '@/lib/dashboard/metric-resolver'
import type { DashboardMetric, TimePeriod } from '@/lib/types'

const EMPTY_RESOLUTION: MetricResolution = {
  value: 0,
  previousValue: 0,
  changePercent: null,
  isSnapshot: false,
  chartData: [],
}

export function useDashboardMetrics(workspaceId?: string, timePeriod: TimePeriod = 'month') {
  const supabase = createClient()

  const query = useQuery({
    queryKey: ['dashboard-metrics', workspaceId],
    queryFn: async (): Promise<DashboardData> => {
      const [transactions, products, employees, customers, purchaseOrders, suppliers] = await Promise.all([
        supabase.from('transactions').select('type, amount, date, category').eq('workspace_id', workspaceId!),
        supabase.from('products').select('quantity, unit_price, cost_price, status').eq('workspace_id', workspaceId!),
        supabase.from('employees').select('status').eq('workspace_id', workspaceId!),
        supabase.from('customers').select('status, total_spent').eq('workspace_id', workspaceId!),
        supabase.from('purchase_orders').select('status, total_amount, order_date').eq('workspace_id', workspaceId!),
        supabase.from('suppliers').select('id').eq('workspace_id', workspaceId!),
      ])

      return {
        transactions: transactions.data ?? [],
        products: products.data ?? [],
        employees: employees.data ?? [],
        customers: customers.data ?? [],
        purchaseOrders: purchaseOrders.data ?? [],
        suppliers: suppliers.data ?? [],
      }
    },
    enabled: !!workspaceId,
  })

  function getMetricResolution(metric: DashboardMetric): MetricResolution {
    if (!query.data) return EMPTY_RESOLUTION
    return resolveMetric(metric, query.data, timePeriod)
  }

  return { ...query, getMetricResolution, data: query.data, timePeriod }
}
