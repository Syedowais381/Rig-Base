'use client'

import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, Minus, Loader2 } from 'lucide-react'
import { AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'
import type { DashboardMetric } from '@/lib/types'

interface MetricCardProps {
  metric: DashboardMetric
  index: number
  value?: number
  chartData?: { name: string; value: number }[]
  changePercent?: number | null
  periodHint?: string
  loading?: boolean
}

export function MetricCard({
  metric,
  index,
  value = 0,
  chartData,
  changePercent = null,
  periodHint = 'This period',
  loading = false,
}: MetricCardProps) {
  const chartPoints =
    chartData && chartData.length > 0
      ? chartData
      : Array.from({ length: 7 }, (_, i) => ({ value: 0, name: `P${i + 1}` }))

  const trend: 'up' | 'down' | 'neutral' =
    changePercent === null ? (value > 0 ? 'up' : 'neutral') : changePercent > 0 ? 'up' : changePercent < 0 ? 'down' : 'neutral'

  const gaugeWidth =
    metric.type === 'percentage' || metric.type === 'ratio'
      ? Math.min(100, Math.max(0, value))
      : Math.min(100, value > 0 ? 72 : 0)

  function formatValue(val: number) {
    const safe = Number.isFinite(val) ? val : 0
    switch (metric.type) {
      case 'currency':
        return `$${safe.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
      case 'percentage':
        return `${safe.toLocaleString(undefined, { maximumFractionDigits: 1 })}%`
      case 'ratio':
        return safe.toFixed(2)
      default:
        return safe.toLocaleString(undefined, { maximumFractionDigits: 0 })
    }
  }

  function formatChange(val: number | null) {
    if (val === null) return '—'
    const prefix = val > 0 ? '+' : ''
    return `${prefix}${val}%`
  }

  function renderMiniChart() {
    switch (metric.visualization) {
      case 'area_chart':
        return (
          <ResponsiveContainer width="100%" height={40}>
            <AreaChart data={chartPoints}>
              <Area type="monotone" dataKey="value" stroke="#4b91ff" fill="#4b91ff1f" strokeWidth={1.5} />
            </AreaChart>
          </ResponsiveContainer>
        )
      case 'bar_chart':
        return (
          <ResponsiveContainer width="100%" height={40}>
            <BarChart data={chartPoints}>
              <Bar dataKey="value" fill="#4b91ff45" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )
      case 'line_chart':
        return (
          <ResponsiveContainer width="100%" height={40}>
            <LineChart data={chartPoints}>
              <Line type="monotone" dataKey="value" stroke="#4b91ff" strokeWidth={1.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        )
      case 'pie_chart': {
        const filled = Math.min(100, Math.max(0, value))
        return (
          <ResponsiveContainer width="100%" height={40}>
            <PieChart>
              <Pie
                data={[
                  { name: 'value', value: filled },
                  { name: 'rest', value: Math.max(0, 100 - filled) },
                ]}
                dataKey="value"
                cx="50%"
                cy="50%"
                innerRadius={12}
                outerRadius={18}
              >
                <Cell fill="#4b91ff" />
                <Cell fill="#243958" />
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        )
      }
      default:
        return null
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="ai-card border border-border-primary rounded-xl p-5 hover:border-border-secondary transition-colors"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-text-tertiary uppercase tracking-wide truncate">{metric.name}</p>
          {loading ? (
            <div className="flex items-center gap-2 mt-2 text-text-tertiary">
              <Loader2 size={16} className="animate-spin" />
              <span className="text-sm">Loading…</span>
            </div>
          ) : (
            <p className="text-2xl font-semibold mt-1">{formatValue(value)}</p>
          )}
        </div>
        <div
          className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-md flex-shrink-0 ${
            trend === 'up'
              ? 'text-success bg-success/10'
              : trend === 'down'
                ? 'text-danger bg-danger/10'
                : 'text-text-tertiary bg-bg-tertiary/85'
          }`}
        >
          {trend === 'up' ? <TrendingUp size={12} /> : trend === 'down' ? <TrendingDown size={12} /> : <Minus size={12} />}
          {formatChange(changePercent)}
        </div>
      </div>

      <div className="mt-2">
        {metric.visualization === 'stat_card' || metric.visualization === 'gauge' ? (
          <div className="h-10 flex items-end">
            <div className="w-full h-2 bg-bg-tertiary rounded-full overflow-hidden">
              <div
                className="h-full bg-accent rounded-full transition-all duration-500"
                style={{ width: `${gaugeWidth}%` }}
              />
            </div>
          </div>
        ) : (
          renderMiniChart()
        )}
      </div>

      <p className="text-xs text-text-tertiary mt-3 truncate" title={periodHint}>
        {periodHint}
      </p>
    </motion.div>
  )
}
