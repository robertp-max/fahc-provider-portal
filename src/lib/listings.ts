import { ListingRecord, ListingStatus, ProviderUser, INTERNAL_ROLES } from './types'

// ---------------------------------------------------------------------------
// Business-listing state engine (mock, local only).
// Lifecycle: Draft → Pending Review → Approved / Live | Rejected → (Draft) → …
// Providers can edit a Draft and submit for review; they CANNOT publish.
// Internal roles approve/reject (rejection requires a comment).
// Approved listings are read-only until a new Draft is created (revert).
// ---------------------------------------------------------------------------

const STORAGE_KEY = 'fahc.listings'
export const LISTING_EVENT = 'fahc-listing-changed'

// Seeded defaults per agency.
const SEED: Record<string, ListingStatus> = {
  'agency-101': 'Approved / Live',
  'agency-202': 'Pending Review',
}

let store: Record<string, ListingRecord> = {}
let hydrated = false

function hydrate() {
  if (hydrated || typeof window === 'undefined') return
  hydrated = true
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (raw) store = JSON.parse(raw) as Record<string, ListingRecord>
  } catch {
    /* ignore */
  }
}

function persist() {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new CustomEvent(LISTING_EVENT))
}

function nowIso() {
  return new Date().toISOString()
}

export function getListing(agencyId: string): ListingRecord {
  hydrate()
  if (!store[agencyId]) {
    const status = SEED[agencyId] ?? 'Draft'
    store[agencyId] = {
      agencyId,
      status,
      updatedAt: nowIso(),
      history: [{ status, at: nowIso(), by: 'system (seed)' }],
    }
  }
  return store[agencyId]
}

function transition(
  agencyId: string,
  status: ListingStatus,
  by: string,
  comment?: string,
): ListingRecord {
  hydrate()
  const prev = getListing(agencyId)
  const next: ListingRecord = {
    agencyId,
    status,
    rejectionComment: status === 'Rejected' ? comment : undefined,
    updatedAt: nowIso(),
    history: [{ status, at: nowIso(), by, comment }, ...prev.history],
  }
  store = { ...store, [agencyId]: next }
  persist()
  return next
}

export function submitForReview(agencyId: string, by: string) {
  return transition(agencyId, 'Pending Review', by)
}
export function approveListing(agencyId: string, by: string) {
  return transition(agencyId, 'Approved / Live', by)
}
export function rejectListing(agencyId: string, by: string, comment: string) {
  return transition(agencyId, 'Rejected', by, comment)
}
/** Open a new draft from an Approved/Rejected listing (also serves as rollback). */
export function revertToDraft(agencyId: string, by: string) {
  return transition(agencyId, 'Draft', by)
}

/** Listings visible to an internal viewer (all) vs a provider (own agency). */
export function getListingsForViewer(viewer: ProviderUser): ListingRecord[] {
  hydrate()
  const all = INTERNAL_ROLES.includes(viewer.role)
  // Ensure seeded agencies exist in the store for admin views.
  Object.keys(SEED).forEach((id) => getListing(id))
  return Object.values(store).filter((l) => all || l.agencyId === viewer.agencyId)
}

/** A public listing is live only when Approved/Live. */
export function isListingLive(agencyId: string): boolean {
  return getListing(agencyId).status === 'Approved / Live'
}
