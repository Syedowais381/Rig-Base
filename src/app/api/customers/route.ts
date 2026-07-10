import { createClient } from '@/lib/supabase/server'
import { requirePermission } from '@/lib/api/workspace-context'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const access = await requirePermission(supabase, user.id, 'crm', 'view')
  if ('error' in access) return NextResponse.json({ error: access.error }, { status: access.status })

  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('workspace_id', access.workspaceId)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const access = await requirePermission(supabase, user.id, 'crm', 'create')
  if ('error' in access) return NextResponse.json({ error: access.error }, { status: access.status })

  const body = await request.json()
  const { error } = await supabase.from('customers').insert({
    ...body,
    workspace_id: access.workspaceId,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
