'use client'

import type { ProviderUser } from '@/lib/types'
import { canAccessAllTenants } from '@/lib/api'
import { IconShield, IconAlert } from '@/components/ui/icons'

/** Banner clarifying whether the admin screens show all tenants or are scoped. */
export function AdminScopeNote({ viewer }: { viewer: ProviderUser }) {
  const all = canAccessAllTenants(viewer)
  if (all) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-brand-softBlue bg-brand-paleBlue/60 px-4 py-2.5 text-sm text-brand-primary">
        <IconShield className="h-4 w-4 shrink-0" />
        Internal role <strong>{viewer.role}</strong> — viewing data across all agencies.
      </div>
    )
  }
  return (
    <div className="flex items-center gap-2 rounded-xl border border-brand-darkGold/30 bg-brand-softGold/40 px-4 py-2.5 text-sm text-brand-charcoal">
      <IconAlert className="h-4 w-4 shrink-0 text-brand-darkGold" />
      You&rsquo;re a provider role, so these internal screens stay scoped to your agency. Switch to an
      internal role in <span className="font-semibold">Settings</span> to view all tenants.
    </div>
  )
}
