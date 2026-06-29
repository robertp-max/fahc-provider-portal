'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/auth'
import { getMyAgency, getReferrals, getRevenue } from '@/lib/api'
import type { RevenueSubmission } from '@/lib/types'
import { FAHCRevenueForm } from '@/components/forms/FAHCRevenueForm'
import { FAHCCard } from '@/components/ui/FAHCCard'
import { FAHCStatusBadge } from '@/components/ui/FAHCStatusBadge'
import { FAHCMetricCard } from '@/components/ui/FAHCMetricCard'
import { FAHCEmptyState } from '@/components/ui/FAHCEmptyState'
import { ProviderActiveGate } from '@/components/provider/ProviderActiveGate'
import { IconRevenue } from '@/components/ui/icons'
import { formatCurrency, formatDate } from '@/lib/utils'

export default function RevenuePage() {
  const { currentUser } = useAuth()
  const [extra, setExtra] = useState<RevenueSubmission[]>([])

  if (!currentUser) return null
  const agency = getMyAgency(currentUser)
  const referrals = getReferrals(currentUser)
  const submissions = [...extra, ...getRevenue(currentUser)]

  const submitted = submissions.filter((s) => s.status === 'Submitted')
  const total = submitted.reduce((sum, s) => sum + s.revenueAmount, 0)
  const drafts = submissions.filter((s) => s.status !== 'Submitted').length

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-2xl font-semibold text-brand-primary">Monthly Revenue</h2>
        <p className="mt-1 text-sm text-brand-charcoal/70">
          Submit revenue per referral for reconciliation. Entries autosave as you type.
        </p>
      </div>

      <ProviderActiveGate agency={agency} feature="Revenue submission">
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <FAHCMetricCard
              label="Submitted (total)"
              value={formatCurrency(total)}
              icon={<IconRevenue className="h-5 w-5" />}
              emphasis
            />
            <FAHCMetricCard label="Submissions" value={submitted.length} hint="All time" />
            <FAHCMetricCard label="Drafts" value={drafts} hint="Pending submission" />
            <FAHCMetricCard
              label="Payment modes"
              value={agency?.paymentMethods.length ?? 0}
              hint="On file"
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-5">
            <div className="lg:col-span-3">
              <FAHCRevenueForm
                referrals={referrals}
                paymentMethods={agency?.paymentMethods ?? []}
                viewer={currentUser}
                onSubmitted={(s) => setExtra((prev) => [s, ...prev])}
              />
            </div>

            <div className="lg:col-span-2">
              <FAHCCard title="Submission history" flush>
                {submissions.length === 0 ? (
                  <div className="p-5">
                    <FAHCEmptyState
                      icon={<IconRevenue className="h-6 w-6" />}
                      title="No revenue submitted yet"
                      description="Use the form to record your first monthly revenue entry."
                    />
                  </div>
                ) : (
                  <ul className="divide-y divide-brand-lightGray/70">
                    {submissions.map((s) => (
                      <li key={s.id} className="flex items-center gap-3 px-5 py-3.5">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-brand-charcoal">
                            {formatCurrency(s.revenueAmount)}{' '}
                            <span className="font-normal text-brand-charcoal/50">· {s.monthYear}</span>
                          </p>
                          <p className="truncate text-xs text-brand-charcoal/60">
                            {s.referralId} · {s.paymentMode}
                            {s.submittedAt ? ` · ${formatDate(s.submittedAt)}` : ''}
                          </p>
                        </div>
                        <FAHCStatusBadge status={s.status} />
                      </li>
                    ))}
                  </ul>
                )}
              </FAHCCard>
            </div>
          </div>
        </div>
      </ProviderActiveGate>
    </div>
  )
}
