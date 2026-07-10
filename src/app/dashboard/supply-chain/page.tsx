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
import { Truck, Plus, Building2, FileText } from 'lucide-react'
import { toast } from 'sonner'
import type { Supplier, PurchaseOrder } from '@/lib/types'
import { ModuleImport } from '@/components/import/module-import'
import { ThemeSelect } from '@/components/ui/theme-select'
import { ModuleAccessGuard } from '@/components/rbac/module-access-guard'
import { PermissionGate } from '@/components/rbac/permission-gate'
import { usePermissions } from '@/hooks/use-permissions'

export default function SupplyChainPage() {
  const [showAddSupplier, setShowAddSupplier] = useState(false)
  const [showAddPO, setShowAddPO] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null)
  const [deletingSupplier, setDeletingSupplier] = useState<Supplier | null>(null)
  const [editingPO, setEditingPO] = useState<PurchaseOrder | null>(null)
  const [deletingPO, setDeletingPO] = useState<PurchaseOrder | null>(null)
  const [activeTab, setActiveTab] = useState<'suppliers' | 'orders'>('suppliers')
  const { workspace } = useWorkspaceStore()
  const { can } = usePermissions()
  const supabase = createClient()
  const queryClient = useQueryClient()

  const { data: suppliers = [] } = useQuery({
    queryKey: ['suppliers'],
    queryFn: async () => {
      const { data } = await supabase
        .from('suppliers')
        .select('*')
        .eq('workspace_id', workspace?.id)
        .order('created_at', { ascending: false })
      return (data || []) as Supplier[]
    },
    enabled: !!workspace?.id,
  })

  const { data: purchaseOrders = [] } = useQuery({
    queryKey: ['purchase-orders'],
    queryFn: async () => {
      const { data } = await supabase
        .from('purchase_orders')
        .select('*')
        .eq('workspace_id', workspace?.id)
        .order('created_at', { ascending: false })
      return (data || []) as PurchaseOrder[]
    },
    enabled: !!workspace?.id,
  })

  const addSupplier = useMutation({
    mutationFn: async (supplier: Partial<Supplier>) => {
      const { error } = await supabase.from('suppliers').insert({
        ...supplier,
        workspace_id: workspace?.id,
      })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] })
      setShowAddSupplier(false)
      toast.success('Supplier added')
    },
    onError: () => toast.error('Failed to add supplier'),
  })

  const updateSupplier = useMutation({
    mutationFn: async ({ id, ...supplier }: Partial<Supplier> & { id: string }) => {
      const { error } = await supabase
        .from('suppliers')
        .update(supplier)
        .eq('id', id)
        .eq('workspace_id', workspace?.id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] })
      setEditingSupplier(null)
      toast.success('Supplier updated')
    },
    onError: () => toast.error('Failed to update supplier'),
  })

  const deleteSupplier = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('suppliers')
        .delete()
        .eq('id', id)
        .eq('workspace_id', workspace?.id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] })
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] })
      setDeletingSupplier(null)
      toast.success('Supplier deleted')
    },
    onError: () => toast.error('Failed to delete supplier'),
  })

  const addPurchaseOrder = useMutation({
    mutationFn: async (po: Partial<PurchaseOrder>) => {
      const { error } = await supabase.from('purchase_orders').insert({
        ...po,
        workspace_id: workspace?.id,
      })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] })
      setShowAddPO(false)
      toast.success('Purchase order created')
    },
    onError: () => toast.error('Failed to create purchase order'),
  })

  const updatePurchaseOrder = useMutation({
    mutationFn: async ({ id, ...po }: Partial<PurchaseOrder> & { id: string }) => {
      const { error } = await supabase
        .from('purchase_orders')
        .update(po)
        .eq('id', id)
        .eq('workspace_id', workspace?.id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] })
      setEditingPO(null)
      toast.success('Purchase order updated')
    },
    onError: () => toast.error('Failed to update purchase order'),
  })

  const deletePurchaseOrder = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('purchase_orders')
        .delete()
        .eq('id', id)
        .eq('workspace_id', workspace?.id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] })
      setDeletingPO(null)
      toast.success('Purchase order deleted')
    },
    onError: () => toast.error('Failed to delete purchase order'),
  })

  const supplierFilters = useMemo(
    () => [
      {
        id: 'status',
        label: 'Status',
        options: [
          { value: 'active', label: 'Active' },
          { value: 'inactive', label: 'Inactive' },
        ],
      },
    ],
    []
  )

  const orderFilters = useMemo(
    () => [
      {
        id: 'status',
        label: 'Status',
        options: [
          { value: 'pending', label: 'Pending' },
          { value: 'approved', label: 'Approved' },
          { value: 'shipped', label: 'Shipped' },
          { value: 'delivered', label: 'Delivered' },
          { value: 'cancelled', label: 'Cancelled' },
        ],
      },
      {
        id: 'supplier_id',
        label: 'Supplier',
        options: suppliers.map((s) => ({ value: s.id, label: s.name })),
      },
    ],
    [suppliers]
  )

  const filterOrders = useCallback(
    (order: PurchaseOrder, ctx: { search: string; filters: Record<string, string> }) => {
      const supplierName = suppliers.find((s) => s.id === order.supplier_id)?.name ?? ''
      const haystack = [order.order_number, supplierName, order.status, order.order_date].join(' ')
      if (!matchesSearch(haystack, ctx.search)) return false
      if (ctx.filters.status !== 'all' && order.status !== ctx.filters.status) return false
      if (ctx.filters.supplier_id !== 'all' && order.supplier_id !== ctx.filters.supplier_id) return false
      return true
    },
    [suppliers]
  )

  const linkedOrdersCount = deletingSupplier
    ? purchaseOrders.filter((po) => po.supplier_id === deletingSupplier.id).length
    : 0

  const supplierColumns = [
    { key: 'name', header: 'Company' },
    { key: 'contact_person', header: 'Contact', cellClass: 'table-cell-secondary' },
    { key: 'email', header: 'Email', cellClass: 'table-cell-secondary' },
    { key: 'phone', header: 'Phone', cellClass: 'table-cell-secondary' },
    {
      key: 'status',
      header: 'Status',
      render: (item: Supplier) => (
        <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full ${
          item.status === 'active' ? 'bg-success/10 text-success' : 'bg-bg-tertiary text-text-tertiary'
        }`}>
          {item.status}
        </span>
      ),
    },
    actionsColumn<Supplier>((item) =>
      can('supply_chain', 'edit') || can('supply_chain', 'delete') ? (
        <RowActions
          onEdit={can('supply_chain', 'edit') ? () => setEditingSupplier(item) : undefined}
          onDelete={can('supply_chain', 'delete') ? () => setDeletingSupplier(item) : undefined}
          editLabel={`Edit ${item.name}`}
          deleteLabel={`Delete ${item.name}`}
        />
      ) : null
    ),
  ]

  const poColumns = [
    { key: 'order_number', header: 'Order #' },
    {
      key: 'supplier_id',
      header: 'Supplier',
      cellClass: 'table-cell-secondary',
      render: (item: PurchaseOrder) => suppliers.find((s) => s.id === item.supplier_id)?.name || '—',
    },
    {
      key: 'status',
      header: 'Status',
      render: (item: PurchaseOrder) => (
        <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full ${
          item.status === 'delivered' ? 'bg-success/10 text-success' :
          item.status === 'shipped' ? 'bg-accent/10 text-accent' :
          item.status === 'cancelled' ? 'bg-danger/10 text-danger' :
          'bg-warning/10 text-warning'
        }`}>
          {item.status}
        </span>
      ),
    },
    {
      key: 'total_amount',
      header: 'Total',
      render: (item: PurchaseOrder) => (
        <span className="table-cell-amount text-text-primary">
          ${Number(item.total_amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      ),
    },
    { key: 'order_date', header: 'Order Date', cellClass: 'table-cell-date' },
    actionsColumn<PurchaseOrder>((item) =>
      can('supply_chain', 'edit') || can('supply_chain', 'delete') ? (
        <RowActions
          onEdit={can('supply_chain', 'edit') ? () => setEditingPO(item) : undefined}
          onDelete={can('supply_chain', 'delete') ? () => setDeletingPO(item) : undefined}
          editLabel={`Edit ${item.order_number}`}
          deleteLabel={`Delete ${item.order_number}`}
        />
      ) : null
    ),
  ]

  return (
    <ModuleAccessGuard module="supply_chain" label="Supply Chain">
    <div className="max-w-7xl mx-auto">
      <div className="page-header">
        <div>
          <h1 className="page-title">Supply Chain</h1>
          <p className="page-subtitle">Manage suppliers and purchase orders</p>
        </div>
        <div className="page-header-actions">
          <PermissionGate module="supply_chain" permission="import">
            <ModuleImport
              module="supply_chain"
              entity={activeTab === 'suppliers' ? 'suppliers' : 'purchase_orders'}
              label={activeTab === 'suppliers' ? 'Import suppliers' : 'Import orders'}
            />
          </PermissionGate>
          <PermissionGate module="supply_chain" permission="create">
            <button
              type="button"
              onClick={() => activeTab === 'suppliers' ? setShowAddSupplier(true) : setShowAddPO(true)}
              className="btn-primary"
            >
              <Plus size={16} />
              {activeTab === 'suppliers' ? 'Add Supplier' : 'New Order'}
            </button>
          </PermissionGate>
        </div>
      </div>

      <div className="tab-bar">
        <button type="button" data-active={activeTab === 'suppliers' ? 'true' : 'false'} onClick={() => setActiveTab('suppliers')}>
          <Building2 size={16} />
          Suppliers ({suppliers.length})
        </button>
        <button type="button" data-active={activeTab === 'orders' ? 'true' : 'false'} onClick={() => setActiveTab('orders')}>
          <FileText size={16} />
          Orders ({purchaseOrders.length})
        </button>
      </div>

      {activeTab === 'suppliers' && (
        suppliers.length === 0 ? (
          <EmptyState
            icon={Truck}
            title="No suppliers yet"
            description="Add your suppliers to track relationships, contact info, and create purchase orders."
            action={{ label: 'Add first supplier', onClick: () => setShowAddSupplier(true) }}
          />
        ) : (
          <FilterableDataTable
            columns={supplierColumns}
            data={suppliers}
            searchPlaceholder="Search company, contact, email, or phone…"
            searchKeys={['name', 'contact_person', 'email', 'phone', 'address']}
            filters={supplierFilters}
            pageSize={10}
            rowKey={(item) => item.id}
            emptyFilteredMessage="No suppliers match your search or filters."
          />
        )
      )}

      {activeTab === 'orders' && (
        purchaseOrders.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No purchase orders yet"
            description={suppliers.length === 0
              ? 'Add a supplier first, then create purchase orders to track your procurement.'
              : 'Create your first purchase order to track procurement and deliveries.'
            }
            action={suppliers.length > 0 ? { label: 'Create first order', onClick: () => setShowAddPO(true) } : undefined}
          />
        ) : (
          <FilterableDataTable
            columns={poColumns}
            data={purchaseOrders}
            searchPlaceholder="Search order number or supplier…"
            filters={orderFilters}
            customFilter={filterOrders}
            pageSize={10}
            rowKey={(item) => item.id}
            emptyFilteredMessage="No purchase orders match your search or filters."
          />
        )
      )}

      <Modal open={showAddSupplier} onClose={() => setShowAddSupplier(false)} title="Add Supplier">
        <SupplierForm onSubmit={(data) => addSupplier.mutate(data)} loading={addSupplier.isPending} />
      </Modal>

      <Modal open={!!editingSupplier} onClose={() => setEditingSupplier(null)} title="Edit Supplier">
        {editingSupplier && (
          <SupplierForm
            key={editingSupplier.id}
            initial={editingSupplier}
            onSubmit={(data) => updateSupplier.mutate({ id: editingSupplier.id, ...data })}
            loading={updateSupplier.isPending}
            submitLabel="Save changes"
          />
        )}
      </Modal>

      <ConfirmDeleteModal
        open={!!deletingSupplier}
        onClose={() => setDeletingSupplier(null)}
        onConfirm={() => deletingSupplier && deleteSupplier.mutate(deletingSupplier.id)}
        title="Delete supplier"
        description={
          linkedOrdersCount > 0
            ? `This supplier has ${linkedOrdersCount} linked purchase order${linkedOrdersCount === 1 ? '' : 's'}. Deleting the supplier will also remove those orders.`
            : 'This will permanently remove the supplier from your workspace.'
        }
        entityName={deletingSupplier?.name}
        loading={deleteSupplier.isPending}
      />

      <Modal open={showAddPO} onClose={() => setShowAddPO(false)} title="New Purchase Order">
        <POForm suppliers={suppliers} onSubmit={(data) => addPurchaseOrder.mutate(data)} loading={addPurchaseOrder.isPending} />
      </Modal>

      <Modal open={!!editingPO} onClose={() => setEditingPO(null)} title="Edit Purchase Order">
        {editingPO && (
          <POForm
            key={editingPO.id}
            initial={editingPO}
            suppliers={suppliers}
            onSubmit={(data) => updatePurchaseOrder.mutate({ id: editingPO.id, ...data })}
            loading={updatePurchaseOrder.isPending}
            submitLabel="Save changes"
          />
        )}
      </Modal>

      <ConfirmDeleteModal
        open={!!deletingPO}
        onClose={() => setDeletingPO(null)}
        onConfirm={() => deletingPO && deletePurchaseOrder.mutate(deletingPO.id)}
        title="Delete purchase order"
        description="This will permanently remove the purchase order from your workspace."
        entityName={deletingPO?.order_number}
        loading={deletePurchaseOrder.isPending}
      />
    </div>
    </ModuleAccessGuard>
  )
}

function SupplierForm({
  initial,
  onSubmit,
  loading,
  submitLabel = 'Add Supplier',
}: {
  initial?: Supplier
  onSubmit: (data: Partial<Supplier>) => void
  loading: boolean
  submitLabel?: string
}) {
  const [form, setForm] = useState({
    name: initial?.name ?? '',
    contact_person: initial?.contact_person ?? '',
    email: initial?.email ?? '',
    phone: initial?.phone ?? '',
    address: initial?.address ?? '',
    status: (initial?.status ?? 'active') as Supplier['status'],
  })

  useEffect(() => {
    if (!initial) return
    setForm({
      name: initial.name,
      contact_person: initial.contact_person,
      email: initial.email,
      phone: initial.phone,
      address: initial.address ?? '',
      status: initial.status,
    })
  }, [initial])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSubmit({ ...form, address: form.address || null })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-1.5">Company name</label>
        <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="form-field" />
      </div>
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-1.5">Contact person</label>
        <input type="text" required value={form.contact_person} onChange={(e) => setForm({ ...form, contact_person: e.target.value })} className="form-field" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1.5">Email</label>
          <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="form-field" />
        </div>
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1.5">Phone</label>
          <input type="tel" required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="form-field" />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-1.5">Address</label>
        <textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="form-field resize-none" rows={2} />
      </div>
      {initial && (
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1.5">Status</label>
          <ThemeSelect
            variant="form"
            value={form.status}
            onChange={(status) => setForm({ ...form, status: status as Supplier['status'] })}
            options={[
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' },
            ]}
            aria-label="Status"
          />
        </div>
      )}
      <button type="submit" disabled={loading} className="form-submit">        {loading ? 'Saving...' : submitLabel}
      </button>
    </form>
  )
}

function POForm({
  suppliers,
  initial,
  onSubmit,
  loading,
  submitLabel = 'Create Order',
}: {
  suppliers: Supplier[]
  initial?: PurchaseOrder
  onSubmit: (data: Partial<PurchaseOrder>) => void
  loading: boolean
  submitLabel?: string
}) {
  const [form, setForm] = useState({
    supplier_id: initial?.supplier_id ?? suppliers[0]?.id ?? '',
    order_number: initial?.order_number ?? `PO-${Date.now().toString(36).toUpperCase()}`,
    total_amount: initial?.total_amount != null ? String(initial.total_amount) : '',
    expected_delivery: initial?.expected_delivery ?? '',
    order_date: initial?.order_date ?? new Date().toISOString().split('T')[0],
    status: (initial?.status ?? 'pending') as PurchaseOrder['status'],
  })

  useEffect(() => {
    if (!initial) return
    setForm({
      supplier_id: initial.supplier_id,
      order_number: initial.order_number,
      total_amount: String(initial.total_amount),
      expected_delivery: initial.expected_delivery ?? '',
      order_date: initial.order_date,
      status: initial.status,
    })
  }, [initial])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSubmit({
      supplier_id: form.supplier_id,
      order_number: form.order_number,
      total_amount: Number(form.total_amount),
      expected_delivery: form.expected_delivery || null,
      order_date: form.order_date,
      status: form.status,
      items: initial?.items ?? [],
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-1.5">Supplier</label>
        <ThemeSelect
          variant="form"
          value={form.supplier_id}
          onChange={(supplier_id) => setForm({ ...form, supplier_id })}
          options={suppliers.map((s) => ({ value: s.id, label: s.name }))}
          aria-label="Supplier"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1.5">Order number</label>
          <input type="text" required value={form.order_number} onChange={(e) => setForm({ ...form, order_number: e.target.value })} className="form-field" />
        </div>
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1.5">Total amount</label>
          <input type="number" required step="0.01" value={form.total_amount} onChange={(e) => setForm({ ...form, total_amount: e.target.value })} className="form-field" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1.5">Order date</label>
          <input type="date" required value={form.order_date} onChange={(e) => setForm({ ...form, order_date: e.target.value })} className="form-field" />
        </div>
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1.5">Expected delivery</label>
          <input type="date" value={form.expected_delivery} onChange={(e) => setForm({ ...form, expected_delivery: e.target.value })} className="form-field" />
        </div>
      </div>
      {initial && (
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1.5">Status</label>
          <ThemeSelect
            variant="form"
            value={form.status}
            onChange={(status) => setForm({ ...form, status: status as PurchaseOrder['status'] })}
            options={[
              { value: 'pending', label: 'Pending' },
              { value: 'approved', label: 'Approved' },
              { value: 'shipped', label: 'Shipped' },
              { value: 'delivered', label: 'Delivered' },
              { value: 'cancelled', label: 'Cancelled' },
            ]}
            aria-label="Status"
          />
        </div>
      )}
      <button type="submit" disabled={loading} className="form-submit">        {loading ? 'Saving...' : submitLabel}
      </button>
    </form>
  )
}
