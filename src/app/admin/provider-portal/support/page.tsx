'use client'

import Link from 'next/link'
import { useAuth } from '@/lib/auth'
import { getSupportThreads } from '@/lib/api'
import { FAHCCard } from '@/components/ui/FAHCCard'
import { FAHCStatusBadge } from '@/components/ui/FAHCStatusBadge'
import { FAHCEmptyState } from '@/components/ui/FAHCEmptyState'
import { AdminScopeNote } from '@/components/admin/AdminScopeNote'
import { IconChat } from '@/components/ui/icons'
import { relativeTime } from '@/lib/utils'

export default function AdminSupportPage() {
  const { currentUser } = useAuth()
  if (!currentUser) return null
  const threads = getSupportThreads(currentUser)

  const open = threads.filter((t) => t.status === 'Open')
  const resolved = threads.filter((t) => t.status === 'Resolved')

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-2xl font-semibold text-brand-primary">Support Queues</h2>
        <p className="mt-1 text-sm text-brand-charcoal/70">
          Provider support conversations across agencies.
        </p>
      </div>

      <AdminScopeNote viewer={currentUser} />

      <div className="grid grid-cols-3 gap-4">
        <div className="fahc-surface p-4">
          <p className="text-sm text-brand-charcoal/60">Total</p>
          <p className="font-heading text-2xl font-semibold text-brand-primary">{threads.length}</p>
        </div>
        <div className="fahc-surface p-4">
          <p className="text-sm text-brand-charcoal/60">Open</p>
          <p className="font-heading text-2xl font-semibold text-brand-gold">{open.length}</p>
        </div>
        <div className="fahc-surface p-4">
          <p className="text-sm text-brand-charcoal/60">Resolved</p>
          <p className="font-heading text-2xl font-semibold text-emerald-600">{resolved.length}</p>
        </div>
      </div>

      <FAHCCard title="Conversations" flush>
        {threads.length === 0 ? (
          <div className="p-5">
            <FAHCEmptyState icon={<IconChat className="h-6 w-6" />} title="No support threads" />
          </div>
        ) : (
          <ul className="divide-y divide-brand-lightGray/70">
            {threads.map((t) => {
              const last = t.messages[t.messages.length - 1]
              return (
                <li key={t.id} className="flex items-center gap-4 px-5 py-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-semibold text-brand-charcoal">{t.subject}</p>
                      <FAHCStatusBadge status={t.status} dot={false} />
                    </div>
                    <p className="truncate text-xs text-brand-charcoal/55">
                      {t.category} · {t.agencyId} · {t.createdBy}
                    </p>
                    {last && (
                      <p className="mt-1 truncate text-sm text-brand-charcoal/70">
                        <span className="font-medium">{last.author}:</span> {last.body}
                      </p>
                    )}
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-xs text-brand-charcoal/50">{relativeTime(t.updatedAt)}</p>
                    <Link href={`/admin/provider-portal/support/${t.id}`} className="fahc-link text-xs">
                      Open
                    </Link>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </FAHCCard>
    </div>
  )
}
