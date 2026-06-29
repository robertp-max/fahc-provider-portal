import { AuditEvent, AuditSurface, ProviderUser, INTERNAL_ROLES } from './types'
import { mockAuditEvents } from './mockData'
import { makeId } from './utils'

// ---------------------------------------------------------------------------
// Immutable audit trail (prototype).
// Every governed action (viewing PHI, updating an outcome, autosaving revenue,
// "verify no changes") is appended here AND emitted to the console as a JSON
// payload that maps 1:1 to the AuditEvent interface. In production this maps to
// Cloud Logging / an append-only audit table.
// ---------------------------------------------------------------------------

const STORAGE_KEY = 'fahc.audit.events'
export const AUDIT_EVENT = 'fahc-audit-logged'

// Seed with historical events (cloned so the seed array is never mutated).
let store: AuditEvent[] = mockAuditEvents.map((e) => ({ ...e }))
let hydrated = false

function hydrateFromStorage() {
  if (hydrated || typeof window === 'undefined') return
  hydrated = true
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as AuditEvent[]
      if (Array.isArray(parsed) && parsed.length) store = parsed
    } else {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
    }
  } catch {
    /* localStorage unavailable — fall back to in-memory store. */
  }
}

function persist() {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
  } catch {
    /* ignore quota / privacy-mode failures */
  }
}

export interface LogAuditInput {
  actor: Pick<ProviderUser, 'id' | 'role' | 'agencyId'>
  action: string
  objectType: string
  objectId: string
  phiFlag?: boolean
  /** Required: which surface generated the event (compliance context). */
  surface: AuditSurface
  metadata?: Record<string, unknown>
}

// ---------------------------------------------------------------------------
// Metadata sanitization — defence-in-depth so PHI can never reach the audit
// trail (console, localStorage, or UI), even if a caller passes it by mistake.
// ---------------------------------------------------------------------------

// Substrings that flag a metadata KEY as PHI-bearing → dropped entirely.
const UNSAFE_KEY_PATTERNS = [
  'name',
  'email',
  'phone',
  'message',
  'note',
  'body',
  'address',
  'contact',
  'client',
  'patient',
  'ssn',
  'dob',
  'birth',
  'diagnos',
  'fullname',
]

const MAX_VALUE_LEN = 80

export function isSafeMetadataKey(key: string): boolean {
  const k = key.toLowerCase()
  return !UNSAFE_KEY_PATTERNS.some((p) => k.includes(p))
}

/** Return a copy of metadata with PHI-risk keys removed and values bounded. */
export function sanitizeMetadata(
  metadata?: Record<string, unknown>,
): Record<string, unknown> | undefined {
  if (!metadata) return undefined
  const out: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(metadata)) {
    if (!isSafeMetadataKey(key)) continue
    if (value == null) continue
    if (typeof value === 'number' || typeof value === 'boolean') {
      out[key] = value
    } else if (typeof value === 'string') {
      // Bound length so no free-text PHI can ride along in a "safe" key.
      out[key] = value.length > MAX_VALUE_LEN ? `${value.slice(0, MAX_VALUE_LEN)}…` : value
    } else if (Array.isArray(value)) {
      out[key] = value
        .filter((v) => typeof v === 'string' || typeof v === 'number')
        .map((v) => String(v).slice(0, MAX_VALUE_LEN))
    }
    // objects and other types are intentionally dropped
  }
  return Object.keys(out).length ? out : undefined
}

/** Append an immutable audit event, mirror it to the console, and notify the UI. */
export function logAudit(input: LogAuditInput): AuditEvent {
  hydrateFromStorage()

  const event: AuditEvent = {
    id: makeId('aud'),
    actorId: input.actor.id,
    actorRole: input.actor.role,
    agencyId: input.actor.agencyId,
    action: input.action,
    objectType: input.objectType,
    objectId: input.objectId,
    timestamp: new Date().toISOString(),
    ip: '203.0.113.24', // mock — real client IP is resolved server-side in prod
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'server',
    phiFlag: input.phiFlag ?? false,
    surface: input.surface,
    metadata: sanitizeMetadata(input.metadata),
  }

  store = [event, ...store]
  persist()

  // Required by the spec: emit the audit payload as JSON to the console.
  // eslint-disable-next-line no-console
  console.log('[AUDIT]', JSON.stringify(event))

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(AUDIT_EVENT, { detail: event }))
  }
  return event
}

/**
 * Read the audit trail. Tenant-isolated: external providers only ever see their
 * own agency's events; internal/auditor roles can see the global trail.
 */
export function getAuditEvents(viewer: ProviderUser): AuditEvent[] {
  hydrateFromStorage()
  const canSeeAll = INTERNAL_ROLES.includes(viewer.role)
  const events = canSeeAll
    ? store
    : store.filter((e) => e.agencyId === viewer.agencyId)
  return [...events].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  )
}

/** Events scoped to a single object (e.g. one referral's timeline). */
export function getAuditEventsForObject(
  viewer: ProviderUser,
  objectType: string,
  objectId: string,
): AuditEvent[] {
  return getAuditEvents(viewer).filter(
    (e) => e.objectType === objectType && e.objectId === objectId,
  )
}
