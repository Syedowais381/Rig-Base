'use client'

import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import {
  canAccessModule,
  canViewModuleWithContext,
  getDefaultLandingRoute,
  getDepartmentModules,
  getVisibleModules,
  type ModuleAccessContext,
} from '@/lib/rbac/module-access'
import { normalizeRolePermissions, ownerPermissions } from '@/lib/rbac/permissions'
import type { ModuleKey, ModulePermissionMap, PermissionKey } from '@/lib/rbac/types'
import { currentEmployeeQueryKey, rolesQueryKey } from '@/lib/rbac/query-keys'
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
  const workspaceId = workspace?.id

  const { data: roles = [], isLoading: rolesLoading } = useQuery({
    queryKey: rolesQueryKey(workspaceId),
    queryFn: async () => {
      const { data } = await supabase
        .from('roles')
        .select('*')
        .eq('workspace_id', workspaceId!)
        .order('name')
      return (data || []).map((role) => normalizeRole(role as Role))
    },
    enabled: !!workspaceId,
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  })

  const { data: employeeRecord, isLoading: employeeLoading } = useQuery({
    queryKey: currentEmployeeQueryKey(workspaceId, profile?.id),
    queryFn: async () => {
      if (!profile?.id || !workspaceId) return null
      const { data } = await supabase
        .from('employees')
        .select('id, role_id, department')
        .eq('workspace_id', workspaceId)
        .eq('user_id', profile.id)
        .maybeSingle()
      return data
    },
    enabled: !!profile?.id && !!workspaceId,
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  })

  const isOwner = workspace?.user_id === profile?.id

  const activeRole = useMemo(() => {
    if (!workspace || !profile) return null

    if (isOwner) {
      return roles.find((r) => r.name === 'Owner') ?? null
    }

    if (employeeRecord?.role_id) {
      return roles.find((r) => r.id === employeeRecord.role_id) ?? null
    }

    return null
  }, [workspace, profile, roles, employeeRecord, isOwner])

  const permissions: ModulePermissionMap = useMemo(() => {
    if (!workspace) return {}
    if (isOwner) {
      return activeRole?.permissions ?? ownerPermissions(workspace.modules)
    }
    return activeRole?.permissions ?? {}
  }, [workspace, isOwner, activeRole])

  const roleName = activeRole?.name ?? (isOwner ? 'Owner' : 'Guest')
  const department = employeeRecord?.department ?? null

  const accessContext: ModuleAccessContext | null = useMemo(() => {
    if (!workspace) return null
    return {
      workspaceModules: workspace.modules,
      permissions,
      department,
      isOwner,
      roleName,
    }
  }, [workspace, permissions, department, isOwner, roleName])

  const departmentModules = useMemo(() => {
    if (!workspace) return []
    return getDepartmentModules(department, workspace.modules)
  }, [workspace, department])

  const visibleModules = useMemo(() => {
    if (!accessContext) return []
    return getVisibleModules(accessContext)
  }, [accessContext])

  const defaultLandingRoute = useMemo(() => {
    if (!accessContext) return '/dashboard/profile'
    return getDefaultLandingRoute(accessContext)
  }, [accessContext])

  function can(module: ModuleKey, permission: PermissionKey): boolean {
    if (!accessContext) return false
    return canAccessModule(accessContext, module, permission)
  }

  function canViewModule(module: ModuleKey): boolean {
    if (!accessContext) return false
    return canViewModuleWithContext(accessContext, module)
  }

  function canManageRoles(): boolean {
    return can('hr', 'manage') || can('settings', 'manage')
  }

  return {
    permissions,
    roleName,
    activeRole,
    roles,
    department,
    departmentModules,
    visibleModules,
    defaultLandingRoute,
    accessContext,
    can,
    canViewModule,
    canManageRoles,
    isOwner,
    isLoading: rolesLoading || employeeLoading,
  }
}
