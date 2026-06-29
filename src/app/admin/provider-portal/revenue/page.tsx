'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/auth'
import { getAllRevenue, getAllAgencies } from '@/lib/api'
import { logAudit } from '@/lib/audit'
import { FAHCCard } from '@/components/ui/FAHCCard'
import { FAHCStatusBadge } from '@/components/ui/FAHCStatusBadge'
import { FAHCMetricCard } from '@/components/ui/FAHCMetricCard'
import { AdminScopeNote } from '@/components/admin/AdminScopeNote'
import { IconRevenue, IconCheckCircle } from '@/components/ui/icons'
import { formatCurrency, formatDate } from '@/lib/utils'

export default function AdminRevenuePage() {
  const { currentUser } = useAuth()
  const [reviewed, setReviewed] = useState<Record<string, boolean>>({})

  if (!currentUser) return null
  const readOnly = currentUser.role === 'Read-only Auditor'
  const rows = getAllRevenue(currentUser)
  const agencies = getAllAgencies(currentUser)
  const nameFor = (id: string) => agencies.find((a) => a.id === id)?.displayName ?? id

  const submitted = rows.filter((r) => r.status === 'Submitted')
  const total = submitted.reduce((s, r) => s + r.revenueAmount, 0)

  const review = (id: string) => {
    if (readOnly) return
    setReviewed((prev) => ({ ...prev, [id]: true }))
    logAudit({
      actor: currentUser,
      action: 'admin_revenue_reviewed',
      objectType: 'RevenueSubmission',
      objectId: id,
      phiFlag: false,
      surface: 'admin',
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-2xl font-semibold text-brand-primary">Revenue Review</h2>
        <p className="mt-1 text-sm text-brand-charcoal/70">
          Review submitted revenue across agencies. Prototype — no payment is executed.
        </p>
      </div>

      <AdminScopeNote viewer={currentUser} />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <FAHCMetricCard
          label="Submitted (total)"
          value={formatCurrency(total)}
          icon={<IconRevenue className="h-5 w-5" />}
          emphasis
        />
        <FAHCMetricCard label="Submissions" value={submitted.length} hint="Submitted status" />
        <FAHCMetricCard label="All entries" value={rows.length} hint="Incl. drafts" />
        <FAHCMetricCard label="Reviewed" value={Object.keys(reviewed).length} hint="This session" />
      </div>

      <FAHCCard title="Revenue submissions" flush>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-brand-lightGray/70 bg-brand-paleBlue/40 text-xs uppercase tracking-wide text-brand-charcoal/60">
                <th className="px-4 py-3 font-semibold">Agency</th>
                <th className="px-4 py-3 font-semibold">Referral</th>
                <th className="px-4 py-3 font-semibold">Month</th>
                <th className="px-4 py-3 font-semibold">Amount</th>
                <th className="px-4 py-3 font-semibold">Mode</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Submitted</th>
                <th className="px-4 py-3 font-semibold">Review</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-lightGray/70">
              {rows.map((r) => (
                <tr key={r.id}>
                  <td className="px-4 py-3 font-medium text-brand-charcoal">{nameFor(r.agencyId)}</td>
                  <td className="px-4 py-3 text-brand-charcoal/70">{r.referralId}</td>
                  <td className="px-4 py-3 text-brand-charcoal/70">{r.monthYear}</td>
                  <td className="px-4 py-3 font-semibold text-brand-primary">
                    {formatCurrency(r.revenueAmount)}
                  </td>
                  <td className="px-4 py-3 text-brand-charcoal/70">{r.paymentMode}</td>
                  <td className="px-4 py-3">
                    <FAHCStatusBadge status={r.status} />
                  </td>
                  <td className="px-4 py-3 text-brand-charcoal/70">{formatDate(r.submittedAt)}</td>
                  <td className="px-4 py-3">
                    {reviewed[r.id] ? (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600">
                        <IconCheckCircle className="h-4 w-4" /> Reviewed
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => review(r.id)}
                        disabled={readOnly || r.status !== 'Submitted'}
                        className="fahc-btn-ghost border border-brand-softBlue py-1.5 text-xs"
                      >
                        Mark reviewed
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </FAHCCard>
    </div>
  )
}
