'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useWorkspaceStore } from '@/store/workspace'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import { User, Building2, Loader2 } from 'lucide-react'

export default function SettingsPage() {
  const { profile, workspace } = useWorkspaceStore()
  const supabase = createClient()
  const queryClient = useQueryClient()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    full_name: profile?.full_name || '',
    business_name: profile?.business_name || '',
  })

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: form.full_name,
        business_name: form.business_name,
      })
      .eq('id', profile?.id)

    if (error) {
      toast.error('Failed to save')
    } else {
      toast.success('Settings saved')
      queryClient.invalidateQueries({ queryKey: ['profile'] })
    }
    setSaving(false)
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-text-secondary text-sm mt-1">Manage your account and workspace</p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-bg-secondary border border-border-primary rounded-xl p-6 mb-6"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 bg-accent-muted rounded-lg flex items-center justify-center">
            <User size={16} className="text-accent" />
          </div>
          <h2 className="font-semibold">Profile</h2>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">Full name</label>
            <input
              type="text"
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              className="w-full px-3 py-2.5 bg-bg-tertiary border border-border-primary rounded-lg focus:outline-none focus:border-accent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">Business name</label>
            <input
              type="text"
              value={form.business_name}
              onChange={(e) => setForm({ ...form, business_name: e.target.value })}
              className="w-full px-3 py-2.5 bg-bg-tertiary border border-border-primary rounded-lg focus:outline-none focus:border-accent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">Email</label>
            <input
              type="email"
              value={profile?.email || ''}
              disabled
              className="w-full px-3 py-2.5 bg-bg-tertiary border border-border-primary rounded-lg opacity-60 cursor-not-allowed"
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2.5 bg-accent hover:bg-accent-hover text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {saving && <Loader2 size={14} className="animate-spin" />}
            Save changes
          </button>
        </form>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-bg-secondary border border-border-primary rounded-xl p-6"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 bg-accent-muted rounded-lg flex items-center justify-center">
            <Building2 size={16} className="text-accent" />
          </div>
          <h2 className="font-semibold">Workspace</h2>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-border-primary">
            <span className="text-sm text-text-secondary">Business type</span>
            <span className="text-sm font-medium">{workspace?.business_type || '-'}</span>
          </div>
          <div className="flex items-center justify-between py-3 border-b border-border-primary">
            <span className="text-sm text-text-secondary">Active modules</span>
            <span className="text-sm font-medium">
              {workspace?.modules
                ? Object.entries(workspace.modules).filter(([, v]) => v).length
                : 0}
            </span>
          </div>
          <div className="flex items-center justify-between py-3 border-b border-border-primary">
            <span className="text-sm text-text-secondary">Departments</span>
            <span className="text-sm font-medium">{workspace?.departments?.length || 0}</span>
          </div>
          <div className="flex items-center justify-between py-3">
            <span className="text-sm text-text-secondary">Created</span>
            <span className="text-sm font-medium">
              {workspace?.created_at ? new Date(workspace.created_at).toLocaleDateString() : '-'}
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
