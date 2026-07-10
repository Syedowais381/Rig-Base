'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useWorkspaceStore } from '@/store/workspace'
import { EmptyState } from '@/components/ui/empty-state'
import { Modal } from '@/components/ui/modal'
import { ConfirmDeleteModal } from '@/components/ui/confirm-delete-modal'
import { FilterableDataTable } from '@/components/ui/filterable-data-table'
import { RowActions, actionsColumn } from '@/components/ui/row-actions'
import { matchesSearch } from '@/hooks/use-table-controls'
import { DollarSign, Plus, TrendingUp, TrendingDown } from 'lucide-react'
import { toast } from 'sonner'
import type { Transaction } from '@/lib/types'
import { ModuleImport } from '@/components/import/module-import'
import { StatMoney } from '@/components/ui/stat-money'
import { ModuleAccessGuard } from '@/components/rbac/module-access-guard'
import { PermissionGate } from '@/components/rbac/permission-gate'
import { usePermissions } from '@/hooks/use-permissions'

export default function FinancePage() {
  const [showAdd, setShowAdd] = useState(false)
  const [editing, setEditing] = useState<Transaction | null>(null)
  const [deleting, setDeleting] = useState<Transaction | null>(null)
  const { workspace } = useWorkspaceStore()
  const { can } = usePermissions()
  const supabase = createClient()
  const queryClient = useQueryClient()

  const { data: transactions = [] } = useQuery({
    queryKey: ['transactions'],
    queryFn: async () => {
      const { data } = await supabase
        .from('transactions')
        .select('*')
        .eq('workspace_id', workspace?.id)
        .order('date', { ascending: false })
      return (data || []) as Transaction[]
    },
    enabled: !!workspace?.id,
  })

  const addTransaction = useMutation({
    mutationFn: async (transaction: Partial<Transaction>) => {
      const { error } = await supabase.from('transactions').insert({
        ...transaction,
        workspace_id: workspace?.id,
      })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] })
      setShowAdd(false)
      toast.success('Transaction added')
    },
    onError: () => toast.error('Failed to add transaction'),
  })

  const updateTransaction = useMutation({
    mutationFn: async ({ id, ...transaction }: Partial<Transaction> & { id: string }) => {
      const { error } = await supabase
        .from('transactions')
        .update(transaction)
        .eq('id', id)
        .eq('workspace_id', workspace?.id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] })
      setEditing(null)
      toast.success('Transaction updated')
    },
    onError: () => toast.error('Failed to update transaction'),
  })

  const deleteTransaction = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id)
        .eq('workspace_id', workspace?.id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] })
      setDeleting(null)
      toast.success('Transaction deleted')
    },
    onError: () => toast.error('Failed to delete transaction'),
  })

  const financeFilters = useMemo(() => {
    const categories = [
      ...new Set([
        ...(workspace?.departments ?? []),
        ...transactions.map((t) => t.category),
      ]),
    ].filter(Boolean)

    return [
      {
        id: 'type',
        label: 'Type',
        options: [
          { value: 'revenue', label: 'Revenue' },
          { value: 'expense', label: 'Expense' },
        ],
      },
      {
        id: 'category',
        label: 'Category',
        options: categories.map((c) => ({ value: c, label: c })),
      },
    ]
  }, [workspace?.departments, transactions])

  const filterTransactions = useCallback(
    (transaction: Transaction, ctx: { search: string; filters: Record<string, string> }) => {
      const haystack = [transaction.description, transaction.category, transaction.reference, transaction.type].join(' ')
      if (!matchesSearch(haystack, ctx.search)) return false
      if (ctx.filters.type !== 'all' && transaction.type !== ctx.filters.type) return false
      if (ctx.filters.category !== 'all' && transaction.category !== ctx.filters.category) return false
      return true
    },
    []
  )

  const totalRevenue = transactions
    .filter((t) => t.type === 'revenue')
    .reduce((sum, t) => sum + Number(t.amount), 0)

  const totalExpenses = transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + Number(t.amount), 0)

  const columns = [
    {
      key: 'type',
      header: 'Type',
      render: (item: Transaction) => (
        <span className={item.type === 'revenue' ? 'badge-revenue' : 'badge-expense'}>
          {item.type === 'revenue' ? <TrendingUp size={9} strokeWidth={2.5} /> : <TrendingDown size={9} strokeWidth={2.5} />}
          {item.type}
        </span>
      ),
    },
    {
      key: 'description',
      header: 'Description',
      render: (item: Transaction) => (
        <span className="table-cell-primary">{item.description}</span>
      ),
    },
    {
      key: 'category',
      header: 'Category',
      cellClass: 'table-cell-secondary',
      render: (item: Transaction) => item.category,
    },
    {
      key: 'amount',
      header: 'Amount',
      render: (item: Transaction) => (
        <span className={`table-cell-amount ${item.type === 'revenue' ? 'text-revenue' : 'text-danger'}`}>
          {item.type === 'revenue' ? '+' : '-'}${Number(item.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      key: 'date',
      header: 'Date',
      cellClass: 'table-cell-date',
      render: (item: Transaction) => item.date,
    },
    actionsColumn<Transaction>((item) =>
      can('finance', 'edit') || can('finance', 'delete') ? (
        <RowActions
          onEdit={can('finance', 'edit') ? () => setEditing(item) : undefined}
          onDelete={can('finance', 'delete') ? () => setDeleting(item) : undefined}
          editLabel="Edit transaction"
          deleteLabel="Delete transaction"
        />
      ) : null
    ),
  ]

  return (
    <ModuleAccessGuard module="finance" label="Finance">
    <div className="max-w-7xl mx-auto">
      <div className="page-header">
        <div>
          <h1 className="page-title">Finance</h1>
          <p className="page-subtitle">Track revenue, expenses, and cash flow</p>
        </div>
        <div className="page-header-actions">
          <PermissionGate module="finance" permission="import">
            <ModuleImport module="finance" entity="transactions" />
          </PermissionGate>
          <PermissionGate module="finance" permission="create">
            <button type="button" onClick={() => setShowAdd(true)} className="btn-primary">
              <Plus size={16} />
              Add Transaction
            </button>
          </PermissionGate>
        </div>
      </div>

      <div className="summary-row">
        <div className="summary-stat">
          <p className="stat-label summary-stat-label">
            <span className="summary-stat-label-icon">
              <TrendingUp size={12} />
            </span>
            Total Revenue
          </p>
          <StatMoney value={totalRevenue} className="text-revenue" />
        </div>
        <div className="summary-stat">
          <p className="stat-label summary-stat-label">
            <span className="summary-stat-label-icon">
              <TrendingDown size={12} />
            </span>
            Total Expenses
          </p>
          <StatMoney value={totalExpenses} className="text-danger" />
        </div>
        <div className="summary-stat">
          <p className="stat-label summary-stat-label">
            <span className="summary-stat-label-icon" aria-hidden="true" />
            Net Profit
          </p>
          <StatMoney
            value={totalRevenue - totalExpenses}
            className={totalRevenue - totalExpenses >= 0 ? 'text-text-primary' : 'text-danger'}
          />
        </div>
      </div>

      {transactions.length === 0 ? (
        <EmptyState
          icon={DollarSign}
          title="No transactions yet"
          description="Record your first revenue or expense to start tracking your business finances. All dashboard financial metrics will reflect real data."
          action={{ label: 'Add first transaction', onClick: () => setShowAdd(true) }}
        />
      ) : (
        <FilterableDataTable
          columns={columns}
          data={transactions}
          searchPlaceholder="Search description, category, or reference…"
          filters={financeFilters}
          customFilter={filterTransactions}
          pageSize={10}
          rowKey={(item) => item.id}
          emptyFilteredMessage="No transactions match your search or filters."
        />
      )}

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add Transaction">
        <TransactionForm onSubmit={(data) => addTransaction.mutate(data)} loading={addTransaction.isPending} />
      </Modal>

      <Modal open={!!editing} onClose={() => setEditing(null)} title="Edit Transaction">
        {editing && (
          <TransactionForm
            key={editing.id}
            initial={editing}
            onSubmit={(data) => updateTransaction.mutate({ id: editing.id, ...data })}
            loading={updateTransaction.isPending}
            submitLabel="Save changes"
          />
        )}
      </Modal>

      <ConfirmDeleteModal
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleting && deleteTransaction.mutate(deleting.id)}
        title="Delete transaction"
        description="This will permanently remove the transaction from your ledger."
        entityName={deleting?.description}
        loading={deleteTransaction.isPending}
      />
    </div>
    </ModuleAccessGuard>
  )
}

function TransactionForm({
  initial,
  onSubmit,
  loading,
  submitLabel = 'Add Transaction',
}: {
  initial?: Transaction
  onSubmit: (data: Partial<Transaction>) => void
  loading: boolean
  submitLabel?: string
}) {
  const [form, setForm] = useState({
    type: (initial?.type ?? 'revenue') as 'revenue' | 'expense',
    description: initial?.description ?? '',
    category: initial?.category ?? '',
    amount: initial?.amount != null ? String(initial.amount) : '',
    date: initial?.date ?? new Date().toISOString().split('T')[0],
    reference: initial?.reference ?? '',
  })

  useEffect(() => {
    if (!initial) return
    setForm({
      type: initial.type,
      description: initial.description,
      category: initial.category,
      amount: String(initial.amount),
      date: initial.date,
      reference: initial.reference ?? '',
    })
  }, [initial])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSubmit({
      ...form,
      amount: Number(form.amount),
      reference: form.reference || null,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-1.5">Type</label>
        <div className="grid grid-cols-2 gap-2">
          <button type="button" onClick={() => setForm({ ...form, type: 'revenue' })} className={`py-2.5 text-sm font-medium border transition-colors ${form.type === 'revenue' ? 'bg-success/10 border-success/30 text-success' : 'bg-bg-tertiary border-border-primary text-text-secondary hover:bg-bg-elevated'}`}>
            Revenue
          </button>
          <button type="button" onClick={() => setForm({ ...form, type: 'expense' })} className={`py-2.5 text-sm font-medium border transition-colors ${form.type === 'expense' ? 'bg-danger/10 border-danger/30 text-danger' : 'bg-bg-tertiary border-border-primary text-text-secondary hover:bg-bg-elevated'}`}>
            Expense
          </button>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-1.5">Description</label>
        <input type="text" required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="form-field" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1.5">Category</label>
          <input type="text" required value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="form-field" placeholder="e.g. Sales, Rent" />
        </div>
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1.5">Amount</label>
          <input type="number" required step="0.01" min="0" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className="form-field" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1.5">Date</label>
          <input type="date" required value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="form-field" />
        </div>
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1.5">Reference</label>
          <input type="text" value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} className="form-field" placeholder="Invoice #, etc." />
        </div>
      </div>
        <button type="submit" disabled={loading} className="form-submit">
        {loading ? 'Saving...' : submitLabel}
      </button>
    </form>
  )
}
