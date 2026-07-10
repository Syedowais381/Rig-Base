import type { ChecklistItem, WorkspaceConfig } from '@/lib/types'

export type SetupDataCounts = {
  employees: number
  products: number
  transactions: number
  suppliers: number
  customers: number
  purchaseOrders: number
}

export type ResolvedChecklistItem = ChecklistItem & { completed: boolean }

function matchesAny(text: string, patterns: string[]): boolean {
  return patterns.some((pattern) => text.includes(pattern))
}

export function isChecklistTaskComplete(
  task: ChecklistItem,
  counts: SetupDataCounts,
  workspace: Pick<WorkspaceConfig, 'shifts'>
): boolean {
  const id = task.id.toLowerCase()
  const taskModule = task.module.toLowerCase()
  const title = task.title.toLowerCase()

  if (matchesAny(id, ['review_dashboard', 'review_metrics']) || matchesAny(title, ['review your dashboard'])) {
    return true
  }

  if (
    matchesAny(id, ['employee', 'staff', 'team']) ||
    matchesAny(title, ['employee', 'staff']) ||
    (taskModule === 'hr' && matchesAny(id, ['add', 'setup', 'configure']))
  ) {
    if (matchesAny(id, ['shift']) || matchesAny(title, ['shift'])) {
      return !!(workspace.shifts && workspace.shifts.length > 0)
    }
    return counts.employees > 0
  }

  if (
    matchesAny(id, ['inventory', 'stock', 'menu', 'product']) ||
    matchesAny(title, ['inventory', 'stock', 'menu']) ||
    taskModule === 'inventory'
  ) {
    return counts.products > 0
  }

  if (
    matchesAny(id, ['finance', 'opening', 'balance', 'expense', 'revenue']) ||
    matchesAny(title, ['opening', 'balance', 'finance']) ||
    (taskModule === 'finance' && !matchesAny(id, ['review']))
  ) {
    return counts.transactions > 0
  }

  if (
    matchesAny(id, ['supplier', 'vendor', 'procurement']) ||
    matchesAny(title, ['supplier', 'vendor', 'procurement']) ||
    taskModule === 'supply_chain'
  ) {
    if (matchesAny(id, ['order', 'purchase']) || matchesAny(title, ['purchase order'])) {
      return counts.purchaseOrders > 0
    }
    return counts.suppliers > 0
  }

  if (
    matchesAny(id, ['customer', 'crm', 'loyalty', 'contact']) ||
    matchesAny(title, ['customer', 'loyalty', 'contact']) ||
    taskModule === 'crm'
  ) {
    return counts.customers > 0
  }

  if (matchesAny(id, ['shift']) || matchesAny(title, ['shift'])) {
    return !!(workspace.shifts && workspace.shifts.length > 0)
  }

  return false
}

export function resolveSetupChecklist(
  checklist: ChecklistItem[] | undefined,
  counts: SetupDataCounts,
  workspace: Pick<WorkspaceConfig, 'shifts'>
): ResolvedChecklistItem[] {
  if (!checklist?.length) return []

  return checklist
    .map((task) => ({
      ...task,
      completed: task.completed ?? isChecklistTaskComplete(task, counts, workspace),
    }))
    .sort((a, b) => a.priority - b.priority)
}

export function getSetupProgress(items: ResolvedChecklistItem[]) {
  const completed = items.filter((item) => item.completed).length
  const total = items.length
  const percent = total === 0 ? 100 : Math.round((completed / total) * 100)

  return { completed, total, percent, isComplete: total > 0 && completed >= total }
}
