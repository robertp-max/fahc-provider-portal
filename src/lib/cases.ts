import { SupportCase, ProviderUser, INTERNAL_ROLES } from './types'
import { makeId } from './utils'

// ---------------------------------------------------------------------------
// Support-case store (Service Cloud "create case" stub — local only).
// Lets a provider create a case from chat and an internal role see/resolve it.
// Mirrors the audit store pattern: in-memory + localStorage + change event.
// ---------------------------------------------------------------------------

const STORAGE_KEY = 'fahc.support.cases'
export const CASE_EVENT = 'fahc-support-case-changed'

let store: SupportCase[] = []
let hydrated = false

function hydrate() {
  if (hydrated || typeof window === 'undefined') return
  hydrated = true
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (raw) store = JSON.parse(raw) as SupportCase[]
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
  window.dispatchEvent(new CustomEvent(CASE_EVENT))
}

export interface CreateCaseInput {
  agencyId: string
  threadId: string
  subject: string
  category: string
  createdBy: string
}

export function createCase(input: CreateCaseInput): SupportCase {
  hydrate()
  const now = new Date().toISOString()
  const created: SupportCase = {
    id: makeId('case'),
    agencyId: input.agencyId,
    threadId: input.threadId,
    subject: input.subject,
    category: input.category,
    status: 'Open',
    createdBy: input.createdBy,
    createdAt: now,
  }
  store = [created, ...store]
  persist()
  return created
}

export function resolveCase(id: string, resolvedBy: string): SupportCase | undefined {
  hydrate()
  let updated: SupportCase | undefined
  store = store.map((c) => {
    if (c.id !== id) return c
    updated = { ...c, status: 'Resolved', resolvedAt: new Date().toISOString(), resolvedBy }
    return updated
  })
  persist()
  return updated
}

/** Tenant-scoped read: providers see only their agency; internal roles see all. */
export function getCases(viewer: ProviderUser): SupportCase[] {
  hydrate()
  const all = INTERNAL_ROLES.includes(viewer.role)
  return store
    .filter((c) => all || c.agencyId === viewer.agencyId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

export function getCasesForThread(viewer: ProviderUser, threadId: string): SupportCase[] {
  return getCases(viewer).filter((c) => c.threadId === threadId)
}
