'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Referral } from '@/lib/types'
import { FAHCStatusBadge } from '@/components/ui/FAHCStatusBadge'
import { FAHCEmptyState } from '@/components/ui/FAHCEmptyState'
import { PhiBadge } from '@/components/ui/PhiBadge'
import { IconSearch, IconChevronRight, IconReferrals, IconLock } from '@/components/ui/icons'
import { cn, formatDate } from '@/lib/utils'

const STATUS_FILTERS = ['All', 'New', 'Contacted', 'Assessment Scheduled', 'Start of Care', 'Declined']
type SortKey = 'newest' | 'oldest' | 'category' | 'location'

interface FAHCReferralTableProps {
  referrals: Referral[]
  /** Base path for row links (provider vs admin). */
  basePath?: string
  /** Show the owning agency id column (admin cross-tenant views). */
  showAgency?: boolean
}

export function FAHCReferralTable({
  referrals,
  basePath = '/provider/referrals',
  showAgency = false,
}: FAHCReferralTableProps) {
  const router = useRouter()
  const [status, setStatus] = useState('All')
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<SortKey>('newest')

  const filtered = useMemo(() => {
    // IMPORTANT (Minimum Necessary): this view only ever reads MASKED fields.
    // It never touches `fullNameEncrypted`.
    const q = query.trim().toLowerCase()
    let rows = referrals.filter((r) => {
      if (status !== 'All' && r.status !== status) return false
      if (!q) return true
      return (
        r.id.toLowerCase().includes(q) ||
        r.firstNameMasked.toLowerCase().includes(q) ||
        r.lastNameMasked.toLowerCase().includes(q) ||
        r.category.toLowerCase().includes(q) ||
        r.locationZip.toLowerCase().includes(q) ||
        r.inquiryFor.toLowerCase().includes(q)
      )
    })
    rows = [...rows].sort((a, b) => {
      switch (sort) {
        case 'oldest':
          return new Date(a.assignmentDate).getTime() - new Date(b.assignmentDate).getTime()
        case 'category':
          return a.category.localeCompare(b.category)
        case 'location':
          return a.locationZip.localeCompare(b.locationZip)
        default:
          return new Date(b.assignmentDate).getTime() - new Date(a.assignmentDate).getTime()
      }
    })
    return rows
  }, [referrals, status, query, sort])

  const counts = useMemo(() => {
    const map: Record<string, number> = { All: referrals.length }
    for (const s of STATUS_FILTERS.slice(1)) map[s] = referrals.filter((r) => r.status === s).length
    return map
  }, [referrals])

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-1.5">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatus(s)}
              className={cn(
                'rounded-full px-3 py-1.5 text-xs font-semibold transition-colors',
                status === s
                  ? 'bg-brand-primary text-white'
                  : 'bg-white text-brand-charcoal/70 hover:bg-brand-paleBlue',
              )}
            >
              {s} <span className="opacity-60">{counts[s] ?? 0}</span>
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <label className="relative">
            <span className="sr-only">Search referrals</span>
            <IconSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-charcoal/40" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search…"
              className="fahc-input w-44 py-2 pl-9 text-sm sm:w-56"
            />
          </label>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="fahc-input w-auto py-2 text-sm"
            aria-label="Sort referrals"
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="category">Category</option>
            <option value="location">Location</option>
          </select>
        </div>
      </div>

      {/* PHI note */}
      <div className="flex items-center gap-2 text-xs text-brand-charcoal/60">
        <PhiBadge /> Names and contact details are masked in list view (Minimum Necessary). Open a
        referral to unlock authorized PHI — each access is audited.
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <FAHCEmptyState
          icon={<IconReferrals className="h-6 w-6" />}
          title="No referrals match"
          description="Try a different status filter or clear your search."
        />
      ) : (
        <div className="fahc-surface overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead>
                <tr className="border-b border-brand-lightGray/70 bg-brand-paleBlue/40 text-xs uppercase tracking-wide text-brand-charcoal/60">
                  <th className="px-4 py-3 font-semibold">Referral</th>
                  <th className="px-4 py-3 font-semibold">Inquiry&nbsp;For</th>
                  {showAgency && <th className="px-4 py-3 font-semibold">Agency</th>}
                  <th className="px-4 py-3 font-semibold">Category</th>
                  <th className="px-4 py-3 font-semibold">Location</th>
                  <th className="hidden px-4 py-3 font-semibold xl:table-cell">Contact</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Assigned</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-lightGray/70">
                {filtered.map((r) => (
                  <tr
                    key={r.id}
                    tabIndex={0}
                    onClick={() => router.push(`${basePath}/${r.id}`)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') router.push(`${basePath}/${r.id}`)
                    }}
                    className="cursor-pointer transition-colors hover:bg-brand-paleBlue/40 focus:bg-brand-paleBlue/40"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 font-semibold text-brand-charcoal">
                        {r.firstNameMasked} {r.lastNameMasked}
                        {r.locked && (
                          <IconLock className="h-3.5 w-3.5 text-brand-charcoal/40" aria-label="Locked" />
                        )}
                      </div>
                      <div className="text-xs text-brand-charcoal/50">{r.id}</div>
                    </td>
                    <td className="px-4 py-3 text-brand-charcoal/80">{r.inquiryFor}</td>
                    {showAgency && (
                      <td className="px-4 py-3 text-xs text-brand-charcoal/60">{r.agencyId}</td>
                    )}
                    <td className="px-4 py-3 text-brand-charcoal/80">{r.category}</td>
                    <td className="px-4 py-3 text-brand-charcoal/80">{r.locationZip}</td>
                    <td className="hidden px-4 py-3 text-xs text-brand-charcoal/60 xl:table-cell">
                      <div>{r.emailMasked}</div>
                      <div>{r.phoneMasked}</div>
                    </td>
                    <td className="px-4 py-3">
                      <FAHCStatusBadge status={r.status} />
                    </td>
                    <td className="px-4 py-3 text-brand-charcoal/70">{formatDate(r.assignmentDate)}</td>
                    <td className="px-4 py-3 text-right">
                      <IconChevronRight className="ml-auto h-4 w-4 text-brand-charcoal/30" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
