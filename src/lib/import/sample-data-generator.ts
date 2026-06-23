import type { ImportEntity, WorkspaceImportContext } from '@/lib/import/types'

export const SAMPLE_ROW_COUNT = 100

const FIRST_NAMES = [
  'James', 'Maria', 'Robert', 'Sarah', 'Michael', 'Emily', 'David', 'Olivia', 'Daniel', 'Sophia',
  'William', 'Isabella', 'Joseph', 'Ava', 'Thomas', 'Mia', 'Charles', 'Charlotte', 'Christopher', 'Amelia',
  'Andrew', 'Harper', 'Joshua', 'Evelyn', 'Ryan', 'Abigail', 'Nathan', 'Elizabeth', 'Kevin', 'Sofia',
]

const LAST_NAMES = [
  'Anderson', 'Martinez', 'Thompson', 'Garcia', 'Robinson', 'Clark', 'Lewis', 'Lee', 'Walker', 'Hall',
  'Allen', 'Young', 'King', 'Wright', 'Scott', 'Green', 'Baker', 'Adams', 'Nelson', 'Carter',
  'Mitchell', 'Perez', 'Roberts', 'Turner', 'Phillips', 'Campbell', 'Parker', 'Evans', 'Edwards', 'Collins',
]

const SUPPLIER_PREFIXES = [
  'Summit', 'Atlas', 'Pioneer', 'Horizon', 'Vertex', 'Meridian', 'Cascade', 'Sterling', 'Nova', 'Apex',
]

const SUPPLIER_SUFFIXES = [
  'Industrial Supply', 'Logistics Group', 'Materials Co', 'Trading Partners', 'Wholesale Ltd',
  'Components Inc', 'Procurement Services', 'Distribution', 'Manufacturing Supply', 'Global Sourcing',
]

const PRODUCT_DESCRIPTORS = [
  'Pro', 'Elite', 'Standard', 'Compact', 'Heavy-Duty', 'Eco', 'Precision', 'Classic', 'Ultra', 'Lite',
]

const PRODUCT_TYPES = [
  'Widget', 'Assembly', 'Kit', 'Module', 'Sensor', 'Bracket', 'Panel', 'Filter', 'Coupler', 'Adapter',
  'Harness', 'Gasket', 'Bearing', 'Valve', 'Regulator', 'Mount', 'Seal', 'Cable', 'Switch', 'Gauge',
]

const REVENUE_DESCRIPTIONS = [
  'Monthly subscription renewal', 'Product sale — online store', 'Consulting invoice payment', 'Bulk order fulfillment',
  'Service contract billing', 'Retail counter sale', 'Partner referral commission', 'Annual license renewal',
  'Project milestone payment', 'Maintenance contract fee',
]

const EXPENSE_DESCRIPTIONS = [
  'Office rent payment', 'Payroll processing', 'Cloud infrastructure bill', 'Marketing campaign spend',
  'Raw materials purchase', 'Equipment maintenance', 'Insurance premium', 'Utility bill — electricity',
  'Courier and shipping fees', 'Professional services invoice',
]

const CUSTOMER_COMPANIES = [
  'Northwind Traders', 'Blue Ridge Holdings', 'Silverline Partners', 'Evergreen Systems', 'Redwood Analytics',
  'Brightpath Solutions', 'Clearview Media', 'Stonebridge Capital', 'Lakeside Ventures', 'Harbor Point Group',
]

/** Shared supplier names so supplier + PO sample files import together. */
export function sampleSupplierName(index: number): string {
  const i = index - 1
  const prefix = SUPPLIER_PREFIXES[i % SUPPLIER_PREFIXES.length]
  const suffix = SUPPLIER_SUFFIXES[Math.floor(i / SUPPLIER_PREFIXES.length) % SUPPLIER_SUFFIXES.length]
  return `${prefix} ${suffix} ${String(index).padStart(3, '0')}`
}

function pick<T>(items: T[], index: number): T {
  if (items.length === 0) throw new Error('Cannot pick from empty list')
  return items[index % items.length]
}

function isoDateDaysAgo(daysAgo: number): string {
  const date = new Date()
  date.setDate(date.getDate() - daysAgo)
  return date.toISOString().slice(0, 10)
}

function phone(index: number): string {
  const area = 200 + (index % 800)
  const line = String(1000 + ((index * 37) % 9000)).padStart(4, '0')
  return `+1-${area}-555-${line}`
}

function money(base: number, index: number, spread = 0.35): string {
  const variance = 1 + ((index % 17) - 8) * spread * 0.1
  return (base * variance).toFixed(2)
}

function slug(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

function generateEmployees(ctx: WorkspaceImportContext, count: number): Record<string, string>[] {
  const departments = ctx.departments.length > 0 ? ctx.departments : ['Operations']
  const roles = ctx.roleNames.length > 0 ? ctx.roleNames : ['Owner']
  const statuses = ['active', 'active', 'active', 'active', 'on_leave', 'inactive'] as const
  const rows: Record<string, string>[] = []

  for (let i = 1; i <= count; i++) {
    const first = pick(FIRST_NAMES, i)
    const last = pick(LAST_NAMES, i + 7)
    const row: Record<string, string> = {
      full_name: `${first} ${last}`,
      email: `${slug(first)}.${slug(last)}${i}@rigbase-demo.com`,
      phone: phone(i),
      department: pick(departments, i),
      role_name: pick(roles, i + 3),
      hire_date: isoDateDaysAgo(30 + i * 9),
      salary: String(Math.round(42000 + (i * 791) % 78000)),
      status: pick([...statuses], i),
    }
    if (ctx.shifts && ctx.shifts.length > 0) {
      row.shift_name = pick(ctx.shifts.map((s) => s.name), i)
    }
    rows.push(row)
  }

  return rows
}

function generateProducts(ctx: WorkspaceImportContext, count: number): Record<string, string>[] {
  const categories = ctx.productCategories.length > 0 ? ctx.productCategories : ['General']
  const rows: Record<string, string>[] = []

  for (let i = 1; i <= count; i++) {
    const category = pick(categories, i)
    const descriptor = pick(PRODUCT_DESCRIPTORS, i)
    const productType = pick(PRODUCT_TYPES, i + 11)
    const quantity = (i * 13) % 420
    const minStock = 5 + (i % 25)
    const unitPrice = Number(money(12 + (i % 40), i))
    const costPrice = Number((unitPrice * (0.45 + (i % 10) * 0.03)).toFixed(2))
    let status = 'in_stock'
    if (quantity === 0) status = 'out_of_stock'
    else if (quantity <= minStock) status = 'low_stock'

    rows.push({
      name: `${descriptor} ${productType} — ${category}`,
      sku: `SKU-${slug(category).toUpperCase().slice(0, 4)}-${String(i).padStart(4, '0')}`,
      category,
      quantity: String(quantity),
      unit_price: unitPrice.toFixed(2),
      cost_price: costPrice.toFixed(2),
      min_stock_level: String(minStock),
      status,
    })
  }

  return rows
}

function generateTransactions(ctx: WorkspaceImportContext, count: number): Record<string, string>[] {
  const categories = ctx.financeCategories.length > 0 ? ctx.financeCategories : ['Sales', 'Payroll', 'Rent']
  const rows: Record<string, string>[] = []

  for (let i = 1; i <= count; i++) {
    const isRevenue = i % 3 !== 0
    const type = isRevenue ? 'revenue' : 'expense'
    const descriptions = isRevenue ? REVENUE_DESCRIPTIONS : EXPENSE_DESCRIPTIONS
    const baseAmount = isRevenue ? 850 + (i * 127) % 9200 : 120 + (i * 53) % 4800

    rows.push({
      type,
      description: `${pick(descriptions, i)} #${String(i).padStart(4, '0')}`,
      category: pick(categories, i + 2),
      amount: money(baseAmount, i),
      date: isoDateDaysAgo(i % 120),
      reference: `${isRevenue ? 'INV' : 'EXP'}-2024-${String(1000 + i)}`,
    })
  }

  return rows
}

function generateSuppliers(_ctx: WorkspaceImportContext, count: number): Record<string, string>[] {
  const rows: Record<string, string>[] = []

  for (let i = 1; i <= count; i++) {
    const name = sampleSupplierName(i)
    const contactFirst = pick(FIRST_NAMES, i + 5)
    const contactLast = pick(LAST_NAMES, i + 12)
    rows.push({
      name,
      contact_person: `${contactFirst} ${contactLast}`,
      email: `orders@${slug(name)}.com`,
      phone: phone(1000 + i),
      address: `${100 + (i % 900)} Commerce Blvd, Suite ${i}, Business City`,
      status: i % 17 === 0 ? 'inactive' : 'active',
    })
  }

  return rows
}

function generatePurchaseOrders(ctx: WorkspaceImportContext, count: number): Record<string, string>[] {
  const supplierPool =
    ctx.supplierNames.length >= count
      ? ctx.supplierNames
      : Array.from({ length: count }, (_, idx) => sampleSupplierName(idx + 1))

  const statuses = ['pending', 'approved', 'shipped', 'delivered', 'cancelled'] as const
  const rows: Record<string, string>[] = []

  for (let i = 1; i <= count; i++) {
    const orderDate = isoDateDaysAgo(5 + i * 2)
    rows.push({
      supplier_name: pick(supplierPool, i),
      order_number: `PO-2024-${String(5000 + i)}`,
      total_amount: money(900 + (i * 211) % 15000, i),
      order_date: orderDate,
      expected_delivery: isoDateDaysAgo(Math.max(0, 5 + i * 2 - 14)),
      status: pick([...statuses], i + 1),
    })
  }

  return rows
}

function generateCustomers(ctx: WorkspaceImportContext, count: number): Record<string, string>[] {
  const statuses = ['active', 'active', 'active', 'lead', 'inactive'] as const
  const rows: Record<string, string>[] = []

  for (let i = 1; i <= count; i++) {
    const first = pick(FIRST_NAMES, i + 2)
    const last = pick(LAST_NAMES, i + 9)
    const row: Record<string, string> = {
      name: `${first} ${last}`,
      email: `${slug(first)}.${slug(last)}.customer${i}@clientmail.com`,
      phone: phone(2000 + i),
      company: i % 4 === 0 ? pick(CUSTOMER_COMPANIES, i) : '',
      status: pick([...statuses], i),
      total_spent: money(150 + (i * 89) % 12000, i),
      notes: i % 5 === 0 ? 'Requested quarterly business review.' : '',
    }

    if (ctx.serviceTypes.length > 0) {
      row.service_type = pick(ctx.serviceTypes, i)
    }

    rows.push(row)
  }

  return rows
}

export function generateSampleRows(
  entity: ImportEntity,
  ctx: WorkspaceImportContext,
  count = SAMPLE_ROW_COUNT
): Record<string, string>[] {
  switch (entity) {
    case 'employees':
      return generateEmployees(ctx, count)
    case 'products':
      return generateProducts(ctx, count)
    case 'transactions':
      return generateTransactions(ctx, count)
    case 'suppliers':
      return generateSuppliers(ctx, count)
    case 'purchase_orders':
      return generatePurchaseOrders(ctx, count)
    case 'customers':
      return generateCustomers(ctx, count)
    default:
      return []
  }
}

export function escapeCsvValue(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

export function rowsToCsv(headers: string[], rows: Record<string, string>[]): string {
  const headerLine = headers.map(escapeCsvValue).join(',')
  const dataLines = rows.map((row) => headers.map((header) => escapeCsvValue(row[header] ?? '')).join(','))
  return [headerLine, ...dataLines].join('\n')
}

export function rowsToJson(rows: Record<string, string>[]): string {
  return JSON.stringify({ records: rows }, null, 2)
}
