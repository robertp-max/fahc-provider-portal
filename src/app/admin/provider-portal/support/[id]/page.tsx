'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { getSupportThreads } from '@/lib/api'
import { getCasesForThread, resolveCase, CASE_EVENT } from '@/lib/cases'
import { logAudit } from '@/lib/audit'
import type { SupportCase } from '@/lib/types'
import { FAHCCard } from '@/components/ui/FAHCCard'
import { FAHCStatusBadge } from '@/components/ui/FAHCStatusBadge'
import { FAHCEmptyState } from '@/components/ui/FAHCEmptyState'
import { AdminScopeNote } from '@/components/admin/AdminScopeNote'
import { IconChat, IconChevronRight, IconBuilding, IconCheckCircle } from '@/components/ui/icons'
import { cn, formatDateTime } from '@/lib/utils'

export default function AdminSupportDetailPage() {
  const params = useParams<{ id: string }>()
  const { currentUser } = useAuth()
  const [cases, setCases] = useState<SupportCase[]>([])
  const viewed = useRef(false)

  const thread = currentUser
    ? getSupportThreads(currentUser).find((t) => t.id === params.id)
    : undefined

  const refresh = useCallback(() => {
    if (!currentUser || !thread) return
    setCases(getCasesForThread(currentUser, thread.id))
  }, [currentUser, thread])

  useEffect(() => {
    refresh()
    const handler = () => refresh()
    window.addEventListener(CASE_EVENT, handler)
    return () => window.removeEventListener(CASE_EVENT, handler)
  }, [refresh])

  useEffect(() => {
    if (!currentUser || !thread || viewed.current) return
    viewed.current = true
    logAudit({
      actor: currentUser,
      action: 'admin_support_viewed',
      objectType: 'SupportThread',
      objectId: thread.id,
      phiFlag: false,
      surface: 'admin',
      metadata: { category: thread.category },
    })
  }, [currentUser, thread])

  if (!currentUser) return null
  const readOnly = currentUser.role === 'Read-only Auditor'

  if (!thread) {
    return (
      <FAHCEmptyState
        icon={<IconChat className="h-6 w-6" />}
        title="Conversation not found"
        action={
          <Link href="/admin/provider-portal/support" className="fahc-btn-primary">
            Back to support
          </Link>
        }
      />
    )
  }

  const relatedCase = cases[0]

  const handleResolve = () => {
    if (!relatedCase || readOnly) return
    resolveCase(relatedCase.id, currentUser.name)
    logAudit({
      actor: currentUser,
      action: 'support_case_resolved',
      objectType: 'SupportCase',
      objectId: relatedCase.id,
      phiFlag: false,
      surface: 'admin',
      metadata: { threadId: thread.id },
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/provider-portal/support" className="inline-flex items-center gap-1 text-sm fahc-link">
          <IconChevronRight className="h-4 w-4 rotate-180" /> Back to support queue
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h2 className="font-heading text-2xl font-semibold text-brand-primary">{thread.subject}</h2>
          <FAHCStatusBadge status={thread.status} />
        </div>
        <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-brand-charcoal/60">
          <span>{thread.category}</span>
          <span className="inline-flex items-center gap-1 rounded bg-brand-paleBlue px-1.5 py-0.5 text-xs font-medium text-brand-primary">
            <IconBuilding className="h-3 w-3" /> {thread.agencyId}
          </span>
        </p>
      </div>

      <AdminScopeNote viewer={currentUser} />

      <div className="grid gap-6 lg:grid-cols-3">
        <FAHCCard title="Conversation" subtitle="Read-only transcript" className="lg:col-span-2" flush>
          <ul className="divide-y divide-brand-lightGray/70">
            {thread.messages.map((m) => (
              <li key={m.id} className="px-5 py-3">
                <p className="text-sm text-brand-charcoal">{m.body}</p>
                <p className="mt-0.5 text-xs text-brand-charcoal/50">
                  {m.author} · {formatDateTime(m.sentAt)}
                </p>
              </li>
            ))}
          </ul>
        </FAHCCard>

        <FAHCCard title="Linked support case">
          {relatedCase ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-brand-charcoal">{relatedCase.id}</span>
                <FAHCStatusBadge status={relatedCase.status} />
              </div>
              <dl className="space-y-1 text-sm text-brand-charcoal/70">
                <Row label="Category">{relatedCase.category}</Row>
                <Row label="Created by">{relatedCase.createdBy}</Row>
                <Row label="Created">{formatDateTime(relatedCase.createdAt)}</Row>
                {relatedCase.resolvedAt && (
                  <Row label="Resolved">{formatDateTime(relatedCase.resolvedAt)}</Row>
                )}
              </dl>
              {relatedCase.status !== 'Resolved' ? (
                <button
                  type="button"
                  onClick={handleResolve}
                  disabled={readOnly}
                  className={cn('fahc-btn-primary w-full', readOnly && 'opacity-50')}
                >
                  <IconCheckCircle className="h-4 w-4" /> Mark resolved
                </button>
              ) : (
                <p className="flex items-center gap-1.5 text-sm text-emerald-600">
                  <IconCheckCircle className="h-4 w-4" /> Resolved by {relatedCase.resolvedBy}
                </p>
              )}
              {readOnly && (
                <p className="text-xs text-brand-charcoal/50">
                  Read-only role — you can view but not resolve cases.
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-brand-charcoal/60">
              No support case linked to this thread yet. Providers can create one from chat.
            </p>
          )}
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
