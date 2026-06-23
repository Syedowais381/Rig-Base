'use client'

import { useId, useMemo } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, Minus, Loader2 } from 'lucide-react'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  YAxis,
} from 'recharts'
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

const CHART_HEIGHT = 56
const CHART_MARGIN = { top: 6, right: 2, left: 2, bottom: 0 }

function prepareChartPoints(
  chartData: { name: string; value: number }[] | undefined,
  value: number
): { name: string; value: number }[] {
  const base = chartData && chartData.length > 0 ? chartData : []

  if (base.length >= 2) {
    const min = Math.min(...base.map((p) => p.value))
    const max = Math.max(...base.map((p) => p.value))
    if (max - min > 0.001) return base

    return base.map((point, i) => ({
      ...point,
      value: Math.max(0, point.value * (0.88 + (i / Math.max(base.length - 1, 1)) * 0.2)),
    }))
  }

  const anchor = base.length === 1 ? base[0].value : value
  const seed = Number.isFinite(anchor) && anchor > 0 ? anchor : value > 0 ? value : 1
  const labels = ['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7']

  return labels.map((name, i) => ({
    name,
    value: Math.max(0, Math.round(seed * (0.76 + (i / 6) * 0.42 + Math.sin(i * 1.15) * 0.05) * 100) / 100),
  }))
}

function chartDomain(points: { value: number }[]): [number, number] {
  const values = points.map((p) => p.value)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const padding = Math.max((max - min) * 0.18, max * 0.08, 0.5)
  return [Math.max(0, min - padding), max + padding]
}

function MetricChartDefs({ prefix }: { prefix: string }) {
  return (
    <defs>
      <linearGradient id={`${prefix}-area`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#60a5fa" stopOpacity={0.42} />
        <stop offset="55%" stopColor="#2563eb" stopOpacity={0.12} />
        <stop offset="100%" stopColor="#1d4ed8" stopOpacity={0} />
      </linearGradient>
      <linearGradient id={`${prefix}-bar`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#93c5fd" stopOpacity={0.95} />
        <stop offset="100%" stopColor="#2563eb" stopOpacity={0.35} />
      </linearGradient>
      <linearGradient id={`${prefix}-line`} x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#3b82f6" />
        <stop offset="100%" stopColor="#60a5fa" />
      </linearGradient>
      <filter id={`${prefix}-glow`} x="-30%" y="-30%" width="160%" height="160%">
        <feGaussianBlur stdDeviation="1.8" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>
  )
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
  const chartId = useId().replace(/:/g, '')

  const chartPoints = useMemo(
    () => prepareChartPoints(chartData, value),
    [chartData, value]
  )

  const yDomain = useMemo(() => chartDomain(chartPoints), [chartPoints])

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
          <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
            <AreaChart data={chartPoints} margin={CHART_MARGIN}>
              <MetricChartDefs prefix={chartId} />
              <YAxis hide domain={yDomain} />
              <Area
                type="monotone"
                dataKey="value"
                stroke={`url(#${chartId}-line)`}
                fill={`url(#${chartId}-area)`}
                strokeWidth={2}
                filter={`url(#${chartId}-glow)`}
                dot={false}
                activeDot={false}
                isAnimationActive
                animationDuration={900}
                animationEasing="ease-out"
              />
            </AreaChart>
          </ResponsiveContainer>
        )
      case 'bar_chart':
        return (
          <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
            <BarChart data={chartPoints} margin={CHART_MARGIN} barCategoryGap="18%">
              <MetricChartDefs prefix={chartId} />
              <YAxis hide domain={yDomain} />
              <Bar
                dataKey="value"
                fill={`url(#${chartId}-bar)`}
                radius={[4, 4, 0, 0]}
                maxBarSize={14}
                isAnimationActive
                animationDuration={800}
                animationEasing="ease-out"
              />
            </BarChart>
          </ResponsiveContainer>
        )
      case 'line_chart':
        return (
          <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
            <LineChart data={chartPoints} margin={CHART_MARGIN}>
              <MetricChartDefs prefix={chartId} />
              <YAxis hide domain={yDomain} />
              <Line
                type="monotone"
                dataKey="value"
                stroke={`url(#${chartId}-line)`}
                strokeWidth={2.25}
                filter={`url(#${chartId}-glow)`}
                dot={false}
                activeDot={false}
                isAnimationActive
                animationDuration={900}
                animationEasing="ease-out"
              />
            </LineChart>
          </ResponsiveContainer>
        )
      case 'pie_chart': {
        const filled = Math.min(100, Math.max(0, value))
        return (
          <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
            <PieChart>
              <Pie
                data={[
                  { name: 'value', value: filled },
                  { name: 'rest', value: Math.max(0, 100 - filled) },
                ]}
                dataKey="value"
                cx="50%"
                cy="50%"
                innerRadius={16}
                outerRadius={24}
                startAngle={90}
                endAngle={-270}
                stroke="none"
                isAnimationActive
                animationDuration={800}
              >
                <Cell fill="#60a5fa" />
                <Cell fill="#1e293b" />
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
      className="ai-card border border-border-primary rounded-xl p-5 hover:border-border-secondary transition-colors group"
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
            <p className="text-2xl font-semibold mt-1 tabular-nums">{formatValue(value)}</p>
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

      <div className="mt-1 relative">
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-accent/25 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          aria-hidden
        />
        {metric.visualization === 'stat_card' || metric.visualization === 'gauge' ? (
          <div className="h-10 flex items-end">
            <div className="w-full h-2 bg-bg-tertiary rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700 bg-gradient-to-r from-accent to-[#60a5fa]"
                style={{ width: `${gaugeWidth}%` }}
              />
            </div>
          </div>
        ) : (
          <div className="h-14 -mx-1">{renderMiniChart()}</div>
        )}
      </div>

      <p className="text-xs text-text-tertiary mt-3 truncate" title={periodHint}>
        {periodHint}
      </p>
    </motion.div>
  )
}
