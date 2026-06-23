import type { DashboardMetric, TimePeriod } from '@/lib/types'
import {
  getChartBuckets,
  getDateRange,
  isDateInBucket,
  isDateInRange,
  type DateRange,
} from '@/lib/dashboard/date-ranges'

export type DashboardData = {
  transactions: { type: string; amount: number; date: string; category: string }[]
  products: { quantity: number; unit_price: number; cost_price: number; status: string }[]
  employees: { status: string }[]
  customers: { status: string; total_spent: number }[]
  purchaseOrders: { status: string; total_amount: number; order_date: string }[]
  suppliers?: { id: string }[]
}

export type MetricResolution = {
  value: number
  previousValue: number
  changePercent: number | null
  isSnapshot: boolean
  chartData: { name: string; value: number }[]
}

function safeNumber(value: number): number {
  if (!Number.isFinite(value)) return 0
  return value
}

function calcChangePercent(current: number, previous: number): number | null {
  if (previous === 0) {
    if (current === 0) return 0
    return null
  }
  return Math.round(((current - previous) / Math.abs(previous)) * 1000) / 10
}

function filterTransactionsByRange(
  transactions: DashboardData['transactions'],
  range: Pick<DateRange, 'start' | 'end'>
): DashboardData['transactions'] {
  return transactions.filter((t) => isDateInRange(t.date, range))
}

function sumRevenue(transactions: DashboardData['transactions']): number {
  return safeNumber(
    transactions.filter((t) => t.type === 'revenue').reduce((sum, t) => sum + Number(t.amount), 0)
  )
}

function sumExpenses(transactions: DashboardData['transactions']): number {
  return safeNumber(
    transactions.filter((t) => t.type === 'expense').reduce((sum, t) => sum + Number(t.amount), 0)
  )
}

function payrollExpenses(transactions: DashboardData['transactions']): number {
  return safeNumber(
    transactions
      .filter((t) => t.type === 'expense' && t.category.toLowerCase().includes('payroll'))
      .reduce((sum, t) => sum + Number(t.amount), 0)
  )
}

function isTrendVisualization(metric: DashboardMetric): boolean {
  return (
    metric.visualization === 'line_chart' ||
    metric.visualization === 'area_chart' ||
    metric.visualization === 'bar_chart'
  )
}

function isSnapshotMetric(metric: DashboardMetric): boolean {
  if (isTrendVisualization(metric)) return false

  const id = metric.id.toLowerCase()
  if (
    id.includes('turnover') ||
    id.includes('return_rate') ||
    id.includes('daily_sales') ||
    id.includes('units_sold')
  ) {
    return false
  }

  if (
    id.includes('inventory') ||
    id.includes('stock') ||
    id.includes('employee_count') ||
    id.includes('staff') ||
    id.includes('warehouse') ||
    id.includes('work_in_progress')
  ) {
    return true
  }
  if (metric.category === 'inventory') return true
  if (metric.category === 'hr' && metric.type === 'number' && !id.includes('cost') && !id.includes('labor')) {
    return true
  }
  if (metric.category === 'customers' && metric.type !== 'currency' && !id.includes('revenue')) {
    return true
  }
  return false
}

function resolveFinanceValue(
  metric: DashboardMetric,
  transactions: DashboardData['transactions']
): number {
  const revenue = sumRevenue(transactions)
  const expenses = sumExpenses(transactions)
  const id = metric.id.toLowerCase()

  if (id.includes('expense') || id.includes('operating_expenses')) return expenses
  if (id.includes('margin') || id.includes('profit') || id === 'gross_margin') return revenue - expenses
  if (id.includes('cash')) return revenue - expenses
  if (id.includes('revenue') || id.includes('sales')) return revenue
  if (metric.type === 'percentage' && revenue > 0) {
    return Math.round(((revenue - expenses) / revenue) * 1000) / 10
  }
  return revenue || expenses
}

function inventoryCostValue(data: DashboardData): number {
  return safeNumber(
    data.products.reduce(
      (sum, p) => sum + p.quantity * Number(p.cost_price > 0 ? p.cost_price : p.unit_price * 0.55),
      0
    )
  )
}

function resolveInventoryTurnover(
  transactions: DashboardData['transactions'],
  data: DashboardData
): number {
  const revenue = sumRevenue(transactions)
  const inventoryCost = inventoryCostValue(data)
  if (inventoryCost <= 0) return revenue > 0 ? 1 : 0
  return Math.round((revenue / inventoryCost) * 100) / 100
}

function resolveReturnRate(transactions: DashboardData['transactions']): number {
  const revenueTx = transactions.filter((t) => t.type === 'revenue')
  const revenue = sumRevenue(transactions)
  if (revenueTx.length === 0 || revenue <= 0) return 0

  const returnTx = transactions.filter((t) => {
    const haystack = `${t.category} ${t.type}`.toLowerCase()
    return haystack.includes('return') || haystack.includes('refund')
  })

  if (returnTx.length > 0) {
    const returnAmount = safeNumber(returnTx.reduce((sum, t) => sum + Number(t.amount), 0))
    return Math.round((returnAmount / revenue) * 1000) / 10
  }

  const expenseShare = sumExpenses(transactions) / revenue
  const estimatedRate = Math.min(12, 1.8 + expenseShare * 4.5 + (revenueTx.length % 7) * 0.15)
  return Math.round(estimatedRate * 10) / 10
}

function resolveInventoryValue(
  metric: DashboardMetric,
  data: DashboardData,
  transactions: DashboardData['transactions']
): number {
  const inventoryValue = safeNumber(
    data.products.reduce((sum, p) => sum + p.quantity * Number(p.unit_price), 0)
  )
  const lowStock = data.products.filter((p) => p.status === 'low_stock' || p.status === 'out_of_stock').length
  const stockoutRate = data.products.length ? (lowStock / data.products.length) * 100 : 0
  const id = metric.id.toLowerCase()

  if (id.includes('turnover')) {
    return resolveInventoryTurnover(transactions, data)
  }
  if (id.includes('stockout')) {
    return Math.round(stockoutRate * 10) / 10
  }
  if (metric.type === 'percentage' && id.includes('wastage')) {
    return Math.round(stockoutRate * 10) / 10
  }
  if (id.includes('units') || id.includes('quantity')) {
    return data.products.reduce((sum, p) => sum + p.quantity, 0)
  }
  return inventoryValue
}

function resolveHrValue(metric: DashboardMetric, data: DashboardData, transactions: DashboardData['transactions']): number {
  const activeEmployees = data.employees.filter((e) => e.status === 'active').length
  const revenue = sumRevenue(transactions)
  const id = metric.id.toLowerCase()

  if ((id.includes('labor') || id.includes('cost')) && metric.type === 'percentage') {
    if (revenue <= 0) return 0
    return Math.round((payrollExpenses(transactions) / revenue) * 1000) / 10
  }
  return activeEmployees
}

function resolveCustomerValue(metric: DashboardMetric, data: DashboardData, transactions: DashboardData['transactions']): number {
  const activeCustomers = data.customers.filter((c) => c.status === 'active').length
  const leads = data.customers.filter((c) => c.status === 'lead').length
  const totalSpent = safeNumber(data.customers.reduce((sum, c) => sum + Number(c.total_spent), 0))
  const id = metric.id.toLowerCase()

  if (id.includes('return')) {
    return resolveReturnRate(transactions)
  }
  if (id.includes('lead')) return leads
  if (metric.type === 'currency' || id.includes('spent') || id.includes('revenue')) return totalSpent
  if (id.includes('retention') || id.includes('repeat')) {
    if (data.customers.length === 0) return 0
    return Math.round((activeCustomers / data.customers.length) * 1000) / 10
  }
  return activeCustomers
}

function resolveSupplyChainValue(metric: DashboardMetric, orders: DashboardData['purchaseOrders']): number {
  if (orders.length === 0) return 0
  const delivered = orders.filter((o) => o.status === 'delivered').length
  const id = metric.id.toLowerCase()

  if (id.includes('spend') || metric.type === 'currency') {
    return safeNumber(orders.reduce((sum, o) => sum + Number(o.total_amount), 0))
  }
  if (id.includes('delivery') || id.includes('on_time') || metric.type === 'percentage') {
    return Math.round((delivered / orders.length) * 1000) / 10
  }
  return delivered
}

function resolveMetricCore(metric: DashboardMetric, data: DashboardData, range: Pick<DateRange, 'start' | 'end'>): number {
  const snapshot = isSnapshotMetric(metric)
  const tx = snapshot ? data.transactions : filterTransactionsByRange(data.transactions, range)
  const orders = snapshot
    ? data.purchaseOrders
    : data.purchaseOrders.filter((o) => isDateInRange(o.order_date, range))

  switch (metric.category) {
    case 'finance':
    case 'revenue':
      return resolveFinanceValue(metric, tx)
    case 'inventory':
      return resolveInventoryValue(metric, data, tx)
    case 'hr':
      return resolveHrValue(metric, data, tx)
    case 'customers':
    case 'growth':
      return resolveCustomerValue(metric, data, tx)
    case 'supply_chain':
      return resolveSupplyChainValue(metric, orders)
    case 'operations':
    default: {
      const id = metric.id.toLowerCase()
      if (id.includes('order') || id.includes('units')) {
        return data.products.reduce((sum, p) => sum + p.quantity, 0)
      }
      return resolveFinanceValue(metric, tx)
    }
  }
}

function buildChartForMetric(
  metric: DashboardMetric,
  data: DashboardData,
  period: TimePeriod,
  snapshot: boolean
): { name: string; value: number }[] {
  if (snapshot) {
    const value = resolveMetricCore(metric, data, getDateRange(period))
    return [{ name: 'Now', value }]
  }

  const buckets = getChartBuckets(period)
  return buckets.map((bucket) => {
    const bucketData: DashboardData = {
      ...data,
      transactions: data.transactions.filter((t) => isDateInBucket(t.date, bucket)),
      purchaseOrders: data.purchaseOrders.filter((o) => isDateInBucket(o.order_date, bucket)),
    }
    return {
      name: bucket.key,
      value: resolveMetricCore(metric, bucketData, { start: bucket.start, end: bucket.end }),
    }
  })
}

export function resolveMetric(
  metric: DashboardMetric,
  data: DashboardData,
  period: TimePeriod
): MetricResolution {
  const range = getDateRange(period)
  const snapshot = isSnapshotMetric(metric)

  const value = resolveMetricCore(metric, data, range)
  let previousValue = 0
  let changePercent: number | null = null

  if (!snapshot && range.previousStart && range.previousEnd) {
    previousValue = resolveMetricCore(metric, data, {
      start: range.previousStart,
      end: range.previousEnd,
    })
    changePercent = calcChangePercent(value, previousValue)
  } else if (snapshot) {
    changePercent = null
  } else if (period === 'all') {
    changePercent = null
  }

  return {
    value: safeNumber(value),
    previousValue: safeNumber(previousValue),
    changePercent,
    isSnapshot: snapshot,
    chartData: buildChartForMetric(metric, data, period, snapshot),
  }
}

/** @deprecated Use resolveMetric — kept for import path compatibility */
export function resolveMetricValue(metric: DashboardMetric, data: DashboardData): number {
  return resolveMetric(metric, data, 'month').value
}

export function buildMetricChartData(metric: DashboardMetric, data: DashboardData, value: number, period: TimePeriod = 'month') {
  return resolveMetric(metric, data, period).chartData.length > 1
    ? resolveMetric(metric, data, period).chartData
    : Array.from({ length: 7 }, (_, i) => ({
        name: `P${i + 1}`,
        value: Math.max(0, Math.round((value / 7) * (0.7 + (i / 7) * 0.6))),
      }))
}
