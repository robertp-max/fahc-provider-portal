'use client'

import { useState } from 'react'
import type { ProviderUser } from '@/lib/types'
import { logAudit } from '@/lib/audit'
import { IconCheckCircle } from '@/components/ui/icons'
import { formatDateTime } from '@/lib/utils'

interface Props {
  viewer: ProviderUser
  objectId: string
}

/**
 * "Verify No Changes" — for compliance, a provider can attest their profile is
 * accurate without editing. Clicking writes a `verified_with_no_changes` audit
 * event (timestamp / user / role / IP), then locks into a success state.
 */
export function FAHCConfirmNoChangesButton({ viewer, objectId }: Props) {
  const [confirmedAt, setConfirmedAt] = useState<string | null>(null)

  const confirm = () => {
    const now = new Date().toISOString()
    setConfirmedAt(now)
    logAudit({
      actor: viewer,
      action: 'verified_with_no_changes',
      objectType: 'Agency',
      objectId,
      phiFlag: false,
      surface: 'provider',
      metadata: { verifiedBy: viewer.name },
    })
  }

  if (confirmedAt) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-medium text-emerald-700">
        <IconCheckCircle className="h-5 w-5" />
        Verified with no changes · {formatDateTime(confirmedAt)}
      </div>
    )
  }

  return (
    <button type="button" onClick={confirm} className="fahc-btn-ghost border border-brand-softBlue">
      <IconCheckCircle className="h-4 w-4" />
      Verify — no changes needed
    </button>
  )
}
