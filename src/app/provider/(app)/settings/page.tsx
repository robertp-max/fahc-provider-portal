'use client'

import { useAuth } from '@/lib/auth'
import type { ProviderRole } from '@/lib/types'
import { FAHCCard } from '@/components/ui/FAHCCard'
import { FAHCStatusBadge } from '@/components/ui/FAHCStatusBadge'
import { IconShield, IconLock, IconCheckCircle } from '@/components/ui/icons'
import { cn, formatDateTime, initials } from '@/lib/utils'

const ROLES: ProviderRole[] = [
  'Provider Owner',
  'Provider Intake Coordinator',
  'Provider Billing',
  'Provider Clinical Admin',
  'Internal Admin',
  'Internal Referral Coordinator',
  'Internal Compliance/Audit',
  'Read-only Auditor',
]

export default function SettingsPage() {
  const { currentUser, toggleMfa, setActiveRole } = useAuth()
  if (!currentUser) return null

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-2xl font-semibold text-brand-primary">Settings</h2>
        <p className="mt-1 text-sm text-brand-charcoal/70">
          Manage your account security and preferences.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Profile card */}
        <FAHCCard title="Your account" className="lg:col-span-1">
          <div className="flex items-center gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-full bg-brand-primary text-base font-bold text-white">
              {initials(currentUser.name)}
            </span>
            <div className="min-w-0">
              <p className="truncate font-semibold text-brand-charcoal">{currentUser.name}</p>
              <p className="truncate text-sm text-brand-charcoal/60">{currentUser.email}</p>
            </div>
          </div>
          <dl className="mt-4 space-y-2 text-sm">
            <Row label="Role">{currentUser.role}</Row>
            <Row label="Status">
              <FAHCStatusBadge status={currentUser.status} />
            </Row>
            <Row label="Last login">{formatDateTime(currentUser.lastLoginAt)}</Row>
          </dl>
        </FAHCCard>

        {/* Security */}
        <FAHCCard title="Security" className="lg:col-span-2">
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-xl border border-brand-lightGray px-4 py-3">
              <div className="flex items-start gap-3">
                <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand-paleBlue text-brand-primary">
                  <IconShield className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-brand-charcoal">
                    Multi-factor authentication (MFA)
                  </p>
                  <p className="text-xs text-brand-charcoal/60">
                    {currentUser.mfaEnabled
                      ? 'Enabled — an extra verification step protects your account.'
                      : 'Disabled — enable MFA to better protect PHI access.'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={currentUser.mfaEnabled}
                onClick={toggleMfa}
                className={cn(
                  'relative h-6 w-11 shrink-0 rounded-full transition-colors',
                  currentUser.mfaEnabled ? 'bg-brand-primary' : 'bg-brand-lightGray',
                )}
              >
                <span
                  className={cn(
                    'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform',
                    currentUser.mfaEnabled ? 'translate-x-5' : 'translate-x-0.5',
                  )}
                />
              </button>
            </div>

            <div className="flex items-center gap-3 rounded-xl border border-brand-lightGray px-4 py-3 text-sm text-brand-charcoal/70">
              <IconLock className="h-5 w-5 shrink-0 text-brand-primary" />
              Sessions automatically time out after 30 minutes of inactivity. PHI access is always
              logged to the immutable audit trail.
            </div>

            {currentUser.mfaEnabled && (
              <p className="flex items-center gap-1.5 text-sm text-emerald-600">
                <IconCheckCircle className="h-4 w-4" /> Your account meets the recommended security
                baseline.
              </p>
            )}
          </div>
        </FAHCCard>

        {/* Demo role switcher */}
        <FAHCCard
          title="Demo controls"
          subtitle="Prototype only — switch role to exercise role-based behaviour"
          className="lg:col-span-3"
        >
          <div className="flex flex-wrap items-center gap-2">
            {ROLES.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setActiveRole(r)}
                className={cn(
                  'rounded-full px-3 py-1.5 text-xs font-semibold transition-colors',
                  currentUser.role === r
                    ? 'bg-brand-primary text-white'
                    : 'bg-white text-brand-charcoal/70 ring-1 ring-brand-lightGray hover:bg-brand-paleBlue',
                )}
              >
                {r}
              </button>
            ))}
          </div>
          <p className="mt-3 text-xs text-brand-charcoal/55">
            Tip: switch to an <span className="font-semibold">Internal Admin</span> role, then open a
            locked referral to see the override behaviour and cross-tenant access in the top bar.
          </p>
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
