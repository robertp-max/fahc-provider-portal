import { IconShield, IconAlert } from './icons'
import { cn } from '@/lib/utils'

/** A small inline marker that flags PHI-bearing UI surfaces. */
export function PhiBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full bg-brand-softGold px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-brand-darkGold',
        className,
      )}
    >
      <IconShield className="h-3 w-3" />
      PHI
    </span>
  )
}

/** A prominent banner warning that the surface contains protected health info. */
export function PhiWarning({ children, className }: { children?: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        'flex items-start gap-2 rounded-xl border border-brand-darkGold/30 bg-brand-softGold/50 px-3 py-2 text-sm text-brand-darkGold',
        className,
      )}
      role="note"
    >
      <IconAlert className="mt-0.5 h-4 w-4 shrink-0" />
      <span className="text-brand-charcoal">
        {children ??
          'This section may contain Protected Health Information (PHI). Access is logged to the immutable audit trail.'}
      </span>
    </div>
  )
}
