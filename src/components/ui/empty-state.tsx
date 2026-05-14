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
      className="flex flex-col items-center justify-center py-16 px-4"
    >
      <div className="w-16 h-16 ai-card border border-border-primary rounded-2xl flex items-center justify-center mb-4">
        <Icon size={24} className="text-cyan-glow" />
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-text-secondary text-sm text-center max-w-md mb-6">{description}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="px-4 py-2.5 bg-gradient-to-r from-accent to-[#2f78ff] hover:to-[#4a91ff] text-white text-sm font-medium rounded-lg transition-colors ai-glow"
        >
          {action.label}
        </button>
      )}
    </motion.div>
  )
}
