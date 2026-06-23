import type { ImportEntity, ImportFieldDef, ImportRowError, ImportSchema } from '@/lib/import/types'

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

function isValidDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const date = new Date(value)
  return !Number.isNaN(date.getTime())
}

export function validateImportRows(
  rows: Record<string, string>[],
  schema: ImportSchema
): { validRows: Record<string, string>[]; errors: ImportRowError[] } {
  const errors: ImportRowError[] = []
  const validRows: Record<string, string>[] = []

  if (rows.length === 0) {
    errors.push({ row: 0, message: 'No data rows found in file.' })
    return { validRows, errors }
  }

  rows.forEach((row, index) => {
    const rowNumber = index + 1
    let rowValid = true

    for (const field of schema.fields) {
      const raw = (row[field.key] ?? '').trim()
      const fieldErrors = validateField(field, raw)
      for (const message of fieldErrors) {
        errors.push({ row: rowNumber, field: field.key, message })
        rowValid = false
      }
    }

    if (rowValid) validRows.push(row)
  })

  return { validRows, errors }
}

function validateField(field: ImportFieldDef, value: string): string[] {
  const messages: string[] = []

  if (!value) {
    if (field.required) messages.push(`${field.label} is required.`)
    return messages
  }

  switch (field.type) {
    case 'email':
      if (!isValidEmail(value)) messages.push(`${field.label} must be a valid email.`)
      break
    case 'date':
      if (!isValidDate(value)) messages.push(`${field.label} must be YYYY-MM-DD.`)
      break
    case 'number': {
      const num = Number(value)
      if (Number.isNaN(num)) messages.push(`${field.label} must be a number.`)
      else if (field.key === 'amount' && num <= 0) messages.push(`${field.label} must be greater than 0.`)
      else if (['quantity', 'min_stock_level'].includes(field.key) && num < 0) {
        messages.push(`${field.label} cannot be negative.`)
      }
      break
    }
    case 'enum':
      if (field.allowedValues && field.allowedValues.length > 0) {
        const match = field.allowedValues.some((v) => v.toLowerCase() === value.toLowerCase())
        if (!match) {
          messages.push(`${field.label} must be one of: ${field.allowedValues.join(', ')}.`)
        }
      }
      break
    default:
      break
  }

  return messages
}

export function normalizeRow(row: Record<string, string>, schema: ImportSchema): Record<string, string> {
  const normalized: Record<string, string> = { ...row }

  for (const field of schema.fields) {
    const value = (normalized[field.key] ?? '').trim()
    if (!value && !field.required) {
      delete normalized[field.key]
      continue
    }

    if (field.type === 'enum' && field.allowedValues) {
      const match = field.allowedValues.find((v) => v.toLowerCase() === value.toLowerCase())
      if (match) normalized[field.key] = match
    }
  }

  return normalized
}
