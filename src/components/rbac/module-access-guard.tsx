'use client'

import type { ReactNode } from 'react'
import { Shield } from 'lucide-react'
import { usePermissions } from '@/hooks/use-permissions'
import type { ModuleKey } from '@/lib/rbac/types'

type ModuleAccessGuardProps = {
  module: ModuleKey
  children: ReactNode
  label?: string
}

export function ModuleAccessGuard({ module, children, label }: ModuleAccessGuardProps) {
  const { canViewModule, roleName, department } = usePermissions()

  if (!canViewModule(module)) {
    const scopeHint = department
      ? `Your department (${department}) and role (${roleName}) do not grant access to ${label ?? module.replace(/_/g, ' ')}.`
      : `Your role (${roleName}) does not have permission to view ${label ?? module.replace(/_/g, ' ')}.`

    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 border border-border-primary text-center">
        <div className="w-14 h-14 border border-border-primary flex items-center justify-center mb-4">
          <Shield size={24} className="text-text-tertiary" />
        </div>
        <h3 className="font-serif text-xl font-medium mb-2">Access restricted</h3>
        <p className="text-sm text-text-secondary max-w-md">
          {scopeHint} Contact an administrator to request access.
        </p>
      </div>
    )
  }

  return <>{children}</>
}
