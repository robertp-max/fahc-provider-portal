'use client'

import { useAuth } from '@/lib/auth'
import { getReferrals, getMyAgency } from '@/lib/api'
import { FAHCReferralTable } from '@/components/referrals/FAHCReferralTable'
import { ProviderActiveGate } from '@/components/provider/ProviderActiveGate'

export default function ReferralsPage() {
  const { currentUser } = useAuth()
  if (!currentUser) return null

  const referrals = getReferrals(currentUser)
  const agency = getMyAgency(currentUser)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-2xl font-semibold text-brand-primary">Referral Management</h2>
        <p className="mt-1 text-sm text-brand-charcoal/70">
          Assigned referrals for your agency. Respond promptly to protect your ownership window.
        </p>
      </div>
      <ProviderActiveGate agency={agency} feature="Referrals">
        <FAHCReferralTable referrals={referrals} />
      </ProviderActiveGate>
    </div>
  )
}
