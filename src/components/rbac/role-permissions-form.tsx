'use client'

import { useEffect, useState } from 'react'
import { PermissionMatrix } from '@/components/rbac/permission-matrix'
import { normalizeRolePermissions } from '@/lib/rbac/permissions'
import type { Role } from '@/lib/types'
import type { ModulePermissionMap, WorkspaceModules } from '@/lib/rbac/types'

type RolePermissionsFormProps = {
  role: Role
  enabledModules: WorkspaceModules
  onSubmit: (permissions: ModulePermissionMap) => void
  loading?: boolean
  readOnly?: boolean
}

export function RolePermissionsForm({
  role,
  enabledModules,
  onSubmit,
  loading = false,
  readOnly = false,
}: RolePermissionsFormProps) {
  const [permissions, setPermissions] = useState<ModulePermissionMap>(
    normalizeRolePermissions(role.permissions)
  )

  useEffect(() => {
    setPermissions(normalizeRolePermissions(role.permissions))
  }, [role])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSubmit(permissions)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <p className="text-sm font-medium text-text-primary">{role.name}</p>
        {role.description && (
          <p className="text-xs text-text-secondary mt-1">{role.description}</p>
        )}
      </div>

      <PermissionMatrix
        value={permissions}
        onChange={setPermissions}
        enabledModules={enabledModules}
        readOnly={readOnly}
        includeSettings={role.name === 'Owner' || role.name === 'Administrator'}
      />

      {!readOnly && (
        <button type="submit" disabled={loading} className="form-submit">
          {loading ? 'Saving…' : 'Save permissions'}
        </button>
      )}
    </form>
  )
}
