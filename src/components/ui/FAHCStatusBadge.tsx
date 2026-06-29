import { cn } from '@/lib/utils'

type Tone = 'neutral' | 'info' | 'progress' | 'success' | 'warning' | 'danger' | 'gold'

const TONE_CLASSES: Record<Tone, string> = {
  neutral: 'bg-brand-lightGray text-brand-charcoal',
  info: 'bg-brand-paleBlue text-brand-primary',
  progress: 'bg-brand-softBlue/60 text-brand-darkBlue',
  success: 'bg-emerald-100 text-emerald-700',
  warning: 'bg-amber-100 text-amber-800',
  danger: 'bg-rose-100 text-rose-700',
  gold: 'bg-brand-softGold text-brand-darkGold',
}

// Maps referral/record statuses to a tone.
const STATUS_TONES: Record<string, Tone> = {
  New: 'gold',
  Contacted: 'info',
  'Assessment Scheduled': 'progress',
  'Start of Care': 'success',
  Declined: 'danger',
  Active: 'success',
  Locked: 'neutral',
  Open: 'info',
  Resolved: 'success',
  Submitted: 'success',
  Draft: 'neutral',
  Pending: 'warning',
  'Pending Review': 'warning',
  'Approved / Live': 'success',
  Rejected: 'danger',
  Archived: 'neutral',
  'Pending Activation': 'warning',
  'Subscribed / Unverified': 'info',
  'Suspended / Deactivated': 'danger',
  'In Progress': 'progress',
}

interface FAHCStatusBadgeProps {
  status: string
  tone?: Tone
  className?: string
  dot?: boolean
}

export function FAHCStatusBadge({ status, tone, className, dot = true }: FAHCStatusBadgeProps) {
  const resolved = tone ?? STATUS_TONES[status] ?? 'neutral'
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold',
        TONE_CLASSES[resolved],
        className,
      )}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />}
      {status}
    </span>
  )
}
