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
  metadata?: Record<string, unknown>
}

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
