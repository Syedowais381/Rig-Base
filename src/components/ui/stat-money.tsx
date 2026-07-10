import { formatMoneyParts } from '@/lib/format'

export function StatMoney({
  value,
  className = '',
}: {
  value: number
  className?: string
}) {
  const { whole, fraction } = formatMoneyParts(value)

  return (
    <p className={`stat-value ${className}`.trim()}>
      <span className="stat-value-currency">$</span>
      <span className="stat-value-whole">{whole}</span>
      <span className="stat-value-fraction">{fraction}</span>
    </p>
  )
}
