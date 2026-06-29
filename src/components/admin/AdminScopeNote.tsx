'use client'

import type { ProviderUser } from '@/lib/types'
import { IconShield, IconEye } from '@/components/ui/icons'

/** Banner clarifying the internal viewer's scope on admin surfaces. */
export function AdminScopeNote({ viewer }: { viewer: ProviderUser }) {
  const readOnly = viewer.role === 'Read-only Auditor' || viewer.role === 'Internal Compliance/Audit'
  return (
    <div className="flex items-center gap-2 rounded-xl border border-brand-softBlue bg-brand-paleBlue/60 px-4 py-2.5 text-sm text-brand-primary">
      {readOnly ? <IconEye className="h-4 w-4 shrink-0" /> : <IconShield className="h-4 w-4 shrink-0" />}
      Internal role <strong>{viewer.role}</strong> —{' '}
      {readOnly
        ? 'viewing all agencies in read-only mode.'
        : 'viewing data across all agencies. Actions are audited.'}
    </div>
  )
}
