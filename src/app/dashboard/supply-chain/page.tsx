'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useWorkspaceStore } from '@/store/workspace'
import { EmptyState } from '@/components/ui/empty-state'
import { Modal } from '@/components/ui/modal'
import { DataTable } from '@/components/ui/data-table'
import { Truck, Plus, Building2, FileText } from 'lucide-react'
import { toast } from 'sonner'
import type { Supplier, PurchaseOrder } from '@/lib/types'

export default function SupplyChainPage() {
  const [showAddSupplier, setShowAddSupplier] = useState(false)
  const [showAddPO, setShowAddPO] = useState(false)
  const [activeTab, setActiveTab] = useState<'suppliers' | 'orders'>('suppliers')
  const { workspace } = useWorkspaceStore()
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
      setShowAddPO(false)
      toast.success('Purchase order created')
    },
    onError: () => toast.error('Failed to create purchase order'),
  })

  const supplierColumns = [
    { key: 'name', header: 'Company' },
    { key: 'contact_person', header: 'Contact' },
    { key: 'email', header: 'Email' },
    { key: 'phone', header: 'Phone' },
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
  ]

  const poColumns = [
    { key: 'order_number', header: 'Order #' },
    {
      key: 'supplier_id',
      header: 'Supplier',
      render: (item: PurchaseOrder) => suppliers.find((s) => s.id === item.supplier_id)?.name || '-',
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
      render: (item: PurchaseOrder) => `$${Number(item.total_amount).toLocaleString()}`,
    },
    { key: 'order_date', header: 'Order Date' },
  ]

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6 ai-panel rounded-2xl p-6">
        <div>
          <h1 className="text-2xl font-semibold">Supply Chain</h1>
          <p className="text-text-secondary text-sm mt-1">
            Manage suppliers and purchase orders
          </p>
        </div>
        <button
          onClick={() => activeTab === 'suppliers' ? setShowAddSupplier(true) : setShowAddPO(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-accent to-[#2f78ff] hover:to-[#4990ff] text-white text-sm font-medium rounded-lg transition-colors ai-glow"
        >
          <Plus size={16} />
          {activeTab === 'suppliers' ? 'Add Supplier' : 'New Order'}
        </button>
      </div>

      <div className="flex gap-1 p-1 bg-bg-secondary/90 border border-border-primary rounded-lg w-fit mb-6">
        <button
          onClick={() => setActiveTab('suppliers')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            activeTab === 'suppliers' ? 'bg-gradient-to-r from-accent to-[#2f78ff] text-white' : 'text-text-secondary hover:text-text-primary hover:bg-bg-tertiary/70'
          }`}
        >
          <Building2 size={16} />
          Suppliers ({suppliers.length})
        </button>
        <button
          onClick={() => setActiveTab('orders')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            activeTab === 'orders' ? 'bg-gradient-to-r from-accent to-[#2f78ff] text-white' : 'text-text-secondary hover:text-text-primary hover:bg-bg-tertiary/70'
          }`}
        >
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
          <DataTable columns={supplierColumns} data={suppliers} />
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
          <DataTable columns={poColumns} data={purchaseOrders} />
        )
      )}

      {/* Add Supplier Modal */}
      <Modal open={showAddSupplier} onClose={() => setShowAddSupplier(false)} title="Add Supplier">
        <SupplierForm onSubmit={(data) => addSupplier.mutate(data)} loading={addSupplier.isPending} />
      </Modal>

      {/* Add PO Modal */}
      <Modal open={showAddPO} onClose={() => setShowAddPO(false)} title="New Purchase Order">
        <POForm
          suppliers={suppliers}
          onSubmit={(data) => addPurchaseOrder.mutate(data)}
          loading={addPurchaseOrder.isPending}
        />
      </Modal>
    </div>
  )
}

function SupplierForm({ onSubmit, loading }: { onSubmit: (data: Partial<Supplier>) => void; loading: boolean }) {
  const [form, setForm] = useState({
    name: '',
    contact_person: '',
    email: '',
    phone: '',
    address: '',
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSubmit({ ...form, status: 'active' })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-1.5">Company name</label>
        <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2.5 bg-bg-tertiary border border-border-primary rounded-lg" />
      </div>
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-1.5">Contact person</label>
        <input type="text" required value={form.contact_person} onChange={(e) => setForm({ ...form, contact_person: e.target.value })} className="w-full px-3 py-2.5 bg-bg-tertiary border border-border-primary rounded-lg" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1.5">Email</label>
          <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full px-3 py-2.5 bg-bg-tertiary border border-border-primary rounded-lg" />
        </div>
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1.5">Phone</label>
          <input type="tel" required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full px-3 py-2.5 bg-bg-tertiary border border-border-primary rounded-lg" />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-1.5">Address</label>
        <textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="w-full px-3 py-2.5 bg-bg-tertiary border border-border-primary rounded-lg resize-none" rows={2} />
      </div>
      <button type="submit" disabled={loading} className="w-full py-2.5 bg-gradient-to-r from-accent to-[#2f78ff] hover:to-[#4990ff] text-white font-medium rounded-lg transition-colors disabled:opacity-50">
        {loading ? 'Adding...' : 'Add Supplier'}
      </button>
    </form>
  )
}

function POForm({ suppliers, onSubmit, loading }: { suppliers: Supplier[]; onSubmit: (data: Partial<PurchaseOrder>) => void; loading: boolean }) {
  const [form, setForm] = useState({
    supplier_id: suppliers[0]?.id || '',
    order_number: `PO-${Date.now().toString(36).toUpperCase()}`,
    total_amount: '',
    expected_delivery: '',
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSubmit({
      ...form,
      total_amount: Number(form.total_amount),
      order_date: new Date().toISOString().split('T')[0],
      status: 'pending',
      items: [],
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-1.5">Supplier</label>
        <select value={form.supplier_id} onChange={(e) => setForm({ ...form, supplier_id: e.target.value })} className="w-full px-3 py-2.5 bg-bg-tertiary border border-border-primary rounded-lg">
          {suppliers.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1.5">Order number</label>
          <input type="text" required value={form.order_number} onChange={(e) => setForm({ ...form, order_number: e.target.value })} className="w-full px-3 py-2.5 bg-bg-tertiary border border-border-primary rounded-lg" />
        </div>
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1.5">Total amount</label>
          <input type="number" required step="0.01" value={form.total_amount} onChange={(e) => setForm({ ...form, total_amount: e.target.value })} className="w-full px-3 py-2.5 bg-bg-tertiary border border-border-primary rounded-lg" />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-1.5">Expected delivery</label>
        <input type="date" value={form.expected_delivery} onChange={(e) => setForm({ ...form, expected_delivery: e.target.value })} className="w-full px-3 py-2.5 bg-bg-tertiary border border-border-primary rounded-lg" />
      </div>
      <button type="submit" disabled={loading} className="w-full py-2.5 bg-gradient-to-r from-accent to-[#2f78ff] hover:to-[#4990ff] text-white font-medium rounded-lg transition-colors disabled:opacity-50">
        {loading ? 'Creating...' : 'Create Order'}
      </button>
    </form>
  )
}
