'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { getReferralById, getOutcomeUpdates } from '@/lib/api'
import { FAHCReferralDetailPanel } from '@/components/referrals/FAHCReferralDetailPanel'
import { FAHCEmptyState } from '@/components/ui/FAHCEmptyState'
import { IconShield } from '@/components/ui/icons'

export default function AdminReferralDetailPage() {
  const params = useParams<{ id: string }>()
  const { currentUser } = useAuth()
  if (!currentUser) return null

  // Internal roles can read across tenants; the admin layout already blocks providers.
  const referral = getReferralById(currentUser, params.id)
  if (!referral) {
    return (
      <FAHCEmptyState
        icon={<IconShield className="h-6 w-6" />}
        title="Referral not found"
        description="This referral doesn't exist."
        action={
          <Link href="/admin/provider-portal/referrals" className="fahc-btn-primary">
            Back to all referrals
          </Link>
        }
      />
    )
  }

  const updates = getOutcomeUpdates(currentUser, referral.id)
  const readOnly = currentUser.role === 'Read-only Auditor'

  return (
    <FAHCReferralDetailPanel
      referral={referral}
      initialUpdates={updates}
      viewer={currentUser}
      surface="admin"
      readOnly={readOnly}
    />
  )
}
