import type { SupabaseClient } from '@supabase/supabase-js'
import { requireServerPermission, resolveServerPermissions, userCan } from '@/lib/rbac/server-permissions'
import type { ModuleKey, PermissionKey } from '@/lib/rbac/types'
import { resolveWorkspaceId } from '@/lib/workspace-access'

type WorkspaceGateResult =
  | { workspaceId: string; isOwner: boolean }
  | { error: string; status: number }

export async function requireWorkspaceAccess(
  supabase: SupabaseClient,
  userId: string,
  options?: { ownerOnly?: boolean }
): Promise<WorkspaceGateResult> {
  const access = await resolveWorkspaceId(supabase, userId)
  if (!access) return { error: 'No workspace', status: 404 }
  if (options?.ownerOnly && !access.isOwner) {
    return { error: 'Forbidden', status: 403 }
  }
  return { workspaceId: access.workspaceId, isOwner: access.isOwner }
}

export async function requirePermission(
  supabase: SupabaseClient,
  userId: string,
  module: ModuleKey,
  permission: PermissionKey
) {
  const result = await requireServerPermission(supabase, userId, module, permission)
  if ('error' in result) return result
  return { ctx: result.ctx, workspaceId: result.ctx.workspace.id }
}

export async function requireAnyPermission(
  supabase: SupabaseClient,
  userId: string,
  checks: { module: ModuleKey; permission: PermissionKey }[]
) {
  const ctx = await resolveServerPermissions(supabase, userId)
  if (!ctx) return { error: 'No workspace' as const, status: 404 as const }

  const allowed = checks.some(({ module, permission }) => userCan(ctx, module, permission))
  if (!allowed) return { error: 'Forbidden' as const, status: 403 as const }

  return { ctx, workspaceId: ctx.workspace.id }
}

export function appBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '')
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  return 'http://localhost:3000'
}
