'use client'

import { useAuth } from '@/lib/auth'
import { IconClock } from '@/components/ui/icons'

/** Calm pre-logout warning shown shortly before the inactivity timeout fires. */
export function SessionTimeoutWarning() {
  const { sessionWarning, extendSession, logout } = useAuth()
  if (!sessionWarning) return null

  return (
    <div className="fixed inset-x-0 bottom-4 z-50 flex justify-center px-4" role="alertdialog" aria-live="polite">
      <div className="flex w-full max-w-md items-start gap-3 rounded-2xl border border-brand-softBlue bg-white p-4 shadow-card">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-paleBlue text-brand-primary">
          <IconClock className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-brand-charcoal">Still there?</p>
          <p className="mt-0.5 text-sm text-brand-charcoal/70">
            For your security, you&rsquo;ll be signed out soon due to inactivity.
          </p>
          <div className="mt-3 flex gap-2">
            <button type="button" onClick={extendSession} className="fahc-btn-primary py-2 text-xs">
              Stay signed in
            </button>
            <button
              type="button"
              onClick={() => logout('manual')}
              className="fahc-btn-ghost py-2 text-xs"
            >
              Sign out now
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
