import { createClient } from '@/lib/supabase/server'
import { generateImportSchema } from '@/lib/import/schema-generator'
import { generateSampleRows, rowsToCsv, rowsToJson, SAMPLE_ROW_COUNT } from '@/lib/import/sample-data-generator'
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
  const format = searchParams.get('format') ?? 'csv'
  const countParam = Number(searchParams.get('count') ?? SAMPLE_ROW_COUNT)
  const rowCount = Number.isFinite(countParam) ? Math.min(Math.max(Math.floor(countParam), 1), 500) : SAMPLE_ROW_COUNT

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
  const headers = schema.fields.map((field) => field.key)
  const rows = generateSampleRows(entityParam, ctx, rowCount)
  const filename = `${moduleParam}-${entityParam}-sample-${rowCount}.${format === 'json' ? 'json' : 'csv'}`

  if (format === 'json') {
    return new NextResponse(rowsToJson(rows), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  }

  return new NextResponse(rowsToCsv(headers, rows), {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
