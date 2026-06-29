import type { Referral } from './types'

// ---------------------------------------------------------------------------
// Referral field classification — documents how each field may be handled.
//   phi        : protected health info; only shown when explicitly unmasked + audited
//   masked     : a de-identified/minimized rendering safe for list views
//   safe       : non-identifying operational data, safe to display anywhere
//   admin-only : internal context, not part of the provider-facing identity
// This map is the single source of truth for tests/docs and future enforcement.
// ---------------------------------------------------------------------------

export type FieldClass = 'phi' | 'masked' | 'safe' | 'admin-only'

export const REFERRAL_FIELD_CLASS: Record<keyof Referral, FieldClass> = {
  id: 'safe',
  agencyId: 'admin-only',
  inquiryFor: 'safe',
  firstNameMasked: 'masked',
  lastNameMasked: 'masked',
  fullNameEncrypted: 'phi',
  emailMasked: 'masked',
  phoneMasked: 'masked',
  category: 'safe',
  locationZip: 'safe',
  message: 'masked', // truncated snippet only in list view (minimum necessary)
  status: 'safe',
  assignmentDate: 'safe',
  ownershipWindowStart: 'safe',
  ownershipWindowEnd: 'safe',
  consentTimestamp: 'safe',
  sourceLeadId: 'admin-only',
  locked: 'safe',
  updatedAt: 'safe',
}

/** Fields that must never appear in a list view or be searched. */
export const PHI_REFERRAL_FIELDS = (Object.keys(REFERRAL_FIELD_CLASS) as (keyof Referral)[]).filter(
  (k) => REFERRAL_FIELD_CLASS[k] === 'phi',
)
