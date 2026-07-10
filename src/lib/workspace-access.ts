import type { SupabaseClient } from '@supabase/supabase-js'
import type { Employee, WorkspaceConfig } from '@/lib/types'

export type WorkspaceAccess = {
  workspace: WorkspaceConfig
  isOwner: boolean
  employee: Employee | null
}

/** Resolve the workspace for an authenticated user (owner or linked employee). */
export async function resolveWorkspaceForUser(
  supabase: SupabaseClient,
  userId: string
): Promise<WorkspaceAccess | null> {
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

/** Returns workspace id or null — for API routes that only need the id. */
export async function resolveWorkspaceId(
  supabase: SupabaseClient,
  userId: string
): Promise<{ workspaceId: string; isOwner: boolean } | null> {
  const access = await resolveWorkspaceForUser(supabase, userId)
  if (!access) return null
  return { workspaceId: access.workspace.id, isOwner: access.isOwner }
}

/** True when user owns a workspace or is an active linked employee. */
export async function hasWorkspaceAccess(
  supabase: SupabaseClient,
  userId: string
): Promise<boolean> {
  const access = await resolveWorkspaceForUser(supabase, userId)
  return access !== null
}
