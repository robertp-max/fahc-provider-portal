'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/auth'
import { getSupportThreads } from '@/lib/api'
import { FAHCChatThread } from '@/components/chat/FAHCChatThread'
import { FAHCStatusBadge } from '@/components/ui/FAHCStatusBadge'
import { cn, relativeTime } from '@/lib/utils'

export default function ChatPage() {
  const { currentUser } = useAuth()
  const threads = currentUser ? getSupportThreads(currentUser) : []
  const [activeId, setActiveId] = useState(threads[0]?.id ?? '')

  if (!currentUser) return null
  const active = threads.find((t) => t.id === activeId) ?? threads[0]

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
                    <span className="truncate text-sm font-semibold text-brand-charcoal">
                      {t.subject}
                    </span>
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
        <div className="fahc-surface overflow-hidden lg:col-span-2">
          {active ? (
            <FAHCChatThread thread={active} viewerName={currentUser.name} />
          ) : (
            <p className="p-6 text-sm text-brand-charcoal/60">No conversations yet.</p>
          )}
        </div>
      </div>
    </div>
  )
}
