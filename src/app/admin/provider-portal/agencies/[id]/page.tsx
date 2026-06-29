'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { getAllAgencies } from '@/lib/api'
import { logAudit } from '@/lib/audit'
import type { AgencyActivationStatus, AgencyAgreements } from '@/lib/types'
import { FAHCCard } from '@/components/ui/FAHCCard'
import { FAHCStatusBadge } from '@/components/ui/FAHCStatusBadge'
import { FAHCEmptyState } from '@/components/ui/FAHCEmptyState'
import { AdminScopeNote } from '@/components/admin/AdminScopeNote'
import { ProgressBar } from '@/components/charts/Charts'
import { IconBuilding, IconChevronRight, IconCheckCircle, IconShield } from '@/components/ui/icons'
import { formatDate } from '@/lib/utils'

const ACTIVATION_OPTIONS: AgencyActivationStatus[] = [
  'Subscribed / Unverified',
  'Pending Activation',
  'Active',
  'Suspended / Deactivated',
]

const AGREEMENT_LABELS: { key: keyof AgencyAgreements; label: string }[] = [
  { key: 'businessLicense', label: 'Business license' },
  { key: 'referralAgreement', label: 'Referral Agreement' },
  { key: 'baa', label: 'Business Associate Agreement (BAA)' },
]

export default function AdminAgencyDetailPage() {
  const params = useParams<{ id: string }>()
  const { currentUser } = useAuth()
  const agency = currentUser ? getAllAgencies(currentUser).find((a) => a.id === params.id) : undefined

  const [status, setStatus] = useState<AgencyActivationStatus>(
    agency?.activationStatus ?? 'Subscribed / Unverified',
  )
  const [agreements, setAgreements] = useState<AgencyAgreements>(
    agency?.agreements ?? { businessLicense: false, referralAgreement: false, baa: false },
  )
  const [savedAt, setSavedAt] = useState<string | null>(null)

  if (!currentUser) return null
  const readOnly = currentUser.role === 'Read-only Auditor'

  if (!agency) {
    return (
      <FAHCEmptyState
        icon={<IconBuilding className="h-6 w-6" />}
        title="Agency not found"
        action={
          <Link href="/admin/provider-portal/agencies" className="fahc-btn-primary">
            Back to agencies
          </Link>
        }
      />
    )
  }

  const allSigned = Object.values(agreements).every(Boolean)

  const save = () => {
    if (readOnly) return
    setSavedAt(new Date().toISOString())
    logAudit({
      actor: currentUser,
      action: 'agency_activation_changed',
      objectType: 'Agency',
      objectId: agency.id,
      phiFlag: false,
      surface: 'admin',
      metadata: {
        status,
        businessLicense: agreements.businessLicense,
        referralAgreement: agreements.referralAgreement,
        baa: agreements.baa,
      },
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/provider-portal/agencies" className="inline-flex items-center gap-1 text-sm fahc-link">
          <IconChevronRight className="h-4 w-4 rotate-180" /> Back to agencies
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h2 className="font-heading text-2xl font-semibold text-brand-primary">{agency.displayName}</h2>
          <FAHCStatusBadge status={status} />
        </div>
        <p className="mt-1 text-sm text-brand-charcoal/60">
          {agency.legalName} · {agency.id}
        </p>
      </div>

      <AdminScopeNote viewer={currentUser} />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Overview */}
        <FAHCCard title="Overview" className="lg:col-span-1">
          <dl className="space-y-2 text-sm">
            <Row label="Account status">{agency.status}</Row>
            <Row label="Service areas">{agency.serviceAreas.join(', ')}</Row>
            <Row label="Last verified">{formatDate(agency.lastVerifiedAt)}</Row>
          </dl>
          <div className="mt-4">
            <div className="mb-1 flex items-center justify-between text-xs text-brand-charcoal/60">
              <span>Profile completeness</span>
              <span className="font-semibold text-brand-primary">{agency.profileCompleteness}%</span>
            </div>
            <ProgressBar value={agency.profileCompleteness} />
          </div>
        </FAHCCard>

        {/* Activation gate */}
        <FAHCCard title="Activation" subtitle="Internal-only mock gate" className="lg:col-span-2">
          {readOnly && (
            <div className="mb-4 flex items-start gap-2 rounded-xl border border-brand-softBlue bg-brand-paleBlue/50 px-3 py-2.5 text-sm text-brand-primary">
              <IconShield className="mt-0.5 h-4 w-4 shrink-0" />
              Read-only role — activation controls are disabled.
            </div>
          )}

          <label htmlFor="activation" className="fahc-label">
            Activation status
          </label>
          <select
            id="activation"
            value={status}
            onChange={(e) => setStatus(e.target.value as AgencyActivationStatus)}
            disabled={readOnly}
            className="fahc-input"
          >
            {ACTIVATION_OPTIONS.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>

          <fieldset className="mt-5">
            <legend className="fahc-label">Required agreements</legend>
            <div className="space-y-2">
              {AGREEMENT_LABELS.map(({ key, label }) => (
                <label
                  key={key}
                  className="flex items-center gap-2 rounded-xl border border-brand-lightGray/70 px-3 py-2 text-sm text-brand-charcoal"
                >
                  <input
                    type="checkbox"
                    checked={agreements[key]}
                    disabled={readOnly}
                    onChange={(e) => setAgreements((prev) => ({ ...prev, [key]: e.target.checked }))}
                    className="rounded border-brand-softBlue text-brand-primary focus:ring-brand-primary"
                  />
                  {label}
                </label>
              ))}
            </div>
            {!allSigned && status === 'Active' && (
              <p className="mt-2 text-xs text-brand-darkGold">
                Note: agency is marked Active but not all agreements are on file.
              </p>
            )}
          </fieldset>

          <p className="mt-4 text-xs text-brand-charcoal/50">
            Prototype only — no documents are stored and no external system is updated.
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button type="button" onClick={save} disabled={readOnly} className="fahc-btn-primary">
              Save activation
            </button>
            {savedAt && (
              <span className="inline-flex items-center gap-1.5 text-sm text-emerald-600">
                <IconCheckCircle className="h-4 w-4" /> Saved and audited.
              </span>
            )}
          </div>
        </FAHCCard>
      </div>
    </div>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-brand-charcoal/55">{label}</dt>
      <dd className="font-medium text-brand-charcoal">{children}</dd>
    </div>
  )
}
