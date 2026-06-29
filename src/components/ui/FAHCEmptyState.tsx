import { cn } from '@/lib/utils'

interface FAHCEmptyStateProps {
  title: string
  description?: string
  icon?: React.ReactNode
  action?: React.ReactNode
  className?: string
}

export function FAHCEmptyState({
  title,
  description,
  icon,
  action,
  className,
}: FAHCEmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-brand-softBlue/70 bg-brand-paleBlue/40 px-6 py-12 text-center',
        className,
      )}
    >
      {icon && (
        <span className="grid h-12 w-12 place-items-center rounded-full bg-white text-brand-primary shadow-soft">
          {icon}
        </span>
      )}
      <div>
        <h4 className="font-heading text-base font-semibold text-brand-primary">{title}</h4>
        {description && (
          <p className="mx-auto mt-1 max-w-sm text-sm text-brand-charcoal/70">{description}</p>
        )}
      </div>
      {action}
    </div>
  )
}
