'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Logo } from '@/components/ui/Logo'
import { IconEye, IconEyeOff, IconLock, IconShield, IconCheck } from '@/components/ui/icons'
import { useAuth } from '@/lib/auth'
import { canAccessAllTenants } from '@/lib/api'

export function FAHCLoginPage() {
  const router = useRouter()
  const { login, currentUser, loading, rememberedUsername } = useAuth()

  const [email, setEmail] = useState('admin')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Prefill remembered username; bounce to dashboard if already signed in.
  useEffect(() => {
    if (rememberedUsername) {
      setEmail(rememberedUsername)
      setRemember(true)
    }
  }, [rememberedUsername])

  useEffect(() => {
    if (!loading && currentUser) {
      router.replace(canAccessAllTenants(currentUser) ? '/admin/provider-portal' : '/provider/dashboard')
    }
  }, [loading, currentUser, router])

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    const user = login(email, password, remember)
    if (!user) {
      setError('Use a valid demo username and password to continue.')
      return
    }
    router.replace(canAccessAllTenants(user) ? '/admin/provider-portal' : '/provider/dashboard')
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Brand / welcome panel */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-brand-darkBlue p-12 text-white lg:flex">
        <div
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            background:
              'radial-gradient(60% 50% at 80% 10%, rgba(250,208,110,0.25), transparent), radial-gradient(50% 60% at 10% 90%, rgba(199,220,235,0.25), transparent)',
          }}
          aria-hidden="true"
        />
        <Logo tone="white" className="h-14" />
        <div className="relative max-w-md">
          <h2 className="font-heading text-3xl font-semibold leading-snug text-white">
            Find your place. A welcoming partner experience built on trust and privacy.
          </h2>
          <p className="mt-4 text-white/70">
            Manage your referrals, update your agency profile, and submit revenue — all in one
            secure, HIPAA-conscious portal built for Find A Home Care partner agencies.
          </p>
          <ul className="mt-8 space-y-3 text-sm text-white/80">
            {[
              'Tenant-isolated — you only ever see your agency&rsquo;s data',
              'PHI minimized & every access logged to an audit trail',
              'WCAG 2.1 AA accessible across desktop, tablet & mobile',
            ].map((item) => (
              <li key={item} className="flex items-start gap-2">
                <IconCheck className="mt-0.5 h-4 w-4 shrink-0 text-brand-gold" />
                <span dangerouslySetInnerHTML={{ __html: item }} />
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-xs text-white/50">
          © 2026 Find A Home Care
        </p>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center bg-brand-cream px-6 py-12">
        <div className="w-full max-w-md">
          <div className="mb-8 flex justify-center lg:hidden">
            <Logo className="h-12" />
          </div>

          <div className="fahc-surface p-8">
            <div className="mb-6">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-paleBlue px-3 py-1 text-xs font-semibold text-brand-primary">
                <IconLock className="h-3.5 w-3.5" /> Partner Login
              </span>
              <h1 className="mt-3 font-heading text-2xl font-semibold text-brand-primary">
                Welcome back
              </h1>
              <p className="mt-1 text-sm text-brand-charcoal/70">
                Sign in to your Find A Home Care provider portal.
              </p>
            </div>

            {error && (
              <div
                role="alert"
                className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700"
              >
                {error}
              </div>
            )}

            <form onSubmit={onSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="fahc-label">
                  Username
                </label>
                <input
                  id="email"
                  type="text"
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin"
                  className="fahc-input"
                />
              </div>

              <div>
                <label htmlFor="password" className="fahc-label">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="fahc-input pr-11"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-brand-charcoal/50 hover:bg-brand-paleBlue"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <IconEyeOff className="h-5 w-5" /> : <IconEye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm text-brand-charcoal">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="rounded border-brand-softBlue text-brand-primary focus:ring-brand-primary"
                  />
                  Remember username
                </label>
                <Link href="/provider/forgot-password" className="fahc-link text-sm">
                  Forgot password?
                </Link>
              </div>

              <button type="submit" className="fahc-btn-gold w-full">
                Log In
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-brand-charcoal/70">
              Don&rsquo;t have an account?{' '}
              <span className="font-semibold text-brand-primary">Contact your FindAHomeCare admin</span>
            </p>
          </div>

          <p className="mt-4 flex items-center justify-center gap-1.5 text-center text-xs text-brand-charcoal/60">
            <IconShield className="h-3.5 w-3.5 text-brand-primary" />
            Prototype · mock authentication.
          </p>
        </div>
      </div>
    </div>
  )
}
