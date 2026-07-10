'use client'

import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { Building2, Check, ChevronDown, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useWorkspaceStore } from '@/store/workspace'
import type { WorkspaceMembership } from '@/lib/workspace-access'

type WorkspaceSwitcherProps = {
  memberships: WorkspaceMembership[]
  collapsed?: boolean
}

export function WorkspaceSwitcher({ memberships, collapsed }: WorkspaceSwitcherProps) {
  const [open, setOpen] = useState(false)
  const [switching, setSwitching] = useState(false)
  const { workspace, setWorkspace } = useWorkspaceStore()
  const queryClient = useQueryClient()
  const router = useRouter()

  if (memberships.length <= 1) {
    if (collapsed || !workspace) return null
    return (
      <div className="px-3 py-2 mb-2 border border-border-primary bg-bg-tertiary/40">
        <p className="text-[10px] uppercase tracking-wide text-text-muted mb-0.5">Organization</p>
        <p className="text-xs font-medium truncate text-text-primary">
          {memberships[0]?.business_name ?? workspace.business_type}
        </p>
      </div>
    )
  }

  const active =
    memberships.find((m) => m.workspace_id === workspace?.id) ??
    memberships.find((m) => m.is_active) ??
    memberships[0]

  async function handleSwitch(workspaceId: string) {
    if (workspaceId === workspace?.id) {
      setOpen(false)
      return
    }

    setSwitching(true)
    try {
      const res = await fetch('/api/workspaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspaceId }),
      })
      const payload = await res.json()
      if (!res.ok) throw new Error(payload.error ?? 'Failed to switch organization')

      setWorkspace(payload.workspace)
      await queryClient.invalidateQueries()
      setOpen(false)
      toast.success(`Switched to ${payload.workspace.business_type}`)
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to switch')
    } finally {
      setSwitching(false)
    }
  }

  return (
    <div className="relative px-2 mb-2">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={switching}
        className={`w-full flex items-center gap-2 border border-border-primary bg-bg-tertiary/40 hover:bg-bg-tertiary transition-colors ${
          collapsed ? 'justify-center p-2' : 'px-3 py-2.5'
        }`}
        aria-label="Switch organization"
      >
        <Building2 size={16} className="text-accent shrink-0" />
        {!collapsed && (
          <>
            <div className="min-w-0 flex-1 text-left">
              <p className="text-[10px] uppercase tracking-wide text-text-muted">Organization</p>
              <p className="text-xs font-medium truncate text-text-primary">{active.business_name}</p>
              <p className="text-[10px] text-text-tertiary truncate">
                {active.membership_type === 'owner' ? 'Owner' : active.role_name}
              </p>
            </div>
            {switching ? (
              <Loader2 size={14} className="animate-spin shrink-0" />
            ) : (
              <ChevronDown size={14} className={`shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
            )}
          </>
        )}
      </button>

      {open && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-30 cursor-default"
            aria-label="Close organization menu"
            onClick={() => setOpen(false)}
          />
          <div className="absolute left-2 right-2 top-full mt-1 z-40 border border-border-primary bg-bg-secondary shadow-lg max-h-64 overflow-y-auto">
            {memberships.map((m) => {
              const isCurrent = m.workspace_id === workspace?.id
              return (
                <button
                  key={m.workspace_id}
                  type="button"
                  onClick={() => handleSwitch(m.workspace_id)}
                  className={`w-full flex items-start gap-2 px-3 py-2.5 text-left hover:bg-bg-tertiary transition-colors ${
                    isCurrent ? 'bg-accent/5' : ''
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium truncate text-text-primary">{m.business_name}</p>
                    <p className="text-[10px] text-text-tertiary truncate">
                      {m.membership_type === 'owner' ? 'Your organization' : m.role_name} · {m.business_type}
                    </p>
                  </div>
                  {isCurrent && <Check size={14} className="text-accent shrink-0 mt-0.5" />}
                </button>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
