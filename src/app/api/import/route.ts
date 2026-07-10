import { createClient } from '@/lib/supabase/server'
import { executeImport } from '@/lib/import/execute'
import { parseImportFile } from '@/lib/import/parse'
import { generateImportSchema } from '@/lib/import/schema-generator'
import { isImportEntity, isImportModule, isValidImportTarget } from '@/lib/import/types'
import { validateImportRows } from '@/lib/import/validate'
import { loadWorkspaceImportContext } from '@/lib/import/workspace-context'
import { requirePermission } from '@/lib/api/workspace-context'
import type { ModuleKey } from '@/lib/rbac/types'
import { NextResponse } from 'next/server'

const IMPORT_MODULE_MAP: Record<string, ModuleKey> = {
  hr: 'hr',
  inventory: 'inventory',
  finance: 'finance',
  supply_chain: 'supply_chain',
  crm: 'crm',
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const formData = await request.formData()
  const moduleParam = String(formData.get('module') ?? '')
  const entityParam = String(formData.get('entity') ?? '')
  const formatParam = String(formData.get('format') ?? 'csv')
  const file = formData.get('file')

  if (!isImportModule(moduleParam) || !isImportEntity(entityParam)) {
    return NextResponse.json({ error: 'Invalid module or entity.' }, { status: 400 })
  }

  if (!isValidImportTarget(moduleParam, entityParam)) {
    return NextResponse.json({ error: 'Entity does not belong to module.' }, { status: 400 })
  }

  if (formatParam !== 'csv' && formatParam !== 'json') {
    return NextResponse.json({ error: 'Format must be csv or json.' }, { status: 400 })
  }

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'File is required.' }, { status: 400 })
  }

  const ctx = await loadWorkspaceImportContext(supabase, user.id)
  if (!ctx) {
    return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })
  }

  const moduleKey = IMPORT_MODULE_MAP[moduleParam]
  if (moduleKey) {
    const perm = await requirePermission(supabase, user.id, moduleKey, 'import')
    if ('error' in perm) {
      return NextResponse.json({ error: perm.error }, { status: perm.status })
    }
  }

  // Refresh supplier map for PO imports
  if (entityParam === 'purchase_orders') {
    const { data: suppliers } = await supabase.from('suppliers').select('id, name').eq('workspace_id', ctx.workspaceId)
    ctx.supplierNames = []
    ctx.supplierNameToId = {}
    for (const supplier of suppliers ?? []) {
      ctx.supplierNames.push(supplier.name)
      ctx.supplierNameToId[supplier.name.trim().toLowerCase()] = supplier.id
    }
  }

  const schema = generateImportSchema(moduleParam, entityParam, ctx)
  const content = await file.text()

  let rows: Record<string, string>[]
  try {
    rows = parseImportFile(content, formatParam)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to parse file.' },
      { status: 400 }
    )
  }

  const { validRows, errors: validationErrors } = validateImportRows(rows, schema)
  if (validRows.length === 0) {
    return NextResponse.json({
      success: false,
      imported: 0,
      failed: validationErrors.length,
      errors: validationErrors,
    })
  }

  const result = await executeImport(supabase, moduleParam, entityParam, ctx, schema, validRows)

  return NextResponse.json({
    ...result,
    success: result.errors.length === 0,
    failed: result.errors.length + validationErrors.length,
    errors: [...validationErrors, ...result.errors],
  })
}
