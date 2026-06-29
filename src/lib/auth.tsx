'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { ProviderUser, ProviderRole } from './types'
import { mockUser } from './mockData'

// ---------------------------------------------------------------------------
// Mocked authentication.
// There is NO real auth here — any non-empty credentials sign the demo user in.
// In production this is replaced by Google Identity Platform / Firebase Auth
// with custom JWT claims (agencyId + role) driving tenant isolation.
// ---------------------------------------------------------------------------

const SESSION_KEY = 'fahc.session.user'
const REMEMBER_KEY = 'fahc.remember.username'

interface AuthContextValue {
  currentUser: ProviderUser | null
  loading: boolean
  rememberedUsername: string | null
  login: (email: string, password: string, remember: boolean) => boolean
  logout: () => void
  /** Demo affordance: switch the active role to exercise role-based behaviours. */
  setActiveRole: (role: ProviderRole) => void
  toggleMfa: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<ProviderUser | null>(null)
  const [rememberedUsername, setRememberedUsername] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // Restore session on first client render (server render stays "logged out"
  // so hydration is consistent). Login is NOT required: if there's no stored
  // session we auto-sign-in the demo provider so the portal opens directly.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(SESSION_KEY)
      setCurrentUser(raw ? (JSON.parse(raw) as ProviderUser) : { ...mockUser })
      setRememberedUsername(window.localStorage.getItem(REMEMBER_KEY))
    } catch {
      setCurrentUser({ ...mockUser })
    } finally {
      setLoading(false)
    }
  }, [])

  const persist = useCallback((user: ProviderUser | null) => {
    try {
      if (user) window.localStorage.setItem(SESSION_KEY, JSON.stringify(user))
      else window.localStorage.removeItem(SESSION_KEY)
    } catch {
      /* ignore */
    }
  }, [])

  const login = useCallback(
    (email: string, password: string, remember: boolean) => {
      if (!email.trim() || !password.trim()) return false
      // Sign in as the seeded demo provider; data is scoped to their agency.
      const user: ProviderUser = { ...mockUser, lastLoginAt: new Date().toISOString() }
      setCurrentUser(user)
      persist(user)
      try {
        if (remember) window.localStorage.setItem(REMEMBER_KEY, email)
        else window.localStorage.removeItem(REMEMBER_KEY)
      } catch {
        /* ignore */
      }
      setRememberedUsername(remember ? email : null)
      return true
    },
    [persist],
  )

  const logout = useCallback(() => {
    setCurrentUser(null)
    persist(null)
  }, [persist])

  const setActiveRole = useCallback(
    (role: ProviderRole) => {
      setCurrentUser((prev) => {
        if (!prev) return prev
        const next = { ...prev, role }
        persist(next)
        return next
      })
    },
    [persist],
  )

  const toggleMfa = useCallback(() => {
    setCurrentUser((prev) => {
      if (!prev) return prev
      const next = { ...prev, mfaEnabled: !prev.mfaEnabled }
      persist(next)
      return next
    })
  }, [persist])

  const value = useMemo<AuthContextValue>(
    () => ({ currentUser, loading, rememberedUsername, login, logout, setActiveRole, toggleMfa }),
    [currentUser, loading, rememberedUsername, login, logout, setActiveRole, toggleMfa],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}
