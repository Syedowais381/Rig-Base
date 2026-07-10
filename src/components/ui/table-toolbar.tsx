'use client'

import { Search, X } from 'lucide-react'
import type { SelectFilter } from '@/hooks/use-table-controls'
import { ThemeSelect } from '@/components/ui/theme-select'

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
    <div className="mb-6 space-y-3">
      <div className="flex flex-col lg:flex-row lg:items-end gap-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-0 top-1/2 -translate-y-1/2 text-text-tertiary" />
          <input
            type="search"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="table-search"
            aria-label="Search table"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {filters.map((filter) => {
            const currentValue = filterValues[filter.id] ?? 'all'
            const options = [
              { value: 'all', label: `All ${filter.label.toLowerCase()}` },
              ...filter.options,
            ]

            return (
              <ThemeSelect
                key={filter.id}
                value={currentValue}
                onChange={(value) => onFilterChange?.(filter.id, value)}
                options={options}
                aria-label={filter.label}
              />
            )
          })}

          {hasActiveFilters && onClear && (
            <button
              type="button"
              onClick={onClear}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-text-tertiary hover:text-text-secondary transition-colors"
            >
              <X size={14} />
              Clear
            </button>
          )}
        </div>
      </div>

      {typeof filteredCount === 'number' && typeof totalCount === 'number' && (
        <p className="text-xs text-text-muted">
          Showing {filteredCount} of {totalCount} records
          {hasActiveFilters ? ' (filtered)' : ''}
        </p>
      )}
    </div>
  )
}
