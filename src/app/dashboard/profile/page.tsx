'use client'

import { useEffect, useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useWorkspaceStore } from '@/store/workspace'
import { usePermissions } from '@/hooks/use-permissions'
import { MODULE_DEFINITIONS, PERMISSION_DEFINITIONS } from '@/lib/rbac/constants'
import { formatPermissionSummary } from '@/lib/rbac/permissions'
import type { ModuleKey } from '@/lib/rbac/types'
import { motion } from 'framer-motion'
import { User, Shield, LayoutGrid, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export default function ProfilePage() {
  const { profile, workspace, memberships } = useWorkspaceStore()
  const { roleName, permissions, isOwner, canViewModule, department, departmentModules } = usePermissions()
  const supabase = createClient()
  const queryClient = useQueryClient()
  const [saving, setSaving] = useState(false)
  const [fullName, setFullName] = useState(profile?.full_name ?? '')

  useEffect(() => {
    if (profile?.full_name) setFullName(profile.full_name)
  }, [profile?.full_name])

  const accessibleModules = useMemo(
    () =>
      MODULE_DEFINITIONS.filter((mod) => {
        if (mod.key === 'settings') return canViewModule('settings')
        if (mod.key in (workspace?.modules ?? {})) {
          const enabled = workspace?.modules[mod.key as keyof typeof workspace.modules]
          return enabled && canViewModule(mod.key as ModuleKey)
        }
        return canViewModule(mod.key as ModuleKey)
      }),
    [workspace?.modules, canViewModule]
  )

  const permissionSummary = useMemo(() => {
    const visiblePermissions = Object.fromEntries(
      Object.entries(permissions).filter(([moduleKey]) =>
        canViewModule(moduleKey as ModuleKey)
      )
    )
    return formatPermissionSummary(visiblePermissions)
  }, [permissions, canViewModule])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!profile?.id) return
    setSaving(true)

    const { error } = await supabase
      .from('profiles')
      .update({ full_name: fullName })
      .eq('id', profile.id)

    if (error) {
      toast.error('Failed to update profile')
    } else {
      toast.success('Profile updated')
      queryClient.invalidateQueries({ queryKey: ['profile'] })
    }
    setSaving(false)
  }

  if (!profile || !workspace) return null

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="page-title">My Profile</h1>
        <p className="page-subtitle">Your account, role, and access within {profile.business_name}</p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="ai-card border border-border-primary p-6 mb-6"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 bg-accent-muted flex items-center justify-center">
            <User size={16} className="text-accent" />
          </div>
          <h2 className="font-semibold">Basic information</h2>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">Full name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="form-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">Email</label>
            <input type="email" value={profile.email} disabled className="form-field opacity-60 cursor-not-allowed" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">Organization</label>
              <input type="text" value={profile.business_name} disabled className="form-field opacity-60 cursor-not-allowed" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">Account type</label>
              <input type="text" value={isOwner ? 'Workspace owner' : 'Team member'} disabled className="form-field opacity-60 cursor-not-allowed" />
            </div>
          </div>
          <button type="submit" disabled={saving} className="btn-primary">
            {saving && <Loader2 size={14} className="animate-spin" />}
            Save changes
          </button>
        </form>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="ai-card border border-border-primary p-6 mb-6"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-accent-muted flex items-center justify-center">
            <Shield size={16} className="text-accent" />
          </div>
          <div>
            <h2 className="font-semibold">Role & permissions</h2>
            <p className="text-sm text-text-secondary">
              Assigned role: <span className="text-text-primary">{roleName}</span>
              {!isOwner && department ? (
                <>
                  {' '}
                  · Department: <span className="text-text-primary">{department}</span>
                </>
              ) : null}
            </p>
            {!isOwner && departmentModules.length > 0 ? (
              <p className="text-xs text-text-tertiary mt-1">
                Department modules: {departmentModules.join(', ').replace(/_/g, ' ')}
              </p>
            ) : null}
          </div>
        </div>

        {permissionSummary.length > 0 ? (
          <div className="space-y-2">
            {permissionSummary.map((line) => (
              <div key={line} className="px-3 py-2 text-sm bg-bg-tertiary border border-border-primary text-text-secondary">
                {line}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-text-tertiary">No module permissions assigned.</p>
        )}

        <p className="text-[11px] text-text-muted mt-4">
          Permissions: {PERMISSION_DEFINITIONS.map((p) => p.label).join(', ')}
        </p>
      </motion.div>

      {memberships.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="ai-card border border-border-primary p-6 mb-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-accent-muted flex items-center justify-center">
              <LayoutGrid size={16} className="text-accent" />
            </div>
            <h2 className="font-semibold">Your organizations</h2>
          </div>
          <div className="space-y-2">
            {memberships.map((m) => (
              <div
                key={m.workspace_id}
                className={`px-3 py-2.5 border text-sm ${
                  m.workspace_id === workspace?.id
                    ? 'border-accent/40 bg-accent/5 text-text-primary'
                    : 'border-border-primary bg-bg-tertiary text-text-secondary'
                }`}
              >
                <p className="font-medium">{m.business_name}</p>
                <p className="text-xs text-text-tertiary mt-0.5">
                  {m.membership_type === 'owner' ? 'Owner' : m.role_name} · {m.business_type}
                  {m.workspace_id === workspace?.id ? ' · Current' : ''}
                </p>
              </div>
            ))}
          </div>
          <p className="text-xs text-text-muted mt-3">Switch organizations from the sidebar menu.</p>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="ai-card border border-border-primary p-6"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-accent-muted flex items-center justify-center">
            <LayoutGrid size={16} className="text-accent" />
          </div>
          <h2 className="font-semibold">Accessible modules (current org)</h2>
        </div>

        <div className="flex flex-wrap gap-2">
          {accessibleModules.map((mod) => (
            <span key={mod.key} className="px-3 py-1.5 text-sm border border-border-primary bg-bg-tertiary text-text-primary">
              {mod.label}
            </span>
          ))}
          {accessibleModules.length === 0 && (
            <p className="text-sm text-text-tertiary">No modules are currently accessible with your role.</p>
          )}
        </div>
      </motion.div>
    </div>
  )
}
