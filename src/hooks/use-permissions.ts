'use client'

import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import {
  canViewModule as checkViewModule,
  hasPermission,
  normalizeRolePermissions,
  ownerPermissions,
} from '@/lib/rbac/permissions'
import type { ModuleKey, ModulePermissionMap, PermissionKey } from '@/lib/rbac/types'
import { useWorkspaceStore } from '@/store/workspace'
import type { Role } from '@/lib/types'

function normalizeRole(role: Role): Role {
  return {
    ...role,
    permissions: normalizeRolePermissions(role.permissions),
  }
}

export function usePermissions() {
  const { workspace, profile } = useWorkspaceStore()
  const supabase = createClient()

  const { data: roles = [] } = useQuery({
    queryKey: ['roles'],
    queryFn: async () => {
      const { data } = await supabase.from('roles').select('*').order('name')
      return (data || []).map((role) => normalizeRole(role as Role))
    },
    enabled: !!workspace?.id,
  })

  const { data: employeeRecord } = useQuery({
    queryKey: ['current-employee', profile?.id],
    queryFn: async () => {
      if (!profile?.id || !workspace?.id) return null
      const { data } = await supabase
        .from('employees')
        .select('id, role_id')
        .eq('workspace_id', workspace.id)
        .eq('user_id', profile.id)
        .maybeSingle()
      return data
    },
    enabled: !!profile?.id && !!workspace?.id,
  })

  const activeRole = useMemo(() => {
    if (!workspace || !profile) return null

    const isOwner = workspace.user_id === profile.id
    if (isOwner) {
      return roles.find((r) => r.name === 'Owner') ?? null
    }

    if (employeeRecord?.role_id) {
      return roles.find((r) => r.id === employeeRecord.role_id) ?? null
    }

    return null
  }, [workspace, profile, roles, employeeRecord])

  const permissions: ModulePermissionMap = useMemo(() => {
    if (!workspace) return {}
    if (workspace.user_id === profile?.id) {
      return activeRole?.permissions ?? ownerPermissions(workspace.modules)
    }
    return activeRole?.permissions ?? {}
  }, [workspace, profile, activeRole])

  const roleName = activeRole?.name ?? (workspace?.user_id === profile?.id ? 'Owner' : 'Guest')

  function can(module: ModuleKey, permission: PermissionKey): boolean {
    if (!workspace?.modules) return false
    if (module !== 'settings' && module in workspace.modules && !workspace.modules[module as keyof typeof workspace.modules]) {
      return false
    }
    return hasPermission(permissions, module, permission)
  }

  function canViewModule(module: ModuleKey): boolean {
    if (!workspace?.modules) return false
    if (module !== 'settings' && module in workspace.modules && !workspace.modules[module as keyof typeof workspace.modules]) {
      return false
    }
    return checkViewModule(permissions, module)
  }

  function canManageRoles(): boolean {
    return can('hr', 'manage') || can('settings', 'manage')
  }

  return {
    permissions,
    roleName,
    activeRole,
    roles,
    can,
    canViewModule,
    canManageRoles,
    isOwner: workspace?.user_id === profile?.id,
  }
}
