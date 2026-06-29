'use client'

import Link from 'next/link'
import type { Agency } from '@/lib/types'
import { isAgencyActive } from '@/lib/api'
import { FAHCEmptyState } from '@/components/ui/FAHCEmptyState'
import { IconAlert } from '@/components/ui/icons'

/**
 * Provider lifecycle gate. Operational features (referrals, revenue, listing
 * submission) are only available once the agency is Active. Otherwise a calm
 * "pending activation" state is shown instead of the feature.
 */
export function ProviderActiveGate({
  agency,
  feature,
  children,
}: {
  agency?: Agency
  feature: string
  children: React.ReactNode
}) {
  if (isAgencyActive(agency)) return <>{children}</>
  return (
    <FAHCEmptyState
      icon={<IconAlert className="h-6 w-6" />}
      title={`${feature} unlocks once your agency is Active`}
      description="Your account is still being activated by a Find A Home Care coordinator. You’ll get access as soon as onboarding and agreements are complete."
      action={
        <Link href="/provider/dashboard" className="fahc-btn-primary">
          Back to dashboard
        </Link>
      }
    />
  )
}
