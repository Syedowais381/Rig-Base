import { createClient } from '@/lib/supabase/server'
import { requireAnyPermission, requireWorkspaceAccess } from '@/lib/api/workspace-context'
import { normalizeRolePermissions } from '@/lib/rbac/permissions'
import { syncRoleModulePermissions } from '@/lib/rbac/sync-role-permissions'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const access = await requireWorkspaceAccess(supabase, user.id)
  if ('error' in access) return NextResponse.json({ error: access.error }, { status: access.status })

  const { data, error } = await supabase
    .from('roles')
    .select('*')
    .eq('workspace_id', access.workspaceId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const access = await requireAnyPermission(supabase, user.id, [
    { module: 'hr', permission: 'manage' },
    { module: 'settings', permission: 'manage' },
  ])
  if ('error' in access) return NextResponse.json({ error: access.error }, { status: access.status })

  const body = await request.json()
  const permissions = normalizeRolePermissions(body.permissions)

  const { data: inserted, error } = await supabase
    .from('roles')
    .insert({
      workspace_id: access.workspaceId,
      name: body.name,
      description: body.description ?? null,
      is_system: body.is_system ?? false,
      permissions,
    })
    .select('*')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (inserted) {
    try {
      await syncRoleModulePermissions(supabase, inserted.id, permissions)
    } catch {
      // Junction sync is best-effort if migration not applied yet
    }
  }

  return NextResponse.json(inserted)
}
