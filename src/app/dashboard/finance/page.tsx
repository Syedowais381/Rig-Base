'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useWorkspaceStore } from '@/store/workspace'
import { EmptyState } from '@/components/ui/empty-state'
import { Modal } from '@/components/ui/modal'
import { DataTable } from '@/components/ui/data-table'
import { DollarSign, Plus, TrendingUp, TrendingDown } from 'lucide-react'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import type { Transaction } from '@/lib/types'

export default function FinancePage() {
  const [showAdd, setShowAdd] = useState(false)
  const [filterType, setFilterType] = useState<'all' | 'revenue' | 'expense'>('all')
  const { workspace } = useWorkspaceStore()
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
      setShowAdd(false)
      toast.success('Transaction added')
    },
    onError: () => toast.error('Failed to add transaction'),
  })

  const filtered = filterType === 'all'
    ? transactions
    : transactions.filter((t) => t.type === filterType)

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
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full ${
          item.type === 'revenue' ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'
        }`}>
          {item.type === 'revenue' ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
          {item.type}
        </span>
      ),
    },
    { key: 'description', header: 'Description' },
    { key: 'category', header: 'Category' },
    {
      key: 'amount',
      header: 'Amount',
      render: (item: Transaction) => (
        <span className={item.type === 'revenue' ? 'text-success' : 'text-danger'}>
          {item.type === 'revenue' ? '+' : '-'}${Number(item.amount).toLocaleString()}
        </span>
      ),
    },
    { key: 'date', header: 'Date' },
  ]

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6 ai-panel rounded-2xl p-6">
        <div>
          <h1 className="text-2xl font-semibold">Finance</h1>
          <p className="text-text-secondary text-sm mt-1">
            Track revenue, expenses, and cash flow
          </p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-accent to-[#2f78ff] hover:to-[#4990ff] text-white text-sm font-medium rounded-lg transition-colors ai-glow"
        >
          <Plus size={16} />
          Add Transaction
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="ai-card border border-border-primary rounded-xl p-5"
        >
          <p className="text-xs text-text-tertiary uppercase tracking-wide">Total Revenue</p>
          <p className="text-2xl font-semibold text-success mt-1">${totalRevenue.toLocaleString()}</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="ai-card border border-border-primary rounded-xl p-5"
        >
          <p className="text-xs text-text-tertiary uppercase tracking-wide">Total Expenses</p>
          <p className="text-2xl font-semibold text-danger mt-1">${totalExpenses.toLocaleString()}</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="ai-card border border-border-primary rounded-xl p-5"
        >
          <p className="text-xs text-text-tertiary uppercase tracking-wide">Net Profit</p>
          <p className={`text-2xl font-semibold mt-1 ${totalRevenue - totalExpenses >= 0 ? 'text-success' : 'text-danger'}`}>
            ${(totalRevenue - totalExpenses).toLocaleString()}
          </p>
        </motion.div>
      </div>

      {/* Filter */}
      <div className="flex gap-1 p-1 bg-bg-secondary/90 border border-border-primary rounded-lg w-fit mb-6">
        {(['all', 'revenue', 'expense'] as const).map((type) => (
          <button
            key={type}
            onClick={() => setFilterType(type)}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors capitalize ${
              filterType === type ? 'bg-gradient-to-r from-accent to-[#2f78ff] text-white' : 'text-text-secondary hover:text-text-primary hover:bg-bg-tertiary/70'
            }`}
          >
            {type}
          </button>
        ))}
      </div>

      {transactions.length === 0 ? (
        <EmptyState
          icon={DollarSign}
          title="No transactions yet"
          description="Record your first revenue or expense to start tracking your business finances. All dashboard financial metrics will reflect real data."
          action={{ label: 'Add first transaction', onClick: () => setShowAdd(true) }}
        />
      ) : (
        <DataTable columns={columns} data={filtered} />
      )}

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add Transaction">
        <TransactionForm
          onSubmit={(data) => addTransaction.mutate(data)}
          loading={addTransaction.isPending}
        />
      </Modal>
    </div>
  )
}

function TransactionForm({
  onSubmit,
  loading,
}: {
  onSubmit: (data: Partial<Transaction>) => void
  loading: boolean
}) {
  const [form, setForm] = useState({
    type: 'revenue' as 'revenue' | 'expense',
    description: '',
    category: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    reference: '',
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSubmit({
      ...form,
      amount: Number(form.amount),
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-1.5">Type</label>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setForm({ ...form, type: 'revenue' })}
            className={`py-2.5 text-sm font-medium rounded-lg border transition-colors ${
              form.type === 'revenue'
                ? 'bg-success/10 border-success/30 text-success'
                : 'bg-bg-tertiary border-border-primary text-text-secondary hover:bg-bg-elevated'
            }`}
          >
            Revenue
          </button>
          <button
            type="button"
            onClick={() => setForm({ ...form, type: 'expense' })}
            className={`py-2.5 text-sm font-medium rounded-lg border transition-colors ${
              form.type === 'expense'
                ? 'bg-danger/10 border-danger/30 text-danger'
                : 'bg-bg-tertiary border-border-primary text-text-secondary hover:bg-bg-elevated'
            }`}
          >
            Expense
          </button>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-1.5">Description</label>
        <input
          type="text"
          required
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          className="w-full px-3 py-2.5 bg-bg-tertiary border border-border-primary rounded-lg"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1.5">Category</label>
          <input
            type="text"
            required
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            className="w-full px-3 py-2.5 bg-bg-tertiary border border-border-primary rounded-lg"
            placeholder="e.g. Sales, Rent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1.5">Amount</label>
          <input
            type="number"
            required
            step="0.01"
            min="0"
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
            className="w-full px-3 py-2.5 bg-bg-tertiary border border-border-primary rounded-lg"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1.5">Date</label>
          <input
            type="date"
            required
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
            className="w-full px-3 py-2.5 bg-bg-tertiary border border-border-primary rounded-lg"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1.5">Reference</label>
          <input
            type="text"
            value={form.reference}
            onChange={(e) => setForm({ ...form, reference: e.target.value })}
            className="w-full px-3 py-2.5 bg-bg-tertiary border border-border-primary rounded-lg"
            placeholder="Invoice #, etc."
          />
        </div>
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full py-2.5 bg-gradient-to-r from-accent to-[#2f78ff] hover:to-[#4990ff] text-white font-medium rounded-lg transition-colors disabled:opacity-50"
      >
        {loading ? 'Adding...' : 'Add Transaction'}
      </button>
    </form>
  )
}
