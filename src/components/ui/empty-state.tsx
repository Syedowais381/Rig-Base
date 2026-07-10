'use client'

import { motion } from 'framer-motion'
import type { LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  action?: {
    label: string
    onClick: () => void
  }
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16 px-4 border border-border-primary"
    >
      <div className="w-14 h-14 border border-border-primary flex items-center justify-center mb-4">
        <Icon size={22} className="text-accent" strokeWidth={1.75} />
      </div>
      <h3 className="font-serif text-xl font-medium mb-2">{title}</h3>
      <p className="text-text-tertiary text-sm text-center max-w-md mb-6">{description}</p>
      {action && (
        <button type="button" onClick={action.onClick} className="btn-primary">
          {action.label}
        </button>
      )}
    </motion.div>
  )
}
