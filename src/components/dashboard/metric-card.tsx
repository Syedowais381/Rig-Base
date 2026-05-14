'use client'

import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'
import type { DashboardMetric } from '@/lib/types'

interface MetricCardProps {
  metric: DashboardMetric
  index: number
}

export function MetricCard({ metric, index }: MetricCardProps) {
  const value = 0
  const change = 0
  // Will be dynamic once data flows in
  const trend = 'neutral' as 'up' | 'down' | 'neutral'

  function formatValue(val: number) {
    switch (metric.type) {
      case 'currency':
        return `$${val.toLocaleString()}`
      case 'percentage':
        return `${val}%`
      case 'ratio':
        return val.toFixed(2)
      default:
        return val.toLocaleString()
    }
  }

  function renderMiniChart() {
    const emptyData = Array.from({ length: 7 }, (_, i) => ({ value: 0, name: `Day ${i + 1}` }))

    switch (metric.visualization) {
      case 'area_chart':
        return (
          <ResponsiveContainer width="100%" height={40}>
            <AreaChart data={emptyData}>
              <Area
                type="monotone"
                dataKey="value"
                stroke="#4b91ff"
                fill="#4b91ff1f"
                strokeWidth={1.5}
              />
            </AreaChart>
          </ResponsiveContainer>
        )
      case 'bar_chart':
        return (
          <ResponsiveContainer width="100%" height={40}>
            <BarChart data={emptyData}>
              <Bar dataKey="value" fill="#4b91ff45" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )
      case 'line_chart':
        return (
          <ResponsiveContainer width="100%" height={40}>
            <LineChart data={emptyData}>
              <Line
                type="monotone"
                dataKey="value"
                stroke="#4b91ff"
                strokeWidth={1.5}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        )
      case 'pie_chart':
        return (
          <ResponsiveContainer width={40} height={40}>
            <PieChart>
              <Pie
                data={[{ value: 1 }]}
                dataKey="value"
                cx="50%"
                cy="50%"
                innerRadius={12}
                outerRadius={18}
              >
                <Cell fill="#243958" />
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        )
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
        <div className="flex-1">
          <p className="text-xs font-medium text-text-tertiary uppercase tracking-wide">
            {metric.name}
          </p>
          <p className="text-2xl font-semibold mt-1">{formatValue(value)}</p>
        </div>
        <div className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-md ${
          trend === 'up' ? 'text-success bg-success/10' :
          trend === 'down' ? 'text-danger bg-danger/10' :
          'text-text-tertiary bg-bg-tertiary/85'
        }`}>
          {trend === 'up' ? <TrendingUp size={12} /> :
           trend === 'down' ? <TrendingDown size={12} /> :
           <Minus size={12} />}
          {change}%
        </div>
      </div>

      <div className="mt-2">
        {metric.visualization === 'stat_card' || metric.visualization === 'gauge' ? (
          <div className="h-10 flex items-end">
            <div className="w-full h-2 bg-bg-tertiary rounded-full overflow-hidden">
              <div className="h-full w-0 bg-accent rounded-full" />
            </div>
          </div>
        ) : (
          renderMiniChart()
        )}
      </div>

      <p className="text-xs text-text-tertiary mt-3">
        vs. previous {metric.comparison_period}
      </p>
    </motion.div>
  )
}
