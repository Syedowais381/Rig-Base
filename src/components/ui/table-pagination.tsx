'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'

type TablePaginationProps = {
  page: number
  totalPages: number
  rangeStart: number
  rangeEnd: number
  filteredCount: number
  onPageChange: (page: number) => void
}

export function TablePagination({
  page,
  totalPages,
  rangeStart,
  rangeEnd,
  filteredCount,
  onPageChange,
}: TablePaginationProps) {
  if (filteredCount === 0) return null

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-4 px-1">
      <p className="text-xs text-text-tertiary">
        {rangeStart}–{rangeEnd} of {filteredCount}
      </p>

      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium border border-border-primary bg-bg-secondary/90 disabled:opacity-40 hover:bg-bg-tertiary transition-colors"
        >
          <ChevronLeft size={14} />
          Previous
        </button>
        <span className="text-xs text-text-secondary tabular-nums px-2">
          Page {page} of {totalPages}
        </span>
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium border border-border-primary bg-bg-secondary/90 disabled:opacity-40 hover:bg-bg-tertiary transition-colors"
        >
          Next
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  )
}
