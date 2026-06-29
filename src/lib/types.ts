// ---------------------------------------------------------------------------
// Find A Home Care — Provider Portal data model
// Mirrors the Salesforce Lead → Referral → Account architecture, but typed for
// a local, HIPAA-conscious prototype. No `any` types are used in app logic.
// ---------------------------------------------------------------------------

export type ProviderRole =
  | 'Provider Owner'
  | 'Provider Intake Coordinator'
  | 'Provider Billing'
  | 'Provider Clinical Admin'
  | 'Internal Admin'
  | 'Internal Referral Coordinator'
  | 'Internal Compliance/Audit'
  | 'Read-only Auditor'

export type ReferralStatus =
  | 'Contacted'
  | 'Assessment Scheduled'
  | 'Start of Care'
  | 'Declined'

/** Roles that belong to Find A Home Care internal staff (not external providers). */
export const INTERNAL_ROLES: ProviderRole[] = [
  'Internal Admin',
  'Internal Referral Coordinator',
  'Internal Compliance/Audit',
  'Read-only Auditor',
]

export interface Agency {
  id: string
  legalName: string
  displayName: string
  status: string
  serviceOfferings: string[]
  rates: { hourly: number; onCall: number; overnight: number; weekend: number }
  liveInCareOffered: boolean
  depositRequired: boolean
  paymentMethods: string[]
  availability: string
  serviceAreas: string[]
  languages: string[]
  caregiverScreeningStatus: string
  certificationLevels: string[]
  profileDescription: string
  logoFileId?: string
  photoFileIds: string[]
  contactInfo: { phone: string; email: string; address: string; businessHours: string }
  profileCompleteness: number
  lastVerifiedAt?: string
  lastVerifiedBy?: string
  // --- Extended profile (PRD §4) ---
  operationalDetails?: string
  capacityNotes?: string
  intakeProcess?: string
  businessHoursByDay?: DayHours[]
  // --- Internal activation (admin only) ---
  activationStatus?: AgencyActivationStatus
  agreements?: AgencyAgreements
}

export type DayOfWeek =
  | 'Monday'
  | 'Tuesday'
  | 'Wednesday'
  | 'Thursday'
  | 'Friday'
  | 'Saturday'
  | 'Sunday'

export interface DayHours {
  day: DayOfWeek
  open: string // "HH:MM"
  close: string // "HH:MM"
  closed: boolean
}

export type AgencyActivationStatus =
  | 'Subscribed / Unverified'
  | 'Pending Activation'
  | 'Active'
  | 'Suspended / Deactivated'

export interface AgencyAgreements {
  businessLicense: boolean
  referralAgreement: boolean
  baa: boolean
}

export type ListingStatus =
  | 'Draft'
  | 'Pending Review'
  | 'Approved / Live'
  | 'Rejected'
  | 'Archived'

export interface ListingHistoryEntry {
  status: ListingStatus
  at: string
  by: string
  comment?: string
}

export interface ListingRecord {
  agencyId: string
  status: ListingStatus
  rejectionComment?: string
  updatedAt: string
  history: ListingHistoryEntry[]
}

export interface ProviderUser {
  id: string
  agencyId: string
  name: string
  email: string
  role: ProviderRole
  status: string
  lastLoginAt: string
  mfaEnabled: boolean
}

export interface Referral {
  id: string
  agencyId: string
  inquiryFor: string
  firstNameMasked: string
  lastNameMasked: string
  fullNameEncrypted: string
  emailMasked: string
  phoneMasked: string
  category: string
  locationZip: string
  message: string
  status: string
  assignmentDate: string
  ownershipWindowStart: string
  ownershipWindowEnd: string
  consentTimestamp: string
  sourceLeadId: string
  locked: boolean
  updatedAt: string
}

export interface ReferralOutcomeUpdate {
  id: string
  referralId: string
  agencyId: string
  outcome: ReferralStatus
  notes: string
  dateOfUpdate: string
  updatedBy: string
  createdAt: string
}

export interface RevenueSubmission {
  id: string
  agencyId: string
  referralId: string
  monthYear: string
  revenueAmount: number
  paymentMode: string
  supportingNotes?: string
  status: string
  autosavedAt?: string
  submittedAt?: string
  submittedBy?: string
}

export interface ChatMessage {
  id: string
  author: string
  authorRole: 'provider' | 'support'
  body: string
  sentAt: string
}

export interface SupportThread {
  id: string
  agencyId: string
  subject: string
  category: string
  status: string
  createdBy: string
  messages: ChatMessage[]
  createdAt: string
  updatedAt: string
}

export interface AuditEvent {
  id: string
  actorId: string
  actorRole: string
  agencyId: string
  action: string
  objectType: string
  objectId: string
  beforeHash?: string
  afterHash?: string
  timestamp: string
  ip?: string
  userAgent?: string
  phiFlag: boolean
  /** Which surface generated the event — required context for compliance review. */
  surface: AuditSurface
  metadata?: Record<string, unknown>
}

export type AuditSurface = 'provider' | 'admin' | 'auth' | 'system'

export interface DocumentFile {
  id: string
  agencyId: string
  driveFileId: string
  driveFolderId: string
  fileName: string
  mimeType: string
  size: number
  category: string
  uploadedBy: string
  uploadedAt: string
  phiFlag: boolean
  hash: string
}

export type SupportCaseStatus = 'Open' | 'In Progress' | 'Resolved'

/** Support case created from a chat thread (Service Cloud case stub — local only). */
export interface SupportCase {
  id: string
  agencyId: string
  threadId: string
  subject: string
  category: string
  status: SupportCaseStatus
  createdBy: string
  createdAt: string
  resolvedAt?: string
  resolvedBy?: string
}
