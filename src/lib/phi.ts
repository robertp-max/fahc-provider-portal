// Lightweight, heuristic PHI detection for free-text guardrails (chat, notes).
// This is intentionally conservative — it errs toward blocking. It is NOT a
// substitute for real de-identification; it exists to stop obvious PHI from
// being entered into a prototype that must never carry it.

const EMAIL = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i
// 7+ digit runs or formatted phone numbers
const PHONE = /(\+?\d[\s().-]?){7,}/
const SSN = /\b\d{3}-\d{2}-\d{4}\b/
// Dates of birth like 01/02/1990 or 1990-01-02
const DOB = /\b(\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|\d{4}[/-]\d{1,2}[/-]\d{1,2})\b/
// Common care/medical terms that suggest clinical detail
const CLINICAL =
  /\b(diagnos\w*|dementia|alzheimer\w*|cancer|stroke|diabet\w*|medication|prescrib\w*|hospice|ssn|medicare|medicaid)\b/i

export interface PhiCheckResult {
  flagged: boolean
  reason?: string
}

export function checkForPhi(text: string): PhiCheckResult {
  if (!text) return { flagged: false }
  if (EMAIL.test(text)) return { flagged: true, reason: 'an email address' }
  if (SSN.test(text)) return { flagged: true, reason: 'a social security number' }
  if (PHONE.test(text)) return { flagged: true, reason: 'a phone number' }
  if (DOB.test(text)) return { flagged: true, reason: 'a date of birth' }
  if (CLINICAL.test(text)) return { flagged: true, reason: 'clinical or care details' }
  return { flagged: false }
}

export const PHI_INPUT_WARNING =
  'Do not include client names, contact details, dates of birth, diagnoses, or other PHI.'
