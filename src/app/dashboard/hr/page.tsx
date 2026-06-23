'use client'

import { useCallback, useMemo, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useWorkspaceStore } from '@/store/workspace'
import { EmptyState } from '@/components/ui/empty-state'
import { Modal } from '@/components/ui/modal'
import { FilterableDataTable } from '@/components/ui/filterable-data-table'
import { TablePagination } from '@/components/ui/table-pagination'
import { TableToolbar } from '@/components/ui/table-toolbar'
import { matchesSearch, useTableControls } from '@/hooks/use-table-controls'
import { Users, Plus, UserPlus, Shield } from 'lucide-react'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import type { Employee, Role } from '@/lib/types'
import { ModuleImport } from '@/components/import/module-import'

export default function HRPage() {
  const [showAddEmployee, setShowAddEmployee] = useState(false)
  const [activeTab, setActiveTab] = useState<'employees' | 'roles'>('employees')
  const { workspace } = useWorkspaceStore()
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
      return (data || []) as Role[]
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
      setShowAddEmployee(false)
      toast.success('Employee added')
    },
    onError: () => toast.error('Failed to add employee'),
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
        [role.name, ...Object.entries(role.permissions).filter(([, v]) => v).map(([p]) => p)].join(' '),
        ctx.search
      ),
  })

  const employeeColumns = [
    { key: 'full_name', header: 'Name' },
    { key: 'email', header: 'Email' },
    {
      key: 'role_id',
      header: 'Role',
      render: (item: Employee) => roles.find((r) => r.id === item.role_id)?.name ?? '—',
    },
    { key: 'department', header: 'Department' },
    {
      key: 'status',
      header: 'Status',
      render: (item: Employee) => (
        <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full ${
          item.status === 'active' ? 'bg-success/10 text-success' :
          item.status === 'on_leave' ? 'bg-warning/10 text-warning' :
          'bg-bg-tertiary text-text-tertiary'
        }`}>
          {item.status}
        </span>
      ),
    },
    { key: 'hire_date', header: 'Hire Date' },
  ]

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6 ai-panel rounded-2xl p-6">
        <div>
          <h1 className="text-2xl font-semibold">Human Resources</h1>
          <p className="text-text-secondary text-sm mt-1">
            Manage your team, roles, and attendance
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ModuleImport module="hr" entity="employees" />
          <button
            onClick={() => setShowAddEmployee(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-accent to-[#2f78ff] hover:to-[#4990ff] text-white text-sm font-medium rounded-lg transition-colors ai-glow"
          >
            <Plus size={16} />
            Add Employee
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-bg-secondary/90 border border-border-primary rounded-lg w-fit mb-6">
        <button
          onClick={() => setActiveTab('employees')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            activeTab === 'employees' ? 'bg-gradient-to-r from-accent to-[#2f78ff] text-white' : 'text-text-secondary hover:text-text-primary hover:bg-bg-tertiary/70'
          }`}
        >
          <Users size={16} />
          Employees ({employees.length})
        </button>
        <button
          onClick={() => setActiveTab('roles')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            activeTab === 'roles' ? 'bg-gradient-to-r from-accent to-[#2f78ff] text-white' : 'text-text-secondary hover:text-text-primary hover:bg-bg-tertiary/70'
          }`}
        >
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
                <div className="ai-card border border-border-primary rounded-xl px-6 py-12 text-center text-sm text-text-secondary">
                  No roles match your search.
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {rolesControls.paginatedData.map((role) => (
                      <motion.div
                        key={role.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="ai-card border border-border-primary rounded-xl p-5"
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-8 h-8 bg-accent-muted rounded-lg flex items-center justify-center">
                            <Shield size={16} className="text-accent" />
                          </div>
                          <h3 className="font-medium">{role.name}</h3>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {Object.entries(role.permissions)
                            .filter(([, v]) => v)
                            .map(([perm]) => (
                              <span
                                key={perm}
                                className="px-2 py-0.5 text-xs bg-bg-tertiary border border-border-primary rounded-md text-text-secondary"
                              >
                                {perm.replace(/_/g, ' ')}
                              </span>
                            ))}
                        </div>
                      </motion.div>
                    ))}
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

      {/* Add Employee Modal */}
      <Modal open={showAddEmployee} onClose={() => setShowAddEmployee(false)} title="Add Employee">
        <EmployeeForm
          departments={workspace?.departments || []}
          roles={roles}
          onSubmit={(data) => addEmployee.mutate(data)}
          loading={addEmployee.isPending}
        />
      </Modal>
    </div>
  )
}

function EmployeeForm({
  departments,
  roles,
  onSubmit,
  loading,
}: {
  departments: string[]
  roles: Role[]
  onSubmit: (data: Partial<Employee>) => void
  loading: boolean
}) {
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    department: departments[0] || '',
    role_id: roles[0]?.id || '',
    hire_date: new Date().toISOString().split('T')[0],
    salary: '',
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSubmit({
      ...form,
      salary: form.salary ? Number(form.salary) : null,
      status: 'active',
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-1.5">Full name</label>
        <input
          type="text"
          required
          value={form.full_name}
          onChange={(e) => setForm({ ...form, full_name: e.target.value })}
          className="w-full px-3 py-2.5 bg-bg-tertiary border border-border-primary rounded-lg"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-1.5">Email</label>
        <input
          type="email"
          required
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className="w-full px-3 py-2.5 bg-bg-tertiary border border-border-primary rounded-lg"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1.5">Phone</label>
          <input
            type="tel"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className="w-full px-3 py-2.5 bg-bg-tertiary border border-border-primary rounded-lg"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1.5">Hire date</label>
          <input
            type="date"
            required
            value={form.hire_date}
            onChange={(e) => setForm({ ...form, hire_date: e.target.value })}
            className="w-full px-3 py-2.5 bg-bg-tertiary border border-border-primary rounded-lg"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1.5">Department</label>
          <select
            value={form.department}
            onChange={(e) => setForm({ ...form, department: e.target.value })}
            className="w-full px-3 py-2.5 bg-bg-tertiary border border-border-primary rounded-lg"
          >
            {departments.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1.5">Role</label>
          <select
            value={form.role_id}
            onChange={(e) => setForm({ ...form, role_id: e.target.value })}
            className="w-full px-3 py-2.5 bg-bg-tertiary border border-border-primary rounded-lg"
          >
            {roles.map((r) => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-1.5">Salary</label>
        <input
          type="number"
          value={form.salary}
          onChange={(e) => setForm({ ...form, salary: e.target.value })}
          className="w-full px-3 py-2.5 bg-bg-tertiary border border-border-primary rounded-lg"
          placeholder="Optional"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full py-2.5 bg-gradient-to-r from-accent to-[#2f78ff] hover:to-[#4990ff] text-white font-medium rounded-lg transition-colors disabled:opacity-50"
      >
        {loading ? 'Adding...' : 'Add Employee'}
      </button>
    </form>
  )
}
