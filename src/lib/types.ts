export interface Profile {
  id: string
  email: string
  full_name: string
  business_name: string
  avatar_url: string | null
  onboarding_completed: boolean
  created_at: string
}

export interface WorkspaceConfig {
  id: string
  user_id: string
  business_type: string
  modules: {
    dashboard: boolean
    hr: boolean
    inventory: boolean
    finance: boolean
    supply_chain: boolean
    crm: boolean
  }
  dashboard_metrics: DashboardMetric[]
  departments: string[]
  shifts: Shift[] | null
  product_categories: string[] | null
  service_types: string[] | null
  roles: RoleSuggestion[]
  setup_checklist: ChecklistItem[]
  created_at: string
}

export interface DashboardMetric {
  id: string
  name: string
  description: string
  type: 'number' | 'currency' | 'percentage' | 'ratio'
  visualization: 'line_chart' | 'bar_chart' | 'area_chart' | 'stat_card' | 'pie_chart' | 'gauge'
  comparison_period: 'day' | 'week' | 'month' | 'year'
  category: 'revenue' | 'operations' | 'hr' | 'inventory' | 'customers' | 'growth' | 'finance' | 'supply_chain'
}

export interface Shift {
  name: string
  start: string
  end: string
}

export interface RoleSuggestion {
  name: string
  description?: string
  is_system?: boolean
  permissions: import('@/lib/rbac/types').ModulePermissionMap
}

export interface ChecklistItem {
  id: string
  title: string
  description: string
  module: string
  priority: number
  completed?: boolean
}

export interface Role {
  id: string
  workspace_id: string
  name: string
  description?: string | null
  is_system?: boolean
  permissions: import('@/lib/rbac/types').ModulePermissionMap
  created_at: string
}

export interface Employee {
  id: string
  workspace_id: string
  user_id: string | null
  full_name: string
  email: string
  phone: string | null
  role_id: string
  department: string
  status: 'active' | 'inactive' | 'on_leave' | 'invited'
  hire_date: string
  salary: number | null
  invite_token?: string | null
  invited_at?: string | null
  accepted_at?: string | null
  created_at: string
}

export interface Product {
  id: string
  workspace_id: string
  name: string
  sku: string
  category: string
  quantity: number
  unit_price: number
  cost_price: number
  min_stock_level: number
  status: 'in_stock' | 'low_stock' | 'out_of_stock'
  created_at: string
}

export interface Transaction {
  id: string
  workspace_id: string
  type: 'revenue' | 'expense'
  category: string
  amount: number
  description: string
  date: string
  reference: string | null
  created_at: string
}

export interface Supplier {
  id: string
  workspace_id: string
  name: string
  contact_person: string
  email: string
  phone: string
  address: string | null
  status: 'active' | 'inactive'
  created_at: string
}

export interface PurchaseOrder {
  id: string
  workspace_id: string
  supplier_id: string
  order_number: string
  status: 'pending' | 'approved' | 'shipped' | 'delivered' | 'cancelled'
  total_amount: number
  order_date: string
  expected_delivery: string | null
  items: PurchaseOrderItem[]
  created_at: string
}

export interface PurchaseOrderItem {
  product_id: string
  product_name: string
  quantity: number
  unit_price: number
}

export interface Customer {
  id: string
  workspace_id: string
  name: string
  email: string
  phone: string | null
  company: string | null
  status: 'active' | 'inactive' | 'lead'
  total_spent: number
  last_interaction: string | null
  notes: string | null
  created_at: string
}

export interface Attendance {
  id: string
  workspace_id: string
  employee_id: string
  date: string
  check_in: string | null
  check_out: string | null
  status: 'present' | 'absent' | 'late' | 'half_day'
  created_at: string
}

export interface LeaveRequest {
  id: string
  workspace_id: string
  employee_id: string
  type: 'annual' | 'sick' | 'personal' | 'unpaid'
  start_date: string
  end_date: string
  reason: string
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
}

export type TimePeriod = 'today' | 'week' | 'month' | 'year' | 'all'
