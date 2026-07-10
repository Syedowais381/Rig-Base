import { createClient } from '@/lib/supabase/server'
import { requireAnyPermission } from '@/lib/api/workspace-context'
import { normalizeRolePermissions } from '@/lib/rbac/permissions'
import { syncRoleModulePermissions } from '@/lib/rbac/sync-role-permissions'
import { NextResponse } from 'next/server'

type RouteContext = { params: Promise<{ id: string }> }

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const access = await requireAnyPermission(supabase, user.id, [
    { module: 'hr', permission: 'manage' },
    { module: 'settings', permission: 'manage' },
  ])
  if ('error' in access) return NextResponse.json({ error: access.error }, { status: access.status })

  const { data: role } = await supabase
    .from('roles')
    .select('*')
    .eq('id', id)
    .eq('workspace_id', access.workspaceId)
    .single()

  if (!role) return NextResponse.json({ error: 'Role not found' }, { status: 404 })

  if (role.name === 'Owner') {
    return NextResponse.json({ error: 'Owner permissions cannot be modified' }, { status: 403 })
  }

  const body = await request.json()
  const permissions = normalizeRolePermissions(body.permissions)

  const { data: updated, error } = await supabase
    .from('roles')
    .update({
      permissions,
      description: body.description ?? role.description,
    })
    .eq('id', id)
    .select('*')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  try {
    await syncRoleModulePermissions(supabase, id, permissions)
  } catch (syncError) {
    const message = syncError instanceof Error ? syncError.message : 'Failed to sync permissions'
    return NextResponse.json({ error: message }, { status: 500 })
  }

  return NextResponse.json(updated)
}
