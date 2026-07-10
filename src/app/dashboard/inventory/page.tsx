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
import { Package, Plus } from 'lucide-react'
import { toast } from 'sonner'
import type { Product } from '@/lib/types'
import { ModuleImport } from '@/components/import/module-import'
import { ThemeSelect } from '@/components/ui/theme-select'
import { ModuleAccessGuard } from '@/components/rbac/module-access-guard'
import { PermissionGate } from '@/components/rbac/permission-gate'
import { usePermissions } from '@/hooks/use-permissions'

export default function InventoryPage() {
  const [showAdd, setShowAdd] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)
  const [deleting, setDeleting] = useState<Product | null>(null)
  const { workspace } = useWorkspaceStore()
  const { can } = usePermissions()
  const supabase = createClient()
  const queryClient = useQueryClient()

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const { data } = await supabase
        .from('products')
        .select('*')
        .eq('workspace_id', workspace?.id)
        .order('created_at', { ascending: false })
      return (data || []) as Product[]
    },
    enabled: !!workspace?.id,
  })

  const addProduct = useMutation({
    mutationFn: async (product: Partial<Product>) => {
      const { error } = await supabase.from('products').insert({
        ...product,
        workspace_id: workspace?.id,
      })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] })
      setShowAdd(false)
      toast.success('Product added')
    },
    onError: () => toast.error('Failed to add product'),
  })

  const updateProduct = useMutation({
    mutationFn: async ({ id, ...product }: Partial<Product> & { id: string }) => {
      const { error } = await supabase
        .from('products')
        .update(product)
        .eq('id', id)
        .eq('workspace_id', workspace?.id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] })
      setEditing(null)
      toast.success('Product updated')
    },
    onError: () => toast.error('Failed to update product'),
  })

  const deleteProduct = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id)
        .eq('workspace_id', workspace?.id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] })
      setDeleting(null)
      toast.success('Product deleted')
    },
    onError: () => toast.error('Failed to delete product'),
  })

  const inventoryFilters = useMemo(() => {
    const categories = workspace?.product_categories?.length
      ? workspace.product_categories
      : [...new Set(products.map((p) => p.category))]

    return [
      {
        id: 'category',
        label: 'Category',
        options: categories.map((c) => ({ value: c, label: c })),
      },
      {
        id: 'status',
        label: 'Status',
        options: [
          { value: 'in_stock', label: 'In stock' },
          { value: 'low_stock', label: 'Low stock' },
          { value: 'out_of_stock', label: 'Out of stock' },
        ],
      },
    ]
  }, [workspace?.product_categories, products])

  const columns = [
    { key: 'name', header: 'Product' },
    { key: 'sku', header: 'SKU', cellClass: 'table-cell-secondary' },
    { key: 'category', header: 'Category', cellClass: 'table-cell-secondary' },
    {
      key: 'quantity',
      header: 'Quantity',
      render: (item: Product) => (
        <span className={`table-cell-amount ${item.quantity <= item.min_stock_level ? 'text-danger' : 'text-text-primary'}`}>
          {item.quantity}
        </span>
      ),
    },
    {
      key: 'unit_price',
      header: 'Price',
      render: (item: Product) => (
        <span className="table-cell-amount text-text-primary">
          ${Number(item.unit_price).toFixed(2)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (item: Product) => (
        <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full ${
          item.status === 'in_stock' ? 'bg-success/10 text-success' :
          item.status === 'low_stock' ? 'bg-warning/10 text-warning' :
          'bg-danger/10 text-danger'
        }`}>
          {item.status.replace('_', ' ')}
        </span>
      ),
    },
    actionsColumn<Product>((item) =>
      can('inventory', 'edit') || can('inventory', 'delete') ? (
        <RowActions
          onEdit={can('inventory', 'edit') ? () => setEditing(item) : undefined}
          onDelete={can('inventory', 'delete') ? () => setDeleting(item) : undefined}
          editLabel={`Edit ${item.name}`}
          deleteLabel={`Delete ${item.name}`}
        />
      ) : null
    ),
  ]

  return (
    <ModuleAccessGuard module="inventory" label="Inventory">
    <div className="max-w-7xl mx-auto">
      <div className="page-header">
        <div>
          <h1 className="page-title">Inventory</h1>
          <p className="page-subtitle">Track products, stock levels, and categories</p>
        </div>
        <div className="page-header-actions">
          <PermissionGate module="inventory" permission="import">
            <ModuleImport module="inventory" entity="products" />
          </PermissionGate>
          <PermissionGate module="inventory" permission="create">
            <button type="button" onClick={() => setShowAdd(true)} className="btn-primary">
              <Plus size={16} />
              Add Product
            </button>
          </PermissionGate>
        </div>
      </div>

      {products.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No products yet"
          description="Start building your inventory by adding your first product. Track quantities, prices, and stock levels in real time."
          action={{ label: 'Add first product', onClick: () => setShowAdd(true) }}
        />
      ) : (
        <FilterableDataTable
          columns={columns}
          data={products}
          searchPlaceholder="Search by product name or SKU…"
          searchKeys={['name', 'sku', 'category']}
          filters={inventoryFilters}
          pageSize={10}
          rowKey={(item) => item.id}
          emptyFilteredMessage="No products match your search or filters."
        />
      )}

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add Product">
        <ProductForm
          categories={workspace?.product_categories || []}
          onSubmit={(data) => addProduct.mutate(data)}
          loading={addProduct.isPending}
        />
      </Modal>

      <Modal open={!!editing} onClose={() => setEditing(null)} title="Edit Product">
        {editing && (
          <ProductForm
            key={editing.id}
            initial={editing}
            categories={workspace?.product_categories || []}
            onSubmit={(data) => updateProduct.mutate({ id: editing.id, ...data })}
            loading={updateProduct.isPending}
            submitLabel="Save changes"
          />
        )}
      </Modal>

      <ConfirmDeleteModal
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleting && deleteProduct.mutate(deleting.id)}
        title="Delete product"
        description="This will permanently remove the product from your inventory."
        entityName={deleting?.name}
        loading={deleteProduct.isPending}
      />
    </div>
    </ModuleAccessGuard>
  )
}

function ProductForm({
  categories,
  initial,
  onSubmit,
  loading,
  submitLabel = 'Add Product',
}: {
  categories: string[]
  initial?: Product
  onSubmit: (data: Partial<Product>) => void
  loading: boolean
  submitLabel?: string
}) {
  const [form, setForm] = useState({
    name: initial?.name ?? '',
    sku: initial?.sku ?? '',
    category: initial?.category ?? categories[0] ?? '',
    quantity: initial?.quantity != null ? String(initial.quantity) : '0',
    unit_price: initial?.unit_price != null ? String(initial.unit_price) : '',
    cost_price: initial?.cost_price != null ? String(initial.cost_price) : '',
    min_stock_level: initial?.min_stock_level != null ? String(initial.min_stock_level) : '10',
  })

  useEffect(() => {
    if (!initial) return
    setForm({
      name: initial.name,
      sku: initial.sku,
      category: initial.category,
      quantity: String(initial.quantity),
      unit_price: String(initial.unit_price),
      cost_price: String(initial.cost_price),
      min_stock_level: String(initial.min_stock_level),
    })
  }, [initial])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const quantity = Number(form.quantity)
    const minStock = Number(form.min_stock_level)
    onSubmit({
      ...form,
      quantity,
      unit_price: Number(form.unit_price),
      cost_price: Number(form.cost_price),
      min_stock_level: minStock,
      status: quantity === 0 ? 'out_of_stock' : quantity <= minStock ? 'low_stock' : 'in_stock',
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-1.5">Product name</label>
        <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="form-field" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1.5">SKU</label>
          <input type="text" required value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} className="form-field" />
        </div>
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1.5">Category</label>
          <ThemeSelect
            variant="form"
            value={form.category}
            onChange={(category) => setForm({ ...form, category })}
            options={[
              ...categories.map((c) => ({ value: c, label: c })),
              { value: 'Other', label: 'Other' },
            ]}
            aria-label="Category"
          />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1.5">Quantity</label>
          <input type="number" required min="0" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} className="form-field" />
        </div>
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1.5">Unit price</label>
          <input type="number" required step="0.01" value={form.unit_price} onChange={(e) => setForm({ ...form, unit_price: e.target.value })} className="form-field" />
        </div>
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1.5">Cost price</label>
          <input type="number" required step="0.01" value={form.cost_price} onChange={(e) => setForm({ ...form, cost_price: e.target.value })} className="form-field" />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-1.5">Min stock level</label>
        <input type="number" required min="0" value={form.min_stock_level} onChange={(e) => setForm({ ...form, min_stock_level: e.target.value })} className="form-field" />
      </div>
      <button type="submit" disabled={loading} className="form-submit">
        {loading ? 'Saving...' : submitLabel}
      </button>
    </form>
  )
}
