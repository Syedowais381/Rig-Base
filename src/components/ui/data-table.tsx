'use client'

interface Column<T> {
  key: string
  header: string
  render?: (item: T) => React.ReactNode
}

interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  onRowClick?: (item: T) => void
  rowKey?: (item: T) => string
  emptyMessage?: string
}

export function DataTable<T>({
  columns,
  data,
  onRowClick,
  rowKey,
  emptyMessage = 'No records to display.',
}: DataTableProps<T>) {
  return (
    <div className="border border-border-primary rounded-xl overflow-hidden ai-card">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px]">
          <thead>
            <tr className="border-b border-border-primary bg-bg-tertiary/60">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="text-left text-xs font-medium text-text-tertiary uppercase tracking-wide px-4 py-3"
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-10 text-center text-sm text-text-secondary">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((item) => (
                <tr
                  key={rowKey ? rowKey(item) : JSON.stringify(item)}
                  onClick={() => onRowClick?.(item)}
                  className={`border-b border-border-primary last:border-0 ${
                    onRowClick ? 'cursor-pointer hover:bg-bg-tertiary/60' : ''
                  } transition-colors`}
                >
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-3 text-sm">
                      {col.render
                        ? col.render(item)
                        : String((item as Record<string, unknown>)[col.key] ?? '')}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
