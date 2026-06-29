'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { FAHCShell } from '@/components/layout/FAHCShell'
import { ADMIN_NAV } from '@/components/layout/navConfig'
import { Logo } from '@/components/ui/Logo'
import { canAccessAllTenants } from '@/lib/api'
import { logAudit } from '@/lib/audit'
import { IconShield, IconChevronRight } from '@/components/ui/icons'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { currentUser, loading } = useAuth()
  const router = useRouter()
  const audited = useRef(false)

  useEffect(() => {
    if (!loading && !currentUser) router.replace('/provider/login')
  }, [loading, currentUser, router])

  const isInternal = currentUser ? canAccessAllTenants(currentUser) : false

  // Audit access exactly once per mount (granted or denied).
  useEffect(() => {
    if (!currentUser || audited.current) return
    audited.current = true
    logAudit({
      actor: currentUser,
      action: isInternal ? 'admin_surface_accessed' : 'admin_access_denied',
      objectType: 'AdminSurface',
      objectId: 'provider-portal',
      phiFlag: false,
      surface: 'admin',
      metadata: { role: currentUser.role },
    })
  }, [currentUser, isInternal])

  if (loading || !currentUser) {
    return (
      <div className="grid min-h-screen place-items-center bg-brand-paleBlue">
        <Logo className="h-9 animate-pulse" />
      </div>
    )
  }

  // Provider roles are NOT shown admin data — calm blocked state instead.
  if (!isInternal) {
    return (
      <div className="grid min-h-screen place-items-center bg-brand-cream px-6 py-12">
        <div className="w-full max-w-md text-center">
          <Logo className="mx-auto h-10" />
          <div className="fahc-surface mt-8 p-8">
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-brand-paleBlue text-brand-primary">
              <IconShield className="h-7 w-7" />
            </span>
            <h1 className="mt-4 font-heading text-xl font-semibold text-brand-primary">
              Internal access only
            </h1>
            <p className="mt-2 text-sm text-brand-charcoal/70">
              The Admin Console is limited to Find A Home Care internal staff. Your current role
              (<span className="font-semibold">{currentUser.role}</span>) doesn&rsquo;t have access.
              This attempt has been recorded in the audit trail.
            </p>
            <div className="mt-6 flex flex-col gap-2">
              <Link href="/provider/dashboard" className="fahc-btn-primary">
                Back to your dashboard
              </Link>
              <Link
                href="/provider/settings"
                className="inline-flex items-center justify-center gap-1 text-sm fahc-link"
              >
                Switch to an internal role in Settings → Demo controls
                <IconChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <FAHCShell items={ADMIN_NAV} context="Admin Console" variant="admin">
      {children}
    </FAHCShell>
  )
}
