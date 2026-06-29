'use client'

import { useState } from 'react'
import type { Agency, ProviderUser } from '@/lib/types'
import { logAudit } from '@/lib/audit'
import { FAHCCard } from '@/components/ui/FAHCCard'
import { TagField } from '@/components/forms/TagField'
import { FAHCConfirmNoChangesButton } from '@/components/forms/FAHCConfirmNoChangesButton'
import { FAHCProviderLogoUploader } from '@/components/uploads/FAHCProviderLogoUploader'
import { FAHCUploadCard } from '@/components/uploads/FAHCUploadCard'
import { IconCheckCircle } from '@/components/ui/icons'
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

interface Props {
  agency: Agency
  viewer: ProviderUser
}

export function FAHCProfileForm({ agency, viewer }: Props) {
  const [form, setForm] = useState<Agency>(agency)
  const [dirty, setDirty] = useState(false)
  const [savedAt, setSavedAt] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

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

  const save = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!form.displayName.trim()) return setError('Display name is required.')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.contactInfo.email))
      return setError('Enter a valid contact email address.')
    if (!form.contactInfo.phone.trim()) return setError('A contact phone number is required.')

    setSavedAt(new Date().toISOString())
    setDirty(false)
    logAudit({
      actor: viewer,
      action: 'profile_updated',
      objectType: 'Agency',
      objectId: form.id,
      phiFlag: false,
      metadata: { displayName: form.displayName },
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
          <TextField
            label="Business hours"
            value={form.contactInfo.businessHours}
            onChange={(v) => updateContact('businessHours', v)}
          />
          <TextField label="Availability" value={form.availability} onChange={(v) => update('availability', v)} />
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
          {savedAt && !error && (
            <p className="flex items-center gap-1.5 text-emerald-600">
              <IconCheckCircle className="h-4 w-4" /> Profile saved and logged to the audit trail.
            </p>
          )}
          {!savedAt && !error && (
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
