'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Logo } from '@/components/ui/Logo'
import { IconMail, IconCheckCircle, IconChevronRight } from '@/components/ui/icons'

export default function ForgotPasswordRoute() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    // Mock: pretend to dispatch an email-verification + reset flow.
    setSent(true)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-cream px-6 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <Logo className="h-12" />
        </div>

        <div className="fahc-surface p-8">
          {sent ? (
            <div className="text-center">
              <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-emerald-100 text-emerald-600">
                <IconCheckCircle className="h-7 w-7" />
              </span>
              <h1 className="mt-4 font-heading text-2xl font-semibold text-brand-primary">
                Check your email
              </h1>
              <p className="mt-2 text-sm text-brand-charcoal/70">
                If an account exists for <span className="font-semibold">{email}</span>, we&rsquo;ve
                sent a verification link with instructions to reset your password.
              </p>
              <Link href="/provider/login" className="fahc-btn-primary mt-6 w-full">
                Back to login
              </Link>
            </div>
          ) : (
            <>
              <h1 className="font-heading text-2xl font-semibold text-brand-primary">
                Reset your password
              </h1>
              <p className="mt-1 text-sm text-brand-charcoal/70">
                Enter the email associated with your account and we&rsquo;ll send you a secure reset
                link.
              </p>

              <form onSubmit={onSubmit} className="mt-6 space-y-4">
                <div>
                  <label htmlFor="reset-email" className="fahc-label">
                    Email address
                  </label>
                  <div className="relative">
                    <IconMail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-charcoal/40" />
                    <input
                      id="reset-email"
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@youragency.com"
                      className="fahc-input pl-9"
                    />
                  </div>
                </div>
                <button type="submit" className="fahc-btn-gold w-full">
                  Send reset link
                </button>
              </form>

              <Link
                href="/provider/login"
                className="mt-6 inline-flex items-center gap-1 text-sm fahc-link"
              >
                <IconChevronRight className="h-4 w-4 rotate-180" />
                Back to login
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
