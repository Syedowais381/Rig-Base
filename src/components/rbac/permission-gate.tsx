'use client'

import type { ReactNode } from 'react'
import { usePermissions } from '@/hooks/use-permissions'
import type { ModuleKey, PermissionKey } from '@/lib/rbac/types'

type PermissionGateProps = {
  module: ModuleKey
  permission: PermissionKey
  children: ReactNode
  fallback?: ReactNode
}

export function PermissionGate({ module, permission, children, fallback = null }: PermissionGateProps) {
  const { can } = usePermissions()
  if (!can(module, permission)) return <>{fallback}</>
  return <>{children}</>
}
