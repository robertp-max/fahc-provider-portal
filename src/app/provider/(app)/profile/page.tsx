'use client'

import { useAuth } from '@/lib/auth'
import { getMyAgency } from '@/lib/api'
import { FAHCProfileForm } from '@/components/forms/FAHCProfileForm'
import { FAHCListingPanel } from '@/components/listing/FAHCListingPanel'
import { ProgressBar } from '@/components/charts/Charts'
import { formatDate } from '@/lib/utils'

export default function ProfilePage() {
  const { currentUser } = useAuth()
  if (!currentUser) return null
  const agency = getMyAgency(currentUser)
  if (!agency) return null

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-heading text-2xl font-semibold text-brand-primary">Agency Profile</h2>
          <p className="mt-1 text-sm text-brand-charcoal/70">
            Keep your service details accurate so families receive the right information.
          </p>
        </div>
        <div className="w-full sm:w-56">
          <div className="mb-1 flex items-center justify-between text-xs text-brand-charcoal/60">
            <span>Profile completeness</span>
            <span className="font-semibold text-brand-primary">{agency.profileCompleteness}%</span>
          </div>
          <ProgressBar value={agency.profileCompleteness} />
          <p className="mt-1 text-xs text-brand-charcoal/50">
            Last verified {formatDate(agency.lastVerifiedAt)}
          </p>
        </div>
      </div>

      <FAHCListingPanel agency={agency} viewer={currentUser} />

      <FAHCProfileForm agency={agency} viewer={currentUser} />
    </div>
  )
}
