'use client'

import { useMemo, useRef, useState } from 'react'
import type { Agency, ProviderUser, DayHours, DayOfWeek } from '@/lib/types'
import { logAudit } from '@/lib/audit'
import { FAHCCard } from '@/components/ui/FAHCCard'
import { TagField } from '@/components/forms/TagField'
import { FAHCConfirmNoChangesButton } from '@/components/forms/FAHCConfirmNoChangesButton'
import { FAHCProviderLogoUploader } from '@/components/uploads/FAHCProviderLogoUploader'
import { FAHCUploadCard } from '@/components/uploads/FAHCUploadCard'
import { IconCheckCircle, IconShield } from '@/components/ui/icons'
import { cn } from '@/lib/utils'

const SERVICE_SUGGESTIONS = ['Companion Care', 'Home Care', 'Memory Care', 'Skilled Nursing', 'Therapy', 'Respite Care', 'Live-in Care']
const PAYMENT_SUGGESTIONS = ['Autopay', 'Credit Card', 'ACH', 'Check']
const LANGUAGE_SUGGESTIONS = ['English', 'Spanish', 'Cantonese', 'Mandarin', 'Tagalog', 'Vietnamese']
const CERT_SUGGESTIONS = ['HHA', 'CNA', 'LVN', 'RN']
const SCREENING_OPTIONS = [
  'Background Checked',
  'Background Checked & Fingerprinted',
  'Background Checked, Fingerprinted & Drug Tested',
]

const DAYS: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const RATE_UPPER_BOUND = 500 // $/hr — above this we warn (non-blocking)

function defaultHours(): DayHours[] {
  return DAYS.map((day) => ({
    day,
    open: '09:00',
    close: '17:00',
    closed: day === 'Saturday' || day === 'Sunday',
  }))
}

interface Props {
  agency: Agency
  viewer: ProviderUser
}

export function FAHCProfileForm({ agency, viewer }: Props) {
  // Normalize once so optional fields are always present in form state.
  const initial = useMemo<Agency>(
    () => ({
      ...agency,
      operationalDetails: agency.operationalDetails ?? '',
      capacityNotes: agency.capacityNotes ?? '',
      intakeProcess: agency.intakeProcess ?? '',
      businessHoursByDay: agency.businessHoursByDay ?? defaultHours(),
    }),
    [agency],
  )
  const initialRef = useRef(initial)

  const [form, setForm] = useState<Agency>(initial)
  const [dirty, setDirty] = useState(false)
  const [savedAt, setSavedAt] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [warning, setWarning] = useState<string | null>(null)

  const update = <K extends keyof Agency>(key: K, value: Agency[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    setDirty(true)
    setSavedAt(null)
  }
  const updateRate = (key: keyof Agency['rates'], value: number) => {
    setForm((prev) => ({ ...prev, rates: { ...prev.rates, [key]: value } }))
    setDirty(true)
    setSavedAt(null)
  }
  const updateContact = (key: keyof Agency['contactInfo'], value: string) => {
    setForm((prev) => ({ ...prev, contactInfo: { ...prev.contactInfo, [key]: value } }))
    setDirty(true)
    setSavedAt(null)
  }
  const updateDay = (index: number, patch: Partial<DayHours>) => {
    setForm((prev) => {
      const hours = [...(prev.businessHoursByDay ?? defaultHours())]
      hours[index] = { ...hours[index], ...patch }
      return { ...prev, businessHoursByDay: hours }
    })
    setDirty(true)
    setSavedAt(null)
  }

  const save = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setWarning(null)

    if (!form.displayName.trim()) return setError('Display name is required.')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.contactInfo.email))
      return setError('Enter a valid contact email address.')
    if (!form.contactInfo.phone.trim()) return setError('A contact phone number is required.')

    // Rate validation — block negatives.
    const rates = form.rates
    if (Object.values(rates).some((r) => r < 0 || Number.isNaN(r)))
      return setError('Rates cannot be negative.')

    // Business hours — close must be after open unless the day is marked closed.
    const badDay = (form.businessHoursByDay ?? []).find((d) => !d.closed && d.close <= d.open)
    if (badDay) return setError(`${badDay.day}: closing time must be after opening time.`)

    // Non-blocking upper-bound warning.
    if (Object.values(rates).some((r) => r > RATE_UPPER_BOUND))
      setWarning(`One or more rates exceed $${RATE_UPPER_BOUND}/hr — please double-check before saving.`)

    // Determine which top-level fields changed (names only, never values → no PHI in audit).
    const changed = (Object.keys(form) as (keyof Agency)[]).filter(
      (k) => JSON.stringify(form[k]) !== JSON.stringify(initialRef.current[k]),
    )

    setSavedAt(new Date().toISOString())
    setDirty(false)
    initialRef.current = form
    logAudit({
      actor: viewer,
      action: 'profile_updated',
      objectType: 'Agency',
      objectId: form.id,
      phiFlag: false,
      surface: 'provider',
      metadata: { fields: changed.map(String) },
    })
  }

  return (
    <form onSubmit={save} className="space-y-6">
      {/* Branding */}
      <FAHCCard title="Agency branding" subtitle="Your logo and photos appear to families in matches">
        <div className="space-y-6">
          <FAHCProviderLogoUploader viewer={viewer} agencyId={form.id} />
          <FAHCUploadCard viewer={viewer} agencyId={form.id} title="Agency photos & evidence" />
        </div>
      </FAHCCard>

      {/* Basic details */}
      <FAHCCard title="Basic details">
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label="Display name" value={form.displayName} onChange={(v) => update('displayName', v)} required />
          <TextField label="Legal name" value={form.legalName} onChange={(v) => update('legalName', v)} />
          <TextField
            label="Contact email"
            type="email"
            value={form.contactInfo.email}
            onChange={(v) => updateContact('email', v)}
            required
          />
          <TextField
            label="Contact phone"
            value={form.contactInfo.phone}
            onChange={(v) => updateContact('phone', v)}
            required
          />
          <TextField
            label="Address"
            value={form.contactInfo.address}
            onChange={(v) => updateContact('address', v)}
            className="sm:col-span-2"
          />
          <TextField label="Availability summary" value={form.availability} onChange={(v) => update('availability', v)} />
        </div>
      </FAHCCard>

      {/* Business hours */}
      <FAHCCard title="Business hours" subtitle="Set open/close times per day">
        <div className="space-y-2">
          {(form.businessHoursByDay ?? []).map((d, i) => (
            <div
              key={d.day}
              className="grid grid-cols-2 items-center gap-3 rounded-xl border border-brand-lightGray/70 px-3 py-2 sm:grid-cols-[8rem_1fr_1fr_auto]"
            >
              <span className="text-sm font-medium text-brand-charcoal">{d.day}</span>
              <label className="flex items-center gap-2 text-xs text-brand-charcoal/60">
                <span className="sr-only sm:not-sr-only">Open</span>
                <input
                  type="time"
                  value={d.open}
                  disabled={d.closed}
                  onChange={(e) => updateDay(i, { open: e.target.value })}
                  className="fahc-input py-1.5 text-sm"
                  aria-label={`${d.day} open time`}
                />
              </label>
              <label className="flex items-center gap-2 text-xs text-brand-charcoal/60">
                <span className="sr-only sm:not-sr-only">Close</span>
                <input
                  type="time"
                  value={d.close}
                  disabled={d.closed}
                  onChange={(e) => updateDay(i, { close: e.target.value })}
                  className="fahc-input py-1.5 text-sm"
                  aria-label={`${d.day} close time`}
                />
              </label>
              <label className="flex items-center justify-end gap-2 text-sm text-brand-charcoal">
                <input
                  type="checkbox"
                  checked={d.closed}
                  onChange={(e) => updateDay(i, { closed: e.target.checked })}
                  className="rounded border-brand-softBlue text-brand-primary focus:ring-brand-primary"
                />
                Closed
              </label>
            </div>
          ))}
        </div>
      </FAHCCard>

      {/* Services & coverage */}
      <FAHCCard title="Services & coverage">
        <div className="space-y-5">
          <TagField
            label="Service offerings"
            values={form.serviceOfferings}
            onChange={(v) => update('serviceOfferings', v)}
            suggestions={SERVICE_SUGGESTIONS}
          />
          <div className="grid gap-5 sm:grid-cols-2">
            <TagField
              label="Service areas (ZIP)"
              values={form.serviceAreas}
              onChange={(v) => update('serviceAreas', v)}
              placeholder="Add ZIP code"
            />
            <TagField
              label="Languages spoken"
              values={form.languages}
              onChange={(v) => update('languages', v)}
              suggestions={LANGUAGE_SUGGESTIONS}
            />
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <TagField
              label="Caregiver certifications"
              values={form.certificationLevels}
              onChange={(v) => update('certificationLevels', v)}
              suggestions={CERT_SUGGESTIONS}
            />
            <div>
              <label className="fahc-label">Caregiver screening status</label>
              <select
                value={form.caregiverScreeningStatus}
                onChange={(e) => update('caregiverScreeningStatus', e.target.value)}
                className="fahc-input"
                aria-label="Caregiver screening status"
              >
                {SCREENING_OPTIONS.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </FAHCCard>

      {/* Rates & payment */}
      <FAHCCard title="Rates & payment" subtitle="Granular rate configuration">
        <div className="grid gap-4 sm:grid-cols-4">
          <RateField label="Hourly" value={form.rates.hourly} onChange={(v) => updateRate('hourly', v)} />
          <RateField label="On-call" value={form.rates.onCall} onChange={(v) => updateRate('onCall', v)} />
          <RateField label="Overnight" value={form.rates.overnight} onChange={(v) => updateRate('overnight', v)} />
          <RateField label="Weekend" value={form.rates.weekend} onChange={(v) => updateRate('weekend', v)} />
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Toggle
            label="Live-in care offered"
            checked={form.liveInCareOffered}
            onChange={(v) => update('liveInCareOffered', v)}
          />
          <Toggle
            label="Deposit required"
            checked={form.depositRequired}
            onChange={(v) => update('depositRequired', v)}
          />
        </div>
        <div className="mt-5">
          <TagField
            label="Accepted payment methods"
            values={form.paymentMethods}
            onChange={(v) => update('paymentMethods', v)}
            suggestions={PAYMENT_SUGGESTIONS}
            presetOnly
            hint="Choose from approved payment methods (structured — no free text)."
          />
        </div>
      </FAHCCard>

      {/* Operational details */}
      <FAHCCard title="Operational details" subtitle="Non-PHI operational information only">
        <div className="space-y-4">
          <div className="flex items-start gap-2 rounded-xl border border-brand-darkGold/30 bg-brand-softGold/40 px-3 py-2 text-sm text-brand-darkGold">
            <IconShield className="mt-0.5 h-4 w-4 shrink-0" />
            <span className="text-brand-charcoal">
              Describe your agency&rsquo;s operations only. Never include client names, contact
              details, or any PHI here.
            </span>
          </div>
          <TextAreaField
            label="Intake process summary"
            value={form.intakeProcess ?? ''}
            onChange={(v) => update('intakeProcess', v)}
            placeholder="How a new client gets started with your agency…"
          />
          <TextAreaField
            label="Capacity notes"
            value={form.capacityNotes ?? ''}
            onChange={(v) => update('capacityNotes', v)}
            placeholder="Current availability / caseload capacity…"
          />
          <TextAreaField
            label="Public operational summary"
            value={form.operationalDetails ?? ''}
            onChange={(v) => update('operationalDetails', v)}
            placeholder="Any additional operational details families should know…"
          />
        </div>
      </FAHCCard>

      {/* Description */}
      <FAHCCard title="Profile description">
        <textarea
          value={form.profileDescription}
          onChange={(e) => update('profileDescription', e.target.value)}
          rows={4}
          className="fahc-input"
          placeholder="Tell families about your agency, your caregivers, and what sets you apart…"
        />
      </FAHCCard>

      {/* Footer actions */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm">
          {error && <p className="text-rose-600">{error}</p>}
          {warning && !error && <p className="text-brand-darkGold">{warning}</p>}
          {savedAt && !error && (
            <p className="flex items-center gap-1.5 text-emerald-600">
              <IconCheckCircle className="h-4 w-4" /> Profile saved and logged to the audit trail.
            </p>
          )}
          {!savedAt && !error && !warning && (
            <p className="text-brand-charcoal/60">
              {dirty ? 'You have unsaved changes.' : 'Review your details, then save or verify no changes.'}
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {!dirty && <FAHCConfirmNoChangesButton viewer={viewer} objectId={form.id} />}
          <button type="submit" className="fahc-btn-primary" disabled={!dirty}>
            Save changes
          </button>
        </div>
      </div>
    </form>
  )
}

// ---- Small field helpers --------------------------------------------------

function TextField({
  label,
  value,
  onChange,
  type = 'text',
  required,
  className,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  type?: string
  required?: boolean
  className?: string
}) {
  return (
    <div className={className}>
      <label className="fahc-label">
        {label} {required && <span className="text-rose-500">*</span>}
      </label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} className="fahc-input" />
    </div>
  )
}

function TextAreaField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  return (
    <div>
      <label className="fahc-label">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={2}
        placeholder={placeholder}
        className="fahc-input"
      />
    </div>
  )
}

function RateField({
  label,
  value,
  onChange,
}: {
  label: string
  value: number
  onChange: (v: number) => void
}) {
  return (
    <div>
      <label className="fahc-label">{label} ($/hr)</label>
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-brand-charcoal/50">
          $
        </span>
        <input
          type="number"
          min={0}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="fahc-input pl-7"
        />
      </div>
    </div>
  )
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex items-center justify-between rounded-xl border border-brand-lightGray px-4 py-3 text-sm font-medium text-brand-charcoal hover:border-brand-softBlue"
    >
      {label}
      <span
        className={cn(
          'relative h-6 w-11 rounded-full transition-colors',
          checked ? 'bg-brand-primary' : 'bg-brand-lightGray',
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform',
            checked ? 'translate-x-5' : 'translate-x-0.5',
          )}
        />
      </span>
    </button>
  )
}
