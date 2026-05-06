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
    <div className="flex items-center gap-1 p-1 bg-bg-secondary border border-border-primary rounded-lg">
      {periods.map((period) => (
        <button
          key={period.value}
          onClick={() => setTimePeriod(period.value)}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
            timePeriod === period.value
              ? 'bg-accent text-white'
              : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          {period.label}
        </button>
      ))}
    </div>
  )
}
