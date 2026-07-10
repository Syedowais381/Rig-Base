'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useWorkspaceStore } from '@/store/workspace'
import { EmptyState } from '@/components/ui/empty-state'
import { Modal } from '@/components/ui/modal'
import { ConfirmDeleteModal } from '@/components/ui/confirm-delete-modal'
import { FilterableDataTable } from '@/components/ui/filterable-data-table'
import { RowActions, actionsColumn } from '@/components/ui/row-actions'
import { TablePagination } from '@/components/ui/table-pagination'
import { TableToolbar } from '@/components/ui/table-toolbar'
import { matchesSearch, useTableControls } from '@/hooks/use-table-controls'
import { Users, Plus, UserPlus, Shield, Pencil, Mail, Copy, Check } from 'lucide-react'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import type { Employee, Role } from '@/lib/types'
import { ModuleImport } from '@/components/import/module-import'
import { ThemeSelect } from '@/components/ui/theme-select'
import { ModuleAccessGuard } from '@/components/rbac/module-access-guard'
import { PermissionGate } from '@/components/rbac/permission-gate'
import { RolePermissionsForm } from '@/components/rbac/role-permissions-form'
import { usePermissions } from '@/hooks/use-permissions'
import {
  countEnabledPermissions,
  formatPermissionSummary,
  normalizeRolePermissions,
} from '@/lib/rbac/permissions'
import type { ModulePermissionMap } from '@/lib/rbac/types'

export default function HRPage() {
  const [showAddEmployee, setShowAddEmployee] = useState(false)
  const [editing, setEditing] = useState<Employee | null>(null)
  const [deleting, setDeleting] = useState<Employee | null>(null)
  const [editingRole, setEditingRole] = useState<Role | null>(null)
  const [activeTab, setActiveTab] = useState<'employees' | 'roles'>('employees')
  const [copiedInviteId, setCopiedInviteId] = useState<string | null>(null)
  const { workspace } = useWorkspaceStore()
  const { can, canManageRoles, isOwner } = usePermissions()

  const canInviteEmployees = isOwner || can('hr', 'manage') || can('settings', 'manage') || can('hr', 'create')
  const supabase = createClient()
  const queryClient = useQueryClient()

  const { data: employees = [] } = useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      const { data } = await supabase
        .from('employees')
        .select('*')
        .eq('workspace_id', workspace?.id)
        .order('created_at', { ascending: false })
      return (data || []) as Employee[]
    },
    enabled: !!workspace?.id,
  })

  const { data: roles = [] } = useQuery({
    queryKey: ['roles'],
    queryFn: async () => {
      const { data } = await supabase
        .from('roles')
        .select('*')
        .eq('workspace_id', workspace?.id)
      return (data || []).map((role) => ({
        ...(role as Role),
        permissions: normalizeRolePermissions((role as Role).permissions),
      })) as Role[]
    },
    enabled: !!workspace?.id,
  })

  const addEmployee = useMutation({
    mutationFn: async (employee: Partial<Employee>) => {
      const { error } = await supabase.from('employees').insert({
        ...employee,
        workspace_id: workspace?.id,
      })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] })
      setShowAddEmployee(false)
      toast.success('Employee added')
    },
    onError: () => toast.error('Failed to add employee'),
  })

  const updateEmployee = useMutation({
    mutationFn: async ({ id, ...employee }: Partial<Employee> & { id: string }) => {
      const { error } = await supabase
        .from('employees')
        .update(employee)
        .eq('id', id)
        .eq('workspace_id', workspace?.id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] })
      setEditing(null)
      toast.success('Employee updated')
    },
    onError: () => toast.error('Failed to update employee'),
  })

  const deleteEmployee = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('employees')
        .delete()
        .eq('id', id)
        .eq('workspace_id', workspace?.id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] })
      setDeleting(null)
      toast.success('Employee deleted')
    },
    onError: () => toast.error('Failed to delete employee'),
  })

  const sendInvite = useMutation({
    mutationFn: async (employeeId: string) => {
      const res = await fetch(`/api/employees/${employeeId}/invite`, { method: 'POST' })
      const payload = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(payload.error ?? 'Failed to send invite')
      return payload as { inviteUrl: string; emailSent: boolean; emailError?: string | null }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['employees'] })
      if (data.emailSent) {
        toast.success('Invitation email sent')
      } else if (data.emailError) {
        toast.error(data.emailError)
        navigator.clipboard.writeText(data.inviteUrl).catch(() => undefined)
        toast.message('Invite link copied as fallback')
      } else {
        navigator.clipboard.writeText(data.inviteUrl).catch(() => undefined)
        toast.success('Invite link copied to clipboard')
      }
    },
    onError: (error: Error) => toast.error(error.message),
  })

  async function copyInviteLink(employee: Employee) {
    if (!employee.invite_token) return
    const url = `${window.location.origin}/auth/invite?token=${employee.invite_token}`
    try {
      await navigator.clipboard.writeText(url)
      setCopiedInviteId(employee.id)
      toast.success('Invite link copied')
      setTimeout(() => setCopiedInviteId(null), 2000)
    } catch {
      toast.error('Could not copy link')
    }
  }

  const assignableRoles = useMemo(
    () => roles.filter((r) => r.name !== 'Owner'),
    [roles]
  )

  const updateRole = useMutation({
    mutationFn: async ({ id, permissions }: { id: string; permissions: ModulePermissionMap }) => {
      const res = await fetch(`/api/roles/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ permissions }),
      })
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}))
        throw new Error(payload.error ?? 'Failed to update role')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] })
      setEditingRole(null)
      toast.success('Role permissions updated')
    },
    onError: (error: Error) => toast.error(error.message),
  })

  const employeeFilters = useMemo(
    () => [
      {
        id: 'department',
        label: 'Department',
        options: (workspace?.departments ?? []).map((d) => ({ value: d, label: d })),
      },
      {
        id: 'status',
        label: 'Status',
        options: [
          { value: 'active', label: 'Active' },
          { value: 'invited', label: 'Invited' },
          { value: 'inactive', label: 'Inactive' },
          { value: 'on_leave', label: 'On leave' },
        ],
      },
      {
        id: 'role',
        label: 'Role',
        options: roles.map((r) => ({ value: r.id, label: r.name })),
      },
    ],
    [workspace?.departments, roles]
  )

  const filterEmployees = useCallback(
    (employee: Employee, ctx: { search: string; filters: Record<string, string> }) => {
      const roleName = roles.find((r) => r.id === employee.role_id)?.name ?? ''
      const haystack = [employee.full_name, employee.email, employee.phone, employee.department, roleName].join(' ')
      if (!matchesSearch(haystack, ctx.search)) return false
      if (ctx.filters.department !== 'all' && employee.department !== ctx.filters.department) return false
      if (ctx.filters.status !== 'all' && employee.status !== ctx.filters.status) return false
      if (ctx.filters.role !== 'all' && employee.role_id !== ctx.filters.role) return false
      return true
    },
    [roles]
  )

  const rolesControls = useTableControls(roles, {
    pageSize: 9,
    filterFn: (role, ctx) =>
      matchesSearch(
        [role.name, role.description ?? '', ...formatPermissionSummary(role.permissions)].join(' '),
        ctx.search
      ),
  })

  const employeeColumns = [
    { key: 'full_name', header: 'Name' },
    { key: 'email', header: 'Email' },
    {
      key: 'role_id',
      header: 'Role',
      cellClass: 'table-cell-secondary',
      render: (item: Employee) => roles.find((r) => r.id === item.role_id)?.name ?? '—',
    },
    { key: 'department', header: 'Department', cellClass: 'table-cell-secondary' },
    {
      key: 'status',
      header: 'Status',
      render: (item: Employee) => (
        <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full ${
          item.user_id ? 'bg-success/10 text-success' :
          item.status === 'invited' ? 'bg-accent/10 text-accent' :
          item.status === 'active' ? 'bg-success/10 text-success' :
          item.status === 'on_leave' ? 'bg-warning/10 text-warning' :
          'bg-bg-tertiary text-text-tertiary'
        }`}>
          {item.user_id ? 'Linked' : item.status === 'invited' ? 'Invited' : item.status.replace('_', ' ')}
        </span>
      ),
    },
    { key: 'hire_date', header: 'Hire Date', cellClass: 'table-cell-date' },
    actionsColumn<Employee>((item) => (
      <div className="flex items-center gap-1">
        {canInviteEmployees && !item.user_id && (
          item.status === 'invited' && item.invite_token ? (
            <button
              type="button"
              onClick={() => copyInviteLink(item)}
              className="p-1.5 text-text-tertiary hover:text-accent hover:bg-accent/10 transition-colors"
              aria-label={`Copy invite link for ${item.full_name}`}
              title="Copy invite link"
            >
              {copiedInviteId === item.id ? <Check size={15} /> : <Copy size={15} />}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => sendInvite.mutate(item.id)}
              disabled={sendInvite.isPending}
              className="p-1.5 text-text-tertiary hover:text-accent hover:bg-accent/10 transition-colors"
              aria-label={`Send invite to ${item.full_name}`}
              title="Send invite"
            >
              <Mail size={15} />
            </button>
          )
        )}
        {(can('hr', 'edit') || can('hr', 'delete')) && (
          <RowActions
            onEdit={can('hr', 'edit') ? () => setEditing(item) : undefined}
            onDelete={can('hr', 'delete') ? () => setDeleting(item) : undefined}
            editLabel={`Edit ${item.full_name}`}
            deleteLabel={`Delete ${item.full_name}`}
          />
        )}
      </div>
    )),
  ]

  return (
    <ModuleAccessGuard module="hr" label="Human Resources">
    <div className="max-w-7xl mx-auto">
      <div className="page-header">
        <div>
          <h1 className="page-title">Human Resources</h1>
          <p className="page-subtitle">Manage your team, roles, and attendance</p>
        </div>
        <div className="page-header-actions">
          <PermissionGate module="hr" permission="import">
            <ModuleImport module="hr" entity="employees" />
          </PermissionGate>
          <PermissionGate module="hr" permission="create">
            {can('hr', 'create') && (
            <button type="button" onClick={() => setShowAddEmployee(true)} className="btn-primary">
              <Plus size={16} />
              Add Employee
            </button>
            )}
          </PermissionGate>
        </div>
      </div>

      <div className="tab-bar">
        <button type="button" data-active={activeTab === 'employees' ? 'true' : 'false'} onClick={() => setActiveTab('employees')}>
          <Users size={16} />
          Employees ({employees.length})
        </button>
        <button type="button" data-active={activeTab === 'roles' ? 'true' : 'false'} onClick={() => setActiveTab('roles')}>
          <Shield size={16} />
          Roles ({roles.length})
        </button>
      </div>

      {activeTab === 'employees' && (
        <>
          {employees.length === 0 ? (
            <EmptyState
              icon={UserPlus}
              title="No employees yet"
              description="Add your first team member to start managing your workforce. Assign roles, track attendance, and manage leave requests."
              action={{ label: 'Add first employee', onClick: () => setShowAddEmployee(true) }}
            />
          ) : (
            <FilterableDataTable
              columns={employeeColumns}
              data={employees}
              searchPlaceholder="Search by name, email, department, or role…"
              filters={employeeFilters}
              customFilter={filterEmployees}
              pageSize={10}
              rowKey={(item) => item.id}
              emptyFilteredMessage="No employees match your search or filters."
            />
          )}
        </>
      )}

      {activeTab === 'roles' && (
        <>
          {roles.length === 0 ? (
            <EmptyState
              icon={Shield}
              title="No roles yet"
              description="Roles are created during workspace setup. Complete onboarding or add roles to assign permissions."
            />
          ) : (
            <>
              <TableToolbar
                search={rolesControls.search}
                onSearchChange={rolesControls.setSearch}
                searchPlaceholder="Search roles or permissions…"
                onClear={rolesControls.clearFilters}
                hasActiveFilters={rolesControls.hasActiveFilters}
                filteredCount={rolesControls.filteredCount}
                totalCount={rolesControls.totalCount}
              />
              {rolesControls.filteredCount === 0 ? (
                <div className="ai-card border border-border-primary px-6 py-12 text-center text-sm text-text-secondary">
                  No roles match your search.
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {rolesControls.paginatedData.map((role) => {
                      const summaries = formatPermissionSummary(role.permissions).slice(0, 4)
                      const permissionCount = countEnabledPermissions(role.permissions)
                      const isOwnerRole = role.name === 'Owner'

                      return (
                      <motion.div key={role.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="ai-card border border-border-primary p-5 flex flex-col">
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-8 h-8 bg-accent-muted flex items-center justify-center shrink-0">
                              <Shield size={16} className="text-accent" />
                            </div>
                            <div className="min-w-0">
                              <h3 className="font-medium truncate">{role.name}</h3>
                              {role.is_system && (
                                <p className="text-[10px] uppercase tracking-wide text-text-tertiary mt-0.5">System role</p>
                              )}
                            </div>
                          </div>
                          {canManageRoles() && !isOwnerRole && (
                            <button
                              type="button"
                              onClick={() => setEditingRole(role)}
                              className="p-1.5 text-text-tertiary hover:text-accent hover:bg-accent/10 transition-colors shrink-0"
                              aria-label={`Edit ${role.name} permissions`}
                            >
                              <Pencil size={15} />
                            </button>
                          )}
                        </div>
                        {role.description && (
                          <p className="text-xs text-text-secondary mb-3 line-clamp-2">{role.description}</p>
                        )}
                        <p className="text-[11px] text-text-tertiary mb-2">{permissionCount} permissions enabled</p>
                        <div className="flex flex-wrap gap-1.5 mt-auto">
                          {summaries.map((summary) => (
                            <span key={summary} className="px-2 py-0.5 text-xs bg-bg-tertiary border border-border-primary text-text-secondary">
                              {summary}
                            </span>
                          ))}
                          {formatPermissionSummary(role.permissions).length > 4 && (
                            <span className="px-2 py-0.5 text-xs text-text-tertiary">
                              +{formatPermissionSummary(role.permissions).length - 4} more
                            </span>
                          )}
                        </div>
                      </motion.div>
                    )})}
                  </div>
                  <TablePagination
                    page={rolesControls.page}
                    totalPages={rolesControls.totalPages}
                    rangeStart={rolesControls.rangeStart}
                    rangeEnd={rolesControls.rangeEnd}
                    filteredCount={rolesControls.filteredCount}
                    onPageChange={rolesControls.setPage}
                  />
                </>
              )}
            </>
          )}
        </>
      )}

      <Modal open={showAddEmployee} onClose={() => setShowAddEmployee(false)} title="Add Employee">
        <EmployeeForm
          departments={workspace?.departments || []}
          roles={assignableRoles}
          onSubmit={(data) => addEmployee.mutate(data)}
          loading={addEmployee.isPending}
        />
      </Modal>

      <Modal open={!!editing} onClose={() => setEditing(null)} title="Edit Employee">
        {editing && (
          <EmployeeForm
            key={editing.id}
            initial={editing}
            departments={workspace?.departments || []}
            roles={assignableRoles}
            onSubmit={(data) => updateEmployee.mutate({ id: editing.id, ...data })}
            loading={updateEmployee.isPending}
            submitLabel="Save changes"
          />
        )}
      </Modal>

      <ConfirmDeleteModal
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleting && deleteEmployee.mutate(deleting.id)}
        title="Delete employee"
        description="This will permanently remove the employee record from your workspace."
        entityName={deleting?.full_name}
        loading={deleteEmployee.isPending}
      />

      <Modal
        open={!!editingRole}
        onClose={() => setEditingRole(null)}
        title={`Edit permissions — ${editingRole?.name ?? ''}`}
      >
        {editingRole && workspace && (
          <RolePermissionsForm
            key={editingRole.id}
            role={editingRole}
            enabledModules={workspace.modules}
            loading={updateRole.isPending}
            onSubmit={(permissions) => updateRole.mutate({ id: editingRole.id, permissions })}
          />
        )}
      </Modal>
    </div>
    </ModuleAccessGuard>
  )
}

function EmployeeForm({
  departments,
  roles,
  initial,
  onSubmit,
  loading,
  submitLabel = 'Add Employee',
}: {
  departments: string[]
  roles: Role[]
  initial?: Employee
  onSubmit: (data: Partial<Employee>) => void
  loading: boolean
  submitLabel?: string
}) {
  const [form, setForm] = useState({
    full_name: initial?.full_name ?? '',
    email: initial?.email ?? '',
    phone: initial?.phone ?? '',
    department: initial?.department ?? departments[0] ?? '',
    role_id: initial?.role_id ?? roles[0]?.id ?? '',
    hire_date: initial?.hire_date ?? new Date().toISOString().split('T')[0],
    salary: initial?.salary != null ? String(initial.salary) : '',
    status: (initial?.status ?? 'active') as Employee['status'],
  })

  useEffect(() => {
    if (!initial) return
    setForm({
      full_name: initial.full_name,
      email: initial.email,
      phone: initial.phone ?? '',
      department: initial.department,
      role_id: initial.role_id,
      hire_date: initial.hire_date,
      salary: initial.salary != null ? String(initial.salary) : '',
      status: initial.status,
    })
  }, [initial])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSubmit({
      ...form,
      salary: form.salary ? Number(form.salary) : null,
      status: form.status,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-1.5">Full name</label>
        <input type="text" required value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} className="form-field" />
      </div>
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-1.5">Email</label>
        <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="form-field" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1.5">Phone</label>
          <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="form-field" />
        </div>
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1.5">Hire date</label>
          <input type="date" required value={form.hire_date} onChange={(e) => setForm({ ...form, hire_date: e.target.value })} className="form-field" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1.5">Department</label>
          <ThemeSelect
            variant="form"
            value={form.department}
            onChange={(department) => setForm({ ...form, department })}
            options={departments.map((d) => ({ value: d, label: d }))}
            aria-label="Department"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1.5">Role</label>
          <ThemeSelect
            variant="form"
            value={form.role_id}
            onChange={(role_id) => setForm({ ...form, role_id })}
            options={roles.map((r) => ({ value: r.id, label: r.name }))}
            aria-label="Role"
          />
        </div>
      </div>
      {initial && (
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1.5">Status</label>
          <ThemeSelect
            variant="form"
            value={form.status}
            onChange={(status) => setForm({ ...form, status: status as Employee['status'] })}
            options={[
              { value: 'active', label: 'Active' },
              { value: 'invited', label: 'Invited' },
              { value: 'on_leave', label: 'On leave' },
              { value: 'inactive', label: 'Inactive' },
            ]}
            aria-label="Status"
          />
        </div>
      )}
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-1.5">Salary</label>
        <input type="number" value={form.salary} onChange={(e) => setForm({ ...form, salary: e.target.value })} className="form-field" placeholder="Optional" />
      </div>
      <button type="submit" disabled={loading} className="form-submit">
        {loading ? 'Saving...' : submitLabel}
      </button>
    </form>
  )
}
