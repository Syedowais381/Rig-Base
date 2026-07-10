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
    <div className="segmented-control">
      {periods.map((period) => (
        <button
          key={period.value}
          type="button"
          data-active={timePeriod === period.value ? 'true' : 'false'}
          onClick={() => setTimePeriod(period.value)}
        >
          {period.label}
        </button>
      ))}
    </div>
  )
}
