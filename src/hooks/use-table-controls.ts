'use client'

import { useEffect, useMemo, useState } from 'react'

export type SelectFilter = {
  id: string
  label: string
  options: { value: string; label: string }[]
  defaultValue?: string
}

type FilterContext = {
  search: string
  filters: Record<string, string>
}

export function useTableControls<T>(
  data: T[],
  options: {
    pageSize?: number
    filters?: SelectFilter[]
    filterFn: (item: T, ctx: FilterContext) => boolean
  }
) {
  const pageSize = options.pageSize ?? 10
  const filters = options.filters ?? []
  const { filterFn } = options
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [filterValues, setFilterValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(filters.map((f) => [f.id, f.defaultValue ?? 'all']))
  )

  useEffect(() => {
    setPage(1)
  }, [search, filterValues])

  const filteredData = useMemo(
    () => data.filter((item) => filterFn(item, { search, filters: filterValues })),
    [data, search, filterValues, filterFn]
  )

  const totalPages = Math.max(1, Math.ceil(filteredData.length / pageSize))
  const safePage = Math.min(page, totalPages)

  useEffect(() => {
    if (page > totalPages) setPage(totalPages)
  }, [page, totalPages])

  const paginatedData = useMemo(
    () => filteredData.slice((safePage - 1) * pageSize, safePage * pageSize),
    [filteredData, safePage, pageSize]
  )

  function setFilter(id: string, value: string) {
    setFilterValues((prev) => ({ ...prev, [id]: value }))
  }

  function clearFilters() {
    setSearch('')
    setFilterValues(Object.fromEntries(filters.map((f) => [f.id, f.defaultValue ?? 'all'])))
  }

  const hasActiveFilters =
    search.trim().length > 0 || filters.some((f) => (filterValues[f.id] ?? 'all') !== 'all')

  return {
    search,
    setSearch,
    filterValues,
    setFilter,
    clearFilters,
    hasActiveFilters,
    page: safePage,
    setPage,
    totalPages,
    pageSize,
    filteredData,
    paginatedData,
    totalCount: data.length,
    filteredCount: filteredData.length,
    rangeStart: filteredData.length === 0 ? 0 : (safePage - 1) * pageSize + 1,
    rangeEnd: Math.min(safePage * pageSize, filteredData.length),
  }
}

export function matchesSearch(text: string, query: string): boolean {
  if (!query.trim()) return true
  return text.toLowerCase().includes(query.trim().toLowerCase())
}

export function matchesFilter(value: string, filterValue: string): boolean {
  return filterValue === 'all' || value === filterValue
}
