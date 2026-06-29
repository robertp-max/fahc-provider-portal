'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Logo } from '@/components/ui/Logo'
import { IconLogout, IconClose, IconShield } from '@/components/ui/icons'
import { useAuth } from '@/lib/auth'
import { cn, initials } from '@/lib/utils'
import type { NavItem } from './navConfig'

interface FAHCSideNavProps {
  items: NavItem[]
  open: boolean
  onClose: () => void
  /** Label shown under the logo (e.g. "Provider Portal" / "Admin Console"). */
  context: string
  variant?: 'provider' | 'admin'
}

export function FAHCSideNav({ items, open, onClose, context, variant = 'provider' }: FAHCSideNavProps) {
  const pathname = usePathname()
  const { currentUser, logout } = useAuth()

  const isActive = (href: string) =>
    pathname === href || (href !== '/admin/provider-portal' && pathname.startsWith(href + '/')) ||
    (href === '/admin/provider-portal' && pathname === href)

  return (
    <>
      {/* Mobile backdrop */}
      <div
        className={cn(
          'fixed inset-0 z-30 bg-brand-black/40 transition-opacity lg:hidden',
          open ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-brand-darkBlue text-white transition-transform lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
        aria-label="Primary navigation"
      >
        <div className="flex items-center justify-between px-5 py-5">
          <Link href={items[0]?.href ?? '/'} className="flex flex-col gap-1" onClick={onClose}>
            <Logo tone="white" />
            <span className="pl-1 text-[11px] font-medium uppercase tracking-wider text-brand-gold">
              {context}
            </span>
          </Link>
          <button
            type="button"
            className="rounded-lg p-1.5 text-white/70 hover:bg-white/10 lg:hidden"
            onClick={onClose}
            aria-label="Close navigation"
          >
            <IconClose />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
          {items.map(({ href, label, Icon }) => {
            const active = isActive(href)
            return (
              <Link
                key={href}
                href={href}
                onClick={onClose}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                  active
                    ? 'bg-white/10 text-white'
                    : 'text-white/70 hover:bg-white/5 hover:text-white',
                )}
              >
                <span
                  className={cn(
                    'flex h-6 w-1 -ml-3 rounded-full transition-colors',
                    active ? 'bg-brand-gold' : 'bg-transparent',
                  )}
                  aria-hidden="true"
                />
                <Icon className="h-5 w-5 shrink-0" />
                {label}
              </Link>
            )
          })}
        </nav>

        {variant === 'admin' && (
          <div className="mx-3 mb-2 flex items-center gap-2 rounded-xl bg-brand-gold/15 px-3 py-2 text-xs text-brand-gold">
            <IconShield className="h-4 w-4 shrink-0" />
            Internal console · full oversight
          </div>
        )}

        {currentUser && (
          <div className="border-t border-white/10 p-3">
            <div className="flex items-center gap-3 rounded-xl px-2 py-2">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-gold text-sm font-bold text-brand-black">
                {initials(currentUser.name)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-white">{currentUser.name}</p>
                <p className="truncate text-xs text-white/60">{currentUser.role}</p>
              </div>
              <button
                type="button"
                onClick={() => logout()}
                className="rounded-lg p-2 text-white/60 hover:bg-white/10 hover:text-white"
                aria-label="Log out"
                title="Log out"
              >
                <IconLogout className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}
      </aside>
    </>
  )
}
