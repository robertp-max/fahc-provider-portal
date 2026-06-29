'use client'

import Link from 'next/link'
import { useAuth } from '@/lib/auth'
import {
  getMyAgency,
  getReferrals,
  getReferralMetrics,
  getSubmittedRevenueTotal,
  getRevenue,
} from '@/lib/api'
import { FAHCMetricCard } from '@/components/ui/FAHCMetricCard'
import { FAHCCard } from '@/components/ui/FAHCCard'
import { FAHCStatusBadge } from '@/components/ui/FAHCStatusBadge'
import { ProgressBar, Sparkline } from '@/components/charts/Charts'
import {
  IconReferrals,
  IconRevenue,
  IconClock,
  IconChevronRight,
  IconChat,
  IconProfile,
  IconAlert,
  IconCheckCircle,
} from '@/components/ui/icons'
import { formatCurrency, formatDate, relativeTime } from '@/lib/utils'

// Illustrative 6-month revenue trend for the sparkline (prototype display data).
const REVENUE_TREND = [4200, 5100, 6800, 7400, 8300, 9320]

export default function DashboardPage() {
  const { currentUser } = useAuth()
  if (!currentUser) return null

  const agency = getMyAgency(currentUser)
  const referrals = getReferrals(currentUser)
  const metrics = getReferralMetrics(currentUser)
  const revenueTotal = getSubmittedRevenueTotal(currentUser)
  const drafts = getRevenue(currentUser).filter((r) => r.status !== 'Submitted').length

  const needsAction = referrals.filter((r) => r.status === 'New')
  const recent = [...referrals]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 4)

  const firstName = currentUser.name.split(' ')[0]

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="overflow-hidden rounded-2xl bg-brand-primary p-6 text-white shadow-card sm:p-8">
        <p className="text-sm font-medium text-brand-softBlue">
          {agency?.displayName} · {currentUser.role}
        </p>
        <h2 className="mt-1 font-heading text-2xl font-semibold text-white sm:text-3xl">
          Welcome back, {firstName}.
        </h2>
        <p className="mt-2 max-w-xl text-sm text-white/75">
          Here&rsquo;s what&rsquo;s happening across your referrals and revenue today.
        </p>
      </div>

      {/* Action alert */}
      {needsAction.length > 0 ? (
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-brand-darkGold/30 bg-brand-softGold/50 px-4 py-3">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-brand-gold text-brand-black">
            <IconAlert className="h-5 w-5" />
          </span>
          <p className="text-sm text-brand-charcoal">
            <span className="font-semibold">
              {needsAction.length} new referral{needsAction.length === 1 ? '' : 's'}
            </span>{' '}
            awaiting your first response. Responding within the ownership window protects assignment.
          </p>
          <Link href="/provider/referrals" className="fahc-btn-primary ml-auto py-2 text-xs">
            Review now <IconChevronRight className="h-4 w-4" />
          </Link>
        </div>
      ) : (
        <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <IconCheckCircle className="h-5 w-5 shrink-0" /> You&rsquo;re all caught up — no referrals
          awaiting a first response.
        </div>
      )}

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <FAHCMetricCard
          label="New referrals"
          value={metrics.new}
          hint="Awaiting first response"
          icon={<IconReferrals className="h-5 w-5" />}
          emphasis
        />
        <FAHCMetricCard
          label="In progress"
          value={metrics.inProgress}
          hint="Contacted / scheduled"
          icon={<IconClock className="h-5 w-5" />}
        />
        <FAHCMetricCard
          label="Started care"
          value={metrics.completed}
          hint={`${metrics.completionRate}% conversion`}
          icon={<IconCheckCircle className="h-5 w-5" />}
        />
        <FAHCMetricCard
          label="Revenue submitted"
          value={formatCurrency(revenueTotal)}
          hint={drafts > 0 ? `${drafts} draft pending` : 'All caught up'}
          icon={<IconRevenue className="h-5 w-5" />}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent referrals */}
        <FAHCCard
          className="lg:col-span-2"
          title="Recent referral activity"
          subtitle="Most recently updated assignments"
          action={
            <Link href="/provider/referrals" className="fahc-link text-sm">
              View all
            </Link>
          }
          flush
        >
          <ul className="divide-y divide-brand-lightGray/70">
            {recent.map((r) => (
              <li key={r.id}>
                <Link
                  href={`/provider/referrals/${r.id}`}
                  className="flex items-center gap-4 px-5 py-3.5 hover:bg-brand-paleBlue/50"
                >
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand-paleBlue font-heading text-sm font-semibold text-brand-primary">
                    {r.firstNameMasked[0]}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-brand-charcoal">
                      {r.firstNameMasked} {r.lastNameMasked}{' '}
                      <span className="font-normal text-brand-charcoal/50">· {r.category}</span>
                    </p>
                    <p className="truncate text-xs text-brand-charcoal/60">
                      {r.inquiryFor} · ZIP {r.locationZip} · updated {relativeTime(r.updatedAt)}
                    </p>
                  </div>
                  <FAHCStatusBadge status={r.status} />
                  <IconChevronRight className="h-4 w-4 shrink-0 text-brand-charcoal/30" />
                </Link>
              </li>
            ))}
          </ul>
        </FAHCCard>

        {/* Side column */}
        <div className="space-y-6">
          <FAHCCard title="Quick links">
            <div className="space-y-2">
              {[
                { href: '/provider/referrals', label: 'Manage referrals', Icon: IconReferrals },
                { href: '/provider/profile', label: 'Edit agency profile', Icon: IconProfile },
                { href: '/provider/chat', label: 'Go to support chat', Icon: IconChat },
              ].map(({ href, label, Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className="flex items-center gap-3 rounded-xl border border-brand-lightGray/70 px-3 py-2.5 text-sm font-medium text-brand-charcoal transition-colors hover:border-brand-softBlue hover:bg-brand-paleBlue/50"
                >
                  <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-paleBlue text-brand-primary">
                    <Icon className="h-4 w-4" />
                  </span>
                  {label}
                  <IconChevronRight className="ml-auto h-4 w-4 text-brand-charcoal/30" />
                </Link>
              ))}
            </div>
          </FAHCCard>

          <FAHCCard title="Profile completeness">
            <div className="flex items-center justify-between">
              <span className="font-heading text-3xl font-semibold text-brand-primary">
                {agency?.profileCompleteness ?? 0}%
              </span>
              <span className="text-xs text-brand-charcoal/60">
                Verified {formatDate(agency?.lastVerifiedAt)}
              </span>
            </div>
            <ProgressBar value={agency?.profileCompleteness ?? 0} className="mt-3" />
            <Link href="/provider/profile" className="mt-3 inline-block fahc-link text-sm">
              Complete your profile →
            </Link>
          </FAHCCard>
        </div>
      </div>

      {/* Performance trend */}
      <FAHCCard title="Revenue trend" subtitle="Last 6 months (submitted)">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="font-heading text-3xl font-semibold text-brand-primary">
              {formatCurrency(REVENUE_TREND[REVENUE_TREND.length - 1])}
            </span>
            <p className="text-sm text-brand-charcoal/60">Most recent month</p>
          </div>
          <div className="w-full sm:max-w-xs">
            <Sparkline values={REVENUE_TREND} />
            <div className="mt-1 flex justify-between text-[11px] text-brand-charcoal/50">
              <span>Jan</span>
              <span>Jun</span>
            </div>
          </div>
        </div>
      </FAHCCard>
    </div>
  )
}
