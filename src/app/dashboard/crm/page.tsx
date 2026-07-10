'use client'

import { useEffect, useMemo, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useWorkspaceStore } from '@/store/workspace'
import { EmptyState } from '@/components/ui/empty-state'
import { Modal } from '@/components/ui/modal'
import { ConfirmDeleteModal } from '@/components/ui/confirm-delete-modal'
import { FilterableDataTable } from '@/components/ui/filterable-data-table'
import { RowActions, actionsColumn } from '@/components/ui/row-actions'
import { UserCircle, Plus } from 'lucide-react'
import { toast } from 'sonner'
import type { Customer } from '@/lib/types'
import { ModuleImport } from '@/components/import/module-import'
import { ThemeSelect } from '@/components/ui/theme-select'
import { ModuleAccessGuard } from '@/components/rbac/module-access-guard'
import { PermissionGate } from '@/components/rbac/permission-gate'
import { usePermissions } from '@/hooks/use-permissions'

export default function CRMPage() {
  const [showAdd, setShowAdd] = useState(false)
  const [editing, setEditing] = useState<Customer | null>(null)
  const [deleting, setDeleting] = useState<Customer | null>(null)
  const { workspace } = useWorkspaceStore()
  const { can } = usePermissions()
  const supabase = createClient()
  const queryClient = useQueryClient()

  const { data: customers = [] } = useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      const { data } = await supabase
        .from('customers')
        .select('*')
        .eq('workspace_id', workspace?.id)
        .order('created_at', { ascending: false })
      return (data || []) as Customer[]
    },
    enabled: !!workspace?.id,
  })

  const addCustomer = useMutation({
    mutationFn: async (customer: Partial<Customer>) => {
      const { error } = await supabase.from('customers').insert({
        ...customer,
        workspace_id: workspace?.id,
      })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] })
      setShowAdd(false)
      toast.success('Customer added')
    },
    onError: () => toast.error('Failed to add customer'),
  })

  const updateCustomer = useMutation({
    mutationFn: async ({ id, ...customer }: Partial<Customer> & { id: string }) => {
      const { error } = await supabase
        .from('customers')
        .update(customer)
        .eq('id', id)
        .eq('workspace_id', workspace?.id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] })
      setEditing(null)
      toast.success('Customer updated')
    },
    onError: () => toast.error('Failed to update customer'),
  })

  const deleteCustomer = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', id)
        .eq('workspace_id', workspace?.id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] })
      setDeleting(null)
      toast.success('Customer deleted')
    },
    onError: () => toast.error('Failed to delete customer'),
  })

  const crmFilters = useMemo(
    () => [
      {
        id: 'status',
        label: 'Status',
        options: [
          { value: 'active', label: 'Active' },
          { value: 'lead', label: 'Lead' },
          { value: 'inactive', label: 'Inactive' },
        ],
      },
    ],
    []
  )

  const columns = [
    { key: 'name', header: 'Name' },
    { key: 'email', header: 'Email' },
    {
      key: 'company',
      header: 'Company',
      cellClass: 'table-cell-secondary',
      render: (item: Customer) => item.company || '—',
    },
    {
      key: 'status',
      header: 'Status',
      render: (item: Customer) => (
        <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full ${
          item.status === 'active' ? 'bg-success/10 text-success' :
          item.status === 'lead' ? 'bg-accent/10 text-accent' :
          'bg-bg-tertiary text-text-tertiary'
        }`}>
          {item.status}
        </span>
      ),
    },
    {
      key: 'total_spent',
      header: 'Total Spent',
      render: (item: Customer) => (
        <span className="table-cell-amount text-text-primary">
          ${Number(item.total_spent).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      ),
    },
    actionsColumn<Customer>((item) =>
      can('crm', 'edit') || can('crm', 'delete') ? (
        <RowActions
          onEdit={can('crm', 'edit') ? () => setEditing(item) : undefined}
          onDelete={can('crm', 'delete') ? () => setDeleting(item) : undefined}
          editLabel={`Edit ${item.name}`}
          deleteLabel={`Delete ${item.name}`}
        />
      ) : null
    ),
  ]

  return (
    <ModuleAccessGuard module="crm" label="CRM">
    <div className="max-w-7xl mx-auto">
      <div className="page-header">
        <div>
          <h1 className="page-title">CRM</h1>
          <p className="page-subtitle">Manage customer relationships and track interactions</p>
        </div>
        <div className="page-header-actions">
          <PermissionGate module="crm" permission="import">
            <ModuleImport module="crm" entity="customers" />
          </PermissionGate>
          <PermissionGate module="crm" permission="create">
            <button type="button" onClick={() => setShowAdd(true)} className="btn-primary">
              <Plus size={16} />
              Add Customer
            </button>
          </PermissionGate>
        </div>
      </div>

      {customers.length === 0 ? (
        <EmptyState
          icon={UserCircle}
          title="No customers yet"
          description="Add your first customer to start tracking relationships, interactions, and revenue per customer."
          action={{ label: 'Add first customer', onClick: () => setShowAdd(true) }}
        />
      ) : (
        <FilterableDataTable
          columns={columns}
          data={customers}
          searchPlaceholder="Search by name, email, company, or phone…"
          searchKeys={['name', 'email', 'company', 'phone']}
          filters={crmFilters}
          pageSize={10}
          rowKey={(item) => item.id}
          emptyFilteredMessage="No customers match your search or filters."
        />
      )}

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add Customer">
        <CustomerForm onSubmit={(data) => addCustomer.mutate(data)} loading={addCustomer.isPending} />
      </Modal>

      <Modal open={!!editing} onClose={() => setEditing(null)} title="Edit Customer">
        {editing && (
          <CustomerForm
            key={editing.id}
            initial={editing}
            onSubmit={(data) => updateCustomer.mutate({ id: editing.id, ...data })}
            loading={updateCustomer.isPending}
            submitLabel="Save changes"
          />
        )}
      </Modal>

      <ConfirmDeleteModal
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleting && deleteCustomer.mutate(deleting.id)}
        title="Delete customer"
        description="This will permanently remove the customer record. This action cannot be undone."
        entityName={deleting?.name}
        loading={deleteCustomer.isPending}
      />
    </div>
    </ModuleAccessGuard>
  )
}

function CustomerForm({
  initial,
  onSubmit,
  loading,
  submitLabel = 'Add Customer',
}: {
  initial?: Customer
  onSubmit: (data: Partial<Customer>) => void
  loading: boolean
  submitLabel?: string
}) {
  const [form, setForm] = useState({
    name: initial?.name ?? '',
    email: initial?.email ?? '',
    phone: initial?.phone ?? '',
    company: initial?.company ?? '',
    status: (initial?.status ?? 'active') as 'active' | 'inactive' | 'lead',
    notes: initial?.notes ?? '',
    total_spent: initial?.total_spent != null ? String(initial.total_spent) : '0',
  })

  useEffect(() => {
    if (!initial) return
    setForm({
      name: initial.name,
      email: initial.email,
      phone: initial.phone ?? '',
      company: initial.company ?? '',
      status: initial.status,
      notes: initial.notes ?? '',
      total_spent: String(initial.total_spent ?? 0),
    })
  }, [initial])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSubmit({
      ...form,
      total_spent: Number(form.total_spent) || 0,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-1.5">Name</label>
        <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="form-field" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1.5">Email</label>
          <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="form-field" />
        </div>
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1.5">Phone</label>
          <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="form-field" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1.5">Company</label>
          <input type="text" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} className="form-field" />
        </div>
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1.5">Status</label>
          <ThemeSelect
            variant="form"
            value={form.status}
            onChange={(status) => setForm({ ...form, status: status as 'active' | 'inactive' | 'lead' })}
            options={[
              { value: 'active', label: 'Active' },
              { value: 'lead', label: 'Lead' },
              { value: 'inactive', label: 'Inactive' },
            ]}
            aria-label="Status"
          />
        </div>
      </div>
      {initial && (
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1.5">Total spent</label>
          <input type="number" min="0" step="0.01" value={form.total_spent} onChange={(e) => setForm({ ...form, total_spent: e.target.value })} className="form-field" />
        </div>
      )}
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-1.5">Notes</label>
        <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="form-field resize-none" rows={3} />
      </div>
      <button type="submit" disabled={loading} className="form-submit">
        {loading ? 'Saving...' : submitLabel}
      </button>
    </form>
  )
}
