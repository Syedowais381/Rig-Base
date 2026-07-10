import type { SupabaseClient } from '@supabase/supabase-js'
import type { Employee, WorkspaceConfig } from '@/lib/types'

export type WorkspaceMembership = {
  workspace_id: string
  business_type: string
  business_name: string
  membership_type: 'owner' | 'employee'
  role_name: string
  employee_id: string | null
  is_active: boolean
}

export type WorkspaceAccess = {
  workspace: WorkspaceConfig
  isOwner: boolean
  employee: Employee | null
}

async function getActiveWorkspaceId(
  supabase: SupabaseClient,
  userId: string
): Promise<string | null> {
  const { data } = await supabase
    .from('profiles')
    .select('active_workspace_id')
    .eq('id', userId)
    .maybeSingle()
  return data?.active_workspace_id ?? null
}

async function userCanAccessWorkspace(
  supabase: SupabaseClient,
  userId: string,
  workspaceId: string
): Promise<WorkspaceAccess | null> {
  const { data: owned } = await supabase
    .from('workspaces')
    .select('*')
    .eq('id', workspaceId)
    .eq('user_id', userId)
    .maybeSingle()

  if (owned) {
    return {
      workspace: owned as WorkspaceConfig,
      isOwner: true,
      employee: null,
    }
  }

  const { data: membership } = await supabase
    .from('employees')
    .select('*, workspace:workspaces(*)')
    .eq('workspace_id', workspaceId)
    .eq('user_id', userId)
    .in('status', ['active', 'on_leave'])
    .maybeSingle()

  if (!membership?.workspace) return null

  const { workspace: nested, ...employee } = membership as Employee & {
    workspace: WorkspaceConfig
  }

  return {
    workspace: nested,
    isOwner: false,
    employee: employee as Employee,
  }
}

/** List every workspace the user owns or is employed in. */
export async function listWorkspacesForUser(
  supabase: SupabaseClient,
  userId: string
): Promise<WorkspaceMembership[]> {
  const { data, error } = await supabase.rpc('list_user_workspaces')
  if (error || !data) return []

  const memberships = (Array.isArray(data) ? data : []) as WorkspaceMembership[]

  if (memberships.length > 0) return memberships

  // Fallback if migration not applied yet
  const owned = await supabase.from('workspaces').select('id, business_type, user_id').eq('user_id', userId).maybeSingle()
  if (owned.data) {
    const { data: profile } = await supabase.from('profiles').select('business_name, active_workspace_id').eq('id', userId).maybeSingle()
    return [{
      workspace_id: owned.data.id,
      business_type: owned.data.business_type,
      business_name: profile?.business_name ?? owned.data.business_type,
      membership_type: 'owner',
      role_name: 'Owner',
      employee_id: null,
      is_active: true,
    }]
  }

  const { data: employments } = await supabase
    .from('employees')
    .select('id, workspace_id, role_id, workspaces(business_type), roles(name)')
    .eq('user_id', userId)
    .in('status', ['active', 'on_leave'])

  return (employments ?? []).map((e) => {
    const ws = e.workspaces as { business_type?: string } | null
    const role = e.roles as { name?: string } | null
    return {
      workspace_id: e.workspace_id,
      business_type: ws?.business_type ?? 'Organization',
      business_name: ws?.business_type ?? 'Organization',
      membership_type: 'employee' as const,
      role_name: role?.name ?? 'Staff',
      employee_id: e.id,
      is_active: true,
    }
  })
}

/** Resolve workspace using active preference, explicit id, or first available. */
export async function resolveWorkspaceForUser(
  supabase: SupabaseClient,
  userId: string,
  preferredWorkspaceId?: string | null
): Promise<WorkspaceAccess | null> {
  const activeId = preferredWorkspaceId ?? (await getActiveWorkspaceId(supabase, userId))

  if (activeId) {
    const access = await userCanAccessWorkspace(supabase, userId, activeId)
    if (access) return access
  }

  const { data: owned } = await supabase
    .from('workspaces')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  if (owned) {
    return {
      workspace: owned as WorkspaceConfig,
      isOwner: true,
      employee: null,
    }
  }

  const { data: membership } = await supabase
    .from('employees')
    .select('*, workspace:workspaces(*)')
    .eq('user_id', userId)
    .in('status', ['active', 'on_leave'])
    .order('accepted_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!membership?.workspace) return null

  const { workspace: nested, ...employee } = membership as Employee & {
    workspace: WorkspaceConfig
  }

  return {
    workspace: nested,
    isOwner: false,
    employee: employee as Employee,
  }
}

export async function resolveWorkspaceId(
  supabase: SupabaseClient,
  userId: string,
  preferredWorkspaceId?: string | null
): Promise<{ workspaceId: string; isOwner: boolean } | null> {
  const access = await resolveWorkspaceForUser(supabase, userId, preferredWorkspaceId)
  if (!access) return null
  return { workspaceId: access.workspace.id, isOwner: access.isOwner }
}

export async function hasWorkspaceAccess(
  supabase: SupabaseClient,
  userId: string
): Promise<boolean> {
  const memberships = await listWorkspacesForUser(supabase, userId)
  return memberships.length > 0
}
