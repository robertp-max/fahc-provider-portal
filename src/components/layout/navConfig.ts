import {
  IconDashboard,
  IconReferrals,
  IconRevenue,
  IconProfile,
  IconChat,
  IconReports,
  IconSettings,
  IconShield,
  IconBuilding,
} from '@/components/ui/icons'

export interface NavItem {
  href: string
  label: string
  Icon: (props: { className?: string }) => JSX.Element
  /** Optional short description used for tooltips / titles. */
  title?: string
}

export const PROVIDER_NAV: NavItem[] = [
  { href: '/provider/dashboard', label: 'Dashboard', Icon: IconDashboard, title: 'Welcome & summary' },
  { href: '/provider/referrals', label: 'Referrals', Icon: IconReferrals, title: 'Assigned referrals' },
  { href: '/provider/revenue', label: 'Revenue', Icon: IconRevenue, title: 'Monthly revenue submission' },
  { href: '/provider/profile', label: 'Agency Profile', Icon: IconProfile, title: 'Agency profile & rates' },
  { href: '/provider/chat', label: 'Support Chat', Icon: IconChat, title: 'Support threads' },
  { href: '/provider/reports', label: 'Reports', Icon: IconReports, title: 'Performance metrics' },
  { href: '/provider/settings', label: 'Settings', Icon: IconSettings, title: 'MFA & user settings' },
]

export const ADMIN_NAV: NavItem[] = [
  { href: '/admin/provider-portal', label: 'Overview', Icon: IconDashboard, title: 'Admin dashboard' },
  { href: '/admin/provider-portal/agencies', label: 'Agencies', Icon: IconBuilding, title: 'All agencies' },
  { href: '/admin/provider-portal/referrals', label: 'Referrals', Icon: IconReferrals, title: 'All referrals' },
  { href: '/admin/provider-portal/revenue', label: 'Revenue', Icon: IconRevenue, title: 'Revenue review' },
  { href: '/admin/provider-portal/audit', label: 'Audit Log', Icon: IconShield, title: 'Immutable audit log' },
  { href: '/admin/provider-portal/support', label: 'Support', Icon: IconChat, title: 'Support queues' },
]

export function titleForPath(pathname: string): string {
  const all = [...PROVIDER_NAV, ...ADMIN_NAV]
  // Longest matching prefix wins (so /referrals/[id] resolves to Referrals).
  const match = all
    .filter((i) => pathname === i.href || pathname.startsWith(i.href + '/'))
    .sort((a, b) => b.href.length - a.href.length)[0]
  return match?.label ?? 'Provider Portal'
}
