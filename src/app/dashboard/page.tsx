'use client'

import { useWorkspaceStore } from '@/store/workspace'
import { TimeFilter } from '@/components/dashboard/time-filter'
import { MetricCard } from '@/components/dashboard/metric-card'
import { motion } from 'framer-motion'
import { Sparkles, CheckCircle2, Circle } from 'lucide-react'

export default function DashboardPage() {
  const { workspace, profile } = useWorkspaceStore()

  if (!workspace) return null

  const completedTasks = workspace.setup_checklist?.filter((t) => t.completed)?.length || 0
  const totalTasks = workspace.setup_checklist?.length || 0

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold">
            Welcome back, {profile?.full_name?.split(' ')[0] || 'there'}
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            {workspace.business_type} — overview
          </p>
        </div>
        <TimeFilter />
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
        {workspace.dashboard_metrics?.map((metric, index) => (
          <MetricCard key={metric.id} metric={metric} index={index} />
        ))}
      </div>

      {/* Setup Checklist */}
      {totalTasks > 0 && completedTasks < totalTasks && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-bg-secondary border border-border-primary rounded-xl p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-accent-muted rounded-lg flex items-center justify-center">
              <Sparkles size={16} className="text-accent" />
            </div>
            <div>
              <h2 className="font-semibold text-sm">Setup Checklist</h2>
              <p className="text-xs text-text-tertiary">
                {completedTasks}/{totalTasks} completed
              </p>
            </div>
            <div className="ml-auto">
              <div className="w-32 h-2 bg-bg-tertiary rounded-full overflow-hidden">
                <div
                  className="h-full bg-accent rounded-full transition-all"
                  style={{ width: `${(completedTasks / totalTasks) * 100}%` }}
                />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {workspace.setup_checklist
              ?.sort((a, b) => a.priority - b.priority)
              .slice(0, 5)
              .map((task) => (
                <div key={task.id} className="flex items-start gap-3 py-2">
                  {task.completed ? (
                    <CheckCircle2 size={18} className="text-success flex-shrink-0 mt-0.5" />
                  ) : (
                    <Circle size={18} className="text-text-tertiary flex-shrink-0 mt-0.5" />
                  )}
                  <div>
                    <p className={`text-sm ${task.completed ? 'text-text-tertiary line-through' : ''}`}>
                      {task.title}
                    </p>
                    <p className="text-xs text-text-tertiary mt-0.5">{task.description}</p>
                  </div>
                </div>
              ))}
          </div>
        </motion.div>
      )}

      {/* Empty state when no data */}
      {(!workspace.dashboard_metrics || workspace.dashboard_metrics.length === 0) && (
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-bg-secondary border border-border-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Sparkles size={24} className="text-text-tertiary" />
          </div>
          <h2 className="text-lg font-semibold mb-2">Your dashboard is ready</h2>
          <p className="text-text-secondary text-sm max-w-md mx-auto">
            Start adding data to your modules and your metrics will come alive.
            Follow the setup checklist to get started.
          </p>
        </div>
      )}
    </div>
  )
}
