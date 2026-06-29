'use client'

import Link from 'next/link'
import { useAuth } from '@/lib/auth'
import { getAllAgencies } from '@/lib/api'
import { FAHCCard } from '@/components/ui/FAHCCard'
import { FAHCStatusBadge } from '@/components/ui/FAHCStatusBadge'
import { AdminScopeNote } from '@/components/admin/AdminScopeNote'
import { ProgressBar } from '@/components/charts/Charts'
import { IconMail, IconPhone, IconMapPin, IconChevronRight } from '@/components/ui/icons'

export default function AdminAgenciesPage() {
  const { currentUser } = useAuth()
  if (!currentUser) return null
  const agencies = getAllAgencies(currentUser)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-2xl font-semibold text-brand-primary">Agencies</h2>
        <p className="mt-1 text-sm text-brand-charcoal/70">All partner agencies on the platform.</p>
      </div>

      <AdminScopeNote viewer={currentUser} />

      <div className="grid gap-4 md:grid-cols-2">
        {agencies.map((a) => (
          <FAHCCard key={a.id}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-heading text-base font-semibold text-brand-primary">{a.displayName}</h3>
                <p className="text-xs text-brand-charcoal/55">{a.legalName}</p>
              </div>
              <FAHCStatusBadge status={a.status} />
            </div>

            <div className="mt-3 flex flex-wrap gap-1.5">
              {a.serviceOfferings.map((s) => (
                <span key={s} className="rounded-lg bg-brand-paleBlue px-2 py-0.5 text-xs text-brand-primary">
                  {s}
                </span>
              ))}
            </div>

            <dl className="mt-4 space-y-1.5 text-sm text-brand-charcoal/80">
              <div className="flex items-center gap-2">
                <IconPhone className="h-4 w-4 text-brand-charcoal/40" /> {a.contactInfo.phone}
              </div>
              <div className="flex items-center gap-2">
                <IconMail className="h-4 w-4 text-brand-charcoal/40" /> {a.contactInfo.email}
              </div>
              <div className="flex items-center gap-2">
                <IconMapPin className="h-4 w-4 text-brand-charcoal/40" /> {a.serviceAreas.join(', ')}
              </div>
            </dl>

            <div className="mt-4">
              <div className="mb-1 flex items-center justify-between text-xs text-brand-charcoal/60">
                <span>Profile completeness</span>
                <span className="font-semibold text-brand-primary">{a.profileCompleteness}%</span>
              </div>
              <ProgressBar value={a.profileCompleteness} />
            </div>

            <Link
              href={`/admin/provider-portal/agencies/${a.id}`}
              className="mt-4 inline-flex items-center gap-1 text-sm fahc-link"
            >
              Manage activation &amp; agreements
              <IconChevronRight className="h-4 w-4" />
            </Link>
          </FAHCCard>
        ))}
      </div>
    </div>
  )
}
