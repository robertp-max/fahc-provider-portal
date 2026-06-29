import {
  Agency,
  ProviderUser,
  Referral,
  ReferralOutcomeUpdate,
  RevenueSubmission,
  SupportThread,
  DocumentFile,
  INTERNAL_ROLES,
} from './types'
import {
  mockAgencies,
  mockReferrals,
  mockOutcomeUpdates,
  mockRevenue,
  mockSupportThreads,
  mockDocuments,
} from './mockData'

// ---------------------------------------------------------------------------
// Mock data-access layer.
//
// SECURITY INVARIANT (HIPAA tenant isolation):
// Every read filters `record.agencyId === user.agencyId`. Internal/auditor
// roles are the only principals allowed to read across tenants. There is no
// code path that returns Agency A's records to an Agency B provider.
// ---------------------------------------------------------------------------

export function canAccessAllTenants(user: ProviderUser): boolean {
  return INTERNAL_ROLES.includes(user.role)
}

export function isInternalAdmin(user: ProviderUser): boolean {
  return user.role === 'Internal Admin' || user.role === 'Internal Referral Coordinator'
}

/** Provider lifecycle gate: operational features require an Active agency. */
export function isAgencyActive(agency?: { activationStatus?: string }): boolean {
  return agency?.activationStatus === 'Active'
}

/** Records this user is permitted to see: own agency only, unless internal. */
function scope<T extends { agencyId: string }>(user: ProviderUser, rows: T[]): T[] {
  if (canAccessAllTenants(user)) return rows
  return rows.filter((r) => r.agencyId === user.agencyId)
}

// ---- Agency ---------------------------------------------------------------

export function getMyAgency(user: ProviderUser): Agency | undefined {
  return mockAgencies.find((a) => a.id === user.agencyId)
}

export function getAllAgencies(user: ProviderUser): Agency[] {
  return canAccessAllTenants(user) ? mockAgencies : mockAgencies.filter((a) => a.id === user.agencyId)
}

// ---- Referrals ------------------------------------------------------------

export function getReferrals(user: ProviderUser): Referral[] {
  return scope(user, mockReferrals).sort(
    (a, b) => new Date(b.assignmentDate).getTime() - new Date(a.assignmentDate).getTime(),
  )
}

export function getReferralById(user: ProviderUser, id: string): Referral | undefined {
  const ref = mockReferrals.find((r) => r.id === id)
  if (!ref) return undefined
  // Tenant guard: never hand a referral to a provider outside its agency.
  if (!canAccessAllTenants(user) && ref.agencyId !== user.agencyId) return undefined
  return ref
}

export function getAllReferrals(user: ProviderUser): Referral[] {
  return canAccessAllTenants(user) ? mockReferrals : getReferrals(user)
}

export function getOutcomeUpdates(user: ProviderUser, referralId: string): ReferralOutcomeUpdate[] {
  return scope(user, mockOutcomeUpdates)
    .filter((u) => u.referralId === referralId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

// ---- Revenue --------------------------------------------------------------

export function getRevenue(user: ProviderUser): RevenueSubmission[] {
  return scope(user, mockRevenue)
}

/** All revenue across tenants for internal roles; own agency otherwise. */
export function getAllRevenue(user: ProviderUser): RevenueSubmission[] {
  return canAccessAllTenants(user) ? mockRevenue : getRevenue(user)
}

export function getSubmittedRevenueTotal(user: ProviderUser, monthYear?: string): number {
  return getRevenue(user)
    .filter((r) => r.status === 'Submitted' && (!monthYear || r.monthYear === monthYear))
    .reduce((sum, r) => sum + r.revenueAmount, 0)
}

// ---- Support threads (chat) ----------------------------------------------

export function getSupportThreads(user: ProviderUser): SupportThread[] {
  return scope(user, mockSupportThreads).sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  )
}

// ---- Documents ------------------------------------------------------------

export function getDocuments(user: ProviderUser): DocumentFile[] {
  return scope(user, mockDocuments)
}

// ---- Derived dashboard metrics -------------------------------------------

export interface ReferralMetrics {
  total: number
  new: number
  inProgress: number
  completed: number
  declined: number
  completionRate: number
}

const FINAL_STATUSES = new Set(['Start of Care'])
const IN_PROGRESS_STATUSES = new Set(['Contacted', 'Assessment Scheduled'])

export function getReferralMetrics(user: ProviderUser): ReferralMetrics {
  const refs = getReferrals(user)
  const total = refs.length
  const nw = refs.filter((r) => r.status === 'New').length
  const inProgress = refs.filter((r) => IN_PROGRESS_STATUSES.has(r.status)).length
  const completed = refs.filter((r) => FINAL_STATUSES.has(r.status)).length
  const declined = refs.filter((r) => r.status === 'Declined').length
  const considered = refs.filter((r) => r.status !== 'New').length
  const converted = refs.filter(
    (r) => r.status === 'Start of Care' || r.status === 'Assessment Scheduled',
  ).length
  const completionRate = considered === 0 ? 0 : Math.round((converted / considered) * 100)
  return { total, new: nw, inProgress, completed, declined, completionRate }
}
