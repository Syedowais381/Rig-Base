'use client'

import { useWorkspaceStore } from '@/store/workspace'
import type { TimePeriod } from '@/lib/types'

const periods: { value: TimePeriod; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
  { value: 'year', label: 'This Year' },
  { value: 'all', label: 'All Time' },
]

export function TimeFilter() {
  const { timePeriod, setTimePeriod } = useWorkspaceStore()

  return (
    <div className="flex flex-wrap items-center gap-1 p-1 bg-bg-secondary/90 border border-border-primary rounded-lg max-w-full">
      {periods.map((period) => (
        <button
          key={period.value}
          onClick={() => setTimePeriod(period.value)}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
            timePeriod === period.value
              ? 'bg-gradient-to-r from-accent to-[#2f78ff] text-white'
              : 'text-text-secondary hover:text-text-primary hover:bg-bg-tertiary/75'
          }`}
        >
          {period.label}
        </button>
      ))}
    </div>
  )
}
