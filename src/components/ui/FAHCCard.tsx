import { cn } from '@/lib/utils'

interface FAHCCardProps {
  children: React.ReactNode
  className?: string
  title?: string
  subtitle?: string
  action?: React.ReactNode
  /** Removes inner padding so tables/lists can sit flush. */
  flush?: boolean
}

export function FAHCCard({ children, className, title, subtitle, action, flush }: FAHCCardProps) {
  return (
    <section className={cn('fahc-surface', className)}>
      {(title || action) && (
        <header className="flex items-start justify-between gap-3 border-b border-brand-lightGray/70 px-5 py-4">
          <div>
            {title && <h3 className="font-heading text-base font-semibold text-brand-primary">{title}</h3>}
            {subtitle && <p className="mt-0.5 text-sm text-brand-charcoal/70">{subtitle}</p>}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </header>
      )}
      <div className={cn(!flush && 'p-5')}>{children}</div>
    </section>
  )
}
