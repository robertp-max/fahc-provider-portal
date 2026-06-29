'use client'

import { useAuth } from '@/lib/auth'
import { getReferrals } from '@/lib/api'
import { FAHCReferralTable } from '@/components/referrals/FAHCReferralTable'

export default function ReferralsPage() {
  const { currentUser } = useAuth()
  if (!currentUser) return null

  const referrals = getReferrals(currentUser)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-2xl font-semibold text-brand-primary">Referral Management</h2>
        <p className="mt-1 text-sm text-brand-charcoal/70">
          Assigned referrals for your agency. Respond promptly to protect your ownership window.
        </p>
      </div>
      <FAHCReferralTable referrals={referrals} />
    </div>
  )
}
