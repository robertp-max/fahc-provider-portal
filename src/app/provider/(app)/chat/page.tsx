'use client'

import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth'
import { getSupportThreads } from '@/lib/api'
import { createCase, getCasesForThread, CASE_EVENT } from '@/lib/cases'
import { logAudit } from '@/lib/audit'
import type { SupportCase } from '@/lib/types'
import { FAHCChatThread } from '@/components/chat/FAHCChatThread'
import { FAHCStatusBadge } from '@/components/ui/FAHCStatusBadge'
import { IconPlus, IconCheckCircle } from '@/components/ui/icons'
import { cn, relativeTime } from '@/lib/utils'

export default function ChatPage() {
  const { currentUser } = useAuth()
  const threads = currentUser ? getSupportThreads(currentUser) : []
  const [activeId, setActiveId] = useState(threads[0]?.id ?? '')
  const [cases, setCases] = useState<SupportCase[]>([])

  const active = threads.find((t) => t.id === activeId) ?? threads[0]

  const refreshCases = useCallback(() => {
    if (!currentUser || !active) return setCases([])
    setCases(getCasesForThread(currentUser, active.id))
  }, [currentUser, active])

  useEffect(() => {
    refreshCases()
    const handler = () => refreshCases()
    window.addEventListener(CASE_EVENT, handler)
    return () => window.removeEventListener(CASE_EVENT, handler)
  }, [refreshCases])

  if (!currentUser) return null

  const openCase = cases.find((c) => c.status !== 'Resolved')

  const handleCreateCase = () => {
    if (!active || openCase) return
    const created = createCase({
      agencyId: currentUser.agencyId,
      threadId: active.id,
      subject: active.subject,
      category: active.category,
      createdBy: currentUser.name,
    })
    logAudit({
      actor: currentUser,
      action: 'support_case_created',
      objectType: 'SupportCase',
      objectId: created.id,
      phiFlag: false,
      surface: 'provider',
      metadata: { category: active.category, threadId: active.id },
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-2xl font-semibold text-brand-primary">Support Chat</h2>
        <p className="mt-1 text-sm text-brand-charcoal/70">
          Message the FindAHomeCare support team about referrals, billing, or your profile.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Thread list */}
        <div className="fahc-surface overflow-hidden lg:col-span-1">
          <div className="border-b border-brand-lightGray/70 px-4 py-3">
            <h3 className="font-heading text-sm font-semibold text-brand-primary">Conversations</h3>
          </div>
          <ul className="divide-y divide-brand-lightGray/70">
            {threads.map((t) => (
              <li key={t.id}>
                <button
                  type="button"
                  onClick={() => setActiveId(t.id)}
                  className={cn(
                    'flex w-full flex-col gap-1 px-4 py-3 text-left transition-colors hover:bg-brand-paleBlue/50',
                    active?.id === t.id && 'bg-brand-paleBlue/70',
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-semibold text-brand-charcoal">{t.subject}</span>
                    <FAHCStatusBadge status={t.status} dot={false} />
                  </div>
                  <span className="truncate text-xs text-brand-charcoal/55">
                    {t.category} · updated {relativeTime(t.updatedAt)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Active thread */}
        <div className="space-y-3 lg:col-span-2">
          {active && (
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-brand-lightGray/70 bg-white px-4 py-2.5">
              {openCase ? (
                <span className="inline-flex items-center gap-1.5 text-sm text-brand-charcoal/70">
                  <IconCheckCircle className="h-4 w-4 text-emerald-600" />
                  Support case <span className="font-semibold">{openCase.id}</span>
                  <FAHCStatusBadge status={openCase.status} dot={false} />
                </span>
              ) : cases.length > 0 ? (
                <span className="text-sm text-brand-charcoal/60">
                  Previous case resolved — you can open a new one if needed.
                </span>
              ) : (
                <span className="text-sm text-brand-charcoal/60">
                  Need formal tracking? Create a support case from this thread.
                </span>
              )}
              <button
                type="button"
                onClick={handleCreateCase}
                disabled={!!openCase}
                className="fahc-btn-ghost border border-brand-softBlue py-2 text-xs"
              >
                <IconPlus className="h-4 w-4" /> Create support case
              </button>
            </div>
          )}

          <div className="fahc-surface overflow-hidden">
            {active ? (
              <FAHCChatThread thread={active} viewer={currentUser} />
            ) : (
              <p className="p-6 text-sm text-brand-charcoal/60">No conversations yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
