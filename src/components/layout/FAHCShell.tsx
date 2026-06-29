'use client'

import { useState } from 'react'
import { FAHCSideNav } from './FAHCSideNav'
import { FAHCTopNav } from './FAHCTopNav'
import { SessionTimeoutWarning } from './SessionTimeoutWarning'
import type { NavItem } from './navConfig'

interface FAHCShellProps {
  children: React.ReactNode
  items: NavItem[]
  context: string
  variant?: 'provider' | 'admin'
}

/** Authenticated application chrome: responsive sidebar + top bar + content. */
export function FAHCShell({ children, items, context, variant = 'provider' }: FAHCShellProps) {
  const [navOpen, setNavOpen] = useState(false)

  return (
    <div className="min-h-screen lg:pl-64">
      <FAHCSideNav
        items={items}
        open={navOpen}
        onClose={() => setNavOpen(false)}
        context={context}
        variant={variant}
      />
      <div className="flex min-h-screen flex-col">
        <FAHCTopNav onMenuClick={() => setNavOpen(true)} />
        <main className="flex-1 px-4 py-6 lg:px-8 lg:py-8">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </main>
      </div>
      <SessionTimeoutWarning />
    </div>
  )
}
