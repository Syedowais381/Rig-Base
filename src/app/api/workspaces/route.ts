import { createClient } from '@/lib/supabase/server'
import { listWorkspacesForUser, resolveWorkspaceForUser } from '@/lib/workspace-access'
import { NextResponse } from 'next/server'

/** List all organizations the user can access. */
export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const memberships = await listWorkspacesForUser(supabase, user.id)
  return NextResponse.json(memberships)
}

/** Switch the active organization workspace. */
export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json().catch(() => ({}))
  const workspaceId = body.workspaceId as string | undefined

  if (!workspaceId) {
    return NextResponse.json({ error: 'workspaceId is required' }, { status: 400 })
  }

  const { data, error } = await supabase.rpc('set_active_workspace', {
    p_workspace_id: workspaceId,
  })

  if (error) {
    const message = error.message.includes('do not have access')
      ? 'You do not have access to this organization'
      : error.message
    return NextResponse.json({ error: message }, { status: 403 })
  }

  const access = await resolveWorkspaceForUser(supabase, user.id, workspaceId)
  if (!access) {
    return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })
  }

  return NextResponse.json({
    success: true,
    workspace: access.workspace,
    isOwner: access.isOwner,
    ...data,
  })
}
