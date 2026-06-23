'use client'

import { useCallback, useMemo } from 'react'
import { DataTable } from '@/components/ui/data-table'
import { TablePagination } from '@/components/ui/table-pagination'
import { TableToolbar } from '@/components/ui/table-toolbar'
import { matchesFilter, matchesSearch, useTableControls, type SelectFilter } from '@/hooks/use-table-controls'

interface Column<T> {
  key: string
  header: string
  render?: (item: T) => React.ReactNode
}

interface FilterableDataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  searchPlaceholder?: string
  searchKeys?: (keyof T)[]
  getSearchText?: (item: T) => string
  filters?: SelectFilter[]
  customFilter?: (item: T, ctx: { search: string; filters: Record<string, string> }) => boolean
  pageSize?: number
  emptyFilteredMessage?: string
  rowKey?: (item: T) => string
  onRowClick?: (item: T) => void
}

export function FilterableDataTable<T>({
  columns,
  data,
  searchPlaceholder = 'Search records…',
  searchKeys = [],
  getSearchText,
  filters = [],
  customFilter,
  pageSize = 10,
  emptyFilteredMessage = 'No records match your search or filters.',
  rowKey,
  onRowClick,
}: FilterableDataTableProps<T>) {
  const filterFn = useCallback(
    (item: T, ctx: { search: string; filters: Record<string, string> }) => {
      if (customFilter) return customFilter(item, ctx)

      const record = item as Record<string, unknown>
      const searchText = getSearchText
        ? getSearchText(item)
        : searchKeys.map((key) => String(record[String(key)] ?? '')).join(' ')

      if (!matchesSearch(searchText, ctx.search)) return false

      for (const filter of filters) {
        const selected = ctx.filters[filter.id] ?? 'all'
        if (selected === 'all') continue
        const fieldValue = String(record[filter.id] ?? '')
        if (!matchesFilter(fieldValue, selected)) return false
      }

      return true
    },
    [customFilter, filters, getSearchText, searchKeys]
  )

  const table = useTableControls(data, { pageSize, filters, filterFn })

  const resolvedRowKey = useMemo(
    () =>
      rowKey ??
      ((item: T) => String((item as { id?: unknown }).id ?? JSON.stringify(item))),
    [rowKey]
  )

  return (
    <div>
      <TableToolbar
        search={table.search}
        onSearchChange={table.setSearch}
        searchPlaceholder={searchPlaceholder}
        filters={filters}
        filterValues={table.filterValues}
        onFilterChange={table.setFilter}
        onClear={table.clearFilters}
        hasActiveFilters={table.hasActiveFilters}
        filteredCount={table.filteredCount}
        totalCount={table.totalCount}
      />

      {table.filteredCount === 0 ? (
        <div className="ai-card border border-border-primary rounded-xl px-6 py-12 text-center">
          <p className="text-sm text-text-secondary">{emptyFilteredMessage}</p>
          {table.hasActiveFilters && (
            <button
              type="button"
              onClick={table.clearFilters}
              className="mt-3 text-xs text-accent hover:text-accent-hover"
            >
              Clear search and filters
            </button>
          )}
        </div>
      ) : (
        <>
          <DataTable columns={columns} data={table.paginatedData} onRowClick={onRowClick} rowKey={resolvedRowKey} />
          <TablePagination
            page={table.page}
            totalPages={table.totalPages}
            rangeStart={table.rangeStart}
            rangeEnd={table.rangeEnd}
            filteredCount={table.filteredCount}
            onPageChange={table.setPage}
          />
        </>
      )}
    </div>
  )
}
