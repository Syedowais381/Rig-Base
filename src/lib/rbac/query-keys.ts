export function rolesQueryKey(workspaceId?: string | null) {
  return workspaceId ? (['roles', workspaceId] as const) : (['roles'] as const)
}

export function currentEmployeeQueryKey(workspaceId?: string | null, userId?: string | null) {
  return workspaceId && userId
    ? (['current-employee', workspaceId, userId] as const)
    : (['current-employee'] as const)
}

export const PERMISSION_QUERY_ROOTS = ['roles', 'current-employee'] as const
