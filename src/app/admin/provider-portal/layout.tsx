'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { FAHCShell } from '@/components/layout/FAHCShell'
import { ADMIN_NAV } from '@/components/layout/navConfig'
import { Logo } from '@/components/ui/Logo'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { currentUser, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !currentUser) router.replace('/provider/login')
  }, [loading, currentUser, router])

  if (loading || !currentUser) {
    return (
      <div className="grid min-h-screen place-items-center bg-brand-paleBlue">
        <Logo className="h-9 animate-pulse" />
      </div>
    )
  }

  return (
    <FAHCShell items={ADMIN_NAV} context="Admin Console" variant="admin">
      {children}
    </FAHCShell>
  )
}
