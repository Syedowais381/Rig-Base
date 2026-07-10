'use client'

import { MODULE_DEFINITIONS, PERMISSION_DEFINITIONS } from '@/lib/rbac/constants'
import type { ModuleKey, ModulePermissionMap, PermissionKey, WorkspaceModules } from '@/lib/rbac/types'

type PermissionMatrixProps = {
  value: ModulePermissionMap
  onChange: (next: ModulePermissionMap) => void
  enabledModules: WorkspaceModules
  readOnly?: boolean
  includeSettings?: boolean
}

export function PermissionMatrix({
  value,
  onChange,
  enabledModules,
  readOnly = false,
  includeSettings = true,
}: PermissionMatrixProps) {
  const visibleModules = MODULE_DEFINITIONS.filter((mod) => {
    if (mod.key === 'settings') return includeSettings
    return enabledModules[mod.key as keyof WorkspaceModules]
  })

  function toggle(module: ModuleKey, permission: PermissionKey) {
    if (readOnly) return
    const modulePerms = { ...value[module] }
    modulePerms[permission] = !modulePerms[permission]
    onChange({ ...value, [module]: modulePerms })
  }

  function toggleRow(module: ModuleKey, enabled: boolean) {
    if (readOnly) return
    const modulePerms = Object.fromEntries(
      PERMISSION_DEFINITIONS.map((p) => [p.key, enabled])
    ) as Record<PermissionKey, boolean>
    onChange({ ...value, [module]: modulePerms })
  }

  return (
    <div className="border border-border-primary overflow-x-auto">
      <table className="w-full min-w-[720px] text-sm">
        <thead>
          <tr className="border-b border-border-primary bg-bg-tertiary/40">
            <th className="text-left px-3 py-2.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-text-tertiary">
              Module
            </th>
            {PERMISSION_DEFINITIONS.map((perm) => (
              <th
                key={perm.key}
                className="px-2 py-2.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-text-tertiary text-center"
                title={perm.description}
              >
                {perm.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {visibleModules.map((mod) => {
            const row = value[mod.key] ?? {}
            const allEnabled = PERMISSION_DEFINITIONS.every((p) => row[p.key])
            return (
              <tr key={mod.key} className="border-b border-border-primary last:border-0">
                <td className="px-3 py-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-text-primary">{mod.label}</span>
                    {!readOnly && (
                      <button
                        type="button"
                        onClick={() => toggleRow(mod.key, !allEnabled)}
                        className="text-[10px] uppercase tracking-wide text-accent hover:text-accent-hover"
                      >
                        {allEnabled ? 'Clear' : 'All'}
                      </button>
                    )}
                  </div>
                </td>
                {PERMISSION_DEFINITIONS.map((perm) => (
                  <td key={perm.key} className="px-2 py-2.5 text-center">
                    <input
                      type="checkbox"
                      checked={Boolean(row[perm.key])}
                      disabled={readOnly}
                      onChange={() => toggle(mod.key, perm.key)}
                      className="accent-[#c5a059] cursor-pointer disabled:cursor-not-allowed"
                      aria-label={`${mod.label} ${perm.label}`}
                    />
                  </td>
                ))}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
