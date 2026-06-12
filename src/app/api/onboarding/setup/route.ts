import { createClient } from '@/lib/supabase/server'
import { validateOnboardingFormInput } from '@/lib/onboarding-form'
import { validateOnboardingConfig } from '@/lib/onboarding-config'
import { buildWorkspaceConfig } from '@/lib/workspace-builder'
import { persistWorkspace } from '@/lib/workspace-service'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const raw = await request.json()
  const formValidation = validateOnboardingFormInput(raw)
  if (!formValidation.success) {
    return NextResponse.json({ error: formValidation.error }, { status: 400 })
  }

  const config = buildWorkspaceConfig(formValidation.data)
  const configValidation = validateOnboardingConfig(config)
  if (!configValidation.success) {
    console.error('Generated workspace config invalid', { userId: user.id, reason: configValidation.error })
    return NextResponse.json({ error: configValidation.error }, { status: 500 })
  }

  const result = await persistWorkspace(supabase, user.id, configValidation.data)
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: result.status })
  }

  return NextResponse.json({
    success: true,
    stage: 'workspace_ready',
    workspaceId: result.workspaceId,
    business_type: configValidation.data.business_type,
    modules: configValidation.data.modules,
    metric_count: configValidation.data.dashboard_metrics.length,
  })
}
