import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(
  _request: Request,
  context: { params: Promise<{ token: string }> }
) {
  const { token } = await context.params
  const supabase = await createClient()

  const { data, error } = await supabase.rpc('get_invite_by_token', {
    p_token: token,
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!data) {
    return NextResponse.json({ error: 'Invite not found or expired' }, { status: 404 })
  }

  return NextResponse.json(data)
}
