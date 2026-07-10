'use client'

import { Pencil, Trash2 } from 'lucide-react'

type RowActionsProps = {
  onEdit?: () => void
  onDelete?: () => void
  editLabel?: string
  deleteLabel?: string
}

export function RowActions({
  onEdit,
  onDelete,
  editLabel = 'Edit',
  deleteLabel = 'Delete',
}: RowActionsProps) {
  return (
    <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
      {onEdit && (
        <button
          type="button"
          onClick={onEdit}
          aria-label={editLabel}
          title={editLabel}
          className="p-1.5 text-text-tertiary hover:text-accent hover:bg-accent/10 transition-colors"
        >
          <Pencil size={15} />
        </button>
      )}
      {onDelete && (
        <button
          type="button"
          onClick={onDelete}
          aria-label={deleteLabel}
          title={deleteLabel}
          className="p-1.5 text-text-tertiary hover:text-danger hover:bg-danger/10 transition-colors"
        >
          <Trash2 size={15} />
        </button>
      )}
    </div>
  )
}

export function actionsColumn<T>(render: (item: T) => React.ReactNode) {
  return {
    key: 'actions',
    header: '',
    render,
  }
}
