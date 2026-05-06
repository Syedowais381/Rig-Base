'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useWorkspaceStore } from '@/store/workspace'
import { EmptyState } from '@/components/ui/empty-state'
import { Modal } from '@/components/ui/modal'
import { DataTable } from '@/components/ui/data-table'
import { UserCircle, Plus } from 'lucide-react'
import { toast } from 'sonner'
import type { Customer } from '@/lib/types'

export default function CRMPage() {
  const [showAdd, setShowAdd] = useState(false)
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive' | 'lead'>('all')
  const { workspace } = useWorkspaceStore()
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
      setShowAdd(false)
      toast.success('Customer added')
    },
    onError: () => toast.error('Failed to add customer'),
  })

  const filtered = filterStatus === 'all'
    ? customers
    : customers.filter((c) => c.status === filterStatus)

  const columns = [
    { key: 'name', header: 'Name' },
    { key: 'email', header: 'Email' },
    { key: 'company', header: 'Company', render: (item: Customer) => item.company || '-' },
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
      render: (item: Customer) => `$${Number(item.total_spent).toLocaleString()}`,
    },
  ]

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">CRM</h1>
          <p className="text-text-secondary text-sm mt-1">
            Manage customer relationships and track interactions
          </p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-accent hover:bg-accent-hover text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Plus size={16} />
          Add Customer
        </button>
      </div>

      {/* Filter */}
      <div className="flex gap-1 p-1 bg-bg-secondary border border-border-primary rounded-lg w-fit mb-6">
        {(['all', 'active', 'lead', 'inactive'] as const).map((status) => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors capitalize ${
              filterStatus === status ? 'bg-accent text-white' : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      {customers.length === 0 ? (
        <EmptyState
          icon={UserCircle}
          title="No customers yet"
          description="Add your first customer to start tracking relationships, interactions, and revenue per customer."
          action={{ label: 'Add first customer', onClick: () => setShowAdd(true) }}
        />
      ) : (
        <DataTable columns={columns} data={filtered} />
      )}

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add Customer">
        <CustomerForm onSubmit={(data) => addCustomer.mutate(data)} loading={addCustomer.isPending} />
      </Modal>
    </div>
  )
}

function CustomerForm({ onSubmit, loading }: { onSubmit: (data: Partial<Customer>) => void; loading: boolean }) {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    status: 'active' as 'active' | 'inactive' | 'lead',
    notes: '',
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSubmit({ ...form, total_spent: 0 })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-1.5">Name</label>
        <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2.5 bg-bg-tertiary border border-border-primary rounded-lg focus:outline-none focus:border-accent" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1.5">Email</label>
          <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full px-3 py-2.5 bg-bg-tertiary border border-border-primary rounded-lg focus:outline-none focus:border-accent" />
        </div>
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1.5">Phone</label>
          <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full px-3 py-2.5 bg-bg-tertiary border border-border-primary rounded-lg focus:outline-none focus:border-accent" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1.5">Company</label>
          <input type="text" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} className="w-full px-3 py-2.5 bg-bg-tertiary border border-border-primary rounded-lg focus:outline-none focus:border-accent" />
        </div>
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1.5">Status</label>
          <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as 'active' | 'inactive' | 'lead' })} className="w-full px-3 py-2.5 bg-bg-tertiary border border-border-primary rounded-lg focus:outline-none focus:border-accent">
            <option value="active">Active</option>
            <option value="lead">Lead</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-1.5">Notes</label>
        <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="w-full px-3 py-2.5 bg-bg-tertiary border border-border-primary rounded-lg focus:outline-none focus:border-accent resize-none" rows={3} />
      </div>
      <button type="submit" disabled={loading} className="w-full py-2.5 bg-accent hover:bg-accent-hover text-white font-medium rounded-lg transition-colors disabled:opacity-50">
        {loading ? 'Adding...' : 'Add Customer'}
      </button>
    </form>
  )
}
