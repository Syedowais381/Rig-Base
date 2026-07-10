export function formatMoney(value: number): string {
  return value.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

export function formatMoneyParts(value: number): { whole: string; fraction: string } {
  const formatted = formatMoney(value)
  const dotIndex = formatted.lastIndexOf('.')
  if (dotIndex === -1) {
    return { whole: formatted, fraction: '.00' }
  }
  return {
    whole: formatted.slice(0, dotIndex),
    fraction: formatted.slice(dotIndex),
  }
}
