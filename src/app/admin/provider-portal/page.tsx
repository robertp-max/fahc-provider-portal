'use client'

import Link from 'next/link'
import { useAuth } from '@/lib/auth'
import { getAllAgencies, getAllReferrals, getSubmittedRevenueTotal } from '@/lib/api'
import { getAuditEvents } from '@/lib/audit'
import { FAHCCard } from '@/components/ui/FAHCCard'
import { FAHCMetricCard } from '@/components/ui/FAHCMetricCard'
import { FAHCAuditTimeline } from '@/components/audit/FAHCAuditTimeline'
import { AdminScopeNote } from '@/components/admin/AdminScopeNote'
import { IconBuilding, IconReferrals, IconRevenue, IconShield, IconChevronRight } from '@/components/ui/icons'
import { formatCurrency } from '@/lib/utils'

export default function AdminOverviewPage() {
  const { currentUser } = useAuth()
  if (!currentUser) return null

  const agencies = getAllAgencies(currentUser)
  const referrals = getAllReferrals(currentUser)
  const revenue = getSubmittedRevenueTotal(currentUser)
  const auditCount = getAuditEvents(currentUser).length

  const links = [
    { href: '/admin/provider-portal/agencies', label: 'Manage agencies', Icon: IconBuilding },
    { href: '/admin/provider-portal/referrals', label: 'All referrals', Icon: IconReferrals },
    { href: '/admin/provider-portal/audit', label: 'Audit log', Icon: IconShield },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-2xl font-semibold text-brand-primary">Admin Overview</h2>
        <p className="mt-1 text-sm text-brand-charcoal/70">
          Oversight across provider agencies, referrals, and compliance.
        </p>
      </div>

      <AdminScopeNote viewer={currentUser} />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <FAHCMetricCard label="Agencies" value={agencies.length} icon={<IconBuilding className="h-5 w-5" />} emphasis />
        <FAHCMetricCard label="Referrals" value={referrals.length} icon={<IconReferrals className="h-5 w-5" />} />
        <FAHCMetricCard label="Revenue (submitted)" value={formatCurrency(revenue)} icon={<IconRevenue className="h-5 w-5" />} />
        <FAHCMetricCard label="Audit events" value={auditCount} icon={<IconShield className="h-5 w-5" />} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <FAHCCard title="Recent audit activity" className="lg:col-span-2" subtitle="Global immutable log">
          <FAHCAuditTimeline viewer={currentUser} limit={6} />
        </FAHCCard>

        <FAHCCard title="Quick links">
          <div className="space-y-2">
            {links.map(({ href, label, Icon }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-3 rounded-xl border border-brand-lightGray/70 px-3 py-2.5 text-sm font-medium text-brand-charcoal hover:border-brand-softBlue hover:bg-brand-paleBlue/50"
              >
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-paleBlue text-brand-primary">
                  <Icon className="h-4 w-4" />
                </span>
                {label}
                <IconChevronRight className="ml-auto h-4 w-4 text-brand-charcoal/30" />
              </Link>
            ))}
          </div>
        </FAHCCard>
      </div>
    </div>
  )
}
