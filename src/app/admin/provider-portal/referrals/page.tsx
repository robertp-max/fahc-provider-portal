'use client'

import { useAuth } from '@/lib/auth'
import { getAllReferrals } from '@/lib/api'
import { FAHCReferralTable } from '@/components/referrals/FAHCReferralTable'
import { AdminScopeNote } from '@/components/admin/AdminScopeNote'

export default function AdminReferralsPage() {
  const { currentUser } = useAuth()
  if (!currentUser) return null
  const referrals = getAllReferrals(currentUser)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-2xl font-semibold text-brand-primary">All Referrals</h2>
        <p className="mt-1 text-sm text-brand-charcoal/70">
          Cross-agency referral oversight. Names remain masked until a detail view is opened.
        </p>
      </div>

      <AdminScopeNote viewer={currentUser} />

      {/* Detail view reuses the provider panel (internal roles can open any tenant). */}
      <FAHCReferralTable referrals={referrals} basePath="/provider/referrals" showAgency />
    </div>
  )
}
