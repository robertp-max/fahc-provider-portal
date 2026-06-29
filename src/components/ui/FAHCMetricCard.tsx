import { cn } from '@/lib/utils'

interface FAHCMetricCardProps {
  label: string
  value: string | number
  hint?: string
  icon?: React.ReactNode
  /** Visual emphasis for the most important metric (filled navy). */
  emphasis?: boolean
  trend?: { direction: 'up' | 'down'; label: string }
}

export function FAHCMetricCard({
  label,
  value,
  hint,
  icon,
  emphasis,
  trend,
}: FAHCMetricCardProps) {
  return (
    <div
      className={cn(
        'fahc-surface flex flex-col gap-2 p-5',
        emphasis && 'bg-brand-primary text-white border-brand-primary',
      )}
    >
      <div className="flex items-center justify-between">
        <span
          className={cn(
            'text-sm font-medium',
            emphasis ? 'text-white/80' : 'text-brand-charcoal/70',
          )}
        >
          {label}
        </span>
        {icon && (
          <span
            className={cn(
              'grid h-8 w-8 place-items-center rounded-lg',
              emphasis ? 'bg-white/15 text-white' : 'bg-brand-paleBlue text-brand-primary',
            )}
          >
            {icon}
          </span>
        )}
      </div>
      <div className="flex items-end gap-2">
        <span
          className={cn(
            'font-heading text-3xl font-semibold leading-none',
            emphasis ? 'text-white' : 'text-brand-primary',
          )}
        >
          {value}
        </span>
        {trend && (
          <span
            className={cn(
              'mb-0.5 text-xs font-medium',
              trend.direction === 'up' ? 'text-emerald-600' : 'text-rose-500',
              emphasis && 'text-white/90',
            )}
          >
            {trend.direction === 'up' ? '▲' : '▼'} {trend.label}
          </span>
        )}
      </div>
      {hint && (
        <span className={cn('text-xs', emphasis ? 'text-white/70' : 'text-brand-charcoal/60')}>
          {hint}
        </span>
      )}
    </div>
  )
}
