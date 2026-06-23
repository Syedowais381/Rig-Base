'use client'

import { Search, X } from 'lucide-react'
import type { SelectFilter } from '@/hooks/use-table-controls'

type TableToolbarProps = {
  search: string
  onSearchChange: (value: string) => void
  searchPlaceholder?: string
  filters?: SelectFilter[]
  filterValues?: Record<string, string>
  onFilterChange?: (id: string, value: string) => void
  onClear?: () => void
  hasActiveFilters?: boolean
  filteredCount?: number
  totalCount?: number
}

const inputClass =
  'w-full pl-9 pr-3 py-2 bg-bg-tertiary border border-border-primary rounded-lg text-sm focus:outline-none focus:border-accent/60'
const selectClass =
  'px-3 py-2 bg-bg-tertiary border border-border-primary rounded-lg text-sm focus:outline-none focus:border-accent/60 min-w-[140px]'

export function TableToolbar({
  search,
  onSearchChange,
  searchPlaceholder = 'Search…',
  filters = [],
  filterValues = {},
  onFilterChange,
  onClear,
  hasActiveFilters = false,
  filteredCount,
  totalCount,
}: TableToolbarProps) {
  return (
    <div className="mb-4 space-y-3">
      <div className="flex flex-col lg:flex-row lg:items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
          <input
            type="search"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className={inputClass}
            aria-label="Search table"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {filters.map((filter) => (
            <label key={filter.id} className="flex flex-col gap-1">
              <span className="sr-only">{filter.label}</span>
              <select
                value={filterValues[filter.id] ?? 'all'}
                onChange={(e) => onFilterChange?.(filter.id, e.target.value)}
                className={selectClass}
                aria-label={filter.label}
              >
                <option value="all">All {filter.label.toLowerCase()}</option>
                {filter.options.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          ))}

          {hasActiveFilters && onClear && (
            <button
              type="button"
              onClick={onClear}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border border-border-primary text-text-secondary hover:text-text-primary hover:bg-bg-tertiary transition-colors"
            >
              <X size={14} />
              Clear
            </button>
          )}
        </div>
      </div>

      {typeof filteredCount === 'number' && typeof totalCount === 'number' && (
        <p className="text-xs text-text-tertiary">
          Showing {filteredCount} of {totalCount} records
          {hasActiveFilters ? ' (filtered)' : ''}
        </p>
      )}
    </div>
  )
}
