import type { SupabaseClient } from '@supabase/supabase-js'
import type { WorkspaceConfig } from '@/lib/types'
import type { WorkspaceImportContext } from '@/lib/import/types'
import { resolveWorkspaceForUser } from '@/lib/workspace-access'

export async function loadWorkspaceImportContext(
  supabase: SupabaseClient,
  userId: string
): Promise<WorkspaceImportContext | null> {
  const access = await resolveWorkspaceForUser(supabase, userId)
  if (!access) return null

  const ws = access.workspace as WorkspaceConfig

  const { data: roles } = await supabase.from('roles').select('id, name').eq('workspace_id', ws.id)
  const roleNameToId: Record<string, string> = {}
  const roleNames: string[] = []
  for (const role of roles ?? []) {
    roleNames.push(role.name)
    roleNameToId[role.name.trim().toLowerCase()] = role.id
  }

  const { data: suppliers } = await supabase.from('suppliers').select('id, name').eq('workspace_id', ws.id)
  const supplierNameToId: Record<string, string> = {}
  const supplierNames: string[] = []
  for (const supplier of suppliers ?? []) {
    supplierNames.push(supplier.name)
    supplierNameToId[supplier.name.trim().toLowerCase()] = supplier.id
  }

  const metricCategories = (ws.dashboard_metrics ?? [])
    .filter((m) => ['finance', 'revenue', 'operations'].includes(m.category))
    .map((m) => m.name)

  const financeCategories = [
    ...new Set([
      'Sales',
      'Payroll',
      'Rent',
      'Supplies',
      'Marketing',
      ...(ws.departments ?? []),
      ...(ws.product_categories ?? []),
      ...metricCategories,
    ]),
  ]

  return {
    workspaceId: ws.id,
    departments: ws.departments ?? [],
    productCategories: ws.product_categories ?? [],
    serviceTypes: ws.service_types ?? [],
    shifts: ws.shifts,
    roleNames,
    roleNameToId,
    supplierNames,
    supplierNameToId,
    financeCategories,
    businessType: ws.business_type,
  }
}
