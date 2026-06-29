'use client'

import { useCallback, useEffect, useState } from 'react'
import type { AuditEvent, ProviderUser } from '@/lib/types'
import {
  AUDIT_EVENT,
  getAuditEvents,
  getAuditEventsForObject,
  sanitizeMetadata,
} from '@/lib/audit'
import { PhiBadge } from '@/components/ui/PhiBadge'
import {
  IconEye,
  IconShield,
  IconCheck,
  IconRevenue,
  IconReferrals,
  IconProfile,
  IconUpload,
  IconLock,
} from '@/components/ui/icons'
import { cn, formatDateTime } from '@/lib/utils'

export const AUDIT_ACTION_LABELS: Record<string, string> = {
  referral_viewed: 'Viewed referral detail',
  phi_unmasked: 'Unmasked protected health information',
  referral_outcome_updated: 'Updated referral outcome',
  revenue_autosaved: 'Auto-saved revenue entry',
  revenue_submitted: 'Submitted monthly revenue',
  verified_with_no_changes: 'Verified profile — no changes',
  profile_updated: 'Updated agency profile',
  logo_uploaded: 'Uploaded agency logo',
  document_uploaded: 'Uploaded document',
  login: 'Signed in',
  logout: 'Signed out',
  session_timeout: 'Session timed out (inactivity)',
  mfa_toggled: 'Changed MFA setting',
  role_switched: 'Switched demo role',
  admin_surface_accessed: 'Accessed admin console',
  admin_access_denied: 'Admin access denied (non-internal role)',
  admin_locked_referral_override: 'Admin override on locked referral',
  autopay_revenue_recorded: 'Recorded Autopay revenue (mock — no charge)',
  chat_attachment_added: 'Added chat attachment',
  support_case_created: 'Created support case',
  support_case_resolved: 'Resolved support case',
  admin_support_viewed: 'Viewed support case (admin)',
  agency_activation_changed: 'Changed agency activation status',
}

export function auditLabel(action: string): string {
  return AUDIT_ACTION_LABELS[action] ?? action.replace(/_/g, ' ')
}

function actionIcon(action: string) {
  switch (action) {
    case 'phi_unmasked':
      return <IconEye className="h-4 w-4" />
    case 'referral_viewed':
      return <IconReferrals className="h-4 w-4" />
    case 'referral_outcome_updated':
      return <IconCheck className="h-4 w-4" />
    case 'revenue_autosaved':
    case 'revenue_submitted':
      return <IconRevenue className="h-4 w-4" />
    case 'verified_with_no_changes':
    case 'profile_updated':
      return <IconProfile className="h-4 w-4" />
    case 'logo_uploaded':
    case 'document_uploaded':
      return <IconUpload className="h-4 w-4" />
    default:
      return <IconShield className="h-4 w-4" />
  }
}

interface FAHCAuditTimelineProps {
  viewer: ProviderUser
  objectType?: string
  objectId?: string
  /** Pre-supplied events (e.g. admin global view); skips live subscription. */
  events?: AuditEvent[]
  limit?: number
  emptyHint?: string
}

export function FAHCAuditTimeline({
  viewer,
  objectType,
  objectId,
  events: providedEvents,
  limit,
  emptyHint = 'No audit activity recorded yet.',
}: FAHCAuditTimelineProps) {
  const [events, setEvents] = useState<AuditEvent[]>(providedEvents ?? [])

  const refresh = useCallback(() => {
    if (providedEvents) return
    const next =
      objectType && objectId
        ? getAuditEventsForObject(viewer, objectType, objectId)
        : getAuditEvents(viewer)
    setEvents(limit ? next.slice(0, limit) : next)
  }, [providedEvents, objectType, objectId, viewer, limit])

  useEffect(() => {
    refresh()
    if (providedEvents) return
    const handler = () => refresh()
    window.addEventListener(AUDIT_EVENT, handler)
    return () => window.removeEventListener(AUDIT_EVENT, handler)
  }, [refresh, providedEvents])

  const shown = limit && providedEvents ? events.slice(0, limit) : events

  if (shown.length === 0) {
    return <p className="text-sm text-brand-charcoal/60">{emptyHint}</p>
  }

  return (
    <ol className="relative space-y-4 before:absolute before:left-[15px] before:top-2 before:h-[calc(100%-1rem)] before:w-px before:bg-brand-lightGray">
      {shown.map((e) => (
        <li key={e.id} className="relative flex gap-3">
          <span
            className={cn(
              'z-10 grid h-8 w-8 shrink-0 place-items-center rounded-full ring-4 ring-white',
              e.phiFlag ? 'bg-brand-softGold text-brand-darkGold' : 'bg-brand-paleBlue text-brand-primary',
            )}
          >
            {actionIcon(e.action)}
          </span>
          <div className="min-w-0 flex-1 pb-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-semibold text-brand-charcoal">{auditLabel(e.action)}</p>
              {e.phiFlag && <PhiBadge />}
            </div>
            <p className="text-xs text-brand-charcoal/60">
              {e.actorRole} · {e.objectType} {e.objectId} · {formatDateTime(e.timestamp)}
            </p>
            {(() => {
              // Defence in depth: only ever render sanitized (non-PHI) metadata.
              const safe = sanitizeMetadata(e.metadata)
              if (!safe) return null
              return (
                <p className="mt-0.5 text-xs text-brand-charcoal/50">
                  {Object.entries(safe)
                    .map(([k, v]) => `${k}: ${String(v)}`)
                    .join(' · ')}
                </p>
              )
            })()}
            {e.ip && (
              <p className="mt-0.5 flex items-center gap-1 text-[11px] text-brand-charcoal/40">
                <IconLock className="h-3 w-3" /> {e.ip}
              </p>
            )}
          </div>
        </li>
      ))}
    </ol>
  )
}
