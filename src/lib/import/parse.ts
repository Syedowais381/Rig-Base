function parseCsvLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    const next = line[i + 1]

    if (char === '"' && inQuotes && next === '"') {
      current += '"'
      i++
      continue
    }

    if (char === '"') {
      inQuotes = !inQuotes
      continue
    }

    if (char === ',' && !inQuotes) {
      result.push(current.trim())
      current = ''
      continue
    }

    current += char
  }

  result.push(current.trim())
  return result
}

export function parseCsv(text: string): Record<string, string>[] {
  const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/).filter((line) => line.trim().length > 0)
  if (lines.length < 2) return []

  const headers = parseCsvLine(lines[0]).map((h) => h.trim())
  const rows: Record<string, string>[] = []

  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvLine(lines[i])
    const row: Record<string, string> = {}
    headers.forEach((header, index) => {
      row[header] = values[index] ?? ''
    })
    rows.push(row)
  }

  return rows
}

export function parseJsonImport(text: string): Record<string, string>[] {
  const parsed = JSON.parse(text) as unknown

  let records: unknown[]
  if (Array.isArray(parsed)) {
    records = parsed
  } else if (typeof parsed === 'object' && parsed !== null && Array.isArray((parsed as { records?: unknown }).records)) {
    records = (parsed as { records: unknown[] }).records
  } else {
    throw new Error('JSON must be an array of objects or { "records": [...] }.')
  }

  return records.map((record) => {
    if (typeof record !== 'object' || record === null) {
      throw new Error('Each JSON record must be an object.')
    }
    const row: Record<string, string> = {}
    for (const [key, value] of Object.entries(record)) {
      if (value === null || value === undefined) {
        row[key] = ''
      } else {
        row[key] = String(value)
      }
    }
    return row
  })
}

export function parseImportFile(content: string, format: 'csv' | 'json'): Record<string, string>[] {
  if (format === 'csv') return parseCsv(content)
  return parseJsonImport(content)
}
