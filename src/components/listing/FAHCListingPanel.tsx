'use client'

import { useCallback, useEffect, useState } from 'react'
import type { Agency, ProviderUser, ListingRecord } from '@/lib/types'
import { isAgencyActive } from '@/lib/api'
import {
  getListing,
  submitForReview,
  revertToDraft,
  LISTING_EVENT,
} from '@/lib/listings'
import { logAudit } from '@/lib/audit'
import { FAHCCard } from '@/components/ui/FAHCCard'
import { FAHCStatusBadge } from '@/components/ui/FAHCStatusBadge'
import { IconCheckCircle, IconAlert, IconClock } from '@/components/ui/icons'
import { formatDateTime } from '@/lib/utils'

interface Props {
  agency: Agency
  viewer: ProviderUser
}

/** Provider-facing business-listing lifecycle card (mock state engine). */
export function FAHCListingPanel({ agency, viewer }: Props) {
  const [listing, setListing] = useState<ListingRecord>(() => getListing(agency.id))
  const active = isAgencyActive(agency)

  const refresh = useCallback(() => setListing(getListing(agency.id)), [agency.id])
  useEffect(() => {
    refresh()
    const handler = () => refresh()
    window.addEventListener(LISTING_EVENT, handler)
    return () => window.removeEventListener(LISTING_EVENT, handler)
  }, [refresh])

  const submit = () => {
    if (!active) return
    submitForReview(agency.id, viewer.name)
    logAudit({
      actor: viewer,
      action: 'listing_submitted',
      objectType: 'Listing',
      objectId: agency.id,
      phiFlag: false,
      surface: 'provider',
    })
  }

  const newDraft = () => {
    revertToDraft(agency.id, viewer.name)
    logAudit({
      actor: viewer,
      action: 'listing_reverted_to_draft',
      objectType: 'Listing',
      objectId: agency.id,
      phiFlag: false,
      surface: 'provider',
    })
  }

  const status = listing.status

  return (
    <FAHCCard
      title="Public listing"
      subtitle="Your profile goes live only after internal review & approval"
      action={<FAHCStatusBadge status={status} />}
    >
      {!active && (
        <div className="mb-4 flex items-start gap-2 rounded-xl border border-brand-darkGold/30 bg-brand-softGold/40 px-3 py-2.5 text-sm text-brand-darkGold">
          <IconAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <span className="text-brand-charcoal">
            Your agency isn&rsquo;t Active yet, so you can&rsquo;t submit a listing for review.
            An internal coordinator will activate your account once onboarding is complete.
          </span>
        </div>
      )}

      {status === 'Rejected' && listing.rejectionComment && (
        <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm text-rose-800">
          <p className="font-semibold">Listing changes requested</p>
          <p className="mt-0.5 text-brand-charcoal">{listing.rejectionComment}</p>
        </div>
      )}

      <div className="space-y-3">
        <p className="text-sm text-brand-charcoal/70">
          {status === 'Draft' && 'Your listing is a draft. Submit it for review when you’re ready — you can’t publish directly.'}
          {status === 'Pending Review' && 'Your listing is awaiting internal review. You’ll be notified once it’s approved.'}
          {status === 'Approved / Live' && 'Your listing is live. To make changes, start a new draft (this takes the listing back into review).'}
          {status === 'Rejected' && 'Start a new draft to address the feedback and resubmit.'}
          {status === 'Archived' && 'This listing is archived.'}
        </p>

        <div className="flex flex-wrap gap-3">
          {status === 'Draft' && (
            <button type="button" onClick={submit} disabled={!active} className="fahc-btn-primary">
              <IconCheckCircle className="h-4 w-4" /> Submit for review
            </button>
          )}
          {status === 'Pending Review' && (
            <span className="inline-flex items-center gap-1.5 text-sm text-brand-charcoal/60">
              <IconClock className="h-4 w-4" /> Awaiting internal review
            </span>
          )}
          {(status === 'Approved / Live' || status === 'Rejected') && (
            <button type="button" onClick={newDraft} className="fahc-btn-ghost border border-brand-softBlue">
              Create new draft
            </button>
          )}
        </div>

        {listing.history.length > 0 && (
          <details className="mt-2">
            <summary className="cursor-pointer text-xs text-brand-charcoal/55">Listing history</summary>
            <ul className="mt-2 space-y-1.5">
              {listing.history.slice(0, 5).map((h, i) => (
                <li key={i} className="text-xs text-brand-charcoal/60">
                  <span className="font-medium text-brand-charcoal">{h.status}</span> · {h.by} ·{' '}
                  {formatDateTime(h.at)}
                  {h.comment ? ` · “${h.comment}”` : ''}
                </li>
              ))}
            </ul>
          </details>
        )}
      </div>
    </FAHCCard>
  )
}
