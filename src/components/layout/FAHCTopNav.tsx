'use client'

import { useMemo, useState } from 'react'
import { usePathname } from 'next/navigation'
import { IconMenu, IconBell, IconSearch, IconShield } from '@/components/ui/icons'
import { useAuth } from '@/lib/auth'
import { getMyAgency, canAccessAllTenants } from '@/lib/api'
import { titleForPath } from './navConfig'

interface FAHCTopNavProps {
  onMenuClick: () => void
}

export function FAHCTopNav({ onMenuClick }: FAHCTopNavProps) {
  const pathname = usePathname()
  const { currentUser } = useAuth()
  const [query, setQuery] = useState('')

  const title = useMemo(() => titleForPath(pathname), [pathname])
  const agency = currentUser ? getMyAgency(currentUser) : undefined
  const internal = currentUser ? canAccessAllTenants(currentUser) : false

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-brand-lightGray/80 bg-white/90 px-4 backdrop-blur lg:px-6">
      <button
        type="button"
        onClick={onMenuClick}
        className="rounded-lg p-2 text-brand-charcoal hover:bg-brand-paleBlue lg:hidden"
        aria-label="Open navigation"
      >
        <IconMenu />
      </button>

      <div className="min-w-0">
        <h1 className="truncate font-heading text-lg font-semibold text-brand-primary">{title}</h1>
      </div>

      <div className="ml-auto flex items-center gap-2 sm:gap-3">
        {/* Tenant indicator — reinforces which agency's data is in view */}
        {agency && (
          <span
            className="hidden items-center gap-1.5 rounded-full bg-brand-paleBlue px-3 py-1.5 text-xs font-semibold text-brand-primary sm:inline-flex"
            title={internal ? 'Internal role — cross-tenant access' : 'Tenant-isolated to your agency'}
          >
            <IconShield className="h-3.5 w-3.5" />
            {internal ? 'All Agencies' : agency.displayName}
          </span>
        )}

        <label className="relative hidden md:block">
          <span className="sr-only">Search</span>
          <IconSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-charcoal/40" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search…"
            className="fahc-input w-48 rounded-full py-2 pl-9 pr-3 text-sm xl:w-64"
          />
        </label>

        <button
          type="button"
          className="relative rounded-full p-2 text-brand-charcoal hover:bg-brand-paleBlue"
          aria-label="Notifications"
        >
          <IconBell />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-brand-gold ring-2 ring-white" />
        </button>
      </div>
    </header>
  )
}
