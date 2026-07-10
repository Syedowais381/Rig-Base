'use client'

import { Loader2 } from 'lucide-react'
import { Modal } from '@/components/ui/modal'

type ConfirmDeleteModalProps = {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description: string
  entityName?: string
  loading?: boolean
}

export function ConfirmDeleteModal({
  open,
  onClose,
  onConfirm,
  title,
  description,
  entityName,
  loading = false,
}: ConfirmDeleteModalProps) {
  return (
    <Modal open={open} onClose={onClose} title={title}>
      <div className="space-y-4">
        <p className="text-sm text-text-secondary leading-relaxed">{description}</p>
        {entityName && (
          <p className="text-sm font-medium text-text-primary border border-border-primary bg-bg-tertiary/60 px-3 py-2">
            {entityName}
          </p>
        )}
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-2.5 text-sm font-medium border border-border-primary text-text-secondary hover:text-text-primary hover:bg-bg-tertiary transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 py-2.5 text-sm font-medium bg-danger hover:bg-danger/90 text-white transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            Delete
          </button>
        </div>
      </div>
    </Modal>
  )
}
