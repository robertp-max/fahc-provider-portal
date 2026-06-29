'use client'

import { useAuth } from '@/lib/auth'
import { getReferralMetrics, getReferrals, getSubmittedRevenueTotal } from '@/lib/api'
import { FAHCCard } from '@/components/ui/FAHCCard'
import { FAHCMetricCard } from '@/components/ui/FAHCMetricCard'
import { BarChart, DonutChart, ProgressBar } from '@/components/charts/Charts'
import { IconRevenue, IconReferrals, IconClock, IconCheckCircle } from '@/components/ui/icons'
import { formatCurrency } from '@/lib/utils'

// Illustrative aggregates for the performance view (prototype display data).
const REVENUE_BY_MONTH = [
  { label: 'Jan', value: 4200 },
  { label: 'Feb', value: 5100 },
  { label: 'Mar', value: 6800 },
  { label: 'Apr', value: 7400 },
  { label: 'May', value: 8300 },
  { label: 'Jun', value: 9320 },
]
const HOURS_BY_SERVICE = [
  { label: 'Companion', value: 320 },
  { label: 'Memory', value: 210 },
  { label: 'Skilled', value: 140 },
  { label: 'Respite', value: 90 },
]
const SOURCE_BREAKDOWN = [
  { label: 'Online Ads', value: 40, color: '#1B4F72' },
  { label: 'Hospital Discharge', value: 20, color: '#C7DCEB' },
  { label: 'Senior Ads', value: 20, color: '#FAD06E' },
  { label: 'Community Events', value: 12, color: '#C29A2A' },
  { label: 'Other', value: 8, color: '#3A3A3A' },
]

// KPI targets from the PRD success metrics.
const KPIS = [
  { name: 'Referral response time', value: '18 hrs', target: '< 24 hrs', pct: 75, ok: true },
  { name: 'Referral completion rate', value: '62%', target: '≥ 60%', pct: 62, ok: true },
  { name: 'Revenue submission compliance', value: '96%', target: '≥ 95%', pct: 96, ok: true },
  { name: 'Profile data completeness', value: '85%', target: '≥ 90%', pct: 85, ok: false },
]

export default function ReportsPage() {
  const { currentUser } = useAuth()
  if (!currentUser) return null

  const metrics = getReferralMetrics(currentUser)
  const referrals = getReferrals(currentUser)
  const revenue = getSubmittedRevenueTotal(currentUser)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-2xl font-semibold text-brand-primary">Performance Reports</h2>
        <p className="mt-1 text-sm text-brand-charcoal/70">
          Track your conversion, responsiveness, and revenue against Find A Home Care targets.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <FAHCMetricCard
          label="Total revenue"
          value={formatCurrency(revenue)}
          hint="Submitted to date"
          icon={<IconRevenue className="h-5 w-5" />}
          emphasis
        />
        <FAHCMetricCard
          label="Total referrals"
          value={referrals.length}
          hint={`${metrics.new} awaiting action`}
          icon={<IconReferrals className="h-5 w-5" />}
        />
        <FAHCMetricCard
          label="Completion rate"
          value={`${metrics.completionRate}%`}
          hint="Assessment / Start of Care"
          icon={<IconCheckCircle className="h-5 w-5" />}
        />
        <FAHCMetricCard
          label="Avg. response"
          value="18 hrs"
          hint="Target < 24 hrs"
          icon={<IconClock className="h-5 w-5" />}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <FAHCCard title="Monthly revenue trend" subtitle="Last 6 months">
          <BarChart data={REVENUE_BY_MONTH} barClassName="bg-brand-primary" />
        </FAHCCard>

        <FAHCCard title="Referral source breakdown" subtitle="Where your matches originate">
          <DonutChart segments={SOURCE_BREAKDOWN} centerLabel={`${referrals.length}`} centerSub="referrals" />
        </FAHCCard>

        <FAHCCard title="Caregiver hours by service" subtitle="Monthly average">
          <BarChart data={HOURS_BY_SERVICE} barClassName="bg-brand-gold" />
        </FAHCCard>

        <FAHCCard title="KPIs vs. targets">
          <ul className="space-y-4">
            {KPIS.map((k) => (
              <li key={k.name}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="text-brand-charcoal">{k.name}</span>
                  <span className="font-semibold text-brand-primary">
                    {k.value}{' '}
                    <span className="font-normal text-brand-charcoal/50">/ {k.target}</span>
                  </span>
                </div>
                <ProgressBar
                  value={k.pct}
                  barClassName={k.ok ? 'bg-emerald-500' : 'bg-brand-gold'}
                />
              </li>
            ))}
          </ul>
        </FAHCCard>
      </div>
    </div>
  )
}
