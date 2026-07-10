import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json().catch(() => ({}))
  const token = body.token as string | undefined

  if (!token) {
    return NextResponse.json({ error: 'Invite token is required' }, { status: 400 })
  }

  const { data, error } = await supabase.rpc('accept_employee_invite', {
    p_token: token,
  })

  if (error) {
    const message = error.message.includes('Invalid or expired')
      ? 'This invite is invalid or has already been used'
      : error.message.includes('already own')
        ? 'You already own this organization'
        : error.message.includes('already a member')
          ? 'You are already a member of this organization'
          : error.message
    return NextResponse.json({ error: message }, { status: 400 })
  }

  return NextResponse.json({ success: true, ...data })
}
