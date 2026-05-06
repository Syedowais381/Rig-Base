'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useWorkspaceStore } from '@/store/workspace'
import { EmptyState } from '@/components/ui/empty-state'
import { Modal } from '@/components/ui/modal'
import { DataTable } from '@/components/ui/data-table'
import { Package, Plus } from 'lucide-react'
import { toast } from 'sonner'
import type { Product } from '@/lib/types'

export default function InventoryPage() {
  const [showAdd, setShowAdd] = useState(false)
  const { workspace } = useWorkspaceStore()
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
      setShowAdd(false)
      toast.success('Product added')
    },
    onError: () => toast.error('Failed to add product'),
  })

  const columns = [
    { key: 'name', header: 'Product' },
    { key: 'sku', header: 'SKU' },
    { key: 'category', header: 'Category' },
    {
      key: 'quantity',
      header: 'Quantity',
      render: (item: Product) => (
        <span className={item.quantity <= item.min_stock_level ? 'text-danger' : ''}>
          {item.quantity}
        </span>
      ),
    },
    {
      key: 'unit_price',
      header: 'Price',
      render: (item: Product) => `$${Number(item.unit_price).toFixed(2)}`,
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
  ]

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Inventory</h1>
          <p className="text-text-secondary text-sm mt-1">
            Track products, stock levels, and categories
          </p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-accent hover:bg-accent-hover text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Plus size={16} />
          Add Product
        </button>
      </div>

      {/* Category filters */}
      {workspace?.product_categories && workspace.product_categories.length > 0 && (
        <div className="flex gap-2 mb-6 flex-wrap">
          <span className="px-3 py-1.5 text-xs font-medium bg-accent/10 text-accent border border-accent/20 rounded-lg">
            All ({products.length})
          </span>
          {workspace.product_categories.map((cat) => (
            <span
              key={cat}
              className="px-3 py-1.5 text-xs font-medium text-text-secondary bg-bg-secondary border border-border-primary rounded-lg"
            >
              {cat} ({products.filter((p) => p.category === cat).length})
            </span>
          ))}
        </div>
      )}

      {products.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No products yet"
          description="Start building your inventory by adding your first product. Track quantities, prices, and stock levels in real time."
          action={{ label: 'Add first product', onClick: () => setShowAdd(true) }}
        />
      ) : (
        <DataTable columns={columns} data={products} />
      )}

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add Product">
        <ProductForm
          categories={workspace?.product_categories || []}
          onSubmit={(data) => addProduct.mutate(data)}
          loading={addProduct.isPending}
        />
      </Modal>
    </div>
  )
}

function ProductForm({
  categories,
  onSubmit,
  loading,
}: {
  categories: string[]
  onSubmit: (data: Partial<Product>) => void
  loading: boolean
}) {
  const [form, setForm] = useState({
    name: '',
    sku: '',
    category: categories[0] || '',
    quantity: '0',
    unit_price: '',
    cost_price: '',
    min_stock_level: '10',
  })

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
        <input
          type="text"
          required
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="w-full px-3 py-2.5 bg-bg-tertiary border border-border-primary rounded-lg focus:outline-none focus:border-accent"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1.5">SKU</label>
          <input
            type="text"
            required
            value={form.sku}
            onChange={(e) => setForm({ ...form, sku: e.target.value })}
            className="w-full px-3 py-2.5 bg-bg-tertiary border border-border-primary rounded-lg focus:outline-none focus:border-accent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1.5">Category</label>
          <select
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            className="w-full px-3 py-2.5 bg-bg-tertiary border border-border-primary rounded-lg focus:outline-none focus:border-accent"
          >
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
            <option value="Other">Other</option>
          </select>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1.5">Quantity</label>
          <input
            type="number"
            required
            min="0"
            value={form.quantity}
            onChange={(e) => setForm({ ...form, quantity: e.target.value })}
            className="w-full px-3 py-2.5 bg-bg-tertiary border border-border-primary rounded-lg focus:outline-none focus:border-accent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1.5">Unit price</label>
          <input
            type="number"
            required
            step="0.01"
            value={form.unit_price}
            onChange={(e) => setForm({ ...form, unit_price: e.target.value })}
            className="w-full px-3 py-2.5 bg-bg-tertiary border border-border-primary rounded-lg focus:outline-none focus:border-accent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1.5">Cost price</label>
          <input
            type="number"
            required
            step="0.01"
            value={form.cost_price}
            onChange={(e) => setForm({ ...form, cost_price: e.target.value })}
            className="w-full px-3 py-2.5 bg-bg-tertiary border border-border-primary rounded-lg focus:outline-none focus:border-accent"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-1.5">Min stock level</label>
        <input
          type="number"
          required
          min="0"
          value={form.min_stock_level}
          onChange={(e) => setForm({ ...form, min_stock_level: e.target.value })}
          className="w-full px-3 py-2.5 bg-bg-tertiary border border-border-primary rounded-lg focus:outline-none focus:border-accent"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full py-2.5 bg-accent hover:bg-accent-hover text-white font-medium rounded-lg transition-colors disabled:opacity-50"
      >
        {loading ? 'Adding...' : 'Add Product'}
      </button>
    </form>
  )
}
