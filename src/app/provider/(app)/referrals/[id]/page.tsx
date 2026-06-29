'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { getReferralById, getOutcomeUpdates } from '@/lib/api'
import { FAHCReferralDetailPanel } from '@/components/referrals/FAHCReferralDetailPanel'
import { FAHCEmptyState } from '@/components/ui/FAHCEmptyState'
import { IconShield } from '@/components/ui/icons'

export default function ReferralDetailPage() {
  const params = useParams<{ id: string }>()
  const { currentUser } = useAuth()
  if (!currentUser) return null

  const referral = getReferralById(currentUser, params.id)

  // Tenant isolation: a referral outside the user's agency resolves to nothing.
  if (!referral) {
    return (
      <FAHCEmptyState
        icon={<IconShield className="h-6 w-6" />}
        title="Referral not available"
        description="This referral doesn't exist or belongs to another agency. You can only access referrals assigned to your agency."
        action={
          <Link href="/provider/referrals" className="fahc-btn-primary">
            Back to referrals
          </Link>
        }
      />
    )
  }

  const updates = getOutcomeUpdates(currentUser, referral.id)

  return (
    <FAHCReferralDetailPanel referral={referral} initialUpdates={updates} viewer={currentUser} />
  )
}
