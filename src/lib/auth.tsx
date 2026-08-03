'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { ProviderUser, ProviderRole } from './types'
import { mockUser, mockUsers } from './mockData'
import { logAudit } from './audit'

// ---------------------------------------------------------------------------
// Mocked authentication.
// There is NO real auth here — the demo password signs in seeded local users.
// Login IS required (no silent auto-sign-in). In production this is replaced by
// Google Identity Platform / Firebase Auth with custom JWT claims (agencyId +
// role) driving tenant isolation.
// ---------------------------------------------------------------------------

const SESSION_KEY = 'fahc.session.user'
const REMEMBER_KEY = 'fahc.remember.username'
const MOCK_PASSWORD = 'password'
const ADMIN_LOGIN = 'admin'

// Mocked inactivity session timeout (PRD: session timeouts).
const TIMEOUT_MS = 30 * 60 * 1000 // 30 minutes
const WARN_BEFORE_MS = 60 * 1000 // warn 1 minute before
const ACTIVITY_THROTTLE_MS = 5 * 1000

export type LogoutReason = 'manual' | 'timeout'

interface AuthContextValue {
  currentUser: ProviderUser | null
  loading: boolean
  rememberedUsername: string | null
  sessionWarning: boolean
  login: (email: string, password: string, remember: boolean) => ProviderUser | null
  logout: (reason?: LogoutReason) => void
  extendSession: () => void
  /** Demo affordance: switch the active role to exercise role-based behaviours. */
  setActiveRole: (role: ProviderRole) => void
  toggleMfa: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<ProviderUser | null>(null)
  const [rememberedUsername, setRememberedUsername] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [sessionWarning, setSessionWarning] = useState(false)

  // Keep a ref of the current user so timer callbacks can audit accurately.
  const userRef = useRef<ProviderUser | null>(null)
  userRef.current = currentUser
  const warnTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const logoutTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastActivity = useRef<number>(0)

  const persist = useCallback((user: ProviderUser | null) => {
    try {
      if (user) window.localStorage.setItem(SESSION_KEY, JSON.stringify(user))
      else window.localStorage.removeItem(SESSION_KEY)
    } catch {
      /* ignore */
    }
  }, [])

  const clearTimers = useCallback(() => {
    if (warnTimer.current) clearTimeout(warnTimer.current)
    if (logoutTimer.current) clearTimeout(logoutTimer.current)
    warnTimer.current = null
    logoutTimer.current = null
  }, [])

  const doLogout = useCallback(
    (reason: LogoutReason = 'manual') => {
      const u = userRef.current
      if (u) {
        logAudit({
          actor: u,
          action: reason === 'timeout' ? 'session_timeout' : 'logout',
          objectType: 'Session',
          objectId: u.id,
          phiFlag: false,
          surface: 'auth',
        })
      }
      clearTimers()
      setSessionWarning(false)
      setCurrentUser(null)
      persist(null)
    },
    [clearTimers, persist],
  )

  const scheduleTimers = useCallback(() => {
    clearTimers()
    if (!userRef.current) return
    warnTimer.current = setTimeout(() => setSessionWarning(true), TIMEOUT_MS - WARN_BEFORE_MS)
    logoutTimer.current = setTimeout(() => doLogout('timeout'), TIMEOUT_MS)
  }, [clearTimers, doLogout])

  const extendSession = useCallback(() => {
    setSessionWarning(false)
    lastActivity.current = Date.now()
    scheduleTimers()
  }, [scheduleTimers])

  // Restore session on first client render (no auto-login). Server render stays
  // "logged out" so hydration is consistent.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(SESSION_KEY)
      if (raw) setCurrentUser(JSON.parse(raw) as ProviderUser)
      setRememberedUsername(window.localStorage.getItem(REMEMBER_KEY))
    } catch {
      /* ignore */
    } finally {
      setLoading(false)
    }
  }, [])

  // Inactivity timeout: only armed while signed in.
  useEffect(() => {
    if (!currentUser) {
      clearTimers()
      setSessionWarning(false)
      return
    }
    scheduleTimers()
    const onActivity = () => {
      const now = Date.now()
      if (now - lastActivity.current < ACTIVITY_THROTTLE_MS) return
      lastActivity.current = now
      if (!sessionWarning) scheduleTimers() // don't silently reset while warning is shown
    }
    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart']
    events.forEach((e) => window.addEventListener(e, onActivity, { passive: true }))
    return () => {
      events.forEach((e) => window.removeEventListener(e, onActivity))
      clearTimers()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser, sessionWarning])

  const login = useCallback(
    (email: string, password: string, remember: boolean) => {
      const username = email.trim().toLowerCase()
      if (!username || password !== MOCK_PASSWORD) return null

      const matchedUser =
        username === ADMIN_LOGIN
          ? mockUsers.find((u) => u.role === 'Internal Admin')
          : mockUsers.find((u) => u.email.toLowerCase() === username || u.id.toLowerCase() === username)

      // Default to the seeded provider for unknown demo usernames with the correct password.
      const user: ProviderUser = { ...(matchedUser ?? mockUser), lastLoginAt: new Date().toISOString() }
      setCurrentUser(user)
      persist(user)
      try {
        if (remember) window.localStorage.setItem(REMEMBER_KEY, email)
        else window.localStorage.removeItem(REMEMBER_KEY)
      } catch {
        /* ignore */
      }
      setRememberedUsername(remember ? email : null)
      logAudit({
        actor: user,
        action: 'login',
        objectType: 'Session',
        objectId: user.id,
        phiFlag: false,
        surface: 'auth',
      })
      return user
    },
    [persist],
  )

  const logout = useCallback((reason: LogoutReason = 'manual') => doLogout(reason), [doLogout])

  const setActiveRole = useCallback(
    (role: ProviderRole) => {
      setCurrentUser((prev) => {
        if (!prev) return prev
        const next = { ...prev, role }
        persist(next)
        logAudit({
          actor: next,
          action: 'demo_role_switched',
          objectType: 'Session',
          objectId: next.id,
          phiFlag: false,
          surface: 'system',
          metadata: { role },
        })
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
      logAudit({
        actor: next,
        action: 'mfa_toggled',
        objectType: 'User',
        objectId: next.id,
        phiFlag: false,
        surface: 'auth',
        metadata: { enabled: next.mfaEnabled },
      })
      return next
    })
  }, [persist])

  const value = useMemo<AuthContextValue>(
    () => ({
      currentUser,
      loading,
      rememberedUsername,
      sessionWarning,
      login,
      logout,
      extendSession,
      setActiveRole,
      toggleMfa,
    }),
    [currentUser, loading, rememberedUsername, sessionWarning, login, logout, extendSession, setActiveRole, toggleMfa],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}
