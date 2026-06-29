'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import type { Referral, ReferralOutcomeUpdate, ReferralStatus, ProviderUser } from '@/lib/types'
import { isInternalAdmin } from '@/lib/api'
import { logAudit } from '@/lib/audit'
import { FAHCCard } from '@/components/ui/FAHCCard'
import { FAHCStatusBadge } from '@/components/ui/FAHCStatusBadge'
import { PhiBadge, PhiWarning } from '@/components/ui/PhiBadge'
import { FAHCAuditTimeline } from '@/components/audit/FAHCAuditTimeline'
import {
  IconEye,
  IconEyeOff,
  IconLock,
  IconCheckCircle,
  IconChevronRight,
  IconShield,
  IconBuilding,
} from '@/components/ui/icons'
import { cn, formatDate, formatDateTime, makeId } from '@/lib/utils'

const OUTCOME_OPTIONS: ReferralStatus[] = [
  'Contacted',
  'Assessment Scheduled',
  'Start of Care',
  'Declined',
]
const FINAL_STATUSES = ['Start of Care', 'Declined']

interface Props {
  referral: Referral
  initialUpdates: ReferralOutcomeUpdate[]
  viewer: ProviderUser
  /** Which surface is rendering this panel (affects audit + navigation). */
  surface?: 'provider' | 'admin'
  /** Read-only viewers (e.g. Read-only Auditor) can view but never edit. */
  readOnly?: boolean
}

export function FAHCReferralDetailPanel({
  referral,
  initialUpdates,
  viewer,
  surface = 'provider',
  readOnly = false,
}: Props) {
  const [status, setStatus] = useState(referral.status)
  const [updates, setUpdates] = useState<ReferralOutcomeUpdate[]>(initialUpdates)
  const [revealed, setRevealed] = useState(false)

  const [outcome, setOutcome] = useState<ReferralStatus>('Contacted')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [savedAt, setSavedAt] = useState<string | null>(null)

  const admin = isInternalAdmin(viewer)
  const locked = referral.locked || FINAL_STATUSES.includes(status)
  const canEdit = (!locked || admin) && !readOnly
  const backHref = surface === 'admin' ? '/admin/provider-portal/referrals' : '/provider/referrals'

  // Audit the detail view exactly once per mount.
  const viewLogged = useRef(false)
  useEffect(() => {
    if (viewLogged.current) return
    viewLogged.current = true
    logAudit({
      actor: viewer,
      action: 'referral_viewed',
      objectType: 'Referral',
      objectId: referral.id,
      phiFlag: false,
      surface,
      metadata: { status: referral.status },
    })
  }, [referral.id, referral.status, viewer, surface])

  const handleReveal = () => {
    if (revealed) {
      setRevealed(false)
      return
    }
    setRevealed(true)
    logAudit({
      actor: viewer,
      action: 'phi_unmasked',
      objectType: 'Referral',
      objectId: referral.id,
      phiFlag: true,
      surface,
      metadata: { reason: 'Authorized viewer revealed full identity' },
    })
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!notes.trim()) {
      setError('Please add a note describing this update before saving.')
      return
    }
    const wasLocked = locked
    const now = new Date().toISOString()
    const update: ReferralOutcomeUpdate = {
      id: makeId('upd'),
      referralId: referral.id,
      agencyId: referral.agencyId,
      outcome,
      notes: notes.trim(),
      dateOfUpdate: now,
      updatedBy: viewer.name,
      createdAt: now,
    }
    setUpdates((prev) => [update, ...prev])
    setStatus(outcome)
    setNotes('')
    setSavedAt(now)
    // If an internal admin edits a locked referral, record the override explicitly.
    if (wasLocked && admin) {
      logAudit({
        actor: viewer,
        action: 'admin_locked_referral_override',
        objectType: 'Referral',
        objectId: referral.id,
        phiFlag: false,
        surface: 'admin',
        metadata: { outcome, previousStatus: status },
      })
    }
    logAudit({
      actor: viewer,
      action: 'referral_outcome_updated',
      objectType: 'Referral',
      objectId: referral.id,
      phiFlag: false,
      surface,
      metadata: { outcome, previousStatus: status },
    })
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb + header */}
      <div>
        <Link href={backHref} className="inline-flex items-center gap-1 text-sm fahc-link">
          <IconChevronRight className="h-4 w-4 rotate-180" /> Back to referrals
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h2 className="font-heading text-2xl font-semibold text-brand-primary">
            {revealed ? referral.fullNameEncrypted : `${referral.firstNameMasked} ${referral.lastNameMasked}`}
          </h2>
          <FAHCStatusBadge status={status} />
          {locked && (
            <span className="inline-flex items-center gap-1 rounded-full bg-brand-lightGray px-2.5 py-0.5 text-xs font-semibold text-brand-charcoal">
              <IconLock className="h-3.5 w-3.5" /> Locked
            </span>
          )}
          {readOnly && (
            <span className="inline-flex items-center gap-1 rounded-full bg-brand-paleBlue px-2.5 py-0.5 text-xs font-semibold text-brand-primary">
              <IconEye className="h-3.5 w-3.5" /> Read-only
            </span>
          )}
        </div>
        <p className="mt-1 flex flex-wrap items-center gap-x-2 text-sm text-brand-charcoal/60">
          <span>{referral.id} · Assigned {formatDate(referral.assignmentDate)}</span>
          {surface === 'admin' && (
            <span className="inline-flex items-center gap-1 rounded bg-brand-paleBlue px-1.5 py-0.5 text-xs font-medium text-brand-primary">
              <IconBuilding className="h-3 w-3" /> {referral.agencyId}
            </span>
          )}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main column */}
        <div className="space-y-6 lg:col-span-2">
          {/* Identity / PHI */}
          <FAHCCard
            title="Client information"
            subtitle="Minimum necessary by default"
            action={
              <button
                type="button"
                onClick={handleReveal}
                className={cn('fahc-btn py-2 text-xs', revealed ? 'fahc-btn-ghost' : 'fahc-btn-primary')}
              >
                {revealed ? (
                  <>
                    <IconEyeOff className="h-4 w-4" /> Hide PHI
                  </>
                ) : (
                  <>
                    <IconEye className="h-4 w-4" /> Unlock PHI
                  </>
                )}
              </button>
            }
          >
            {revealed && (
              <PhiWarning className="mb-4">
                You have unmasked Protected Health Information. This access has been written to the
                immutable audit trail with your identity, role, timestamp and IP.
              </PhiWarning>
            )}
            <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
              <Field label="Full name" phi>
                {revealed ? referral.fullNameEncrypted : `${referral.firstNameMasked} ${referral.lastNameMasked}`}
              </Field>
              <Field label="Inquiry for">{referral.inquiryFor}</Field>
              <Field label="Email" phi>
                {referral.emailMasked}
              </Field>
              <Field label="Phone" phi>
                {referral.phoneMasked}
              </Field>
              <Field label="Care category">{referral.category}</Field>
              <Field label="Location (ZIP)">{referral.locationZip}</Field>
            </dl>
            <div className="mt-4 rounded-xl bg-brand-paleBlue/50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-brand-charcoal/60">
                What are you looking for?
              </p>
              <p className="mt-1 text-sm text-brand-charcoal">{referral.message}</p>
            </div>
          </FAHCCard>

          {/* Outcome update */}
          <FAHCCard title="Update referral outcome">
            {readOnly && (
              <div className="mb-4 flex items-start gap-2 rounded-xl border border-brand-softBlue bg-brand-paleBlue/50 px-3 py-2.5 text-sm text-brand-primary">
                <IconEye className="mt-0.5 h-4 w-4 shrink-0" />
                Read-only role — you can review this referral and its audit trail, but cannot edit it.
              </div>
            )}
            {!readOnly && !canEdit && (
              <div className="mb-4 flex items-start gap-2 rounded-xl border border-brand-lightGray bg-brand-lightGray/40 px-3 py-2.5 text-sm text-brand-charcoal">
                <IconLock className="mt-0.5 h-4 w-4 shrink-0" />
                This referral has reached a final status and is locked for editing. Contact your Find A
                Home Care coordinator via{' '}
                <Link href="/provider/chat" className="fahc-link">
                  Support Chat
                </Link>{' '}
                to request a change.
              </div>
            )}
            {canEdit && locked && admin && (
              <div className="mb-4 flex items-start gap-2 rounded-xl border border-brand-darkGold/30 bg-brand-softGold/40 px-3 py-2.5 text-sm text-brand-darkGold">
                <IconShield className="mt-0.5 h-4 w-4 shrink-0" />
                <span className="text-brand-charcoal">
                  Internal admin override — you are editing a locked referral. This action is audited.
                </span>
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="outcome" className="fahc-label">
                    Outcome
                  </label>
                  <select
                    id="outcome"
                    value={outcome}
                    onChange={(e) => setOutcome(e.target.value as ReferralStatus)}
                    disabled={!canEdit}
                    className="fahc-input"
                  >
                    {OUTCOME_OPTIONS.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="dateOfUpdate" className="fahc-label">
                    Date of update
                  </label>
                  <input
                    id="dateOfUpdate"
                    type="text"
                    value={formatDate(new Date().toISOString())}
                    readOnly
                    disabled
                    className="fahc-input"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="notes" className="fahc-label">
                  Notes <span className="text-rose-500">*</span>
                </label>
                <textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  disabled={!canEdit}
                  rows={3}
                  placeholder="Describe the action taken (e.g. spoke with family, scheduled assessment)…"
                  className="fahc-input"
                />
              </div>
              {error && <p className="text-sm text-rose-600">{error}</p>}
              {savedAt && (
                <p className="flex items-center gap-1.5 text-sm text-emerald-600">
                  <IconCheckCircle className="h-4 w-4" /> Outcome updated and logged at{' '}
                  {formatDateTime(savedAt)}
                </p>
              )}
              <div className="flex justify-end">
                <button type="submit" disabled={!canEdit} className="fahc-btn-primary">
                  Save update
                </button>
              </div>
            </form>
          </FAHCCard>

          {/* Outcome history */}
          <FAHCCard title="Outcome history">
            {updates.length === 0 ? (
              <p className="text-sm text-brand-charcoal/60">No outcome updates recorded yet.</p>
            ) : (
              <ul className="space-y-3">
                {updates.map((u) => (
                  <li key={u.id} className="flex gap-3 rounded-xl border border-brand-lightGray/70 p-3">
                    <FAHCStatusBadge status={u.outcome} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-brand-charcoal">{u.notes}</p>
                      <p className="mt-0.5 text-xs text-brand-charcoal/50">
                        {u.updatedBy} · {formatDateTime(u.createdAt)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </FAHCCard>
        </div>

        {/* Side column */}
        <div className="space-y-6">
          <FAHCCard title="Assignment & consent">
            <dl className="space-y-3">
              <Field label="Ownership window">
                {formatDate(referral.ownershipWindowStart)} → {formatDate(referral.ownershipWindowEnd)}
              </Field>
              <Field label="HIPAA consent">
                <span className="inline-flex items-center gap-1 text-emerald-700">
                  <IconCheckCircle className="h-4 w-4" /> {formatDateTime(referral.consentTimestamp)}
                </span>
              </Field>
              <Field label="Source lead">{referral.sourceLeadId}</Field>
              <Field label="Last updated">{formatDateTime(referral.updatedAt)}</Field>
            </dl>
          </FAHCCard>

          <FAHCCard title="Audit trail" subtitle="This referral">
            <FAHCAuditTimeline viewer={viewer} objectType="Referral" objectId={referral.id} />
          </FAHCCard>
        </div>
      </div>
    </div>
  )
}

function Field({
  label,
  children,
  phi,
}: {
  label: string
  children: React.ReactNode
  phi?: boolean
}) {
  return (
    <div>
      <dt className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-brand-charcoal/55">
        {label}
        {phi && <PhiBadge />}
      </dt>
      <dd className="mt-1 text-sm font-medium text-brand-charcoal">{children}</dd>
    </div>
  )
}
