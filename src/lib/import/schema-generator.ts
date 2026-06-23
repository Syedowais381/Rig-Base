import type {
  ImportEntity,
  ImportFieldDef,
  ImportModule,
  ImportSchema,
  WorkspaceImportContext,
} from '@/lib/import/types'
import { generateSampleRows, rowsToCsv, SAMPLE_ROW_COUNT } from '@/lib/import/sample-data-generator'

function field(
  key: string,
  label: string,
  type: ImportFieldDef['type'],
  required: boolean,
  description: string,
  extra?: Partial<ImportFieldDef>
): ImportFieldDef {
  return { key, label, type, required, description, ...extra }
}

function buildEmployeeFields(ctx: WorkspaceImportContext): ImportFieldDef[] {
  const fields: ImportFieldDef[] = [
    field('full_name', 'Full name', 'string', true, 'Employee legal or display name.', { example: 'Jane Smith' }),
    field('email', 'Email', 'email', true, 'Work email address.', { example: 'jane@company.com' }),
    field('phone', 'Phone', 'string', false, 'Contact phone number.', { example: '+1-555-0100' }),
    field(
      'department',
      'Department',
      'enum',
      true,
      'Must match one of your workspace departments.',
      { allowedValues: ctx.departments, example: ctx.departments[0] ?? 'Operations' }
    ),
    field(
      'role_name',
      'Role name',
      'enum',
      true,
      'Must match a role configured in your workspace.',
      { allowedValues: ctx.roleNames, example: ctx.roleNames[0] ?? 'Owner' }
    ),
    field('hire_date', 'Hire date', 'date', true, 'ISO date (YYYY-MM-DD).', { example: '2024-01-15' }),
    field('salary', 'Salary', 'number', false, 'Annual or monthly salary depending on your policy.', { example: '55000' }),
    field(
      'status',
      'Status',
      'enum',
      false,
      'Employment status. Defaults to active if omitted.',
      { allowedValues: ['active', 'inactive', 'on_leave'], example: 'active' }
    ),
  ]

  if (ctx.shifts && ctx.shifts.length > 0) {
    fields.push(
      field(
        'shift_name',
        'Shift name',
        'enum',
        false,
        'Optional shift assignment from your configured shifts.',
        {
          allowedValues: ctx.shifts.map((s) => s.name),
          example: ctx.shifts[0]?.name,
        }
      )
    )
  }

  return fields
}

function buildProductFields(ctx: WorkspaceImportContext): ImportFieldDef[] {
  const categories =
    ctx.productCategories.length > 0 ? ctx.productCategories : ['General']

  return [
    field('name', 'Product name', 'string', true, 'Display name of the product.', { example: 'Widget A' }),
    field('sku', 'SKU', 'string', true, 'Unique stock keeping unit per product.', { example: 'WDG-001' }),
    field(
      'category',
      'Category',
      'enum',
      true,
      'Must match your workspace product categories.',
      { allowedValues: categories, example: categories[0] }
    ),
    field('quantity', 'Quantity', 'number', true, 'Current stock on hand.', { example: '100', constraints: ['Must be >= 0'] }),
    field('unit_price', 'Unit price', 'number', true, 'Selling price per unit.', { example: '29.99' }),
    field('cost_price', 'Cost price', 'number', true, 'Cost per unit.', { example: '12.50' }),
    field('min_stock_level', 'Min stock level', 'number', false, 'Low-stock threshold. Defaults to 10.', { example: '10' }),
    field(
      'status',
      'Status',
      'enum',
      false,
      'Auto-calculated from quantity if omitted.',
      { allowedValues: ['in_stock', 'low_stock', 'out_of_stock'], example: 'in_stock' }
    ),
  ]
}

function buildTransactionFields(ctx: WorkspaceImportContext): ImportFieldDef[] {
  return [
    field(
      'type',
      'Type',
      'enum',
      true,
      'Transaction direction.',
      { allowedValues: ['revenue', 'expense'], example: 'revenue' }
    ),
    field('description', 'Description', 'string', true, 'Short description of the transaction.', { example: 'Monthly subscription sales' }),
    field(
      'category',
      'Category',
      'enum',
      true,
      'Category aligned with your workspace finance setup.',
      { allowedValues: ctx.financeCategories, example: ctx.financeCategories[0] ?? 'Sales' }
    ),
    field('amount', 'Amount', 'number', true, 'Positive numeric amount.', { example: '1500.00', constraints: ['Must be > 0'] }),
    field('date', 'Date', 'date', true, 'Transaction date (YYYY-MM-DD).', { example: '2024-06-01' }),
    field('reference', 'Reference', 'string', false, 'Invoice or reference number.', { example: 'INV-1001' }),
  ]
}

function buildSupplierFields(): ImportFieldDef[] {
  return [
    field('name', 'Company name', 'string', true, 'Supplier business name.', { example: 'Acme Supplies Ltd' }),
    field('contact_person', 'Contact person', 'string', true, 'Primary contact name.', { example: 'John Doe' }),
    field('email', 'Email', 'email', true, 'Supplier email.', { example: 'orders@acme.com' }),
    field('phone', 'Phone', 'string', true, 'Supplier phone.', { example: '+1-555-0200' }),
    field('address', 'Address', 'string', false, 'Mailing or warehouse address.', { example: '123 Industrial Way' }),
    field(
      'status',
      'Status',
      'enum',
      false,
      'Defaults to active.',
      { allowedValues: ['active', 'inactive'], example: 'active' }
    ),
  ]
}

function buildPurchaseOrderFields(ctx: WorkspaceImportContext): ImportFieldDef[] {
  return [
    field(
      'supplier_name',
      'Supplier name',
      'enum',
      true,
      'Must match an existing supplier in your workspace (import suppliers first).',
      { allowedValues: ctx.supplierNames, example: ctx.supplierNames[0] ?? 'Acme Supplies Ltd' }
    ),
    field('order_number', 'Order number', 'string', true, 'Unique purchase order reference.', { example: 'PO-2024-001' }),
    field('total_amount', 'Total amount', 'number', true, 'Order total value.', { example: '2500.00' }),
    field('order_date', 'Order date', 'date', true, 'Date the order was placed.', { example: '2024-06-01' }),
    field('expected_delivery', 'Expected delivery', 'date', false, 'Expected delivery date.', { example: '2024-06-15' }),
    field(
      'status',
      'Status',
      'enum',
      false,
      'Defaults to pending.',
      { allowedValues: ['pending', 'approved', 'shipped', 'delivered', 'cancelled'], example: 'pending' }
    ),
  ]
}

function buildCustomerFields(ctx: WorkspaceImportContext): ImportFieldDef[] {
  const fields: ImportFieldDef[] = [
    field('name', 'Name', 'string', true, 'Customer full name.', { example: 'Alex Johnson' }),
    field('email', 'Email', 'email', true, 'Customer email.', { example: 'alex@client.com' }),
    field('phone', 'Phone', 'string', false, 'Contact phone.', { example: '+1-555-0300' }),
    field('company', 'Company', 'string', false, 'Company name if B2B.', { example: 'Client Corp' }),
    field(
      'status',
      'Status',
      'enum',
      false,
      'Defaults to active.',
      { allowedValues: ['active', 'inactive', 'lead'], example: 'active' }
    ),
    field('total_spent', 'Total spent', 'number', false, 'Lifetime value to date.', { example: '1200' }),
    field('notes', 'Notes', 'string', false, 'Free-text notes.', { example: 'Prefers email contact' }),
  ]

  if (ctx.serviceTypes.length > 0) {
    fields.splice(5, 0,
      field(
        'service_type',
        'Service type',
        'enum',
        false,
        'Optional tag from your configured service types.',
        { allowedValues: ctx.serviceTypes, example: ctx.serviceTypes[0] }
      )
    )
  }

  return fields
}

function sampleRowFromFields(fields: ImportFieldDef[]): Record<string, string> {
  const row: Record<string, string> = {}
  for (const f of fields) {
    if (f.example !== undefined) row[f.key] = f.example
  }
  return row
}

function buildRules(module: ImportModule, entity: ImportEntity, ctx: WorkspaceImportContext): string[] {
  const rules = [
    'Supported formats: CSV (header row required) or JSON (array of objects or { "records": [...] }).',
    'Column names must match the field keys exactly (case-sensitive).',
    'Empty required fields will cause that row to be rejected.',
    `Business type: ${ctx.businessType}. Import schema reflects your current workspace configuration.`,
  ]

  if (module === 'hr' && entity === 'employees') {
    rules.push(`Departments must be one of: ${ctx.departments.join(', ') || '(none configured)'}.`)
    rules.push(`Roles must be one of: ${ctx.roleNames.join(', ') || '(add roles in HR first)'}.`)
    if (ctx.shifts?.length) {
      rules.push(`Optional shift_name must be one of: ${ctx.shifts.map((s) => s.name).join(', ')}.`)
    }
  }

  if (module === 'inventory') {
    rules.push(`Categories must match your product categories: ${ctx.productCategories.join(', ') || 'General'}.`)
    rules.push('SKU must be unique within your workspace.')
  }

  if (module === 'finance') {
    rules.push('Amounts must be positive numbers. Type controls revenue vs expense on the dashboard.')
  }

  if (module === 'supply_chain' && entity === 'purchase_orders') {
    rules.push('Import suppliers before purchase orders. supplier_name must match an existing supplier.')
  }

  if (module === 'crm' && ctx.serviceTypes.length > 0) {
    rules.push(`Optional service_type: ${ctx.serviceTypes.join(', ')}.`)
  }

  return rules
}

export function generateImportSchema(
  module: ImportModule,
  entity: ImportEntity,
  ctx: WorkspaceImportContext
): ImportSchema {
  let fields: ImportFieldDef[]
  let title: string
  let description: string

  switch (entity) {
    case 'employees':
      fields = buildEmployeeFields(ctx)
      title = 'HR — Employee import'
      description = 'Import employees with departments and roles from your workspace setup.'
      break
    case 'products':
      fields = buildProductFields(ctx)
      title = 'Inventory — Product import'
      description = 'Import products using your configured product categories and stock fields.'
      break
    case 'transactions':
      fields = buildTransactionFields(ctx)
      title = 'Finance — Transaction import'
      description = 'Import revenue and expense records. Dashboard finance metrics update from this data.'
      break
    case 'suppliers':
      fields = buildSupplierFields()
      title = 'Supply Chain — Supplier import'
      description = 'Import supplier contacts and status.'
      break
    case 'purchase_orders':
      fields = buildPurchaseOrderFields(ctx)
      title = 'Supply Chain — Purchase order import'
      description = 'Import purchase orders linked to existing suppliers.'
      break
    case 'customers':
      fields = buildCustomerFields(ctx)
      title = 'CRM — Customer import'
      description = 'Import customers aligned with your CRM configuration and service types.'
      break
    default:
      fields = []
      title = 'Import'
      description = ''
  }

  const sampleRow = sampleRowFromFields(fields)
  const headers = fields.map((f) => f.key)
  const previewRows = generateSampleRows(entity, ctx, Math.min(3, SAMPLE_ROW_COUNT))

  return {
    module,
    entity,
    title,
    description,
    formats: ['csv', 'json'],
    fields,
    rules: [
      ...buildRules(module, entity, ctx),
      `Downloadable samples include ${SAMPLE_ROW_COUNT} unique test rows aligned with your workspace.`,
    ],
    workspaceContext: {
      departments: ctx.departments,
      productCategories: ctx.productCategories,
      serviceTypes: ctx.serviceTypes,
      roleNames: ctx.roleNames,
      supplierNames: ctx.supplierNames,
      financeCategories: ctx.financeCategories,
      shiftsEnabled: !!(ctx.shifts && ctx.shifts.length > 0),
    },
    sampleCsv: rowsToCsv(headers, previewRows),
    sampleJson: { records: previewRows },
  }
}
