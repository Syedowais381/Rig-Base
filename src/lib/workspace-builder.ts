import type { OnboardingConfig } from '@/lib/onboarding-config'
import type { BusinessIndustry, OnboardingFormInput } from '@/lib/onboarding-form'

type MetricTemplate = OnboardingConfig['dashboard_metrics'][number]

const ALL_PERMISSIONS = [
  'dashboard_view',
  'dashboard_edit',
  'dashboard_admin',
  'finance_view',
  'finance_edit',
  'finance_admin',
  'inventory_view',
  'inventory_edit',
  'inventory_admin',
  'hr_view',
  'hr_edit',
  'hr_admin',
  'crm_view',
  'crm_edit',
  'crm_admin',
  'supply_chain_view',
  'supply_chain_edit',
  'supply_chain_admin',
] as const

const INDUSTRY_LABELS: Record<BusinessIndustry, string> = {
  restaurant: 'Restaurant',
  retail: 'Retail',
  manufacturing: 'Manufacturing',
  professional_services: 'Professional Services',
  healthcare: 'Healthcare',
  construction: 'Construction',
  logistics: 'Logistics',
  other: 'General Business',
}

const INDUSTRY_METRICS: Record<BusinessIndustry, MetricTemplate[]> = {
  restaurant: [
    { id: 'daily_revenue', name: 'Daily Revenue', description: 'Total revenue generated each day', type: 'currency', visualization: 'line_chart', comparison_period: 'day', category: 'revenue' },
    { id: 'avg_order_value', name: 'Average Order Value', description: 'Average value per customer order', type: 'currency', visualization: 'stat_card', comparison_period: 'day', category: 'revenue' },
    { id: 'table_turnover_rate', name: 'Table Turnover Rate', description: 'Seating cycles per table per service period', type: 'ratio', visualization: 'bar_chart', comparison_period: 'day', category: 'operations' },
    { id: 'food_cost_percentage', name: 'Food Cost %', description: 'Ingredient cost as a share of sales', type: 'percentage', visualization: 'line_chart', comparison_period: 'week', category: 'finance' },
    { id: 'labor_cost_percentage', name: 'Labor Cost %', description: 'Payroll cost as a share of sales', type: 'percentage', visualization: 'line_chart', comparison_period: 'week', category: 'hr' },
    { id: 'inventory_wastage', name: 'Inventory Wastage', description: 'Estimated ingredient wastage over time', type: 'number', visualization: 'area_chart', comparison_period: 'week', category: 'inventory' },
    { id: 'repeat_customer_rate', name: 'Repeat Customer Rate', description: 'Share of returning customers', type: 'percentage', visualization: 'pie_chart', comparison_period: 'month', category: 'customers' },
    { id: 'gross_margin', name: 'Gross Margin', description: 'Revenue minus direct operating costs', type: 'currency', visualization: 'stat_card', comparison_period: 'month', category: 'growth' },
  ],
  retail: [
    { id: 'daily_sales', name: 'Daily Sales', description: 'Total sales revenue per day', type: 'currency', visualization: 'line_chart', comparison_period: 'day', category: 'revenue' },
    { id: 'units_sold', name: 'Units Sold', description: 'Total product units sold', type: 'number', visualization: 'bar_chart', comparison_period: 'day', category: 'operations' },
    { id: 'avg_basket_size', name: 'Average Basket Size', description: 'Average transaction value', type: 'currency', visualization: 'stat_card', comparison_period: 'day', category: 'revenue' },
    { id: 'inventory_turnover', name: 'Inventory Turnover', description: 'How quickly stock is sold and replaced', type: 'ratio', visualization: 'line_chart', comparison_period: 'month', category: 'inventory' },
    { id: 'stockout_rate', name: 'Stockout Rate', description: 'Share of SKUs out of stock', type: 'percentage', visualization: 'gauge', comparison_period: 'week', category: 'inventory' },
    { id: 'return_rate', name: 'Return Rate', description: 'Percentage of orders returned', type: 'percentage', visualization: 'area_chart', comparison_period: 'month', category: 'customers' },
    { id: 'gross_margin', name: 'Gross Margin', description: 'Sales minus cost of goods sold', type: 'currency', visualization: 'stat_card', comparison_period: 'month', category: 'finance' },
    { id: 'customer_acquisition_cost', name: 'Customer Acquisition Cost', description: 'Marketing spend per new customer', type: 'currency', visualization: 'bar_chart', comparison_period: 'month', category: 'growth' },
  ],
  manufacturing: [
    { id: 'production_output', name: 'Production Output', description: 'Units produced in the period', type: 'number', visualization: 'line_chart', comparison_period: 'day', category: 'operations' },
    { id: 'oee', name: 'Overall Equipment Effectiveness', description: 'Availability × performance × quality', type: 'percentage', visualization: 'gauge', comparison_period: 'week', category: 'operations' },
    { id: 'defect_rate', name: 'Defect Rate', description: 'Share of units failing quality checks', type: 'percentage', visualization: 'line_chart', comparison_period: 'week', category: 'operations' },
    { id: 'raw_material_cost', name: 'Raw Material Cost', description: 'Total material spend in the period', type: 'currency', visualization: 'area_chart', comparison_period: 'month', category: 'finance' },
    { id: 'work_in_progress', name: 'Work in Progress Value', description: 'Value of goods currently in production', type: 'currency', visualization: 'stat_card', comparison_period: 'week', category: 'inventory' },
    { id: 'on_time_delivery', name: 'On-Time Delivery Rate', description: 'Orders shipped by promised date', type: 'percentage', visualization: 'bar_chart', comparison_period: 'month', category: 'supply_chain' },
    { id: 'labor_utilization', name: 'Labor Utilization', description: 'Productive hours vs available hours', type: 'percentage', visualization: 'line_chart', comparison_period: 'week', category: 'hr' },
    { id: 'maintenance_downtime', name: 'Maintenance Downtime', description: 'Hours lost to equipment maintenance', type: 'number', visualization: 'area_chart', comparison_period: 'month', category: 'operations' },
  ],
  professional_services: [
    { id: 'billable_utilization', name: 'Billable Utilization', description: 'Billable hours as a share of capacity', type: 'percentage', visualization: 'gauge', comparison_period: 'week', category: 'operations' },
    { id: 'revenue_per_consultant', name: 'Revenue per Consultant', description: 'Average revenue generated per team member', type: 'currency', visualization: 'stat_card', comparison_period: 'month', category: 'revenue' },
    { id: 'project_margin', name: 'Project Margin', description: 'Revenue minus delivery cost per project', type: 'percentage', visualization: 'line_chart', comparison_period: 'month', category: 'finance' },
    { id: 'pipeline_value', name: 'Sales Pipeline Value', description: 'Total value of open opportunities', type: 'currency', visualization: 'bar_chart', comparison_period: 'week', category: 'growth' },
    { id: 'client_retention', name: 'Client Retention Rate', description: 'Share of clients retained year over year', type: 'percentage', visualization: 'pie_chart', comparison_period: 'year', category: 'customers' },
    { id: 'avg_collection_days', name: 'Average Collection Days', description: 'Days to collect payment after invoicing', type: 'number', visualization: 'line_chart', comparison_period: 'month', category: 'finance' },
    { id: 'active_projects', name: 'Active Projects', description: 'Number of projects currently in delivery', type: 'number', visualization: 'stat_card', comparison_period: 'week', category: 'operations' },
    { id: 'proposal_win_rate', name: 'Proposal Win Rate', description: 'Share of proposals converted to projects', type: 'percentage', visualization: 'bar_chart', comparison_period: 'month', category: 'growth' },
  ],
  healthcare: [
    { id: 'daily_appointments', name: 'Daily Appointments', description: 'Patient appointments completed per day', type: 'number', visualization: 'line_chart', comparison_period: 'day', category: 'operations' },
    { id: 'patient_wait_time', name: 'Average Wait Time', description: 'Average minutes patients wait before service', type: 'number', visualization: 'bar_chart', comparison_period: 'day', category: 'operations' },
    { id: 'no_show_rate', name: 'No-Show Rate', description: 'Share of scheduled appointments missed', type: 'percentage', visualization: 'line_chart', comparison_period: 'week', category: 'customers' },
    { id: 'revenue_per_visit', name: 'Revenue per Visit', description: 'Average revenue collected per appointment', type: 'currency', visualization: 'stat_card', comparison_period: 'week', category: 'revenue' },
    { id: 'insurance_claim_rate', name: 'Insurance Claim Approval Rate', description: 'Share of claims approved on first submission', type: 'percentage', visualization: 'gauge', comparison_period: 'month', category: 'finance' },
    { id: 'staff_patient_ratio', name: 'Staff-to-Patient Ratio', description: 'Clinical staff per active patient load', type: 'ratio', visualization: 'stat_card', comparison_period: 'week', category: 'hr' },
    { id: 'supply_usage', name: 'Medical Supply Usage', description: 'Consumable supply usage vs budget', type: 'number', visualization: 'area_chart', comparison_period: 'month', category: 'inventory' },
    { id: 'patient_satisfaction', name: 'Patient Satisfaction Score', description: 'Average post-visit satisfaction rating', type: 'percentage', visualization: 'pie_chart', comparison_period: 'month', category: 'customers' },
  ],
  construction: [
    { id: 'project_progress', name: 'Project Progress', description: 'Average completion percentage across active jobs', type: 'percentage', visualization: 'gauge', comparison_period: 'week', category: 'operations' },
    { id: 'budget_variance', name: 'Budget Variance', description: 'Actual spend vs planned budget', type: 'percentage', visualization: 'line_chart', comparison_period: 'month', category: 'finance' },
    { id: 'safety_incidents', name: 'Safety Incidents', description: 'Recorded incidents in the period', type: 'number', visualization: 'bar_chart', comparison_period: 'month', category: 'hr' },
    { id: 'equipment_utilization', name: 'Equipment Utilization', description: 'Active equipment hours vs available hours', type: 'percentage', visualization: 'line_chart', comparison_period: 'week', category: 'operations' },
    { id: 'change_order_rate', name: 'Change Order Rate', description: 'Share of projects with scope changes', type: 'percentage', visualization: 'area_chart', comparison_period: 'month', category: 'finance' },
    { id: 'subcontractor_spend', name: 'Subcontractor Spend', description: 'Total subcontractor payments', type: 'currency', visualization: 'stat_card', comparison_period: 'month', category: 'supply_chain' },
    { id: 'material_waste', name: 'Material Waste', description: 'Estimated material waste on active sites', type: 'number', visualization: 'area_chart', comparison_period: 'month', category: 'inventory' },
    { id: 'milestone_on_time', name: 'Milestone On-Time Rate', description: 'Milestones completed by scheduled date', type: 'percentage', visualization: 'bar_chart', comparison_period: 'month', category: 'operations' },
  ],
  logistics: [
    { id: 'deliveries_completed', name: 'Deliveries Completed', description: 'Successful deliveries in the period', type: 'number', visualization: 'line_chart', comparison_period: 'day', category: 'operations' },
    { id: 'on_time_delivery', name: 'On-Time Delivery Rate', description: 'Deliveries arriving within SLA', type: 'percentage', visualization: 'gauge', comparison_period: 'week', category: 'operations' },
    { id: 'cost_per_delivery', name: 'Cost per Delivery', description: 'Average fulfillment cost per shipment', type: 'currency', visualization: 'stat_card', comparison_period: 'week', category: 'finance' },
    { id: 'fleet_utilization', name: 'Fleet Utilization', description: 'Active vehicle hours vs available hours', type: 'percentage', visualization: 'line_chart', comparison_period: 'week', category: 'operations' },
    { id: 'fuel_cost', name: 'Fuel Cost', description: 'Total fuel spend in the period', type: 'currency', visualization: 'area_chart', comparison_period: 'month', category: 'finance' },
    { id: 'warehouse_capacity', name: 'Warehouse Capacity Used', description: 'Storage capacity currently in use', type: 'percentage', visualization: 'gauge', comparison_period: 'week', category: 'inventory' },
    { id: 'damage_rate', name: 'Damage Rate', description: 'Share of shipments reported damaged', type: 'percentage', visualization: 'bar_chart', comparison_period: 'month', category: 'supply_chain' },
    { id: 'customer_complaints', name: 'Customer Complaints', description: 'Logistics-related customer complaints', type: 'number', visualization: 'area_chart', comparison_period: 'month', category: 'customers' },
  ],
  other: [
    { id: 'monthly_revenue', name: 'Monthly Revenue', description: 'Total revenue in the period', type: 'currency', visualization: 'line_chart', comparison_period: 'month', category: 'revenue' },
    { id: 'operating_expenses', name: 'Operating Expenses', description: 'Total operating costs in the period', type: 'currency', visualization: 'area_chart', comparison_period: 'month', category: 'finance' },
    { id: 'gross_margin', name: 'Gross Margin', description: 'Revenue minus direct costs', type: 'currency', visualization: 'stat_card', comparison_period: 'month', category: 'finance' },
    { id: 'cash_on_hand', name: 'Cash on Hand', description: 'Available cash balance', type: 'currency', visualization: 'stat_card', comparison_period: 'week', category: 'finance' },
    { id: 'active_customers', name: 'Active Customers', description: 'Customers with activity in the period', type: 'number', visualization: 'bar_chart', comparison_period: 'month', category: 'customers' },
    { id: 'employee_count', name: 'Employee Count', description: 'Total active employees', type: 'number', visualization: 'stat_card', comparison_period: 'month', category: 'hr' },
    { id: 'inventory_value', name: 'Inventory Value', description: 'Total value of stock on hand', type: 'currency', visualization: 'line_chart', comparison_period: 'month', category: 'inventory' },
    { id: 'order_fulfillment_time', name: 'Order Fulfillment Time', description: 'Average time from order to delivery', type: 'number', visualization: 'line_chart', comparison_period: 'week', category: 'operations' },
  ],
}

const FOCUS_METRIC_BOOSTS: Record<string, Partial<Record<string, number>>> = {
  'Revenue growth': { daily_revenue: 2, daily_sales: 2, monthly_revenue: 2, pipeline_value: 2 },
  'Cost control': { food_cost_percentage: 2, operating_expenses: 2, budget_variance: 2, cost_per_delivery: 2 },
  'Inventory accuracy': { inventory_turnover: 2, stockout_rate: 2, inventory_wastage: 2, warehouse_capacity: 2 },
  'Staff productivity': { labor_utilization: 2, billable_utilization: 2, labor_cost_percentage: 2 },
  'Customer retention': { repeat_customer_rate: 2, client_retention: 2, return_rate: 2 },
  'Cash flow': { cash_on_hand: 2, avg_collection_days: 2, gross_margin: 2 },
  'Supplier reliability': { on_time_delivery: 2, subcontractor_spend: 2, damage_rate: 2 },
  'Compliance & reporting': { safety_incidents: 2, insurance_claim_rate: 2, defect_rate: 2 },
}

function resolveBusinessType(form: OnboardingFormInput): string {
  if (form.industry === 'other' && form.industry_other) {
    return form.industry_other
  }
  return INDUSTRY_LABELS[form.industry]
}

function resolveModules(form: OnboardingFormInput): OnboardingConfig['modules'] {
  const modules: OnboardingConfig['modules'] = {
    dashboard: true,
    finance: true,
    hr: form.modules.hr,
    inventory: form.modules.inventory,
    supply_chain: form.modules.supply_chain,
    crm: form.modules.crm || form.business_model !== 'b2b',
  }

  if (form.industry === 'logistics' || form.industry === 'construction') {
    modules.supply_chain = true
  }

  if (form.industry === 'professional_services' && !form.sells_products) {
    modules.inventory = false
  }

  return modules
}

function modulePermissions(prefix: string): string[] {
  return [`${prefix}_view`, `${prefix}_edit`, `${prefix}_admin`]
}

function buildRoles(form: OnboardingFormInput, modules: OnboardingConfig['modules']): OnboardingConfig['roles'] {
  const roles: OnboardingConfig['roles'] = [{ name: 'Owner', permissions: [...ALL_PERMISSIONS] }]

  const managerPermissions = ['dashboard_view', 'dashboard_edit', 'finance_view']
  if (modules.hr) managerPermissions.push('hr_view', 'hr_edit')
  if (modules.inventory) managerPermissions.push('inventory_view', 'inventory_edit')
  if (modules.crm) managerPermissions.push('crm_view', 'crm_edit')
  if (modules.supply_chain) managerPermissions.push('supply_chain_view', 'supply_chain_edit')

  if (form.team_size !== '1-5') {
    roles.push({ name: 'Operations Manager', permissions: managerPermissions })
  }

  if (modules.finance) {
    roles.push({ name: 'Finance Lead', permissions: ['dashboard_view', ...modulePermissions('finance')] })
  }

  if (modules.hr && form.team_size !== '1-5') {
    roles.push({ name: 'HR Coordinator', permissions: ['dashboard_view', ...modulePermissions('hr')] })
  }

  if (modules.inventory) {
    roles.push({ name: 'Inventory Manager', permissions: ['dashboard_view', ...modulePermissions('inventory')] })
  }

  if (modules.crm && form.business_model !== 'b2b') {
    roles.push({ name: 'Customer Success', permissions: ['dashboard_view', ...modulePermissions('crm')] })
  }

  if (modules.supply_chain) {
    roles.push({ name: 'Procurement Lead', permissions: ['dashboard_view', ...modulePermissions('supply_chain')] })
  }

  return roles
}

function buildChecklist(form: OnboardingFormInput, modules: OnboardingConfig['modules']): OnboardingConfig['setup_checklist'] {
  const checklist: OnboardingConfig['setup_checklist'] = [
    {
      id: 'review_dashboard',
      title: 'Review your dashboard metrics',
      description: `Confirm the KPIs for ${form.business_name} match how you track performance.`,
      module: 'dashboard',
      priority: 1,
    },
  ]

  if (modules.hr) {
    checklist.push({
      id: 'add_employees',
      title: 'Add employees and assign roles',
      description: 'Create employee records and map each person to a department and role.',
      module: 'hr',
      priority: 1,
    })
  }

  if (modules.inventory) {
    checklist.push({
      id: 'setup_inventory',
      title: 'Set up inventory categories',
      description: 'Add stock categories and opening quantities for your product lines.',
      module: 'inventory',
      priority: 1,
    })
  }

  if (modules.finance) {
    checklist.push({
      id: 'opening_finance',
      title: 'Record opening balances',
      description: 'Enter cash balances, recurring expenses, and revenue categories.',
      module: 'finance',
      priority: 2,
    })
  }

  if (modules.supply_chain) {
    checklist.push({
      id: 'add_suppliers',
      title: 'Add suppliers and purchase terms',
      description: 'Set up vendor profiles and default procurement settings.',
      module: 'supply_chain',
      priority: 2,
    })
  }

  if (modules.crm) {
    checklist.push({
      id: 'import_customers',
      title: 'Add customers and contact workflows',
      description: 'Import or create customer records and define follow-up stages.',
      module: 'crm',
      priority: 3,
    })
  }

  if (form.has_shifts) {
    checklist.push({
      id: 'configure_shifts',
      title: 'Confirm shift schedules',
      description: 'Verify shift names and times match your operating schedule.',
      module: 'hr',
      priority: 2,
    })
  }

  return checklist
}

function selectMetrics(form: OnboardingFormInput): OnboardingConfig['dashboard_metrics'] {
  const base = INDUSTRY_METRICS[form.industry]
  const scores = new Map<string, { metric: MetricTemplate; score: number }>()

  for (const metric of base) {
    scores.set(metric.id, { metric, score: 1 })
  }

  for (const focus of form.focus_areas) {
    const boosts = FOCUS_METRIC_BOOSTS[focus]
    if (!boosts) continue
    for (const [metricId, boost] of Object.entries(boosts)) {
      const existing = scores.get(metricId)
      if (existing && typeof boost === 'number') existing.score += boost
    }
  }

  if (form.modules.inventory) {
    for (const entry of scores.values()) {
      if (entry.metric.category === 'inventory') entry.score += 1
    }
  }

  if (form.modules.crm) {
    for (const entry of scores.values()) {
      if (entry.metric.category === 'customers') entry.score += 1
    }
  }

  if (form.modules.supply_chain) {
    for (const entry of scores.values()) {
      if (entry.metric.category === 'supply_chain') entry.score += 1
    }
  }

  if (form.revenue_model === 'subscription') {
    for (const entry of scores.values()) {
      if (entry.metric.category === 'growth' || entry.metric.category === 'revenue') entry.score += 1
    }
  }

  const sorted = [...scores.values()]
    .sort((a, b) => b.score - a.score || a.metric.name.localeCompare(b.metric.name))
    .slice(0, 10)
    .map(({ metric }) => ({ ...metric }))

  return sorted.length >= 8 ? sorted : base.slice(0, 8).map((metric) => ({ ...metric }))
}

export function buildWorkspaceConfig(form: OnboardingFormInput): OnboardingConfig {
  const modules = resolveModules(form)

  return {
    business_type: resolveBusinessType(form),
    modules,
    dashboard_metrics: selectMetrics(form),
    departments: form.departments,
    shifts: form.has_shifts ? form.shifts : null,
    product_categories: form.sells_products ? form.product_categories : null,
    service_types: form.sells_services ? form.service_types : null,
    roles: buildRoles(form, modules),
    setup_checklist: buildChecklist(form, modules),
  }
}
