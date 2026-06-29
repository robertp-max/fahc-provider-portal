'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { FAHCShell } from '@/components/layout/FAHCShell'
import { PROVIDER_NAV } from '@/components/layout/navConfig'
import { Logo } from '@/components/ui/Logo'

export default function ProviderAppLayout({ children }: { children: React.ReactNode }) {
  const { currentUser, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !currentUser) router.replace('/provider/login')
  }, [loading, currentUser, router])

  if (loading || !currentUser) {
    return (
      <div className="grid min-h-screen place-items-center bg-brand-paleBlue">
        <div className="flex flex-col items-center gap-3 text-brand-primary">
          <Logo className="h-9 animate-pulse" />
          <span className="text-sm text-brand-charcoal/70">Securing your session…</span>
        </div>
      </div>
    )
  }

  return (
    <FAHCShell items={PROVIDER_NAV} context="Provider Portal">
      {children}
    </FAHCShell>
  )
}
