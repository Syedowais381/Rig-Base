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
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function DataTable<T extends Record<string, any>>({ columns, data, onRowClick }: DataTableProps<T>) {
  return (
    <div className="border border-border-primary rounded-xl overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border-primary bg-bg-tertiary/50">
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
          {data.map((item, i) => (
            <tr
              key={i}
              onClick={() => onRowClick?.(item)}
              className={`border-b border-border-primary last:border-0 ${
                onRowClick ? 'cursor-pointer hover:bg-bg-tertiary/50' : ''
              } transition-colors`}
            >
              {columns.map((col) => (
                <td key={col.key} className="px-4 py-3 text-sm">
                  {col.render ? col.render(item) : String(item[col.key] ?? '')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
