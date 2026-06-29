'use client'

import { useRef, useState } from 'react'
import type { Referral, ProviderUser, RevenueSubmission } from '@/lib/types'
import { logAudit } from '@/lib/audit'
import { FAHCCard } from '@/components/ui/FAHCCard'
import { IconCheckCircle, IconClock, IconRevenue, IconShield } from '@/components/ui/icons'
import { cn, formatCurrency, formatTime, makeId } from '@/lib/utils'

type SaveState = 'idle' | 'saving' | 'saved'

interface Props {
  referrals: Referral[]
  paymentMethods: string[]
  viewer: ProviderUser
  onSubmitted?: (submission: RevenueSubmission) => void
}

const PAYMENT_MODE_FALLBACK = ['Autopay', 'Credit Card', 'ACH', 'Check']

// Structured, PHI-safe categories replace the old free-text "notes" field.
const NOTE_CATEGORIES = [
  'Monthly reconciliation',
  'Correction',
  'Autopay verification',
  'Other non-PHI administrative note',
]

export function FAHCRevenueForm({ referrals, paymentMethods, viewer, onSubmitted }: Props) {
  const modes = paymentMethods.length ? paymentMethods : PAYMENT_MODE_FALLBACK

  const [referralId, setReferralId] = useState(referrals[0]?.id ?? '')
  const [monthYear, setMonthYear] = useState('2026-06')
  const [amount, setAmount] = useState('')
  const [paymentMode, setPaymentMode] = useState(modes[0] ?? 'Autopay')
  const [noteCategory, setNoteCategory] = useState(NOTE_CATEGORIES[0])

  const [saveState, setSaveState] = useState<SaveState>('idle')
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const savingTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const isAutopay = paymentMode === 'Autopay'
  const amountNum = Number(amount) || 0

  // Autosave: triggered on blur of any field that carries meaningful content.
  const autosave = (field: string) => {
    if (!referralId && !amount) return // nothing worth saving yet
    setSubmitted(false)
    setSaveState('saving')
    if (savingTimer.current) clearTimeout(savingTimer.current)
    savingTimer.current = setTimeout(() => {
      const now = new Date().toISOString()
      setSaveState('saved')
      setLastSavedAt(now)
      logAudit({
        actor: viewer,
        action: 'revenue_autosaved',
        objectType: 'RevenueSubmission',
        objectId: referralId || 'draft',
        phiFlag: false,
        surface: 'provider',
        // field NAME only (no value), amount + mode are non-PHI numerics/enums
        metadata: { field, monthYear, amount: amountNum, paymentMode },
      })
    }, 600)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!referralId) return setError('Select the referral this revenue relates to.')
    if (!monthYear) return setError('Select the month and year.')
    if (!amount || Number.isNaN(amountNum) || amountNum <= 0)
      return setError('Enter a valid revenue amount.')

    const now = new Date().toISOString()
    const submission: RevenueSubmission = {
      id: makeId('rev'),
      agencyId: viewer.agencyId,
      referralId,
      monthYear,
      revenueAmount: amountNum,
      paymentMode,
      // Structured category only — never free text, so no PHI can be stored.
      supportingNotes: noteCategory,
      status: 'Submitted',
      autosavedAt: lastSavedAt ?? undefined,
      submittedAt: now,
      submittedBy: viewer.name,
    }
    setSubmitted(true)
    setSaveState('idle')
    logAudit({
      actor: viewer,
      action: 'revenue_submitted',
      objectType: 'RevenueSubmission',
      objectId: submission.id,
      phiFlag: false,
      surface: 'provider',
      metadata: { monthYear, amount: amountNum, paymentMode },
    })
    if (isAutopay) {
      logAudit({
        actor: viewer,
        action: 'autopay_revenue_recorded',
        objectType: 'RevenueSubmission',
        objectId: submission.id,
        phiFlag: false,
        surface: 'provider',
        metadata: { monthYear, amount: amountNum },
      })
    }
    onSubmitted?.(submission)
  }

  return (
    <FAHCCard
      title="Submit monthly revenue"
      subtitle="Autosaves as you go — your entry is never lost"
      action={<SaveIndicator state={saveState} lastSavedAt={lastSavedAt} />}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="rev-referral" className="fahc-label">
              Referral
            </label>
            <select
              id="rev-referral"
              value={referralId}
              onChange={(e) => setReferralId(e.target.value)}
              onBlur={() => autosave('referralId')}
              className="fahc-input"
            >
              {referrals.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.id} · {r.firstNameMasked} {r.lastNameMasked} ({r.category})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="rev-month" className="fahc-label">
              Month / Year
            </label>
            <input
              id="rev-month"
              type="month"
              value={monthYear}
              onChange={(e) => setMonthYear(e.target.value)}
              onBlur={() => autosave('monthYear')}
              className="fahc-input"
            />
          </div>
          <div>
            <label htmlFor="rev-amount" className="fahc-label">
              Revenue amount (USD)
            </label>
            <input
              id="rev-amount"
              type="number"
              min={0}
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              onBlur={() => autosave('revenueAmount')}
              placeholder="0.00"
              className="fahc-input"
            />
          </div>
          <div>
            <label htmlFor="rev-mode" className="fahc-label">
              Payment mode
            </label>
            <select
              id="rev-mode"
              value={paymentMode}
              onChange={(e) => setPaymentMode(e.target.value)}
              onBlur={() => autosave('paymentMode')}
              className="fahc-input"
            >
              {modes.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Structured (PHI-safe) supporting note */}
        <div>
          <label htmlFor="rev-note" className="fahc-label">
            Supporting note <span className="font-normal text-brand-charcoal/50">(category)</span>
          </label>
          <select
            id="rev-note"
            value={noteCategory}
            onChange={(e) => setNoteCategory(e.target.value)}
            onBlur={() => autosave('supportingNoteCategory')}
            className="fahc-input"
          >
            {NOTE_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <p className="mt-1.5 flex items-start gap-1.5 text-xs text-brand-charcoal/55">
            <IconShield className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-darkGold" />
            Do not enter client names, phone numbers, email addresses, diagnoses, or care details.
            Notes are limited to fixed categories to keep this surface PHI-free.
          </p>
        </div>

        {/* Autopay mocked workflow */}
        {isAutopay ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
            <p className="flex items-center gap-1.5 font-semibold">
              <IconRevenue className="h-4 w-4" /> Autopay — mocked charge summary
            </p>
            <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-emerald-800">
              <dt className="text-emerald-700/80">Referral</dt>
              <dd className="text-right font-medium">{referralId || '—'}</dd>
              <dt className="text-emerald-700/80">Month / Year</dt>
              <dd className="text-right font-medium">{monthYear || '—'}</dd>
              <dt className="text-emerald-700/80">Revenue amount</dt>
              <dd className="text-right font-medium">{formatCurrency(amountNum)}</dd>
              <dt className="text-emerald-700/80">Calculated charge basis</dt>
              <dd className="text-right font-medium">{formatCurrency(amountNum)}</dd>
            </dl>
            <p className="mt-2 text-xs text-emerald-700/80">
              No upload required. <strong>This is a prototype calculation only</strong> — no payment
              is executed and no agency is charged.
            </p>
          </div>
        ) : (
          <div className="flex items-start gap-2 rounded-xl bg-brand-paleBlue/60 px-3 py-2.5 text-sm text-brand-charcoal">
            <IconRevenue className="mt-0.5 h-4 w-4 shrink-0" />
            <span>Submit the revenue figure for reconciliation. No file upload required.</span>
          </div>
        )}

        {error && <p className="text-sm text-rose-600">{error}</p>}
        {submitted && (
          <p className="flex items-center gap-1.5 text-sm text-emerald-600">
            <IconCheckCircle className="h-4 w-4" /> Revenue submitted and recorded in the audit trail.
          </p>
        )}

        <div className="flex justify-end">
          <button type="submit" className="fahc-btn-primary">
            Submit revenue
          </button>
        </div>
      </form>
    </FAHCCard>
  )
}

function SaveIndicator({ state, lastSavedAt }: { state: SaveState; lastSavedAt: string | null }) {
  if (state === 'saving') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-charcoal/60">
        <IconClock className="h-3.5 w-3.5 animate-pulse" /> Saving…
      </span>
    )
  }
  if (state === 'saved' && lastSavedAt) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600">
        <IconCheckCircle className="h-3.5 w-3.5" /> Auto-saved at {formatTime(lastSavedAt)}
      </span>
    )
  }
  return null
}
