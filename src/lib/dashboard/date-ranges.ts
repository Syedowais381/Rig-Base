import type { TimePeriod } from '@/lib/types'

export type DateRange = {
  start: Date | null
  end: Date
  previousStart: Date | null
  previousEnd: Date | null
  label: string
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0)
}

function endOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999)
}

/** Monday as first day of week (ISO-style). */
function startOfWeek(date: Date): Date {
  const d = startOfDay(date)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  return d
}

function endOfWeek(date: Date): Date {
  const start = startOfWeek(date)
  const end = new Date(start)
  end.setDate(end.getDate() + 6)
  return endOfDay(end)
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0)
}

function endOfMonth(date: Date): Date {
  return endOfDay(new Date(date.getFullYear(), date.getMonth() + 1, 0))
}

function startOfYear(date: Date): Date {
  return new Date(date.getFullYear(), 0, 1, 0, 0, 0, 0)
}

function endOfYear(date: Date): Date {
  return endOfDay(new Date(date.getFullYear(), 11, 31))
}

export function parseDateOnly(value: string): Date | null {
  if (!value) return null
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (!match) return null
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  if (month < 1 || month > 12 || day < 1 || day > 31) return null
  const parsed = new Date(year, month - 1, day)
  if (parsed.getFullYear() !== year || parsed.getMonth() !== month - 1 || parsed.getDate() !== day) {
    return null
  }
  return parsed
}

export function isDateInRange(dateValue: string, range: Pick<DateRange, 'start' | 'end'>): boolean {
  const parsed = parseDateOnly(dateValue)
  if (!parsed) return false
  const day = startOfDay(parsed)
  if (range.start && day < range.start) return false
  if (day > range.end) return false
  return true
}

export function getDateRange(period: TimePeriod, reference = new Date()): DateRange {
  const now = reference

  switch (period) {
    case 'today': {
      const start = startOfDay(now)
      const end = endOfDay(now)
      const yesterday = new Date(start)
      yesterday.setDate(yesterday.getDate() - 1)
      return {
        start,
        end,
        previousStart: startOfDay(yesterday),
        previousEnd: endOfDay(yesterday),
        label: 'Today',
      }
    }
    case 'week': {
      const start = startOfWeek(now)
      const end = endOfWeek(now)
      const prevEnd = new Date(start)
      prevEnd.setDate(prevEnd.getDate() - 1)
      const prevStart = startOfWeek(prevEnd)
      return {
        start,
        end,
        previousStart: prevStart,
        previousEnd: endOfDay(prevEnd),
        label: 'This week',
      }
    }
    case 'month': {
      const start = startOfMonth(now)
      const end = endOfMonth(now)
      const prevEnd = new Date(start)
      prevEnd.setDate(prevEnd.getDate() - 1)
      const prevStart = startOfMonth(prevEnd)
      return {
        start,
        end,
        previousStart: prevStart,
        previousEnd: endOfMonth(prevEnd),
        label: 'This month',
      }
    }
    case 'year': {
      const start = startOfYear(now)
      const end = endOfYear(now)
      const prevEnd = new Date(start)
      prevEnd.setDate(prevEnd.getDate() - 1)
      const prevStart = startOfYear(prevEnd)
      return {
        start,
        end,
        previousStart: prevStart,
        previousEnd: endOfYear(prevEnd),
        label: 'This year',
      }
    }
    case 'all':
    default:
      return {
        start: null,
        end: endOfDay(now),
        previousStart: null,
        previousEnd: null,
        label: 'All time',
      }
  }
}

export function getComparisonLabel(period: TimePeriod): string {
  switch (period) {
    case 'today':
      return 'vs. yesterday'
    case 'week':
      return 'vs. last week'
    case 'month':
      return 'vs. last month'
    case 'year':
      return 'vs. last year'
    case 'all':
    default:
      return 'lifetime total'
  }
}

/** Bucket labels for mini charts within the selected period. */
export function getChartBuckets(period: TimePeriod, reference = new Date()): { key: string; start: Date; end: Date }[] {
  const range = getDateRange(period, reference)

  if (period === 'today') {
    return [{ key: 'Today', start: range.start!, end: range.end }]
  }

  if (period === 'week') {
    return Array.from({ length: 7 }, (_, i) => {
      const start = new Date(range.start!)
      start.setDate(start.getDate() + i)
      return { key: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i], start: startOfDay(start), end: endOfDay(start) }
    })
  }

  if (period === 'month') {
    const buckets: { key: string; start: Date; end: Date }[] = []
    let cursor = new Date(range.start!)
    while (cursor <= range.end) {
      const weekStart = startOfDay(cursor)
      const weekEnd = endOfDay(new Date(Math.min(endOfWeek(cursor).getTime(), range.end.getTime())))
      buckets.push({ key: `W${buckets.length + 1}`, start: weekStart, end: weekEnd })
      cursor = new Date(weekEnd)
      cursor.setDate(cursor.getDate() + 1)
      if (buckets.length >= 5) break
    }
    return buckets.length > 0 ? buckets : [{ key: 'Month', start: range.start!, end: range.end }]
  }

  if (period === 'year') {
    return Array.from({ length: 12 }, (_, month) => {
      const start = new Date(reference.getFullYear(), month, 1)
      const end = endOfMonth(start)
      return { key: start.toLocaleString('en-US', { month: 'short' }), start, end }
    })
  }

  // All time — last 12 months
  return Array.from({ length: 12 }, (_, i) => {
    const monthDate = new Date(reference.getFullYear(), reference.getMonth() - (11 - i), 1)
    return {
      key: monthDate.toLocaleString('en-US', { month: 'short' }),
      start: startOfMonth(monthDate),
      end: endOfMonth(monthDate),
    }
  })
}

export function isDateInBucket(dateValue: string, bucket: { start: Date; end: Date }): boolean {
  const parsed = parseDateOnly(dateValue)
  if (!parsed) return false
  const day = startOfDay(parsed)
  return day >= bucket.start && day <= bucket.end
}
