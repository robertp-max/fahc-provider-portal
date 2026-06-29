'use client'

import { useAuth } from '@/lib/auth'
import { getAuditEvents } from '@/lib/audit'
import { FAHCCard } from '@/components/ui/FAHCCard'
import { FAHCAuditTimeline } from '@/components/audit/FAHCAuditTimeline'
import { AdminScopeNote } from '@/components/admin/AdminScopeNote'
import { PhiBadge } from '@/components/ui/PhiBadge'
import { IconShield } from '@/components/ui/icons'

export default function AdminAuditPage() {
  const { currentUser } = useAuth()
  if (!currentUser) return null

  const events = getAuditEvents(currentUser)
  const phiCount = events.filter((e) => e.phiFlag).length

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-2xl font-semibold text-brand-primary">Audit Log</h2>
        <p className="mt-1 text-sm text-brand-charcoal/70">
          Append-only record of every governed action — timestamp, actor, role, and IP.
        </p>
      </div>

      <AdminScopeNote viewer={currentUser} />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div className="fahc-surface p-4">
          <p className="text-sm text-brand-charcoal/60">Total events</p>
          <p className="font-heading text-2xl font-semibold text-brand-primary">{events.length}</p>
        </div>
        <div className="fahc-surface p-4">
          <p className="flex items-center gap-1 text-sm text-brand-charcoal/60">
            PHI accesses <PhiBadge />
          </p>
          <p className="font-heading text-2xl font-semibold text-brand-darkGold">{phiCount}</p>
        </div>
        <div className="fahc-surface flex items-center gap-2 p-4 text-sm text-brand-charcoal/70">
          <IconShield className="h-5 w-5 shrink-0 text-brand-primary" />
          Immutable — events cannot be edited or deleted.
        </div>
      </div>

      <FAHCCard title="Activity">
        <FAHCAuditTimeline viewer={currentUser} emptyHint="No audit activity recorded yet." />
      </FAHCCard>
    </div>
  )
}
