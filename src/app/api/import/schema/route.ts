import { createClient } from '@/lib/supabase/server'
import { generateImportSchema } from '@/lib/import/schema-generator'
import { isImportEntity, isImportModule, isValidImportTarget } from '@/lib/import/types'
import { loadWorkspaceImportContext } from '@/lib/import/workspace-context'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const moduleParam = searchParams.get('module') ?? ''
  const entityParam = searchParams.get('entity') ?? ''

  if (!isImportModule(moduleParam) || !isImportEntity(entityParam)) {
    return NextResponse.json({ error: 'Invalid module or entity.' }, { status: 400 })
  }

  if (!isValidImportTarget(moduleParam, entityParam)) {
    return NextResponse.json({ error: 'Entity does not belong to module.' }, { status: 400 })
  }

  const ctx = await loadWorkspaceImportContext(supabase, user.id)
  if (!ctx) {
    return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })
  }

  const schema = generateImportSchema(moduleParam, entityParam, ctx)
  return NextResponse.json(schema)
}
